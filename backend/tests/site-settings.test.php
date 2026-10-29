<?php

declare(strict_types=1);

/**
 * The site settings (anotoki-lib 0.11.0: genshin's own, made the family's) through the whole API (api/index.php) -
 * every gate, the library's routes behind them - run in this process against a database of the test's own, built by
 * every migration (users/066 bringing the seeded switches and pages across), on a backend copy of its own
 * (tests/db_lib.php), with a key pair standing in for the IAM:
 *
 *   - what every page is told: GET /api/site-settings (whether the site is closed, the announcement, the pages -
 *     never their API paths), read without a token, before anybody signs in, and the boot's answer
 *     (/api/settings/public) without the switches it used to carry; genshin's own routes gone;
 *   - who may change them: the admin routes - nobody 401, a MEMBER and an EDITOR 403 and nothing kept, the ADMIN in,
 *     every change in the audit log;
 *   - Getting in: closed for maintenance, every path 503 `maintenance` with what the administrators wrote - to
 *     nobody, a MEMBER, an EDITOR, a token that does not verify, an ADMIN's token signed by another key - but the
 *     reserved paths (who the reader is, the boot, the words, the status, the settings), the two links an ADMIN's
 *     browser opens by itself, and the site's ADMIN, who is never locked out and opens it again; the status says so;
 *   - the announcement and its checks;
 *   - Page access: 423 page_locked for the API paths a page refuses, to everybody the page is not shown to - its
 *     path spelled otherwise too -, the more open of two pages winning, the ADMIN past it; no row may claim a
 *     reserved API path either way round, nor govern a reserved page (the way in, the sign-in's way back, the admin
 *     panel, the legal pages), and one put in by hand that does is passed over;
 *   - while the library's tables wait for their update: the switches at their defaults, nothing governed, the
 *     admin routes 503 feature_unavailable.
 */

use Psr\Http\Message\ResponseInterface;
use Slim\Psr7\Factory\ServerRequestFactory;
use Slim\Psr7\Factory\StreamFactory;

require __DIR__ . '/lib.php';
require __DIR__ . '/db_lib.php';

testNeedsDatabase();

$database = testDatabase('site_settings_routes');
$iamDir = testTempDir('iam');
$iam = testIam($iamDir);
$applicationFile = "$iamDir/application.json";
file_put_contents($applicationFile, json_encode(['client_id' => 'genshin', 'name' => 'Genshin', 'login_required' => false]));
$backend = testBackendCopy($database, ['jwks_file' => $iam['jwks'], 'application_file' => $applicationFile]);

// Another IAM's key pair: a token it signs names the same people and roles, and verifies nowhere here.
$forger = testIam(testTempDir('forger'));

define('ANOTOKI_ROUTES_ONLY', true);
require "$backend/api/index.php";

$built = siteMigrator(getDb())->apply();
check(
    'a database built by every migration, users/066 among them',
    $built['error'] === null && in_array('users/066_site_settings_into_the_library.sql', array_map(static fn(array $file): string => $file['set'] . '/' . $file['name'], $built['applied']), true),
    (string) $built['error'],
);

const ADMIN = 1;
const EDITOR = 2;
const MEMBER = 3;
const FORGED_ADMIN = 4;
$tokens = [
    ADMIN => $iam['token'](ADMIN, ['MEMBER', 'ADMIN']),
    EDITOR => $iam['token'](EDITOR, ['MEMBER', 'EDITOR']),
    MEMBER => $iam['token'](MEMBER, ['MEMBER']),
    FORGED_ADMIN => $forger['token'](ADMIN, ['MEMBER', 'ADMIN']),
];

