<?php

declare(strict_types=1);

/**
 * setup.php - the one-time, first-run installer.
 *
 * Upload this next to a build (php/dist/* in the web root) and it does the whole
 * install with nothing pre-configured: it asks for the database connection and
 * the first admin, writes every config file itself, runs the migrations, and
 * then removes the files that only mattered for setting up.
 *
 * WHY THE TWO STEPS
 *
 * Anyone can reach this page, so it proves you are the one who owns the server
 * before it will do anything: on first view it writes a random token into
 * config/setup.local.php and asks you to read it back. Only someone with SFTP
 * (or shell) access to the server can open that file, so typing the token is
 * proof of that access. The token is never shown in the browser.
 *
 * WHAT IT WRITES
 *
 *   config/setup.local.php    the token, on first view (deleted at the end)
 *   config/database.local.php the connection you enter here
 *   config/jwt.local.php      a fresh random signing secret (left alone if one
 *                             already exists, so it never invalidates sessions)
 *   config/mail.local.php     the sender address and how mail is sent
 *   config/google.local.php   the Google sign-in client id, only if you enter one
 *   config/backup.local.php   the pg_dump / pg_restore paths for on-server
 *                             backups, only if you give a home directory that has
 *                             the PostgreSQL client tools unpacked under ~/pgclient
 *
 * WHAT IT NEEDS FROM YOU FIRST
 *
 * The databases themselves - most hosting will not let the app's database user
 * create them, so make them in the control panel and enter their names here.
 * (Google sign-in is optional and asked for in the form; leave it blank to skip.)
 *
 * WHEN IT IS DONE
 *
 * It writes storage/installed.lock - which is what makes it refuse to run twice,
 * even if the self-delete below is denied - then deletes config/setup.local.php
 * and itself. Delete setup.php by hand if the host would not let it.
 *
 * This is a production tool. It writes config/database.local.php from the form,
 * so do not point it at a working dev checkout.
 */

require_once __DIR__ . '/api/migration_runner.php';

const SETUP_LOCK = __DIR__ . '/storage/installed.lock';
const SETUP_TOKEN_FILE = __DIR__ . '/config/setup.local.php';
const DB_CONFIG_FILE = __DIR__ . '/config/database.local.php';
const JWT_FILE = __DIR__ . '/config/jwt.local.php';
const MAIL_FILE = __DIR__ . '/config/mail.local.php';
const GOOGLE_FILE = __DIR__ . '/config/google.local.php';
const BACKUP_FILE = __DIR__ . '/config/backup.local.php';

/** The databases this project has migrations for; star_rail has none yet. */
const SETUP_DATABASES = ['users', 'genshin_impact'];

header('Content-Type: text/html; charset=utf-8');
header('X-Robots-Tag: noindex, nofollow');
header('Referrer-Policy: no-referrer');

function setupToken(): ?string
{
    if (!is_file(SETUP_TOKEN_FILE)) {
        return null;
    }
    $config = require SETUP_TOKEN_FILE;
    $token = is_array($config) ? ($config['token'] ?? null) : null;

    return is_string($token) && $token !== '' ? $token : null;
}

function h(string $text): string
{
    return htmlspecialchars($text, ENT_QUOTES, 'UTF-8');
}

/** Removes the files that only mattered for setting up. */
function deleteSetupArtifacts(): bool
{
    @unlink(SETUP_TOKEN_FILE);
    return @unlink(__FILE__);
}

