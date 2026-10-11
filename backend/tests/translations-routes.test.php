<?php

declare(strict_types=1);

/**
 * The words' routes and the guides', through the whole API (api/index.php) -
 * every gate, the site's checks, the anotoki library's routes behind them -
 * run in this process against a database of the test's own, on a backend
 * copy of its own (tests/db_lib.php), with a key pair standing in for the IAM:
 *
 *   - the bundle: the family's wire format (snake_case), its ETag and 304,
 *     its languages, regional and hidden codes, no guide in it;
 *   - the routes that went: /api/languages, /api/translation-keys, the old
 *     export and import - no key is made by any route any more;
 *   - who may: nobody without a token, no MEMBER; an EDITOR as an ADMIN, for
 *     the strings and the languages alike - the owner's decision, unchanged;
 *   - a save, an export, an import, the languages - written by whom, kept in
 *     the audit log, refused in this API's {error, code} where they must be;
 *   - the guides: read in the reader's language or English, edited by staff,
 *     never left without English;
 *   - the gates: the bundle open while the site is closed, requires signing
 *     in or waits for an update - the guides and everything else not.
 */

use Psr\Http\Message\ResponseInterface;
use Slim\Psr7\Factory\ServerRequestFactory;
use Slim\Psr7\Factory\StreamFactory;

require __DIR__ . '/lib.php';
require __DIR__ . '/db_lib.php';

testNeedsDatabase();

$database = testDatabase('routes');
$iamDir = testTempDir('iam');
$iam = testIam($iamDir);
$applicationFile = "$iamDir/application.json";
file_put_contents($applicationFile, json_encode(['client_id' => 'genshin', 'name' => 'Genshin', 'login_required' => false]));
$backend = testBackendCopy($database, ['jwks_file' => $iam['jwks'], 'application_file' => $applicationFile]);

define('ANOTOKI_ROUTES_ONLY', true);
require "$backend/api/index.php";

$built = siteMigrator(getDb())->apply();
check('a database built by every migration, the library\'s people set last', $built['error'] === null && end($built['applied'])['set'] === 'anotoki_people', (string) $built['error']);

const ADMIN = 1;
const EDITOR = 2;
const MEMBER = 3;
$tokens = [
    ADMIN => ($iam['token'])(ADMIN, ['MEMBER', 'ADMIN']),
    EDITOR => ($iam['token'])(EDITOR, ['MEMBER', 'EDITOR']),
    MEMBER => ($iam['token'])(MEMBER, ['MEMBER']),
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
        $request = $request->withHeader('Content-Type', 'application/json')
            ->withBody((new StreamFactory())->createStream(is_string($json) ? $json : json_encode($json)));
    }
    foreach ($headers as $name => $value) {
        $request = $request->withHeader($name, $value);
    }

    return $app->handle($request);
}

/** The answer's JSON, as arrays. */
function body(ResponseInterface $response): mixed
{
    return json_decode((string) $response->getBody(), true);
}

function answer(ResponseInterface $response): string
{
    return $response->getStatusCode() . ' ' . substr((string) $response->getBody(), 0, 300);
}

$pdo = getDb();

// ── The bundle ──────────────────────────────────────────────────────────────

echo "GET /api/translations/{code}: the pages' words\n";

$en = send('GET', '/api/translations/en');
$bundle = body($en);
same('200, JSON in UTF-8', [200, 'application/json; charset=utf-8'], [$en->getStatusCode(), $en->getHeaderLine('Content-Type')]);
same('the family\'s shape: language, languages, values - no english for English', ['language', 'languages', 'values'], array_keys($bundle));
same('the languages on offer, snake_case', [['code' => 'en', 'name' => 'English', 'native_name' => 'English'], ['code' => 'sk', 'name' => 'Slovak', 'native_name' => 'Slovenčina']], $bundle['languages']);
check('the site\'s strings, the library\'s and 051\'s among them', ($bundle['values']['nav.daily'] ?? null) !== null && ($bundle['values']['anotoki.language.button'] ?? null) === 'Language: {name} ({code})' && isset($bundle['values']['guide.loadFailed']));
check('no guide\'s body: those are /api/guides', !isset($bundle['values']['guide.daily.content']) && isset($bundle['values']['guide.daily.title']));
check('ETag, and asked every time (no-cache)', preg_match('/^"[0-9a-f]{32}"$/', $en->getHeaderLine('ETag')) === 1 && $en->getHeaderLine('Cache-Control') === 'no-cache');
$again = send('GET', '/api/translations/en', headers: ['If-None-Match' => $en->getHeaderLine('ETag')]);
same('the same words again: 304, with both headers', [304, $en->getHeaderLine('ETag'), 'no-cache', ''], [$again->getStatusCode(), $again->getHeaderLine('ETag'), $again->getHeaderLine('Cache-Control'), (string) $again->getBody()]);

