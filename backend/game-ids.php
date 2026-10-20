<?php

declare(strict_types=1);

/**
 * The game's own ids for this site's characters, weapons and artifact sets
 * (`game_id`, migrations/genshin_impact/030) - a one-off, run on the owner's
 * computer, whose result reaches the host as a migration (the host has no
 * shell).
 *
 *   php game-ids.php                          a dry run: what matched, what did not, the duplicates
 *   php game-ids.php --write-migration        ...and writes migrations/genshin_impact/031_game_ids_filled.sql
 *   php game-ids.php --from=<site address>    this site's rows from that site's public lists
 *                                             (https://genshin.anotoki.eu) rather than this checkout's database
 *   php game-ids.php --cache=<folder>         where the downloaded lists are kept (outside the repository;
 *                                             the system's temporary folder by default)
 *   php game-ids.php --refresh                download the lists again rather than reuse the kept ones
 *   php game-ids.php --write-migration --force    write over a 031 that is there (never one applied anywhere)
 *
 * Why: the owner's other site, the build analyzer (builder.anotoki.eu), reads
 * its game catalog from this site (GET /api/catalog/..., api/catalog.php), and
 * what a player imports there names things by the game's ids. This finds them
 * for the rows there are by name, in the game's own data lists - the public
 * lists the analyzer read its catalog from until now (GAME_IDS_LISTS) - each
 * downloaded once into the cache folder and read from there after: run it as
 * often as you like, the lists are not asked again until --refresh.
 *
 * How a row is matched:
 *
 *   - by name, both sides reduced to a key - lowercase ASCII letters and
 *     digits, markup and entities taken out first (`<unbreak>` turns up in the
 *     game's names) - the build analyzer's own key, so the two sites meet on it;
 *   - the Travelers by name alone - every Aether row, of any element, is
 *     10000005, every Lumine row 10000007 (GAME_IDS_TRAVELERS); the game's
 *     lists give a Traveler per element under ids of their own;
 *   - where the game's list has one name twice - a quest's or a trial's copy, a
 *     weapon's skin - the lowest id is the one a player holds, and wins;
 *   - a name that matches nothing, looked up by hand, in GAME_IDS_BY_HAND: the
 *     id, or why there is none;
 *   - never over an id a row has already: that row keeps its own.
 *
 * The rows are read from this checkout's database (config/database.local.php,
 * through config/db.php, read-only) - or, with --from, from a site's public
 * lists (GET /api/characters/minimal, /api/weapons, /api/artifacts: the rows
 * as the database pages read them), kept in the cache folder beside the game's
 * lists. Either way, 031 matches the rows by name (and element, for a
 * Traveler) - never by a database's row ids - so it applies on any database
 * of this site, the host's included.
 *
 * Not in a release (backend/composer.json's extra["anotoki-deploy"] takes
 * api/, config/, migrations/ and vendor/ alone), like every tool here.
 */

require __DIR__ . '/vendor/autoload.php';
require __DIR__ . '/config/local.php';

use Anotoki\Lib\Support\HttpGet;

/** The game's data lists: `data.items`, an object keyed by the in-game id, each with a `name`. */
const GAME_IDS_LISTS = [
    'characters' => 'https://gi.yatta.moe/api/v2/en/avatar',
    'weapons' => 'https://gi.yatta.moe/api/v2/en/weapon',
    'artifacts' => 'https://gi.yatta.moe/api/v2/en/reliquary',
];

/** This site's lists, as a site's public API answers them: every row, the deleted ones flagged. */
const GAME_IDS_SITE_LISTS = [
    'characters' => '/api/characters/minimal',
    'weapons' => '/api/weapons',
    'artifacts' => '/api/artifacts',
];

/** The game's two Travelers: every row of one carries its id, whatever its element. */
const GAME_IDS_TRAVELERS = ['Aether' => 10000005, 'Lumine' => 10000007];

/**
 * What no name in the game's lists gives, looked up by hand there (2026-10-20):
 * this site's name => [the game's id, or null where there is none; why].
 */
