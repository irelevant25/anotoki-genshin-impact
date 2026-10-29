<?php

declare(strict_types=1);

/**
 * users/066 - genshin's site settings into the anotoki library's tables (anotoki-lib 0.11.0) - on a database built
 * the way every test builds one (the site's engine: the library's admin set whole, users/ to 065, the content half),
 * in a database whose time zone is not UTC (as a server's own often is not), with genshin's switches and pages in it
 * as an owner leaves them, then brought up to date as Apply does:
 *
 *   - every switch comes across as the library reads it: on and off as genshin read them (any case, spaces round
 *     it), the announcement's kind, the messages per language - an empty one, an array's, a blank one as no message;
 *     with when each changed (the same moment, written in the server's zone) and by whom, a switch nobody threw
 *     with neither;
 *   - every page with its visibility, its switch, its place, its time, its writer and its API paths in one list,
 *     sorted as the library sorts them; the library's SiteSettings reads them back as genshin's gates did;
 *   - the three old tables are gone, and the fifteen words nothing asks for any more, every string under them -
 *     the menu's mark (route.hiddenBadge) stays;
 *   - its gate refuses, naming what and keeping nothing: a row of another site, a switch the library has no place
 *     for, the library's tables already holding rows, a switch or a page that did not come through, a word left.
 */

use Anotoki\Lib\Migrations\Splitter;
use Anotoki\Lib\SiteSettings\SiteSettings;

require __DIR__ . '/lib.php';
require __DIR__ . '/db_lib.php';
require TEST_BACKEND . '/vendor/autoload.php';
require TEST_BACKEND . '/api/migration_runner.php';

testNeedsDatabase();

const FILE_066 = '066_site_settings_into_the_library.sql';

/** The fifteen keys 066 deletes. */
const KEYS_066 = [
    'legal.storage.announcement.kept',
    'legal.storage.announcement.purpose',
    'route.audience.ADMIN',
    'route.audience.EDITOR',
    'route.audience.PUBLIC',
    'route.audience.USER',
    'route.blockedText',
    'route.blockedTitle',
    'route.restrictedText',
    'route.restrictedTitle',
    'site.announcement.hide',
    'site.maintenance.signIn',
    'site.maintenance.staffLead',
    'site.maintenance.text',
    'site.maintenance.title',
];

/** A database up to users/065 (the admin set whole, the content half whole), its zone Europe/Bratislava. */
function upTo065(string $label): PDO
{
    $name = testDatabase($label);
    testPdo('postgres')->exec('ALTER DATABASE "' . $name . '" SET timezone TO \'Europe/Bratislava\'');
    $pdo = testPdo($name);
    $built = testMigrate($pdo, ['anotoki_admin' => '999', 'users' => '065_profile_redesign_strings.sql']);
    check("$label: built up to users/065 by the site's engine", $built['error'] === null, (string) $built['error']);
    $pdo->exec("INSERT INTO users (id, username) VALUES (7, 'Owner'), (8, 'Editor')");

    return $pdo;
}

/** What the library's tables hold, as text: the switches by name, the pages by path. */
function libraryRows(PDO $pdo): array
{
    $switches = [];
    foreach (
        $pdo
            ->query("SELECT name, value::text AS value, to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS') AS updated_at, updated_by FROM anotoki_site_settings ORDER BY name")
            ->fetchAll(PDO::FETCH_ASSOC)
        as $row
    ) {
        $switches[$row['name']] = [$row['value'], $row['updated_at'], $row['updated_by'] === null ? null : (int) $row['updated_by']];
    }
    $pages = [];
    foreach (
        $pdo
            ->query(
                "SELECT path, visibility, blocked, array_to_json(api_paths)::text AS api_paths, sort_order, to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS') AS updated_at, updated_by FROM anotoki_page_access ORDER BY path",
            )
            ->fetchAll(PDO::FETCH_ASSOC)
        as $row
    ) {
        $pages[$row['path']] = [
            $row['visibility'],
            $row['blocked'] === true,
            json_decode((string) $row['api_paths'], true),
            (int) $row['sort_order'],
            $row['updated_at'],
            $row['updated_by'] === null ? null : (int) $row['updated_by'],
        ];
    }

    return ['switches' => $switches, 'pages' => $pages];
}

