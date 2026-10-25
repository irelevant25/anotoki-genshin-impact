<?php

declare(strict_types=1);

/**
 * The game catalog the build analyzer reads (api/catalog.php,
 * routes/genshin_impact/endpoints/catalog.php) and the ids behind it
 * (genshin_impact/030 and 031), through the whole API (api/index.php) - every
 * gate - run in this process against databases of the test's own, on a
 * backend copy of its own (tests/db_lib.php), with a key pair standing in for
 * the IAM:
 *
 *   - the three answers: bare lists of live rows, exactly the fields the
 *     analyzer was promised and nothing of an editor's, by name byte by byte
 *     then id, a version as the pages read it, the Travelers a row per element;
 *   - the icons: absolute, on the host the request named - https, but http for
 *     a loopback host, a port kept - each part of the path encoded; a host
 *     that is no host refused;
 *   - ETag and 304, W/ and an Apache's -gzip taken off, no-cache;
 *   - read-only, and under the site's switches like any route: an update
 *     waiting, maintenance, sign-in required, a page's lock, a bad token;
 *   - the admin's way in: game_id through the models, a number or nothing;
 *   - 030's indexes and CHECK refuse what they must, and its gate notices
 *     when they are not there;
 *   - 031 on a database with rows: each id by its name (a Traveler's by name
 *     and element), never over an id a row has, never into a deleted row or
 *     one whose id another live row holds - and its gate, which notices a
 *     row missed, an id changed and an id its name does not give.
 */

use Anotoki\Lib\Migrations\Splitter;
use Psr\Http\Message\ResponseInterface;
use Slim\Psr7\Factory\ServerRequestFactory;
use Slim\Psr7\Factory\StreamFactory;

require __DIR__ . '/lib.php';
require __DIR__ . '/db_lib.php';

testNeedsDatabase();

$database = testDatabase('catalog');
$iamDir = testTempDir('iam');
$iam = testIam($iamDir);
$applicationFile = "$iamDir/application.json";
file_put_contents($applicationFile, json_encode(['client_id' => 'genshin', 'name' => 'Genshin', 'login_required' => false]));
$backend = testBackendCopy($database, ['jwks_file' => $iam['jwks'], 'application_file' => $applicationFile]);

define('ANOTOKI_ROUTES_ONLY', true);
require "$backend/api/index.php";

$built = siteMigrator(getDb())->apply();
$applied = array_map(static fn(array $file): string => $file['set'] . '/' . $file['name'], $built['applied']);
check(
    'a database built by every migration, 030 and 031 among them (031 on empty tables: nothing to fill, its gate content)',
    $built['error'] === null && in_array('genshin_impact/030_game_ids.sql', $applied, true) && in_array('genshin_impact/031_game_ids_filled.sql', $applied, true),
    (string) $built['error'],
);

const ADMIN = 1;
const EDITOR = 2;
$tokens = [ADMIN => $iam['token'](ADMIN, ['MEMBER', 'ADMIN']), EDITOR => $iam['token'](EDITOR, ['MEMBER', 'EDITOR'])];

/**
 * One request through the whole app. $url is a path on http://localhost, or a
 * whole address (its host and port what the request names); $as who sends it.
 */
function send(string $method, string $url, ?int $as = null, mixed $json = null, array $headers = []): ResponseInterface
{
    global $app, $tokens;
    $request = (new ServerRequestFactory())->createServerRequest($method, str_starts_with($url, '/') ? 'http://localhost' . $url : $url, ['REMOTE_ADDR' => '127.0.0.1']);
    if ($as !== null) {
        $request = $request->withHeader('Authorization', 'Bearer ' . $tokens[$as]);
    }
    if ($json !== null) {
        $request = $request->withHeader('Content-Type', 'application/json')->withBody((new StreamFactory())->createStream(json_encode($json)));
    }
    foreach ($headers as $name => $value) {
        $request = $request->withHeader($name, $value);
    }

    return $app->handle($request);
}

function body(ResponseInterface $response): mixed
{
    return json_decode((string) $response->getBody(), true);
}

/** The SQLSTATE a statement fails with, or null when it does not. */
function refusedWith(PDO $pdo, string $sql): ?string
{
    try {
        $pdo->exec($sql);

        return null;
    } catch (PDOException $e) {
        return (string) $e->getCode();
    }
}

