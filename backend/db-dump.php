<?php

/**
 * db-dump.php - dump the local database, ready to load into another server.
 *
 *   php db-dump.php [--dir=<folder>]
 *
 * Writes one pg_dump custom-format archive of the database - the game content
 * and the site's own half together - into storage/backups/manual/<timestamp>/
 * (or --dir), then prints the exact pg_restore command to load it into
 * production.
 *
 * The connection comes from config/database.local.php and the pg_dump binary
 * from config/backup.php (config/backup.local.php on a machine where the tools
 * are not on PATH). The password is passed through the environment, never on the
 * command line, and never printed.
 *
 * A maintenance script: CLI only, not shipped by build-dist.php. See the deploy
 * skill / DEV.md for how the dump then goes up (production has no shell,
 * so the restore runs from here against the remote database) - or db-push.php,
 * which does both in one command.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit("db-dump.php is a command-line tool.\n");
}

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/backup.php';

$options = getopt('', ['dir::']);

try {
    $config = databaseConfig();
} catch (NotSetUpException $e) {
    echo $e->getMessage() . "\n";
    exit(1);
}
$name = (string) $config['database'];

$pgDump = backupBinary('pg_dump');
if (!$pgDump) {
    echo "pg_dump was not found. Add it to PATH, or point config/backup.local.php at it:\n";
    echo "  <?php return ['pg_dump' => 'C:/Program Files/PostgreSQL/18/bin/pg_dump.exe'];\n";
    exit(1);
}

$stamp = date('Ymd-His');
$dir = rtrim($options['dir'] ?? (__DIR__ . '/storage/backups/manual/' . $stamp), '/\\');
if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) {
    echo "Could not create {$dir}.\n";
    exit(1);
}

$host = (string) ($config['host'] ?? '127.0.0.1');
$port = (string) ($config['port'] ?? '5432');
$user = (string) ($config['username'] ?? '');
$file = $dir . '/genshin.dump';

echo "Dumping {$name} ... ";

// pg_dump reads the password from the environment, so it is never in argv.
putenv('PGPASSWORD=' . (string) ($config['password'] ?? ''));

// Array form, so nothing goes through a shell; -Fc is the portable archive
// pg_restore reads.
$command = [$pgDump, '-h', $host, '-p', $port, '-U', $user, '-Fc', '-f', $file, $name];
$process = proc_open($command, [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);

if (!is_resource($process)) {
    putenv('PGPASSWORD');
    echo "FAILED (could not start pg_dump)\n";
    exit(1);
}
stream_get_contents($pipes[1]);
$errorOutput = stream_get_contents($pipes[2]);
fclose($pipes[1]);
fclose($pipes[2]);
$exit = proc_close($process);

putenv('PGPASSWORD');

if ($exit !== 0) {
    echo "FAILED\n";
    // The last line of pg_dump's complaint is the useful one.
    $lines = array_values(array_filter(array_map('trim', explode("\n", $errorOutput))));
    echo '  ' . ($lines ? end($lines) : "pg_dump exited with code {$exit}") . "\n";
    exit(1);
}

echo 'done (' . number_format(filesize($file) / 1048576, 1) . " MB)\n";

// ── Next step: load it into production ─────────────────────────────────────────

$pgRestore = backupBinary('pg_restore') ?: 'pg_restore';

echo "\nWrote {$file}\n";
echo "\nTo load into production (create the empty database in the panel first,\n";
echo "then run this from here - it connects to the remote server):\n\n";
echo "  set PGPASSWORD=<prod-password>\n";
echo "  \"{$pgRestore}\" -h <PROD_HOST> -p <PROD_PORT> -U <PROD_USER> -d <PROD_DB> --no-owner --no-privileges --no-comments \"{$file}\"\n";
echo "\nThe dump carries the schema, the data and the migrations table, so a\n";
echo "restored database needs no migration run. db-push.php does all of this in\n";
echo "one command, and clears the target first.\n";
