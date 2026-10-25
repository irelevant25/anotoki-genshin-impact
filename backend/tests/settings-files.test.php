<?php

declare(strict_types=1);

/**
 * Every hand-written settings file is read cleanly or not at all
 * (config/local.php's localConfigFileRead() - the anotoki family's rule: the
 * IAM's of 2026-10-13, Japanese Academy's review of 2026-10-18):
 *
 *   - one that does not start with <?php - a byte-order mark, a blank line or
 *     a space before it, no <?php line - is never compiled: required, it would
 *     print what comes before it (the database's password, the site secret,
 *     the origin secret) ahead of every answer, and with
 *     declare(strict_types=1) after such a start PHP cannot compile it at all:
 *     a fatal error no handler catches, every request a 500;
 *   - one that prints all the same (text after a closing tag, an echo) is
 *     caught, said by its byte count; one PHP cannot parse is said by the kind
 *     of its error and its line, never the error's words (which quote it);
 *   - what each file passed over means - database.local.php and
 *     secret.local.php: not set up, never a 500, nothing of them in any
 *     answer, the status page's included; cloudflare.local.php: FAILS CLOSED,
 *     a secret no request carries, so a CF-Connecting-IP forged from
 *     Cloudflare's ranges counts as the edge it came from (never "no secret",
 *     which would believe every Cloudflare customer's Worker) - and so does one
 *     read cleanly that names no usable secret, or a folder in its place, since
 *     2026-10-18: only deleting the file switches the secret off; visitors.local.php:
 *     the limits' defaults and no proxy trusted; site.local.php: not set up.
 *
 * The API runs in a PHP process of its own for each case - the settings are
 * read once a process - on a backend copy of the test's own (tests/db_lib.php)
 * and a database built by every migration; PHP's own log of each process is
 * read back.
 */

require __DIR__ . '/lib.php';
require __DIR__ . '/db_lib.php';
require TEST_BACKEND . '/vendor/autoload.php';
require TEST_BACKEND . '/api/migration_runner.php';
// localConfigFileRead() and visitorSettingsFrom() alone: nothing here reads this backend's own settings files.
require_once TEST_BACKEND . '/config/visitors.php';

/** The first five bytes' fault, as the log and the set-up check say it. */
const BAD_START = 'does not start with <?php (a byte-order mark, a blank line or a space before it, or no <?php line at all)';
const BOM = "\xEF\xBB\xBF";

// ── The reader, at its edges ────────────────────────────────────────────────

echo "localConfigFileRead(): read cleanly, or not at all\n";

$folder = testTempDir('settings-edges');
$write = static function (string $name, string $contents) use ($folder): string {
    file_put_contents("$folder/$name", $contents);

    return "$folder/$name";
};
$secret = 'hand-written-' . bin2hex(random_bytes(12));
$value = var_export(['secret' => $secret], true);

same('a file that starts with <?php: what it returns', ['value' => ['secret' => $secret], 'error' => null], localConfigFileRead($write('plain.php', "<?php\n\nreturn {$value};\n")));
same('...<?PHP too, as PHP reads it', ['value' => ['a' => 1], 'error' => null], localConfigFileRead($write('upper.php', "<?PHP return ['a' => 1];\n")));
same(
    '...<?php declare(strict_types=1); on its first line',
    ['value' => ['a' => 1], 'error' => null],
    localConfigFileRead($write('strict.php', "<?php declare(strict_types=1);\n\nreturn ['a' => 1];\n")),
);
foreach (
    [
        'no <?php line' => "return {$value};\n",
        'a byte-order mark before <?php' => BOM . "<?php\n\nreturn {$value};\n",
        'a blank line before <?php' => "\n<?php\n\nreturn {$value};\n",
        'a space before <?php' => " <?php\n\nreturn {$value};\n",
        // Compiled, these two would end this very process: "strict_types declaration must be the very first statement".
        'a byte-order mark before <?php declare(strict_types=1);' => BOM . "<?php declare(strict_types=1);\n\nreturn {$value};\n",
        'a blank line before <?php declare(strict_types=1);' => "\n<?php declare(strict_types=1);\n\nreturn {$value};\n",
        'an empty file' => '',
        'four bytes' => '<?ph',
    ]
    as $what => $contents
) {
    $level = ob_get_level();
    ob_start();
    $read = localConfigFileRead($write('start.php', $contents));
    $printed = (string) ob_get_clean();
    same("$what: never compiled, nothing printed, passed over by its start", [null, BAD_START, '', $level], [$read['value'], $read['error'], $printed, ob_get_level()]);
}
foreach (
    [
        'text after a closing tag' => [
            "<?php \$kept = 1; ?>\n{$secret}\n<?php return {$value};\n",
            'prints ' . (strlen($secret) + 1) . ' bytes of its own (text after a closing tag, or something it echoes)',
        ],
        'an echo' => ['<?php echo ' . var_export($secret, true) . "; return {$value};\n", 'prints ' . strlen($secret) . ' bytes of its own (text after a closing tag, or something it echoes)'],
        'a buffer of its own left open' => [
            '<?php ob_start(); echo ' . var_export($secret, true) . "; return {$value};\n",
            'prints ' . strlen($secret) . ' bytes of its own (text after a closing tag, or something it echoes)',
        ],
        'two strings side by side (PHP\'s message would quote the second)' => ["<?php\n\nreturn ['secret' => 'x' '{$secret}'];\n", 'cannot be read (ParseError on line 3)'],
        'a function nobody wrote' => ["<?php\n\nreturn ['secret' => " . var_export($secret, true) . " . no_such_settings_function()];\n", 'cannot be read (Error on line 3)'],
    ]
    as $what => [$contents, $error]
) {
    $level = ob_get_level();
    ob_start();
    $read = localConfigFileRead($write('prints.php', $contents));
    $printed = (string) ob_get_clean();
    same("$what: caught, said by its fault alone - never a word of the file", [null, $error, '', $level], [$read['value'], $read['error'], $printed, ob_get_level()]);
}
$read = localConfigFileRead($folder);
check('a folder: no file', $read['value'] === null && $read['error'] !== null, (string) $read['error']);

