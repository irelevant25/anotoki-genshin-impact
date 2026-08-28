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
})->add(requireRole('ADMIN'))->add(requireAuth());

// ── GET /api/migrations/{database}/{filename} ─────────────────────────────────
// The SQL itself, for display in the admin UI.

$app->get('/api/migrations/{database}/{filename}', function (Request $request, Response $response, array $args) {
    $path = _migrationFilePath($args['database'], $args['filename']);
    if (!$path) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    return respondJson($response, [
        'database' => $args['database'],
        'filename' => $args['filename'],
        'size' => filesize($path),
        'content' => file_get_contents($path),
    ]);
})->add(requireRole('ADMIN'))->add(requireAuth());