$pdo = getDb();

// ── Rows ────────────────────────────────────────────────────────────────────

/** A file in the catalogue, under one of its folders. */
function catalogued(string $category, string $name, string $extension): int
{
    global $pdo;
    $statement = $pdo->prepare('INSERT INTO files (category_id, name, extension) SELECT id, ?, ? FROM file_categories WHERE code = ? RETURNING id');
    $statement->execute([$name, $extension, $category]);

    return (int) $statement->fetchColumn();
}

/** A row of $table with what it must have, and $row over it - in the API's database, or $into; its id. */
function made(string $table, array $row, ?PDO $into = null): int
{
    $into ??= $GLOBALS['pdo'];
    $defaults = [
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
        'artifacts' => [],
    ];
    $row = $row + $defaults[$table] + ['created_by' => ADMIN];
    $values = array_map(static fn(mixed $value): mixed => is_bool($value) ? ($value ? 'true' : 'false') : $value, array_values($row));
    $statement = $into->prepare("INSERT INTO $table (" . implode(', ', array_keys($row)) . ') VALUES (' . implode(', ', array_fill(0, count($row), '?')) . ') RETURNING id');
    $statement->execute($values);

    return (int) $statement->fetchColumn();
}

$huTaoIcon = catalogued('character.icon', 'HU_TAO', 'avif');
$aetherIcon = catalogued('character.icon', 'AETHER', 'avif');
// The Geo row first: by name, then by id - never by element.
made('characters', ['name' => 'Aether', 'element' => 'Geo', 'rarity' => 5, 'is_traveler' => true, 'game_id' => 10000005, 'release_date' => '2020-09-28', 'icon_file_id' => $aetherIcon]);
made('characters', ['name' => 'Aether', 'element' => 'Anemo', 'rarity' => 5, 'is_traveler' => true, 'game_id' => 10000005, 'release_date' => '2020-09-28', 'icon_file_id' => $aetherIcon]);
made('characters', ['name' => 'Lumine', 'element' => 'Anemo', 'rarity' => 5, 'is_traveler' => true, 'game_id' => 10000007]);
$huTao = made('characters', [
    'name' => 'Hu Tao',
    'element' => 'Pyro',
    'weapon_type' => 'Polearm',
    'rarity' => 5,
    'region' => 'Liyue',
    'version' => '1.3',
    'release_date' => '2021-03-02',
    'game_id' => 10000046,
    'icon_file_id' => $huTaoIcon,
]);
made('characters', ['name' => 'Nefer', 'element' => 'Dendro', 'weapon_type' => 'Catalyst', 'rarity' => 5, 'region' => 'Nod-Krai', 'version' => 'Luna II', 'game_id' => 10000122]);
made('characters', ['name' => 'Manekin', 'element' => 'Adaptive', 'rarity' => 5, 'version' => 'Luna I', 'game_id' => 10000117]);
made('characters', ['name' => 'Not Yet Numbered', 'version' => 'Beta']);
made('characters', ['name' => 'Albedo', 'element' => 'Geo', 'deleted' => true, 'game_id' => 10000038]);

$homa = made('weapons', [
    'name' => 'Staff of Homa',
    'type' => 'Polearm',
    'rarity' => 5,
    'version' => '1.3',
    'release_date' => '2021-02-23',
    'game_id' => 13501,
    'icon_file_id' => catalogued('weapons', 'STAFF_OF_HOMA', 'avif'),
]);
made('weapons', [
    'name' => "Amos' Bow",
    'type' => 'Bow',
    'rarity' => 5,
    'version' => '1.0',
    'release_date' => '2020-09-28',
    'game_id' => 15502,
    'icon_file_id' => catalogued('weapons', "Amos' Bow", 'avif'),
]);
made('weapons', ['name' => '"The Catch"', 'type' => 'Polearm', 'version' => '2.1', 'game_id' => 13415]);
$nameless = made('weapons', ['name' => 'Nameless Sword']);
made('weapons', ['name' => 'Deleted Blade', 'deleted' => true, 'game_id' => 11999]);

