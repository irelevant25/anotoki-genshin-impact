<?php

/**
 * db-push.php - copy the local database up to another server, in one command.
 *
 *   php db-push.php
 *
 * Dumps the local database and loads it into a target (production) server: it
 * dumps the local one, clears the target, and restores the dump into it. The
 * result is that the target becomes an exact copy of local - schema, data and
 * the migrations table - so it needs no separate migration run, whether or not
 * setup.php has already built it.
 *
 * It asks for the target connection and never stores it. The password is passed
 * to pg_dump/pg_restore through the environment, never on a command line and
 * never in a shell variable you have to set yourself.
 *
 *   ⚠  THIS ERASES THE TARGET DATABASE and replaces it with local. It asks you
 *      to type the target host to confirm. Use it to seed a fresh server; do
 *      not point it at a database that already holds data you want to keep.
 *
 * Needs the PostgreSQL client tools locally (config/backup.local.php if not on
 * PATH) and network access to the target's PostgreSQL. A maintenance script:
 * CLI only, not shipped by build-dist.php.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit("db-push.php is a command-line tool.\n");
}

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/backup.php';

/**
 * Tables that must hold as many rows after the restore as they do here, to
 * confirm the data landed: one from each half of the database.
 */
const PUSH_SENTINELS = ['users', 'translations', 'characters'];

function ask(string $prompt, string $default = ''): string
{
    echo $prompt . ($default !== '' ? " [{$default}]" : '') . ': ';
    $line = rtrim((string) fgets(STDIN), "\r\n");
    return $line === '' ? $default : $line;
}

$pgDump = backupBinary('pg_dump');
$pgRestore = backupBinary('pg_restore');
if (!$pgDump || !$pgRestore) {
    echo "pg_dump / pg_restore were not found. Point config/backup.local.php at them.\n";
    exit(1);
}

try {
    $local = databaseConfig();
} catch (NotSetUpException $e) {
    echo $e->getMessage() . "\n";
    exit(1);
}
$localName = (string) $local['database'];

// ── The target ────────────────────────────────────────────────────────────────

echo "Copy the local database UP to a target server.\n";
echo "The target database will be ERASED and replaced with local.\n\n";

$target = [
    'host' => ask('Target host'),
    'port' => ask('Target port', '5432'),
    'user' => ask('Target username'),
    'pass' => ask('Target password'),
];
$targetName = ask('Target database name');

if ($target['host'] === '' || $target['user'] === '' || $targetName === '') {
    echo "\nHost, username and the database name are required.\n";
    exit(1);
}

echo "\nAbout to replace, on {$target['host']}:\n";
echo "  {$targetName}  ⟵  local {$localName}\n";
echo "\nThis DELETES everything in that target database. To confirm, type the target host again:\n> ";
if (rtrim((string) fgets(STDIN), "\r\n") !== $target['host']) {
    echo "Did not match. Nothing was changed.\n";
    exit(1);
}

// ── Do it ─────────────────────────────────────────────────────────────────────

$stamp = date('Ymd-His');
$dir = __DIR__ . '/storage/backups/manual/' . $stamp;
@mkdir($dir, 0700, true);
$file = $dir . '/genshin.dump';

// 1. Dump local.
echo "\n  dumping local {$localName} ... ";
$r = pgRun(
    $pgDump,
    ['-h', (string) ($local['host'] ?? '127.0.0.1'), '-p', (string) ($local['port'] ?? '5432'), '-U', (string) ($local['username'] ?? ''), '-Fc', '-f', $file, $localName],
    (string) ($local['password'] ?? ''),
);
if (!$r['ok']) {
    echo "FAILED\n" . indentLines($r['stderr']) . "\n";
    exit(1);
}
echo 'done (' . number_format(filesize($file) / 1048576, 1) . " MB)\n";