$sk = body(send('GET', '/api/translations/sk'));
same('Slovak: in Slovak, with English beside it', ['sk', 'Denné', 'Daily'], [$sk['language'], $sk['values']['nav.daily'] ?? null, $sk['english']['nav.daily'] ?? null]);
same('sk-sk is answered by sk', 'sk', body(send('GET', '/api/translations/sk-sk'))['language']);
same('a language nobody offers reads English', 'en', body(send('GET', '/api/translations/de'))['language']);
$notCode = send('GET', '/api/translations/EN');
same('a code that is no code: 404, in this API\'s {error, code}', [404, 'not_found', true], [$notCode->getStatusCode(), body($notCode)['code'] ?? null, isset(body($notCode)['error'])]);
same('no token is read: a bad one changes nothing', 200, send('GET', '/api/translations/sk', null, null, ['Authorization' => 'Bearer nonsense'])->getStatusCode());

// ── What went ───────────────────────────────────────────────────────────────

echo "The routes that went\n";

foreach ([
    ['GET', '/api/languages'], ['GET', '/api/languages?all=1'], ['POST', '/api/languages'], ['PUT', '/api/languages/sk'],
    ['DELETE', '/api/languages/sk'], ['GET', '/api/translations/sk/export'], ['PUT', '/api/translations/sk/import'],
    ['POST', '/api/translation-keys'], ['PUT', '/api/translation-keys/nav.daily'], ['DELETE', '/api/translation-keys/nav.daily'],
] as [$method, $path]) {
    $status = send($method, $path, ADMIN, $method === 'GET' || $method === 'DELETE' ? null : ['name' => 'made.here'])->getStatusCode();
    check("$method $path is no route any more", in_array($status, [404, 405], true), (string) $status);
}
same('no route made a key', 0, (int) $pdo->query("SELECT count(*) FROM translation_keys WHERE name = 'made.here'")->fetchColumn());

// ── Who may ─────────────────────────────────────────────────────────────────

echo "Who may: ADMIN or EDITOR, for the strings and the languages alike\n";

foreach (['/api/admin/translations', '/api/admin/languages', '/api/admin/translations/sk/export', '/api/admin/guides'] as $path) {
    same("GET $path: nobody 401, a MEMBER 403, an EDITOR and an ADMIN 200", [401, 403, 200, 200], [send('GET', $path)->getStatusCode(), send('GET', $path, MEMBER)->getStatusCode(), send('GET', $path, EDITOR)->getStatusCode(), send('GET', $path, ADMIN)->getStatusCode()]);
}
foreach ([
    ['PUT', '/api/admin/translations', ['values' => ['nav.daily' => ['sk' => 'x']]]],
    ['PUT', '/api/admin/translations/sk/import', ['nav.daily' => 'x']],
    ['POST', '/api/admin/languages', ['code' => 'fr', 'name' => 'French', 'native_name' => 'Français']],
    ['PUT', '/api/admin/languages/sk', ['name' => 'X']],
    ['DELETE', '/api/admin/languages/sk', null],
    ['PUT', '/api/admin/guides/daily', ['values' => ['sk' => '<p>x</p>']]],
] as [$method, $path, $body]) {
    same("$method $path: nobody 401, a MEMBER 403", [401, 403], [send($method, $path, null, $body)->getStatusCode(), send($method, $path, MEMBER, $body)->getStatusCode()]);
}
same('...and nothing they sent was kept', ['Denné', 'Slovak', 0], [
    $pdo->query("SELECT value FROM translations WHERE key_name = 'nav.daily' AND language_code = 'sk'")->fetchColumn(),
    $pdo->query("SELECT name FROM languages WHERE code = 'sk'")->fetchColumn(),
    (int) $pdo->query("SELECT count(*) FROM languages WHERE code = 'fr'")->fetchColumn(),
]);