// ── What a file passed over means: through the whole API, a process a case ─

echo "Through the whole API, a process for each case\n";

$database = testDatabase('settings');
$iamDir = testTempDir('iam');
$iam = testIam($iamDir);
file_put_contents("$iamDir/application.json", json_encode(['client_id' => 'genshin', 'name' => 'Genshin', 'login_required' => false]));
file_put_contents("$iamDir/anonymized.json", json_encode(['accounts' => []]));
$backend = testBackendCopy($database, ['jwks_file' => $iam['jwks'], 'application_file' => "$iamDir/application.json", 'anonymized_file' => "$iamDir/anonymized.json"]);
$built = siteMigrator(testPdo($database))->apply();
check('a database built by every migration', $built['error'] === null, (string) $built['error']);

// One case: this backend copy's API in a process of its own, asked what the case asks - each answer with whatever
// was printed beside it - and the address rule's verdicts; the secret it runs on by its hash and its shape alone.
file_put_contents(
    "$backend/settings-case.php",
    <<<'PHP'
    <?php

    declare(strict_types=1);

    use Slim\Psr7\Factory\ServerRequestFactory;
    use Slim\Psr7\Factory\StreamFactory;

    define('ANOTOKI_ROUTES_ONLY', true);
    ob_start();
    require __DIR__ . '/api/index.php';
    $out = ['boot' => (string) ob_get_clean(), 'answers' => [], 'addresses' => []];
    $asks = json_decode((string) file_get_contents($argv[1]), true);
    $request = static function (array $ask): Psr\Http\Message\ServerRequestInterface {
        $request = (new ServerRequestFactory())->createServerRequest($ask['method'] ?? 'GET', 'http://localhost' . ($ask['path'] ?? '/api/regions'), ['REMOTE_ADDR' => $ask['from'] ?? '127.0.0.1']);
        foreach ($ask['headers'] ?? [] as $name => $value) {
            $request = $request->withHeader($name, $value);
        }
        if (isset($ask['json'])) {
            $request = $request->withHeader('Content-Type', 'application/json')->withBody((new StreamFactory())->createStream(json_encode($ask['json'])));
        }

        return $request;
    };
    foreach ($asks['requests'] ?? [] as $ask) {
        ob_start();
        $response = $app->handle($request($ask));
        $out['answers'][] = ['status' => $response->getStatusCode(), 'body' => (string) $response->getBody(), 'printed' => (string) ob_get_clean()];
    }
    ob_start();
    foreach ($asks['addresses'] ?? [] as $ask) {
        $out['addresses'][] = [clientAddressCounted($request($ask)), siteAdminContext()->clientKey($request($ask))];
    }
    $secret = originSecret();
    $out['secret'] = $secret === null ? null : ['sha256' => hash('sha256', $secret), 'unmatchable' => preg_match('/^[0-9a-f]{64}$/D', $secret) === 1];
    $out['proxies'] = siteTrustedProxies();
    $out['keepDays'] = visitorSettings()['visitors']['keep_days'];
    $out['problems'] = localConfigProblems();
    $out['late'] = (string) ob_get_clean();
    echo "\n##case " . json_encode($out) . "\n";
    PHP
    ,
);

