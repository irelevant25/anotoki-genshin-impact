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
})->add(responds(AssetFolder::class, list: true))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

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

    // The catalogue row for each file on this page, so the listing can offer to
    // move it. Only for the page being shown - joining the whole folder would
    // be 76,000 rows for the voice overs.
    $catalogue = _assetCatalogueFor(genshinDb(), $folder, $slice);

    $files = array_map(function (string $name) use ($dir, $folder, $catalogue) {
        $path = $dir . '/' . $name;
        $row = $catalogue[$name] ?? null;

        return [
            'name' => $name,
            'extension' => strtolower(pathinfo($name, PATHINFO_EXTENSION)),
            'size' => filesize($path),
            'modified' => date('Y-m-d H:i:s', filemtime($path)),
            // What the site would load it by.
            // Read back through the API rather than from the served asset
            // path, so a file uploaded a moment ago is visible now - see
            // /api/files/raw.
            'url' => '/api/files/raw?folder=' . rawurlencode($folder) . '&name=' . rawurlencode($name),
            // Null where the catalogue has not caught up - the check button on
            // the panel above is what closes that.
            'file_id' => $row ? (int) $row['id'] : null,
            'category' => $row['code'] ?? null,
        ];
    }, $slice);

    return respondJson($response, [
        'folder' => $folder,
        'total' => $total,
        'page' => $page,
        'pageSize' => FILES_PAGE_SIZE,
        'files' => $files,
    ]);
})->add(responds(AssetFilePage::class))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

/**
 * The catalogue rows for named files in one folder, keyed by file name.
 *
 * The folder a file is browsed in is not always its category's folder - a voice
 * over is browsed at `character/voice_overs/Aino/combat/en` and catalogued
 * under `character/voice_overs` with the rest of that path in its name - so the
 * lookup is by full relative path rather than by folder and base name.
 */
function _assetCatalogueFor(PDO $pdo, string $folder, array $names): array
{
    if (!$names) {
        return [];
    }

    $paths = array_map(fn(string $name) => $folder . '/' . $name, $names);
    $placeholders = implode(',', array_fill(0, count($paths), '?'));

    $statement = $pdo->prepare("
        SELECT f.id, c.code, c.path || '/' || f.name ||
               CASE WHEN f.extension = '' THEN '' ELSE '.' || f.extension END AS relative
        FROM files f JOIN file_categories c ON c.id = f.category_id
        WHERE c.path || '/' || f.name ||
              CASE WHEN f.extension = '' THEN '' ELSE '.' || f.extension END IN ($placeholders)");
    $statement->execute($paths);

    $found = [];
    foreach ($statement as $row) {
        $found[basename($row['relative'])] = $row;
    }

    return $found;
}

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

    // null: this page browses the whole tree, voice overs included, so it
    // takes anything on the allowlist rather than images alone.
    $path = _saveAssetUpload($file, $folder, $stem, null);
    if (!$path) {
        return respondJson($response, ['error' => 'Unsupported or unreadable file'], 415);
    }

    // Without this the file is on disk and nowhere else, so the listing shows
    // it as uncatalogued and offers no category to move it to - which is what
    // uploading or replacing anything through this page used to do.
    $user = $request->getAttribute('user');
    catalogueUploadedStem(genshinDb(), $folder, $stem, isset($user['id']) ? (int) $user['id'] : null);

    _assetFolderCacheClear();
    return respondJson($response, ['folder' => $folder, 'path' => $path, 'url' => ltrim(str_replace('../', '', $path), '/')]);
})->add(responds(AssetUploadResult::class))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

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
})->add(responds(AssetTrashResult::class))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

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
})->add(responds(TrashedFile::class, list: true))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

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
})->add(responds(AssetRestoreResult::class))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

// ── What is in the tree, and converting what is missing ───────────────────────
//
// The survey walks ~65,000 files, so it is cached for a day. ?refresh=1 rebuilds
// it, for when assets were changed on disk and waiting out the cache is the
// wrong answer - the same escape hatch the folder listing has.

