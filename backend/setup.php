<?php

declare(strict_types=1);

/**
 * setup.php - the installer, and how every copy of this site gets its config.
 *
 * Everything that differs between one installation and the next is read from
 * config/*.local.php (see config/local.php), and this page writes all of it.
 * Until those files exist the API answers every request 503 not_set_up and,
 * until this has finished on a host, points here - so this is the first thing
 * to open on a fresh checkout as much as on a fresh hosting account:
 *
 *   config/database.local.php  the PostgreSQL connection and the database's name
 *   config/secret.local.php    a random site secret, made once and never replaced
 *                              (a jwt.local.php from before the IAM is carried
 *                              over instead, so the hashes made with it stay valid)
 *   config/iam.local.php       the IAM's address and this site's client id there
 *   config/backup.local.php    pg_dump paths - on hosting only, when the client
 *                              tools are unpacked under ~/pgclient (the hosting
 *                              account's home, found by itself)
 *
 * It asks for the database, the IAM and - on a host - the setup token, and
 * nothing else. This site's address, which the IAM test checks the callback
 * of, is read from the request this page was opened with.
 *
 * It builds the database first - creates it where the database user may, then
 * applies every pending migration of both folders (migrations/users/, the
 * site's half, and migrations/genshin_impact/, the game content) and of the
 * anotoki library's sets around them (anotoki_admin before, anotoki_translations
 * and anotoki_people after) - and writes nothing until that has worked, so a
 * connection that does not work leaves no config behind. No backup is taken
 * first, as the admin panel's Apply and migration.php take one: on a real host
 * this builds an empty database, and the database it builds may not be the one
 * the settings it is about to write name yet.
 *
 * TWO WAYS TO RUN
 *
 * On this computer it is a settings page: it starts from the development
 * values, shows what is saved, never shows a secret back (a blank password
 * keeps the saved one), and can be run again whenever something changes. Each
 * form carries a nonce that has to match a script-proof, same-site cookie, so
 * no other page open in the same browser can post to it.
 *
 * Anywhere else it is the one-time installer, and anybody can reach it, so it
 * first proves you own the server: on first view it writes a random token into
 * config/setup.local.php, and only somebody with FTP/SFTP access can read it
 * back. When the install is done it writes storage/installed.lock - which makes
 * it refuse to run again even if the rest fails, and from which the site never
 * offers this page to anybody again (api/site_state.php) - then deletes the
 * token file and itself. Delete setup.php by hand if the host would not let it.
 *
 * "This computer" takes three things at once. A loopback address alone is what
 * every request looks like on a host that runs a proxy in front of PHP; the
 * localhost Host header is what a DNS-rebinding page, arriving from 127.0.0.1
 * under its own name, cannot send; and PHP's built-in server
 * (`php -S localhost:8000 router.php`) is what no hosting serves the site with.
 *
 * TESTING BEFORE SAVING
 *
 * The database and the IAM each have a "Test connection" button: a small POST
 * to this same page answering JSON, checked exactly like the form (the nonce,
 * and on hosting the token) - otherwise it would be a way for anybody to make
 * this server connect wherever they pointed it.
 *
 * There is no admin to create. Accounts, and who is an ADMIN or EDITOR of this
 * site, live in the anotoki IAM: sign in through it once this is done.
 */

if (PHP_SAPI === 'cli') {
    fwrite(STDERR, "setup.php is a web page. From backend/: composer start,\n"
        . "then open http://localhost:8000/setup.php in a browser.\n");
    exit(1);
}

// As in api/index.php: the hosting would print PHP's warnings, server paths and
// all, into this page. The development server keeps showing them.
if (PHP_SAPI !== 'cli-server') {
    ini_set('display_errors', '0');
}

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/config/local.php';
require_once __DIR__ . '/api/migration_runner.php';

const SETUP_LOCK = __DIR__ . '/storage/installed.lock';
const SETUP_TOKEN_FILE = __DIR__ . '/config/setup.local.php';
const SETUP_NONCE_COOKIE = 'genshin_setup_nonce';

/**
 * What the form starts from: the development values, the same on every
 * checkout (DEV.md has the port table - this site on 4200 and 8000, the
 * IAM on 4300 and 8100). On the hosting every one of them is replaced.
 */
const SETUP_DEFAULTS = [
    'db_host' => '127.0.0.1',
    'db_port' => '5432',
    'db_user' => 'postgres',
    'db_name' => 'anotoki_genshin',
    'iam_issuer' => 'http://localhost:4300',
    'iam_client_id' => 'genshin',
];

/** Where the pages are on this computer: ng serve's port (DEV.md's port table). */
const SETUP_DEV_SITE = 'http://localhost:4200';

// ── Where this is running ─────────────────────────────────────────────────────

function setupIsLoopbackHost(string $host): bool
{
    $host = strtolower(trim($host, '[]'));

    return $host === 'localhost' || $host === '::1' || (bool) preg_match('/^127(\.\d{1,3}){3}$/', $host);
}

/** On this computer, through the built-in server - see the header for why all three. */
function setupOnThisComputer(): bool
{
    $remote = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
    $remote = str_starts_with($remote, '::ffff:') ? substr($remote, 7) : $remote;
    $host = preg_replace('/:\d+$/', '', strtolower((string) ($_SERVER['HTTP_HOST'] ?? '')));

    return PHP_SAPI === 'cli-server' && setupIsLoopbackHost($remote) && setupIsLoopbackHost((string) $host);
}

/**
 * This site's address - read from the request, not asked for. The IAM test
 * checks its /auth/callback, and the closing notes name it.
 *
 * On this computer the pages are ng serve's, whichever port this page was
 * opened on (the backend's 8000, or 4200 through its proxy). On a host the web
 * root that serves this page serves the pages too, so it is this request's
 * own address. The host's proxy usually ends TLS before PHP, which then sees
 * plain http: X-Forwarded-Proto and its relatives say what the browser used.
 * They are only believed for this - a test and a sentence, behind the setup
 * token - never for anything written. Null when the Host header is not a host.
 */