/**
 * Runs one case with config/{name}.local.php holding $contents (the copy's own put back after it): what the case
 * printed, its exit code, what it answered and PHP's log of it.
 *
 * @return array{code: int, output: string, run: ?array, log: string}
 */
function settingsCase(string $backend, string $name, ?string $contents, array $asks): array
{
    $file = "$backend/config/$name.local.php";
    $kept = is_file($file) ? (string) file_get_contents($file) : null;
    if ($contents !== null) {
        file_put_contents($file, $contents);
    }
    // Each case says its file afresh: what was said once is not said again (the stamps in storage/cache).
    array_map('unlink', glob("$backend/storage/cache/*-reported*") ?: []);
    $dir = testTempDir('settings-case');
    file_put_contents("$dir/asks.json", json_encode($asks));
    try {
        $output = [];
        // PHP's own warnings to its log, as on a host: what the process prints is the files' and the app's alone.
        exec(
            escapeshellarg(PHP_BINARY) .
                ' -d display_errors=0 -d log_errors=1 -d ' .
                escapeshellarg("error_log=$dir/php.log") .
                ' ' .
                escapeshellarg("$backend/settings-case.php") .
                ' ' .
                escapeshellarg("$dir/asks.json") .
                ' 2>&1',
            $output,
            $code,
        );
    } finally {
        if ($kept === null) {
            @unlink($file);
        } else {
            file_put_contents($file, $kept);
        }
    }
    $output = implode("\n", $output);
    $run = preg_match('/^##case (.+)$/m', $output, $m) ? json_decode($m[1], true) : null;

    return ['code' => $code, 'output' => $output, 'run' => $run, 'log' => (string) @file_get_contents("$dir/php.log")];
}

/** Whatever a case printed or answered, and PHP's log of it, in one text - to look for a word of the file in. */
function settingsCaseText(array $case): string
{
    return $case['output'] . "\n" . $case['log'];
}

// The database's file - the password it holds a marker made for the run, never a real one - as a hand might
// leave it. A plain require would print it ahead of every answer, or not compile at all.
$password = 'pw-' . bin2hex(random_bytes(12));
$connection = var_export(['driver' => 'pgsql', 'host' => '127.0.0.1', 'port' => 5432, 'username' => 'genshin', 'password' => $password, 'database' => 'anotoki_genshin'], true);
$databaseCases = [
    'a byte-order mark and no <?php line' => [BOM . "return {$connection};\n", BAD_START],
    'a byte-order mark before <?php declare(strict_types=1);' => [BOM . "<?php declare(strict_types=1);\n\nreturn {$connection};\n", BAD_START],
    'a blank line before <?php declare(strict_types=1);' => ["\n<?php declare(strict_types=1);\n\nreturn {$connection};\n", BAD_START],
    'text after a closing tag' => [
        "<?php ?>\n{$password}\n<?php return {$connection};\n",
        'prints ' . (strlen($password) + 1) . ' bytes of its own (text after a closing tag, or something it echoes)',
    ],
];
$paths = [
    ['path' => '/api/site-status'],
    ['path' => '/api/settings/public'],
    ['path' => '/api/translations/en'],
    ['path' => '/api/characters'],
    ['method' => 'POST', 'path' => '/api/feedback', 'json' => ['kind' => 'other', 'message' => 'hello']],
];

// The attack itself: what PHP does with such a file when it is simply required.
$probe = testTempDir('settings-probe');
file_put_contents("$probe/database.local.php", $databaseCases['a byte-order mark and no <?php line'][0]);
exec(escapeshellarg(PHP_BINARY) . ' -r ' . escapeshellarg('require ' . var_export("$probe/database.local.php", true) . ';') . ' 2>&1', $plain, $plainCode);
check('the attack: a plain require of a file with a byte-order mark and no <?php line prints the password', str_contains(implode("\n", $plain), $password));
file_put_contents("$probe/database.local.php", $databaseCases['a blank line before <?php declare(strict_types=1);'][0]);
$plain = [];
exec(escapeshellarg(PHP_BINARY) . ' -d display_errors=1 -r ' . escapeshellarg('require ' . var_export("$probe/database.local.php", true) . ';') . ' 2>&1', $plain, $plainCode);
check(
    '...and one with a blank line before <?php declare(strict_types=1); is a fatal error a plain require never gets past (exit 255)',
    $plainCode === 255 && str_contains(implode("\n", $plain), 'strict_types declaration must be the very first statement'),
    "exit $plainCode",
);

