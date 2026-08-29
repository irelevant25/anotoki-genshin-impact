<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * Browsing and editing the asset tree from the admin UI.
 *
 *   GET    /api/files/folders                     folders under assets/, with counts
 *   GET    /api/files?folder=&search=&page=       one page of a folder
 *   POST   /api/files                             upload (creates or replaces)
 *   DELETE /api/files?folder=&name=               move to trash
 *   GET    /api/files/trash                       what is recoverable
 *   POST   /api/files/restore                     put one back
 *
 * Deletes are never destructive: files move to php/storage/trash, which is
 * outside the served tree, and can be restored.
 *
 * Every folder and name is sanitised by the helpers in uploads.php and then
 * checked to still resolve inside the asset root.
 */

const FILES_PAGE_SIZE = 60;

function _trashRoot(): string
{
    return dirname(__DIR__, 4) . '/storage/trash';
}

/** Absolute path for a folder inside assets/, or null if it escapes. */
function _resolveAssetDir(string $folder): ?string
{
    $safe = _assetFolder($folder);
    if ($safe === null) {
        return null;
    }
    $dir = _assetsRoot() . '/' . $safe;
    $root = realpath(_assetsRoot());
    $real = realpath($dir);
    if ($root === false || $real === false || !str_starts_with($real, $root) || !is_dir($real)) {
        return null;
    }
    return $real;
}

/** Every folder under assets/ that directly holds files. */
function _listAssetFolders(string $base, string $prefix = ''): array
{
    $out = [];
    foreach (scandir($base) ?: [] as $entry) {
        if ($entry === '.' || $entry === '..' || str_starts_with($entry, '.')) {
            continue;
        }
        $path = $base . '/' . $entry;
        if (!is_dir($path)) {
            continue;
        }
        $relative = $prefix === '' ? $entry : $prefix . '/' . $entry;
        $files = 0;
        foreach (scandir($path) ?: [] as $child) {
            if ($child !== '.' && $child !== '..' && is_file($path . '/' . $child)) {
                $files++;
            }
        }
        if ($files > 0) {
            $out[] = ['folder' => $relative, 'files' => $files];
        }
        $out = array_merge($out, _listAssetFolders($path, $relative));
    }
    return $out;
}

$app->get('/api/files/folders', function (Request $request, Response $response) {
    $folders = _listAssetFolders(_assetsRoot());
    usort($folders, fn($a, $b) => strcmp($a['folder'], $b['folder']));
    return respondJson($response, $folders);
})->add(requireRole('ADMIN', 'EDITOR'))->add(requireAuth());

$app->get('/api/files', function (Request $request, Response $response) {
    $query = $request->getQueryParams();
    $folder = (string) ($query['folder'] ?? '');
    $dir = _resolveAssetDir($folder);
    if (!$dir) {
        return respondJson($response, ['error' => 'Unknown folder'], 404);
    }

    $search = trim((string) ($query['search'] ?? ''));
    $page = max(1, (int) ($query['page'] ?? 1));

    $items = [];
    foreach (scandir($dir) ?: [] as $entry) {
        if ($entry === '.' || $entry === '..' || !is_file($dir . '/' . $entry)) {
            continue;
        }
        if ($search !== '' && stripos($entry, $search) === false) {
            continue;
        }
        $items[] = $entry;
    }
    sort($items, SORT_NATURAL | SORT_FLAG_CASE);

    $total = count($items);
    $slice = array_slice($items, ($page - 1) * FILES_PAGE_SIZE, FILES_PAGE_SIZE);

    $files = array_map(function (string $name) use ($dir, $folder) {
        $path = $dir . '/' . $name;
        return [
            'name' => $name,
            'extension' => strtolower(pathinfo($name, PATHINFO_EXTENSION)),
            'size' => filesize($path),
            'modified' => date('Y-m-d H:i:s', filemtime($path)),
            // What the site would load it by.
            'url' => 'assets/' . $folder . '/' . $name,
        ];
    }, $slice);

    return respondJson($response, [
        'folder' => $folder,
        'total' => $total,
        'page' => $page,
        'pageSize' => FILES_PAGE_SIZE,
        'files' => $files,
    ]);
})->add(requireRole('ADMIN', 'EDITOR'))->add(requireAuth());

// ── Upload: creates a new file, or replaces one of the same name ──────────────

