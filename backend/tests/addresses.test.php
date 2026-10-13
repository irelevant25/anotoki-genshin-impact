<?php

declare(strict_types=1);

/**
 * Where a request comes from, and what is kept of it - anotoki-lib 0.5.0 and
 * the owner's rule of 2026-10-11: the site is behind Cloudflare, so a
 * request's address is CF-Connecting-IP when the connection is Cloudflare's
 * (its published ranges, committed in config/visitors.php) and the
 * connection's own otherwise - one rule for the site's limits and the
 * library's alike (api/client_address.php, the AdminContext) - and only a
 * keyed hash of an address is ever kept, never the address:
 *
 *   - the rule: the committed ranges are Cloudflare's (the library's list);
 *     a header from anybody else, a list, X-Forwarded-For are never believed;
 *     an IPv6 address counts by its /64; the library reads every case alike;
 *   - the new visitors' count (visitor_starts, users/054): a keyed HMAC of the
 *     bucket, and the limit still counts each visitor behind the one edge;
 *   - the library's own uses through the same edge: feedback's limit, the
 *     error log's client hash;
 *   - the site's old error log files: the address every line kept, hashed in
 *     place once, after an answer - nothing else of them changed;
 *   - and nothing under api/ reads an address but through that one rule.
 *
 * Through the whole API (api/index.php) in this process, on a database and a
 * backend copy of the test's own (tests/db_lib.php), with a key pair standing
 * in for the IAM.
 */

use Anotoki\Lib\Support\ClientAddress;
use Anotoki\Lib\Support\Keys;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Slim\Psr7\Factory\ServerRequestFactory;
use Slim\Psr7\Factory\StreamFactory;

require __DIR__ . '/lib.php';
require __DIR__ . '/db_lib.php';

testNeedsDatabase();

$database = testDatabase('addresses');
$iamDir = testTempDir('iam');
$iam = testIam($iamDir);
$applicationFile = "$iamDir/application.json";
$anonymizedFile = "$iamDir/anonymized.json";
file_put_contents($applicationFile, json_encode(['client_id' => 'genshin', 'name' => 'Genshin', 'login_required' => false]));
file_put_contents($anonymizedFile, json_encode(['accounts' => []]));
$backend = testBackendCopy($database, ['jwks_file' => $iam['jwks'], 'application_file' => $applicationFile, 'anonymized_file' => $anonymizedFile]);

// The site's own error log from before anotoki-lib 0.4.1, as it wrote its
// lines: each with the address the request came from (requestIp()) - an IPv4
// one, an IPv6 one, none - its words as they were thrown (a message naming an
// address and an e-mail address, a trace with its calls' arguments), and a
// line a write was cut short in; another day's file with no address at all;
// and one "file" nothing can read (a folder by that name).
mkdir("$backend/storage/logs", 0777, true);
$oldLines = [
    '{"level":"error","status":404,"path":"/api/x","user_id":null,"ip":"198.51.100.23","at":"2026-10-01 10:00:00","fingerprint":"aaaaaaaaaaaa"}',
    '{"level":"error","status":500,"path":"/api/y","user_id":7,"ip":"2001:db8:1:2:3:4:5:6","at":"2026-10-01 10:01:00","fingerprint":"bbbbbbbbbbbb"}',
    '{"level":"error","status":500,"path":"/api/z","user_id":null,"ip":null,"at":"2026-10-01 10:02:00","fingerprint":"cccccccccccc"}',
    '{"level":"error","status":500,"type":"PDOException","message":"Failing row contains (12, 198.51.100.25, reader@example.test)","path":"/api/quiz/progress/dish","ip":"198.51.100.25","trace":"#0 api/visitors.php(280): visitorMake(Object(Slim\\\\Psr7\\\\Request), \'198.51.100.25\')\\n#1 {main}","at":"2026-10-01 10:03:00","fingerprint":"dddddddddddd"}',
    '{"level":"error","status":500,"path":"/api/cut","ip":"198.51.100.24","at":"2026-10-01 10:0',
];
file_put_contents("$backend/storage/logs/errors-2026-10-01.jsonl", implode("\n", $oldLines) . "\n");
$noAddress = '{"at":"2026-10-02 10:00:00","level":"error","status":500,"message":"Datei – ünïcode"}' . "\n";
file_put_contents("$backend/storage/logs/errors-2026-10-02.jsonl", $noAddress);
mkdir("$backend/storage/logs/errors-2026-10-04.jsonl");