/** One request through the whole app; $as is who sends it (a token), null for nobody. */
function send(string $method, string $path, ?int $as = null, mixed $json = null, array $headers = []): ResponseInterface
{
    global $app, $tokens;
    $request = (new ServerRequestFactory())->createServerRequest($method, 'http://localhost' . $path, ['REMOTE_ADDR' => '127.0.0.1']);
    parse_str((string) parse_url($path, PHP_URL_QUERY), $query);
    $request = $request->withQueryParams($query);
    if ($as !== null) {
        $request = $request->withHeader('Authorization', 'Bearer ' . $tokens[$as]);
    }
    if ($json !== null) {
        $request = $request->withHeader('Content-Type', 'application/json')->withBody((new StreamFactory())->createStream(is_string($json) ? $json : json_encode($json)));
    }
    foreach ($headers as $name => $value) {
        $request = $request->withHeader($name, $value);
    }
    $response = $app->handle($request);
    $bytes = (string) $response->getBody();

    return $response->withBody((new StreamFactory())->createStream($bytes));
}

function body(ResponseInterface $response): mixed
{
    return json_decode((string) $response->getBody(), true);
}

/** [status, code] of an answer. */
function answered(ResponseInterface $response): array
{
    return [$response->getStatusCode(), body($response)['code'] ?? null];
}

/** What every page is told of the announcement: null for none, 'missing' where the answer has no such key. */
function announcementOf(ResponseInterface $response): mixed
{
    $body = body($response);

    return is_array($body) && array_key_exists('announcement', $body) ? $body['announcement'] : 'missing';
}

/** An object's keys in one order - jsonb keeps them by length, not as written. */
function keyed(mixed $value): mixed
{
    if (is_array($value)) {
        ksort($value);
    }

    return $value;
}

/** The newest audit entry of an action: [actor, target, details]. */
function lastAudit(string $action): ?array
{
    $statement = getDb()->prepare('SELECT actor_id, target_id, details::text AS details FROM anotoki_audit_log WHERE action = ? ORDER BY id DESC LIMIT 1');
    $statement->execute([$action]);
    $row = $statement->fetch(PDO::FETCH_ASSOC);

    return $row === false ? null : [(int) $row['actor_id'], $row['target_id'], json_decode((string) $row['details'], true)];
}

$pdo = getDb();

// ── What every page is told ─────────────────────────────────────────────────

echo "What every page is told\n";

$public = send('GET', '/api/site-settings');
same('GET /api/site-settings: 200, open, closed for nobody, nothing to announce', [200, false, null], [$public->getStatusCode(), body($public)['maintenance'] ?? null, announcementOf($public)]);
same(
    '...the 35 pages - the 27 035 seeded, the four database pages of users/071 and the four quiz pages of 072 -, each its path, who sees it and whether it is off - never its API paths',
    [35, ['path', 'visibility', 'blocked']],
    [count(body($public)['pages'] ?? []), array_keys(body($public)['pages'][0] ?? [])],
);
same('...read without a token: one that does not verify is not looked at (200)', 200, send('GET', '/api/site-settings', null, null, ['Authorization' => 'Bearer not.a.token'])->getStatusCode());
same('the boot\'s answer keeps the rest: where the IAM is and the visitors - the switches are the library\'s now', ['auth', 'visitors'], array_keys(body(send('GET', '/api/settings/public')) ?? []));
same(
    'genshin\'s own routes are gone: GET and PUT /api/settings, GET /api/site-routes, DELETE /api/site-routes/1 - 404 or 405',
    [true, true, true, true],
    array_map(static fn(array $call): bool => in_array(send($call[0], $call[1], ADMIN, $call[2] ?? null)->getStatusCode(), [404, 405], true), [
        ['GET', '/api/settings'],
        ['PUT', '/api/settings', ['settings' => []]],
        ['GET', '/api/site-routes'],
        ['DELETE', '/api/site-routes/1'],
    ]),
);

// ── Who may change them ─────────────────────────────────────────────────────

echo "Who may change them: the ADMIN alone\n";

