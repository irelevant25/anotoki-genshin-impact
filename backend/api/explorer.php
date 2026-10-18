<?php

/**
 * The real asset tree on disk, snapshotted so nobody has to walk it twice - for
 * the Files page's "on disk vs in the database" figures.
 *
 * Walking fifty thousand files and asking the filesystem each one's size takes a
 * second or two - long enough that it must not happen on every page load. So it
 * happens once, into a snapshot cached beside the other asset caches, and the
 * figures read from that; a re-scan is the only thing that walks the disk again.
 *
 * The snapshot also remembers what it held last time, so a re-scan can say how
 * many files are new since - which is the whole point of scanning after a batch
 * has been dropped in over FTP.
 *
 * The admin panel's file explorer, which browsed the tree from this snapshot,
 * is the anotoki library's since 0.4.1 (api/admin_tools.php): it keeps a
 * snapshot of its own, in its own folder, taken by its own Rescan.
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
    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS | FilesystemIterator::UNIX_PATHS), RecursiveIteratorIterator::SELF_FIRST);

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