define('ANOTOKI_ROUTES_ONLY', true);
require "$backend/api/index.php";

$built = siteMigrator(getDb())->apply();
check('a database built by every migration, users/054 among them', $built['error'] === null && in_array('054_visitor_starts_hashed.sql', array_column($built['applied'], 'name'), true), (string) $built['error']);
$pdo = getDb();

const MEMBER = 3;
$tokens = [MEMBER => ($iam['token'])(MEMBER, ['MEMBER'])];

/** Cloudflare's edges, as a request through Cloudflare comes from one: an IPv4 one (172.64.0.0/13) and an IPv6 one. */
const EDGE = '172.68.10.20';
const EDGE6 = '2606:4700:10::6';
/** Somebody who is not Cloudflare, sending its header all the same. */
const STRANGER = '203.0.113.5';

/** A request as the server hands it over: from $from (REMOTE_ADDR), with $headers. */
function requestFrom(string $from, array $headers = [], string $method = 'GET', string $path = '/api/regions'): ServerRequestInterface
{
    $request = (new ServerRequestFactory())->createServerRequest($method, 'http://localhost' . $path, ['REMOTE_ADDR' => $from]);
    foreach ($headers as $name => $value) {
        $request = $request->withHeader($name, $value);
    }

    return $request;
}

/** One request through the whole app, from $from; $as is who sends it (a token), null for nobody. */
function send(string $method, string $path, string $from, array $headers = [], mixed $json = null, ?int $as = null): ResponseInterface
{
    global $app, $tokens;
    $request = requestFrom($from, $headers, $method, $path);
    if ($as !== null) {
        $request = $request->withHeader('Authorization', 'Bearer ' . $tokens[$as]);
    }
    if ($json !== null) {
        $request = $request->withHeader('Content-Type', 'application/json')->withBody((new StreamFactory())->createStream(json_encode($json)));
    }

    return $app->handle($request);
}

function body(ResponseInterface $response): mixed
{
    return json_decode((string) $response->getBody(), true);
}

// ── The rule ────────────────────────────────────────────────────────────────

echo "The rule: Cloudflare's word, from Cloudflare alone\n";

