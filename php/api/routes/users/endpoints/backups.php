<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * Whole-database backups, made with pg_dump and kept on the server.
 *
 *   GET    /api/backups                         every backup, newest first
 *   GET    /api/backups/status                  whether one can be made here
 *   GET    /api/backups/{id}                    one manifest in full
 *   POST   /api/backups                         make one now
 *   DELETE /api/backups/{id}                    throw one away
 *   GET    /api/backups/{id}/download/{alias}   one database's dump file
 *
 * A backup is a directory holding one dump per configured database plus a
 * backup.json manifest. Every database goes in, not just this site's: the
 * accounts, translations and game content are only useful together, and
 * restoring content from one afternoon against accounts from another is
 * exactly the mess a backup is meant to prevent.
 *
 * It lives under users/ rather than a game folder for the same reason - it is
 * the whole installation, not one site's data.
 */

/** Directory name: sortable, readable, and unique within the same second. */
const BACKUP_ID_FORMAT = 'Ymd-His';
const BACKUP_ID_ROUTE = '{id:[0-9]{8}-[0-9]{6}-[a-z0-9]{6}}';
const BACKUP_MANIFEST = 'backup.json';
const BACKUP_DESCRIPTION_LIMIT = 200;

/** pg_dump's own compression, so the file on disk is the size it needs to be. */
const BACKUP_COMPRESSION = 6;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Alias => real database name, in the order the config lists them. */
function backupDatabases(): array
{
    return (array) (backupDatabaseConfig()['databases'] ?? []);
}

/** The directory for one backup, or null when the id is not one of ours. */
function backupPath(string $id): ?string
{
    if (!preg_match('/^[0-9]{8}-[0-9]{6}-[a-z0-9]{6}$/', $id)) {
        return null;
    }

    $path = backupDirectory() . '/' . $id;
    return is_dir($path) ? $path : null;
}

function backupManifestPath(string $directory): string
{
    return $directory . '/' . BACKUP_MANIFEST;
}

/**
 * The manifest of one backup, or a stand-in describing what is on disk.
 *
 * A directory with no manifest is a backup that was interrupted - the process
 * died, or the disk filled up. It is reported rather than hidden, because an
 * unusable backup that looks like nothing at all is worse than one that says
 * so.
 */
function backupReadManifest(string $id, string $directory): array
{
    $manifestFile = backupManifestPath($directory);

    if (is_file($manifestFile)) {
        $manifest = json_decode((string) file_get_contents($manifestFile), true);
        if (is_array($manifest)) {
            $manifest['id'] = $id;
            $manifest['size'] = backupSize($directory);
            return $manifest;
        }
    }

    return [
        'id' => $id,
        'created_at' => date(DATE_ATOM, (int) filemtime($directory)),
        'created_by' => null,
        'description' => null,
        'status' => 'incomplete',
        'note' => 'No manifest - this backup did not finish. Delete it.',
        'size' => backupSize($directory),
        'duration_ms' => null,
        'databases' => [],
    ];
}

/** Every file in one backup directory, added up. */
function backupSize(string $directory): int
{
    $total = 0;
    foreach (glob($directory . '/*') ?: [] as $file) {
        if (is_file($file)) {
            $total += (int) filesize($file);
        }
    }
    return $total;
}

/**
 * Exact row counts for every table in a database, in one round trip.
 *
 * Exact rather than pg_class.reltuples: the estimate is whatever the last
 * ANALYZE saw, and a count that is quietly wrong is worse than no count. These
 * databases are small enough that counting them properly costs milliseconds.
 */
function backupTableCounts(PDO $pdo): array
{
    $tables = $pdo
        ->query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename")
        ->fetchAll(PDO::FETCH_COLUMN);

    if (!$tables) {
        return [];
    }

    $parts = [];
    foreach ($tables as $table) {
        // The names come from the catalogue, but they still get quoted: a
        // table called "order" is legal and would otherwise be a syntax error.
        $quoted = '"' . str_replace('"', '""', $table) . '"';
        $parts[] = 'SELECT ' . $pdo->quote($table) . ' AS name, count(*) AS row_count FROM ' . $quoted;
    }

    $rows = $pdo->query(implode(' UNION ALL ', $parts) . ' ORDER BY name')->fetchAll();

    return array_map(fn($row) => ['name' => $row['name'], 'rows' => (int) $row['row_count']], $rows);
}

/**
 * Runs pg_dump for one database and reports what happened.
 *
 * proc_open is given the command as an array, so the arguments never go
 * through a shell and a database name cannot turn into one. The password goes
 * in the environment rather than on the command line, where anything that can
 * list processes would see it.
 */
