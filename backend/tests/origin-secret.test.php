<?php

declare(strict_types=1);

/**
 * The origin secret - anotoki-lib 0.5.2 and the owner's decision of
 * 2026-10-13: Cloudflare's published ranges are every Cloudflare customer's,
 * not the owner's zone alone, so anybody's Worker can open a connection from
 * them and write a CF-Connecting-IP of its choosing, a new address for every
 * request. A Transform Rule of the owner's zone adds X-Anotoki-Origin with a
 * secret to every request through it, and the site - given the same value in
 * config/cloudflare.local.php (config/cloudflare.php) - believes
 * CF-Connecting-IP only on a request that carries it; any other request from
 * Cloudflare counts as the edge it came from, for the site's limits and the
 * library's alike (api/client_address.php, the AdminContext). Without the file
 * the site reads an address as before (tests/addresses.test.php). Here:
 *
 *   - the rule with the secret: none sent, a wrong one, the right one, the
 *     right one from outside Cloudflare's ranges;
 *   - through the whole API, the new visitors' limit and feedback's counting
 *     the edge, not the addresses a Worker makes up - and a visitor through
 *     the zone as themselves;
 *   - what the file may hold: only a string with something in it is a
 *     secret; anything else - a file PHP cannot run too - is none, said in
 *     the PHP log without the value.
 *
 * Through the whole API (api/index.php) in this process, on a database and a
 * backend copy of the test's own (tests/db_lib.php) whose
 * config/cloudflare.local.php holds a secret made up for the run.
 */

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Slim\Psr7\Factory\ServerRequestFactory;
use Slim\Psr7\Factory\StreamFactory;

require __DIR__ . '/lib.php';
require __DIR__ . '/db_lib.php';

testNeedsDatabase();

$database = testDatabase('origin');
$iamDir = testTempDir('iam');
$iam = testIam($iamDir);
$applicationFile = "$iamDir/application.json";
$anonymizedFile = "$iamDir/anonymized.json";
file_put_contents($applicationFile, json_encode(['client_id' => 'genshin', 'name' => 'Genshin', 'login_required' => false]));
file_put_contents($anonymizedFile, json_encode(['accounts' => []]));
$backend = testBackendCopy($database, ['jwks_file' => $iam['jwks'], 'application_file' => $applicationFile, 'anonymized_file' => $anonymizedFile]);

// The secret the owner's zone adds - made up for this run, never a real one - written as a hand might write it,
// with a line's end after it.
define('ORIGIN_SECRET', 'origin-' . bin2hex(random_bytes(20)));
file_put_contents("$backend/config/cloudflare.local.php", "<?php\n\nreturn " . var_export(['origin_secret' => ORIGIN_SECRET . "\n"], true) . ";\n");

define('ANOTOKI_ROUTES_ONLY', true);
require "$backend/api/index.php";

$built = siteMigrator(getDb())->apply();
check('a database built by every migration', $built['error'] === null, (string) $built['error']);
$pdo = getDb();

/** Cloudflare's edges, as a request through Cloudflare comes from one: an IPv4 one (172.64.0.0/13) and an IPv6 one. */
const EDGE = '172.68.10.20';
const EDGE6 = '2606:4700:10::6';
/** Somebody who is not Cloudflare, sending its headers all the same. */
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

/** One request through the whole app, from $from, by nobody signed in. */
function send(string $method, string $path, string $from, array $headers = [], mixed $json = null): ResponseInterface
{
    global $app;
    $request = requestFrom($from, $headers, $method, $path);
    if ($json !== null) {
        $request = $request->withHeader('Content-Type', 'application/json')->withBody((new StreamFactory())->createStream(json_encode($json)));
    }

    return $app->handle($request);
}

// ── The rule, with the secret ───────────────────────────────────────────────

echo "The rule: Cloudflare's word only through the owner's zone\n";

