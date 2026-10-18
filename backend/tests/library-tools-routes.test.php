<?php

declare(strict_types=1);

/**
 * anotoki-lib 0.5.0 in this site, through the whole API (api/index.php) - every
 * gate, the site's checks, the library's routes behind them - run in this
 * process against a database of the test's own, on a backend copy of its own
 * (tests/db_lib.php), with a key pair standing in for the IAM:
 *
 *   - who a request is: the library's Identify - a token that does not verify
 *     is 401 invalid_token on every path but the few that read no token (the
 *     boot, the words, the status, the two links an admin's browser opens);
 *     nobody on a route that needs somebody is 401 sign_in_required; the boot
 *     answer carries the library's sign_in_available; a visitor's key is read
 *     by the owner routes alone;
 *   - who may: every admin tool's route (the error log, the audit log,
 *     feedback, backups, the file explorer, the People page) and the
 *     Migrations page's - nobody 401, a MEMBER 403, an EDITOR 403 (the owner's
 *     decision: EDITORs see none of them), the ADMIN in; and nothing a refused
 *     request sent is kept;
 *   - each tool doing its work here: the audit log written by the content's
 *     writes with who and from which sign-in; the visitors' feedback form and
 *     its rules; the error log in a folder of its own, the site's old log files
 *     left where they are (their addresses: tests/addresses.test.php); the
 *     pages' own errors, scrubbed, within their caps; a backup made (by a
 *     name the page shows, sealed), downloaded once by its ticket and restored
 *     - what was deleted since done again inside it, the scrub after it - an
 *     unsealed one (a plain backup of before 0.5.0) never restored, the old
 *     pg_dump folders left where they are; the explorer over the asset tree,
 *     its rules on uploads and an old file they would refuse, its previews
 *     signed under the site's own secret; the People page, its delete and the
 *     scrub of an account the IAM deleted; the dashboard's figures the
 *     ADMIN's alone;
 *   - the gates around them: closed for maintenance, sign-in required, an
 *     update waiting - what stays open, and what does not; and what the error
 *     log leaves out of them (a state the site is in: the library's
 *     `expected`, this site's own among them) and what it writes (a failure,
 *     a 503 among them);
 *   - and at the end every route of the tools once more, all 35, each by
 *     nobody, a MEMBER and an EDITOR sending what would change something
 *     (nothing does) and by the ADMIN sending what changes nothing (past the
 *     check on every one); the two links refused alike to all four callers.
 */

use Psr\Http\Message\ResponseInterface;
use Slim\Psr7\Factory\ServerRequestFactory;
use Slim\Psr7\Factory\StreamFactory;
use Slim\Psr7\UploadedFile;

require __DIR__ . '/lib.php';
require __DIR__ . '/db_lib.php';

testNeedsDatabase();

$database = testDatabase('tools_routes');
$iamDir = testTempDir('iam');
$iam = testIam($iamDir);
$applicationFile = "$iamDir/application.json";
$anonymizedFile = "$iamDir/anonymized.json";
file_put_contents($applicationFile, json_encode(['client_id' => 'genshin', 'name' => 'Genshin', 'login_required' => false]));
file_put_contents($anonymizedFile, json_encode(['accounts' => []]));
$backend = testBackendCopy($database, ['jwks_file' => $iam['jwks'], 'application_file' => $applicationFile, 'anonymized_file' => $anonymizedFile]);