same(
    'GET /api/admin/site-settings: nobody 401, a MEMBER 403, an EDITOR 403, the ADMIN 200',
    [401, 403, 403, 200],
    [
        send('GET', '/api/admin/site-settings')->getStatusCode(),
        send('GET', '/api/admin/site-settings', MEMBER)->getStatusCode(),
        send('GET', '/api/admin/site-settings', EDITOR)->getStatusCode(),
        send('GET', '/api/admin/site-settings', ADMIN)->getStatusCode(),
    ],
);
$whole = body(send('GET', '/api/admin/site-settings', ADMIN));
same('...all three parts offered: Getting in, the Announcement, Page access', ['getting_in', 'announcement', 'page_access'], $whole['parts'] ?? null);
$reserved = $whole['reserved']['api_paths'] ?? [];
sort($reserved);
same(
    '...the reserved API paths: who the reader is, the boot, the library\'s sign-in path, the status, the words, the settings\' two',
    ['/api/admin/site-settings', '/api/auth/config', '/api/me', '/api/settings/public', '/api/site-settings', '/api/site-status', '/api/translations'],
    $reserved,
);
foreach ([EDITOR => 'an EDITOR', MEMBER => 'a MEMBER', 0 => 'nobody'] as $who => $name) {
    $as = $who === 0 ? null : $who;
    same(
        "$name closing the site, adding a page or removing one: refused, nothing kept",
        [true, true, true, false, 35],
        [
            in_array(send('PUT', '/api/admin/site-settings', $as, ['settings' => ['maintenance_mode' => true]])->getStatusCode(), [401, 403], true),
            in_array(send('POST', '/api/admin/site-settings/pages', $as, ['path' => '/games/mine', 'visibility' => 'ADMIN'])->getStatusCode(), [401, 403], true),
            in_array(send('DELETE', '/api/admin/site-settings/pages/' . $whole['pages'][0]['id'], $as)->getStatusCode(), [401, 403], true),
            body(send('GET', '/api/site-settings'))['maintenance'] ?? null,
            (int) $pdo->query('SELECT count(*) FROM anotoki_page_access')->fetchColumn(),
        ],
    );
}

// ── Getting in ──────────────────────────────────────────────────────────────

echo "Getting in: closed for maintenance\n";

$closed = send('PUT', '/api/admin/site-settings', ADMIN, ['settings' => ['maintenance_mode' => true, 'maintenance_message' => ['en' => 'Back at six.', 'sk' => 'Späť o šiestej.']]]);
same('the ADMIN closes the site, with a message in English and Slovak: 200, said back', [200, true], [$closed->getStatusCode(), body($closed)['settings']['maintenance_mode']['value'] ?? null]);
$audit = lastAudit('site_settings.changed');
same(
    '...in the audit log: site_settings.changed, by the ADMIN, each switch before and after',
    [ADMIN, ['new' => true, 'old' => false]],
    [$audit[0] ?? null, keyed($audit[2]['maintenance_mode'] ?? null)],
);
$status = body(send('GET', '/api/site-status'));
same('the status says so, with the message', ['maintenance', ['en' => 'Back at six.', 'sk' => 'Späť o šiestej.']], [$status['state'] ?? null, $status['maintenance_message'] ?? null]);
same('...and so does what every page is told', true, body(send('GET', '/api/site-settings'))['maintenance'] ?? null);

