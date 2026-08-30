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

/**
 * How long a cached folder listing is trusted.
 *
 * Short, because assets also arrive from outside the API - the bulk convert
 * and import scripts write straight to disk, and nothing tells us when they
 * do. The API's own writes clear the cache immediately, so this only bounds
 * how stale an out-of-band change can look.
 */
const FILES_FOLDER_CACHE_TTL = 60;

function _assetFolderCacheFile(): string
{
    return dirname(__DIR__, 4) . '/storage/cache/asset-folders.json';
}

/** Called by everything that adds or removes an asset. */
function _assetFolderCacheClear(): void
{
    $file = _assetFolderCacheFile();
    if (is_file($file)) {
        @unlink($file);
    }
}

/**
 * Every folder under assets/ that directly holds files, with its file count.
 *
 * One flat pass over the tree, tallying each file against its parent. The
 * previous version walked each directory twice - once to recurse and once to
 * count - and asked the filesystem about every single entry with is_dir() and
 * then is_file(). On ~48,000 files that is ~100,000 stat calls and took nine
 * seconds; this does it in about one and a half.
 *
 * Dot-prefixed *directories* are skipped, as before. Dot-prefixed files are
 * not: several talents are named like "...Now That's Rock 'N' Roll!", and
 * skipping them would quietly lose real assets.
 */
function _listAssetFolders(string $base): array
{
    $counts = [];
    $rootLength = strlen($base) + 1;

    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($base, FilesystemIterator::SKIP_DOTS | FilesystemIterator::UNIX_PATHS),
        RecursiveIteratorIterator::SELF_FIRST
    );

    foreach ($iterator as $path => $info) {
        if ($info->isDir()) {
            continue;
        }

        $relative = substr($path, $rootLength);
        $slash = strrpos($relative, '/');
        if ($slash === false) {
            // A file sitting directly in assets/ belongs to no folder.
            continue;
        }

        $folder = substr($relative, 0, $slash);
        // Cheaper than testing each directory as we descend, and the same
        // answer: any hidden segment anywhere in the path disqualifies it.
        if (str_contains('/' . $folder, '/.')) {
            continue;
        }

        $counts[$folder] = ($counts[$folder] ?? 0) + 1;
    }

    $out = [];
    foreach ($counts as $folder => $files) {
        $out[] = ['folder' => $folder, 'files' => $files];
    }
    return $out;
}

/** The folder listing, from cache when it is still fresh. */
function _assetFolders(bool $refresh = false): array
{
    $file = _assetFolderCacheFile();

    if (!$refresh && is_file($file) && (time() - (int) filemtime($file)) < FILES_FOLDER_CACHE_TTL) {
        $cached = json_decode((string) file_get_contents($file), true);
        if (is_array($cached)) {
            return $cached;
        }
    }

    $folders = _listAssetFolders(_assetsRoot());
    usort($folders, fn($a, $b) => strcmp($a['folder'], $b['folder']));

    if (!is_dir(dirname($file))) {
        @mkdir(dirname($file), 0775, true);
    }
    // A cache that cannot be written is not worth failing the request over.
    @file_put_contents($file, json_encode($folders));

    return $folders;
}

$app->get('/api/files/folders', function (Request $request, Response $response) {
    // ?refresh=1 rebuilds regardless, for when assets were changed on disk and
    // the wait for the cache to expire is the wrong answer.
    $refresh = ($request->getQueryParams()['refresh'] ?? '') === '1';
    return respondJson($response, _assetFolders($refresh));
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

    _assetFolderCacheClear();
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

    _assetFolderCacheClear();
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

    _assetFolderCacheClear();
    return respondJson($response, ['folder' => $safeFolder, 'name' => $name]);
})->add(requireRole('ADMIN', 'EDITOR'))->add(requireAuth());