function backupRunDump(string $name, string $target): array
{
    $config = backupDatabaseConfig();
    $binary = backupBinary('pg_dump');

    if (!$binary) {
        return ['ok' => false, 'error' => 'pg_dump was not found on this server'];
    }

    $command = [
        $binary,
        '--host=' . $config['host'],
        '--port=' . $config['port'],
        '--username=' . $config['username'],
        '--format=custom',
        '--compress=' . BACKUP_COMPRESSION,
        '--file=' . $target,
        $name,
    ];

    $environment = getenv();
    $environment['PGPASSWORD'] = (string) ($config['password'] ?? '');

    $descriptors = [1 => ['pipe', 'w'], 2 => ['pipe', 'w']];
    $process = @proc_open($command, $descriptors, $pipes, null, $environment);

    if (!is_resource($process)) {
        return ['ok' => false, 'error' => 'Could not start pg_dump'];
    }

    stream_get_contents($pipes[1]);
    $errors = stream_get_contents($pipes[2]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    $exitCode = proc_close($process);

    if ($exitCode !== 0) {
        // The last line of pg_dump's complaint is the useful one; the rest is
        // usually it repeating the connection it tried to make.
        $lines = array_values(array_filter(array_map('trim', explode("\n", (string) $errors))));
        return ['ok' => false, 'error' => $lines ? end($lines) : "pg_dump exited with code $exitCode"];
    }

    return ['ok' => true, 'error' => null];
}

/** Removes a backup directory and the files directly inside it. */
function backupRemove(string $directory): void
{
    foreach (glob($directory . '/*') ?: [] as $file) {
        if (is_file($file)) {
            unlink($file);
        }
    }
    @rmdir($directory);
}

// ── GET /api/backups ─────────────────────────────────────────────────────────
// Newest first, which is the one anybody is looking for.

$app->get('/api/backups', function (Request $request, Response $response) {
    $items = [];

    foreach (glob(backupDirectory() . '/*', GLOB_ONLYDIR) ?: [] as $directory) {
        $items[] = backupReadManifest(basename($directory), $directory);
    }

    usort($items, fn($a, $b) => $b['id'] <=> $a['id']);

    return respondJson($response, $items);
})->add(requireRole('ADMIN'))->add(requireAuth());

// ── GET /api/backups/status ──────────────────────────────────────────────────
// Everything the page needs to say whether a backup can be made at all, and
// roughly what it will cost - before somebody presses the button and waits.

$app->get('/api/backups/status', function (Request $request, Response $response) {
    $config = backupDatabaseConfig();
    $directory = backupDirectory();

    $databases = [];
    foreach (backupDatabases() as $alias => $name) {
        $entry = ['alias' => $alias, 'name' => $name, 'size' => null, 'tables' => null, 'error' => null];
        try {
            $pdo = getDb($alias);
            $entry['size'] = (int) $pdo->query('SELECT pg_database_size(current_database())')->fetchColumn();
            $entry['tables'] = (int) $pdo
                ->query("SELECT count(*) FROM pg_tables WHERE schemaname = 'public'")
                ->fetchColumn();
        } catch (\Throwable $e) {
            $entry['error'] = 'Cannot be reached';
        }
        $databases[] = $entry;
    }

    $directories = glob($directory . '/*', GLOB_ONLYDIR) ?: [];
    $stored = 0;
    foreach ($directories as $path) {
        $stored += backupSize($path);
    }

    return respondJson($response, [
        'driver' => $config['driver'] ?? null,
        // Only PostgreSQL is wired up. Saying so plainly is more use than a
        // backup button that fails with something cryptic on a MySQL install.
        'supported' => ($config['driver'] ?? null) === 'pgsql',
        'pg_dump' => backupBinary('pg_dump'),
        'pg_dump_version' => backupBinaryVersion('pg_dump'),
        'pg_restore' => backupBinary('pg_restore'),
        'directory' => $directory,
        'writable' => is_writable($directory),
        'free_space' => disk_free_space($directory) ?: null,
        'backup_count' => count($directories),
        'stored_size' => $stored,
        'databases' => $databases,
    ]);
})->add(requireRole('ADMIN'))->add(requireAuth());

// ── GET /api/backups/{id} ────────────────────────────────────────────────────

$app->get('/api/backups/' . BACKUP_ID_ROUTE, function (Request $request, Response $response, array $args) {
    $directory = backupPath($args['id']);
    if (!$directory) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    return respondJson($response, backupReadManifest($args['id'], $directory));
})->add(requireRole('ADMIN'))->add(requireAuth());

// ── POST /api/backups ────────────────────────────────────────────────────────
// Dumps every configured database, then writes the manifest. The manifest goes
// last on purpose: its presence is what marks the backup finished.

$app->post('/api/backups', function (Request $request, Response $response) {
    $config = backupDatabaseConfig();
    if (($config['driver'] ?? null) !== 'pgsql') {
        return respondJson($response, ['error' => 'Backups are only implemented for PostgreSQL'], 422);
    }

    if (!backupBinary('pg_dump')) {
        return respondJson($response, [
            'error' => 'pg_dump was not found. Install the PostgreSQL client tools, or point config/backup.local.php at them.',
        ], 422);
    }

    $body = $request->getParsedBody() ?? [];
    $description = trim((string) ($body['description'] ?? ''));
    $description = $description === '' ? null : mb_substr($description, 0, BACKUP_DESCRIPTION_LIMIT);

    $user = $request->getAttribute('user');

    // A dump of a hundred megabytes takes seconds, not milliseconds, and a
    // half-written one is worse than none - so let it finish even if the
    // browser gives up waiting.
    set_time_limit(0);
    ignore_user_abort(true);

    $id = date(BACKUP_ID_FORMAT) . '-' . substr(bin2hex(random_bytes(4)), 0, 6);
    $directory = backupDirectory() . '/' . $id;

    if (!mkdir($directory, 0775, true) && !is_dir($directory)) {
        return respondJson($response, ['error' => 'Could not create the backup directory'], 500);
    }

    $started = microtime(true);
    $results = [];

    foreach (backupDatabases() as $alias => $name) {
        $file = $alias . '.dump';
        $target = $directory . '/' . $file;
        $entry = [
            'alias' => $alias,
            'name' => $name,
            'file' => $file,
            'size' => null,
            'duration_ms' => null,
            'rows' => 0,
            'tables' => [],
            'error' => null,
        ];

        $databaseStarted = microtime(true);

        // Counted before the dump, so the numbers describe what went into it.
        try {
            $entry['tables'] = backupTableCounts(getDb($alias));
            $entry['rows'] = array_sum(array_column($entry['tables'], 'rows'));
        } catch (\Throwable $e) {
            $entry['error'] = 'Cannot be reached: ' . $e->getMessage();
            $entry['duration_ms'] = (int) round((microtime(true) - $databaseStarted) * 1000);
            $results[] = $entry;
            continue;
        }

        $dump = backupRunDump($name, $target);
        $entry['duration_ms'] = (int) round((microtime(true) - $databaseStarted) * 1000);

        if (!$dump['ok']) {
            $entry['error'] = $dump['error'];
            // A dump that failed halfway leaves a file that looks like a
            // backup and is not one.
            if (is_file($target)) {
                unlink($target);
            }
        } else {
            $entry['size'] = (int) filesize($target);
        }

        $results[] = $entry;
    }

    $failed = array_filter($results, fn($entry) => $entry['error'] !== null);
    $allFailed = $results && count($failed) === count($results);

    $manifest = [
        'id' => $id,
        'created_at' => date(DATE_ATOM),
        'created_by' => $user['username'] ?? null,
        'description' => $description,
        'status' => $failed ? ($allFailed ? 'failed' : 'partial') : 'complete',
        'format' => 'pg_dump custom',
        'pg_dump_version' => backupBinaryVersion('pg_dump'),
        'duration_ms' => (int) round((microtime(true) - $started) * 1000),
        'databases' => $results,
    ];

    file_put_contents(backupManifestPath($directory), json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

    $manifest['size'] = backupSize($directory);

    return respondJson($response, $manifest, $allFailed ? 500 : 201);
})->add(requireRole('ADMIN'))->add(requireAuth());

// ── DELETE /api/backups/{id} ─────────────────────────────────────────────────

$app->delete('/api/backups/' . BACKUP_ID_ROUTE, function (Request $request, Response $response, array $args) {
    $directory = backupPath($args['id']);
    if (!$directory) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    backupRemove($directory);

    return respondJson($response, ['deleted' => $args['id']]);
})->add(requireRole('ADMIN'))->add(requireAuth());

// ── GET /api/backups/{id}/download/{alias} ───────────────────────────────────
// A backup sitting on the same disk as the database it came from is only half
// a backup. This is how it gets somewhere else.

$app->get('/api/backups/' . BACKUP_ID_ROUTE . '/download/{alias:[a-z0-9_]+}', function (Request $request, Response $response, array $args) {
    $directory = backupPath($args['id']);
    if (!$directory) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    // The alias has to be one this installation actually knows, so the path
    // cannot be talked into pointing somewhere else.
    if (!array_key_exists($args['alias'], backupDatabases())) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    $file = $directory . '/' . $args['alias'] . '.dump';
    if (!is_file($file)) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    $handle = fopen($file, 'rb');
    if (!$handle) {
        return respondJson($response, ['error' => 'Could not read the file'], 500);
    }

    return $response
        ->withBody(new \Slim\Psr7\Stream($handle))
        ->withHeader('Content-Type', 'application/octet-stream')
        ->withHeader('Content-Length', (string) filesize($file))
        ->withHeader('Content-Disposition', 'attachment; filename="' . $args['id'] . '-' . $args['alias'] . '.dump"');
})->add(requireRole('ADMIN'))->add(requireAuth());