$app->get('/api/files/stats', function (Request $request, Response $response) {
    // Both spellings: the generated client sends a boolean as "true",
    // and a hand-typed URL says 1.
    $refresh = in_array((string) ($request->getQueryParams()['refresh'] ?? ''), ['1', 'true'], true);
    $stats = assetStats($refresh);

    return respondJson($response, [
        'generated_at' => $stats['generated_at'],
        'age' => assetStatsAge() ?? 0,
        'total_files' => $stats['total_files'],
        'total_bytes' => $stats['total_bytes'],
        'formats' => $stats['formats'],
        // `pending` is the list of paths behind the counts. It is what the
        // queue is built from and it runs to thousands of entries, so it stays
        // in the cache file rather than travelling to a page that shows counts.
        // `reclaimable` is the exact number the cleanup modal would list -
        // originals with a converted twin that nothing in the database still
        // names. The delete button is gated on this, not on `sources`, so it
        // never offers to delete originals and then opens on an empty list.
        'images' => $stats['images'] + [
            'can_convert' => mediaCanWriteAvif(),
            'reclaimable' => cleanupCandidateCount(genshinDb(), 'image'),
        ],
        'audio' => $stats['audio'] + [
            'can_convert' => mediaCanWriteOpus(),
            'reclaimable' => cleanupCandidateCount(genshinDb(), 'audio'),
        ],
        // Its own walk rather than part of the cached survey: this is the one
        // number that is only useful when it is current, since the whole point
        // of it is noticing that something turned up outside the API.
        'catalogue' => catalogueCounts(genshinDb()),
    ]);
})->add(responds(AssetStats::class))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

/**
 * Looks for files the catalogue has not heard of, and adopts them.
 *
 * The same sweep `php assets.php --reconcile --apply` runs. Files arrive over
 * FTP and get deleted by hand, so the table drifts on its own and this is what
 * puts it back - adopting strays, moving anything in no category into
 * `unfiled`, and reporting rather than deleting rows whose file has gone.
 */
// ── Serving one file back ─────────────────────────────────────────────────────
//
// The Files page used to point its previews at `assets/...` and let whatever
// serves the site hand them over. In production that is the web server and it
// works. In development it is `ng serve`, which resolves its asset glob once at
// startup and never looks again - so a file uploaded a minute ago is a 404
// until the dev server is restarted, and the page that exists to show you what
// is on disk could not show you what you had just put there.
//
// Reading it here instead means the preview comes from the same place the
// listing does. No auth: these bytes are already served publicly at their
// asset path, so requiring a token would protect nothing and `<img src>`
// cannot send one anyway.

const FILE_MIME = [
    'avif' => 'image/avif', 'png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg',
    'webp' => 'image/webp', 'gif' => 'image/gif', 'svg' => 'image/svg+xml',
    'opus' => 'audio/ogg', 'ogg' => 'audio/ogg', 'mp3' => 'audio/mpeg', 'wav' => 'audio/wav', 'm4a' => 'audio/mp4',
];

