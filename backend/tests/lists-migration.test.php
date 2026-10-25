<?php

declare(strict_types=1);

/**
 * genshin_impact/032 - the lists the character form saved in one layer of JSON too many, from 2026-09-01 to
 * 2026-10-25, unwrapped - on a database built the way every test builds one (the site's engine, up to 031), with
 * good rows and bad in every list column, then brought up to date as Apply does:
 *
 *   - a list wrapped once, twice and three times (as PostgreSQL writes JSONB, the text the form took), an empty one
 *     wrapped, one whose items are no strings, in every list column and in a deleted row: each comes back as it was
 *     before the first save;
 *   - what is not certainly wrapped stays as it is: NULL, [], a plain list, a list of several items one of them a
 *     JSON array's text, a one-item list whose item is no JSON ("[Wish"), JSON PostgreSQL will not take ("\u0000"),
 *     or JSON of anything but an array (an object, a string, a number, null), a lone JSONB string holding a list's
 *     text, an object;
 *   - only the rows it unwraps are written: updated_at moves on them alone;
 *   - its statements run again find nothing to do, and its gate is content;
 *   - its gate notices a list left wrapped (the characters' statement skipped) and a list changed otherwise, and
 *     nothing of either is kept.
 */

use Anotoki\Lib\Migrations\Splitter;

require __DIR__ . '/lib.php';
require __DIR__ . '/db_lib.php';
require TEST_BACKEND . '/vendor/autoload.php';
require TEST_BACKEND . '/api/migration_runner.php';

testNeedsDatabase();

/** Every list column, by table: what 032 goes through. */
const LIST_COLUMNS = [
    'characters' => ['affiliations', 'how_to_obtain', 'namecard_sources'],
    'weapons' => ['how_to_obtain', 'effects'],
    'foods' => ['events', 'how_to_obtain', 'effects'],
    'materials' => ['how_to_obtain'],
    'artifacts' => ['how_to_obtain_quality_1', 'how_to_obtain_quality_2', 'how_to_obtain_quality_3', 'how_to_obtain_quality_4', 'how_to_obtain_quality_5', 'effects'],
];

/**
 * What the character form sent for a list it had not touched, $times over: the column's text - as PostgreSQL writes
 * JSONB, which is what the API handed the form - as the list's one item.
 */