$witch = made('artifacts', [
    'name' => 'Crimson Witch of Flames',
    'two_piece' => 'Pyro DMG Bonus +15%',
    'four_piece' => 'Increases Overloaded and Burning DMG by 40%.',
    'has_rarity_4' => true,
    'has_rarity_5' => true,
    'version' => '1.0',
    'game_id' => 15006,
    'icon_file_id' => catalogued('artifacts', 'CRIMSON_WITCH_OF_FLAMES', 'avif'),
]);
made('artifacts', ['name' => 'Adventurer', 'has_rarity_1' => true, 'has_rarity_2' => true, 'has_rarity_3' => true, 'has_rarity_5' => false, 'version' => '1.0', 'game_id' => 10010]);
made('artifacts', ['name' => 'Initiate', 'has_rarity_1' => true, 'has_rarity_5' => false, 'version' => '1.0']);
made('artifacts', ['name' => 'ZZ_PICKER_TEST', 'deleted' => true]);

// ── The answers ─────────────────────────────────────────────────────────────

echo "GET /api/catalog/characters\n";

$response = send('GET', '/api/catalog/characters');
$characters = body($response);
same('200, JSON in UTF-8', [200, 'application/json; charset=utf-8'], [$response->getStatusCode(), $response->getHeaderLine('Content-Type')]);
check('a bare list', is_array($characters) && array_is_list($characters));
same(
    'the live rows, by name byte by byte then id - the deleted one left out, both Aether rows the Geo one first',
    [['Aether', 'Geo'], ['Aether', 'Anemo'], ['Hu Tao', 'Pyro'], ['Lumine', 'Anemo'], ['Manekin', 'Adaptive'], ['Nefer', 'Dendro'], ['Not Yet Numbered', 'Anemo']],
    array_map(static fn(array $row): array => [$row['name'], $row['element']], $characters),
);
same(
    'one character, exactly as promised: these fields, in this order, nothing of an editor\'s',
    [
        'game_id' => 10000046,
        'name' => 'Hu Tao',
        'element' => 'Pyro',
        'weapon_type' => 'Polearm',
        'rarity' => 5,
        'region' => 'Liyue',
        'version' => '1.3',
        'version_name' => null,
        'release_date' => '2021-03-02',
        'is_traveler' => false,
        'icon' => 'http://localhost/assets/character/icon/HU_TAO.avif',
    ],
    $characters[2],
);
same(
    'the Travelers: a row per element, each named, every Aether row 10000005, Lumine 10000007',
    [[10000005, 'Aether', 'Geo', true], [10000005, 'Aether', 'Anemo', true], [10000007, 'Lumine', 'Anemo', true]],
    array_map(static fn(array $row): array => [$row['game_id'], $row['name'], $row['element'], $row['is_traveler']], [$characters[0], $characters[1], $characters[3]]),
);
same(
    'a Luna release: its number and its name',
    [['6.1', 'Luna II'], ['6.0', 'Luna I']],
    [[$characters[5]['version'], $characters[5]['version_name']], [$characters[4]['version'], $characters[4]['version_name']]],
);
same('a version that is no number: none, its text as the name; no id yet: null', [null, 'Beta', null], [$characters[6]['version'], $characters[6]['version_name'], $characters[6]['game_id']]);
same('no icon in the catalogue: null', null, $characters[5]['icon']);
check(
    'no row carries an editor\'s field, `deleted` or an id of this database\'s',
    array_filter($characters, static fn(array $row): bool => array_intersect(array_keys($row), ['id', 'created_by', 'updated_by', 'created_at', 'updated_at', 'deleted', 'icon_file_id']) !== []) ===
        [],
);

echo "GET /api/catalog/weapons\n";

$weapons = body(send('GET', '/api/catalog/weapons'));
same('by name byte by byte: a name in quotes first', ['"The Catch"', "Amos' Bow", 'Nameless Sword', 'Staff of Homa'], array_column($weapons, 'name'));
same(
    'one weapon, exactly as promised',
    [
        'game_id' => 13501,
        'name' => 'Staff of Homa',
        'type' => 'Polearm',
        'rarity' => 5,
        'version' => '1.3',
        'version_name' => null,
        'release_date' => '2021-02-23',
        'icon' => 'http://localhost/assets/weapons/STAFF_OF_HOMA.avif',
    ],
    $weapons[3],
);
same('each part of an icon\'s path encoded: "Amos\' Bow.avif"', 'http://localhost/assets/weapons/Amos%27%20Bow.avif', $weapons[1]['icon']);
same(
    'nothing known: no id, no version, no date, no icon',
    [null, null, null, null, null],
    [$weapons[2]['game_id'], $weapons[2]['version'], $weapons[2]['version_name'], $weapons[2]['release_date'], $weapons[2]['icon']],
);