/**
 * Writes a file only its owner can read, so a DB password or the JWT secret is
 * not left world-readable to co-tenants on shared hosting.
 *
 * `umask(0077)` sets the mode at creation (no window where a fresh file is more
 * open than 0600), and `chmod` covers the case where the file already existed -
 * umask only affects newly created files. Both are no-ops on Windows (dev),
 * where file permissions are ACL-based; they take effect on the Linux host.
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

/**
 * The pg_dump / pg_restore / library paths for a home-directory install of the
 * PostgreSQL client tools (see PG-DUMP-INSTALL.md), or null if pg_dump is not
 * there. On shared hosting they are unpacked under ~/pgclient rather than
 * installed system-wide.
 *
 * The major version and the CPU-architecture folder names vary by host, so they
 * are discovered from what is actually on disk rather than assumed - the operator
 * only has to give the home directory (`echo $HOME` over SSH). backup.local.php
 * also needs ld_library_path so the binary can find its own bundled libraries,
 * which is the whole reason this cannot be left to PATH detection.
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

function render(string $heading, string $bodyHtml, string $tone = 'plain'): never
{
    $accent = ['plain' => '#6366f1', 'good' => '#16a34a', 'bad' => '#dc2626'][$tone] ?? '#6366f1';
    echo '<!doctype html><html lang="en"><head><meta charset="utf-8">'
        . '<meta name="viewport" content="width=device-width, initial-scale=1">'
        . '<meta name="robots" content="noindex, nofollow"><title>Install · anotoki</title>'
        . '<style>'
        . ':root{color-scheme:light dark;--bg:#f5f5f7;--card:#fff;--ink:#1a1a1a;--muted:#6b7280;--line:#e5e7eb;--accent:' . $accent . ';}'
        . '@media (prefers-color-scheme:dark){:root{--bg:#0f1115;--card:#181b21;--ink:#e8e8ea;--muted:#9aa0aa;--line:#2a2e37;}}'
        . '*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);'
        . 'font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px}'
        . '.card{background:var(--card);border:1px solid var(--line);border-radius:14px;max-width:560px;width:100%;padding:28px 30px;box-shadow:0 10px 40px rgba(0,0,0,.08)}'
        . 'h1{font-size:1.35rem;margin:0 0 4px;display:flex;align-items:center;gap:9px}'
        . 'h1::before{content:"";width:10px;height:10px;border-radius:50%;background:var(--accent)}'
        . 'h2{font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin:22px 0 2px}'
        . 'p{margin:.5rem 0;color:var(--muted)}label{display:block;margin:12px 0 5px;font-weight:600;font-size:.9rem}'
        . '.row{display:flex;gap:12px}.row>div{flex:1}'
        . 'input{width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:9px;background:transparent;color:var(--ink);font:inherit}'
        . 'input:focus{outline:2px solid var(--accent);outline-offset:1px;border-color:transparent}'
        . 'button{margin-top:22px;width:100%;padding:11px;border:0;border-radius:9px;background:var(--accent);color:#fff;font:600 1rem system-ui;cursor:pointer}'
        . 'button:hover{filter:brightness(1.06)}code{background:rgba(127,127,127,.15);padding:1px 6px;border-radius:5px;font-size:.85em}'
        . '.err{background:rgba(220,38,38,.12);border:1px solid rgba(220,38,38,.4);color:#dc2626;border-radius:9px;padding:10px 12px;margin:12px 0;font-size:.9rem}'
        . '.note{background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.35);border-radius:9px;padding:11px 13px;margin:12px 0;font-size:.9rem;color:var(--ink)}'
        . '.ok{color:#16a34a}ul{margin:.5rem 0;padding-left:1.2rem;color:var(--muted)}.muted{font-size:.85rem;margin:5px 0 0}'
        . '.check{display:flex;gap:9px;align-items:center;font-weight:400;margin:14px 0 2px}.check input{width:auto;margin:0}'
        . '</style></head><body><div class="card"><h1>' . $heading . '</h1>' . $bodyHtml . '</div></body></html>';
    exit;
}

// ── Already installed: the durable guard ──────────────────────────────────────

if (is_file(SETUP_LOCK)) {
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

// ── First view: write the token to a file only SFTP can read ──────────────────

$tokenWriteFailed = false;
if (setupToken() === null) {
    $token = bin2hex(random_bytes(24));
    $php = "<?php\n\nreturn " . var_export(['token' => $token], true) . ";\n";
    if (!writeSecretFile(SETUP_TOKEN_FILE, $php)) {
        $tokenWriteFailed = true;
    }
}

if ($tokenWriteFailed) {
    render(
        'Cannot write to config/',
        '<p>The installer could not create <code>config/setup.local.php</code>.'
        . ' The <code>config/</code> folder is not writable by the web server.</p>'
        . '<p class="muted">Give it write permission (or create the file yourself returning'
        . ' <code>[\'token\' =&gt; \'...\']</code>) and reload.</p>',
        'bad'
    );
}

$token = (string) setupToken();

// ── The install itself ────────────────────────────────────────────────────────

/**
 * Migrations for both databases, then the first admin, all against connections
 * made from the entered details. Throws with a plain message on the first
 * failure, having written no config file yet.
 *
 * @return string[] one human line per step
 */