function wrapped(PDO $pdo, string $json, int $times): string
{
    for ($round = 0; $round < $times; $round++) {
        $statement = $pdo->prepare('SELECT CAST(? AS jsonb)::text');
        $statement->execute([$json]);
        $json = (string) json_encode([(string) $statement->fetchColumn()], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    return $json;
}

/** A row of $table with what it must have, and $lists (JSON text, or null, a column) in it; its id. */
function listRow(PDO $pdo, string $table, string $name, array $lists, bool $deleted = false): int
{
    $required = [
        'characters' => [
            'element' => 'Anemo',
            'weapon_type' => 'Sword',
            'rarity' => 4,
            'model' => 'Medium Female',
            'namecard_description' => 'x',
            'version' => '1.0',
            'voice_actor_english' => 'x',
            'voice_actor_japanese' => 'x',
            'voice_actor_korean' => 'x',
            'voice_actor_chinese' => 'x',
        ],
        'weapons' => ['type' => 'Sword', 'rarity' => 4],
        'foods' => [],
        'materials' => [],
        'artifacts' => [],
    ][$table];
    $values = ['name' => $name] + $required + ['created_by' => 1, 'deleted' => $deleted ? 'true' : 'false'];
    $places = array_fill(0, count($values), '?');
    foreach ($lists as $column => $json) {
        $values[$column] = $json;
        $places[] = 'CAST(? AS jsonb)';
    }
    $statement = $pdo->prepare("INSERT INTO $table (" . implode(', ', array_keys($values)) . ') VALUES (' . implode(', ', $places) . ') RETURNING id');
    $statement->execute(array_values($values));

    return (int) $statement->fetchColumn();
}

/** Every list column of every row, and its updated_at: what a run may or may not change. */
function listsNow(PDO $pdo): array
{
    $now = [];
    foreach (LIST_COLUMNS as $table => $columns) {
        $read = implode(', ', array_map(static fn(string $column): string => "$column::text AS $column", $columns));
        foreach ($pdo->query("SELECT id, updated_at, $read FROM $table ORDER BY id")->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $now["$table #{$row['id']}"] = $row;
        }
    }

    return $now;
}

$pdo = testPdo(testDatabase('lists'));
$upTo031 = testMigrate($pdo, ['anotoki_admin' => '999', 'genshin_impact' => '031_game_ids_filled.sql']);
check('a database built up to 031', $upTo031['error'] === null, (string) $upTo031['error']);

// ── The rows ────────────────────────────────────────────────────────────────

echo "032 on a database with lists, wrapped and not, in every list column\n";

$affiliations = '["Wangsheng Funeral Parlor", "Hu Family"]';
// characters.affiliations: each case a row of its own - what it holds, and what it must hold after.
$cases = [
    'a plain list' => [$affiliations, $affiliations],
    'NULL' => [null, null],
    'an empty list' => ['[]', '[]'],
    'a list wrapped once' => [wrapped($pdo, $affiliations, 1), $affiliations],
    'a list wrapped twice' => [wrapped($pdo, $affiliations, 2), $affiliations],
    'a list wrapped three times' => [wrapped($pdo, $affiliations, 3), $affiliations],
    'an empty list wrapped' => [wrapped($pdo, '[]', 1), '[]'],
    'an empty list wrapped twice' => [wrapped($pdo, '[]', 2), '[]'],
    'a list of numbers wrapped' => [wrapped($pdo, '[1, 2]', 1), '[1, 2]'],
    'several items, one a list\'s text' => ['["[\"Wish\"]", "Event"]', '["[\"Wish\"]", "Event"]'],
    'one item that is no JSON' => ['["[Wish"]', '["[Wish"]'],
    'one item PostgreSQL will not take as JSON' => [json_encode(['["\u0000"]']), json_encode(['["\u0000"]'])],
    'one item, an object\'s text' => [json_encode(['{"a": "Wish"}']), json_encode(['{"a": "Wish"}'])],
    'one item, a string\'s text' => [json_encode(['"Wish"']), json_encode(['"Wish"'])],
    'one item, a number\'s text' => ['["5"]', '["5"]'],
    'one item, null\'s text' => ['["null"]', '["null"]'],
    'a lone string holding a list\'s text' => [json_encode('["Wish"]'), json_encode('["Wish"]')],
    'an object' => ['{"1": "Wish"}', '{"1": "Wish"}'],
];
$caseRows = [];
foreach ($cases as $case => [$stored, $after]) {
    $caseRows[$case] = [listRow($pdo, 'characters', "Case: $case", ['affiliations' => $stored]), $after];
}
$deletedWrapped = listRow($pdo, 'characters', 'A deleted one', ['affiliations' => wrapped($pdo, $affiliations, 2)], true);

// Every other table: a row with each of its lists wrapped twice, and one with each plain.
$wrappedRows = [];
$plainRows = [];
foreach (LIST_COLUMNS as $table => $columns) {
    $lists = [];
    foreach ($columns as $column) {
        $lists[$column] = "[\"$table $column\", \"and a second\"]";
    }
    $wrappedRows[$table] = [listRow($pdo, $table, "$table wrapped", array_map(static fn(string $json): string => wrapped($pdo, $json, 2), $lists)), $lists];
    $plainRows[$table] = [listRow($pdo, $table, "$table plain", $lists), $lists];
}
$before = listsNow($pdo);

// ── Applied ─────────────────────────────────────────────────────────────────

$applied = siteMigrator($pdo)->apply();
check(
    '032 applied by the site\'s engine, its gate content',
    $applied['error'] === null && in_array('genshin_impact/032_lists_unwrapped.sql', array_map(static fn(array $file): string => $file['set'] . '/' . $file['name'], $applied['applied']), true),
    (string) $applied['error'],
);

/** Whether $column of $table's row $id holds $json (JSONB's equality; null for NULL). */
$holds = static function (string $table, string $column, int $id, ?string $json) use ($pdo): bool {
    $statement = $pdo->prepare("SELECT $column IS NOT DISTINCT FROM CAST(? AS jsonb) FROM $table WHERE id = ?");
    $statement->execute([$json, $id]);

    return $statement->fetchColumn() === true;
};
$updated = static function (string $table, int $id) use ($pdo): bool {
    return $pdo->query("SELECT updated_at IS NOT NULL FROM $table WHERE id = $id")->fetchColumn() === true;
};

foreach ($caseRows as $case => [$id, $after]) {
    $unwrapped = $cases[$case][0] !== $after;
    check(
        "characters.affiliations, $case: " . ($unwrapped ? 'unwrapped' : 'as it was') . ($unwrapped ? ' - its row written' : ' - its row not written'),
        $holds('characters', 'affiliations', $id, $after) && $updated('characters', $id) === $unwrapped,
        (string) $pdo->query("SELECT affiliations::text FROM characters WHERE id = $id")->fetchColumn(),
    );
}
check('a deleted row\'s wrapped list: unwrapped too', $holds('characters', 'affiliations', $deletedWrapped, $affiliations));
foreach (LIST_COLUMNS as $table => $columns) {
    foreach ($columns as $column) {
        check("$table.$column wrapped twice: unwrapped", $holds($table, $column, $wrappedRows[$table][0], $wrappedRows[$table][1][$column]));
        check("$table.$column plain: as it was", $holds($table, $column, $plainRows[$table][0], $plainRows[$table][1][$column]));
    }
    check("$table: the wrapped row written, the plain one not", $updated($table, $wrappedRows[$table][0]) && !$updated($table, $plainRows[$table][0]));
}
$after = listsNow($pdo);
$touched = array_keys(array_filter($after, static fn(array $row, string $key): bool => $row !== $before[$key], ARRAY_FILTER_USE_BOTH));
$wanted = array_merge(
    array_map(static fn(array $row): string => "characters #{$row[0]}", array_filter($caseRows, static fn(array $row, string $case): bool => $cases[$case][0] !== $row[1], ARRAY_FILTER_USE_BOTH)),
    ["characters #$deletedWrapped"],
    array_map(static fn(string $table): string => "$table #{$wrappedRows[$table][0]}", array_keys(LIST_COLUMNS)),
);
sort($touched);
sort($wanted);
same('no other row was written', $wanted, $touched);
same('...and the temporary function went with the file', 0, (int) $pdo->query("SELECT count(*) FROM pg_proc WHERE proname = 'list_unwrapped_032'")->fetchColumn());

// ── Again ───────────────────────────────────────────────────────────────────

echo "Its statements again\n";

$sql = (string) file_get_contents(TEST_BACKEND . '/migrations/genshin_impact/032_lists_unwrapped.sql');
$statements = Splitter::split($sql);
check('the file\'s statements: the function, the snapshot, five tables\' updates, the gate, the drop', count($statements) === 9, (string) count($statements));

/** 032's statements in a transaction: $skip (a statement's start) left out, $change made before the gate; what the gate says. */
$run032 = static function (string $skip = '', string $change = '', bool $keep = false) use ($pdo, $statements): string {
    $pdo->beginTransaction();
    try {
        foreach ($statements as $statement) {
            if ($skip !== '' && str_starts_with($statement, $skip)) {
                continue;
            }
            if ($change !== '' && str_starts_with($statement, 'DO $$')) {
                $pdo->exec($change);
            }
            $pdo->exec($statement);
        }
        $keep ? $pdo->commit() : $pdo->rollBack();

        return 'no complaint';
    } catch (PDOException $e) {
        $pdo->rollBack();

        return $e->getMessage();
    }
};
same('run again: its gate content', 'no complaint', $run032('', '', true));
same('...and nothing written: every list and updated_at as the first run left them', $after, listsNow($pdo));

// ── The gate ────────────────────────────────────────────────────────────────

echo "Its gate\n";

$weaponPlain = $plainRows['weapons'][0];
$left = $run032(
    'UPDATE characters',
    'INSERT INTO characters (name, element, weapon_type, rarity, model, namecard_description, version, voice_actor_english, voice_actor_japanese, voice_actor_korean, voice_actor_chinese, created_by, affiliations) ' .
        "VALUES ('Wrapped Again', 'Anemo', 'Sword', 4, 'Medium Female', 'x', '1.0', 'x', 'x', 'x', 'x', 1, CAST('[\"[\\\"Wish\\\"]\"]' AS jsonb))",
);
check('a list left wrapped (the characters\' statement skipped): refused, naming it', str_contains($left, '032: lists still wrapped in a layer of JSON: characters.affiliations #'), $left);
$changed = $run032('', "UPDATE weapons SET effects = '[\"Changed\"]' WHERE id = $weaponPlain");
check('a list changed otherwise: refused, naming it', str_contains($changed, "032: lists changed other than by taking the wrapping off: weapons.effects #$weaponPlain"), $changed);
same('...and nothing of either was kept', $after, listsNow($pdo));
same('...no row of the first', 0, (int) $pdo->query("SELECT count(*) FROM characters WHERE name = 'Wrapped Again'")->fetchColumn());