echo "GET /api/catalog/artifacts\n";

$artifacts = body(send('GET', '/api/catalog/artifacts'));
same('the live sets by name', ['Adventurer', 'Crimson Witch of Flames', 'Initiate'], array_column($artifacts, 'name'));
same(
    'one set, exactly as promised',
    [
        'game_id' => 15006,
        'name' => 'Crimson Witch of Flames',
        'two_piece' => 'Pyro DMG Bonus +15%',
        'four_piece' => 'Increases Overloaded and Burning DMG by 40%.',
        'rarities' => [4, 5],
        'version' => '1.0',
        'version_name' => null,
        'icon' => 'http://localhost/assets/artifacts/CRIMSON_WITCH_OF_FLAMES.avif',
    ],
    $artifacts[1],
);
same('rarities from has_rarity_1..5, lowest first', [[1, 2, 3], [4, 5], [1]], array_column($artifacts, 'rarities'));
same('a set without bonuses or an id', [null, null, null], [$artifacts[2]['two_piece'], $artifacts[2]['four_piece'], $artifacts[2]['game_id']]);

// ── The icons' host ─────────────────────────────────────────────────────────

echo "The icons, on the host the request named\n";

$icon = static fn(string $url): ?string => body(send('GET', $url))[2]['icon'] ?? null;
same('https for a host of the world', 'https://genshin.example/assets/character/icon/HU_TAO.avif', $icon('https://genshin.example/api/catalog/characters'));
same('...even asked over http (a proxy in front ends the TLS)', 'https://genshin.example/assets/character/icon/HU_TAO.avif', $icon('http://genshin.example/api/catalog/characters'));
same(
    '...and no port: the site answers on https\'s own, and a port there is likelier the one a proxy reached PHP on (SERVER_PORT, which Slim takes when the Host header names none)',
    ['https://genshin.example/assets/character/icon/HU_TAO.avif', 'https://genshin.example/assets/character/icon/HU_TAO.avif'],
    [$icon('http://genshin.example:8080/api/catalog/characters'), $icon('https://genshin.example:8443/api/catalog/characters')],
);
same('http for a loopback host, the port kept (ng serve)', 'http://localhost:4200/assets/character/icon/HU_TAO.avif', $icon('http://localhost:4200/api/catalog/characters'));
same(
    '...127.0.0.1 and [::1] the same',
    ['http://127.0.0.1:8000/assets/character/icon/HU_TAO.avif', 'http://[::1]:4200/assets/character/icon/HU_TAO.avif'],
    [$icon('http://127.0.0.1:8000/api/catalog/characters'), $icon('http://[::1]:4200/api/catalog/characters')],
);
$request = (new ServerRequestFactory())->createServerRequest('GET', 'http://localhost/api/catalog/characters', ['REMOTE_ADDR' => '127.0.0.1']);
same(
    'a host that is no host: 400 invalid_host, in this API\'s {error, code}',
    [[400, 'invalid_host', true], 400],
    (function () use ($app, $request): array {
        $bad = $app->handle($request->withUri($request->getUri()->withHost('evil.example/x?')));

        return [[$bad->getStatusCode(), body($bad)['code'] ?? null, isset(body($bad)['error'])], $app->handle($request->withUri($request->getUri()->withHost('-dash.example')))->getStatusCode()];
    })(),
);

// ── ETag ────────────────────────────────────────────────────────────────────

echo "ETag and 304\n";

