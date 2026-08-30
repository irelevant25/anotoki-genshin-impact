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
 *   GET    /api/backups/{id}/preview/{alias}    what restoring it would cost
 *   POST   /api/backups/{id}/restore/{alias}    put one back
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
    $refusal = backupRefusalReason();
    if ($refusal) {
        return respondJson($response, ['error' => $refusal], 422);
    }

    $body = $request->getParsedBody() ?? [];
    $description = trim((string) ($body['description'] ?? ''));
    $description = $description === '' ? null : mb_substr($description, 0, BACKUP_DESCRIPTION_LIMIT);

    $user = $request->getAttribute('user');

    try {
        $manifest = backupCreate($description, $user['username'] ?? null);
    } catch (\RuntimeException $e) {
        return respondJson($response, ['error' => $e->getMessage()], 500);
    }

    return respondJson($response, $manifest, $manifest['status'] === 'failed' ? 500 : 201);
})->add(requireRole('ADMIN'))->add(requireAuth());

/**
 * Why a backup cannot be made here, or null when it can.
 *
 * Checked before the button does anything, and again before a restore takes
 * its safety copy - a restore without one is not a thing worth allowing.
 */
function backupRefusalReason(): ?string
{
    $config = backupDatabaseConfig();

    if (($config['driver'] ?? null) !== 'pgsql') {
        return 'Backups are only implemented for PostgreSQL';
    }

    if (!backupBinary('pg_dump')) {
        return 'pg_dump was not found. Install the PostgreSQL client tools, or point config/backup.local.php at them.';
    }

    return null;
}

/**
 * Dumps every configured database into a new backup and returns its manifest.
 *
 * Shared by the button and by the safety copy a restore takes first, so both
 * produce the same thing and both appear in the same list.
 */