function setupSiteAddress(bool $onThisComputer): ?string
{
    if ($onThisComputer) {
        return SETUP_DEV_SITE;
    }

    $host = strtolower(trim((string) ($_SERVER['HTTP_HOST'] ?? '')));
    if (!preg_match('/^[a-z0-9.\-]+(:\d{1,5})?$/', $host)) {
        return null;
    }

    $forwarded = strtolower(trim(explode(',', (string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? ''))[0]));
    $https = (($_SERVER['HTTPS'] ?? '') !== '' && strtolower((string) $_SERVER['HTTPS']) !== 'off')
        || $forwarded === 'https'
        || strtolower((string) ($_SERVER['HTTP_X_FORWARDED_SSL'] ?? '')) === 'on'
        || strtolower((string) ($_SERVER['REQUEST_SCHEME'] ?? '')) === 'https'
        || (string) ($_SERVER['SERVER_PORT'] ?? '') === '443';

    return $https
        ? localConfigOrigin('https://' . preg_replace('/:443$/', '', $host))
        : localConfigOrigin('http://' . preg_replace('/:80$/', '', $host));
}

$onThisComputer = setupOnThisComputer();

// ── Output ────────────────────────────────────────────────────────────────────

// One per response: the page's own <style> and <script> carry it, and nothing
// else is allowed to run.
$cspNonce = base64_encode(random_bytes(16));

header('X-Robots-Tag: noindex, nofollow');
header('Referrer-Policy: no-referrer');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Cache-Control: no-store');
header("Content-Security-Policy: default-src 'none'; style-src 'nonce-{$cspNonce}'; script-src 'nonce-{$cspNonce}'; "
    . "connect-src 'self'; img-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'");

function h(string $text): string
{
    return htmlspecialchars($text, ENT_QUOTES, 'UTF-8');
}