$first = send('GET', '/api/catalog/weapons');
$etag = $first->getHeaderLine('ETag');
check('an ETag, asked every time (no-cache)', preg_match('/^"[0-9a-f]{32}"$/D', $etag) === 1 && $first->getHeaderLine('Cache-Control') === 'no-cache', $etag);
$again = send('GET', '/api/catalog/weapons', headers: ['If-None-Match' => $etag]);
same(
    'the same list again: 304, empty, with both headers',
    [304, '', $etag, 'no-cache'],
    [$again->getStatusCode(), (string) $again->getBody(), $again->getHeaderLine('ETag'), $again->getHeaderLine('Cache-Control')],
);
$gzip = substr($etag, 0, -1) . '-gzip"';
same(
    'the tag weakened (W/), suffixed by a compressing Apache (-gzip), both, or one of a list: 304 each',
    [304, 304, 304, 304, 304],
    array_map(static fn(string $tag): int => send('GET', '/api/catalog/weapons', headers: ['If-None-Match' => $tag])->getStatusCode(), [
        "W/$etag",
        $gzip,
        "W/$gzip",
        '"0123456789abcdef0123456789abcdef", ' . $etag,
        '*',
    ]),
);
same(
    'another tag: 200 and the list',
    [200, 4],
    [send('GET', '/api/catalog/weapons', headers: ['If-None-Match' => '"0123456789abcdef0123456789abcdef"'])->getStatusCode(), count(body(send('GET', '/api/catalog/weapons')))],
);
check('another host, another tag: the icons are part of the answer', send('GET', 'https://genshin.example/api/catalog/weapons')->getHeaderLine('ETag') !== $etag);
$pdo->exec("UPDATE weapons SET version = '1.4' WHERE id = $homa");
$changed = send('GET', '/api/catalog/weapons', headers: ['If-None-Match' => $etag]);
same('a row changed: the old tag answers 200, under a new one', [200, true], [$changed->getStatusCode(), $changed->getHeaderLine('ETag') !== $etag]);
$pdo->exec("UPDATE weapons SET version = '1.3' WHERE id = $homa");

// ── Read-only, and the site's switches ──────────────────────────────────────

echo "Read-only, and under the site's switches like any route\n";

foreach (['POST', 'PUT', 'DELETE'] as $method) {
    same(
        "$method /api/catalog/characters: 405, an ADMIN's too",
        [405, 405],
        [send($method, '/api/catalog/characters', null, ['x' => 1])->getStatusCode(), send($method, '/api/catalog/characters', ADMIN, ['x' => 1])->getStatusCode()],
    );
}
same(
    'a token that does not verify: 401 invalid_token',
    [401, 'invalid_token'],
    (function (): array {
        $response = send('GET', '/api/catalog/weapons', null, null, ['Authorization' => 'Bearer nonsense']);

        return [$response->getStatusCode(), body($response)['code'] ?? null];
    })(),
);
same('a signed-in reader reads it as anybody does', 200, send('GET', '/api/catalog/artifacts', EDITOR)->getStatusCode());

$pdo->exec("INSERT INTO anotoki_site_settings (name, value) VALUES ('maintenance_mode', 'true') ON CONFLICT (name) DO UPDATE SET value = EXCLUDED.value");
same(
    'closed for maintenance: 503 maintenance - an ADMIN past it',
    [503, 'maintenance', 200],
    [send('GET', '/api/catalog/characters')->getStatusCode(), body(send('GET', '/api/catalog/characters'))['code'] ?? null, send('GET', '/api/catalog/characters', ADMIN)->getStatusCode()],
);
$pdo->exec("UPDATE anotoki_site_settings SET value = 'false' WHERE name = 'maintenance_mode'");

file_put_contents($applicationFile, json_encode(['client_id' => 'genshin', 'name' => 'Genshin', 'login_required' => true]));
same(
    'sign-in required: 401 sign_in_required for nobody - a signed-in request never asks',
    [401, 'sign_in_required', 200],
    [send('GET', '/api/catalog/weapons')->getStatusCode(), body(send('GET', '/api/catalog/weapons'))['code'] ?? null, send('GET', '/api/catalog/weapons', EDITOR)->getStatusCode()],
);
file_put_contents($applicationFile, json_encode(['client_id' => 'genshin', 'name' => 'Genshin', 'login_required' => false]));

$route = (int) $pdo->query("INSERT INTO anotoki_page_access (path, visibility, blocked, api_paths) VALUES ('/catalog-locked', 'PUBLIC', TRUE, '{/api/catalog}') RETURNING id")->fetchColumn();
same(
    'a page\'s row locking /api/catalog: 423 page_locked - its ADMIN past it',
    [423, 'page_locked', 200],
    [send('GET', '/api/catalog/artifacts')->getStatusCode(), body(send('GET', '/api/catalog/artifacts'))['code'] ?? null, send('GET', '/api/catalog/artifacts', ADMIN)->getStatusCode()],
);
$pdo->exec("DELETE FROM anotoki_page_access WHERE id = $route");