// ── The grid and a save ─────────────────────────────────────────────────────

echo "The grid, and saving strings\n";

$grid = body(send('GET', '/api/admin/translations', EDITOR));
same('the grid: languages and keys', ['languages', 'keys'], array_keys($grid));
same('a language as the admin pages read it, with its guides', ['code', 'name', 'native_name', 'enabled', 'sort_order', 'seeded', 'strings', 'guides'], array_keys($grid['languages'][0]));
same('English: released, its strings and its guides counted', [true, true, 11], [$grid['languages'][0]['seeded'], $grid['languages'][0]['strings'] > 300, $grid['languages'][0]['guides']]);
$daily = array_values(array_filter($grid['keys'], fn ($key) => $key['name'] === 'nav.daily'))[0] ?? null;
same('a key: its name, the code\'s description, its strings - no scope, flag or stamps', ['name', 'description', 'values'], array_keys((array) $daily));

$saved = send('PUT', '/api/admin/translations', EDITOR, ['values' => ['nav.daily' => ['sk' => 'Výzva dňa']]]);
same('an EDITOR\'s save: 200 and the grid', [200, true], [$saved->getStatusCode(), isset(body($saved)['keys'])]);
same('...kept, written by the EDITOR', ['Výzva dňa', EDITOR], array_values($pdo->query("SELECT value, updated_by FROM translations WHERE key_name = 'nav.daily' AND language_code = 'sk'")->fetch()));
$audit = $pdo->query("SELECT target_type, target_id, action, actor_id, actor_session, details FROM anotoki_audit_log WHERE action = 'translations.saved' ORDER BY id DESC LIMIT 1")->fetch();
same('...and in the audit log (the library\'s): the languages, how many, which keys - by whom, from which sign-in', ['translations', 'sk', 'translations.saved', EDITOR, 'sid-' . EDITOR, ['sk'], 1, ['nav.daily']], [$audit['target_type'] ?? null, $audit['target_id'] ?? null, $audit['action'] ?? null, (int) ($audit['actor_id'] ?? 0), $audit['actor_session'] ?? null, json_decode((string) ($audit['details'] ?? '{}'), true)['languages'] ?? null, json_decode((string) ($audit['details'] ?? '{}'), true)['count'] ?? null, json_decode((string) ($audit['details'] ?? '{}'), true)['keys'] ?? null]);

$unknown = send('PUT', '/api/admin/translations', EDITOR, ['values' => ['no.such.key' => ['sk' => 'x']]]);
same('a key nobody made: 422 unknown_key, {error, code, keys}', [422, 'unknown_key', ['no.such.key'], true], [$unknown->getStatusCode(), body($unknown)['code'] ?? null, body($unknown)['keys'] ?? null, is_string(body($unknown)['error'] ?? null)]);
$noEnglish = send('PUT', '/api/admin/translations', ADMIN, ['values' => ['nav.daily' => ['en' => '   ']]]);
same('English left blank: 422 fallback_required', [422, 'fallback_required'], [$noEnglish->getStatusCode(), body($noEnglish)['code'] ?? null]);
$placeholder = send('PUT', '/api/admin/translations', ADMIN, ['values' => ['visitor.lost' => ['en' => 'Your games are gone.']]]);
same('English without its placeholder: 422 placeholder_changed', [422, 'placeholder_changed'], [$placeholder->getStatusCode(), body($placeholder)['code'] ?? null]);
same('a form, not JSON: 415', 415, send('PUT', '/api/admin/translations', EDITOR, null, ['Content-Type' => 'application/x-www-form-urlencoded'])->getStatusCode());
same('no body at all: 422 empty_body', [422, 'empty_body'], (function (): array {
    $response = send('PUT', '/api/admin/translations', EDITOR, '');
    return [$response->getStatusCode(), body($response)['code'] ?? null];
})());
$blank = send('PUT', '/api/admin/translations', EDITOR, ['values' => ['nav.daily' => ['sk' => '']]]);
same('a blank Slovak string: deleted - the key reads the English there', [200, 0], [$blank->getStatusCode(), (int) $pdo->query("SELECT count(*) FROM translations WHERE key_name = 'nav.daily' AND language_code = 'sk'")->fetchColumn()]);