foreach ($databaseCases as $what => [$contents, $fault]) {
    $case = settingsCase($backend, 'database', $contents, ['requests' => $paths]);
    $run = $case['run'];
    check(
        "database.local.php, $what: the process runs to its end - no fatal error, never a 500 for every request",
        $case['code'] === 0 && $run !== null,
        "exit {$case['code']}: " . substr($case['output'], 0, 300),
    );
    if ($run === null) {
        continue;
    }
    same(
        '...nothing printed, ahead of an answer or anywhere else',
        ['', '', [''], ''],
        [$run['boot'], $run['late'], array_values(array_unique(array_column($run['answers'], 'printed'))), trim((string) strstr($case['output'], "\n##case", true))],
    );
    $status = json_decode($run['answers'][0]['body'], true);
    same('...the status page says not set up', [200, 'not_set_up'], [$run['answers'][0]['status'], $status['state'] ?? null]);
    same(
        '...every other address answers 503 not_set_up',
        [[503, 'not_set_up'], [503, 'not_set_up'], [503, 'not_set_up'], [503, 'not_set_up']],
        array_map(static fn(array $answer): array => [$answer['status'], json_decode($answer['body'], true)['code'] ?? null], array_slice($run['answers'], 1)),
    );
    check('...no answer carries the password, the status page\'s included', !str_contains(implode("\n", array_column($run['answers'], 'body')), $password));
    same('...the set-up check names the file and its fault, never a word of it', ["config/database.local.php $fault: it is passed over, nothing in it read."], array_slice($run['problems'], 0, 1));
    check('...said in PHP\'s log by its fault', str_contains($case['log'], "[settings] config/database.local.php $fault"), $case['log']);
    check('...and the password nowhere: not in what the process printed, not in the log', !str_contains(settingsCaseText($case), $password));
}

// The site secret with a byte-order mark: not set up, the key in no answer.
$key = bin2hex(random_bytes(32));
$case = settingsCase($backend, 'secret', BOM . "<?php declare(strict_types=1);\n\nreturn " . var_export($key, true) . ";\n", [
    'requests' => [['path' => '/api/site-status'], ['path' => '/api/characters']],
]);
same(
    'secret.local.php with a byte-order mark before <?php declare(strict_types=1);: not set up, never a 500',
    [0, 'not_set_up', 503],
    [$case['code'], json_decode($case['run']['answers'][0]['body'] ?? '{}', true)['state'] ?? null, $case['run']['answers'][1]['status'] ?? null],
);
same('...the set-up check names it', ['config/secret.local.php ' . BAD_START . ': it is passed over, nothing in it read.'], array_slice($case['run']['problems'] ?? [], 0, 1));
check('...the key nowhere', !str_contains(settingsCaseText($case), $key));

// site.local.php: which site this is, never guessed.
foreach (
    [
        'with a byte-order mark' => [BOM . "<?php return 'genshin_impact';\n", 'config/site.local.php ' . BAD_START . ': which site this is cannot be told.'],
        'that names no site (no return)' => ["<?php\n\n\$site = 'genshin_impact';\n", 'config/site.local.php names no site: it returns int, not a site\'s code.'],
    ]
    as $what => [$contents, $problem]
) {
    $case = settingsCase($backend, 'site', $contents, ['requests' => [['path' => '/api/site-status'], ['path' => '/api/settings/public']]]);
    same(
        "site.local.php $what: not set up - never genshin_impact's switches guessed in another site's database",
        [0, 'not_set_up', 503, [$problem]],
        [$case['code'], json_decode($case['run']['answers'][0]['body'] ?? '{}', true)['state'] ?? null, $case['run']['answers'][1]['status'] ?? null, $case['run']['problems'] ?? null],
    );
}
$case = settingsCase($backend, 'site', "<?php\n\nreturn 'genshin_impact';\n", ['requests' => [['path' => '/api/site-status']]]);
same('...one that names the site: set up', [[], 'ready'], [$case['run']['problems'] ?? null, json_decode($case['run']['answers'][0]['body'] ?? '{}', true)['state'] ?? null]);

// ── app.local.php: this site's address, for robots.txt and sitemap.xml ──────

echo "app.local.php: the site's address - optional; passed over, robots.txt names no sitemap\n";