const GAME_IDS_BY_HAND = [
    'characters' => [],
    'weapons' => [
        'Prized Isshin Blade (Awakened)' => [null, 'a quest weapon: no list of the game\'s carries it'],
        'Prized Isshin Blade (Shattered)' => [null, 'a quest weapon: no list of the game\'s carries it'],
        'Sword of Narzissenkreuz (Quest)' => [null, 'the quest\'s copy: the list has one Sword of Narzissenkreuz (11428), which the row of that name takes'],
    ],
    'artifacts' => [
        'Initiate' => [null, 'a set nobody can obtain: no list of the game\'s carries it'],
    ],
];

/** What the lists are asked with: who asks, and why. */
const GAME_IDS_HEADERS = ['Accept: application/json', 'User-Agent: anotoki-genshin game-ids (one-off, run by hand)'];

const GAME_IDS_MIGRATION = __DIR__ . '/migrations/genshin_impact/031_game_ids_filled.sql';

/** What each list is called in a sentence, and where its rows go in 031 (a Traveler's apart). */
const GAME_IDS_NOUNS = ['characters' => 'characters', 'weapons' => 'weapons', 'artifacts' => 'artifact sets'];
const GAME_IDS_ORDER = ['characters' => 0, 'travelers' => 1, 'weapons' => 2, 'artifacts' => 3];

// ── Reading ───────────────────────────────────────────────────────────────────

function gameIdsFail(string $message): never
{
    fwrite(STDERR, $message . "\n");
    exit(1);
}

