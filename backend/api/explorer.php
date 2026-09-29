<?php

/**
 * The real asset tree on disk, snapshotted so nobody has to walk it twice.
 *
 * Walking fifty thousand files and asking the filesystem each one's size takes a
 * second or two - long enough that it must not happen on every page load. So it
 * happens once, into a snapshot cached beside the other asset caches, and both
 * the Files Explorer and the Files page's "on disk vs in the database" figures
 * read from that. A re-scan is the only thing that walks the disk again, and it
 * refreshes the one snapshot both of them share.
 *
 * The snapshot also remembers what it held last time, so a re-scan can say how
 * many files are new since - which is the whole point of scanning after a batch
 * has been dropped in over FTP.
 */

function explorerSnapshotFile(): string
{
    return dirname(__DIR__) . '/storage/cache/disk-snapshot.json';
}

/** Walks the asset tree once, returning relpath => {size, modified}. */
function _explorerWalk(): array
{
    $root = realpath(_assetsRoot());
    if ($root === false) {
        return [];
    }
    $rootUnix = str_replace('\\', '/', $root);

    $files = [];
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS | FilesystemIterator::UNIX_PATHS),
        RecursiveIteratorIterator::SELF_FIRST
    );

    foreach ($iterator as $path => $info) {
        if ($info->isDir()) {
            continue;
        }
        $relative = substr(str_replace('\\', '/', $path), strlen($rootUnix) + 1);
        // Skip dotfiles anywhere in the path, same as the reconcile sweep.
        if (str_contains('/' . $relative, '/.')) {
            continue;
        }
        $files[$relative] = [
            'size' => $info->getSize(),
            'modified' => date('Y-m-d H:i:s', $info->getMTime()),
        ];
    }

    return $files;
}

/**
 * The snapshot, from cache unless a re-scan is asked for.
 *
 * A re-scan diffs the fresh walk against the one before it to work out what is
 * new, and keeps that list until the next re-scan replaces it.
 *
 * @return array{scanned_at:string, previous_scanned_at:?string, files:array<string,array{size:int,modified:string}>, new:array<int,string>}
 */
function explorerSnapshot(bool $refresh = false): array
{
    $file = explorerSnapshotFile();

    if (!$refresh && is_file($file)) {
        $cached = json_decode((string) file_get_contents($file), true);
        if (is_array($cached) && isset($cached['files'])) {
            return $cached;
        }
    }

    $previous = [];
    $previousAt = null;
    if (is_file($file)) {
        $old = json_decode((string) file_get_contents($file), true);
        if (is_array($old) && isset($old['files'])) {
            $previous = $old['files'];
            $previousAt = $old['scanned_at'] ?? null;
        }
    }

    $files = _explorerWalk();

    // What is new: present now, absent last time. Meaningless on the first scan
    // (there is no "last time"), so it is empty until there is one to compare to.
    $new = $previous ? array_values(array_diff(array_keys($files), array_keys($previous))) : [];
    sort($new, SORT_NATURAL | SORT_FLAG_CASE);

    $snapshot = [
        'scanned_at' => date('Y-m-d H:i:s'),
        'previous_scanned_at' => $previousAt,
        'files' => $files,
        'new' => $new,
    ];

    if (!is_dir(dirname($file))) {
        @mkdir(dirname($file), 0775, true);
    }
    @file_put_contents($file, json_encode($snapshot));

    return $snapshot;
}

/** Whether a snapshot has ever been taken. */
function explorerHasSnapshot(): bool
{
    return is_file(explorerSnapshotFile());
}

/**
 * The Files page's "on disk vs in the database" figures, from the shared
 * snapshot rather than a fresh walk. The DB half is a live query, so the numbers
 * track uploads and deletes immediately; only the disk half waits for a re-scan.
 */
function catalogueDriftFromSnapshot(PDO $pdo, bool $refresh = false): array
{
    $snapshot = explorerSnapshot($refresh);
    $disk = $snapshot['files'];
    $categories = catalogueCategories($pdo);

    $known = [];
    foreach ($pdo->query('SELECT c.path, f.name, f.extension FROM files f JOIN file_categories c ON c.id = f.category_id') as $row) {
        $known[$row['path'] . '/' . $row['name'] . '.' . $row['extension']] = true;
    }

    $catalogued = 0;
    $uncatalogued = 0;
    $unfiled = 0;

    foreach ($disk as $relative => $_meta) {
        if (isset($known[$relative])) {
            $catalogued++;
            continue;
        }
        $uncatalogued++;
        if (catalogueCategoryFor($categories, dirname($relative)) === null) {
            $unfiled++;
        }
    }

    $missing = 0;
    foreach ($known as $relative => $_true) {
        if (!isset($disk[$relative])) {
            $missing++;
        }
    }

    return [
        'on_disk' => count($disk),
        'catalogued' => $catalogued,
        'uncatalogued' => $uncatalogued,
        'unfiled' => $unfiled,
        'missing' => $missing,
    ];
}