$robotsAsks = ['requests' => [['path' => '/api/site-status'], ['path' => '/robots.txt'], ['path' => '/sitemap.xml']]];
$address = 'https://genshin-' . bin2hex(random_bytes(6)) . '.example';
foreach (
    [
        'none at all' => null,
        'with a byte-order mark' => BOM . "<?php return ['url' => '$address'];\n",
        'text after a closing tag' => "<?php ?>\n$address\n<?php return ['url' => '$address'];\n",
        'whose url is no origin (a path after it)' => "<?php\n\nreturn ['url' => '$address/genshin'];\n",
        'that names no url' => "<?php\n\nreturn ['address' => '$address'];\n",
    ]
    as $what => $contents
) {
    $case = settingsCase($backend, 'app', $contents, $robotsAsks);
    $answers = $case['run']['answers'] ?? [];
    same(
        "app.local.php $what: still set up and ready, robots.txt answered with no Sitemap line, sitemap.xml 404 not_configured - nothing printed",
        [0, [], 'ready', 200, false, 404, 'not_configured', ''],
        [
            $case['code'],
            $case['run']['problems'] ?? null,
            json_decode($answers[0]['body'] ?? '{}', true)['state'] ?? null,
            $answers[1]['status'] ?? null,
            str_contains($answers[1]['body'] ?? 'Sitemap:', 'Sitemap:'),
            $answers[2]['status'] ?? null,
            json_decode($answers[2]['body'] ?? '{}', true)['code'] ?? null,
            ($case['run']['boot'] ?? '?') . implode('', array_column($answers, 'printed')),
        ],
    );
    check('...the address in no answer, the sitemap\'s line included', !str_contains(implode("\n", array_column($answers, 'body')), $address));
}
$case = settingsCase($backend, 'app', "<?php\n\nreturn ['url' => '$address/', 'cors_origins' => ['https://other.example']];\n", $robotsAsks);
$answers = $case['run']['answers'] ?? [];
same(
    '...one that names it (an old file\'s cors_origins beside it, unread): the sitemap named there, and served',
    [true, 200],
    [str_contains($answers[1]['body'] ?? '', "Sitemap: $address/sitemap.xml"), $answers[2]['status'] ?? null],
);

// ── cloudflare.local.php: a file that cannot be read cleanly fails closed ───

echo "cloudflare.local.php: passed over, it fails closed - a secret no request carries\n";

/** Cloudflare's edges (172.64.0.0/13), and somebody outside its ranges sending its headers all the same. */
const EDGE = '172.68.10.20';
const STRANGER = '203.0.113.5';

$origin = 'origin-' . bin2hex(random_bytes(20));
$secretFile = var_export(['origin_secret' => $origin], true);
$forged = ['CF-Connecting-IP' => '198.51.100.7'];
$addresses = [['from' => EDGE, 'headers' => $forged], ['from' => EDGE, 'headers' => $forged + ['X-Anotoki-Origin' => $origin]], ['from' => STRANGER, 'headers' => $forged]];
$case = settingsCase($backend, 'cloudflare', "<?php\n\nreturn {$secretFile};\n", ['addresses' => $addresses]);
same(
    'read cleanly: the secret is the file\'s, and a request carrying it is the visitor Cloudflare names',
    [false, hash('sha256', $origin), [[EDGE, EDGE], ['198.51.100.7', '198.51.100.7'], [STRANGER, STRANGER]]],
    [$case['run']['secret']['unmatchable'] ?? null, $case['run']['secret']['sha256'] ?? null, $case['run']['addresses'] ?? null],
);
$case = settingsCase($backend, 'cloudflare', null, ['addresses' => $addresses]);
same(
    'no file: no secret - CF-Connecting-IP believed from Cloudflare\'s ranges alone, as before',
    [null, [['198.51.100.7', '198.51.100.7'], ['198.51.100.7', '198.51.100.7'], [STRANGER, STRANGER]]],
    [array_key_exists('secret', $case['run'] ?? []) ? $case['run']['secret'] : 'missing', $case['run']['addresses'] ?? null],
);