// ── A database as an owner leaves it ────────────────────────────────────────

echo "users/066 on a database with genshin's switches and pages, in a zone of its own\n";

$pdo = upTo065('site_settings');
same(
    'what waits: users/066 first, the content half run, the library\'s words after',
    'users/' . FILE_066,
    (siteMigrator($pdo)->applicable()[0]['set'] ?? '') . '/' . (siteMigrator($pdo)->applicable()[0]['name'] ?? ''),
);
same(
    'the seeded switches (034, less 035\'s and 040\'s) and pages (035): five and 27',
    [5, 27, 0],
    [
        (int) $pdo->query("SELECT count(*) FROM site_settings WHERE site = 'genshin_impact'")->fetchColumn(),
        (int) $pdo->query("SELECT count(*) FROM site_routes WHERE site = 'genshin_impact'")->fetchColumn(),
        (int) $pdo->query('SELECT count(*) FROM site_route_endpoints')->fetchColumn(),
    ],
);

// The switches as the owner left them: closed, a message per language (and a language left empty), the
// announcement on in an odd spelling, its kind a warning, its message an array (what an emptied form could send) -
// each changed by somebody at a moment of the server's zone (winter: an hour ahead of UTC; summer: two). The
// maintenance message nobody touched since 034.
$pdo->exec("UPDATE site_settings SET value = 'true', updated_at = '2026-01-15 10:00:00', updated_by = 7 WHERE name = 'maintenance_mode'");
$pdo->exec("UPDATE site_settings SET value = ' TRUE ', updated_at = '2026-07-15 10:00:00', updated_by = 8 WHERE name = 'announcement_enabled'");
$pdo->exec("UPDATE site_settings SET value = 'warning', updated_at = '2026-07-15 10:00:01', updated_by = 8 WHERE name = 'announcement_level'");
$pdo->exec("UPDATE site_settings SET value = '[]', updated_at = '2026-07-15 10:00:02', updated_by = NULL WHERE name = 'announcement_message'");
$seededMessage = (string) $pdo->query("SELECT value FROM site_settings WHERE name = 'maintenance_message'")->fetchColumn();

// The pages: one switched off, one for people signed in that refuses two API paths (given in the wrong order),
// one for editors refusing one, and a page somebody added - administrators only, refusing /api/catalog.
$pdo->exec("UPDATE site_routes SET blocked = TRUE, updated_at = '2026-02-01 08:30:00', updated_by = 7 WHERE path = '/quizzes/music'");
$pdo->exec("UPDATE site_routes SET visibility = 'USER', updated_at = '2026-08-01 08:30:00', updated_by = 7 WHERE path = '/profile'");
$pdo->exec("UPDATE site_routes SET visibility = 'EDITOR' WHERE path = '/games/tournament'");
$profile = (int) $pdo->query("SELECT id FROM site_routes WHERE path = '/profile'")->fetchColumn();
$tournament = (int) $pdo->query("SELECT id FROM site_routes WHERE path = '/games/tournament'")->fetchColumn();
$pdo->exec("INSERT INTO site_route_endpoints (route_id, prefix) VALUES ($profile, '/api/quiz/stats'), ($profile, '/api/quiz/progress'), ($tournament, '/api/quiz/levels')");
$secret = (int) $pdo
    ->query(
        "INSERT INTO site_routes (site, path, visibility, blocked, sort_order, updated_at, updated_by) VALUES ('genshin_impact', '/games/secret', 'ADMIN', FALSE, 70, '2026-10-01 12:00:00', 8) RETURNING id",
    )
    ->fetchColumn();
$pdo->exec("INSERT INTO site_route_endpoints (route_id, prefix) VALUES ($secret, '/api/catalog')");

$applied = siteMigrator($pdo)->apply();
check(
    'users/066 applied by the site\'s engine, its gates content',
    $applied['error'] === null && in_array('users/' . FILE_066, array_map(static fn(array $file): string => $file['set'] . '/' . $file['name'], $applied['applied']), true),
    (string) $applied['error'],
);