$app->get('/api/files/raw', function (Request $request, Response $response) {
    $query = $request->getQueryParams();
    $dir = _resolveAssetDir((string) ($query['folder'] ?? ''));
    $name = _assetPathSegment((string) ($query['name'] ?? ''));

    if ($dir === null || $name === null) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    // Resolved rather than joined: the segment is already sanitised, and this
    // is the check that it still lands inside the folder it claims to.
    $path = realpath($dir . '/' . $name);
    if ($path === false || !is_file($path) || !str_starts_with($path, $dir)) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));
    $stream = fopen($path, 'rb');
    if ($stream === false) {
        return respondJson($response, ['error' => 'Not readable'], 500);
    }

    return $response
        ->withHeader('Content-Type', FILE_MIME[$extension] ?? 'application/octet-stream')
        ->withHeader('Content-Length', (string) filesize($path))
        // The name is the version: a replaced file keeps its name, so this is
        // deliberately short rather than immutable.
        ->withHeader('Cache-Control', 'private, max-age=30')
        // An SVG is a document, not a picture, and one served as image/svg+xml
        // runs any script inside it against this origin the moment somebody
        // opens the URL directly. Nothing can upload one - svg is not on the
        // allowlist - but files also arrive over FTP and get adopted by the
        // reconcile sweep, and this route needs no sign-in.
        //
        // The sandbox is what makes that inert: a document served with it runs
        // no script. An <img> is unaffected, because an image never executes
        // one anyway, so the previews this route exists for still work. Not
        // Content-Disposition: attachment, which would fix it by breaking them.
        ->withHeader('Content-Security-Policy', "sandbox; default-src 'none'")
        // And do not let a mislabelled file be sniffed into something else.
        ->withHeader('X-Content-Type-Options', 'nosniff')
        ->withBody(new \Slim\Psr7\Stream($stream));
})->add(responds(RawFile::class));

// ── Recorded but gone ─────────────────────────────────────────────────────────
//
// The catalogue says there is a file and the disk disagrees. Listing them is
// the only way to find out which, and forgetting them is the only way to make
// the count go down - reconcile deliberately does not, because a file that has
// vanished is news rather than tidying.

$app->get('/api/files/missing', function (Request $request, Response $response) {
    $pdo = genshinDb();
    $compare = catalogueCompare($pdo);

    if (!$compare['vanished']) {
        return respondJson($response, []);
    }

    // Which entity columns still name each one, so the modal can say what
    // forgetting it would clear.
    $used = [];
    foreach (assetColumnMap() as $table => $columns) {
        foreach (array_keys($columns) as $field) {
            foreach ($pdo->query("SELECT \"{$field}_file_id\" AS id FROM \"$table\" WHERE \"{$field}_file_id\" IS NOT NULL") as $row) {
                $used[(int) $row['id']] = ($used[(int) $row['id']] ?? 0) + 1;
            }
        }
    }

    $rows = $pdo->query(
        "SELECT f.id, f.name, f.extension, f.size, f.modified_at, c.code AS category, c.path
           FROM files f JOIN file_categories c ON c.id = f.category_id
          ORDER BY c.path, f.name"
    )->fetchAll(PDO::FETCH_ASSOC);

    $gone = array_flip($compare['vanished']);
    $items = [];
    foreach ($rows as $row) {
        $suffix = $row['extension'] === '' ? '' : '.' . $row['extension'];
        $relative = $row['path'] . '/' . $row['name'] . $suffix;
        if (!isset($gone[$relative])) {
            continue;
        }
        $items[] = [
            'id' => (int) $row['id'],
            'path' => $relative,
            'name' => $row['name'],
            'extension' => $row['extension'],
            'category' => $row['category'],
            'size' => $row['size'] === null ? null : (int) $row['size'],
            'modified_at' => $row['modified_at'],
            'used_by' => $used[(int) $row['id']] ?? 0,
        ];
    }

    return respondJson($response, $items);
})->add(responds(MissingFile::class, list: true))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