function backupCreate(?string $description, ?string $createdBy): array
{
    // A dump of a hundred megabytes takes seconds, not milliseconds, and a
    // half-written one is worse than none - so let it finish even if the
    // browser gives up waiting.
    set_time_limit(0);
    ignore_user_abort(true);

    $id = date(BACKUP_ID_FORMAT) . '-' . substr(bin2hex(random_bytes(4)), 0, 6);
    $directory = backupDirectory() . '/' . $id;

    if (!mkdir($directory, 0775, true) && !is_dir($directory)) {
        throw new \RuntimeException('Could not create the backup directory');
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
        'created_by' => $createdBy,
        'description' => $description,
        'status' => $failed ? ($allFailed ? 'failed' : 'partial') : 'complete',
        'format' => 'pg_dump custom',
        'pg_dump_version' => backupBinaryVersion('pg_dump'),
        'duration_ms' => (int) round((microtime(true) - $started) * 1000),
        'databases' => $results,
    ];

    file_put_contents(backupManifestPath($directory), json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

    $manifest['size'] = backupSize($directory);

    return $manifest;
}

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

// ═════════════════════════════════════════════════════════════════════════════
// Restoring
// ═════════════════════════════════════════════════════════════════════════════
//
// Putting a dump back replaces everything in a database. Four things stand
// between a click and that happening: the operator retypes their password, they
// type the database's name, a countdown in the UI keeps the button unavailable
// for long enough to think, and the server takes a fresh backup of what is
// about to be destroyed before it destroys it.
//
// The restore itself runs in a single transaction, so a failure halfway leaves
// the database exactly as it was rather than half-replaced.

/**
 * A connection that is not the shared cached one.
 *
 * Restoring needs to disconnect everything from the target database, including
 * this process's own handle to it, and then read it again afterwards. Going
 * through getDb() would hand back the connection that was just terminated.
 */
function backupFreshPdo(string $dbname): PDO
{
    $config = backupDatabaseConfig();

    $pdo = new PDO(
        "pgsql:host={$config['host']};port={$config['port']};dbname={$dbname}",
        $config['username'],
        $config['password']
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    return $pdo;
}

/**
 * Disconnects everything else from a database, so its objects can be dropped.
 *
 * Issued from a connection to a different database: a session cannot terminate
 * every connection to the database it is itself connected to. Anything the site
 * is doing at that moment ends with an error, which is the honest outcome - the
 * data underneath it is about to be replaced.
 */
function backupTerminateConnections(string $dbname): int
{
    $config = backupDatabaseConfig();

    $elsewhere = null;
    foreach ($config['databases'] ?? [] as $candidate) {
        if ($candidate !== $dbname) {
            $elsewhere = $candidate;
            break;
        }
    }

    // A single-database install has nowhere to stand; pg_restore will still
    // manage unless something else holds a lock.
    if ($elsewhere === null) {
        return 0;
    }

    $pdo = backupFreshPdo($elsewhere);
    $statement = $pdo->prepare(
        'SELECT pg_terminate_backend(pid) FROM pg_stat_activity
         WHERE datname = ? AND pid <> pg_backend_pid()'
    );
    $statement->execute([$dbname]);

    return $statement->rowCount();
}

/** Runs pg_restore for one database, all or nothing. */
function backupRunRestore(string $dbname, string $file): array
{
    $config = backupDatabaseConfig();
    $binary = backupBinary('pg_restore');

    if (!$binary) {
        return ['ok' => false, 'error' => 'pg_restore was not found on this server'];
    }

    $command = [
        $binary,
        '--host=' . $config['host'],
        '--port=' . $config['port'],
        '--username=' . $config['username'],
        '--dbname=' . $dbname,
        // Drop what is there before recreating it, and do the whole thing in
        // one transaction so a failure rolls back to the state it started in.
        '--clean',
        '--if-exists',
        '--single-transaction',
        // The dump records who owned each object. Skipping that lets a backup
        // restore onto a server whose roles are named differently.
        '--no-owner',
        '--no-privileges',
        $file,
    ];

    $environment = getenv();
    $environment['PGPASSWORD'] = (string) ($config['password'] ?? '');

    $descriptors = [1 => ['pipe', 'w'], 2 => ['pipe', 'w']];
    $process = @proc_open($command, $descriptors, $pipes, null, $environment);

    if (!is_resource($process)) {
        return ['ok' => false, 'error' => 'Could not start pg_restore'];
    }

    stream_get_contents($pipes[1]);
    $errors = stream_get_contents($pipes[2]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    $exitCode = proc_close($process);

    $lines = array_values(array_filter(array_map('trim', explode("\n", (string) $errors))));

    if ($exitCode !== 0) {
        return ['ok' => false, 'error' => $lines ? end($lines) : "pg_restore exited with code $exitCode"];
    }

    // pg_restore reports harmless complaints on stderr and still succeeds; they
    // are worth showing without calling the restore a failure.
    return ['ok' => true, 'error' => null, 'warnings' => array_slice($lines, 0, 10)];
}

// ── GET /api/backups/{id}/preview/{alias} ────────────────────────────────────
// What restoring this database would cost, table by table, so the warning can
// name it rather than gesture at it.

$app->get('/api/backups/' . BACKUP_ID_ROUTE . '/preview/{alias:[a-z0-9_]+}', function (Request $request, Response $response, array $args) {
    $directory = backupPath($args['id']);
    $databases = backupDatabases();

    if (!$directory || !array_key_exists($args['alias'], $databases)) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    $manifest = backupReadManifest($args['id'], $directory);
    $inBackup = null;
    foreach ($manifest['databases'] ?? [] as $entry) {
        if ($entry['alias'] === $args['alias']) {
            $inBackup = $entry;
        }
    }

    if (!$inBackup || $inBackup['error'] || !is_file($directory . '/' . $args['alias'] . '.dump')) {
        return respondJson($response, ['error' => 'This backup has no usable dump for that database'], 422);
    }

    try {
        $live = backupTableCounts(getDb($args['alias']));
    } catch (\Throwable $e) {
        return respondJson($response, ['error' => 'That database cannot be reached'], 503);
    }

    $liveByName = array_column($live, 'rows', 'name');
    $backupByName = array_column($inBackup['tables'], 'rows', 'name');

    // Every table either side knows about, so a table that exists now and is
    // not in the backup shows up as the whole loss it is.
    $names = array_unique(array_merge(array_keys($liveByName), array_keys($backupByName)));
    sort($names);

    $differences = [];
    foreach ($names as $name) {
        $liveRows = $liveByName[$name] ?? null;
        $backupRows = $backupByName[$name] ?? null;

        if ($liveRows === $backupRows) {
            continue;
        }

        // pg_restore --clean drops only the objects the dump contains, so a
        // table created since the backup is not removed - it is left exactly
        // as it is, and the database ends up not quite matching the backup.
        // Verified, not assumed: a table planted before a restore survived it.
        $kind = 'changed';
        if ($backupRows === null) {
            $kind = 'kept';
        } elseif ($liveRows === null) {
            $kind = 'created';
        }

        $differences[] = [
            'name' => $name,
            'live' => $liveRows,
            'backup' => $backupRows,
            // Positive means rows that exist now and are not in the backup, so
            // they are the ones a restore loses. Meaningless for 'kept'.
            'delta' => $kind === 'kept' ? 0 : ($liveRows ?? 0) - ($backupRows ?? 0),
            'kind' => $kind,
        ];
    }

    // Biggest loss first: that is what somebody needs to see before deciding.
    usort($differences, fn($a, $b) => $b['delta'] <=> $a['delta']);

    $lost = 0;
    foreach ($differences as $difference) {
        if ($difference['delta'] > 0) {
            $lost += $difference['delta'];
        }
    }

    return respondJson($response, [
        'id' => $args['id'],
        'alias' => $args['alias'],
        'name' => $databases[$args['alias']],
        'created_at' => $manifest['created_at'] ?? null,
        'live' => ['rows' => array_sum($liveByName), 'tables' => count($liveByName)],
        'backup' => ['rows' => array_sum($backupByName), 'tables' => count($backupByName)],
        // Rows that exist now, are not in the backup, and are in a table the
        // restore replaces. This is the number that is actually destroyed.
        'lost' => $lost,
        'differences' => $differences,
    ]);
})->add(requireRole('ADMIN'))->add(requireAuth());

// ── POST /api/backups/{id}/restore/{alias} ───────────────────────────────────

$app->post('/api/backups/' . BACKUP_ID_ROUTE . '/restore/{alias:[a-z0-9_]+}', function (Request $request, Response $response, array $args) {
    $directory = backupPath($args['id']);
    $databases = backupDatabases();
    $alias = $args['alias'];

    if (!$directory || !array_key_exists($alias, $databases)) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    $file = $directory . '/' . $alias . '.dump';
    if (!is_file($file)) {
        return respondJson($response, ['error' => 'This backup has no dump for that database'], 422);
    }

    if (!backupBinary('pg_restore')) {
        return respondJson($response, [
            'error' => 'pg_restore was not found. Install the PostgreSQL client tools, or point config/backup.local.php at them.',
        ], 422);
    }

    $body = $request->getParsedBody() ?? [];
    $user = $request->getAttribute('user');

    // Typing the name is what makes this deliberate rather than a misclick.
    if (trim((string) ($body['confirm'] ?? '')) !== $alias) {
        return respondJson($response, ['error' => "Type {$alias} to confirm"], 422);
    }

    // And the password is what makes it this person rather than whoever found
    // the screen unlocked.
    $password = (string) ($body['password'] ?? '');
    if ($password === '' || !password_verify($password, (string) ($user['password'] ?? ''))) {
        return respondJson($response, ['error' => 'That password is not right'], 403);
    }

    $refusal = backupRefusalReason();
    if ($refusal) {
        return respondJson($response, ['error' => 'Refusing to restore without a safety backup: ' . $refusal], 422);
    }

    set_time_limit(0);
    ignore_user_abort(true);

    // The state about to be replaced, kept before it is replaced. This is the
    // undo, and it is the reason a restore is survivable at all.
    try {
        $safety = backupCreate(
            'Safety copy taken automatically before restoring ' . $alias . ' from ' . $args['id'],
            $user['username'] ?? null
        );
    } catch (\RuntimeException $e) {
        return respondJson($response, ['error' => 'Refusing to restore: the safety backup failed. ' . $e->getMessage()], 500);
    }

    foreach ($safety['databases'] as $entry) {
        if ($entry['alias'] === $alias && $entry['error']) {
            return respondJson($response, [
                'error' => 'Refusing to restore: the safety backup of ' . $alias . ' failed. ' . $entry['error'],
                'safety_backup' => $safety['id'],
            ], 500);
        }
    }

    $started = microtime(true);
    $terminated = 0;

    try {
        $terminated = backupTerminateConnections($databases[$alias]);
    } catch (\Throwable $e) {
        // Not fatal on its own: pg_restore will say so if something still
        // holds a lock, and the transaction will roll back if it cannot.
        error_log('[backups] could not disconnect sessions: ' . $e->getMessage());
    }

    $restore = backupRunRestore($databases[$alias], $file);
    $duration = (int) round((microtime(true) - $started) * 1000);

    if (!$restore['ok']) {
        return respondJson($response, [
            'error' => $restore['error'],
            'safety_backup' => $safety['id'],
            'duration_ms' => $duration,
            // --single-transaction means a failure changed nothing, which is
            // the one piece of news worth leading with.
            'rolled_back' => true,
        ], 500);
    }

    // Read the result back on a new connection - the old one was disconnected
    // along with everything else - so the answer is what is in there now.
    $tables = [];
    try {
        $tables = backupTableCounts(backupFreshPdo($databases[$alias]));
    } catch (\Throwable $e) {
        error_log('[backups] restored but could not count: ' . $e->getMessage());
    }

    return respondJson($response, [
        'restored' => $alias,
        'from' => $args['id'],
        'safety_backup' => $safety['id'],
        'duration_ms' => $duration,
        'disconnected' => $terminated,
        'rows' => array_sum(array_column($tables, 'rows')),
        'tables' => $tables,
        'warnings' => $restore['warnings'] ?? [],
    ]);
})->add(requireRole('ADMIN'))->add(requireAuth());