// What a site that ran before this release has on disk: its own error log's
// files, a pg_dump backup, and in the asset tree a picture and an old file the
// library's rules would refuse today (a second extension that could run).
const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
mkdir("$backend/storage/logs", 0777, true);
file_put_contents("$backend/storage/logs/errors-2020-01-01.jsonl", '{"at":"2020-01-01 10:00:00","level":"error","status":500}' . "\n");
mkdir("$backend/storage/backups/20200101-100000-abcdef", 0777, true);
file_put_contents("$backend/storage/backups/20200101-100000-abcdef/backup.json", '{"status":"complete"}');
mkdir("$backend/assets/character/icon", 0777, true);
file_put_contents("$backend/assets/character/icon/AMBER.png", base64_decode(PNG));
file_put_contents("$backend/assets/character/icon/old.php.png", base64_decode(PNG));
file_put_contents("$backend/assets/character/icon/old.svg", '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
mkdir("$backend/public/uploads", 0777, true);

define('ANOTOKI_ROUTES_ONLY', true);
require "$backend/api/index.php";

$built = siteMigrator(getDb())->apply();
check('a database built by every migration, the library\'s admin set first and its people set last', $built['error'] === null && ($built['applied'][0]['set'] ?? null) === 'anotoki_admin' && end($built['applied'])['set'] === 'anotoki_people', (string) $built['error']);

const ADMIN = 1;
const EDITOR = 2;
const MEMBER = 3;
const STALE_ADMIN = 4;
const FRESH_ADMIN = 5;
$tokens = [
    ADMIN => ($iam['token'])(ADMIN, ['MEMBER', 'ADMIN']),
    EDITOR => ($iam['token'])(EDITOR, ['MEMBER', 'EDITOR']),
    MEMBER => ($iam['token'])(MEMBER, ['MEMBER']),
    // The same ADMIN, signed in at the IAM an hour ago - and a minute ago: the backups' proof.
    STALE_ADMIN => ($iam['token'])(ADMIN, ['MEMBER', 'ADMIN'], ['auth_time' => time() - 3600]),
    FRESH_ADMIN => ($iam['token'])(ADMIN, ['MEMBER', 'ADMIN'], ['auth_time' => time() - 60]),
];

/** One request through the whole app; $as is who sends it (a token), null for nobody. */
function send(string $method, string $path, ?int $as = null, mixed $json = null, array $headers = [], array $files = [], array $fields = []): ResponseInterface
{
    global $app, $tokens;
    $request = (new ServerRequestFactory())->createServerRequest($method, 'http://localhost' . $path, ['REMOTE_ADDR' => $GLOBALS['REMOTE'] ?? '127.0.0.1']);
    parse_str((string) parse_url($path, PHP_URL_QUERY), $query);
    $request = $request->withQueryParams($query);
    if ($as !== null) {
        $request = $request->withHeader('Authorization', 'Bearer ' . $tokens[$as]);
    }
    if ($json !== null) {
        $request = $request->withHeader('Content-Type', 'application/json')
            ->withBody((new StreamFactory())->createStream(is_string($json) ? $json : json_encode($json)));
    }
    if ($files !== []) {
        $request = $request->withUploadedFiles(['files' => $files])->withParsedBody($fields);
    }
    foreach ($headers as $name => $value) {
        $request = $request->withHeader($name, $value);
    }

    // What the answer streams from a file (a backup, a preview) is read here and
    // the file closed: a handle left open to the end would keep the test's
    // folders from going when the file ends, on Windows.
    $response = $app->handle($request);
    $body = $response->getBody();
    $bytes = (string) $body;
    $body->close();

    return $response->withBody((new StreamFactory())->createStream($bytes));
}

function body(ResponseInterface $response): mixed
{
    return json_decode((string) $response->getBody(), true);
}

/** An upload as the browser sends one: a file of the test's own, under the name the browser gives it. */
function upload(string $name, string $bytes): UploadedFile
{
    $file = testTempDir('upload') . '/incoming';
    file_put_contents($file, $bytes);

    return new UploadedFile($file, $name, 'application/octet-stream', strlen($bytes));
}

$pdo = getDb();

// ── Who a request is ────────────────────────────────────────────────────────

echo "Who a request is: the library's Identify\n";

$bad = send('GET', '/api/regions', null, null, ['Authorization' => 'Bearer not.a.token']);
same('a token that does not verify, on a public route: 401 invalid_token, in this API\'s {error, code}', [401, 'invalid_token', true], [$bad->getStatusCode(), body($bad)['code'] ?? null, is_string(body($bad)['error'] ?? null)]);
check('...with the challenge that says so', str_contains($bad->getHeaderLine('WWW-Authenticate'), 'error="invalid_token"'), $bad->getHeaderLine('WWW-Authenticate'));
foreach (['/api/settings/public', '/api/translations/en', '/api/site-status'] as $path) {
    same("...but $path reads no token at all: 200", 200, send('GET', $path, null, null, ['Authorization' => 'Bearer not.a.token'])->getStatusCode());
}
// The server's own copies of the header - what php-fpm, CGI and `php -S` hand
// PHP, and the library's Bearer reads when the header itself is not there.
$asServerSends = function (string $path, string $param): int {
    global $app;
    $request = (new ServerRequestFactory())->createServerRequest('GET', 'http://localhost' . $path, ['REMOTE_ADDR' => '127.0.0.1', $param => 'Bearer not.a.token']);

    return $app->handle($request)->getStatusCode();
};
same('a token that does not verify in the server\'s HTTP_AUTHORIZATION: 401 on a public route...', 401, $asServerSends('/api/regions', 'HTTP_AUTHORIZATION'));
foreach (['HTTP_AUTHORIZATION', 'REDIRECT_HTTP_AUTHORIZATION'] as $param) {
    same("...and in $param, never on the boot or the words: 200, 200", [200, 200], [$asServerSends('/api/settings/public', $param), $asServerSends('/api/translations/en', $param)]);
}
same('`Basic ...` claims nobody: the public route answers', 200, send('GET', '/api/regions', null, null, ['Authorization' => 'Basic dXNlcjpwYXNz'])->getStatusCode());
$me = send('GET', '/api/me');
same('nobody on a route that needs somebody: 401 sign_in_required', [401, 'sign_in_required'], [$me->getStatusCode(), body($me)['code'] ?? null]);
$me = body(send('GET', '/api/me', MEMBER));
same('/api/me: the address the token carries (no copy kept), the first visit as ISO 8601 UTC', ['person3@example.test', 'USER', 1], [$me['email'] ?? null, $me['role'] ?? null, preg_match('/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/', (string) ($me['created_at'] ?? ''))]);
same('...and this site\'s record of them has no address column at all', [false, 'person3'], [(bool) $pdo->query("SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email'")->fetchColumn(), $pdo->query('SELECT username FROM users WHERE id = 3')->fetchColumn()]);
$auth = body(send('GET', '/api/settings/public'))['auth'] ?? [];
same('the boot answer: the library\'s configuration, sign_in_available beside login_required, and the two links', [TEST_ISSUER, 'genshin', false, true, TEST_ISSUER . '/account', TEST_ISSUER . '/admin'], [$auth['issuer'] ?? null, $auth['client_id'] ?? null, $auth['login_required'] ?? null, $auth['sign_in_available'] ?? null, $auth['account_url'] ?? null, $auth['admin_url'] ?? null]);
same('a visitor\'s key is not read on a public route', 200, send('GET', '/api/regions', null, null, ['X-Visitor-Key' => 'nonsense'])->getStatusCode());
$owner = send('GET', '/api/quiz/progress', null, null, ['X-Visitor-Key' => 'nonsense']);
same('...an owner route reads it, as before: 401 visitor_unknown, private', [401, 'visitor_unknown', 'private, no-store'], [$owner->getStatusCode(), body($owner)['code'] ?? null, $owner->getHeaderLine('Cache-Control')]);
same('...a bad token there never falls back to the key: 401 invalid_token', [401, 'invalid_token'], (function (): array {
    $response = send('GET', '/api/quiz/progress', null, null, ['Authorization' => 'Bearer x.y.z', 'X-Visitor-Key' => 'nonsense']);
    return [$response->getStatusCode(), body($response)['code'] ?? null];
})());

// ── Who may ─────────────────────────────────────────────────────────────────

echo "Who may: the ADMIN alone, on every admin tool and the Migrations page\n";

foreach ([
    ['GET', '/api/admin/errors'], ['GET', '/api/admin/audit'], ['GET', '/api/admin/audit/facets'],
    ['GET', '/api/admin/feedback'], ['GET', '/api/admin/feedback/facets'], ['GET', '/api/admin/feedback/unread'],
    ['GET', '/api/admin/backups'], ['GET', '/api/admin/backups/proof'], ['GET', '/api/admin/files/roots'],
    ['GET', '/api/admin/files/assets'], ['GET', '/api/admin/people'], ['POST', '/api/admin/people/sync'],
    ['GET', '/api/admin/migrations'],
] as [$method, $path]) {
    $answers = array_map(fn (?int $as) => send($method, $path, $as), [null, MEMBER, EDITOR, ADMIN]);
    same("$method $path: nobody 401 sign_in_required, a MEMBER and an EDITOR 403 forbidden, the ADMIN 200", [[401, 'sign_in_required'], [403, 'forbidden'], [403, 'forbidden'], 200], [
        [$answers[0]->getStatusCode(), body($answers[0])['code'] ?? null],
        [$answers[1]->getStatusCode(), body($answers[1])['code'] ?? null],
        [$answers[2]->getStatusCode(), body($answers[2])['code'] ?? null],
        $answers[3]->getStatusCode(),
    ]);
}
foreach ([
    ['POST', '/api/admin/backups', ['description' => 'by an EDITOR']],
    ['DELETE', '/api/admin/errors', null],
    ['DELETE', '/api/admin/people/' . MEMBER, null],
    ['POST', '/api/admin/files/assets/folder', ['path' => 'made-by-editor']],
    ['DELETE', '/api/admin/files/assets?path=character/icon/AMBER.png', null],
    ['POST', '/api/admin/migrations/apply', null],
] as [$method, $path, $json]) {
    same("$method $path: nobody 401, a MEMBER 403, an EDITOR 403", [401, 403, 403], array_map(fn (?int $as) => send($method, $path, $as, $json)->getStatusCode(), [null, MEMBER, EDITOR]));
}
same('...and nothing they sent was kept: no backup, no folder, the picture where it was', [0, false, true], [
    count(glob("$backend/storage/backups/*.anotoki-backup") ?: []),
    is_dir("$backend/assets/made-by-editor"),
    is_file("$backend/assets/character/icon/AMBER.png"),
]);

// ── The audit log ───────────────────────────────────────────────────────────

echo "The audit log: the library's, written by the site's content\n";

$created = send('POST', '/api/backgrounds', EDITOR, ['name' => 'Test sky']);
same('an EDITOR adds a background: 201', 201, $created->getStatusCode());
$id = (string) (body($created)['id'] ?? '');
$entry = $pdo->query("SELECT action, target_type, target_id, scope_type, scope_id, actor_id, actor_session, details::text AS details, ip FROM anotoki_audit_log WHERE target_type = 'backgrounds' ORDER BY id DESC LIMIT 1")->fetch();
same('...written down: content.insert on the row, filed under itself, by the EDITOR from their IAM session, no address', ['content.insert', 'backgrounds', $id, 'backgrounds', $id, EDITOR, 'sid-' . EDITOR, 'Test sky', null], [
    $entry['action'] ?? null, $entry['target_type'] ?? null, $entry['target_id'] ?? null, $entry['scope_type'] ?? null, $entry['scope_id'] ?? null,
    (int) ($entry['actor_id'] ?? 0), $entry['actor_session'] ?? null, json_decode((string) ($entry['details'] ?? '{}'), true)['name'] ?? null, is_array($entry) && array_key_exists('ip', $entry) ? $entry['ip'] : 'x',
]);
$page = body(send('GET', '/api/admin/audit?action=content.&target_type=backgrounds', ADMIN));
same('the Audit page: the entry, with the name of who did it', ['content.insert', 'person' . EDITOR], [$page['items'][0]['action'] ?? null, $page['items'][0]['actor_username'] ?? null]);
same('...found by a name typed into "who"', 1, body(send('GET', '/api/admin/audit?actor=person2&target_type=backgrounds', ADMIN))['total'] ?? null);

// ── Feedback ────────────────────────────────────────────────────────────────

echo "Feedback: the visitors' form and the admin page\n";

$sent = send('POST', '/api/feedback', null, ['kind' => 'bug', 'section' => 'Quiz - Music', 'subject' => 'Music stops', 'message' => 'It stops after the third round.',
    'details' => ['steps_to_reproduce' => '1. open it', 'not_a_field' => 'dropped'], 'page' => '/quiz/music?round=3', 'language' => 'sk', 'email' => 'reader@example.test']);
same('nobody sends a bug: 201 {ok: true}, no id handed out', [201, ['ok' => true]], [$sent->getStatusCode(), body($sent)]);
$kept = $pdo->query("SELECT kind, section, subject, details::text AS details, contact_email, user_id, page, language FROM anotoki_feedback ORDER BY id DESC LIMIT 1")->fetch();
same('...kept: its fields by this site\'s names only, the page without its query, the address given, nobody\'s', ['bug', 'Quiz - Music', 'Music stops', ['steps_to_reproduce' => '1. open it'], 'reader@example.test', null, '/quiz/music', 'sk'], [
    $kept['kind'], $kept['section'], $kept['subject'], json_decode((string) $kept['details'], true), $kept['contact_email'], $kept['user_id'], $kept['page'], $kept['language'],
]);
same('...and nothing of where it came from: no address, no hash, anywhere in the table', 0, (int) $pdo->query("SELECT count(*) FROM information_schema.columns WHERE table_name = 'anotoki_feedback' AND column_name IN ('ip', 'submitter_hash', 'client_hash')")->fetchColumn());
send('POST', '/api/feedback', MEMBER, ['kind' => 'idea', 'subject' => 'More', 'message' => 'More bows.', 'details' => ['why_important' => 'I play a bow user'], 'email' => 'person3@example.test']);
same('a signed-in sender: their id, and the address they left in the field (the page fills it with their account\'s)', [MEMBER, 'person3@example.test'], array_map(fn ($v) => is_numeric($v) ? (int) $v : $v, array_values($pdo->query('SELECT user_id, contact_email FROM anotoki_feedback ORDER BY id DESC LIMIT 1')->fetch())));
send('POST', '/api/feedback', EDITOR, ['kind' => 'other', 'message' => 'The field cleared.']);
same('...one who cleared the field: their id, and no address - the account\'s is never taken from the token', [EDITOR, null], array_map(fn ($v) => is_numeric($v) ? (int) $v : $v, array_values($pdo->query('SELECT user_id, contact_email FROM anotoki_feedback ORDER BY id DESC LIMIT 1')->fetch())));
send('POST', '/api/feedback', MEMBER, ['kind' => 'other', 'message' => 'Quietly.', 'anonymous' => true]);
same('...sent without their name: neither', [null, null], array_values($pdo->query('SELECT user_id, contact_email FROM anotoki_feedback ORDER BY id DESC LIMIT 1')->fetch()));
$count = (int) $pdo->query('SELECT count(*) FROM anotoki_feedback')->fetchColumn();
$trap = send('POST', '/api/feedback', null, ['kind' => 'other', 'message' => 'Buy now', 'website' => 'https://spam.example']);
same('the robots\' field filled: the same 201, nothing kept', [201, ['ok' => true], $count], [$trap->getStatusCode(), body($trap), (int) $pdo->query('SELECT count(*) FROM anotoki_feedback')->fetchColumn()]);
same('a bug without a subject: 422 subject_required', [422, 'subject_required'], (function (): array {
    $response = send('POST', '/api/feedback', null, ['kind' => 'bug', 'message' => 'x']);
    return [$response->getStatusCode(), body($response)['code'] ?? null];
})());
same('a place the form does not offer: 422 section_unknown', [422, 'section_unknown'], (function (): array {
    $response = send('POST', '/api/feedback', null, ['kind' => 'other', 'message' => 'x', 'section' => 'Elsewhere']);
    return [$response->getStatusCode(), body($response)['code'] ?? null];
})());
$statuses = [];
for ($i = 0; $i < 6; $i++) {
    $statuses[] = send('POST', '/api/feedback', null, ['kind' => 'other', 'message' => "flood $i"])->getStatusCode();
}
// From this address so far: nobody's bug and the message "without my name" -
// counted as a visitor's, by the address (the signed-in ones by their accounts,
// apart; the robots' field and the refusals count nothing).
same('five an hour from one visitor\'s address: three more of the hour, then 429 too_many', [201, 201, 201, 429, 429, 429], $statuses);
same('...a person signed in from the same address: their account\'s own five', 201, send('POST', '/api/feedback', ADMIN, ['kind' => 'other', 'message' => 'Signed in, from a busy address.'])->getStatusCode());

$list = body(send('GET', '/api/admin/feedback?kind=idea', ADMIN));
same('the Feedback page: the idea, with its sender\'s name', [1, 'person' . MEMBER], [$list['total'] ?? null, $list['items'][0]['user_name'] ?? null]);
same('...the new ones counted for the badge', (int) $pdo->query("SELECT count(*) FROM anotoki_feedback WHERE status = 'new'")->fetchColumn(), body(send('GET', '/api/admin/feedback/unread', ADMIN))['unread'] ?? null);
$idea = (int) ($list['items'][0]['id'] ?? 0);
same('opening one marks it read', 'read', body(send('GET', "/api/admin/feedback/$idea", ADMIN))['message']['status'] ?? null);
same('marked resolved by the ADMIN: 200, audited', [200, 1], [send('PUT', "/api/admin/feedback/$idea/status", ADMIN, ['status' => 'resolved'])->getStatusCode(), (int) $pdo->query("SELECT count(*) FROM anotoki_audit_log WHERE action = 'feedback.status_changed' AND actor_id = " . ADMIN)->fetchColumn()]);

// ── The error log ───────────────────────────────────────────────────────────

echo "The error log: the library's, in a folder of its own\n";

send('GET', '/api/no-such-route?token=secret-value');
$lines = [];
foreach (glob("$backend/storage/error-log/errors-*.jsonl") ?: [] as $file) {
    $lines = [...$lines, ...array_map(fn ($line) => json_decode($line, true), file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [])];
}
$missing = array_values(array_filter($lines, fn ($line) => ($line['path'] ?? null) === '/api/no-such-route'))[0] ?? null;
same('an unknown route: a line - its status, its path without the query', [404, '/api/no-such-route'], [$missing['status'] ?? null, $missing['path'] ?? null]);
check('...and nothing of the query, nowhere in the log', !str_contains(implode("\n", array_map(fn ($file) => (string) file_get_contents($file), glob("$backend/storage/error-log/*") ?: [])), 'secret-value'));
$statuses = array_values(array_unique(array_map(fn ($line) => $line['status'] ?? null, $lines)));
sort($statuses);
same('the family\'s rule (the owner\'s decision): of every answer so far only the 404 and the feedback form\'s 429 are written - never the 401s, 403s and 422s, the API doing its job', [404, 429], $statuses);
$report = body(send('GET', '/api/admin/errors?days=1', ADMIN));
check('the Error log page groups them', ($report['total'] ?? 0) > 0 && in_array(404, array_column($report['groups'] ?? [], 'status'), true));
same('the site\'s own old log files stay where they are, untouched', '{"at":"2020-01-01 10:00:00","level":"error","status":500}' . "\n", (string) @file_get_contents("$backend/storage/logs/errors-2020-01-01.jsonl"));

echo "The pages' own errors: POST /api/client-errors (anotoki-lib 0.5.0)\n";

/** Every line of the error log, oldest first. */
function logLines(string $backend): array
{
    $lines = [];
    foreach (glob("$backend/storage/error-log/errors-*.jsonl") ?: [] as $file) {
        foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
            $lines[] = json_decode($line, true);
        }
    }

    return $lines;
}