function setupJson(array $answer, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($answer, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function render(string $heading, string $bodyHtml, string $tone = 'plain'): never
{
    global $cspNonce;

    header('Content-Type: text/html; charset=utf-8');
    $accent = ['plain' => '#6366f1', 'good' => '#16a34a', 'bad' => '#dc2626'][$tone] ?? '#6366f1';
    echo '<!doctype html><html lang="en"><head><meta charset="utf-8">'
        . '<meta name="viewport" content="width=device-width, initial-scale=1">'
        . '<meta name="robots" content="noindex, nofollow"><title>Set up · anotoki genshin</title>'
        . '<style nonce="' . h($cspNonce) . '">'
        . ':root{color-scheme:light dark;--bg:#f5f5f7;--card:#fff;--ink:#1a1a1a;--muted:#6b7280;--line:#e5e7eb;--accent:' . $accent . ';'
        . '--good:#15803d;--bad:#dc2626;--good-bg:rgba(22,163,74,.1);--bad-bg:rgba(220,38,38,.1)}'
        . '@media (prefers-color-scheme:dark){:root{--bg:#0f1115;--card:#181b21;--ink:#e8e8ea;--muted:#9aa0aa;--line:#2a2e37;--good:#4ade80;--bad:#f87171}}'
        . '*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);'
        . 'font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px 16px}'
        . '.card{background:var(--card);border:1px solid var(--line);border-radius:14px;max-width:600px;width:100%;padding:28px 30px;box-shadow:0 10px 40px rgba(0,0,0,.08)}'
        . 'h1{font-size:1.35rem;margin:0 0 4px;display:flex;align-items:center;gap:9px}'
        . 'h1::before{content:"";width:10px;height:10px;border-radius:50%;background:var(--accent);flex:none}'
        . 'h2{font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin:26px 0 2px}'
        . 'p{margin:.5rem 0;color:var(--muted)}label{display:block;margin:12px 0 5px;font-weight:600;font-size:.9rem}'
        . '.row{display:flex;gap:12px;flex-wrap:wrap}.row>div{flex:1 1 200px;min-width:0}'
        . 'input{width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:9px;background:transparent;color:var(--ink);font:inherit}'
        . 'input:focus,button:focus-visible{outline:2px solid var(--accent);outline-offset:1px}'
        . 'button{margin-top:22px;width:100%;padding:11px;border:0;border-radius:9px;background:var(--accent);color:#fff;font:600 1rem system-ui;cursor:pointer}'
        . 'button:hover{filter:brightness(1.06)}button:disabled{opacity:.6;cursor:progress}'
        . 'button.test{width:auto;margin-top:12px;padding:7px 14px;font-size:.9rem;background:transparent;color:var(--ink);border:1px solid var(--line)}'
        . 'code{background:rgba(127,127,127,.15);padding:1px 6px;border-radius:5px;font-size:.85em;overflow-wrap:anywhere}'
        . 'a{color:var(--accent)}'
        . '.err{background:var(--bad-bg);border:1px solid rgba(220,38,38,.4);color:var(--bad);border-radius:9px;padding:10px 12px;margin:12px 0;font-size:.9rem}'
        . '.note{background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.35);border-radius:9px;padding:11px 13px;margin:12px 0;font-size:.9rem;color:var(--ink)}'
        . '.note ul{margin:.3rem 0 0}'
        . '.ok{color:var(--good)}ul{margin:.5rem 0;padding-left:1.2rem;color:var(--muted)}.muted{font-size:.85rem;margin:5px 0 0}'
        . '.result{list-style:none;margin:10px 0 0;padding:0;font-size:.88rem}.result:empty{display:none}'
        . '.result li{padding:6px 10px;border-radius:7px;margin-top:4px;background:rgba(127,127,127,.08);color:var(--ink);overflow-wrap:anywhere}'
        . '.result.good li:first-child{background:var(--good-bg);color:var(--good)}.result.bad li:first-child{background:var(--bad-bg);color:var(--bad)}'
        . '</style></head><body><div class="card"><h1>' . $heading . '</h1>' . $bodyHtml . '</div>'
        . '<script nonce="' . h($cspNonce) . '">' . setupScript() . '</script></body></html>';
    exit;
}

/**
 * The test buttons: the whole form is posted as it stands, with the action
 * swapped, and the answer's lines are listed under the button. Text only - the
 * lines are the server's words about a server the person typed in, and never
 * markup.
 */
function setupScript(): string
{
    return <<<'JS'
        document.querySelectorAll('button[data-test]').forEach(function (button) {
          button.addEventListener('click', async function () {
            var list = document.getElementById(button.dataset.test + '-result');
            var data = new FormData(button.form);
            data.set('action', button.dataset.test);
            button.disabled = true;
            list.className = 'result';
            list.replaceChildren(Object.assign(document.createElement('li'), { textContent: 'Testing…' }));
            try {
              var response = await fetch(location.pathname, { method: 'POST', body: data, credentials: 'same-origin', headers: { Accept: 'application/json' } });
              var answer = await response.json();
              list.className = 'result ' + (answer.ok ? 'good' : 'bad');
              list.replaceChildren.apply(list, answer.lines.map(function (line) {
                return Object.assign(document.createElement('li'), { textContent: line });
              }));
            } catch (error) {
              list.className = 'result bad';
              list.replaceChildren(Object.assign(document.createElement('li'), { textContent: 'The test could not run: ' + error.message }));
            } finally {
              button.disabled = false;
            }
          });
        });
        JS;
}

// ── Files ─────────────────────────────────────────────────────────────────────

/**
 * Writes a file only its owner can read, so a DB password or the site secret is
 * not left world-readable to co-tenants on shared hosting.
 *
 * `umask(0077)` sets the mode at creation (no window where a fresh file is more
 * open than 0600), and `chmod` covers the case where the file already existed -
 * umask only affects newly created files. Both are no-ops on Windows, where
 * file permissions are ACL-based; they take effect on the Linux host.
 */
function writeSecretFile(string $path, string $contents): bool
{
    $previous = umask(0077);
    $ok = @file_put_contents($path, $contents) !== false;
    umask($previous);
    if ($ok) {
        @chmod($path, 0600);
    }

    return $ok;
}

function setupPhpFile(mixed $value): string
{
    return "<?php\n\n// Written by setup.php. Run it again to change this - see config/local.php.\n\nreturn "
        . var_export($value, true) . ";\n";
}

/** Removes the files that only mattered for setting up. */
function deleteSetupArtifacts(): bool
{
    @unlink(SETUP_TOKEN_FILE);
    return @unlink(__FILE__);
}

/**
 * The token in config/setup.local.php, or null. Read as every settings file
 * is, cleanly or not at all (localConfigFileRead(), config/local.php): one
 * saved back by hand with a byte-order mark would print the token ahead of
 * this page. One passed over is no token, and the page writes a new one.
 */
function setupToken(): ?string
{
    if (!is_file(SETUP_TOKEN_FILE)) {
        return null;
    }
    $config = localConfigFileRead(SETUP_TOKEN_FILE)['value'];
    $token = is_array($config) ? ($config['token'] ?? null) : null;

    return is_string($token) && $token !== '' ? $token : null;
}

/**
 * The hosting account's home - the one holding pgclient/, where
 * docs/PG-DUMP-INSTALL.md unpacks the PostgreSQL client tools - or null when
 * none does. Found rather than asked for: HOME when PHP has it, the account's
 * own entry, and every folder above this one (the web root is somewhere under
 * the home). A folder open_basedir keeps PHP out of is simply not it.
 */
function setupBackupHome(): ?string
{
    $candidates = [(string) (getenv('HOME') ?: ''), (string) ($_SERVER['HOME'] ?? '')];
    if (function_exists('posix_getpwuid') && function_exists('posix_geteuid')) {
        $account = @posix_getpwuid(posix_geteuid());
        $candidates[] = is_array($account) ? (string) ($account['dir'] ?? '') : '';
    }
    for ($dir = __DIR__; dirname($dir) !== $dir; $dir = dirname($dir)) {
        $candidates[] = $dir;
    }

    foreach ($candidates as $home) {
        $home = rtrim(str_replace('\\', '/', trim($home)), '/');
        if ($home !== '' && @is_dir($home . '/pgclient')) {
            return $home;
        }
    }

    return null;
}

/**
 * The pg_dump / pg_restore / library paths for a home-directory install of the
 * PostgreSQL client tools (see docs/PG-DUMP-INSTALL.md), or null if pg_dump is not
 * there. On shared hosting they are unpacked under ~/pgclient rather than
 * installed system-wide.
 *
 * The major version and the CPU-architecture folder names vary by host, so they
 * are discovered from what is actually on disk rather than assumed.
 * backup.local.php also needs ld_library_path so the binary can find its own
 * bundled libraries, which is the whole reason this cannot be left to PATH
 * detection.
 */
function setupBackupPaths(string $home): ?array
{
    $home = rtrim(str_replace('\\', '/', trim($home)), '/');
    if ($home === '') {
        return null;
    }

    // Newest major version wins, the way config/backup.php's backupBinary() does.
    $dumps = glob("{$home}/pgclient/usr/lib/postgresql/*/bin/pg_dump") ?: [];
    usort($dumps, function (string $a, string $b) {
        preg_match('~/postgresql/(\d+(?:\.\d+)?)/~', $a, $left);
        preg_match('~/postgresql/(\d+(?:\.\d+)?)/~', $b, $right);
        return (float) ($right[1] ?? 0) <=> (float) ($left[1] ?? 0);
    });
    $pgDump = $dumps[0] ?? null;
    if ($pgDump === null) {
        return null;
    }

    $bin = dirname($pgDump);

    // The library folder is named for the architecture (x86_64-linux-gnu,
    // aarch64-linux-gnu, …); take whichever one the unpack produced.
    $libs = array_values(array_filter(glob("{$home}/pgclient/usr/lib/*-linux-gnu") ?: [], 'is_dir'));

    return [
        'pg_dump' => $pgDump,
        'pg_restore' => $bin . '/pg_restore',
        'ld_library_path' => $libs[0] ?? "{$home}/pgclient/usr/lib/x86_64-linux-gnu",
    ];
}

// ── The databases ─────────────────────────────────────────────────────────────

/** A connection straight from the entered details, giving up after five seconds. */
function setupConnect(array $db, string $database): PDO
{
    return new PDO(
        "pgsql:host={$db['host']};port={$db['port']};dbname={$database};connect_timeout=5",
        $db['username'],
        $db['password'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
}

/** What PostgreSQL said, without the SQLSTATE prefix and the line breaks. */
function setupPdoMessage(\Throwable $e): string
{
    $message = preg_replace('/^SQLSTATE\[[^\]]*\](\s*\[\d+\])?\s*/', '', $e->getMessage());

    return trim((string) preg_replace('/\s+/', ' ', (string) $message));
}

/**
 * How far a database that answers is, in the family's words (every anotoki
 * setup page says these the same way) - reading only, so the test changes
 * nothing (recordedMigrations() understands the table from before the two
 * folders shared it, too). Not ok when saving would be refused: the content
 * half of a site that still has two databases.
 *
 * @return array{0: bool, 1: string}
 */
function setupMigrationState(PDO $pdo, string $name): array
{
    $recorded = recordedMigrations($pdo);
    $refusal = migrationsOrderRefusal($recorded);
    if ($refusal !== null) {
        return [false, "Connected to the database \"{$name}\", but Save would refuse it: {$refusal}"];
    }

    $tables = (int) $pdo->query(
        "SELECT count(*) FROM information_schema.tables WHERE table_schema = current_schema() AND table_type = 'BASE TABLE'"
    )->fetchColumn();
    $pending = 0;
    foreach (migrationFilesByFolder($pdo) as $folder => $files) {
        $pending += count(array_diff($files, $recorded[$folder]));
    }

    return [true, "Connected to the database \"{$name}\": " . ($tables === 0
        ? 'it is empty - Save makes the tables.'
        : ($pending > 0 ? "{$pending} update(s) to apply - Save applies them." : 'it is up to date.'))];
}

/**
 * The database first; when it will not open, the server's maintenance
 * database says whether it is missing, and whether this user may make it. One
 * line, the verdict the page colours.
 *
 * @return array{ok: bool, lines: string[]}
 */
function setupTestDatabase(array $db): array
{
    $name = $db['database'];

    try {
        [$ok, $line] = setupMigrationState(setupConnect($db, $name), $name);

        return ['ok' => $ok, 'lines' => [$line]];
    } catch (\Throwable $e) {
        $reason = setupPdoMessage($e);
    }

    try {
        $server = setupConnect($db, 'postgres');
        $query = $server->prepare('SELECT 1 FROM pg_catalog.pg_database WHERE datname = ?');
        $query->execute([$name]);
        if ($query->fetchColumn()) {
            return ['ok' => false, 'lines' => ["The server is there, but \"{$db['username']}\" cannot open the database \"{$name}\": {$reason}"]];
        }
        $mayCreate = (bool) $server->query('SELECT rolcreatedb OR rolsuper FROM pg_roles WHERE rolname = current_user')->fetchColumn();
    } catch (\Throwable $e) {
        // Nothing answered at all, or the host refuses the maintenance
        // database: the first reason is the one worth reading.
        return ['ok' => false, 'lines' => ["Cannot connect: {$reason}"]];
    }

    return $mayCreate
        ? ['ok' => true, 'lines' => ["Connected to the server. The database \"{$name}\" does not exist yet - Save creates it."]]
        : ['ok' => false, 'lines' => ["Connected to the server, but there is no database \"{$name}\" and this user may not create one. Make it in the hosting panel first."]];
}

/**
 * The migrations of both folders and the library's sets, against a connection
 * made from the entered details, through the engine every way of building the
 * database uses (siteMigrator(), api/migration_runner.php). Throws with a
 * plain message on the first failure, having written no config file yet.
 *
 * @return string[] one human line per step
 */
function runInstall(array $config): array
{
    $name = $config['database'];

    // Best effort: on shared hosting the app user cannot CREATE DATABASE and
    // the database was made in the panel, so only failing to connect is fatal.
    try {
        ensureDatabase($config, $name);
    } catch (\Throwable $e) {
        // Assume it exists already; the connect below is the real test.
    }

    try {
        $pdo = setupConnect($config, $name);
    } catch (\Throwable $e) {
        throw new RuntimeException(
            "Cannot connect to the database '{$name}': " . setupPdoMessage($e)
            . ' - create it (in the hosting panel, on the hosting) and check the connection details.'
        );
    }

    $result = siteMigrator($pdo)->apply();

    if ($result['busy']) {
        throw new RuntimeException(
            'Another database update is running on this database (the admin panel\'s Migrations page, or `php migration.php`).'
            . ' Nothing was applied: save again once it has finished.'
        );
    }
    if ($result['failed'] !== null) {
        throw new RuntimeException("Migration {$result['failed']['set']}/{$result['failed']['name']} failed: {$result['error']}");
    }
    if ($result['error'] !== null) {
        // Refused before anything ran: the folders would have run out of order.
        throw new RuntimeException($result['error']);
    }

    $log = [];
    foreach (migrationSetNames() as $folder) {
        $count = count(array_filter($result['applied'], fn (array $file): bool => $file['set'] === $folder));
        $log[] = "{$name}, " . migrationSetLabel($folder) . ': ' . ($count === 0 ? 'up to date, nothing to apply.' : "applied {$count} migration" . ($count === 1 ? '' : 's') . '.');
    }

    return $log;
}

// ── The IAM ───────────────────────────────────────────────────────────────────

/**
 * A GET that follows no redirect and reports what happened: the status, where
 * a redirect pointed, the body, or why there was none.
 *
 * @return array{status: int, location: ?string, body: string, error: ?string}
 */
function setupHttpGet(string $url, int $timeout = 5): array
{
    $answer = ['status' => 0, 'location' => null, 'body' => '', 'error' => null];

    if (function_exists('curl_init')) {
        $handle = curl_init($url);
        curl_setopt_array($handle, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_CONNECTTIMEOUT => $timeout,
            CURLOPT_TIMEOUT => $timeout,
            CURLOPT_HTTPHEADER => ['Accept: application/json'],
            CURLOPT_HEADERFUNCTION => function ($curl, string $line) use (&$answer): int {
                if (stripos($line, 'Location:') === 0) {
                    $answer['location'] = trim(substr($line, 9));
                }
                return strlen($line);
            },
        ]);
        $body = curl_exec($handle);
        $answer['status'] = (int) curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
        $answer['body'] = is_string($body) ? $body : '';
        if ($body === false) {
            $answer['error'] = curl_error($handle);
        }
        // No curl_close(): the handle goes with the variable, and PHP 8.5
        // deprecates the call.

        return $answer;
    }

    // Streams: fopen rather than file_get_contents, so the status line comes
    // from the stream (the magic variable is deprecated in PHP 8.5).
    $context = stream_context_create(['http' => [
        'timeout' => $timeout,
        'ignore_errors' => true,
        'follow_location' => 0,
        'header' => "Accept: application/json\r\n",
    ]]);
    $stream = @fopen($url, 'rb', false, $context);
    if ($stream === false) {
        $answer['error'] = (error_get_last() ?? [])['message'] ?? 'could not connect';
        return $answer;
    }
    $meta = stream_get_meta_data($stream);
    $answer['body'] = (string) stream_get_contents($stream);
    fclose($stream);

    foreach ((array) ($meta['wrapper_data'] ?? []) as $header) {
        if (preg_match('#^HTTP/\S+\s+(\d{3})#', (string) $header, $m)) {
            $answer['status'] = (int) $m[1];
        } elseif (stripos((string) $header, 'Location:') === 0) {
            $answer['location'] = trim(substr((string) $header, 9));
        }
    }

    return $answer;
}

/** Whether an address sits on the IAM's own origin - the only place worth following it to. */
function setupSameOrigin(mixed $url, string $origin): bool
{
    return is_string($url) && (str_starts_with($url, $origin . '/') || $url === $origin);
}

/**
 * The IAM, as this site will use it: its discovery document, its key set, and
 * whether it knows this site's client and callback.
 *
 * The last one asks the IAM's own authorize endpoint, the way a browser would
 * on "Sign in", and reads where it sends the request: to its error page naming
 * invalid_client or invalid_redirect_uri, or on to a sign-in. Nothing is
 * signed into; the IAM sweeps the unfinished request away.
 *
 * @return array{ok: bool, lines: string[]}
 */
function setupTestIam(string $issuer, string $clientId, string $siteUrl): array
{
    $discoveryUrl = $issuer . '/.well-known/openid-configuration';
    $discovery = setupHttpGet($discoveryUrl);

    // The first three answers, and the keys', are the family's words: every
    // anotoki setup page tests its IAM the same way.
    if ($discovery['status'] === 0) {
        return ['ok' => false, 'lines' => ["No answer from {$discoveryUrl}. Is the IAM running, and is the address right?"]];
    }

    $document = json_decode($discovery['body'], true);
    if ($discovery['status'] !== 200 || !is_array($document) || !isset($document['issuer'])) {
        return ['ok' => false, 'lines' => ['That address answers, but not like an IAM (no OpenID Connect discovery document).']];
    }

    $said = (string) $document['issuer'];
    if ($said !== $issuer) {
        // Every token is checked against it character for character.
        return ['ok' => false, 'lines' => ["The IAM there calls itself {$said} - use exactly that address."]];
    }

    $lines = [];
    $ok = true;

    $jwksUri = $document['jwks_uri'] ?? null;
    $keys = setupSameOrigin($jwksUri, $issuer) ? json_decode(setupHttpGet((string) $jwksUri)['body'], true) : null;
    $usable = array_filter((array) ($keys['keys'] ?? []), fn($key) => is_array($key) && ($key['kty'] ?? '') === 'RSA');
    if ($usable) {
        $lines[] = "Found the IAM at {$issuer} with " . count($usable) . ' signing key' . (count($usable) === 1 ? '' : 's') . '.';
    } else {
        $ok = false;
        $lines[] = 'The IAM answers, but its signing keys (' . (is_string($jwksUri) ? $jwksUri : 'none named') . ') do not.';
    }

    $authorize = $document['authorization_endpoint'] ?? null;
    $callback = $siteUrl . '/auth/callback';
    if (!setupSameOrigin($authorize, $issuer)) {
        $lines[] = 'Its discovery document names no sign-in endpoint on its own address, so the registration could not be checked.';
    } else {
        $verifier = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
        $probe = setupHttpGet($authorize . '?' . http_build_query([
            'response_type' => 'code',
            'client_id' => $clientId,
            'redirect_uri' => $callback,
            'scope' => 'openid',
            'state' => bin2hex(random_bytes(8)),
            'code_challenge' => rtrim(strtr(base64_encode(hash('sha256', $verifier, true)), '+/', '-_'), '='),
            'code_challenge_method' => 'S256',
        ]));
        $where = (string) ($probe['location'] ?? '');

        if (str_contains($where, 'invalid_client')) {
            $ok = false;
            $lines[] = "The IAM does not know the client \"{$clientId}\". Register it in the IAM's admin console (Applications).";
        } elseif (str_contains($where, 'invalid_redirect_uri')) {
            $ok = false;
            $lines[] = "The IAM does not accept {$callback} for \"{$clientId}\". Register it in the IAM's admin console (Applications) - in development, `php clients.php --dev` in the IAM's backend/.";
        } elseif ($probe['status'] >= 300 && $probe['status'] < 400 && $where !== '') {
            $lines[] = "\"{$clientId}\" is registered there, with {$callback} as its callback.";
        } else {
            $lines[] = "Could not tell whether \"{$clientId}\" and {$callback} are registered (the sign-in endpoint answered {$probe['status']}).";
        }
    }

    if (!$ok) {
        array_unshift($lines, 'The IAM is not ready for this site yet:');
    }

    return ['ok' => $ok, 'lines' => $lines];
}

// ── Already installed: the durable guard (hosting only) ───────────────────────

if (!$onThisComputer && is_file(SETUP_LOCK)) {
    $gone = deleteSetupArtifacts();
    render(
        'Already installed',
        '<p>This site has been set up. Running the installer again is blocked by'
        . ' <code>storage/installed.lock</code>.</p>'
        . ($gone
            ? '<p class="ok">The setup files have been removed.</p>'
            : '<p class="err">Delete <code>setup.php</code> and <code>config/setup.local.php</code> by hand -'
            . ' they could not be removed automatically.</p>')
        . '<p class="muted">To reinstall on purpose, delete the lock file first.</p>',
        'good'
    );
}

// ── Proof that it is you ──────────────────────────────────────────────────────

// The nonce, in both places: a cookie no script can read and no other site's
// request carries, and the form. A post whose two copies do not match did not
// come from this page.
$nonce = (string) ($_COOKIE[SETUP_NONCE_COOKIE] ?? '');
if (!preg_match('/^[a-f0-9]{48}$/', $nonce)) {
    $nonce = bin2hex(random_bytes(24));
    setcookie(SETUP_NONCE_COOKIE, $nonce, [
        'path' => '/setup.php',
        'httponly' => true,
        'samesite' => 'Strict',
        'secure' => !empty($_SERVER['HTTPS']) && strtolower((string) $_SERVER['HTTPS']) !== 'off',
    ]);
}

$token = null;
if (!$onThisComputer) {
    // On the hosting: a token only somebody with FTP access can read back.
    if (setupToken() === null) {
        $php = "<?php\n\nreturn " . var_export(['token' => bin2hex(random_bytes(24))], true) . ";\n";
        if (!writeSecretFile(SETUP_TOKEN_FILE, $php)) {
            render(
                'Cannot write to config/',
                '<p>The installer could not create <code>config/setup.local.php</code>.'
                . ' The <code>config/</code> folder is not writable by the web server.</p>'
                . '<p class="muted">Give it write permission (or create the file yourself returning'
                . ' <code>[\'token\' =&gt; \'...\']</code>) and reload.</p>',
                'bad'
            );
        }
    }
    $token = (string) setupToken();
}

$posted = ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST';
$action = $posted ? (string) ($_POST['action'] ?? 'install') : 'show';
$testing = in_array($action, ['test_db', 'test_iam'], true);

/** Why this post is refused, or null when it is the person at this page. */
function setupRefusal(string $nonce, ?string $token): ?string
{
    $givenNonce = (string) ($_POST['nonce'] ?? '');
    if ($givenNonce === '' || !hash_equals($nonce, $givenNonce)) {
        return 'This form had gone stale, or did not come from this page. Reload the page and try again'
            . ' (it needs cookies allowed for this address).';
    }
    if ($token !== null && !hash_equals($token, (string) ($_POST['token'] ?? ''))) {
        return 'That is not the setup token from config/setup.local.php.';
    }

    return null;
}

if ($posted) {
    $refusal = setupRefusal($nonce, $token);
    if ($refusal !== null && $testing) {
        setupJson(['ok' => false, 'lines' => [$refusal]], 403);
    }
}

// ── What is saved, and what the form starts from ──────────────────────────────

// Current values are shown on this computer only. On the hosting the page is
// public until it deletes itself, and a database host and user are nobody
// else's business.
$saved = ['database' => null, 'iam' => null];
if ($onThisComputer) {
    $saved['database'] = is_array(localConfig('database')) ? localConfig('database') : null;
    $saved['iam'] = is_array(localConfig('iam')) ? localConfig('iam') : null;
}
$savedPassword = isset($saved['database']['password']) ? (string) $saved['database']['password'] : null;

$old = SETUP_DEFAULTS;
if ($saved['database'] !== null) {
    $old['db_host'] = (string) ($saved['database']['host'] ?? $old['db_host']);
    $old['db_port'] = (string) ($saved['database']['port'] ?? $old['db_port']);
    $old['db_user'] = (string) ($saved['database']['username'] ?? $old['db_user']);
    $old['db_name'] = (string) ($saved['database']['database'] ?? $old['db_name']);
}

// An installation still on two databases - the site's half in a database of
// its own. Saving here would point the site at the content database alone:
// the site's half would be missing from it, and building it there would run
// migrations/users/ over the content's tables (migrationsOrderRefusal() says
// why that breaks). So the page stops at that and points at the tool that
// moves the rows over. Checked on the hosting too, where nothing saved is ever
// shown - only whether the file has that shape.
$storedDatabase = localConfig('database');
$twoDatabases = is_array($storedDatabase)
    && (!is_string($storedDatabase['database'] ?? null) || trim((string) $storedDatabase['database']) === '')
    && is_array($storedDatabase['databases'] ?? null);
unset($storedDatabase);
if ($saved['iam'] !== null) {
    $old['iam_issuer'] = (string) ($saved['iam']['issuer'] ?? $old['iam_issuer']);
    $old['iam_client_id'] = (string) ($saved['iam']['client_id'] ?? $old['iam_client_id']);
}

// ── Reading the form ──────────────────────────────────────────────────────────

/** An address as an origin, or null - https anywhere, plain http only for this computer. */
function setupAddress(string $value, bool $onThisComputer): ?string
{
    $origin = localConfigOrigin($value);
    if ($origin === null) {
        return null;
    }
    $host = (string) parse_url($origin, PHP_URL_HOST);
    if (!$onThisComputer && setupIsLoopbackHost($host)) {
        // The development value, left in on the hosting: no visitor's browser
        // can reach the server's own localhost, and neither can the key download.
        return null;
    }
    if (str_starts_with($origin, 'http://') && !setupIsLoopbackHost($host)) {
        // The keys every token is checked against are fetched from the IAM;
        // over plain http anybody on the way could hand this site keys of
        // their own.
        return null;
    }

    return $origin;
}

/**
 * The form as settings, and what is wrong with it - by section, so each test
 * button can answer for its own part without the rest being filled in right.
 *
 * @return array{0: array, 1: array{database: string[], iam: string[]}}
 */
function setupReadForm(array &$old, bool $onThisComputer, ?string $savedPassword): array
{
    foreach (array_keys(SETUP_DEFAULTS) as $key) {
        $old[$key] = trim((string) ($_POST[$key] ?? $old[$key]));
    }

    $errors = ['database' => [], 'iam' => []];

    // Nothing that could end one DSN parameter and start another: no ; or =.
    if (!preg_match('~^[A-Za-z0-9._\-:/\[\]]+$~', $old['db_host'])) {
        $errors['database'][] = 'The database host is a name or an address, like 127.0.0.1.';
    }
    if (!ctype_digit($old['db_port']) || (int) $old['db_port'] < 1 || (int) $old['db_port'] > 65535) {
        $errors['database'][] = 'The database port is a number, like 5432.';
    }
    if ($old['db_user'] === '') {
        $errors['database'][] = 'Fill in the database username.';
    }
    if (!preg_match('/^[A-Za-z0-9_\-]{1,63}$/', $old['db_name'])) {
        $errors['database'][] = "The database's name is letters, digits, _ and - only.";
    }

    $issuer = setupAddress($old['iam_issuer'], $onThisComputer);
    if ($issuer === null) {
        $errors['iam'][] = $onThisComputer
            ? 'The IAM\'s address is a scheme and a host only, like http://localhost:4300 - plain http only on this computer.'
            : 'The IAM\'s address is https and a host only, like https://iam.anotoki.eu.';
    }
    if (!preg_match('/^[a-z0-9][a-z0-9-]{1,63}$/', $old['iam_client_id'])) {
        $errors['iam'][] = 'The client id is the name this site is registered under in the IAM, like genshin.';
    }

    $password = (string) ($_POST['db_pass'] ?? '');
    if ($password === '' && $savedPassword !== null) {
        $password = $savedPassword;
    }

    return [[
        'db' => [
            'driver' => 'pgsql',
            'host' => $old['db_host'],
            'port' => $old['db_port'],
            'database' => $old['db_name'],
            'username' => $old['db_user'],
            'password' => $password,
        ],
        'issuer' => (string) $issuer,
        'client_id' => $old['iam_client_id'],
    ], $errors];
}

$siteUrl = setupSiteAddress($onThisComputer);

// ── Test buttons ──────────────────────────────────────────────────────────────

if ($testing) {
    [$settings, $errors] = setupReadForm($old, $onThisComputer, $savedPassword);

    if ($action === 'test_db') {
        setupJson($errors['database'] ? ['ok' => false, 'lines' => $errors['database']] : setupTestDatabase($settings['db']));
    }

    // The IAM is checked against this site's callback too, so that has to be known.
    $iamErrors = $errors['iam'];
    if ($siteUrl === null) {
        $iamErrors[] = 'This page\'s address does not say where the site is: open it at the site\'s own address.';
    }
    setupJson($iamErrors ? ['ok' => false, 'lines' => $iamErrors] : setupTestIam($settings['issuer'], $settings['client_id'], $siteUrl));
}

// ── Saving ────────────────────────────────────────────────────────────────────

$errors = [];

if ($posted && $action === 'install') {
    if ($refusal !== null) {
        $errors[] = $refusal;
    }
    if ($twoDatabases) {
        $errors[] = databaseTwoDatabasesMessage() . ' Then open this page again.';
    }
    // A settings file that is there but could not be read cleanly is never saved over (the anotoki family's rule):
    // a secret.local.php saved with a byte-order mark still holds the site secret, which a new one in its place would
    // lose - and with it every keyed hash and signed link made under it.
    foreach (['database', 'secret', 'jwt', 'iam'] as $name) {
        if (localConfigError($name) !== null) {
            $errors[] = "config/{$name}.local.php " . localConfigError($name) . ': it is not saved over. Mend it - it must'
                . ' start with <?php and print nothing - or remove it, then open this page again.';
        }
    }

    [$settings, $formErrors] = setupReadForm($old, $onThisComputer, $savedPassword);
    $errors = [...$errors, ...$formErrors['database'], ...$formErrors['iam']];

    if (!$errors) {
        // A file that is already there keeps any key the form does not manage:
        // the connection pool switch, where the IAM's keys are cached.
        $database = array_replace(['persistent' => true, 'charset' => 'utf8'], $saved['database'] ?? [], $settings['db']);
        unset($database['databases']);

        try {
            $log = runInstall($database);

            // Everything worked - now persist the config the running site reads.
            $written = [];

            if (writeSecretFile(localConfigPath('database'), setupPhpFile($database))) {
                $written[] = 'config/database.local.php';
            }

            // Never replaced once there - the feedback limiter's hashes are made
            // with it. A secret from before the IAM becomes this one.
            if (!is_string(localConfig('secret')) || strlen((string) localConfig('secret')) < 32) {
                $previous = localConfig('jwt');
                $secret = is_string($previous) && strlen($previous) >= 32 ? $previous : bin2hex(random_bytes(32));
                if (writeSecretFile(localConfigPath('secret'), setupPhpFile($secret))) {
                    $written[] = 'config/secret.local.php';
                }
            }

            $iam = array_replace($saved['iam'] ?? [], ['issuer' => $settings['issuer'], 'client_id' => $settings['client_id']]);
            if (writeSecretFile(localConfigPath('iam'), setupPhpFile($iam))) {
                $written[] = 'config/iam.local.php';
            }

            // Backups are a hosting matter: written when the client tools are
            // under ~/pgclient in the hosting account's home, which is found
            // rather than asked for. Without them the Backups page still uses
            // a pg_dump on the server's PATH, if it has one.
            $backupNote = '';
            if (!$onThisComputer) {
                $backupHome = setupBackupHome();
                $backupPaths = $backupHome !== null ? setupBackupPaths($backupHome) : null;
                if ($backupPaths) {
                    if (writeSecretFile(localConfigPath('backup'), setupPhpFile($backupPaths))) {
                        $written[] = 'config/backup.local.php';
                    }
                } else {
                    $backupNote = '<div class="note">No <code>pg_dump</code> was found under <code>~/pgclient</code> in'
                        . ' this hosting account\'s home, so <code>config/backup.local.php</code> was not written: backups'
                        . ' use a <code>pg_dump</code> on the server\'s PATH if there is one. To back up from the site, unpack the'
                        . ' PostgreSQL client tools there (see <code>docs/PG-DUMP-INSTALL.md</code> in the repository) and'
                        . ' create that file, as the comment in <code>config/backup.php</code> shows.</div>';
                }
            }

            $steps = '<ul>' . implode('', array_map(fn($l) => '<li>' . h($l) . '</li>', $log)) . '</ul>';
            $wrote = $written ? '<p>Wrote ' . implode(', ', array_map(fn($f) => '<code>' . h($f) . '</code>', $written)) . '.</p>' : '';
            $signIn = '<p>Signing in happens at the IAM, <code>' . h($settings['issuer']) . '</code>, which needs <code>'
                . h($siteUrl ?? 'https://<this site>') . '/auth/callback</code> registered for the client <code>' . h($settings['client_id'])
                . '</code> - the form\'s IAM test says whether it is. Admin pages want an account holding this site\'s ADMIN or EDITOR role there.</p>';

            if ($onThisComputer) {
                render('Saved', $steps . $wrote . $signIn
                    . '<p>The API on this server answers normally now. Start the pages with <code>npm start</code> in'
                    . ' <code>frontend/</code> and open <a href="' . h(SETUP_DEV_SITE) . '">' . h(SETUP_DEV_SITE) . '</a>.</p>'
                    . '<p class="muted">This page stays here: open <a href="setup.php">setup.php</a> again to change any of it.</p>', 'good');
            }

            // The lock first, so a re-run is refused even if cleanup below fails.
            if (!is_dir(dirname(SETUP_LOCK))) {
                @mkdir(dirname(SETUP_LOCK), 0700, true);
            }
            @file_put_contents(SETUP_LOCK, json_encode(['installed_at' => date('c'), 'iam' => $settings['issuer']], JSON_PRETTY_PRINT));

            $cleanup = deleteSetupArtifacts()
                ? '<p class="ok">Removed <code>setup.php</code> and <code>config/setup.local.php</code>.</p>'
                : '<p class="err">Delete <code>setup.php</code> and <code>config/setup.local.php</code> by hand -'
                . ' they could not be removed automatically. (It will refuse to run again regardless.)</p>';

            render('Installed', $steps . $wrote . $backupNote . $cleanup . $signIn
                . '<p>Sign in at <code>/staff</code> or <code>/admin</code> to check.</p>', 'good');
        } catch (\Throwable $e) {
            $errors[] = $e->getMessage();
        }
    }
}

// ── The form ──────────────────────────────────────────────────────────────────

$errorHtml = '';
foreach ($errors as $error) {
    $errorHtml .= '<div class="err">' . h($error) . '</div>';
}

$field = fn(string $name, string $label, string $type = 'text', string $extra = '') =>
    '<label for="' . $name . '">' . $label . '</label>'
    . '<input id="' . $name . '" name="' . $name . '" type="' . $type . '"'
    . ($type === 'text' ? ' value="' . h($old[$name] ?? '') . '"' : '')
    . ' ' . $extra . '>';

$testButton = fn(string $action) =>
    '<button type="button" class="test" data-test="' . $action . '">Test connection</button>'
    . '<ul class="result" id="' . $action . '-result" aria-live="polite"></ul>';

if ($onThisComputer) {
    $problems = localConfigProblems();
    $intro = '<p>Running on this computer: no setup token, and this page stays - open it again whenever a setting'
        . ' changes. It saves the config and brings the database up to date.</p>'
        . ($problems
            ? '<div class="note">Not set up yet, so the API answers every request with <code>not_set_up</code>:<ul>'
                . implode('', array_map(fn($p) => '<li>' . h($p) . '</li>', $problems)) . '</ul></div>'
            : '<div class="note">This installation is set up. Change anything below and save; a blank password keeps the saved one.</div>');
} else {
    $intro = '<p>This creates the config and runs every migration. Do it once, on the database'
        . ' you have created in your hosting panel. Accounts are not made here: they live in the anotoki IAM, which'
        . ' is installed separately and should be running first.</p>'
        . '<div class="note">A token was written to <code>config/setup.local.php</code>. Open that file over FTP/SFTP,'
        . ' copy the token, and paste it below - that is how the installer knows it is really you. The fields start'
        . ' with the development values: replace them with this site\'s own.</div>';
}

$passwordNote = $savedPassword !== null ? 'placeholder="saved - leave blank to keep it"' : '';

render(
    $onThisComputer ? 'Set up this checkout' : 'Install anotoki genshin',
    $intro
    . $errorHtml
    . '<form method="post" autocomplete="off">'
    . '<input type="hidden" name="nonce" value="' . h($nonce) . '">'
    . '<input type="hidden" name="action" value="install">'
    . ($onThisComputer ? '' : $field('token', 'Setup token', 'password', 'required placeholder="from config/setup.local.php"'))
    . '<h2>Database</h2>'
    . '<div class="row"><div>' . $field('db_host', 'Host', 'text', 'required')
    . '</div><div>' . $field('db_port', 'Port', 'text', 'required inputmode="numeric"') . '</div></div>'
    . '<div class="row"><div>' . $field('db_user', 'Username', 'text', 'required')
    . '</div><div>' . $field('db_pass', 'Password', 'password', 'autocomplete="new-password" ' . $passwordNote) . '</div></div>'
    . $field('db_name', 'Database', 'text', 'required')
    . '<p class="muted">One database holds everything: the game content, and the site\'s own half - the'
    . ' translations, settings and page switches, and a small record of each person who signs in (their name and'
    . ' preferences here - never a password). It is created if it is not there and the user may.</p>'
    . $testButton('test_db')
    . '<h2>Sign-in</h2>'
    . '<div class="row"><div>' . $field('iam_issuer', 'IAM address', 'text', 'required')
    . '</div><div>' . $field('iam_client_id', 'Client id', 'text', 'required') . '</div></div>'
    . '<p class="muted">Where people sign in - the anotoki IAM - and the name this site is registered under there.'
    . ' The IAM\'s admin console lists both under Applications. The test also checks that the IAM sends people back to'
    . ' <code>' . h($siteUrl ?? 'this site') . '/auth/callback</code>.</p>'
    . $testButton('test_iam')
    . '<button type="submit">' . ($onThisComputer ? 'Save' : 'Run install') . '</button>'
    . '</form>'
);