same('the secret, from config/cloudflare.local.php - the line\'s end after it no part of it (a header\'s value never has one)', ORIGIN_SECRET, originSecret());
$visitor = ['CF-Connecting-IP' => '198.51.100.7'];
$cases = [
    'through Cloudflare without X-Anotoki-Origin - a Worker of anybody\'s, writing the CF-Connecting-IP it likes: the edge\'s own' => [requestFrom(EDGE, $visitor), EDGE],
    '...over IPv6 too: the edge\'s /64' => [requestFrom(EDGE6, ['CF-Connecting-IP' => '2001:db8:aa:bb::1']), '2606:4700:10::/64'],
    'with a wrong X-Anotoki-Origin (another value): the edge\'s own' => [requestFrom(EDGE, $visitor + ['X-Anotoki-Origin' => 'not the secret']), EDGE],
    '...the secret one character short' => [requestFrom(EDGE, $visitor + ['X-Anotoki-Origin' => substr(ORIGIN_SECRET, 0, -1)]), EDGE],
    '...one character more' => [requestFrom(EDGE, $visitor + ['X-Anotoki-Origin' => ORIGIN_SECRET . 'x']), EDGE],
    '...in capitals' => [requestFrom(EDGE, $visitor + ['X-Anotoki-Origin' => strtoupper(ORIGIN_SECRET)]), EDGE],
    '...empty' => [requestFrom(EDGE, $visitor + ['X-Anotoki-Origin' => '']), EDGE],
    'with the zone\'s secret: the visitor Cloudflare names' => [requestFrom(EDGE, $visitor + ['X-Anotoki-Origin' => ORIGIN_SECRET]), '198.51.100.7'],
    '...over IPv6 too: the visitor\'s /64' => [requestFrom(EDGE6, ['CF-Connecting-IP' => '2001:db8:aa:bb:1:2:3:4', 'X-Anotoki-Origin' => ORIGIN_SECRET]), '2001:db8:aa:bb::/64'],
    'the zone\'s secret from outside Cloudflare\'s ranges: the connection\'s own - the secret alone opens nothing' => [requestFrom(STRANGER, $visitor + ['X-Anotoki-Origin' => ORIGIN_SECRET]), STRANGER],
];
foreach ($cases as $what => [$request, $expected]) {
    same($what, [$expected, $expected], [clientAddressCounted($request), siteAdminContext()->clientKey($request)]);
}

// ── The limits, through the whole API ───────────────────────────────────────

echo "The limits: a Worker's made-up visitors are the edge, the zone's visitors themselves\n";

const PLAYED = ['state' => ['tries' => ['Amber'], 'isQuestionComplete' => false]];
$made = [];
for ($i = 1; $i <= 11; $i++) {
    $made[] = send('PUT', '/api/quiz/progress/dish', EDGE, ['CF-Connecting-IP' => "198.51.100.$i"], PLAYED)->getStatusCode();
}
same('ten new visitors an hour from one address: a new CF-Connecting-IP every time without X-Anotoki-Origin is the edge - the eleventh refused', [array_fill(0, 10, 200), 429], [array_slice($made, 0, 10), $made[10]]);
same('...with a wrong secret, refused too', 429, send('PUT', '/api/quiz/progress/dish', EDGE, ['CF-Connecting-IP' => '198.51.100.12', 'X-Anotoki-Origin' => 'not the secret'], PLAYED)->getStatusCode());
same('...through the owner\'s zone - the secret beside it - the visitor is themselves: made', 200, send('PUT', '/api/quiz/progress/dish', EDGE, ['CF-Connecting-IP' => '198.51.100.13', 'X-Anotoki-Origin' => ORIGIN_SECRET], PLAYED)->getStatusCode());
$kept = $pdo->query('SELECT address FROM visitor_starts ORDER BY id')->fetchAll(PDO::FETCH_COLUMN);
same('visitor_starts: ten rows of the edge\'s, one of the visitor through the zone, none of the addresses made up', [11, 10, 1, 0], [
    count($kept),
    count(array_keys($kept, clientAddressHash(requestFrom(EDGE)), true)),
    count(array_keys($kept, clientAddressHash(requestFrom('198.51.100.13')), true)),
    count(array_intersect($kept, array_map(fn (int $i): string => clientAddressHash(requestFrom("198.51.100.$i")), range(1, 12)))),
]);

