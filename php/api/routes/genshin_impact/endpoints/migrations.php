<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * Migrations live per database: the applied rows sit in each database's own
 * `migrations` table, and the SQL files under php/migrations/{alias}/.
 */

function _migrationDatabases(): array
{
    $config = require __DIR__ . '/../../../../config/database.local.php';
    return array_keys($config['databases'] ?? []);
}

function _migrationDir(string $alias): string
{
    return __DIR__ . '/../../../../migrations/' . $alias;
}

/** Guards against `..` and separators before touching the filesystem. */
function _migrationFilePath(string $alias, string $filename): ?string
{
    if (!in_array($alias, _migrationDatabases(), true)) {
        return null;
    }
    if ($filename === '' || basename($filename) !== $filename || !str_ends_with($filename, '.sql')) {
        return null;
    }
    $path = _migrationDir($alias) . '/' . $filename;
    return is_file($path) ? $path : null;
}

// ── GET /api/migrations ───────────────────────────────────────────────────────
// Every applied migration across every database, plus any file on disk that has
// not been applied yet.

$app->get('/api/migrations', function (Request $request, Response $response) {
    $items = [];

    foreach (_migrationDatabases() as $alias) {
        try {
            $pdo = getDb($alias);
            $rows = $pdo->query('SELECT * FROM migrations ORDER BY applied_at ASC, id ASC')->fetchAll();
        } catch (\Throwable $e) {
            error_log("[migrations] cannot read '$alias': " . $e->getMessage());
            continue;
        }

        $applied = [];
        foreach ($rows as $row) {
            $path = _migrationFilePath($alias, (string) $row['filename']);
            $applied[$row['filename']] = true;
            $items[] = [
                'id' => $alias . ':' . $row['filename'],
                'database' => $alias,
                'filename' => $row['filename'],
                'applied_at' => $row['applied_at'],
                'status' => $path ? 'applied' : 'applied (file missing)',
                'size' => $path ? filesize($path) : null,
            ];
        }

        foreach (glob(_migrationDir($alias) . '/*.sql') ?: [] as $path) {
            $filename = basename($path);
            if (!isset($applied[$filename])) {
                $items[] = [
                    'id' => $alias . ':' . $filename,
                    'database' => $alias,
                    'filename' => $filename,
                    'applied_at' => null,
                    'status' => 'pending',
                    'size' => filesize($path),
                ];
            }
        }
    }

    usort($items, fn($a, $b) => [$a['database'], $a['filename']] <=> [$b['database'], $b['filename']]);

    return respondJson($response, $items);
})->add(responds(MigrationEntry::class, list: true))->add(requireRole(...ROLES_SYSTEM_READ))->add(requireAuth());

// ── GET /api/migrations/file?database=&filename= ──────────────────────────────
// The SQL itself, for display in the admin UI.
//
// The file name is a query parameter rather than a path segment: PHP's built-in
// server treats a URI ending in a known extension as a static file request and
// answers it itself, so ".../001_initial_schema.sql" never reaches the router.

$app->get('/api/migrations/file', function (Request $request, Response $response) {
    $query = $request->getQueryParams();
    $database = (string) ($query['database'] ?? '');
    $filename = (string) ($query['filename'] ?? '');

    $path = _migrationFilePath($database, $filename);
    if (!$path) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    $content = file_get_contents($path);
    // A migration that is not valid UTF-8 would make json_encode return false
    // and send an empty body, which reads as an opaque failure in the client.
    if (!mb_check_encoding($content, 'UTF-8')) {
        $content = mb_convert_encoding($content, 'UTF-8', 'Windows-1252');
    }

    return respondJson($response, [
        'database' => $database,
        'filename' => $filename,
        'size' => filesize($path),
        'content' => $content,
    ]);
})->add(responds(MigrationFile::class))->add(requireRole(...ROLES_SYSTEM_READ))->add(requireAuth());

// ── POST /api/migrations/apply ────────────────────────────────────────────────
// Applies every pending migration across every database, in order, stopping a
// database at its first failure. This is the FTP deployment's way to run a
// schema change with no shell: upload the new .sql file, then apply it here.
//
// ADMIN only. The migrations themselves are trusted code from the deployment,
// not request input - this endpoint chooses which to run, never what they say.

$app->post('/api/migrations/apply', function (Request $request, Response $response) {
    $databases = [];
    $totalApplied = 0;
    $ok = true;

    foreach (_migrationDatabases() as $alias) {
        // An alias the config names but has written no migrations for yet
        // (star_rail) - nothing to build, and its database need not even exist,
        // so do not connect to it and do not count it as a failure.
        if (!migrationFiles($alias)) {
            continue;
        }

        try {
            $result = applyPendingMigrations(getDb($alias), $alias);
        } catch (\Throwable $e) {
            $databases[] = ['database' => $alias, 'applied' => [], 'failed' => null, 'error' => 'cannot reach database: ' . $e->getMessage()];
            $ok = false;
            continue;
        }

        $totalApplied += count($result['applied']);
        if ($result['failed'] !== null) {
            $ok = false;
        }
        $databases[] = [
            'database' => $alias,
            'applied' => $result['applied'],
            'failed' => $result['failed'],
            'error' => $result['error'],
        ];
    }

    return respondJson($response, ['applied' => $totalApplied, 'ok' => $ok, 'databases' => $databases]);
})->add(responds(MigrationApplyResult::class))->add(requireRole(...ROLES_SYSTEM_WRITE))->add(requireAuth());