file_put_contents("$backend/migrations/genshin_impact/999_test_waiting.sql", "SELECT 1;\n");
same(
    'an update waiting: 503 update_pending, an ADMIN\'s too',
    [503, 'update_pending', 503],
    [send('GET', '/api/catalog/characters')->getStatusCode(), body(send('GET', '/api/catalog/characters'))['code'] ?? null, send('GET', '/api/catalog/characters', ADMIN)->getStatusCode()],
);
unlink("$backend/migrations/genshin_impact/999_test_waiting.sql");
same('applied (gone): it answers again', 200, send('GET', '/api/catalog/characters')->getStatusCode());

// ── The admin's way in ──────────────────────────────────────────────────────

echo "game_id through the models, as the admin forms send it\n";

same(
    'a weapon\'s /full save sets it',
    [200, 11998],
    [send('PUT', "/api/weapons/$nameless/full", EDITOR, ['weapon' => ['game_id' => 11998]])->getStatusCode(), (int) $pdo->query("SELECT game_id FROM weapons WHERE id = $nameless")->fetchColumn()],
);
same(
    '...null clears it',
    [200, null],
    [send('PUT', "/api/weapons/$nameless/full", EDITOR, ['weapon' => ['game_id' => null]])->getStatusCode(), $pdo->query("SELECT game_id FROM weapons WHERE id = $nameless")->fetchColumn() ?: null],
);
same(
    '...an id another live weapon holds: 409, nothing kept',
    [409, null],
    [send('PUT', "/api/weapons/$nameless/full", EDITOR, ['weapon' => ['game_id' => 13501]])->getStatusCode(), $pdo->query("SELECT game_id FROM weapons WHERE id = $nameless")->fetchColumn() ?: null],
);
same(
    'an artifact set\'s and a character\'s save the same',
    [200, 15999, 200, 10000999],
    [
        send('PUT', "/api/artifacts/$witch/full", EDITOR, ['artifact' => ['game_id' => 15999]])->getStatusCode(),
        (int) $pdo->query("SELECT game_id FROM artifacts WHERE id = $witch")->fetchColumn(),
        send('PUT', "/api/characters/$huTao", EDITOR, ['game_id' => 10000999])->getStatusCode(),
        (int) $pdo->query("SELECT game_id FROM characters WHERE id = $huTao")->fetchColumn(),
    ],
);
$pdo->exec("UPDATE artifacts SET game_id = 15006 WHERE id = $witch");
$pdo->exec("UPDATE characters SET game_id = 10000046 WHERE id = $huTao");
same(
    'an empty string is no number: 422 - which is why the forms send a number or null',
    422,
    send('POST', '/api/weapons', EDITOR, ['name' => 'Blank Id', 'type' => 'Sword', 'rarity' => 4, 'game_id' => ''])->getStatusCode(),
);

// ── 030 ─────────────────────────────────────────────────────────────────────

echo "030: one live row an id, the Travelers one an element\n";

same('a second live character with an id: refused (unique)', '23505', refusedWith($pdo, "UPDATE characters SET game_id = 10000046 WHERE name = 'Manekin'"));
same('...a deleted one may hold it', null, refusedWith($pdo, "UPDATE characters SET game_id = 10000046 WHERE name = 'Albedo'"));
same('a Traveler\'s id on two rows of one element: refused', '23505', refusedWith($pdo, "UPDATE characters SET game_id = 10000005 WHERE name = 'Lumine' AND element = 'Anemo'"));
same(
    '...one id on rows of different elements is every Traveler\'s way',
    2,
    (int) $pdo->query('SELECT count(*) FROM characters WHERE game_id = 10000005 AND is_traveler AND NOT deleted')->fetchColumn(),
);
same(
    'a weapon\'s and a set\'s id twice: refused',
    ['23505', '23505'],
    [refusedWith($pdo, "UPDATE weapons SET game_id = 13501 WHERE name = 'Nameless Sword'"), refusedWith($pdo, "UPDATE artifacts SET game_id = 15006 WHERE name = 'Initiate'")],
);
same('...a deleted weapon may hold a live one\'s', null, refusedWith($pdo, "UPDATE weapons SET game_id = 13501 WHERE name = 'Deleted Blade'"));
same(
    'rows without an id, as many as there are',
    [null, 2],
    [refusedWith($pdo, "UPDATE weapons SET game_id = NULL WHERE name = '\"The Catch\"'"), (int) $pdo->query('SELECT count(*) FROM weapons WHERE game_id IS NULL AND NOT deleted')->fetchColumn()],
);
$pdo->exec("UPDATE weapons SET game_id = 13415 WHERE name = '\"The Catch\"'");
same(
    'an id is a positive number (the CHECK)',
    ['23514', '23514', '23514'],
    [
        refusedWith($pdo, "UPDATE weapons SET game_id = 0 WHERE name = 'Nameless Sword'"),
        refusedWith($pdo, "UPDATE characters SET game_id = -5 WHERE name = 'Not Yet Numbered'"),
        refusedWith($pdo, "UPDATE artifacts SET game_id = 0 WHERE name = 'Initiate'"),
    ],
);