same('the committed trusted proxies are Cloudflare\'s published ranges - the library\'s list, 15 IPv4 and 7 IPv6', [ClientAddress::CLOUDFLARE, 22], [VISITOR_SETTING_DEFAULTS['client_address']['trusted_proxies'], count(VISITOR_SETTING_DEFAULTS['client_address']['trusted_proxies'])]);
same('...an installation without config/visitors.local.php runs on them, and the header is no setting at all (CF-Connecting-IP, pinned)', [ClientAddress::CLOUDFLARE, ['trusted_proxies']], [siteTrustedProxies(), array_keys(VISITOR_SETTING_DEFAULTS['client_address'])]);
$cases = [
    'through Cloudflare (IPv4): the visitor\'s address' => [requestFrom(EDGE, ['CF-Connecting-IP' => '198.51.100.7']), '198.51.100.7'],
    'through Cloudflare (IPv6 edge, IPv6 visitor): the visitor\'s /64' => [requestFrom(EDGE6, ['CF-Connecting-IP' => '2001:db8:aa:bb:1:2:3:4']), '2001:db8:aa:bb::/64'],
    'from anybody else naming an address in the header: the connection\'s own' => [requestFrom(STRANGER, ['CF-Connecting-IP' => '198.51.100.7']), STRANGER],
    'from Cloudflare with X-Forwarded-For only: never read - the edge\'s own' => [requestFrom(EDGE, ['X-Forwarded-For' => '198.51.100.7']), EDGE],
    'from Cloudflare with X-Real-IP only (Cloudflare passes it on untouched): never read - the edge\'s own' => [requestFrom(EDGE, ['X-Real-IP' => '198.51.100.8']), EDGE],
    'from Cloudflare with True-Client-IP only (the same): never read - the edge\'s own' => [requestFrom(EDGE, ['True-Client-IP' => '198.51.100.9']), EDGE],
    'from Cloudflare with CF-Connecting-IP and a forged X-Real-IP: CF-Connecting-IP\'s' => [requestFrom(EDGE, ['CF-Connecting-IP' => '198.51.100.7', 'X-Real-IP' => '198.51.100.8']), '198.51.100.7'],
    'from Cloudflare with a list in the header: no one address - the edge\'s own' => [requestFrom(EDGE, ['CF-Connecting-IP' => '198.51.100.7, 10.0.0.1']), EDGE],
    'an IPv4 connection written as IPv6 (::ffff:): the IPv4 address' => [requestFrom('::ffff:' . STRANGER), STRANGER],
    'no address from the server at all: \'?\'' => [requestFrom(''), '?'],
];
foreach ($cases as $what => [$request, $expected]) {
    same($what, [$expected, $expected], [clientAddressCounted($request), siteAdminContext()->clientKey($request)]);
}
// Without config/cloudflare.local.php there is no origin secret (tests/origin-secret.test.php has one): Cloudflare's
// word as before, and an X-Anotoki-Origin changes nothing.
$anything = requestFrom(EDGE, ['CF-Connecting-IP' => '198.51.100.7', 'X-Anotoki-Origin' => 'anything']);
same('no config/cloudflare.local.php: no origin secret, Cloudflare\'s word as before - whatever X-Anotoki-Origin says', [null, '198.51.100.7', '198.51.100.7'], [
    originSecret(), clientAddressCounted($anything), siteAdminContext()->clientKey($anything),
]);
$local = visitorSettingsFrom(['client_address' => ['trusted_proxies' => []]])['settings']['client_address']['trusted_proxies'];
same('a host that is not behind Cloudflare says so in config/visitors.local.php: [] - and the connection\'s own address counts', [[], EDGE], [
    $local, ClientAddress::bucket((string) ClientAddress::of(requestFrom(EDGE, ['CF-Connecting-IP' => '198.51.100.7']), $local)),
]);
// What the security review tried: another header, and every address a proxy.
$hostile = visitorSettingsFrom(['client_address' => ['client_ip_header' => 'X-Real-IP', 'trusted_proxies' => ['0.0.0.0/0', '::/0', '10.0.0.0/7', '2400::/15', '10.0.0.0/8', '2400:cb00::/32', '203.0.113.5']]]);
same('a local file naming another header (X-Real-IP) and catch-all ranges: the header ignored, every range wider than a proxy\'s (/8 for IPv4, /16 for IPv6) dropped, the rest kept', [
    ['10.0.0.0/8', '2400:cb00::/32', '203.0.113.5'], ['trusted_proxies'], 1, 4,
], [
    $hostile['settings']['client_address']['trusted_proxies'], array_keys($hostile['settings']['client_address']),
    count(array_filter($hostile['problems'], fn (string $problem): bool => str_contains($problem, 'client_ip_header is no setting'))),
    count(array_filter($hostile['problems'], fn (string $problem): bool => str_contains($problem, 'wider than any proxy\'s range'))),
]);
same('...and with what is left, a forged X-Real-IP from anywhere is still nobody\'s word: the connection\'s own address', [EDGE, '198.51.100.66'], [
    ClientAddress::bucket((string) ClientAddress::of(requestFrom(EDGE, ['X-Real-IP' => '198.51.100.99']), $hostile['settings']['client_address']['trusted_proxies'], ClientAddress::CLOUDFLARE_HEADER)),
    ClientAddress::bucket((string) ClientAddress::of(requestFrom('198.51.100.66', ['X-Real-IP' => '198.51.100.99', 'CF-Connecting-IP' => '198.51.100.98']), $hostile['settings']['client_address']['trusted_proxies'], ClientAddress::CLOUDFLARE_HEADER)),
]);