function runInstall(array $config, string $email, string $password): array
{
    $log = [];
    $usersPdo = null;

    foreach (SETUP_DATABASES as $alias) {
        if (!migrationFiles($alias)) {
            continue;
        }
        $name = $config['databases'][$alias];

        // Best effort: on shared hosting the app user cannot CREATE DATABASE and
        // the database was made in the panel, so only failing to connect is fatal.
        try {
            ensureDatabase($config, $name);
        } catch (\Throwable $e) {
            // Assume it exists already; the connect below is the real test.
        }

        try {
            $pdo = new PDO(
                "pgsql:host={$config['host']};port={$config['port']};dbname={$name}",
                $config['username'],
                $config['password'],
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );
        } catch (\Throwable $e) {
            throw new RuntimeException(
                "Cannot connect to the '{$alias}' database ('{$name}'). Create it in your hosting "
                . "panel and check the connection details."
            );
        }

        $result = applyPendingMigrations($pdo, $alias);
        if ($result['failed'] !== null) {
            throw new RuntimeException("Migration {$alias}/{$result['failed']} failed: {$result['error']}");
        }
        $log[] = ucfirst($alias) . ': applied ' . count($result['applied']) . ' migration(s).';

        if ($alias === 'users') {
            $usersPdo = $pdo;
        }
    }

    if ($usersPdo === null) {
        throw new RuntimeException('The users database was not set up, so no admin could be created.');
    }

    // The first admin, from what was typed. Only when there is nobody, so this
    // cannot add an admin to a database that already has accounts.
    if ((int) $usersPdo->query('SELECT count(*) FROM users')->fetchColumn() > 0) {
        $log[] = 'Admin: the users table already has accounts, so none was created.';
    } else {
        $username = strstr($email, '@', true) ?: 'admin';
        $usersPdo->prepare(
            'INSERT INTO users (username, email, password, role, email_confirmed, force_password_change)
             VALUES (?, ?, ?, ?, TRUE, FALSE)'
        )->execute([$username, $email, password_hash($password, PASSWORD_DEFAULT), 'ADMIN']);
        $log[] = "Admin: created {$email}.";
    }

    return $log;
}

$errors = [];
// Kept to refill the form on error - never the passwords or the token.
// Defaults for the email fields are guessed from the address this page is being
// opened at - the site is served same-origin, so its own host is where the links
// in mail should point and a sensible domain for the sender mailbox.
$reqHost = preg_replace('/:\d+$/', '', (string) ($_SERVER['HTTP_HOST'] ?? 'localhost'));
$reqScheme = (!empty($_SERVER['HTTPS']) && strtolower((string) $_SERVER['HTTPS']) !== 'off') ? 'https' : 'http';