$library = libraryRows($pdo);
same(
    'the switches: closed (true), the announcement on (" TRUE " read as genshin read it), a warning, no message (the array), the seeded message as it was - each moment the same moment, written in the server\'s zone (an hour ahead of UTC in winter, two in summer)',
    [
        'announcement_enabled' => ['true', '2026-07-15 08:00:00', 8],
        'announcement_level' => ['"warning"', '2026-07-15 08:00:01', 8],
        'announcement_message' => ['{}', '2026-07-15 08:00:02', null],
        'maintenance_message' => [(string) $pdo->query('SELECT CAST(' . $pdo->quote($seededMessage) . ' AS jsonb)::text')->fetchColumn(), null, null],
        'maintenance_mode' => ['true', '2026-01-15 09:00:00', 7],
    ],
    $library['switches'],
);
same('every page came across: 27 seeded and the one added - and the eight new pages of users/071 and 072 beside them', 36, count($library['pages']));
same('/quizzes/music: switched off, by the owner, its time', ['PUBLIC', true, [], 34, '2026-02-01 07:30:00', 7], $library['pages']['/quizzes/music'] ?? null);
same(
    '/profile: for people signed in, its two API paths in one list, sorted byte by byte - at 70, where users/071 moves it from 60 (its time and writer kept)',
    ['USER', false, ['/api/quiz/progress', '/api/quiz/stats'], 70, '2026-08-01 06:30:00', 7],
    $library['pages']['/profile'] ?? null,
);
same(
    '/games/tournament: editors and administrators, one API path, nobody\'s time (never changed through the page)',
    ['EDITOR', false, ['/api/quiz/levels'], 41, null, null],
    $library['pages']['/games/tournament'] ?? null,
);
same('/games/secret: the page somebody added, as it was', ['ADMIN', false, ['/api/catalog'], 70, '2026-10-01 10:00:00', 8], $library['pages']['/games/secret'] ?? null);
same('/database/characters/:id: as 035 seeded it', ['PUBLIC', false, [], 53, null, null], $library['pages']['/database/characters/:id'] ?? null);

same(
    'genshin\'s three tables are gone',
    [null, null, null],
    [
        $pdo->query("SELECT to_regclass('site_settings')")->fetchColumn(),
        $pdo->query("SELECT to_regclass('site_routes')")->fetchColumn(),
        $pdo->query("SELECT to_regclass('site_route_endpoints')")->fetchColumn(),
    ],
);
$in = implode(', ', array_map(static fn(string $key): string => $pdo->quote($key), KEYS_066));
same(
    'the fifteen words nothing asks for are gone, every string under them',
    [0, 0],
    [(int) $pdo->query("SELECT count(*) FROM translation_keys WHERE name IN ($in)")->fetchColumn(), (int) $pdo->query("SELECT count(*) FROM translations WHERE key_name IN ($in)")->fetchColumn()],
);
same(
    '...the menu\'s mark stays, in English and Slovak',
    2,
    (int) $pdo->query("SELECT count(*) FROM translations WHERE key_name = 'route.hiddenBadge' AND language_code IN ('en', 'sk')")->fetchColumn(),
);

// ── The library reads them as genshin's gates did ───────────────────────────

echo "The library reads them back\n";

$settings = new SiteSettings(static fn(): PDO => $pdo, SiteSettings::PARTS, ['/api/me', '/api/settings/public']);
same('closed for maintenance, with the seeded message in English and Slovak', ['en', 'sk'], array_keys($settings->maintenance() ?? ['none' => '']));
same('no announcement: on, but its message is empty', null, $settings->announcement());
same('/quizzes/music is switched off', true, $settings->pageFor('/quizzes/music')['blocked'] ?? null);
same('/database/characters/12 is governed by its :id row', '/database/characters/:id', $settings->pageFor('/database/characters/12')['path'] ?? null);
check('the API paths /profile refuses are refused to nobody: /api/quiz/stats', $settings->refusesApi('/api/quiz/stats', null));
check('...and not where another page claims nothing: /api/quizzes', !$settings->refusesApi('/api/quizzes', null));
same('/games/secret refuses /api/catalog/characters to nobody', true, $settings->refusesApi('/api/catalog/characters', null));

// ── Its gate ────────────────────────────────────────────────────────────────

echo "Its gate, on a database up to 065 again\n";

$gated = upTo065('site_settings_gate');
$statements = Splitter::split((string) file_get_contents(TEST_BACKEND . '/migrations/users/' . FILE_066));
check('the file\'s statements: the gate, the switches, the pages, the proof, three drops, the words, the last proof', count($statements) === 9, (string) count($statements));