// ── The new visitors' count ─────────────────────────────────────────────────

echo "The new visitors' count: a keyed hash, counting each visitor behind the one edge\n";

$visitorA = requestFrom(EDGE, ['CF-Connecting-IP' => '198.51.100.7']);
$hashA = clientAddressHash($visitorA);
same('what the count keeps: HMAC-SHA256 of the bucket under the site secret\'s \'visitor-limits\' key', hash_hmac('sha256', '198.51.100.7', Keys::derive((string) localSecret(), 'visitor-limits')), $hashA);
check('...never the address, nor a hash anybody could find it again by (an unkeyed one)', $hashA !== hash('sha256', '198.51.100.7') && !str_contains($hashA, '198.51.100.7'));
same('...one for every address of an IPv6 /64, another for another visitor', [true, false], [
    clientAddressHash(requestFrom(EDGE6, ['CF-Connecting-IP' => '2001:db8:aa:bb::1'])) === clientAddressHash(requestFrom(EDGE6, ['CF-Connecting-IP' => '2001:db8:aa:bb:ffff::2'])),
    $hashA === clientAddressHash(requestFrom(EDGE, ['CF-Connecting-IP' => '198.51.100.8'])),
]);

const PLAYED = ['state' => ['tries' => ['Amber'], 'isQuestionComplete' => false]];
$made = [];
for ($i = 1; $i <= 11; $i++) {
    $made[] = send('PUT', '/api/quiz/progress/dish', EDGE, ['CF-Connecting-IP' => '198.51.100.7'], PLAYED)->getStatusCode();
}
$other = send('PUT', '/api/quiz/progress/dish', EDGE, ['CF-Connecting-IP' => '198.51.100.8'], PLAYED);
same('ten new visitors an hour from one address: the eleventh through the same edge is 429 too_many_visitors, another visitor behind it is made', [array_fill(0, 10, 200), 429, 200], [array_slice($made, 0, 10), $made[10], $other->getStatusCode()]);
$kept = $pdo->query('SELECT address FROM visitor_starts ORDER BY id')->fetchAll(PDO::FETCH_COLUMN);
same('visitor_starts: eleven rows, each a keyed hash - ten of the one visitor, one of the other', [11, 10, 1], [count($kept), count(array_keys($kept, $hashA, true)), count(array_keys($kept, clientAddressHash(requestFrom(EDGE, ['CF-Connecting-IP' => '198.51.100.8'])), true))]);
check('...and no address anywhere in the table', array_filter($kept, fn (string $address): bool => preg_match('/^[0-9a-f]{64}$/D', $address) !== 1) === [] && !str_contains(implode(',', $kept), '198.51.100'));
$spoofed = [];
for ($i = 1; $i <= 11; $i++) {
    $spoofed[] = send('PUT', '/api/quiz/progress/dish', STRANGER, ['CF-Connecting-IP' => "198.51.100.$i"], PLAYED)->getStatusCode();
}
same('somebody who is not Cloudflare naming a new address in the header each time: counted as themselves - the eleventh refused', [array_fill(0, 10, 200), 429], [array_slice($spoofed, 0, 10), $spoofed[10]]);

// ── The library's own, through the same edge ───────────────────────────────

echo "The library's own reading of an address: the same rule\n";

