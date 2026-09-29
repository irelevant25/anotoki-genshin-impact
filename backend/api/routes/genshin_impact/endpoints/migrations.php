<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * The one database is built from two folders of migrations - users/ and
 * genshin_impact/, which were two databases once. Its `migrations` table
 * records each file by folder and name, and the SQL files are under
 * backend/migrations/{folder}/. The answers still call the folder `database`,
 * the name the admin page and the generated client know it by.
 */

function _migrationDir(string $folder): string
{
    return __DIR__ . '/../../../../migrations/' . $folder;
}

/** Guards against `..` and separators before touching the filesystem. */
function _migrationFilePath(string $folder, string $filename): ?string
{
    if (!in_array($folder, MIGRATION_FOLDERS, true)) {
        return null;
    }
    if ($filename === '' || basename($filename) !== $filename || !str_ends_with($filename, '.sql')) {
        return null;
    }
    $path = _migrationDir($folder) . '/' . $filename;
    return is_file($path) ? $path : null;
}

// ── GET /api/migrations ───────────────────────────────────────────────────────
// Every applied migration of both folders, plus any file on disk that has not
// been applied yet.

$app->get('/api/migrations', function (Request $request, Response $response) {
    $items = [];

    // Read as it is - the table from before the folders shared it too - so
    // looking at the page changes nothing.
    try {
        $recorded = recordedMigrationRows(getDb());
    } catch (\Throwable $e) {
        error_log('[migrations] cannot read the migrations table: ' . $e->getMessage());
        return respondJson($response, []);
    }

    foreach (MIGRATION_FOLDERS as $folder) {
        $applied = [];
        foreach (array_filter($recorded, fn(array $row) => $row['folder'] === $folder) as $row) {
            $path = _migrationFilePath($folder, (string) $row['filename']);
            $applied[$row['filename']] = true;
            $items[] = [
                'id' => $folder . ':' . $row['filename'],
                'database' => $folder,
                'filename' => $row['filename'],
                'applied_at' => $row['applied_at'],
                'status' => $path ? 'applied' : 'applied (file missing)',
                'size' => $path ? filesize($path) : null,
            ];
        }

        foreach (glob(_migrationDir($folder) . '/*.sql') ?: [] as $path) {
            $filename = basename($path);
            if (!isset($applied[$filename])) {
                $items[] = [
                    'id' => $folder . ':' . $filename,
                    'database' => $folder,
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
// Applies every pending migration of both folders, in order, stopping a folder
// at its first failure. This is the FTP deployment's way to run a schema change
// with no shell: upload the new .sql file, then apply it here.
//
// ADMIN only. The migrations themselves are trusted code from the deployment,
// not request input - this endpoint chooses which to run, never what they say.

$app->post('/api/migrations/apply', function (Request $request, Response $response) {
    $databases = [];
    $totalApplied = 0;
    $ok = true;

    try {
        $results = applyAllPendingMigrations(getDb());
    } catch (MigrationOrderException $e) {
        return respondJson($response, [
            'applied' => 0,
            'ok' => false,
            'databases' => [['database' => implode(', ', MIGRATION_FOLDERS), 'applied' => [], 'failed' => null, 'error' => $e->getMessage()]],
        ]);
    } catch (\Throwable $e) {
        return respondJson($response, [
            'applied' => 0,
            'ok' => false,
            'databases' => [['database' => implode(', ', MIGRATION_FOLDERS), 'applied' => [], 'failed' => null, 'error' => 'cannot reach the database: ' . $e->getMessage()]],
        ]);
    }

    foreach ($results as $folder => $result) {
        $totalApplied += count($result['applied']);
        if ($result['failed'] !== null) {
            $ok = false;
        }
        $databases[] = [
            'database' => $folder,
            'applied' => $result['applied'],
            'failed' => $result['failed'],
            'error' => $result['error'],
        ];
    }

    return respondJson($response, ['applied' => $totalApplied, 'ok' => $ok, 'databases' => $databases]);
})->add(responds(MigrationApplyResult::class))->add(requireRole(...ROLES_SYSTEM_WRITE))->add(requireAuth());