$refused = send('GET', '/api/regions');
same(
    'nobody: 503 maintenance, Retry-After 300, the message beside it',
    [503, 'maintenance', '300', 'Back at six.'],
    [$refused->getStatusCode(), body($refused)['code'] ?? null, $refused->getHeaderLine('Retry-After'), body($refused)['maintenance_message']['en'] ?? null],
);
same('a MEMBER and an EDITOR: 503 maintenance', [[503, 'maintenance'], [503, 'maintenance']], [answered(send('GET', '/api/regions', MEMBER)), answered(send('GET', '/api/regions', EDITOR))]);
same(
    'a token that does not verify, and an ADMIN\'s token signed by another key: nobody - 503 maintenance',
    [[503, 'maintenance'], [503, 'maintenance']],
    [answered(send('GET', '/api/regions', null, null, ['Authorization' => 'Bearer not.a.token'])), answered(send('GET', '/api/regions', FORGED_ADMIN))],
);
same('a page refused at the API, its path spelled otherwise (/%61pi/regions): 503 maintenance too', 503, send('GET', '/%61pi/regions')->getStatusCode());
same('the site\'s ADMIN uses it as it is: 200 - never locked out', 200, send('GET', '/api/regions', ADMIN)->getStatusCode());
same(
    'the reserved paths answer anybody: the boot, the words, the status, what every page is told - and who the reader is, to a MEMBER',
    [200, 200, 200, 200, 200],
    [
        send('GET', '/api/settings/public')->getStatusCode(),
        send('GET', '/api/translations/sk')->getStatusCode(),
        send('GET', '/api/site-status')->getStatusCode(),
        send('GET', '/api/site-settings')->getStatusCode(),
        send('GET', '/api/me', MEMBER)->getStatusCode(),
    ],
);
same('...and what is under the words\' path but no route: 404, not 503 - nothing is there to answer', 404, send('GET', '/api/translations/sk/export')->getStatusCode());
check(
    'the file explorer\'s preview, a link an ADMIN\'s browser opens by itself with no token: past the gate, its signature the check',
    !in_array(send('GET', '/api/admin/files/raw?root=assets&path=x.png')->getStatusCode(), [503, 200], true),
    (string) send('GET', '/api/admin/files/raw?root=assets&path=x.png')->getStatusCode(),
);
same('the feedback form, from nobody: 503 maintenance', 503, send('POST', '/api/feedback', null, ['kind' => 'other', 'message' => 'x'])->getStatusCode());
same('the admin Site settings page answers its ADMIN while it is closed', 200, send('GET', '/api/admin/site-settings', ADMIN)->getStatusCode());
$opened = send('PUT', '/api/admin/site-settings', ADMIN, ['settings' => ['maintenance_mode' => false]]);
same(
    '...and opens it again: 200, everybody back in',
    [200, 200, 'ready'],
    [$opened->getStatusCode(), send('GET', '/api/regions')->getStatusCode(), body(send('GET', '/api/site-status'))['state'] ?? null],
);
same('the message stays for next time', 'Back at six.', body(send('GET', '/api/admin/site-settings', ADMIN))['settings']['maintenance_message']['value']['en'] ?? null);

// ── The announcement ────────────────────────────────────────────────────────

echo "The announcement\n";

$said = send('PUT', '/api/admin/site-settings', ADMIN, [
    'settings' => ['announcement_enabled' => true, 'announcement_level' => 'warning', 'announcement_message' => ['en' => "New characters tonight.\nWatch the banners.", 'sk' => '']],
]);
same('shown, a warning, in English (Slovak left empty): 200', 200, $said->getStatusCode());
same(
    'every page is told it: its kind and its message, the empty language left out, the line break kept',
    ['level' => 'warning', 'message' => ['en' => "New characters tonight.\nWatch the banners."]],
    body(send('GET', '/api/site-settings'))['announcement'] ?? null,
);
same('a kind there is not: 422 invalid_setting', [422, 'invalid_setting'], answered(send('PUT', '/api/admin/site-settings', ADMIN, ['settings' => ['announcement_level' => 'loud']])));
same('a message as a list: 422 invalid_setting', [422, 'invalid_setting'], answered(send('PUT', '/api/admin/site-settings', ADMIN, ['settings' => ['announcement_message' => ['hello']]])));
same(
    'a message holding a control character: 422 invalid_setting',
    [422, 'invalid_setting'],
    answered(send('PUT', '/api/admin/site-settings', ADMIN, ['settings' => ['announcement_message' => ['en' => "Bell\x07"]]])),
);
same('a switch there is not: 422 unknown_setting', [422, 'unknown_setting'], answered(send('PUT', '/api/admin/site-settings', ADMIN, ['settings' => ['dark_mode' => true]])));
same('...and none of the refused kept: the announcement as it was', 'warning', body(send('GET', '/api/site-settings'))['announcement']['level'] ?? null);
send('PUT', '/api/admin/site-settings', ADMIN, ['settings' => ['announcement_enabled' => false]]);
same('switched off: nothing to announce', null, announcementOf(send('GET', '/api/site-settings')));

// ── Page access ─────────────────────────────────────────────────────────────

echo "Page access\n";