$sql030 = (string) file_get_contents("$backend/migrations/genshin_impact/030_game_ids.sql");
$gate030 = substr($sql030, (int) strrpos($sql030, 'DO $$'));
same('030\'s gate, run again over what it made: content', null, refusedWith($pdo, $gate030));
/** 030's gate after $break, rolled back: what it says. */
$gateAfter = static function (string $break) use ($pdo, $gate030): string {
    $pdo->beginTransaction();
    try {
        $pdo->exec($break);
        $pdo->exec($gate030);

        return 'no complaint';
    } catch (PDOException $e) {
        return $e->getMessage();
    } finally {
        $pdo->rollBack();
    }
};
check('...an index gone: it says which', str_contains($gateAfter('DROP INDEX uq_weapons_game_id'), 'the index uq_weapons_game_id on weapons is missing'));
check('...a CHECK gone: it says which', str_contains($gateAfter('ALTER TABLE artifacts DROP CONSTRAINT chk_artifacts_game_id'), 'the CHECK (game_id > 0) on artifacts.game_id is missing'));
check(
    '...a Traveler\'s index over every character, not the Travelers alone: it says so',
    str_contains(
        $gateAfter('DROP INDEX uq_characters_traveler_game_id; CREATE UNIQUE INDEX uq_characters_traveler_game_id ON characters (game_id, element) WHERE deleted = FALSE'),
        'should be UNIQUE on (game_id,element) where deleted=falseandis_traveler',
    ),
);
check('...a column of another type: it says so', str_contains($gateAfter('ALTER TABLE weapons ALTER COLUMN game_id TYPE BIGINT'), 'weapons.game_id is missing, or is not a nullable INTEGER'));

// ── 031 on a database with rows ─────────────────────────────────────────────

echo "031 on a database with rows: each id by its name, never over one, never a clash\n";

$sql031 = (string) file_get_contents("$backend/migrations/genshin_impact/031_game_ids_filled.sql");
foreach (
    [
        "('characters', 'Hu Tao', NULL, 10000046)",
        "('characters', 'Amber', NULL, 10000021)",
        "('travelers', 'Aether', 'Anemo', 10000005)",
        "('travelers', 'Aether', 'Geo', 10000005)",
        "('travelers', 'Lumine', 'Geo', 10000007)",
        "('weapons', 'Staff of Homa', NULL, 13501)",
        "('weapons', 'Amos'' Bow', NULL, 15502)",
        "('weapons', 'Wolf''s Gravestone', NULL, 12502)",
        "('artifacts', 'Crimson Witch of Flames', NULL, 15006)",
        "('artifacts', 'Adventurer', NULL, 10010)",
    ]
    as $line
) {
    check("031 lists $line", str_contains($sql031, $line));
}
check('...and leaves out what the game\'s lists do not carry', !str_contains($sql031, "'Initiate', NULL") && !str_contains($sql031, "'Prized Isshin Blade (Awakened)', NULL"));

$filled = testPdo(testDatabase('catalog_fill'));
$upTo030 = testMigrate($filled, ['anotoki_admin' => '999', 'genshin_impact' => '030_game_ids.sql']);
check('a database built up to 030', $upTo030['error'] === null, (string) $upTo030['error']);

