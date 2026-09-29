<?php

/**
 * db-dump.php - dump the local databases, ready to load into another server.
 *
 *   php db-dump.php [--dir=<folder>]
 *
 * Writes one pg_dump custom-format archive per database (users, genshin_impact)
 * into storage/backups/manual/<timestamp>/ (or --dir), then prints the exact
 * pg_restore commands to load them into production.
 *
 * The connection comes from config/database.local.php and the pg_dump binary
 * from config/backup.php (config/backup.local.php on a machine where the tools
 * are not on PATH). The password is passed through the environment, never on the
 * command line, and never printed.
 *
 * A maintenance script: CLI only, not shipped by build-dist.php. See the deploy
 * skill / README for how the dumps then go up (production has no shell, so the
 * restore runs from here against the remote database).
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit("db-dump.php is a command-line tool.\n");
}

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/backup.php';

/** The databases worth dumping - the two this project actually uses. */
const DUMP_DATABASES = ['users', 'genshin_impact'];

$options = getopt('', ['dir::']);

try {
    $config = databaseConfig();
} catch (NotSetUpException $e) {
    echo $e->getMessage() . "\n";
    exit(1);
}
$databases = $config['databases'] ?? [];

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

// pg_dump reads the password from the environment, so it is never in argv.
putenv('PGPASSWORD=' . (string) ($config['password'] ?? ''));

$made = [];
$failed = false;

foreach (DUMP_DATABASES as $alias) {
    if (!isset($databases[$alias])) {
        echo "Skipping '{$alias}': not in config/database.local.php.\n";
        continue;
    }
    $name = (string) $databases[$alias];
    $file = $dir . '/' . $alias . '.dump';

    echo "Dumping {$alias} ({$name}) ... ";

    // Array form, so nothing goes through a shell; -Fc is the portable archive
    // pg_restore reads.
    $command = [$pgDump, '-h', $host, '-p', $port, '-U', $user, '-Fc', '-f', $file, $name];
    $process = proc_open($command, [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);

    if (!is_resource($process)) {
        echo "FAILED (could not start pg_dump)\n";
        $failed = true;
        continue;
    }
    stream_get_contents($pipes[1]);
    $errorOutput = stream_get_contents($pipes[2]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    $exit = proc_close($process);

    if ($exit !== 0) {
        echo "FAILED\n";
        // The last line of pg_dump's complaint is the useful one.
        $lines = array_values(array_filter(array_map('trim', explode("\n", $errorOutput))));
        echo '  ' . ($lines ? end($lines) : "pg_dump exited with code {$exit}") . "\n";
        $failed = true;
        continue;
    }

    $made[$alias] = $file;
    echo 'done (' . number_format(filesize($file) / 1048576, 1) . " MB)\n";
}

putenv('PGPASSWORD');

if (!$made) {
    exit($failed ? 1 : 0);
}

// ── Next step: load them into production ───────────────────────────────────────

$pgRestore = backupBinary('pg_restore') ?: 'pg_restore';

echo "\nWrote to {$dir}\n";
echo "\nTo load into production (create the empty databases in the panel first,\n";
echo "then run these from here - they connect to the remote server):\n\n";
echo "  set PGPASSWORD=<prod-password>\n";
foreach ($made as $alias => $file) {
    echo "  \"{$pgRestore}\" -h <PROD_HOST> -p <PROD_PORT> -U <PROD_USER> -d <PROD_" . strtoupper($alias) . "_DB> --no-owner --no-privileges \"{$file}\"\n";
}
echo "\nThe dumps carry the schema, the data and the migrations table, so a\n";
echo "restored database needs no migration run. Reset the admin password before\n";
echo "dumping if it is wrong, so production inherits a good one.\n";