// DELETE /api/files/missing            forget every row whose file is gone
// DELETE /api/files/missing?id=12,13   forget only these
$app->delete('/api/files/missing', function (Request $request, Response $response) {
    $pdo = genshinDb();
    $user = $request->getAttribute('user');
    $wanted = trim((string) ($request->getQueryParams()['id'] ?? ''));

    $compare = catalogueCompare($pdo);
    if (!$compare['vanished']) {
        return respondJson($response, ['forgotten' => 0, 'unlinked' => 0]);
    }

    $gone = array_flip($compare['vanished']);
    $ids = [];
    $rows = $pdo->query(
        "SELECT f.id, f.name, f.extension, c.path
           FROM files f JOIN file_categories c ON c.id = f.category_id"
    );
    foreach ($rows as $row) {
        $suffix = $row['extension'] === '' ? '' : '.' . $row['extension'];
        if (isset($gone[$row['path'] . '/' . $row['name'] . $suffix])) {
            $ids[] = (int) $row['id'];
        }
    }

    if ($wanted !== '') {
        $only = array_map('intval', array_filter(explode(',', $wanted), 'strlen'));
        $ids = array_values(array_intersect($ids, $only));
    }

    if (!$ids) {
        return respondJson($response, ['forgotten' => 0, 'unlinked' => 0]);
    }

    $pdo->beginTransaction();

    // Clear the entity columns first: the foreign key is ON DELETE SET NULL, so
    // this is only to be able to say how many rows lost a picture.
    $unlinked = 0;
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    foreach (assetColumnMap() as $table => $columns) {
        foreach (array_keys($columns) as $field) {
            $statement = $pdo->prepare("UPDATE \"$table\" SET \"{$field}_file_id\" = NULL WHERE \"{$field}_file_id\" IN ($placeholders)");
            $statement->execute($ids);
            $unlinked += $statement->rowCount();
        }
    }

    foreach ($ids as $id) {
        $pdo->prepare('DELETE FROM files WHERE id = ?')->execute([$id]);
    }

    auditFile($pdo, 0, 'DELETE', ['forgotten' => count($ids), 'unlinked' => $unlinked], isset($user['id']) ? (int) $user['id'] : null);
    $pdo->commit();

    assetStatsForget();
    return respondJson($response, ['forgotten' => count($ids), 'unlinked' => $unlinked]);
})->add(responds(MissingForgotten::class))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

// ── Emptying the trash ────────────────────────────────────────────────────────
//
// The one destructive thing this file does. Everything else moves files about.

$app->delete('/api/files/trash', function (Request $request, Response $response) {
    $root = _trashRoot();
    if (!is_dir($root)) {
        return respondJson($response, ['deleted' => 0, 'bytes' => 0, 'failed' => 0]);
    }

    $wanted = trim((string) ($request->getQueryParams()['trashed'] ?? ''));
    $deleted = 0;
    $bytes = 0;
    $failed = 0;

    foreach (_listTrash($root) as $entry) {
        if ($wanted !== '' && $entry['trashed'] !== $wanted) {
            continue;
        }
        $safeFolder = _assetFolder($entry['folder']);
        $safeName = _assetPathSegment($entry['trashed']);
        if ($safeFolder === null || $safeName === null) {
            $failed++;
            continue;
        }
        $path = $root . '/' . $safeFolder . '/' . $safeName;
        if (!is_file($path)) {
            $failed++;
            continue;
        }
        $size = (int) filesize($path);
        if (@unlink($path)) {
            $deleted++;
            $bytes += $size;
        } else {
            $failed++;
        }
    }

    return respondJson($response, ['deleted' => $deleted, 'bytes' => $bytes, 'failed' => $failed]);
})->add(responds(TrashEmptied::class))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

$app->post('/api/files/reconcile', function (Request $request, Response $response) {
    $result = catalogueReconcile(genshinDb());

    if (isset($result['error'])) {
        return respondJson($response, ['error' => $result['error']], 500);
    }

    assetStatsForget();
    _assetFolderCacheClear();

    return respondJson($response, $result);
})->add(responds(AssetReconcileResult::class))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

/**
 * Converts a batch of what is missing, and says where the job has got to.
 *
 * `restart` builds the work list; without it the next batch is taken off the
 * list already there. Splitting it this way is what lets a page of seven
 * thousand files draw a progress bar instead of hanging on one request.
 */
$app->post('/api/files/convert', function (Request $request, Response $response) {
    $body = $request->getParsedBody() ?? [];

    if (!empty($body['restart'])) {
        assetConvertStart();
    }

    $limit = (int) ($body['limit'] ?? ASSET_CONVERT_BATCH);
    $progress = assetConvertStep($limit);

    if ($progress === null) {
        return respondJson($response, ['error' => 'Nothing is being converted - send restart to begin'], 409);
    }

    return respondJson($response, _assetProgressBody($progress));
})->add(responds(AssetConvertProgress::class))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