$old = [
    'email' => '', 'db_host' => '127.0.0.1', 'db_port' => '5432', 'db_user' => '',
    'db_users' => 'users', 'db_genshin' => 'genshin_impact',
    'mail_noreply' => 'noreply@' . $reqHost, 'mail_support' => 'support@' . $reqHost,
    'mail_from_name' => 'Anotoki', 'mail_base_url' => $reqScheme . '://' . $reqHost,
    'google_client_id' => '',
    'backup_home' => '',
];
// Whether to actually send (PHP mail()) or write messages to storage/mail for
// now. Ticked by default; a checkbox is absent from POST when unticked.
$mailSend = ($_SERVER['REQUEST_METHOD'] !== 'POST') || isset($_POST['mail_send']);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    foreach (array_keys($old) as $key) {
        $old[$key] = trim((string) ($_POST[$key] ?? $old[$key]));
    }
    $given = (string) ($_POST['token'] ?? '');
    $password = (string) ($_POST['password'] ?? '');
    $confirm = (string) ($_POST['confirm'] ?? '');
    $dbPass = (string) ($_POST['db_pass'] ?? '');

    if (!hash_equals($token, $given)) {
        $errors[] = 'That is not the setup token from config/setup.local.php.';
    }
    if (!filter_var($old['email'], FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'Enter a valid email for the admin account.';
    }
    if (strlen($password) < 8) {
        $errors[] = 'The admin password must be at least 8 characters.';
    }
    if ($password !== $confirm) {
        $errors[] = 'The two admin passwords do not match.';
    }
    if ($old['db_host'] === '' || !ctype_digit($old['db_port']) || $old['db_user'] === '' || $old['db_users'] === '' || $old['db_genshin'] === '') {
        $errors[] = 'Fill in the host, a numeric port, the username, and both database names.';
    }
    if ($mailSend && (!filter_var($old['mail_noreply'], FILTER_VALIDATE_EMAIL) || !filter_var($old['mail_support'], FILTER_VALIDATE_EMAIL))) {
        $errors[] = 'Enter valid no-reply and support addresses (mailboxes on your own domain), or untick sending.';
    }
    if (!filter_var($old['mail_base_url'], FILTER_VALIDATE_URL)) {
        $errors[] = 'Enter a valid site URL for the links in emails.';
    }
    if ($old['google_client_id'] !== '' && !preg_match('/\.apps\.googleusercontent\.com$/', $old['google_client_id'])) {
        $errors[] = 'That does not look like a Google client ID (it ends with .apps.googleusercontent.com). Leave it blank to skip Google sign-in.';
    }

    if (!$errors) {
        $config = [
            'driver' => 'pgsql',
            'host' => $old['db_host'],
            'port' => $old['db_port'],
            'databases' => ['users' => $old['db_users'], 'genshin_impact' => $old['db_genshin']],
            'username' => $old['db_user'],
            'password' => $dbPass,
            'persistent' => true,
            'charset' => 'utf8',
        ];

        try {
            $log = runInstall($config, $old['email'], $password);

            // Everything worked - now persist the config the running site reads.
            $written = [];
            if (writeSecretFile(DB_CONFIG_FILE, "<?php\n\nreturn " . var_export($config, true) . ";\n")) {
                $written[] = 'config/database.local.php';
            }
            // Never overwrite an existing secret - that would sign out everyone.
            if (!is_file(JWT_FILE)) {
                if (writeSecretFile(JWT_FILE, "<?php\n\nreturn " . var_export(bin2hex(random_bytes(32)), true) . ";\n")) {
                    $written[] = 'config/jwt.local.php';
                }
            }

            $mailConfig = [
                'driver' => $mailSend ? 'mail' : 'file',
                'base_url' => rtrim($old['mail_base_url'], '/'),
                // Default sender (used if a key is missing) is the no-reply one.
                'from' => $old['mail_noreply'],
                'from_name' => $old['mail_from_name'],
                'senders' => [
                    'noreply' => ['from' => $old['mail_noreply'], 'from_name' => $old['mail_from_name']],
                    'support' => ['from' => $old['mail_support'], 'from_name' => $old['mail_from_name']],
                ],
            ];
            if (writeSecretFile(MAIL_FILE, "<?php\n\nreturn " . var_export($mailConfig, true) . ";\n")) {
                $written[] = 'config/mail.local.php';
            }

            // Google sign-in is optional; only written when a client ID was given.
            if ($old['google_client_id'] !== '') {
                if (writeSecretFile(GOOGLE_FILE, "<?php\n\nreturn " . var_export(['client_id' => $old['google_client_id']], true) . ";\n")) {
                    $written[] = 'config/google.local.php';
                }
            }

            // Backups are optional; written when a home directory was given and
            // the client tools are actually installed under ~/pgclient there.
            $backupNote = '';
            if ($old['backup_home'] !== '') {
                $backupPaths = setupBackupPaths($old['backup_home']);
                if ($backupPaths) {
                    if (writeSecretFile(BACKUP_FILE, "<?php\n\nreturn " . var_export($backupPaths, true) . ";\n")) {
                        $written[] = 'config/backup.local.php';
                    }
                } else {
                    $backupNote = '<div class="note">No <code>pg_dump</code> was found under <code>'
                        . h(rtrim(str_replace('\\', '/', trim($old['backup_home'])), '/')) . '/pgclient</code>,'
                        . ' so <code>config/backup.local.php</code> was not written. Install the PostgreSQL'
                        . ' client tools there (see <code>PG-DUMP-INSTALL.md</code>) and create that file to enable backups.</div>';
                }
            }

            // The lock first, so a re-run is refused even if cleanup below fails.
            if (!is_dir(dirname(SETUP_LOCK))) {
                @mkdir(dirname(SETUP_LOCK), 0700, true);
            }
            @file_put_contents(SETUP_LOCK, json_encode(['installed_at' => date('c'), 'admin' => $old['email']], JSON_PRETTY_PRINT));

            $selfDeleted = deleteSetupArtifacts();

            $steps = '<ul>' . implode('', array_map(fn($l) => '<li>' . h($l) . '</li>', $log)) . '</ul>';
            $wrote = $written ? '<p>Wrote ' . implode(' and ', array_map(fn($f) => '<code>' . h($f) . '</code>', $written)) . '.</p>' : '';
            $cleanup = $selfDeleted
                ? '<p class="ok">Removed <code>setup.php</code> and <code>config/setup.local.php</code>.</p>'
                : '<p class="err">Delete <code>setup.php</code> and <code>config/setup.local.php</code> by hand -'
                . ' they could not be removed automatically. (It will refuse to run again regardless.)</p>';

            render('Installed', $steps . $wrote . $backupNote . $cleanup . '<p>Sign in at <code>/admin</code> with the account you just made.</p>', 'good');
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
    . ($type === 'text' || $type === 'email' || $type === 'number' ? ' value="' . h($old[$name] ?? '') . '"' : '')
    . ' ' . $extra . '>';

render(
    'Install anotoki',
    '<p>This creates the config, runs every migration for both databases, and makes'
    . ' the first admin. Do it once, on empty databases you have already created in'
    . ' your hosting panel.</p>'
    . '<div class="note">A token was written to <code>config/setup.local.php</code>.'
    . ' Open that file over SFTP, copy the token, and paste it below - that is how the'
    . ' installer knows it is really you.</div>'
    . $errorHtml
    . '<form method="post" autocomplete="off">'
    . $field('token', 'Setup token', 'password', 'required placeholder="from config/setup.local.php"')
    . '<h2>Admin account</h2>'
    . $field('email', 'Admin email', 'email', 'required')
    . '<div class="row"><div>' . $field('password', 'Password', 'password', 'required minlength="8"')
    . '</div><div>' . $field('confirm', 'Confirm', 'password', 'required minlength="8"') . '</div></div>'
    . '<h2>Database</h2>'
    . '<div class="row"><div>' . $field('db_host', 'Host', 'text', 'required')
    . '</div><div>' . $field('db_port', 'Port', 'text', 'required inputmode="numeric"') . '</div></div>'
    . '<div class="row"><div>' . $field('db_user', 'Username', 'text', 'required')
    . '</div><div>' . $field('db_pass', 'Password', 'password', '') . '</div></div>'
    . '<div class="row"><div>' . $field('db_users', 'Users database', 'text', 'required')
    . '</div><div>' . $field('db_genshin', 'Content database', 'text', 'required') . '</div></div>'
    . '<h2>Email</h2>'
    . '<label class="check"><input type="checkbox" name="mail_send"' . ($mailSend ? ' checked' : '') . '>'
    . ' Send emails now (PHP mail()). Untick to write them to storage/mail instead.</label>'
    . '<div class="row"><div>' . $field('mail_noreply', 'No-reply address', 'email', 'placeholder="noreply@your-domain"')
    . '</div><div>' . $field('mail_support', 'Support address', 'email', 'placeholder="support@your-domain"') . '</div></div>'
    . '<p class="muted">Both must be real mailboxes on your own domain - most hosting refuses mail whose'
    . ' sender domain does not match. Create them in the panel first. No-reply sends the automated account'
    . ' mail; support sends the welcome, which a person may reply to.</p>'
    . '<div class="row"><div>' . $field('mail_from_name', 'From name', 'text', '')
    . '</div><div>' . $field('mail_base_url', 'Site URL (links in emails)', 'text', 'required') . '</div></div>'
    . '<h2>Google sign-in (optional)</h2>'
    . $field('google_client_id', 'Google OAuth client ID', 'text', 'placeholder="…apps.googleusercontent.com"')
    . '<p class="muted">Leave blank to turn Google sign-in off. From a Google Cloud OAuth client;'
    . ' the frontend reads it back from the API, so only this is needed.</p>'
    . '<h2>Backups (optional)</h2>'
    . $field('backup_home', 'Server home directory', 'text', 'placeholder="/home/you"')
    . '<p class="muted">For on-server database backups. Run <code>echo $HOME</code> over SSH/console and paste it'
    . ' here, after unpacking the PostgreSQL client tools under <code>~/pgclient</code> (see'
    . ' <code>PG-DUMP-INSTALL.md</code>). The installer finds <code>pg_dump</code>, its version and its library'
    . ' folder there and writes <code>config/backup.local.php</code>. Leave blank to skip - you can add that file later.</p>'
    . '<button type="submit">Run install</button>'
    . '</form>'
);