$added = send('POST', '/api/admin/site-settings/pages', ADMIN, ['path' => '/games/secret', 'visibility' => 'USER', 'blocked' => false, 'api_paths' => ['/api/catalog']]);
$secret = null;
foreach (body($added)['pages'] ?? [] as $page) {
    if ($page['path'] === '/games/secret') {
        $secret = $page;
    }
}
same('a page added, for people signed in, refusing /api/catalog with it: 201', [201, 'USER', ['/api/catalog']], [$added->getStatusCode(), $secret['visibility'] ?? null, $secret['api_paths'] ?? null]);
same('...in the audit log: page_access.added, by the ADMIN', [ADMIN, '/games/secret'], [lastAudit('page_access.added')[0] ?? null, lastAudit('page_access.added')[2]['path'] ?? null]);
same(
    'nobody: 423 page_locked, in this API\'s {error, code} - its path spelled otherwise too',
    [[423, 'page_locked'], true, [423, 'page_locked']],
    [answered(send('GET', '/api/catalog/characters')), is_string(body(send('GET', '/api/catalog/characters'))['error'] ?? null), answered(send('GET', '/%61pi/catalog/characters'))],
);
same('somebody signed in (a MEMBER): 200', 200, send('GET', '/api/catalog/characters', MEMBER)->getStatusCode());
same('a path is matched from its start, letter by letter, as genshin\'s rule was: /api/catalogue is refused with /api/catalog (423)', 423, send('GET', '/api/catalogue')->getStatusCode());

$changed = send('PUT', '/api/admin/site-settings/pages', ADMIN, ['pages' => [['id' => $secret['id'], 'visibility' => 'EDITOR']]]);
same(
    'editors and administrators: 200; a MEMBER 423, an EDITOR 200, the ADMIN 200',
    [200, 423, 200, 200],
    [
        $changed->getStatusCode(),
        send('GET', '/api/catalog/weapons', MEMBER)->getStatusCode(),
        send('GET', '/api/catalog/weapons', EDITOR)->getStatusCode(),
        send('GET', '/api/catalog/weapons', ADMIN)->getStatusCode(),
    ],
);
same('...in the audit log: page_access.changed, the field before and after', ['new' => 'EDITOR', 'old' => 'USER'], keyed(lastAudit('page_access.changed')[2]['visibility'] ?? null));
send('PUT', '/api/admin/site-settings/pages', ADMIN, ['pages' => [['id' => $secret['id'], 'blocked' => true]]]);
same(
    'switched off: the EDITOR 423 now, the ADMIN still 200 - whoever switched it off must be able to look',
    [423, 200],
    [send('GET', '/api/catalog/artifacts', EDITOR)->getStatusCode(), send('GET', '/api/catalog/artifacts', ADMIN)->getStatusCode()],
);
send('POST', '/api/admin/site-settings/pages', ADMIN, ['path' => '/games/open', 'visibility' => 'PUBLIC', 'api_paths' => ['/api/catalog']]);
same('another page, anybody\'s, claiming the same path: the more open wins - nobody 200', 200, send('GET', '/api/catalog/artifacts')->getStatusCode());