/** A name as the game writes it, its markup and entities taken out. */
function gameIdsPlainName(string $name): string
{
    return trim(html_entity_decode(strip_tags($name), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
}

/** The key two spellings of one name share: lowercase ASCII letters and digits, as the build analyzer keys them. */
function gameIdsKey(string $name): string
{
    $text = gameIdsPlainName($name);
    if (function_exists('transliterator_transliterate')) {
        $ascii = transliterator_transliterate('Any-Latin; Latin-ASCII', $text);
        $text = is_string($ascii) ? $ascii : $text;
    }

    return preg_replace('/[^a-z0-9]+/', '', strtolower($text)) ?? '';
}

/**
 * A list's JSON: from the cache folder when it is there (and --refresh was not
 * asked), else downloaded once and kept there.
 */
function gameIdsJson(string $url, string $file, bool $refresh): mixed
{
    if ($refresh || !is_file($file)) {
        echo "  downloading $url\n";
        $answer = HttpGet::fetch($url, 60.0, GAME_IDS_HEADERS);
        if ($answer['status'] !== 200 || $answer['body'] === null) {
            gameIdsFail("$url answered " . ($answer['status'] === 0 ? 'nothing' : $answer['status']) . ' - nothing written.');
        }
        if (!is_array(json_decode($answer['body'], true))) {
            gameIdsFail("$url answered something that is no JSON - nothing kept.");
        }
        file_put_contents($file, $answer['body']);
    }

    $json = json_decode((string) file_get_contents($file), true);
    if (!is_array($json)) {
        gameIdsFail("$file holds no JSON: delete it, or run again with --refresh.");
    }

    return $json;
}

/**
 * One of the game's lists by key: the id a name gives - the lowest, where the
 * list has the name more than once - and every id it has. The Travelers'
 * entries are keyed `10000005-anemo` and named "Traveler": no number, so no
 * name of this site's meets them (GAME_IDS_TRAVELERS stands for them).
 *
 * @return array<string, array{name: string, id: int, ids: list<int>}>
 */
function gameIdsIndex(array $json, string $url): array
{
    $items = $json['data']['items'] ?? null;
    if (!is_array($items) || $items === []) {
        gameIdsFail("$url: no data.items in its answer - the list changed its shape.");
    }

    $index = [];
    foreach ($items as $key => $item) {
        $id = (string) $key;
        if (preg_match('/^[1-9]\d{0,9}$/D', $id) !== 1 || (int) $id > 2147483647 || !is_array($item) || !is_string($item['name'] ?? null)) {
            continue;
        }
        $nameKey = gameIdsKey($item['name']);
        if ($nameKey === '') {
            continue;
        }
        $index[$nameKey] ??= ['name' => gameIdsPlainName($item['name']), 'id' => (int) $id, 'ids' => []];
        $index[$nameKey]['ids'][] = (int) $id;
        sort($index[$nameKey]['ids']);
        $index[$nameKey]['id'] = $index[$nameKey]['ids'][0];
    }

    return $index;
}

/** A boolean as PostgreSQL or JSON hands it over. */
function gameIdsBool(mixed $value): bool
{
    return $value === true || $value === 't' || $value === 1 || $value === '1' || $value === 'true';
}

/**
 * A row as this tool reads it, from either source; null for a deleted one.
 *
 * @return ?array{name: string, element: ?string, traveler: bool, game_id: ?int}
 */
function gameIdsRow(array $row, string $list): ?array
{
    if (gameIdsBool($row['deleted'] ?? false) || !is_string($row['name'] ?? null)) {
        return null;
    }
    $id = $row['game_id'] ?? null;

    return [
        'name' => $row['name'],
        'element' => $list === 'characters' && is_string($row['element'] ?? null) ? $row['element'] : null,
        'traveler' => $list === 'characters' && gameIdsBool($row['is_traveler'] ?? false),
        'game_id' => is_int($id) || (is_string($id) && ctype_digit($id)) ? (int) $id : null,
    ];
}

/**
 * This checkout's rows, read-only. A database without `game_id` yet (030
 * waits there) has no id on any row.
 *
 * @return array{source: string, rows: array<string, list<array{name: string, element: ?string, traveler: bool, game_id: ?int}>>}
 */
function gameIdsRowsFromDatabase(): array
{
    require_once __DIR__ . '/config/db.php';

    try {
        $pdo = getDb();
        // One read-only transaction for every query below, rolled back after: nothing here writes.
        $pdo->beginTransaction();
        $pdo->exec('SET TRANSACTION READ ONLY');
    } catch (\Throwable) {
        // Never the driver's sentence: it can name the server and the user.
        gameIdsFail('This checkout\'s database cannot be read (config/database.local.php - setup.php writes it). Or name a site: --from=https://genshin.anotoki.eu');
    }

    $hasColumn = $pdo->prepare("SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = ? AND column_name = 'game_id'");
    $rows = [];
    $withoutColumn = [];
    foreach (['characters' => 'name, element, is_traveler, deleted', 'weapons' => 'name, deleted', 'artifacts' => 'name, deleted'] as $list => $columns) {
        $hasColumn->execute([$list]);
        $idColumn = $hasColumn->fetchColumn() !== false ? 'game_id' : 'NULL AS game_id';
        if ($idColumn !== 'game_id') {
            $withoutColumn[] = $list;
        }
        // Literal tables and columns: nothing here comes from outside.
        $found = $pdo->query("SELECT $columns, $idColumn FROM $list ORDER BY name COLLATE \"C\", id")->fetchAll(PDO::FETCH_ASSOC);
        $rows[$list] = array_values(array_filter(array_map(static fn(array $row): ?array => gameIdsRow($row, $list), $found)));
    }
    $pdo->rollBack();

    $source = 'as this checkout\'s database holds them';
    if ($withoutColumn !== []) {
        $source .= ' (no game_id there yet - genshin_impact/030 waits - so no row has one)';
    }

    return ['source' => $source, 'rows' => $rows];
}

/**
 * A site's rows, from its public lists - what its database pages read - kept
 * in the cache folder like the game's.
 *
 * @return array{source: string, rows: array<string, list<array{name: string, element: ?string, traveler: bool, game_id: ?int}>>}
 */
function gameIdsRowsFromSite(string $origin, string $cache, bool $refresh): array
{
    $label = preg_replace('/[^a-z0-9.\-]+/', '_', (string) preg_replace('#^https?://#', '', $origin));
    $rows = [];
    foreach (GAME_IDS_SITE_LISTS as $list => $path) {
        $json = gameIdsJson($origin . $path, "$cache/site-$label-$list.json", $refresh);
        if (!array_is_list($json)) {
            gameIdsFail("$origin$path answered no list: is that this site?");
        }
        $rows[$list] = array_values(array_filter(array_map(static fn(mixed $row): ?array => is_array($row) ? gameIdsRow($row, $list) : null, $json)));
        usort($rows[$list], static fn(array $a, array $b): int => strcmp($a['name'], $b['name']));
    }

    return ['source' => "as $origin's public lists answered them", 'rows' => $rows];
}

// ── Matching ──────────────────────────────────────────────────────────────────

function gameIdsLabel(array $row): string
{
    return $row['traveler'] ? "{$row['name']} ({$row['element']})" : $row['name'];
}

/**
 * Every row of one list with the id its name gives, and how.
 *
 *   how     'name' | 'traveler' | 'hand' | 'known' (by hand, no id) | 'none' (nothing matched)
 *   id      the id its name gives, or null
 *   fill    whether 031 sets it: an id, none on the row yet, no clash
 *   note    why not, where it is not
 *
 * @return list<array{name: string, element: ?string, traveler: bool, game_id: ?int, how: string, id: ?int, fill: bool, note: ?string}>
 */
function gameIdsMatch(string $list, array $rows, array $index): array
{
    $matched = [];
    foreach ($rows as $row) {
        $id = null;
        $note = null;
        if ($row['traveler']) {
            $id = GAME_IDS_TRAVELERS[$row['name']] ?? null;
            $how = $id === null ? 'none' : 'traveler';
            $note = $id === null ? 'a Traveler not named Aether or Lumine' : null;
        } elseif (array_key_exists($row['name'], GAME_IDS_BY_HAND[$list])) {
            [$id, $why] = GAME_IDS_BY_HAND[$list][$row['name']];
            $how = $id === null ? 'known' : 'hand';
            $note = $why;
        } else {
            $hit = $index[gameIdsKey($row['name'])] ?? null;
            $id = $hit['id'] ?? null;
            $how = $id === null ? 'none' : 'name';
        }

        $fill = $id !== null && $row['game_id'] === null;
        if ($id !== null && $row['game_id'] !== null && $row['game_id'] !== $id) {
            $note = "keeps its own id {$row['game_id']}, where its name gives $id";
        }
        $matched[] = $row + ['how' => $how, 'id' => $id, 'fill' => $fill, 'note' => $note];
    }

    // One live row an id (a Traveler's one an element), as the indexes of 030
    // want it: an id two rows would take, or one a row holds already, is
    // filled into none of them - 031 must apply whole.
    $claims = [];
    foreach ($matched as $at => $row) {
        $slot = static fn(int $id): string => $row['traveler'] ? "$id|{$row['element']}" : (string) $id;
        if ($row['game_id'] !== null) {
            $claims[$slot($row['game_id'])][] = ['at' => $at, 'holds' => true];
        }
        if ($row['fill']) {
            $claims[$slot($row['id'])][] = ['at' => $at, 'holds' => false];
        }
    }
    foreach ($claims as $slot => $claimants) {
        if (count($claimants) < 2) {
            continue;
        }
        $names = implode(', ', array_map(static fn(array $claim): string => gameIdsLabel($matched[$claim['at']]), $claimants));
        foreach ($claimants as $claim) {
            if (!$claim['holds']) {
                $matched[$claim['at']]['fill'] = false;
                $matched[$claim['at']]['note'] = 'id ' . explode('|', (string) $slot)[0] . " is wanted by more than one row ($names)";
            }
        }
    }

    return $matched;
}

// ── The report ────────────────────────────────────────────────────────────────

/** The dry run's words for one list. */
function gameIdsReport(string $list, array $matched, array $index): void
{
    $count = static fn(callable $test): int => count(array_filter($matched, $test));

    echo "\n" . strtoupper(GAME_IDS_NOUNS[$list]) . ': ' . count($matched) . " live rows\n";
    printf(
        "  %d by name, %d Travelers, %d by hand - %d to fill, %d keep an id of their own, %d known without one, %d unmatched\n",
        $count(fn(array $row): bool => $row['how'] === 'name'),
        $count(fn(array $row): bool => $row['how'] === 'traveler'),
        $count(fn(array $row): bool => $row['how'] === 'hand'),
        $count(fn(array $row): bool => $row['fill']),
        $count(fn(array $row): bool => $row['game_id'] !== null),
        $count(fn(array $row): bool => $row['how'] === 'known'),
        $count(fn(array $row): bool => $row['how'] === 'none'),
    );

    echo "  matched:\n";
    foreach ($matched as $row) {
        if ($row['id'] !== null) {
            printf("    %10d  %s%s%s\n", $row['id'], gameIdsLabel($row), $row['how'] === 'name' ? '' : " [{$row['how']}]", $row['fill'] ? '' : '  - not filled: ' . ($row['note'] ?? 'has it already'));
        }
    }

    $known = array_filter($matched, fn(array $row): bool => $row['how'] === 'known');
    echo '  known without an id:' . ($known === [] ? " none\n" : "\n");
    foreach ($known as $row) {
        echo '    ' . gameIdsLabel($row) . " - {$row['note']}\n";
    }

    $none = array_filter($matched, fn(array $row): bool => $row['how'] === 'none');
    echo '  unmatched:' . ($none === [] ? " none\n" : "\n");
    foreach ($none as $row) {
        echo '    ' . gameIdsLabel($row) . ($row['note'] !== null ? " - {$row['note']}" : '') . "\n";
    }

    $twice = array_filter($index, fn(array $entry): bool => count($entry['ids']) > 1);
    echo "  names the game's list has more than once (the lowest id taken):" . ($twice === [] ? " none\n" : "\n");
    foreach ($twice as $entry) {
        echo "    {$entry['name']}: " . implode(', ', $entry['ids']) . "\n";
    }
}

// ── 031 ───────────────────────────────────────────────────────────────────────

function gameIdsSql(?string $value): string
{
    return $value === null ? 'NULL' : "'" . str_replace("'", "''", $value) . "'";
}

/** migrations/genshin_impact/031_game_ids_filled.sql: the ids, set by name, and the gate that proves it. */
function gameIdsMigration(array $matchedByList, string $source): string
{
    $entries = [];
    $counts = ['characters' => 0, 'weapons' => 0, 'artifacts' => 0];
    $notes = [];
    foreach ($matchedByList as $list => $matched) {
        foreach ($matched as $row) {
            if ($row['fill']) {
                $entries[] = ['list' => $row['traveler'] ? 'travelers' : $list, 'name' => $row['name'], 'element' => $row['traveler'] ? $row['element'] : null, 'id' => $row['id']];
                $counts[$list]++;
            } elseif ($row['how'] === 'known' || $row['how'] === 'none') {
                $notes[] = '--   ' . GAME_IDS_NOUNS[$list] . ': ' . gameIdsLabel($row) . ' - ' . ($row['note'] ?? 'no name in the game\'s list meets it');
            }
        }
    }
    if ($entries === []) {
        gameIdsFail('No row to fill: 031 would do nothing, and is not written.');
    }
    // The characters, the Travelers, the weapons, the sets - each by name, byte by byte, then element.
    usort($entries, static fn(array $a, array $b): int => [GAME_IDS_ORDER[$a['list']], $a['name'], (string) $a['element']] <=> [GAME_IDS_ORDER[$b['list']], $b['name'], (string) $b['element']]);
    $values = array_map(
        static fn(array $entry): string => sprintf('    (%s, %s, %s, %d)', gameIdsSql($entry['list']), gameIdsSql($entry['name']), gameIdsSql($entry['element']), $entry['id']),
        $entries,
    );

    return strtr(gameIdsMigrationTemplate(), [
        '{{date}}' => gmdate('Y-m-d'),
        '{{source}}' => $source,
        '{{characters}}' => (string) $counts['characters'],
        '{{weapons}}' => (string) $counts['weapons'],
        '{{artifacts}}' => (string) $counts['artifacts'],
        '{{notes}}' => $notes === [] ? '--   none' : implode("\n", $notes),
        '{{values}}' => implode(",\n", $values),
    ]);
}

/** What 031 is, its {{...}} filled in by gameIdsMigration(). */
function gameIdsMigrationTemplate(): string
{
    return <<<'SQL'
    -----------------------------------------------------------
    -- THE GAME'S OWN IDS, FILLED IN BY NAME
    --
    -- Generated {{date}} by `php game-ids.php --write-migration` (backend/) from
    -- the game's own data lists - the public lists the build analyzer read its
    -- catalog from until now - and this site's rows,
    -- {{source}}.
    -- Not edited by hand: run the tool again, and only while this file is
    -- applied nowhere.
    --
    -- genshin_impact/030 made `game_id`; this fills it where a name tells it:
    -- {{characters}} characters (the Travelers by name and element: every Aether row
    -- 10000005, every Lumine row 10000007), {{weapons}} weapons and {{artifacts}} artifact sets.
    -- Rows are found by name - and element, for a Traveler - never by a
    -- database's row ids, so it applies to the host's database as to this
    -- computer's. A row that has an id keeps it, a deleted row is left alone, and
    -- an id another live row already holds is filled into nobody (030's indexes
    -- allow one live row an id) - so nothing here fails on a database edited
    -- since: what it cannot fill stays as it was, for the admin forms' "Game ID".
    -- What it leaves without an id, and why:
    {{notes}}
    --
    -- From here on the owner's importer sends `game_id` with what it writes, and
    -- the admin forms take one; this file is not run again.
    -----------------------------------------------------------

    -- 1. Every row as it stands, for the gate: gone with this file's transaction.
    CREATE TEMPORARY TABLE game_ids_031_before ON COMMIT DROP AS
        SELECT 'characters'::text AS list, id, game_id FROM characters
        UNION ALL
        SELECT 'weapons', id, game_id FROM weapons
        UNION ALL
        SELECT 'artifacts', id, game_id FROM artifacts;

    -- 2. What the names give: the list (a Traveler's rows apart), the name - and
    --    a Traveler's element - and the game's id.
    CREATE TEMPORARY TABLE game_ids_031 (
        list     TEXT     NOT NULL,
        name     TEXT     NOT NULL,
        element  TEXT,
        game_id  INTEGER  NOT NULL
    ) ON COMMIT DROP;

    INSERT INTO game_ids_031 (list, name, element, game_id) VALUES
    {{values}};

    -- 3. Characters that are not Travelers: by name - one live row of it alone
    --    (a name is unique with the element, not on its own) - where it has no
    --    id yet and no other live row holds this one.
    UPDATE characters AS c
       SET game_id = g.game_id
      FROM game_ids_031 AS g
     WHERE g.list = 'characters'
       AND c.name = g.name
       AND c.deleted = FALSE
       AND c.is_traveler = FALSE
       AND c.game_id IS NULL
       AND (SELECT count(*) FROM characters AS d WHERE d.name = c.name AND d.deleted = FALSE AND d.is_traveler = FALSE) = 1
       AND NOT EXISTS (SELECT 1 FROM characters AS o WHERE o.game_id = g.game_id AND o.deleted = FALSE AND o.is_traveler = FALSE);

    -- 4. The Travelers: by name and element, one id for every row of each.
    UPDATE characters AS c
       SET game_id = g.game_id
      FROM game_ids_031 AS g
     WHERE g.list = 'travelers'
       AND c.name = g.name
       AND c.element = g.element
       AND c.deleted = FALSE
       AND c.is_traveler
       AND c.game_id IS NULL
       AND NOT EXISTS (SELECT 1 FROM characters AS o WHERE o.game_id = g.game_id AND o.element = g.element AND o.deleted = FALSE AND o.is_traveler);

    -- 5. Weapons, by name (unique in the table).
    UPDATE weapons AS w
       SET game_id = g.game_id
      FROM game_ids_031 AS g
     WHERE g.list = 'weapons'
       AND w.name = g.name
       AND w.deleted = FALSE
       AND w.game_id IS NULL
       AND NOT EXISTS (SELECT 1 FROM weapons AS o WHERE o.game_id = g.game_id AND o.deleted = FALSE);

    -- 6. Artifact sets, by name (unique in the table).
    UPDATE artifacts AS a
       SET game_id = g.game_id
      FROM game_ids_031 AS g
     WHERE g.list = 'artifacts'
       AND a.name = g.name
       AND a.deleted = FALSE
       AND a.game_id IS NULL
       AND NOT EXISTS (SELECT 1 FROM artifacts AS o WHERE o.game_id = g.game_id AND o.deleted = FALSE);

    -- 7. Prove it: no id a row had is lost or changed; every id set is the one
    --    the row's name gives; and every live row the list names has its id now,
    --    but one whose id another live row holds.
    DO $$
    DECLARE
        changed TEXT;
        wrong TEXT;
        missed TEXT;
    BEGIN
        SELECT string_agg(b.list || ' #' || b.id, ', ' ORDER BY b.list, b.id) INTO changed
          FROM game_ids_031_before AS b
          LEFT JOIN characters AS c ON b.list = 'characters' AND c.id = b.id
          LEFT JOIN weapons AS w ON b.list = 'weapons' AND w.id = b.id
          LEFT JOIN artifacts AS a ON b.list = 'artifacts' AND a.id = b.id
         WHERE b.game_id IS NOT NULL
           AND b.game_id IS DISTINCT FROM COALESCE(c.game_id, w.game_id, a.game_id);
        IF changed IS NOT NULL THEN
            RAISE EXCEPTION '031: rows that had an id lost or changed it: %', changed;
        END IF;

        SELECT string_agg(set_now.label, ', ' ORDER BY set_now.label COLLATE "C") INTO wrong
          FROM (
                SELECT 'character ' || c.name AS label
                  FROM characters AS c
                  JOIN game_ids_031_before AS b ON b.list = 'characters' AND b.id = c.id AND b.game_id IS NULL
                 WHERE c.game_id IS NOT NULL
                   AND NOT EXISTS (
                           SELECT 1
                             FROM game_ids_031 AS g
                            WHERE g.game_id = c.game_id
                              AND g.name = c.name
                              AND ((g.list = 'characters' AND NOT c.is_traveler) OR (g.list = 'travelers' AND c.is_traveler AND g.element = c.element)))
                UNION ALL
                SELECT 'weapon ' || w.name
                  FROM weapons AS w
                  JOIN game_ids_031_before AS b ON b.list = 'weapons' AND b.id = w.id AND b.game_id IS NULL
                 WHERE w.game_id IS NOT NULL
                   AND NOT EXISTS (SELECT 1 FROM game_ids_031 AS g WHERE g.list = 'weapons' AND g.name = w.name AND g.game_id = w.game_id)
                UNION ALL
                SELECT 'artifact set ' || a.name
                  FROM artifacts AS a
                  JOIN game_ids_031_before AS b ON b.list = 'artifacts' AND b.id = a.id AND b.game_id IS NULL
                 WHERE a.game_id IS NOT NULL
                   AND NOT EXISTS (SELECT 1 FROM game_ids_031 AS g WHERE g.list = 'artifacts' AND g.name = a.name AND g.game_id = a.game_id)
               ) AS set_now;
        IF wrong IS NOT NULL THEN
            RAISE EXCEPTION '031: ids set that their names do not give: %', wrong;
        END IF;

        SELECT string_agg(left_out.label, ', ' ORDER BY left_out.label COLLATE "C") INTO missed
          FROM (
                SELECT 'character ' || c.name AS label
                  FROM game_ids_031 AS g
                  JOIN characters AS c ON c.name = g.name AND c.deleted = FALSE AND c.is_traveler = FALSE
                 WHERE g.list = 'characters'
                   AND c.game_id IS NULL
                   AND (SELECT count(*) FROM characters AS d WHERE d.name = c.name AND d.deleted = FALSE AND d.is_traveler = FALSE) = 1
                   AND NOT EXISTS (SELECT 1 FROM characters AS o WHERE o.game_id = g.game_id AND o.deleted = FALSE AND o.is_traveler = FALSE)
                UNION ALL
                SELECT 'Traveler ' || c.name || ' (' || c.element || ')'
                  FROM game_ids_031 AS g
                  JOIN characters AS c ON c.name = g.name AND c.element = g.element AND c.deleted = FALSE AND c.is_traveler
                 WHERE g.list = 'travelers'
                   AND c.game_id IS NULL
                   AND NOT EXISTS (SELECT 1 FROM characters AS o WHERE o.game_id = g.game_id AND o.element = g.element AND o.deleted = FALSE AND o.is_traveler)
                UNION ALL
                SELECT 'weapon ' || w.name
                  FROM game_ids_031 AS g
                  JOIN weapons AS w ON w.name = g.name AND w.deleted = FALSE
                 WHERE g.list = 'weapons'
                   AND w.game_id IS NULL
                   AND NOT EXISTS (SELECT 1 FROM weapons AS o WHERE o.game_id = g.game_id AND o.deleted = FALSE)
                UNION ALL
                SELECT 'artifact set ' || a.name
                  FROM game_ids_031 AS g
                  JOIN artifacts AS a ON a.name = g.name AND a.deleted = FALSE
                 WHERE g.list = 'artifacts'
                   AND a.game_id IS NULL
                   AND NOT EXISTS (SELECT 1 FROM artifacts AS o WHERE o.game_id = g.game_id AND o.deleted = FALSE)
               ) AS left_out;
        IF missed IS NOT NULL THEN
            RAISE EXCEPTION '031: rows left without the id their name gives: %', missed;
        END IF;
    END $$;

    SQL;
}

// ── The run ───────────────────────────────────────────────────────────────────

if (PHP_SAPI !== 'cli') {
    exit(1);
}

$options = ['write-migration' => false, 'force' => false, 'refresh' => false, 'from' => null, 'cache' => null];
foreach (array_slice($argv, 1) as $argument) {
    if (preg_match('/^--(write-migration|force|refresh)$/D', $argument, $flag) === 1) {
        $options[$flag[1]] = true;
    } elseif (preg_match('/^--(from|cache)=(.+)$/D', $argument, $value) === 1) {
        $options[$value[1]] = $value[2];
    } else {
        gameIdsFail("Not an option: $argument\nphp game-ids.php [--from=<site address>] [--cache=<folder>] [--refresh] [--write-migration [--force]]");
    }
}

// The cache: outside the repository, whatever is asked - the lists are someone else's data.
$cache = rtrim(str_replace('\\', '/', $options['cache'] ?? sys_get_temp_dir() . '/anotoki-game-ids'), '/');
if (!is_dir($cache) && !mkdir($cache, 0777, true) && !is_dir($cache)) {
    gameIdsFail("Cannot make the cache folder $cache");
}
$repository = strtolower(str_replace('\\', '/', (string) realpath(__DIR__ . '/..'))) . '/';
if (str_starts_with(strtolower(str_replace('\\', '/', (string) realpath($cache))) . '/', $repository)) {
    gameIdsFail("The cache folder $cache is inside the repository: keep the lists outside it (--cache=<folder>).");
}

$origin = null;
if ($options['from'] !== null) {
    $origin = localConfigOrigin($options['from']);
    if ($origin === null) {
        gameIdsFail("--from wants a site's address, as https://genshin.anotoki.eu - not {$options['from']}");
    }
}

echo "The game's ids for this site's rows - " . ($options['write-migration'] ? 'writing 031' : 'a dry run, nothing written') . "\n";
echo "  the lists kept in $cache\n";
$site = $origin === null ? gameIdsRowsFromDatabase() : gameIdsRowsFromSite($origin, $cache, $options['refresh']);
if (array_sum(array_map('count', $site['rows'])) === 0) {
    gameIdsFail("No live row among this site's rows, {$site['source']}: nothing to match. (A checkout without the game's content: name the site, --from=https://genshin.anotoki.eu)");
}
echo "  this site's rows, {$site['source']}\n";

$matchedByList = [];
foreach (GAME_IDS_LISTS as $list => $url) {
    $index = gameIdsIndex(gameIdsJson($url, "$cache/yatta-" . basename($url) . '.json', $options['refresh']), $url);
    $matchedByList[$list] = gameIdsMatch($list, $site['rows'][$list], $index);
    gameIdsReport($list, $matchedByList[$list], $index);
}

$relative = str_replace('\\', '/', substr(GAME_IDS_MIGRATION, strlen(__DIR__) + 1));
if (!$options['write-migration']) {
    echo "\nNothing written. --write-migration writes $relative\n";
    exit(0);
}
if (is_file(GAME_IDS_MIGRATION) && !$options['force']) {
    gameIdsFail("\n$relative is there already. A migration applied anywhere is never written again; --force writes over it only while it has been applied nowhere.");
}
$written = gameIdsMigration($matchedByList, $site['source']);
file_put_contents(GAME_IDS_MIGRATION, $written);
printf("\nWrote %s: %d lines, %d bytes.\n", $relative, substr_count($written, "\n"), strlen($written));