foreach (
    [
        'a byte-order mark before <?php declare(strict_types=1);' => [BOM . "<?php declare(strict_types=1);\n\nreturn {$secretFile};\n", BAD_START],
        'a blank line before <?php declare(strict_types=1);' => ["\n<?php declare(strict_types=1);\n\nreturn {$secretFile};\n", BAD_START],
        'no <?php line' => ["return {$secretFile};\n", BAD_START],
        'a byte-order mark before <?php' => [BOM . "<?php\n\nreturn {$secretFile};\n", BAD_START],
        'text after a closing tag' => [
            "<?php ?>\n{$origin}\n<?php return {$secretFile};\n",
            'prints ' . (strlen($origin) + 1) . ' bytes of its own (text after a closing tag, or something it echoes)',
        ],
        'two strings side by side' => ["<?php\n\nreturn ['origin_secret' => 'x' '{$origin}'];\n", 'cannot be read (ParseError on line 3)'],
    ]
    as $what => [$contents, $fault]
) {
    $case = settingsCase($backend, 'cloudflare', $contents, ['addresses' => $addresses, 'requests' => [['path' => '/api/site-status']]]);
    $run = $case['run'];
    check(
        "$what: the site keeps running, set up - the file is optional",
        $case['code'] === 0 && ($run['problems'] ?? null) === [] && (json_decode($run['answers'][0]['body'] ?? '{}', true)['state'] ?? null) === 'ready',
        "exit {$case['code']}: " . substr($case['output'], 0, 300),
    );
    check('...the secret it runs on is one no request carries - not the file\'s', ($run['secret']['unmatchable'] ?? false) === true && ($run['secret']['sha256'] ?? '') !== hash('sha256', $origin));
    same(
        '...fails closed: a CF-Connecting-IP forged from Cloudflare\'s ranges is the edge - with the file\'s own value beside it too, for the site and the library alike; from elsewhere the connection',
        [[EDGE, EDGE], [EDGE, EDGE], [STRANGER, STRANGER]],
        $run['addresses'] ?? null,
    );
    check(
        '...said in PHP\'s log: the fault, and that it fails closed',
        str_contains($case['log'], "config/cloudflare.local.php $fault") && str_contains($case['log'], 'no request carries its secret'),
        $case['log'],
    );
    check('...never the secret, nor what PHP said of the file', !str_contains(settingsCaseText($case), $origin) && !str_contains($case['log'], 'strict_types'));
}

// Read cleanly but naming no usable secret, and a folder in the file's place: each fails closed too (2026-10-18, the
// owner's "do as you think is the best"), a secret no request carries - never "no secret", which would believe
// CF-Connecting-IP from every Cloudflare customer's Worker. Only deleting the file switches the secret off (no file,
// above). A forged request may carry the file's own value, or an empty X-Anotoki-Origin to match a blank secret: the
// edge either way.
const FOLDER = "\0a folder";
$withEmpty = [...$addresses, ['from' => EDGE, 'headers' => $forged + ['X-Anotoki-Origin' => '']]];
foreach (
    [
        'blank' => ["<?php\n\nreturn ['origin_secret' => ''];\n", 'origin_secret must be a string with something in it, not an empty one'],
        'no array (the secret alone, returned)' => ["<?php\n\nreturn " . var_export($origin, true) . ";\n", 'config/cloudflare.local.php returns string, not an array'],
        'a misspelt key' => ["<?php\n\nreturn " . var_export(['orgin_secret' => $origin], true) . ";\n", 'origin_secret must be a string with something in it, not null'],
        'another key in its place' => ["<?php\n\nreturn " . var_export(['secret' => $origin], true) . ";\n", 'origin_secret must be a string with something in it, not null'],
        'a value that is not a string' => ["<?php\n\nreturn ['origin_secret' => 4242424242];\n", 'origin_secret must be a string with something in it, not int'],
        'a forgotten return (require gives 1)' => ["<?php\n\n\$cloudflare = {$secretFile};\n", 'config/cloudflare.local.php returns int, not an array'],
        'a folder in its place' => [FOLDER, 'config/cloudflare.local.php cannot be read cleanly (is not a file'],
    ]
    as $what => [$contents, $fault]
) {
    $file = "$backend/config/cloudflare.local.php";
    if ($contents === FOLDER) {
        mkdir($file);
    }
    try {
        $case = settingsCase($backend, 'cloudflare', $contents === FOLDER ? null : $contents, ['addresses' => $withEmpty, 'requests' => [['path' => '/api/site-status']]]);
    } finally {
        if (is_dir($file)) {
            rmdir($file);
        }
    }
    $run = $case['run'];
    check(
        "read cleanly, $what: the site keeps running, set up - the file is optional",
        $case['code'] === 0 && ($run['problems'] ?? null) === [] && (json_decode($run['answers'][0]['body'] ?? '{}', true)['state'] ?? null) === 'ready',
        "exit {$case['code']}: " . substr($case['output'], 0, 300),
    );
    check('...the secret it runs on is one no request carries - never none', ($run['secret']['unmatchable'] ?? false) === true && ($run['secret']['sha256'] ?? '') !== hash('sha256', $origin));
    same(
        '...fails closed: a CF-Connecting-IP forged from Cloudflare\'s ranges is the edge - with the file\'s value or an empty X-Anotoki-Origin beside it too, for the site and the library alike; from elsewhere the connection',
        [[EDGE, EDGE], [EDGE, EDGE], [STRANGER, STRANGER], [EDGE, EDGE]],
        $run['addresses'] ?? null,
    );
    check('...said in PHP\'s log: the fault, that it fails closed', str_contains($case['log'], "[cloudflare] $fault") && str_contains($case['log'], 'no request carries its secret'), $case['log']);
    check('...never the value', !str_contains(settingsCaseText($case), $origin));
}