/** The error log's lines the pages reported (source client), oldest first. */
function clientLines(string $backend): array
{
    return array_values(array_filter(logLines($backend), fn (mixed $entry): bool => ($entry['source'] ?? null) === 'client'));
}

/** How many of the error log's lines say $code. */
function linesSaying(string $backend, string $code): int
{
    return count(array_filter(logLines($backend), fn (mixed $entry): bool => ($entry['code'] ?? null) === $code));
}

$secrets = ['reader@example.test', '198.51.100.23', 'hunter22', 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiI3In0.c2lnbmF0dXJlLXZhbHVl'];
$thrown = send('POST', '/api/client-errors', null, [
    'type' => 'TypeError',
    'message' => "Cannot read 'name' of undefined for reader@example.test at 198.51.100.23 with Bearer {$secrets[3]} and password=hunter22",
    'page' => '/quiz/music',
    'stack' => ["TypeError: Cannot read 'name' of undefined", '    at play (https://genshin.example/main.js:1:2345)'],
]);
same('a visitor\'s page reports a thrown error: 204, nothing in the answer', [204, ''], [$thrown->getStatusCode(), (string) $thrown->getBody()]);
$reported = clientLines($backend)[0] ?? [];
same('...in the error log as the page\'s own: its type, its page, its frame, nobody signed in', ['client', 'TypeError', '/quiz/music', 1, null], [
    $reported['source'] ?? null, $reported['type'] ?? null, $reported['path'] ?? null, count($reported['trace'] ?? []), array_key_exists('user_id', $reported) ? $reported['user_id'] : 'x',
]);
check('...scrubbed: no e-mail address, no address, no token, no password', array_filter($secrets, fn (string $secret) => str_contains(json_encode($reported), $secret)) === [], json_encode($reported));
check('...where from: a keyed hash of the address bucket, never the address', preg_match('/^[0-9a-f]{12}$/D', (string) ($reported['client'] ?? '')) === 1, (string) ($reported['client'] ?? ''));
same('not JSON: 415', 415, send('POST', '/api/client-errors', null, 'It broke.', ['Content-Type' => 'text/plain'])->getStatusCode());
same('no message: 422 message_required', [422, 'message_required'], (function (): array {
    $response = send('POST', '/api/client-errors', null, ['type' => 'Error', 'message' => '  ']);
    return [$response->getStatusCode(), body($response)['code'] ?? null];
})());
same('more than 8 KB: 413', 413, send('POST', '/api/client-errors', null, ['message' => str_repeat('x', 9000)])->getStatusCode());
$statuses = [];
for ($i = 2; $i <= 21; $i++) {
    $statuses[] = send('POST', '/api/client-errors', null, ['message' => "Again and again $i"])->getStatusCode();
}
$capped = send('POST', '/api/client-errors', null, ['message' => 'One more']);
same('20 an hour from one visitor: the 20th of the hour is the last, then 429 too_many with its wait', [array_fill(0, 19, 204), 429, 429, 'too_many', true], [
    array_slice($statuses, 0, 19), $statuses[19], $capped->getStatusCode(), body($capped)['code'] ?? null, (int) $capped->getHeaderLine('Retry-After') > 0,
]);
same('...20 lines written for them, no more', 20, count(clientLines($backend)));
$person = send('POST', '/api/client-errors', MEMBER, ['message' => 'From somebody signed in, at the same address']);
$written = clientLines($backend);
same('...a person signed in from the same address: their account\'s own 20 - written, theirs', [204, 21, MEMBER], [$person->getStatusCode(), count($written), (int) (end($written)['user_id'] ?? 0)]);
check('...and the route\'s own answers are never lines of the log (no 413, 415, 422 or 429 of it)', array_filter(
    (function () use ($backend): array {
        $lines = [];
        foreach (glob("$backend/storage/error-log/errors-*.jsonl") ?: [] as $file) {
            $lines = [...$lines, ...array_map(fn ($line) => json_decode($line, true), file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [])];
        }
        return $lines;
    })(),
    fn (array $line): bool => ($line['path'] ?? null) === '/api/client-errors',
) === []);

// ── Backups ─────────────────────────────────────────────────────────────────

echo "Backups: made, downloaded by a ticket, restored\n";

// Somebody who signs in now, before the backup - and whom the IAM deletes after it.
$tokens[9] = ($iam['token'])(9, ['MEMBER']);
same('a person signed in before the backup: this site\'s record of them', 'person9', (function () use ($pdo): mixed {
    send('GET', '/api/me', 9);
    return $pdo->query('SELECT username FROM users WHERE id = 9')->fetchColumn();
})());
// And somebody with a game of their own here and a message sent, both kept by
// the backup - and both deleted after it, on the People and Feedback pages.
const PLAYER = 12;
$tokens[PLAYER] = ($iam['token'])(PLAYER, ['MEMBER']);
$played = send('PUT', '/api/quiz/progress/dish', PLAYER, ['state' => ['tries' => ['Amber'], 'isQuestionComplete' => false]]);
$doomedSent = send('POST', '/api/feedback', PLAYER, ['kind' => 'other', 'message' => 'Deleted after the backup.']);
$doomed = (int) $pdo->query("SELECT id FROM anotoki_feedback WHERE message = 'Deleted after the backup.'")->fetchColumn();
$gamesOf = fn (int $sub): int => (int) $pdo->query("SELECT count(*) FROM quizzes_states WHERE user_id = $sub")->fetchColumn();
same('a player with a saved game here and a message sent, before the backup', [200, 201, 1, true], [$played->getStatusCode(), $doomedSent->getStatusCode(), $gamesOf(PLAYER), $doomed > 0]);
send('GET', '/api/me', ADMIN);
same('the proof is a sign-in of the last ten minutes', 'recent_sign_in', body(send('GET', '/api/admin/backups/proof', ADMIN))['kind'] ?? null);
$stale = send('POST', '/api/admin/backups', STALE_ADMIN, ['description' => 'stale']);
same('an ADMIN who signed in an hour ago: 403 reauth_required', [403, 'reauth_required'], [$stale->getStatusCode(), body($stale)['code'] ?? null]);
$made = send('POST', '/api/admin/backups', FRESH_ADMIN, ['description' => 'Before the test']);
$backup = body($made)['backup'] ?? [];
same('an ADMIN who signed in a minute ago: 201, a manual backup', [201, 'manual'], [$made->getStatusCode(), $backup['kind'] ?? null]);
same('...audited', 1, (int) $pdo->query("SELECT count(*) FROM anotoki_audit_log WHERE action = 'backup.created' AND actor_id = " . ADMIN)->fetchColumn());
$listed = body(send('GET', '/api/admin/backups', ADMIN));
same('the list: that backup alone - the old pg_dump folder is no backup of the library\'s', [$backup['id'] ?? null], array_column($listed['backups'] ?? [], 'id'));
check('...and it stays where it is, untouched', is_file("$backend/storage/backups/20200101-100000-abcdef/backup.json"));
$listedMade = array_column($listed['backups'] ?? [], null, 'id')[$backup['id']] ?? [];
same('...made by whom, by name (the context\'s names: this site\'s record), sealed by this installation, restorable here', ['person' . ADMIN, true, true], [
    $listedMade['created_by_name'] ?? null, $listedMade['sealed'] ?? null, $listedMade['restorable'] ?? null,
]);
$archive = "$backend/storage/backups/{$backup['id']}.anotoki-backup";
check('...its files the site\'s own user\'s alone (0600) - where the system keeps such modes', PHP_OS_FAMILY === 'Windows' || ((fileperms($archive) & 0777) === 0600 && (fileperms("$archive.json") & 0777) === 0600), sprintf('%o %o', fileperms($archive) & 0777, fileperms("$archive.json") & 0777));
$ticket = body(send('POST', '/api/admin/backups/' . $backup['id'] . '/ticket', FRESH_ADMIN));
$url = (string) ($ticket['url'] ?? '');
check('a download ticket: a link under the route, good for a minute', str_starts_with($url, '/api/admin/backups/' . $backup['id'] . '/file?ticket=') && ($ticket['expires_in'] ?? 0) === 60, $url);
$file = send('GET', $url);
same('the link, opened with no token: the archive, as an attachment', [200, true, 'application/octet-stream'], [$file->getStatusCode(), str_starts_with((string) $file->getBody(), 'ANOTOKI-BACKUP 1'), $file->getHeaderLine('Content-Type')]);
same('...once: the same link again is 403 ticket_invalid', [403, 'ticket_invalid'], [send('GET', $url)->getStatusCode(), body(send('GET', $url))['code'] ?? null]);
$pdo->exec("INSERT INTO regions (name) VALUES ('Testland')");
// The IAM deletes person 9 after the backup, and the scrub here takes their name.
file_put_contents($anonymizedFile, json_encode(['accounts' => [['sub' => '9', 'anonymized_at' => gmdate('Y-m-d\TH:i:s\Z')]]]));
same('the IAM deleted person 9 since the backup: Check now scrubs them', [200, 'deleted-9'], [send('POST', '/api/admin/people/sync', ADMIN)->getStatusCode(), $pdo->query('SELECT username FROM users WHERE id = 9')->fetchColumn()]);
$deletedSince = send('DELETE', '/api/admin/people/' . PLAYER, ADMIN);
same('the People page deletes the player\'s games since the backup: 200, gone', [200, 1, 0], [$deletedSince->getStatusCode(), body($deletedSince)['deleted']['Saved games'] ?? null, $gamesOf(PLAYER)]);
same('...and the Feedback page their message: 200, gone', [200, 0], [send('DELETE', "/api/admin/feedback/$doomed", ADMIN)->getStatusCode(), (int) $pdo->query("SELECT count(*) FROM anotoki_feedback WHERE id = $doomed")->fetchColumn()]);
$restored = send('POST', '/api/admin/backups/' . $backup['id'] . '/restore', FRESH_ADMIN, ['confirm' => substr((string) $backup['id'], -6)]);
same('a restore, with the backup\'s last six characters: 200, nothing after it failed', [200, null], [$restored->getStatusCode(), body($restored)['after_restore_error'] ?? null]);
same('...the database as it was: the region added since is gone, the audit log kept (its entry in it)', [0, 1], [
    (int) $pdo->query("SELECT count(*) FROM regions WHERE name = 'Testland'")->fetchColumn(),
    (int) $pdo->query("SELECT count(*) FROM anotoki_audit_log WHERE action = 'backup.restored'")->fetchColumn(),
]);
same('...what was deleted since done again inside it: the player\'s game and their message stay deleted, their record kept', [0, 0, 1], [
    $gamesOf(PLAYER),
    (int) $pdo->query("SELECT count(*) FROM anotoki_feedback WHERE id = $doomed")->fetchColumn(),
    (int) $pdo->query('SELECT count(*) FROM users WHERE id = ' . PLAYER)->fetchColumn(),
]);
same('...and the scrub ran with the restore, once it committed: person 9 is not named again, with no request after it', ['deleted-9', true], [
    $pdo->query('SELECT username FROM users WHERE id = 9')->fetchColumn(),
    (bool) $pdo->query('SELECT anonymized_at IS NOT NULL FROM users WHERE id = 9')->fetchColumn(),
]);

// A plain backup made before 0.5.0 carries no seal - nor does a copy from
// another installation, or one changed since: listed, never restored here.
$sidecar = (string) file_get_contents("$archive.json");
$unsealed = json_decode($sidecar, true);
unset($unsealed['seal']);
file_put_contents("$archive.json", json_encode($unsealed));
$listedUnsealed = array_column(body(send('GET', '/api/admin/backups', ADMIN))['backups'] ?? [], null, 'id')[$backup['id']] ?? [];
$refusedUnsealed = send('POST', '/api/admin/backups/' . $backup['id'] . '/restore', FRESH_ADMIN, ['confirm' => substr((string) $backup['id'], -6)]);
same('a backup without this installation\'s seal: listed (sealed: false, not restorable here), its restore refused 422 archive_invalid', [false, false, 422, 'archive_invalid'], [
    $listedUnsealed['sealed'] ?? null, $listedUnsealed['restorable'] ?? null, $refusedUnsealed->getStatusCode(), body($refusedUnsealed)['code'] ?? null,
]);
file_put_contents("$archive.json", $sidecar);

// A scrub that cannot finish (the IAM out of reach): the restore says so, and
// the upkeep's stamp goes after the answer, so the next request checks again.
afterResponseQueue();
$stamp = siteIam()->cacheDirectory() . '/' . \Anotoki\Lib\People\Http\PeopleUpkeep::STAMP;
file_put_contents($stamp, (string) time());
rename($anonymizedFile, "$anonymizedFile.away");
$unchecked = send('POST', '/api/admin/backups/' . $backup['id'] . '/restore', FRESH_ADMIN, ['confirm' => substr((string) $backup['id'], -6)]);
// Since anotoki-lib 0.6.0 no answer carries a failure's own words (a path, a host): the library's fixed sentence,
// and what failed goes to the site's error log (the Backups' onError).
$afterError = (string) (body($unchecked)['after_restore_error'] ?? '');
same('a restore whose scrub could not run: 200, and after_restore_error says so - in the library\'s fixed sentence, never the failure\'s own words', [200, true, false], [
    $unchecked->getStatusCode(), str_contains($afterError, 'The error log says what'), str_contains($afterError, 'were not checked again'),
]);
check('...and the error log says why: the accounts the IAM deleted were not checked again', str_contains(implode("\n", array_map(fn ($file) => (string) file_get_contents($file), glob("$backend/storage/error-log/errors-*.jsonl") ?: [])), 'were not checked again'));
check('...the upkeep\'s stamp is still there until the answer is out', is_file($stamp));
afterResponseRun();
check('...and gone after it, so the next request runs the scrub again', !is_file($stamp));
rename("$anonymizedFile.away", $anonymizedFile);

// ── The file explorer ───────────────────────────────────────────────────────

echo "The file explorer: the asset tree and public/uploads/, by the library's rules\n";

same('the roots: the asset tree and the uploads folder', ['assets', 'uploads'], array_column(body(send('GET', '/api/admin/files/roots', ADMIN))['roots'] ?? [], 'name'));
same('the asset tree is listed from a snapshot: Rescan takes it', 200, send('POST', '/api/admin/files/assets/rescan', ADMIN)->getStatusCode());
$icons = body(send('GET', '/api/admin/files/assets?path=character/icon', ADMIN));
$byName = array_column($icons['files'] ?? [], null, 'name');
same('a folder\'s files, the old ones the rules would refuse today among them', ['AMBER.png', 'old.php.png', 'old.svg'], array_keys($byName));
$raw = send('GET', (string) ($byName['old.php.png']['url'] ?? ''));
same('...one with a second extension that could run: listed, previewed by its own (a picture), sandboxed, never run', ['image', 200, 'image/png', 'nosniff', true], [
    $byName['old.php.png']['preview'] ?? null, $raw->getStatusCode(), $raw->getHeaderLine('Content-Type'), $raw->getHeaderLine('X-Content-Type-Options'), str_contains($raw->getHeaderLine('Content-Security-Policy'), 'sandbox'),
]);
$raw = send('GET', (string) ($byName['old.svg']['url'] ?? ''));
same('...one of a kind the root does not take (SVG): listed, downloaded as a file, never shown', ['download', 200, true, 'application/octet-stream'], [
    $byName['old.svg']['preview'] ?? null, $raw->getStatusCode(), str_starts_with($raw->getHeaderLine('Content-Disposition'), 'attachment'), $raw->getHeaderLine('Content-Type'),
]);
same('...a move to a name it could run under is refused', [422, 'name_runs_on_server'], (function (): array {
    $response = send('POST', '/api/admin/files/assets/move', ADMIN, ['from' => 'character/icon/old.svg', 'to' => 'character/icon/old.php']);
    return [$response->getStatusCode(), body($response)['code'] ?? null];
})());
same('a picture\'s link: inline', [200, 'image/png'], (function () use ($byName): array {
    $response = send('GET', (string) ($byName['AMBER.png']['url'] ?? ''));
    return [$response->getStatusCode(), $response->getHeaderLine('Content-Type')];
})());
same('a link that was tampered with: 404', 404, send('GET', str_replace('sig=', 'sig=0', (string) ($byName['AMBER.png']['url'] ?? '')))->getStatusCode());
// A preview's link alone reads a file. Signed under the installation's key
// (storage/anotoki-lib.key, the library's default), whoever can write the
// storage folder could make that key their own and sign links; this site signs
// them under its own secret, which lives outside storage/.
$link = (string) ($byName['AMBER.png']['url'] ?? '');
parse_str((string) parse_url($link, PHP_URL_QUERY), $linked);
$signedWith = fn (string $key): string => rtrim(strtr(base64_encode(hash_hmac('sha256', $linked['root'] . "\n" . $linked['path'] . "\n" . $linked['exp'], $key, true)), '+/', '-_'), '=');
same('a preview link is signed under this site\'s own secret (its \'file-preview\' key)', $linked['sig'] ?? null, $signedWith(\Anotoki\Lib\Support\Keys::derive((string) localSecret(), 'file-preview')));
$forged = [];
foreach (["$backend/storage", "$backend/storage/explorer"] as $storage) {
    $installationKey = \Anotoki\Lib\Support\Keys::derive(\Anotoki\Lib\Support\Keys::installation($storage), 'file-preview');
    $forged[] = send('GET', str_replace('sig=' . $linked['sig'], 'sig=' . $signedWith($installationKey), $link))->getStatusCode();
}
same('...one signed under the installation\'s key (in storage/, or the explorer\'s storage/explorer/) is refused: 404, nothing read', [404, 404], $forged);
$up = body(send('POST', '/api/admin/files/assets/upload', ADMIN, null, [], [upload('Lumine 5.0.png', base64_decode(PNG)), upload('shell.php.png', base64_decode(PNG)), upload('page.png', '<html><script>x</script></html>')], ['path' => 'character/icon']));
same('an upload of three: one kept - under one extension, every other dot a dash - two refused, each saying why', [1, 2, 'Lumine 5-0.png', 'name_runs_on_server', 'content_mismatch'], [
    $up['uploaded'] ?? null, $up['refused'] ?? null, $up['files'][0]['stored_as'] ?? null, $up['files'][1]['code'] ?? null, $up['files'][2]['code'] ?? null,
]);
same('...the folder got this site\'s guard before the first write (no script, nosniff, anything but a picture as a download)', uploadGuardHtaccess(), (string) @file_get_contents("$backend/assets/.htaccess"));
same('...the upload is in the catalogue, under its folder\'s category', 1, (int) $pdo->query("SELECT count(*) FROM files WHERE name LIKE '%Lumine 5-0'")->fetchColumn());
same('...and audited', 1, (int) $pdo->query("SELECT count(*) FROM anotoki_audit_log WHERE action = 'file.uploaded'")->fetchColumn());
$trashed = send('DELETE', '/api/admin/files/assets?path=' . rawurlencode('character/icon/old.php.png'), ADMIN);
same('the old file, put in the trash: never deleted outright', [200, false, 1], [$trashed->getStatusCode(), is_file("$backend/assets/character/icon/old.php.png"), count(body(send('GET', '/api/admin/files/assets/trash', ADMIN))['items'] ?? [])]);
check('...in the explorer\'s own storage, apart from the Files page\'s trash', (glob("$backend/storage/explorer/trash/assets/character/icon/*old.php.png") ?: []) !== [] && !is_dir("$backend/storage/trash/assets"));

echo "The explorer keeps every link the site's content has to a file\n";

foreach (['regions', 'roles', 'regions/sub', 'nowhere'] as $folder) {
    send('POST', '/api/admin/files/assets/folder', ADMIN, ['path' => $folder]);
}
send('POST', '/api/admin/files/assets/upload', ADMIN, null, [], [upload('Liyue.png', base64_decode(PNG))], ['path' => 'regions']);
$catalogued = fn (int $id): array => (array) $pdo->query("SELECT c.path, f.name, f.extension FROM files f JOIN file_categories c ON c.id = f.category_id WHERE f.id = $id")->fetch(PDO::FETCH_NUM);
$iconId = (int) $pdo->query("SELECT f.id FROM files f JOIN file_categories c ON c.id = f.category_id WHERE c.path = 'regions' AND f.name = 'Liyue' AND f.extension = 'png'")->fetchColumn();
$pdo->exec("INSERT INTO regions (name, icon_file_id) VALUES ('Harbor of the test', $iconId)");
$icon = fn (): int => (int) $pdo->query("SELECT icon_file_id FROM regions WHERE name = 'Harbor of the test'")->fetchColumn();
check('a region\'s icon, catalogued by its upload', $iconId > 0 && $icon() === $iconId);

$renamed = send('POST', '/api/admin/files/assets/move', ADMIN, ['from' => 'regions/Liyue.png', 'to' => 'regions/Liyue Harbor.png']);
same('renamed: the same row under its new name, the region\'s icon still it', [200, ['regions', 'Liyue Harbor', 'png'], $iconId], [$renamed->getStatusCode(), $catalogued($iconId), $icon()]);
send('POST', '/api/admin/files/assets/move', ADMIN, ['from' => 'regions/Liyue Harbor.png', 'to' => 'roles/Liyue Harbor.png']);
same('moved into another category\'s folder: the same row, in that category', [['roles', 'Liyue Harbor', 'png'], $iconId], [$catalogued($iconId), $icon()]);
send('POST', '/api/admin/files/assets/move', ADMIN, ['from' => 'roles/Liyue Harbor.png', 'to' => 'regions/sub/Liyue Harbor.png']);
$folder = send('POST', '/api/admin/files/assets/move', ADMIN, ['from' => 'regions/sub', 'to' => 'regions/kept']);
same('its folder renamed: every row under it follows, the same ids', [200, ['regions', 'kept/Liyue Harbor', 'png'], $iconId], [$folder->getStatusCode(), $catalogued($iconId), $icon()]);
same('...each move audited on the row (catalogue.move), the folder\'s once', [3, 1], [
    (int) $pdo->query("SELECT count(*) FROM anotoki_audit_log WHERE action = 'catalogue.move' AND target_id = '$iconId'")->fetchColumn(),
    (int) $pdo->query("SELECT count(*) FROM anotoki_audit_log WHERE action = 'catalogue.move' AND target_id = '0' AND details->>'from' = 'regions/sub'")->fetchColumn(),
]);

$inUse = send('DELETE', '/api/admin/files/assets?path=' . rawurlencode('regions/kept/Liyue Harbor.png'), ADMIN);
same('a file the content shows, put in the trash: 409 file_in_use, saying where - and nothing moved', [409, 'file_in_use', ['regions.icon_file_id' => 1], true, $iconId], [
    $inUse->getStatusCode(), body($inUse)['code'] ?? null, body($inUse)['used_by'] ?? null, is_file("$backend/assets/regions/kept/Liyue Harbor.png"), $icon(),
]);
check('...in this site\'s words: what uses it, and what to do instead', str_contains((string) (body($inUse)['error'] ?? ''), 'regions.icon_file_id: 1') && str_contains((string) (body($inUse)['error'] ?? ''), 'rename or move it instead'), (string) (body($inUse)['error'] ?? ''));
$stranded = send('POST', '/api/admin/files/assets/move', ADMIN, ['from' => 'regions/kept/Liyue Harbor.png', 'to' => 'nowhere/Liyue Harbor.png']);
same('moved where no category claims it: 409 not_catalogued, nothing moved', [409, 'not_catalogued', true], [$stranded->getStatusCode(), body($stranded)['code'] ?? null, is_file("$backend/assets/regions/kept/Liyue Harbor.png")]);
same('...nor its folder', [409, 'not_catalogued'], (function (): array {
    $response = send('POST', '/api/admin/files/assets/move', ADMIN, ['from' => 'regions/kept', 'to' => 'nowhere/kept']);
    return [$response->getStatusCode(), body($response)['code'] ?? null];
})());

send('POST', '/api/admin/files/assets/upload', ADMIN, null, [], [upload('Spare.png', base64_decode(PNG))], ['path' => 'regions']);
$spare = fn (): int => (int) $pdo->query("SELECT count(*) FROM files f JOIN file_categories c ON c.id = f.category_id WHERE c.path = 'regions' AND f.name = 'Spare'")->fetchColumn();
$gone = send('DELETE', '/api/admin/files/assets?path=regions/Spare.png', ADMIN);
same('a file nothing shows: into the trash, its row forgotten', [200, 0], [$gone->getStatusCode(), $spare()]);
$back = array_values(array_filter(body(send('GET', '/api/admin/files/assets/trash', ADMIN))['items'] ?? [], fn (array $item): bool => str_ends_with((string) ($item['trashed'] ?? ''), 'Spare.png')))[0]['trashed'] ?? '';
same('...and Undo: back in place, catalogued again', [200, 1, true], [
    send('POST', '/api/admin/files/assets/trash/restore', ADMIN, ['trashed' => $back])->getStatusCode(), $spare(), is_file("$backend/assets/regions/Spare.png"),
]);
same('after all of it, the region\'s icon is the same file, where the explorer left it', [$iconId, ['regions', 'kept/Liyue Harbor', 'png']], [$icon(), $catalogued($iconId)]);

// ── People ──────────────────────────────────────────────────────────────────

echo "People: the page, its delete, and the scrub of an account the IAM deleted\n";

$people = body(send('GET', '/api/admin/people', ADMIN));
$subs = array_column($people['people'] ?? [], 'sub');
check('everybody this site knows, by IAM id', in_array((string) MEMBER, $subs, true) && in_array((string) EDITOR, $subs, true), implode(',', $subs));
same('...with this site\'s columns, and the visitors line', [['games', 'results', 'feedback'], ['count' => 0]], [array_column($people['columns'] ?? [], 'key'), $people['visitors'] ?? null]);
$member = array_values(array_filter($people['people'] ?? [], fn ($p) => $p['sub'] === (string) MEMBER))[0] ?? [];
same('...the member\'s feedback counted (the message sent without a name is nobody\'s)', 1, $member['feedback'] ?? null);
$deleted = send('DELETE', '/api/admin/people/' . MEMBER, ADMIN);
same('Delete: their games, results and statistics, by label - no proof of a recent sign-in asked', [200, ['Saved games' => 0, 'Quiz results' => 0, 'Statistics' => 0]], [$deleted->getStatusCode(), body($deleted)['deleted'] ?? null]);
same('...audited person.data_deleted, in the delete\'s own transaction (its _txid); their row and their message stay', [1, true, 1, 1], [
    (int) $pdo->query("SELECT count(*) FROM anotoki_audit_log WHERE action = 'person.data_deleted' AND target_id = '" . MEMBER . "'")->fetchColumn(),
    (bool) $pdo->query("SELECT details->>'_txid' ~ '^[0-9]+$' FROM anotoki_audit_log WHERE action = 'person.data_deleted' AND target_id = '" . MEMBER . "'")->fetchColumn(),
    (int) $pdo->query('SELECT count(*) FROM users WHERE id = ' . MEMBER)->fetchColumn(),
    (int) $pdo->query('SELECT count(*) FROM anotoki_feedback WHERE user_id = ' . MEMBER)->fetchColumn(),
]);
same('...their message without the reply address and browser it was sent with (the library forgets them in the same transaction), its words kept', [null, null, 'More bows.'], array_values($pdo->query('SELECT contact_email, user_agent, message FROM anotoki_feedback WHERE user_id = ' . MEMBER)->fetch()));
same('nobody with that id: 404 not_found', [404, 'not_found'], [send('DELETE', '/api/admin/people/999', ADMIN)->getStatusCode(), body(send('DELETE', '/api/admin/people/999', ADMIN))['code'] ?? null]);

file_put_contents($anonymizedFile, json_encode(['accounts' => [['sub' => (string) MEMBER, 'anonymized_at' => '2026-11-06T10:00:00Z']]]));
$syncedBefore = (int) $pdo->query("SELECT count(*) FROM anotoki_audit_log WHERE action = 'people.synced'")->fetchColumn();
$sync = send('POST', '/api/admin/people/sync', ADMIN);
same('Check now: the IAM deleted the member - scrubbed', [200, 1], [$sync->getStatusCode(), body($sync)['run']['scrubbed'] ?? null]);
same('...their name the IAM\'s placeholder, when it was done', ['deleted-' . MEMBER, true], [$pdo->query('SELECT username FROM users WHERE id = ' . MEMBER)->fetchColumn(), (bool) $pdo->query('SELECT anonymized_at IS NOT NULL FROM users WHERE id = ' . MEMBER)->fetchColumn()]);
same('...the address and browser their message kept: gone; its words: kept', [0, 1], [
    (int) $pdo->query('SELECT count(*) FROM anotoki_feedback WHERE user_id = ' . MEMBER . ' AND (contact_email IS NOT NULL OR user_agent IS NOT NULL)')->fetchColumn(),
    (int) $pdo->query('SELECT count(*) FROM anotoki_feedback WHERE user_id = ' . MEMBER)->fetchColumn(),
]);
same('...audited people.synced', $syncedBefore + 1, (int) $pdo->query("SELECT count(*) FROM anotoki_audit_log WHERE action = 'people.synced'")->fetchColumn());
// The scrub's hook writes on the connection it is given - after a restore, the
// restore's - never on the site's own: an entry about a person, with an address
// and their name, scrubbed by the hook inside another connection's transaction.
$pdo->exec("INSERT INTO anotoki_audit_log (action, target_type, target_id, details, ip) VALUES ('test.about_somebody', 'user', '77', '{\"username\": \"Somebody\", \"email\": \"somebody@example.test\"}', '198.51.100.1')");
$entryNow = fn (): array => array_map(fn ($v) => $v === null ? null : (string) $v, (array) $pdo->query("SELECT ip, details->>'username' FROM anotoki_audit_log WHERE action = 'test.about_somebody'")->fetch(PDO::FETCH_NUM));
$other = testPdo($database);
$other->beginTransaction();
peopleScrubCopies($other, 77, null);
$meanwhile = $entryNow();
$other->rollBack();
$rolledBack = $entryNow();
$other->beginTransaction();
peopleScrubCopies($other, 77, null);
$other->commit();
$other = null;
same('the scrub hook: every write on the connection it is given - none seen elsewhere before its commit, none after a rollback, all of it after a commit', [
    ['198.51.100.1', 'Somebody'], ['198.51.100.1', 'Somebody'], [null, null],
], [$meanwhile, $rolledBack, $entryNow()]);
same('a token of theirs that is still about (it cannot be: the IAM issues none) writes no row back', 'deleted-' . MEMBER, (function () use ($pdo): string {
    send('GET', '/api/me', MEMBER);
    return (string) $pdo->query('SELECT username FROM users WHERE id = ' . MEMBER)->fetchColumn();
})());

// ── The dashboard ───────────────────────────────────────────────────────────

echo "The dashboard: the feedback and audit figures, the ADMIN's alone\n";

$editorView = body(send('GET', '/api/dashboard/stats', EDITOR));
same('an EDITOR: no feedback and no recent editing (null), the content as before', [true, null, true, null, true], [
    array_key_exists('feedback', $editorView), $editorView['feedback'], array_key_exists('activity', $editorView), $editorView['activity'], is_array($editorView['content'] ?? null),
]);
$adminView = body(send('GET', '/api/dashboard/stats', ADMIN));
check('the ADMIN: both, off the library\'s tables', ($adminView['feedback']['total'] ?? 0) > 0 && in_array('bug', array_column($adminView['feedback']['byType'] ?? [], 'type'), true) && count($adminView['activity']['recent'] ?? []) > 0);

// ── The gates ───────────────────────────────────────────────────────────────

echo "The gates around them\n";

$ticket = body(send('POST', '/api/admin/backups/' . $backup['id'] . '/ticket', FRESH_ADMIN));
$preview = (string) (body(send('GET', '/api/admin/files/assets?path=character/icon', ADMIN))['files'][0]['url'] ?? '');
$pdo->exec("UPDATE site_settings SET value = 'true' WHERE name = 'maintenance_mode' AND site = 'genshin_impact'");
siteSettingsForget();
same('closed for maintenance: the admin tools are the ADMIN\'s, an EDITOR is told it is closed', [200, 503], [send('GET', '/api/admin/errors', ADMIN)->getStatusCode(), send('GET', '/api/admin/errors', EDITOR)->getStatusCode()]);
same('...the two links an admin\'s browser opens answer, their ticket and signature the check', [200, 200], [send('GET', (string) ($ticket['url'] ?? ''))->getStatusCode(), send('GET', $preview)->getStatusCode()]);
same('...the feedback form does not', 503, send('POST', '/api/feedback', null, ['kind' => 'other', 'message' => 'x'])->getStatusCode());
same('...nor the pages\' error reports, but the ADMIN\'s (the gate lets them in)', [503, 204], [
    send('POST', '/api/client-errors', null, ['message' => 'While closed'])->getStatusCode(),
    send('POST', '/api/client-errors', ADMIN, ['message' => 'While closed, the ADMIN'])->getStatusCode(),
]);
same('...and the error log writes none of those 503 maintenance answers: a state the owner put the site in, not a failure', 0, linesSaying($backend, 'maintenance'));
$pdo->exec("UPDATE site_settings SET value = 'false' WHERE name = 'maintenance_mode' AND site = 'genshin_impact'");
siteSettingsForget();

$ticket = body(send('POST', '/api/admin/backups/' . $backup['id'] . '/ticket', FRESH_ADMIN));
file_put_contents($applicationFile, json_encode(['client_id' => 'genshin', 'name' => 'Genshin', 'login_required' => true]));
same('sign-in required: the feedback form wants somebody (401 sign_in_required)', [401, 'sign_in_required'], (function (): array {
    $response = send('POST', '/api/feedback', null, ['kind' => 'other', 'message' => 'x']);
    return [$response->getStatusCode(), body($response)['code'] ?? null];
})());
// From another address: the flood above used up this one's hour.
$GLOBALS['REMOTE'] = '203.0.113.7';
same('...somebody signed in may send it', 201, send('POST', '/api/feedback', EDITOR, ['kind' => 'other', 'message' => 'signed in'])->getStatusCode());
same('...the pages\' error reports the same: nobody 401 sign_in_required, somebody signed in 204', [[401, 'sign_in_required'], 204], [
    (function (): array {
        $response = send('POST', '/api/client-errors', null, ['message' => 'Signed out, sign-in required']);
        return [$response->getStatusCode(), body($response)['code'] ?? null];
    })(),
    send('POST', '/api/client-errors', EDITOR, ['message' => 'Signed in, sign-in required'])->getStatusCode(),
]);
unset($GLOBALS['REMOTE']);
same('...the two links still answer', [200, 200], [send('GET', (string) ($ticket['url'] ?? ''))->getStatusCode(), send('GET', $preview)->getStatusCode()]);
same('...the boot says so', [true, true], [body(send('GET', '/api/settings/public'))['auth']['login_required'] ?? null, body(send('GET', '/api/settings/public'))['auth']['sign_in_available'] ?? null]);
file_put_contents($applicationFile, json_encode(['client_id' => 'genshin', 'name' => 'Genshin', 'login_required' => false]));

file_put_contents("$backend/migrations/users/999_test_waiting.sql", "SELECT 1;\n");
same('an update waiting: the error log and the backups answer the ADMIN (they need no table)', [200, 200], [send('GET', '/api/admin/errors', ADMIN)->getStatusCode(), send('GET', '/api/admin/backups', ADMIN)->getStatusCode()]);
same('...the audit log, feedback, the explorer, the people do not (503 update_pending)', [503, 503, 503, 503], array_map(fn (string $path) => send('GET', $path, ADMIN)->getStatusCode(), ['/api/admin/audit', '/api/admin/feedback', '/api/admin/files/roots', '/api/admin/people']));
same('...nor a backup\'s restore', 503, send('POST', '/api/admin/backups/' . $backup['id'] . '/restore', FRESH_ADMIN, ['confirm' => substr((string) $backup['id'], -6)])->getStatusCode());
$applied = send('POST', '/api/admin/migrations/apply', ADMIN);
same('Apply: the waiting file runs', [200, ['users/999_test_waiting.sql']], [$applied->getStatusCode(), array_map(fn ($f) => $f['set'] . '/' . $f['name'], body($applied)['applied'] ?? [])]);
check('...after a backup of the database as it was, named in the answer', (glob("$backend/storage/backups/*-before-migration-*.anotoki-backup") ?: []) !== [] && str_contains((string) (body($applied)['note'] ?? ''), 'before-migration'), (string) (body($applied)['note'] ?? ''));
same('...written down: migrations.applied, by the ADMIN', ['users/999_test_waiting.sql'], json_decode((string) $pdo->query("SELECT details::text FROM anotoki_audit_log WHERE action = 'migrations.applied' AND actor_id = " . ADMIN . ' ORDER BY id DESC LIMIT 1')->fetchColumn(), true)['files'] ?? null);
unlink("$backend/migrations/users/999_test_waiting.sql");
same('applied: everything answers again', 200, send('GET', '/api/admin/audit', ADMIN)->getStatusCode());
same('...and the error log wrote none of the 503 update_pending answers meanwhile: a state, not a failure', 0, linesSaying($backend, 'update_pending'));

// The legal pages are anybody's: the page switches never govern them (anotoki-lib 0.6's Terms, Privacy, Contact).
$governed = array_map(fn (string $path) => [send('POST', '/api/site-routes', ADMIN, ['path' => $path, 'visibility' => 'ADMIN'])->getStatusCode(), (int) $pdo->query('SELECT count(*) FROM site_routes WHERE path = ' . $pdo->quote($path))->fetchColumn()], ['/terms', '/privacy', '/contact']);
same('the page switches refuse the legal pages - 422, no row: they are anybody\'s', [[422, 0], [422, 0], [422, 0]], $governed);
check('...saying why', str_contains((string) (body(send('POST', '/api/site-routes', ADMIN, ['path' => '/privacy/']))['error'] ?? ''), 'legal pages'));

echo "What the error log leaves out (a state the site is in) and what it writes (a failure, a 503 among them)\n";

// The answers of the states the site's own code says, read off the answer as
// the error log's outer middleware reads every one - and a failure beside them.
// Each in words of its own: one line per kind (fingerprint) a request, so two
// answers alike would keep the second out whatever its code.
$answered = function (int $status, string $code) use ($backend): int {
    $response = (new \Slim\Psr7\Factory\ResponseFactory())->createResponse($status)->withHeader('Content-Type', 'application/json');
    $response->getBody()->write(json_encode(['error' => "An answer of the test's, saying $code.", 'code' => $code]));
    $before = linesSaying($backend, $code);
    siteErrorLog()->recordResponse((new ServerRequestFactory())->createServerRequest('GET', 'http://localhost/api/test-' . $code, ['REMOTE_ADDR' => '127.0.0.1']), $response);

    return linesSaying($backend, $code) - $before;
};
same('a 503 that says a state - the family\'s three, the closed sign, the guides\' and the visitors\' tables waiting: none written', [0, 0, 0, 0, 0, 0], [
    $answered(503, 'update_pending'), $answered(503, 'feature_unavailable'), $answered(503, 'not_set_up'),
    $answered(503, 'maintenance'), $answered(503, 'guides_unavailable'), $answered(503, 'visitors_unavailable'),
]);
same('...a 503 that says a failure - a move that met another request\'s work, a database out of reach: written', [1, 1], [$answered(503, 'visitor_move_retry'), $answered(503, 'database_unavailable')]);
// A real one, through the API: the feedback's count cannot be kept (its file
// cannot be opened), so the form answers 503 storage_unavailable - and the
// error log writes it.
$limits = "$backend/storage/cache/anotoki-feedback-limits.json";
rename($limits, "$limits.away");
mkdir($limits);
$refusedFeedback = send('POST', '/api/feedback', MEMBER, ['kind' => 'other', 'message' => 'The count cannot be kept.']);
rmdir($limits);
rename("$limits.away", $limits);
same('the feedback form when its count cannot be kept: 503 storage_unavailable - written in the error log', [503, 'storage_unavailable', 1], [
    $refusedFeedback->getStatusCode(), body($refusedFeedback)['code'] ?? null, linesSaying($backend, 'storage_unavailable'),
]);

// ── Every route, every caller ───────────────────────────────────────────────

echo "Every route of the tools: nobody, a MEMBER, an EDITOR, the ADMIN\n";

// Nobody, a MEMBER and an EDITOR send what would change something - the real
// backup, message, trash item and person - and nothing may change. The ADMIN
// then sends what changes nothing (what is not there, or not well formed) and
// must get past the check: never 401 or 403.
$backupId = (string) $backup['id'];
$nobodysBackup = '20990101-000000Z-manual-' . str_repeat('0', 32);
$trashItem = (string) (body(send('GET', '/api/admin/files/assets/trash', ADMIN))['items'][0]['trashed'] ?? '');
$fingerprint = (string) (body(send('GET', '/api/admin/errors?days=1', ADMIN))['groups'][0]['fingerprint'] ?? '000000000000');
$routes = [
    // method, what a refused caller sends (path, body), what the ADMIN sends (path, body)
    ['GET', '/api/admin/errors', null, '/api/admin/errors', null],
    ['GET', "/api/admin/errors/$fingerprint", null, '/api/admin/errors/000000000000', null],
    ['DELETE', '/api/admin/errors', null, '/api/admin/errors?before=2000-01-01', null],
    ['GET', '/api/admin/audit', null, '/api/admin/audit', null],
    ['GET', '/api/admin/audit/facets', null, '/api/admin/audit/facets', null],
    ['GET', '/api/admin/feedback', null, '/api/admin/feedback', null],
    ['GET', '/api/admin/feedback/facets', null, '/api/admin/feedback/facets', null],
    ['GET', '/api/admin/feedback/unread', null, '/api/admin/feedback/unread', null],
    ['GET', "/api/admin/feedback/$idea", null, '/api/admin/feedback/999999999', null],
    ['PUT', "/api/admin/feedback/$idea/status", ['status' => 'spam'], '/api/admin/feedback/999999999/status', ['status' => 'read']],
    ['DELETE', "/api/admin/feedback/$idea", null, '/api/admin/feedback/999999999', null],
    ['GET', '/api/admin/backups', null, '/api/admin/backups', null],
    ['GET', '/api/admin/backups/proof', null, '/api/admin/backups/proof', null],
    ['POST', '/api/admin/backups', ['description' => 'not theirs'], '/api/admin/backups', '{'],
    ['GET', "/api/admin/backups/$backupId", null, "/api/admin/backups/$nobodysBackup", null],
    ['GET', "/api/admin/backups/$backupId/preview", null, "/api/admin/backups/$nobodysBackup/preview", null],
    ['DELETE', "/api/admin/backups/$backupId", null, "/api/admin/backups/$nobodysBackup", null],
    ['POST', "/api/admin/backups/$backupId/ticket", null, "/api/admin/backups/$nobodysBackup/ticket", null],
    ['POST', "/api/admin/backups/$backupId/restore", ['confirm' => substr($backupId, -6)], "/api/admin/backups/$nobodysBackup/restore", ['confirm' => '000000']],
    ['GET', '/api/admin/files/roots', null, '/api/admin/files/roots', null],
    ['GET', '/api/admin/files/assets?path=character/icon', null, '/api/admin/files/assets?path=character/icon', null],
    ['POST', '/api/admin/files/assets/rescan', null, '/api/admin/files/uploads/rescan', null],
    ['POST', '/api/admin/files/assets/folder', ['path' => 'not-theirs'], '/api/admin/files/assets/folder', ['path' => '']],
    ['POST', '/api/admin/files/assets/move', ['from' => 'character/icon/AMBER.png', 'to' => 'character/icon/MOVED.png'], '/api/admin/files/assets/move', ['from' => 'no-such.png', 'to' => 'still-none.png']],
    ['DELETE', '/api/admin/files/assets?path=character/icon/AMBER.png', null, '/api/admin/files/assets?path=no-such.png', null],
    ['GET', '/api/admin/files/assets/trash', null, '/api/admin/files/assets/trash', null],
    ['POST', '/api/admin/files/assets/trash/restore', ['trashed' => $trashItem], '/api/admin/files/assets/trash/restore', ['trashed' => 'no-such.png']],
    ['DELETE', '/api/admin/files/assets/trash', null, '/api/admin/files/assets/trash?trashed=no-such.png', null],
    ['GET', '/api/admin/people', null, '/api/admin/people', null],
    ['POST', '/api/admin/people/sync', null, '/api/admin/people/sync', null],
    ['DELETE', '/api/admin/people/' . EDITOR, null, '/api/admin/people/999', null],
    ['GET', '/api/admin/migrations', null, '/api/admin/migrations', null],
    ['GET', '/api/admin/migrations/file?set=users&name=052_people.sql', null, '/api/admin/migrations/file?set=users&name=no-such.sql', null],
    ['POST', '/api/admin/migrations/apply', null, '/api/admin/migrations/apply', null],
];
$pdo->exec("INSERT INTO regions (name) VALUES ('Afterland')");
$auditBefore = (int) $pdo->query('SELECT count(*) FROM anotoki_audit_log')->fetchColumn();
$backupsBefore = glob("$backend/storage/backups/*.anotoki-backup") ?: [];
$refused = [[401, 'sign_in_required'], [403, 'forbidden'], [403, 'forbidden']];
foreach ($routes as [$method, $path, $json]) {
    $answers = array_map(fn (?int $as) => send($method, $path, $as, $json), [null, MEMBER, EDITOR]);
    same("$method $path: nobody 401, a MEMBER 403, an EDITOR 403", $refused, array_map(fn (ResponseInterface $r) => [$r->getStatusCode(), body($r)['code'] ?? null], $answers));
}
$answers = array_map(fn (?int $as) => send('POST', '/api/admin/files/assets/upload', $as, null, [], [upload('Not theirs.png', base64_decode(PNG))], ['path' => 'character/icon']), [null, MEMBER, EDITOR]);
same('POST /api/admin/files/assets/upload: nobody 401, a MEMBER 403, an EDITOR 403', $refused, array_map(fn (ResponseInterface $r) => [$r->getStatusCode(), body($r)['code'] ?? null], $answers));
same('...and nothing they sent changed anything: no audit entry, the backups, the message, the files, the trash, the region, the error log', [
    $auditBefore, $backupsBefore, 'resolved', true, false, false, false, 1, false, 1, true,
], [
    (int) $pdo->query('SELECT count(*) FROM anotoki_audit_log')->fetchColumn(),
    glob("$backend/storage/backups/*.anotoki-backup") ?: [],
    $pdo->query("SELECT status FROM anotoki_feedback WHERE id = $idea")->fetchColumn(),
    is_file("$backend/assets/character/icon/AMBER.png"),
    is_file("$backend/assets/character/icon/MOVED.png"),
    is_dir("$backend/assets/not-theirs"),
    is_file("$backend/assets/character/icon/Not theirs.png"),
    count(body(send('GET', '/api/admin/files/assets/trash', ADMIN))['items'] ?? []),
    is_file("$backend/assets/character/icon/old.php.png"),
    (int) $pdo->query("SELECT count(*) FROM regions WHERE name = 'Afterland'")->fetchColumn(),
    in_array(404, array_column(body(send('GET', '/api/admin/errors?days=1', ADMIN))['groups'] ?? [], 'status'), true),
]);
$past = [];
foreach ([...$routes, ['POST', '', null, '/api/admin/files/assets/upload', null]] as [$method, , , $path, $json]) {
    $status = send($method, $path, FRESH_ADMIN, $json)->getStatusCode();
    if ($status === 401 || $status === 403 || $status >= 500) {
        $past[] = "$method $path: $status";
    }
}
same('the ADMIN gets past the check on every one of them - never 401 or 403, and nothing fails (5xx)', [], $past);
$link = "/api/admin/backups/$backupId/file?ticket=" . str_repeat('a', 43);
$signed = str_replace('sig=', 'sig=0', $preview);
same('the two links outside the check: a ticket nobody was given, a signature tampered with - refused alike, whoever sends them (a token opens neither)', [[403, 403, 403, 403], [404, 404, 404, 404]], [
    array_map(fn (?int $as) => send('GET', $link, $as)->getStatusCode(), [null, MEMBER, EDITOR, ADMIN]),
    array_map(fn (?int $as) => send('GET', $signed, $as)->getStatusCode(), [null, MEMBER, EDITOR, ADMIN]),
]);