// ── Export and import ───────────────────────────────────────────────────────

echo "Export and import\n";

$export = send('GET', '/api/admin/translations/sk/export', EDITOR);
same('a download: translations-sk.json', [200, 'attachment; filename="translations-sk.json"'], [$export->getStatusCode(), $export->getHeaderLine('Content-Disposition')]);
check('...a flat {key: text} of Slovak\'s own strings', (body($export)['nav.games'] ?? null) === 'Hry' && !isset(body($export)['nav.daily']));
$import = send('PUT', '/api/admin/translations/sk/import', EDITOR, ['nav.daily' => 'Každý deň', 'no.such.key' => 'x']);
same('an import with a key nobody made: refused whole - an import makes no key', [422, 'unknown_key', 0], [$import->getStatusCode(), body($import)['code'] ?? null, (int) $pdo->query("SELECT count(*) FROM translation_keys WHERE name = 'no.such.key'")->fetchColumn()]);
same('...and nothing of it kept', 0, (int) $pdo->query("SELECT count(*) FROM translations WHERE key_name = 'nav.daily' AND language_code = 'sk'")->fetchColumn());
$import = send('PUT', '/api/admin/translations/sk/import', EDITOR, ['nav.daily' => 'Každý deň', 'nav.games' => '']);
same('an import: kept, an empty string passed over', [200, 'Každý deň', 'Hry'], [$import->getStatusCode(), $pdo->query("SELECT value FROM translations WHERE key_name = 'nav.daily' AND language_code = 'sk'")->fetchColumn(), $pdo->query("SELECT value FROM translations WHERE key_name = 'nav.games' AND language_code = 'sk'")->fetchColumn()]);

// ── The languages ───────────────────────────────────────────────────────────

echo "The languages: an EDITOR may keep them, as before\n";

$created = send('POST', '/api/admin/languages', EDITOR, ['code' => 'de', 'name' => 'German', 'native_name' => 'Deutsch', 'enabled' => false]);
same('an EDITOR adds a language, hidden: 201', [201, ['code' => 'de', 'name' => 'German', 'native_name' => 'Deutsch', 'enabled' => false, 'sort_order' => 3, 'seeded' => false, 'strings' => 0, 'guides' => 0]], [$created->getStatusCode(), body($created)['language'] ?? null]);
same('the same code again: 409 language_exists', [409, 'language_exists'], [send('POST', '/api/admin/languages', EDITOR, ['code' => 'de', 'name' => 'German', 'native_name' => 'Deutsch'])->getStatusCode(), body(send('POST', '/api/admin/languages', EDITOR, ['code' => 'de', 'name' => 'German', 'native_name' => 'Deutsch']))['code'] ?? null]);
same('a code that is no code: 422 invalid_language', 422, send('POST', '/api/admin/languages', EDITOR, ['code' => 'DEU', 'name' => 'German', 'native_name' => 'Deutsch'])->getStatusCode());
same('the bundle does not offer a hidden language', 'en', body(send('GET', '/api/translations/de'))['language']);
same('a guide in it, written ahead', 200, send('PUT', '/api/admin/guides/daily', EDITOR, ['values' => ['de' => '<p>Täglich</p>']])->getStatusCode());
same('a guide asked for in it, while it is hidden: English', 'en', body(send('GET', '/api/guides/daily?language=de'))['language']);
$changed = send('PUT', '/api/admin/languages/de', EDITOR, ['enabled' => true]);
same('switched on by an EDITOR', [200, true, 1], [$changed->getStatusCode(), body($changed)['language']['enabled'] ?? null, body($changed)['language']['guides'] ?? null]);
same('offered now: the bundle in it, and its guide', ['de', 'de'], [body(send('GET', '/api/translations/de'))['language'], body(send('GET', '/api/guides/daily?language=de'))['language']]);
same('English cannot be switched off: 409 fallback_language', [409, 'fallback_language'], (function (): array {
    $response = send('PUT', '/api/admin/languages/en', ADMIN, ['enabled' => false]);
    return [$response->getStatusCode(), body($response)['code'] ?? null];
})());
same('a released language cannot be deleted: 409 seeded_language', [409, 'seeded_language'], (function (): array {
    $response = send('DELETE', '/api/admin/languages/sk', ADMIN);
    return [$response->getStatusCode(), body($response)['code'] ?? null];
})());
$deleted = send('DELETE', '/api/admin/languages/de', EDITOR);
same('deleting German: what went with it - its strings and its guide', [200, ['strings' => 0, 'guides' => 1]], [$deleted->getStatusCode(), body($deleted)]);
same('...the guide went too', 0, (int) $pdo->query("SELECT count(*) FROM guide_contents WHERE language_code = 'de'")->fetchColumn());
same('the languages\' changes are in the audit log', ['language.created', 'language.deleted', 'language.updated'], $pdo->query("SELECT DISTINCT action FROM anotoki_audit_log WHERE target_type = 'language' AND action LIKE 'language.%' ORDER BY action")->fetchAll(PDO::FETCH_COLUMN));