// 2. Clear the target, so a restore never collides with what is there.
echo "  clearing target {$targetName} ... ";
try {
    $pdo = new PDO("pgsql:host={$target['host']};port={$target['port']};dbname={$targetName}", $target['user'], $target['pass'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    clearPublicSchema($pdo);
} catch (\Throwable $e) {
    echo "FAILED\n  Cannot reach or clear {$targetName}: {$e->getMessage()}\n";
    exit(1);
}
echo "done\n";

// 3. Restore local into the target. --no-comments as well, because setting
//    the comment on the public schema needs to own it, which a managed host's
//    database user often does not - a harmless line to skip.
echo "  restoring into {$targetName} ... ";
$r = pgRun($pgRestore, ['-h', $target['host'], '-p', $target['port'], '-U', $target['user'], '-d', $targetName, '--no-owner', '--no-privileges', '--no-comments', $file], $target['pass']);
if ($r['ok']) {
    echo "done\n";
} elseif (stripos($r['stderr'], 'errors ignored on restore') !== false) {
    // pg_restore exits non-zero if it skipped ANY statement, even one benign
    // line - a newer pg_dump's SET that an older server does not know, say. The
    // rest went in; show what was skipped so you can judge it.
    echo "done, but pg_restore skipped some lines:\n" . indentLines($r['stderr']) . "\n";
} else {
    echo "FAILED\n" . indentLines($r['stderr']) . "\n";
    exit(1);
}

// 4. Confirm the data actually landed, against the local counts.
try {
    $tpdo = new PDO("pgsql:host={$target['host']};port={$target['port']};dbname={$targetName}", $target['user'], $target['pass'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    foreach (PUSH_SENTINELS as $sentinel) {
        $got = (int) $tpdo->query("SELECT count(*) FROM {$sentinel}")->fetchColumn();
        $want = (int) getDb()
            ->query("SELECT count(*) FROM {$sentinel}")
            ->fetchColumn();
        echo "  verify: {$targetName}.{$sentinel} = {$got} rows (local has {$want})" . ($got === $want ? " ✓\n" : " — DIFFERS, check the skipped lines above\n");
    }
} catch (\Throwable $e) {
    echo "  verify: could not read {$targetName}: {$e->getMessage()}\n";
}

echo "\nDone. {$target['host']} now matches local.\n";
echo "The dump is kept at {$file} (it holds every row - delete it when done).\n";
echo "The target keeps its own config files (config/*.local.php) and its assets/ -\n";
echo "only the database rows were replaced.\n";

/**
 * Empties the public schema. Dropping and recreating it is the thorough way,
 * but only its owner may - and on a managed host `public` usually belongs to
 * the server's superuser, not the site's user. Then what the site's user owns
 * in it is dropped instead, which is everything a restore of this database
 * made.
 */
function clearPublicSchema(PDO $pdo): void
{
    try {
        $pdo->exec('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;');
        return;
    } catch (\Throwable $e) {
        // Not the schema's owner; clear it object by object below.
    }

    $pdo->exec(
        <<<'SQL'
        DO $$
        DECLARE item record;
        BEGIN
            FOR item IN
                SELECT c.relname, c.relkind FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
                 WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p', 'v', 'm', 'S', 'f')
                   AND pg_get_userbyid(c.relowner) = current_user
                 ORDER BY c.relkind = 'S'
            LOOP
                EXECUTE format('DROP %s IF EXISTS public.%I CASCADE',
                    CASE item.relkind WHEN 'v' THEN 'VIEW' WHEN 'm' THEN 'MATERIALIZED VIEW'
                                      WHEN 'S' THEN 'SEQUENCE' WHEN 'f' THEN 'FOREIGN TABLE' ELSE 'TABLE' END,
                    item.relname);
            END LOOP;
            FOR item IN
                SELECT p.oid::regprocedure AS signature FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                 WHERE n.nspname = 'public' AND pg_get_userbyid(p.proowner) = current_user
            LOOP
                EXECUTE format('DROP FUNCTION IF EXISTS %s CASCADE', item.signature);
            END LOOP;
            FOR item IN
                SELECT t.typname FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
                 WHERE n.nspname = 'public' AND t.typtype IN ('e', 'd', 'c') AND t.typrelid = 0
                   AND pg_get_userbyid(t.typowner) = current_user
            LOOP
                EXECUTE format('DROP TYPE IF EXISTS public.%I CASCADE', item.typname);
            END LOOP;
        END $$
        SQL
        ,
    );
}

/** Indents multi-line tool output so it reads as a block under its step. */
function indentLines(string $text): string
{
    $lines = array_filter(array_map('rtrim', explode("\n", $text)), fn($l) => $l !== '');
    return $lines ? '    ' . implode("\n    ", $lines) : '    (no output)';
}

/**
 * Runs a pg_* binary with the password in the environment, capturing stderr.
 * Array command, so nothing is parsed by a shell. The caller decides what a
 * non-zero exit means - a failed dump is fatal; a restore that only "ignored
 * errors" is not.
 *
 * @return array{ok: bool, exit: int, stderr: string}
 */
function pgRun(string $binary, array $args, string $password): array
{
    putenv('PGPASSWORD=' . $password);
    $process = proc_open(array_merge([$binary], $args), [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
    if (!is_resource($process)) {
        putenv('PGPASSWORD');
        return ['ok' => false, 'exit' => -1, 'stderr' => 'could not start ' . basename($binary)];
    }
    stream_get_contents($pipes[1]);
    $stderr = stream_get_contents($pipes[2]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    $exit = proc_close($process);
    putenv('PGPASSWORD');

    return ['ok' => $exit === 0, 'exit' => $exit, 'stderr' => trim($stderr)];
}