$reservedClaims = [];
foreach (
    [
        '/api/me',
        '/api',
        '/api/m',
        '/api/me/roles',
        '/api/settings/public',
        '/api/settings',
        '/api/site-settings',
        '/api/admin/site-settings/pages',
        '/api/translations/en',
        '/api/site-status',
        '/api/auth/config',
    ]
    as $path
) {
    $reservedClaims[$path] = answered(send('POST', '/api/admin/site-settings/pages', ADMIN, ['path' => '/games/claim', 'visibility' => 'ADMIN', 'api_paths' => [$path]]));
}
same(
    'no page may claim a reserved API path, either way round - each 422 invalid_api_path, no row',
    [array_fill_keys(array_keys($reservedClaims), [422, 'invalid_api_path']), 0],
    [$reservedClaims, (int) $pdo->query("SELECT count(*) FROM anotoki_page_access WHERE path = '/games/claim'")->fetchColumn()],
);
same(
    '...but a path that only begins with the same letters may be: /api/media - 201',
    201,
    send('POST', '/api/admin/site-settings/pages', ADMIN, ['path' => '/games/media', 'visibility' => 'ADMIN', 'api_paths' => ['/api/media']])->getStatusCode(),
);
$reservedPages = [];
foreach (['/staff', '/auth/callback', '/auth', '/:section', '/admin', '/admin/site-settings', '/terms', '/privacy/', '/contact', '/about', '/support'] as $path) {
    $reservedPages[$path] = answered(send('POST', '/api/admin/site-settings/pages', ADMIN, ['path' => $path, 'visibility' => 'ADMIN']));
}
same(
    'no row may govern a reserved page - the way in, the sign-in\'s way back, the admin panel, the legal pages, About and Support: each 422 invalid_page',
    array_fill_keys(array_keys($reservedPages), [422, 'invalid_page']),
    $reservedPages,
);
check('...saying why', str_contains((string) (body(send('POST', '/api/admin/site-settings/pages', ADMIN, ['path' => '/privacy', 'visibility' => 'ADMIN']))['error'] ?? ''), 'legal pages'));
same('a page that is there already: 409 page_exists', [409, 'page_exists'], answered(send('POST', '/api/admin/site-settings/pages', ADMIN, ['path' => '/games/secret', 'visibility' => 'ADMIN'])));

// A row put in by hand, past the checks: the library passes it over.
$pdo->exec("INSERT INTO anotoki_page_access (path, visibility, blocked, api_paths) VALUES ('/hand', 'ADMIN', TRUE, '{/api/me,/api/settings/public}'), ('/staff', 'ADMIN', TRUE, '{}')");
same(
    'a row put in by hand claiming who the reader is and the boot: passed over - a MEMBER 200, nobody 200',
    [200, 200],
    [send('GET', '/api/me', MEMBER)->getStatusCode(), send('GET', '/api/settings/public')->getStatusCode()],
);
same(
    '...and one governing /staff is not told to the pages',
    [],
    array_values(array_filter(body(send('GET', '/api/site-settings'))['pages'] ?? [], static fn(array $page): bool => $page['path'] === '/staff')),
);

$removed = send('DELETE', '/api/admin/site-settings/pages/' . $secret['id'], ADMIN);
same('a page removed: 200, in the audit log (page_access.removed), anybody\'s again', [200, '/games/secret'], [$removed->getStatusCode(), lastAudit('page_access.removed')[2]['path'] ?? null]);
same('one that is not there: 404 not_found', [404, 'not_found'], answered(send('DELETE', '/api/admin/site-settings/pages/999999', ADMIN)));

// ── While the tables wait ───────────────────────────────────────────────────

echo "While the library's tables wait for their update\n";

$pdo->exec('ALTER TABLE anotoki_page_access RENAME TO anotoki_page_access_away');
$pdo->exec('ALTER TABLE anotoki_site_settings RENAME TO anotoki_site_settings_away');
same('the admin page: 503 feature_unavailable', [503, 'feature_unavailable'], answered(send('GET', '/api/admin/site-settings', ADMIN)));
same(
    'what every page is told: the defaults - open, nothing to announce, no page governed',
    [200, false, null, []],
    [
        send('GET', '/api/site-settings')->getStatusCode(),
        body(send('GET', '/api/site-settings'))['maintenance'] ?? null,
        announcementOf(send('GET', '/api/site-settings')),
        body(send('GET', '/api/site-settings'))['pages'] ?? null,
    ],
);
same('...and the site open to everybody', [200, 'ready'], [send('GET', '/api/regions')->getStatusCode(), body(send('GET', '/api/site-status'))['state'] ?? null]);
$pdo->exec('ALTER TABLE anotoki_page_access_away RENAME TO anotoki_page_access');
$pdo->exec('ALTER TABLE anotoki_site_settings_away RENAME TO anotoki_site_settings');
same('back: the admin page answers again', 200, send('GET', '/api/admin/site-settings', ADMIN)->getStatusCode());