$feedback = [];
for ($i = 1; $i <= 6; $i++) {
    $feedback[] = send('POST', '/api/feedback', EDGE, ['CF-Connecting-IP' => '198.51.100.30'], ['kind' => 'other', 'message' => "Through Cloudflare $i"])->getStatusCode();
}
same('feedback: five an hour from one visitor behind the edge, the sixth 429 - and another visitor behind it may still write', [array_fill(0, 5, 201), 429, 201], [
    array_slice($feedback, 0, 5), $feedback[5],
    send('POST', '/api/feedback', EDGE, ['CF-Connecting-IP' => '198.51.100.31'], ['kind' => 'other', 'message' => 'Another visitor'])->getStatusCode(),
]);
check('...and nothing of where a message came from is in its row', (int) $pdo->query("SELECT count(*) FROM anotoki_feedback WHERE message LIKE 'Through Cloudflare%' AND (details::text LIKE '%198.51.100%' OR coalesce(page, '') LIKE '%198.51.100%')")->fetchColumn() === 0);
send('GET', '/api/no-such-route', EDGE, ['CF-Connecting-IP' => '198.51.100.40']);
$line = null;
foreach (glob("$backend/storage/error-log/errors-*.jsonl") ?: [] as $file) {
    foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $each) {
        $entry = json_decode($each, true);
        if (($entry['path'] ?? null) === '/api/no-such-route') {
            $line = $entry;
        }
    }
}
same('the error log: the visitor\'s line holds a keyed hash of the visitor\'s address - not of the edge\'s, never an address', [substr(hash_hmac('sha256', '198.51.100.40', Keys::derive((string) localSecret(), 'error-log')), 0, 12), false, false], [
    $line['client'] ?? null, str_contains((string) json_encode($line), '198.51.100.40'), str_contains((string) json_encode($line), EDGE),
]);

// ── The site's old error log ────────────────────────────────────────────────

echo "The site's old error log: what its lines kept of people, scrubbed in place once\n";

$errorKey = Keys::derive((string) localSecret(), 'error-log');
$stamp = "$backend/storage/cache/" . OLD_ERROR_LOG_STAMP;
same('before an answer has gone out: the old lines as they were, no stamp', [implode("\n", $oldLines) . "\n", false], [(string) file_get_contents("$backend/storage/logs/errors-2026-10-01.jsonl"), is_file($stamp)]);
afterResponseRun();
$hashed = array_map(fn (string $line): mixed => json_decode($line, true) ?? $line, file("$backend/storage/logs/errors-2026-10-01.jsonl", FILE_IGNORE_NEW_LINES) ?: []);
same('after it: each line\'s address gone, the error log\'s client hash of its bucket in its place (an IPv6 one by its /64)', [
    [false, substr(hash_hmac('sha256', '198.51.100.23', $errorKey), 0, 12)],
    [false, substr(hash_hmac('sha256', '2001:db8:1:2::/64', $errorKey), 0, 12)],
    [false, null],
    [false, substr(hash_hmac('sha256', '198.51.100.25', $errorKey), 0, 12)],
], array_map(fn (mixed $entry): array => [is_array($entry) && array_key_exists('ip', $entry), is_array($entry) ? ($entry['client'] ?? null) : 'not a line'], array_slice($hashed, 0, 4)));
same('...everything else of each line as it was', [
    ['level' => 'error', 'status' => 404, 'path' => '/api/x', 'user_id' => null, 'at' => '2026-10-01 10:00:00', 'fingerprint' => 'aaaaaaaaaaaa'],
    ['level' => 'error', 'status' => 500, 'path' => '/api/y', 'user_id' => 7, 'at' => '2026-10-01 10:01:00', 'fingerprint' => 'bbbbbbbbbbbb'],
], [array_diff_key($hashed[0], ['client' => 1]), array_diff_key($hashed[1], ['client' => 1])]);
check('...its words scrubbed as the library scrubs its own: no address, no e-mail address in the message or the trace\'s arguments, the rest of them kept', is_array($hashed[3])
    && !str_contains(json_encode($hashed[3]), '198.51.100.25') && !str_contains(json_encode($hashed[3]), 'reader@example.test')
    && str_starts_with((string) $hashed[3]['message'], 'Failing row contains') && str_contains((string) $hashed[3]['trace'], 'visitorMake('), (string) json_encode($hashed[3]));