// ── The guides ──────────────────────────────────────────────────────────────

echo "The guides\n";

$guide = send('GET', '/api/guides/minesweeper?language=sk');
same('a guide in the reader\'s language: {guide, language, html}', [200, ['guide', 'language', 'html'], 'minesweeper', 'sk'], [$guide->getStatusCode(), array_keys(body($guide)), body($guide)['guide'], body($guide)['language']]);
check('...the whole of it, markup and all', mb_strlen(body($guide)['html']) > 2000 && str_starts_with(body($guide)['html'], '<h4>'));
same('...ETag: the same again is 304', 304, send('GET', '/api/guides/minesweeper?language=sk', headers: ['If-None-Match' => $guide->getHeaderLine('ETag')])->getStatusCode());
same('no language asked: English', 'en', body(send('GET', '/api/guides/daily'))['language']);
same('a guide there is not: 404 not_found', [404, 'not_found'], [send('GET', '/api/guides/nope')->getStatusCode(), body(send('GET', '/api/guides/nope'))['code'] ?? null]);
same('a language that is no code: 404', 404, send('GET', '/api/guides/daily?language=EN')->getStatusCode());

$view = body(send('GET', '/api/admin/guides', EDITOR));
same('the Guides page: every guide, every language', [11, ['en', 'sk'], ['code', 'name', 'native_name', 'enabled']], [count($view['guides']), array_column($view['languages'], 'code'), array_keys($view['languages'][0])]);
$put = send('PUT', '/api/admin/guides/daily', EDITOR, ['values' => ['sk' => '<h4>Nový návod</h4>']]);
same('an EDITOR saves a guide: 200, the guide as it is now', [200, 'daily', '<h4>Nový návod</h4>'], [$put->getStatusCode(), body($put)['guide'] ?? null, body($put)['values']['sk'] ?? null]);
same('...written by the EDITOR, read by the pages', [EDITOR, '<h4>Nový návod</h4>'], [(int) $pdo->query("SELECT updated_by FROM guide_contents WHERE guide = 'daily' AND language_code = 'sk'")->fetchColumn(), body(send('GET', '/api/guides/daily?language=sk'))['html']]);
$audit = $pdo->query("SELECT action, target_id, details FROM anotoki_audit_log WHERE target_type = 'guide_contents' ORDER BY id DESC LIMIT 1")->fetch();
same('...and in the audit log, old and new', ['content.update', 'daily', '<h4>Nový návod</h4>'], [$audit['action'] ?? null, $audit['target_id'] ?? null, json_decode((string) ($audit['details'] ?? '{}'), true)['sk']['new'] ?? null]);
same('English left blank: 422 fallback_required, nothing kept', [422, 'fallback_required', true], [send('PUT', '/api/admin/guides/daily', EDITOR, ['values' => ['en' => ' ']])->getStatusCode(), body(send('PUT', '/api/admin/guides/daily', EDITOR, ['values' => ['en' => ' ']]))['code'] ?? null, (bool) $pdo->query("SELECT 1 FROM guide_contents WHERE guide = 'daily' AND language_code = 'en'")->fetchColumn()]);
same('a language there is not: 422 unknown_language', [422, 'unknown_language'], (function (): array {
    $response = send('PUT', '/api/admin/guides/daily', EDITOR, ['values' => ['xx' => '<p>x</p>']]);
    return [$response->getStatusCode(), body($response)['code'] ?? null];
})());
same('more than a guide may hold: 422 invalid_value', [422, 'invalid_value'], (function (): array {
    $response = send('PUT', '/api/admin/guides/daily', EDITOR, ['values' => ['sk' => str_repeat('a', GUIDE_HTML_MAX + 1)]]);
    return [$response->getStatusCode(), body($response)['code'] ?? null];
})());
same('a guide there is not: 404, and none is made', [404, 0], [send('PUT', '/api/admin/guides/nope', EDITOR, ['values' => ['en' => '<p>x</p>']])->getStatusCode(), (int) $pdo->query("SELECT count(*) FROM guide_contents WHERE guide = 'nope'")->fetchColumn()]);
same('a form, not JSON: 415', 415, send('PUT', '/api/admin/guides/daily', EDITOR, null, ['Content-Type' => 'application/x-www-form-urlencoded'])->getStatusCode());
$cleared = send('PUT', '/api/admin/guides/daily', EDITOR, ['values' => ['sk' => '']]);
same('Slovak emptied: gone - the guide reads in English there', [200, false, 'en'], [$cleared->getStatusCode(), isset(body($cleared)['values']['sk']), body(send('GET', '/api/guides/daily?language=sk'))['language']]);