/** One file entry in the shape the Explorer draws with. */
function _explorerFileEntry(string $relative, array $meta): array
{
    $slash = strrpos($relative, '/');
    $folder = $slash === false ? '' : substr($relative, 0, $slash);
    $name = $slash === false ? $relative : substr($relative, $slash + 1);

    return [
        'name' => $name,
        'path' => $relative,
        'folder' => $folder,
        'extension' => strtolower(pathinfo($name, PATHINFO_EXTENSION)),
        'size' => (int) ($meta['size'] ?? 0),
        'modified' => (string) ($meta['modified'] ?? ''),
        'url' => '/api/files/raw?folder=' . rawurlencode($folder) . '&name=' . rawurlencode($name),
    ];
}

const EXPLORER_PAGE_SIZE = 120;

/**
 * One folder's worth of the tree: its immediate sub-folders and its own files.
 *
 * With a search term it works like the search box in a file manager instead -
 * every file under here whose name matches, flat, folders set aside.
 */
function explorerListing(array $snapshot, string $path, string $search, int $page): array
{
    $path = trim(str_replace('\\', '/', $path), '/');
    $prefix = $path === '' ? '' : $path . '/';
    $search = trim($search);
    $page = max(1, $page);

    $folders = [];
    $files = [];

    foreach ($snapshot['files'] as $relative => $meta) {
        if ($prefix !== '' && !str_starts_with($relative, $prefix)) {
            continue;
        }
        $rest = substr($relative, strlen($prefix));

        if ($search !== '') {
            // Recursive search under here: any descendant file that matches.
            if (stripos(basename($rest), $search) !== false) {
                $files[] = _explorerFileEntry($relative, $meta);
            }
            continue;
        }

        $slash = strpos($rest, '/');
        if ($slash === false) {
            $files[] = _explorerFileEntry($relative, $meta);
        } else {
            $sub = substr($rest, 0, $slash);
            $folders[$sub] = ($folders[$sub] ?? 0) + 1;
        }
    }

    usort($files, fn($a, $b) => strnatcasecmp($a['name'], $b['name']));

    $folderList = [];
    foreach ($folders as $name => $count) {
        $folderList[] = ['name' => $name, 'path' => ($prefix . $name), 'files' => $count];
    }
    usort($folderList, fn($a, $b) => strnatcasecmp($a['name'], $b['name']));

    $total = count($files);
    $slice = array_slice($files, ($page - 1) * EXPLORER_PAGE_SIZE, EXPLORER_PAGE_SIZE);

    return [
        'path' => $path,
        'search' => $search,
        'folders' => $search === '' ? $folderList : [],
        'files' => $slice,
        'total' => $total,
        'page' => $page,
        'pageSize' => EXPLORER_PAGE_SIZE,
    ];
}

/** The files new since the previous scan, in the same shape, paginated. */
function explorerNewListing(array $snapshot, string $search, int $page): array
{
    $search = trim($search);
    $page = max(1, $page);

    $files = [];
    foreach ($snapshot['new'] ?? [] as $relative) {
        if ($search !== '' && stripos(basename($relative), $search) === false) {
            continue;
        }
        $files[] = _explorerFileEntry($relative, $snapshot['files'][$relative] ?? []);
    }
    usort($files, fn($a, $b) => strnatcasecmp($a['path'], $b['path']));

    $total = count($files);
    $slice = array_slice($files, ($page - 1) * EXPLORER_PAGE_SIZE, EXPLORER_PAGE_SIZE);

    return [
        'path' => '',
        'search' => $search,
        'folders' => [],
        'files' => $slice,
        'total' => $total,
        'page' => $page,
        'pageSize' => EXPLORER_PAGE_SIZE,
    ];
}

/** The header line: when it was scanned, how much it holds, how much is new. */
function explorerStatus(array $snapshot): array
{
    return [
        'scanned_at' => $snapshot['scanned_at'] ?? null,
        'previous_scanned_at' => $snapshot['previous_scanned_at'] ?? null,
        'total' => count($snapshot['files'] ?? []),
        'new_count' => count($snapshot['new'] ?? []),
    ];
}
