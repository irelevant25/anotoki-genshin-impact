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
})->add(requireRole(...ROLES_SYSTEM_READ))->add(requireAuth());

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
})->add(requireRole(...ROLES_SYSTEM_READ))->add(requireAuth());