$app->post('/api/files', function (Request $request, Response $response) {
    $body = $request->getParsedBody() ?? [];
    $folder = (string) ($body['folder'] ?? '');
    $dir = _resolveAssetDir($folder);
    if (!$dir) {
        return respondJson($response, ['error' => 'Unknown folder'], 404);
    }

    $file = $request->getUploadedFiles()['file'] ?? null;
    if (!$file) {
        return respondJson($response, ['error' => 'No file sent under the "file" part'], 400);
    }

    // An explicit name replaces that file; otherwise the uploaded name is used.
    $requested = trim((string) ($body['name'] ?? ''));
    $stem = $requested !== ''
        ? pathinfo($requested, PATHINFO_FILENAME)
        : pathinfo((string) $file->getClientFilename(), PATHINFO_FILENAME);

    $path = _saveAssetUpload($file, $folder, $stem);
    if (!$path) {
        return respondJson($response, ['error' => 'Unsupported or unreadable file'], 415);
    }

    return respondJson($response, ['folder' => $folder, 'path' => $path, 'url' => ltrim(str_replace('../', '', $path), '/')]);
})->add(requireRole('ADMIN', 'EDITOR'))->add(requireAuth());

// ── Delete: moves to trash rather than unlinking ──────────────────────────────

$app->delete('/api/files', function (Request $request, Response $response) {
    $query = $request->getQueryParams();
    $folder = (string) ($query['folder'] ?? '');
    $name = _assetPathSegment((string) ($query['name'] ?? ''));
    $dir = _resolveAssetDir($folder);

    if (!$dir || $name === null || !is_file($dir . '/' . $name)) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    $trashDir = _trashRoot() . '/' . _assetFolder($folder);
    if (!is_dir($trashDir) && !mkdir($trashDir, 0755, true)) {
        return respondJson($response, ['error' => 'Could not prepare the trash folder'], 500);
    }

    // Keep every version: the point of the trash is undoing a mistake.
    $stamped = date('Ymd-His') . '__' . $name;
    if (!rename($dir . '/' . $name, $trashDir . '/' . $stamped)) {
        return respondJson($response, ['error' => 'Could not move the file to trash'], 500);
    }

    return respondJson($response, ['folder' => $folder, 'name' => $name, 'trashed' => $stamped]);
})->add(requireRole('ADMIN', 'EDITOR'))->add(requireAuth());

// ── Trash ─────────────────────────────────────────────────────────────────────

function _listTrash(string $base, string $prefix = ''): array
{
    $out = [];
    foreach (scandir($base) ?: [] as $entry) {
        if ($entry === '.' || $entry === '..') {
            continue;
        }
        $path = $base . '/' . $entry;
        if (is_dir($path)) {
            $out = array_merge($out, _listTrash($path, $prefix === '' ? $entry : $prefix . '/' . $entry));
            continue;
        }
        [$stamp, $name] = array_pad(explode('__', $entry, 2), 2, null);
        $out[] = [
            'folder' => $prefix,
            'trashed' => $entry,
            'name' => $name ?? $entry,
            'deleted_at' => $stamp,
            'size' => filesize($path),
        ];
    }
    return $out;
}

$app->get('/api/files/trash', function (Request $request, Response $response) {
    if (!is_dir(_trashRoot())) {
        return respondJson($response, []);
    }
    $items = _listTrash(_trashRoot());
    usort($items, fn($a, $b) => strcmp($b['trashed'], $a['trashed']));
    return respondJson($response, $items);
})->add(requireRole('ADMIN', 'EDITOR'))->add(requireAuth());

$app->post('/api/files/restore', function (Request $request, Response $response) {
    $body = $request->getParsedBody() ?? [];
    $folder = (string) ($body['folder'] ?? '');
    $trashed = _assetPathSegment((string) ($body['trashed'] ?? ''));
    $safeFolder = _assetFolder($folder);

    if ($safeFolder === null || $trashed === null) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    $source = _trashRoot() . '/' . $safeFolder . '/' . $trashed;
    if (!is_file($source)) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    $dir = _assetsRoot() . '/' . $safeFolder;
    if (!is_dir($dir) && !mkdir($dir, 0755, true)) {
        return respondJson($response, ['error' => 'Could not recreate the folder'], 500);
    }

    [, $name] = array_pad(explode('__', $trashed, 2), 2, null);
    $name = $name ?? $trashed;
    if (is_file($dir . '/' . $name)) {
        return respondJson($response, ['error' => 'A file with that name already exists'], 409);
    }
    if (!rename($source, $dir . '/' . $name)) {
        return respondJson($response, ['error' => 'Could not restore the file'], 500);
    }

    return respondJson($response, ['folder' => $safeFolder, 'name' => $name]);
})->add(requireRole('ADMIN', 'EDITOR'))->add(requireAuth());