// ── The gates ───────────────────────────────────────────────────────────────

echo "The gates leave the words open, and nothing else they did not\n";

$pdo->exec("UPDATE site_settings SET value = 'true' WHERE name = 'maintenance_mode' AND site = 'genshin_impact'");
siteSettingsForget();
same('closed for maintenance: the words answer anybody', 200, send('GET', '/api/translations/sk')->getStatusCode());
same('...a guide does not (503 maintenance)', [503, 'maintenance'], [send('GET', '/api/guides/daily')->getStatusCode(), body(send('GET', '/api/guides/daily'))['code'] ?? null]);
same('...nor anything under the words\' path', 503, send('GET', '/api/translations/sk/export')->getStatusCode());
same('...an ADMIN gets past to the admin pages', 200, send('GET', '/api/admin/translations', ADMIN)->getStatusCode());
$pdo->exec("UPDATE site_settings SET value = 'false' WHERE name = 'maintenance_mode' AND site = 'genshin_impact'");
siteSettingsForget();

file_put_contents($applicationFile, json_encode(['client_id' => 'genshin', 'name' => 'Genshin', 'login_required' => true]));
same('sign-in required: the words answer anybody', 200, send('GET', '/api/translations/sk')->getStatusCode());
same('...a guide does not (401 sign_in_required)', [401, 'sign_in_required'], [send('GET', '/api/guides/daily')->getStatusCode(), body(send('GET', '/api/guides/daily'))['code'] ?? null]);
same('...nor the path the languages had (401, not a way past)', 401, send('GET', '/api/languages')->getStatusCode());
same('...nor a path that only begins like the words\'', 401, send('GET', '/api/translations/sk/x')->getStatusCode());
same('...nor the same, spelt the way the router decodes it', 401, send('GET', '/%61pi/guides/daily')->getStatusCode());
file_put_contents($applicationFile, json_encode(['client_id' => 'genshin', 'name' => 'Genshin', 'login_required' => false]));

file_put_contents("$backend/migrations/users/999_test_waiting.sql", "SELECT 1;\n");
same('an update waiting: the words answer anybody', 200, send('GET', '/api/translations/sk')->getStatusCode());
same('...a guide does not (503 update_pending)', [503, 'update_pending'], [send('GET', '/api/guides/daily')->getStatusCode(), body(send('GET', '/api/guides/daily'))['code'] ?? null]);
same('...nor the admin pages\' routes, even an ADMIN\'s', [503, 503], [send('GET', '/api/admin/translations', ADMIN)->getStatusCode(), send('GET', '/api/admin/languages', ADMIN)->getStatusCode()]);
same('...nor the path the languages had', 503, send('GET', '/api/languages')->getStatusCode());
unlink("$backend/migrations/users/999_test_waiting.sql");
same('applied (gone): everything answers again', 200, send('GET', '/api/admin/translations', EDITOR)->getStatusCode());