// The limits, through the whole API: eleven new visitors from one edge, each with an address of its own and the
// file's own secret beside it - a Worker of anybody's could send exactly this - are one sender.
$played = ['state' => ['tries' => ['Amber'], 'isQuestionComplete' => false]];
$requests = [];
for ($i = 1; $i <= 11; $i++) {
    $requests[] = ['method' => 'PUT', 'path' => '/api/quiz/progress/dish', 'from' => EDGE, 'headers' => ['CF-Connecting-IP' => "198.51.100.$i", 'X-Anotoki-Origin' => $origin], 'json' => $played];
}
$case = settingsCase($backend, 'cloudflare', BOM . "<?php declare(strict_types=1);\n\nreturn {$secretFile};\n", ['requests' => $requests]);
same(
    'the attack it stops: with the file unreadable, eleven made-up visitors from one Cloudflare edge are one sender - the eleventh refused, never eleven of their own',
    [array_fill(0, 10, 200), 429],
    [array_slice(array_column($case['run']['answers'] ?? [], 'status'), 0, 10), $case['run']['answers'][10]['status'] ?? null],
);
// ...and with a blank secret: a Worker's eleven made-up visitors, each with an empty X-Anotoki-Origin - which "no
// secret" would never have asked for - one sender too. From another edge (172.64.0.0/13): the one above has had its
// ten this hour.
$requests = [];
for ($i = 1; $i <= 11; $i++) {
    $requests[] = ['method' => 'PUT', 'path' => '/api/quiz/progress/dish', 'from' => '172.68.10.21', 'headers' => ['CF-Connecting-IP' => "198.51.100.$i", 'X-Anotoki-Origin' => ''], 'json' => $played];
}
$case = settingsCase($backend, 'cloudflare', "<?php\n\nreturn ['origin_secret' => ''];\n", ['requests' => $requests]);
same(
    '...with the file read cleanly but its secret blank, the same: the eleventh refused',
    [array_fill(0, 10, 200), 429],
    [array_slice(array_column($case['run']['answers'] ?? [], 'status'), 0, 10), $case['run']['answers'][10]['status'] ?? null],
);

// ── visitors.local.php: passed over, no proxy is trusted ─────────────────────

echo "visitors.local.php: passed over, the limits' defaults and no proxy trusted\n";

$case = settingsCase($backend, 'visitors', BOM . "<?php declare(strict_types=1);\n\nreturn ['visitors' => ['keep_days' => 60], 'client_address' => ['trusted_proxies' => []]];\n", [
    'addresses' => [['from' => EDGE, 'headers' => $forged], ['from' => STRANGER, 'headers' => $forged]],
    'requests' => [['path' => '/api/site-status']],
]);
same(
    'a byte-order mark before <?php declare(strict_types=1);: the site runs, the limits at their defaults, no proxy trusted - a request from Cloudflare\'s ranges is its connection, never Cloudflare\'s ranges believed by default',
    [0, [], 30, [], [[EDGE, EDGE], [STRANGER, STRANGER]]],
    [$case['code'], $case['run']['problems'] ?? null, $case['run']['keepDays'] ?? null, $case['run']['proxies'] ?? null, $case['run']['addresses'] ?? null],
);
check('...said in PHP\'s log', str_contains($case['log'], '[visitors] config/visitors.local.php cannot be read cleanly (' . BAD_START . ')'), $case['log']);

$returnsOne = visitorSettingsFrom(1);
same('read cleanly but no array - a forgotten return, require giving 1: no proxy trusted, never Cloudflare\'s ranges by default', [], $returnsOne['settings']['client_address']['trusted_proxies']);
same('...the limits at their defaults', VISITOR_SETTING_DEFAULTS['visitors'], $returnsOne['settings']['visitors']);
check(
    '...and said so',
    str_contains($returnsOne['problems'][0] ?? '', 'returns int, not an array') && str_contains($returnsOne['problems'][0] ?? '', 'no proxy is trusted'),
    $returnsOne['problems'][0] ?? '',
);
same('read cleanly, a client_address that is no list: no proxy trusted', [], visitorSettingsFrom(['client_address' => 'cloudflare'])['settings']['client_address']['trusted_proxies']);
same(
    '...a trusted_proxies that is no list: none either - never the committed ranges by default',
    [],
    visitorSettingsFrom(['client_address' => ['trusted_proxies' => '173.245.48.0/20']])['settings']['client_address']['trusted_proxies'],
);
same(
    '...a file that says nothing of them: Cloudflare\'s committed ranges, as without the file',
    VISITOR_SETTING_DEFAULTS['client_address']['trusted_proxies'],
    visitorSettingsFrom(['visitors' => ['keep_days' => 60]])['settings']['client_address']['trusted_proxies'],
);