made('characters', ['name' => 'Hu Tao', 'element' => 'Pyro'], $filled);
made('characters', ['name' => 'Aether', 'element' => 'Anemo', 'is_traveler' => true], $filled);
made('characters', ['name' => 'Aether', 'element' => 'Geo', 'is_traveler' => true], $filled);
made('characters', ['name' => 'Lumine', 'element' => 'Geo', 'is_traveler' => true], $filled);
made('characters', ['name' => 'Amber', 'element' => 'Pyro', 'game_id' => 99999901], $filled);
made('characters', ['name' => 'Albedo', 'element' => 'Geo', 'deleted' => true], $filled);
made('characters', ['name' => 'Not In The Game'], $filled);
made('weapons', ['name' => 'Staff of Homa'], $filled);
made('weapons', ['name' => "Amos' Bow"], $filled);
made('weapons', ['name' => "Wolf's Gravestone"], $filled);
made('weapons', ['name' => 'Clash Holder', 'game_id' => 12502], $filled);
made('weapons', ['name' => 'Prized Isshin Blade (Awakened)'], $filled);
made('artifacts', ['name' => 'Crimson Witch of Flames'], $filled);
made('artifacts', ['name' => 'Initiate'], $filled);
made('artifacts', ['name' => 'Adventurer', 'deleted' => true], $filled);

/** 031's statements on the database with rows, $change made before its gate, rolled back: what the gate says. */
$gate031After = static function (string $skip, string $change) use ($filled, $sql031): string {
    $statements = Splitter::split($sql031);
    $filled->beginTransaction();
    try {
        foreach ($statements as $at => $statement) {
            if ($skip !== '' && str_starts_with($statement, $skip)) {
                continue;
            }
            if ($at === count($statements) - 1 && $change !== '') {
                $filled->exec($change);
            }
            $filled->exec($statement);
        }

        return 'no complaint';
    } catch (PDOException $e) {
        return $e->getMessage();
    } finally {
        $filled->rollBack();
    }
};
check(
    'its gate notices a row the names fill left out (the weapons\' statement skipped)',
    str_contains($gate031After('UPDATE weapons', ''), "rows left without the id their name gives: weapon Amos' Bow, weapon Staff of Homa"),
);
check('...an id a row had, changed', str_contains($gate031After('', "UPDATE characters SET game_id = 1 WHERE name = 'Amber'"), 'rows that had an id lost or changed it: characters #'));
check('...an id its name does not give', str_contains($gate031After('', "UPDATE characters SET game_id = 10000999 WHERE name = 'Hu Tao'"), 'ids set that their names do not give: character Hu Tao'));
same('...and none of that was kept', 0, (int) $filled->query('SELECT count(*) FROM characters WHERE game_id IS NOT NULL AND name <> \'Amber\'')->fetchColumn());

$rest = siteMigrator($filled)->apply();
check(
    '031 applied by the site\'s engine, its gate content',
    $rest['error'] === null && in_array('genshin_impact/031_game_ids_filled.sql', array_map(static fn(array $file): string => $file['set'] . '/' . $file['name'], $rest['applied']), true),
    (string) $rest['error'],
);
same(
    'characters: by name; the Travelers by name and element; Amber keeps the id it had; the deleted row and a name the game has not, none',
    [['Hu Tao', 10000046], ['Aether', 10000005], ['Aether', 10000005], ['Lumine', 10000007], ['Amber', 99999901], ['Albedo', null], ['Not In The Game', null]],
    $filled->query('SELECT name, game_id FROM characters ORDER BY id')->fetchAll(PDO::FETCH_NUM),
);
same(
    'weapons: by name (a quote in it too); an id another live weapon holds filled into nobody; the quest copy none',
    [['Staff of Homa', 13501], ["Amos' Bow", 15502], ["Wolf's Gravestone", null], ['Clash Holder', 12502], ['Prized Isshin Blade (Awakened)', null]],
    $filled->query('SELECT name, game_id FROM weapons ORDER BY id')->fetchAll(PDO::FETCH_NUM),
);
same(
    'artifact sets: by name; Initiate none; the deleted one left alone',
    [['Crimson Witch of Flames', 15006], ['Initiate', null], ['Adventurer', null]],
    $filled->query('SELECT name, game_id FROM artifacts ORDER BY id')->fetchAll(PDO::FETCH_NUM),
);