check('...the line a write was cut short in: its address marked, the rest kept', is_string($hashed[4]) && !str_contains($hashed[4], '198.51.100.24') && str_contains($hashed[4], '"path":"/api/cut"'), (string) json_encode($hashed[4]));
same('...a file with nothing of anybody\'s: untouched, byte for byte', $noAddress, (string) file_get_contents("$backend/storage/logs/errors-2026-10-02.jsonl"));
$tried = "$backend/storage/cache/" . OLD_ERROR_LOG_TRIED;
$reported = array_values(array_filter(
    array_merge(...array_map(fn (string $file): array => array_map(fn (string $line): mixed => json_decode($line, true), file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: []), glob("$backend/storage/error-log/errors-*.jsonl") ?: [])),
    fn (mixed $entry): bool => str_contains((string) ($entry['message'] ?? ''), 'errors-2026-10-04.jsonl could not be read or rewritten'),
));
same('...one nothing can read: not done, so no stamp - reported in the site\'s error log (and the PHP log), to be tried again', [false, true, 1, 'error', true], [
    is_file($stamp), is_file($tried), count($reported), $reported[0]['level'] ?? null,
    str_contains((string) file_get_contents($GLOBALS['TEST_LOG']), 'storage/logs/errors-2026-10-04.jsonl could not be read or rewritten'),
]);
send('GET', '/api/regions', STRANGER);
afterResponseRun();
same('...not again within the hour (nothing queued, nothing read)', [false, 1], [is_file($stamp), count(array_filter(
    array_merge(...array_map(fn (string $file): array => file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [], glob("$backend/storage/error-log/errors-*.jsonl") ?: [])),
    fn (string $line): bool => str_contains($line, 'errors-2026-10-04.jsonl could not be read or rewritten'),
))]);
// The owner removes what could not be done; an hour later the next answer tries again.
rmdir("$backend/storage/logs/errors-2026-10-04.jsonl");
touch($tried, time() - 2 * OLD_ERROR_LOG_RETRY_EVERY);
send('GET', '/api/regions', STRANGER);
afterResponseRun();
same('...an hour later, every file done: the stamp written, the mark of the tries gone', [true, false], [is_file($stamp), is_file($tried)]);
$before = (string) file_get_contents("$backend/storage/logs/errors-2026-10-01.jsonl");
file_put_contents("$backend/storage/logs/errors-2026-10-03.jsonl", '{"ip":"198.51.100.99"}' . "\n");
send('GET', '/api/regions', STRANGER);
afterResponseRun();
same('...and with the stamp there, not again (nothing queued, nothing read)', [$before, '{"ip":"198.51.100.99"}' . "\n"], [
    (string) file_get_contents("$backend/storage/logs/errors-2026-10-01.jsonl"), (string) file_get_contents("$backend/storage/logs/errors-2026-10-03.jsonl"),
]);

// ── The one reader ──────────────────────────────────────────────────────────

echo "Nothing under api/ reads an address but through the one rule\n";

$readers = [];
$files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator(TEST_BACKEND . '/api', FilesystemIterator::SKIP_DOTS));
foreach ($files as $file) {
    if ($file->getExtension() !== 'php') {
        continue;
    }
    $code = implode("\n", array_filter(
        explode("\n", (string) file_get_contents($file->getPathname())),
        fn (string $line): bool => !preg_match('/^\s*(\*|\/\/|\/\*)/', $line),
    ));
    if (preg_match('/REMOTE_ADDR|X-Forwarded-For|HTTP_X_FORWARDED|CF-Connecting-IP|getServerParams\(\)/i', $code) === 1) {
        $readers[] = str_replace('\\', '/', substr($file->getPathname(), strlen(TEST_BACKEND) + 1));
    }
}
same('no file of the API reads REMOTE_ADDR, a forwarding header or the server\'s params itself - the library\'s ClientAddress does, for api/client_address.php and the AdminContext', [], $readers);
same('...and requestIp(), which wrote the old log\'s addresses, is gone', false, function_exists('requestIp'));