// ── setup.php on a host: a token it cannot read back accepts no proof ───────

echo "setup.php on a host: a setup token it cannot read back is no token at all\n";

/**
 * setup.php served by PHP's built-in server from this backend copy, asked under a host's name - so it is on the
 * hosting, not this computer, and asks for the setup token - each answer's body. $staleCache: PHP's opcode cache
 * keeping every file as it was first compiled (no timestamps checked), as a host's cache can serve a token file as it
 * was before the installer wrote a new one.
 *
 * @param list<array{method?: string, fields?: array<string, string>, nonce?: string}> $asks
 * @return list<string>
 */
function setupOnHost(string $backend, bool $staleCache, array $asks): array
{
    $socket = stream_socket_server('tcp://127.0.0.1:0');
    $port = (int) substr(strrchr((string) stream_socket_get_name($socket, false), ':'), 1);
    fclose($socket);
    $cache = $staleCache
        ? ['-d', 'opcache.enable=1', '-d', 'opcache.enable_cli=1', '-d', 'opcache.validate_timestamps=0', '-d', 'opcache.file_update_protection=0']
        : ['-d', 'opcache.enable=0', '-d', 'opcache.enable_cli=0'];
    $log = testTempDir('setup-host') . '/server.log';
    $server = proc_open(array_merge([PHP_BINARY], $cache, ['-d', 'display_errors=0', '-S', "127.0.0.1:$port", '-t', $backend]), [1 => ['file', $log, 'a'], 2 => ['file', $log, 'a']], $pipes);
    $bodies = [];
    try {
        $up = false;
        for ($try = 0; $try < 100 && !$up; $try++) {
            $probe = @fsockopen('127.0.0.1', $port, $errno, $errstr, 0.2);
            if ($probe !== false) {
                fclose($probe);
                $up = true;
            } else {
                usleep(100_000);
            }
        }
        foreach ($asks as $ask) {
            $nonce = $ask['nonce'] ?? bin2hex(random_bytes(24));
            $post = ($ask['method'] ?? 'GET') === 'POST';
            $context = stream_context_create([
                'http' => [
                    'method' => $post ? 'POST' : 'GET',
                    'header' => "Host: genshin.example\r\nCookie: genshin_setup_nonce=$nonce\r\n" . ($post ? "Content-Type: application/x-www-form-urlencoded\r\n" : ''),
                    'content' => $post ? http_build_query(['nonce' => $nonce] + ($ask['fields'] ?? [])) : '',
                    'ignore_errors' => true,
                    'timeout' => 30,
                ],
            ]);
            $bodies[] = (string) @file_get_contents("http://127.0.0.1:$port/setup.php", false, $context);
        }
    } finally {
        proc_terminate($server);
        proc_close($server);
    }

    return $bodies;
}

copy(TEST_BACKEND . '/setup.php', "$backend/setup.php");
$tokenFile = "$backend/config/setup.local.php";

// A token file read cleanly that holds no token (it returns no array): the installer writes a new one and reads that.
file_put_contents($tokenFile, "<?php\n\nreturn 1;\n");
touch($tokenFile, time() - 60);
[$shown, $posted] = setupOnHost($backend, false, [[], ['method' => 'POST', 'fields' => ['action' => 'install']]]);
check(
    'a token file with no token in it: a new one written and read back - the page asks for it',
    str_contains($shown, 'name="token"') && !str_contains($shown, 'Cannot read config/setup.local.php'),
    substr(strip_tags($shown), 0, 300),
);
check('...and a post without it is refused', str_contains($posted, 'That is not the setup token from config/setup.local.php.'), substr(strip_tags($posted), 0, 300));

// The same file, served by a cache that keeps it as it was: the new token is never read back. Before the fix this was
// an empty token, which a post carrying none matched (hash_equals('', '')) - the installer anybody's.
file_put_contents($tokenFile, "<?php\n\nreturn 1;\n");
touch($tokenFile, time() - 60);
[$shown, $posted] = setupOnHost($backend, true, [[], ['method' => 'POST', 'fields' => ['action' => 'install']]]);
check(
    'the attack it stops: a token written but never read back - the page says so and asks for no token',
    str_contains($shown, 'Cannot read config/setup.local.php') && !str_contains($shown, 'name="token"'),
    substr(strip_tags($shown), 0, 300),
);
check(
    '...and a post carrying no token is never taken: the same page, nothing saved',
    str_contains($posted, 'Cannot read config/setup.local.php') && !is_file("$backend/storage/installed.lock"),
    substr(strip_tags($posted), 0, 300),
);
@unlink($tokenFile);
@unlink("$backend/setup.php");