/** Where a conversion started elsewhere has got to, without converting more. */
$app->get('/api/files/convert', function (Request $request, Response $response) {
    $progress = assetConvertProgress();

    if ($progress === null) {
        return respondJson($response, ['error' => 'Nothing is being converted'], 404);
    }

    return respondJson($response, _assetProgressBody($progress));
})->add(responds(AssetConvertProgress::class))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

/** The queue minus its work list, which is thousands of paths nobody reads. */
function _assetProgressBody(array $queue): array
{
    return [
        'started_at' => $queue['started_at'],
        'total' => $queue['total'],
        'converted' => $queue['converted'],
        'failed' => $queue['failed'],
        'skipped' => $queue['skipped'],
        'remaining' => $queue['remaining'] ?? count($queue['pending']),
        'finished' => $queue['finished'] ?? false,
        'blocked' => $queue['blocked'],
        'failures' => $queue['failures'],
    ];
}

// ── Taking the originals away ────────────────────────────────────────────────
//
// Never automatic, and never without the two guards in asset_cleanup.php: a
// converted twin has to exist, and nothing in the database may still name the
// file. The modal pages through what would go so a person can take things out
// of it before pressing anything.

$app->get('/api/files/cleanup', function (Request $request, Response $response) {
    $query = $request->getQueryParams();
    $kind = (string) ($query['kind'] ?? 'image');

    if (!isset(CLEANUP_KINDS[$kind])) {
        return respondJson($response, ['error' => 'Unknown kind'], 422);
    }

    return respondJson($response, cleanupPage(genshinDb(), $kind, (int) ($query['page'] ?? 1)));
})->add(responds(AssetCleanupPage::class))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

$app->post('/api/files/cleanup', function (Request $request, Response $response) {
    $body = $request->getParsedBody() ?? [];
    $pdo = genshinDb();

    if (!empty($body['restart'])) {
        $kind = (string) ($body['kind'] ?? '');
        if (!isset(CLEANUP_KINDS[$kind])) {
            return respondJson($response, ['error' => 'Unknown kind'], 422);
        }
        // What to keep, not what to delete: the list runs to forty thousand and
        // the deselected handful is what somebody actually chose.
        cleanupStart($pdo, $kind, array_map('strval', (array) ($body['keep'] ?? [])));
    }

    // Named, unlike a reconcile: somebody chose this one.
    $user = $request->getAttribute('user');
    $progress = cleanupStep($pdo, (int) ($body['limit'] ?? CLEANUP_BATCH), isset($user['id']) ? (int) $user['id'] : null);

    if ($progress === null) {
        return respondJson($response, ['error' => 'Nothing to clean up - send restart to begin'], 409);
    }

    return respondJson($response, _cleanupBody($progress));
})->add(responds(AssetCleanupProgress::class))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

$app->get('/api/files/cleanup/progress', function (Request $request, Response $response) {
    $progress = cleanupProgress();

    if ($progress === null) {
        return respondJson($response, ['error' => 'Nothing is being cleaned up'], 404);
    }

    return respondJson($response, _cleanupBody($progress));
})->add(responds(AssetCleanupProgress::class))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

/** The queue minus its work list, which is tens of thousands of paths. */
function _cleanupBody(array $queue): array
{
    return [
        'kind' => $queue['kind'],
        'started_at' => $queue['started_at'],
        'total' => $queue['total'],
        'bytes' => $queue['bytes'],
        'trashed' => $queue['trashed'],
        'failed' => $queue['failed'],
        'kept' => $queue['kept'],
        'remaining' => $queue['remaining'] ?? count($queue['pending']),
        'finished' => $queue['finished'] ?? false,
        'failures' => $queue['failures'],
    ];
}