$feedback = [];
for ($i = 1; $i <= 6; $i++) {
    $feedback[] = send('POST', '/api/feedback', EDGE, ['CF-Connecting-IP' => "198.51.100.3$i"], ['kind' => 'other', 'message' => "A Worker's message $i"])->getStatusCode();
}
same('feedback (the library\'s limit, by the AdminContext): five an hour from one sender - a new CF-Connecting-IP every time without the secret is the edge, the sixth 429', [array_fill(0, 5, 201), 429], [array_slice($feedback, 0, 5), $feedback[5]]);
same('...through the zone, a visitor of their own may still write', 201, send('POST', '/api/feedback', EDGE, ['CF-Connecting-IP' => '198.51.100.40', 'X-Anotoki-Origin' => ORIGIN_SECRET], ['kind' => 'other', 'message' => 'Through the zone'])->getStatusCode());

// ── What the file may hold ───────────────────────────────────────────────────

echo "What config/cloudflare.local.php may hold: a string with something in it, or no secret\n";

foreach ([
    'no file' => [null, null, 0],
    'the secret' => [['origin_secret' => 'a-secret'], 'a-secret', 0],
    'the secret with spaces around it' => [['origin_secret' => " \ta-secret\n"], 'a-secret', 0],
    'an empty one' => [['origin_secret' => ''], null, 1],
    'only spaces' => [['origin_secret' => '   '], null, 1],
    'a number' => [['origin_secret' => 123456789012345678], null, 1],
    'a list' => [['origin_secret' => ['a-secret']], null, 1],
    'no origin_secret at all' => [[], null, 1],
    'a string, not an array' => ['a-secret', null, 1],
    'another key beside the secret' => [['origin_secret' => 'a-secret', 'secret' => 'x'], 'a-secret', 1],
] as $what => [$values, $secret, $problems]) {
    $result = originSecretFrom($values);
    same("$what: " . ($secret === null ? 'no secret' : 'the secret') . ", $problems sentence(s) for the log", [$secret, $problems], [$result['secret'], count($result['problems'])]);
}
$sentences = implode("\n", array_merge(
    originSecretFrom([ORIGIN_SECRET => 'origin_secret'])['problems'],
    originSecretFrom(['origin_secret' => [ORIGIN_SECRET]])['problems'],
    originSecretFrom(ORIGIN_SECRET)['problems'],
));
check('...and what the log is told never holds the value - nor a key, which a slip may have made the secret', $sentences !== '' && !str_contains($sentences, ORIGIN_SECRET), $sentences);

// A file PHP cannot run, through the real reading - in a process of its own: this one has read its file already
// (once a request). PHP's own message would quote the file: the log has the site's sentence alone.
$bare = 'secret_' . bin2hex(random_bytes(16));
foreach ([
    'a parse error (two strings side by side: PHP\'s message quotes the second)' => "<?php return ['origin_secret' => 'x' '" . ORIGIN_SECRET . "'];\n",
    'a word without its quotes (PHP\'s error quotes it)' => "<?php return ['origin_secret' => $bare];\n",
] as $what => $contents) {
    $dir = testTempDir('cloudflare');
    mkdir("$dir/config");
    mkdir("$dir/storage/cache", 0777, true);
    copy("$backend/config/local.php", "$dir/config/local.php");
    copy("$backend/config/cloudflare.php", "$dir/config/cloudflare.php");
    file_put_contents("$dir/config/cloudflare.local.php", $contents);
    file_put_contents("$dir/read.php", "<?php\nrequire " . var_export("$dir/config/cloudflare.php", true) . ";\nfile_put_contents(" . var_export("$dir/secret.txt", true) . ", var_export(originSecret(), true));\n");
    exec(escapeshellarg(PHP_BINARY) . ' -d ' . escapeshellarg("error_log=$dir/php.log") . ' ' . escapeshellarg("$dir/read.php") . ' 2>&1', $output, $code);
    $said = (string) @file_get_contents("$dir/php.log");
    same("$what: no secret, and the site goes on", [0, 'NULL'], [$code, (string) @file_get_contents("$dir/secret.txt")]);
    check('...said in the PHP log, with the site\'s sentence alone', str_contains($said, '[cloudflare] config/cloudflare.local.php cannot be read (PHP cannot run it), so there is no origin secret'), $said);
    check('...never with the value', !str_contains($said . implode("\n", $output), ORIGIN_SECRET) && !str_contains($said . implode("\n", $output), $bare));
}