/**
 * 066's statements in a transaction, rolled back: $before run first, the statement starting $skip left out,
 * $change made just before the statement that starts with $at. What the gates say.
 */
$run066 = static function (string $before = '', string $skip = '', string $change = '', string $at = 'DO $$') use ($gated, $statements): string {
    $gated->beginTransaction();
    try {
        if ($before !== '') {
            $gated->exec($before);
        }
        $seen = 0;
        foreach ($statements as $statement) {
            if ($skip !== '' && str_starts_with($statement, $skip)) {
                continue;
            }
            if ($change !== '' && str_starts_with($statement, $at) && ++$seen === ($at === 'DO $$' ? 2 : 1)) {
                $gated->exec($change);
            }
            $gated->exec($statement);
        }
        $gated->rollBack();

        return 'no complaint';
    } catch (PDOException $e) {
        $gated->rollBack();

        return $e->getMessage();
    }
};
$untouched = static fn(): array => [
    (int) $gated->query('SELECT count(*) FROM site_settings')->fetchColumn(),
    (int) $gated->query('SELECT count(*) FROM site_routes')->fetchColumn(),
    (int) $gated->query('SELECT count(*) FROM anotoki_site_settings')->fetchColumn(),
    (int) $gated->query('SELECT count(*) FROM anotoki_page_access')->fetchColumn(),
];

same('as it is: content', 'no complaint', $run066());
$said = $run066("INSERT INTO site_settings (site, name, type, value) VALUES ('star_rail', 'maintenance_mode', 'boolean', 'true')");
check('a switch of another site: refused, naming it', str_contains($said, 'users/066: switches the library has no place for') && str_contains($said, 'star_rail/maintenance_mode'), $said);
$said = $run066("INSERT INTO site_settings (site, name, type, value) VALUES ('genshin_impact', 'dark_mode', 'boolean', 'true')");
check('a switch the library has no place for: refused, naming it', str_contains($said, 'genshin_impact/dark_mode'), $said);
$said = $run066("INSERT INTO site_routes (site, path, visibility) VALUES ('star_rail', '/warp', 'PUBLIC')");
check('a page of another site: refused, naming it', str_contains($said, 'users/066: pages of another site') && str_contains($said, 'star_rail /warp'), $said);
$said = $run066("INSERT INTO anotoki_site_settings (name, value) VALUES ('maintenance_mode', 'false')");
check('the library\'s tables holding rows already: refused', str_contains($said, 'users/066: the library\'s site settings already hold rows'), $said);
$said = $run066('', 'INSERT INTO anotoki_page_access');
check('the pages not copied: refused, naming every one', str_contains($said, 'users/066: pages that did not come through as they were: /, /daily'), $said);
$said = $run066('', '', "UPDATE anotoki_site_settings SET value = 'true' WHERE name = 'announcement_enabled'");
check('a switch changed on its way: refused, naming it', str_contains($said, 'users/066: switches that did not come through as they were: announcement_enabled'), $said);
$said = $run066('', '', "UPDATE anotoki_page_access SET api_paths = '{/api/quiz}' WHERE path = '/daily'");
check('a page\'s API paths changed on its way: refused, naming it', str_contains($said, 'users/066: pages that did not come through as they were: /daily'), $said);
$said = $run066('', '', "INSERT INTO anotoki_page_access (path, visibility) VALUES ('/extra', 'PUBLIC')");
check('a page more than genshin had: refused, counting them', str_contains($said, 'users/066: the library\'s table holds 28 pages, where genshin\'s held 27'), $said);
$said = $run066('', 'DELETE FROM translation_keys');
check('the words left behind: refused, naming them', str_contains($said, 'users/066: the old closed sign\'s, bar\'s and notice\'s strings are still here: legal.storage.announcement.kept'), $said);
$said = $run066('', '', "DELETE FROM translation_keys WHERE name = 'route.hiddenBadge'", 'DELETE FROM translation_keys');
check('the menu\'s mark taken too: refused', str_contains($said, 'users/066: route.hiddenBadge, which the public menu still reads, is gone'), $said);
same('...and nothing of any of them was kept: genshin\'s tables whole, the library\'s empty', [5, 27, 0, 0], $untouched());
