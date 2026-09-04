<?php

/**
 * Taking the originals away once the site is serving the converted files.
 *
 * Every PNG has an AVIF beside it and every OGG has an Opus, and since the
 * references were repointed nothing asks for the originals any more. That is
 * eight gigabytes of files the site no longer reads.
 *
 * Deliberately not automatic. Converting and deleting are different decisions
 * and only one of them can be undone by running it again, so the conversion
 * never removes anything and this is a separate thing somebody chooses to do,
 * having looked at the list.
 *
 * Three guards, and a file has to pass all of them:
 *
 *   1. It is a source format with a converted twin in the same category, under
 *      the same name. No twin, no deletion - those 721 files are the only copy
 *      of themselves.
 *   2. Nothing in the database names it. The repoint moved every reference to
 *      the converted file, but a row written since could name the original, and
 *      "should be fine" is not a reason to skip the check on 40,000 files.
 *   3. It was not deselected in the modal.
 *
 * What passes goes to the same trash the Files page uses rather than being
 * unlinked, and the move is a rename within one volume, so it is instant and
 * needs no room. The space comes back when the trash is emptied, which is its
 * own deliberate act.
 */

/** Sources worth removing once converted, and what the converted file is. */
const CLEANUP_KINDS = [
    'image' => ['extensions' => ['png', 'jpg', 'jpeg', 'webp'], 'target' => 'avif'],
    'audio' => ['extensions' => ['mp3', 'ogg', 'wav', 'm4a'], 'target' => 'opus'],
];

const CLEANUP_PAGE_SIZE = 100;
const CLEANUP_BATCH = 400;
const CLEANUP_SECONDS = 3.0;

function _cleanupQueueFile(): string
{
    return dirname(__DIR__) . '/storage/cache/asset-cleanup-queue.json';
}

/**
 * Every path the database names, as a set.
 *
 * Built by looking at the columns rather than listing them: `icon`,
 * `card_icon`, `audio_english`, `namecard_background` and a dozen others share
 * no naming rule, and a list here would go stale the first time a column was
 * added.
 */
function cleanupReferencedPaths(PDO $pdo): array
{
    static $paths = null;

    if ($paths !== null) {
        return $paths;
    }

    // The entity tables answer through their foreign keys; every other string
    // column in the database is still searched for a path, since settings and
    // translated copy embed them too.
    $paths = [];
    foreach (array_keys(assetFkReferences($pdo)) as $relative) {
        $paths[$relative] = true;
    }

    $columns = $pdo->query("
        SELECT table_name, column_name FROM information_schema.columns
        WHERE table_schema = 'public' AND data_type IN ('character varying', 'text')")->fetchAll(PDO::FETCH_ASSOC);

    foreach ($columns as $column) {
        [$table, $name] = [$column['table_name'], $column['column_name']];
        try {
            if ($pdo->query("SELECT \"$name\" FROM \"$table\" WHERE \"$name\" LIKE '%assets/%' LIMIT 1")->fetchColumn() === false) {
                continue;
            }
        } catch (PDOException) {
            continue;
        }
        foreach ($pdo->query("SELECT DISTINCT \"$name\" AS v FROM \"$table\" WHERE \"$name\" LIKE '%assets/%'") as $row) {
            $paths[preg_replace('#^(\.\./)?assets/#', '', (string) $row['v'])] = true;
        }
    }

    return $paths;
}

/**
 * The files of one kind that could go, newest-looking first.
 *
 * Read out of the catalogue rather than off the disk: the same question asked
 * of 88,000 files on disk is a two-second walk, and asked of the table it is a
 * join. Which is most of why the table exists.
 */
function cleanupCandidates(PDO $pdo, string $kind): array
{
    if (!isset(CLEANUP_KINDS[$kind])) {
        return [];
    }

    $extensions = CLEANUP_KINDS[$kind]['extensions'];
    $target = CLEANUP_KINDS[$kind]['target'];
    $placeholders = implode(',', array_fill(0, count($extensions), '?'));

    $statement = $pdo->prepare("
        SELECT f.id, c.path AS folder, f.name, f.extension, f.size
        FROM files f
        JOIN file_categories c ON c.id = f.category_id
        WHERE f.extension IN ($placeholders)
          AND EXISTS (
              SELECT 1 FROM files g
              WHERE g.category_id = f.category_id AND g.name = f.name AND g.extension = ?
          )
        ORDER BY f.size DESC, c.path, f.name");
    $statement->execute([...$extensions, $target]);

    $referenced = cleanupReferencedPaths($pdo);
    $candidates = [];

    foreach ($statement as $row) {
        $relative = $row['folder'] . '/' . $row['name'] . '.' . $row['extension'];
        // Guard two: a row written since the repoint could name the original.
        if (isset($referenced[$relative])) {
            continue;
        }
        $candidates[] = [
            'id' => (int) $row['id'],
            'path' => $relative,
            'size' => (int) $row['size'],
        ];
    }

    return $candidates;
}

/** One page of them, plus the totals the button needs. */
function cleanupPage(PDO $pdo, string $kind, int $page, int $pageSize = CLEANUP_PAGE_SIZE): array
{
    $candidates = cleanupCandidates($pdo, $kind);
    $bytes = array_sum(array_column($candidates, 'size'));
    $page = max(1, $page);

    return [
        'kind' => $kind,
        'total' => count($candidates),
        'bytes' => $bytes,
        'page' => $page,
        'pageSize' => $pageSize,
        'files' => array_values(array_slice($candidates, ($page - 1) * $pageSize, $pageSize)),
    ];
}

/**
 * Builds the work list, minus whatever was deselected.
 *
 * The client sends what to keep rather than what to delete: the list runs to
 * forty thousand entries and the deselected handful is what a person actually
 * chose. Recomputing the candidates here also means the decision is made
 * against the catalogue as it is now, not as the modal saw it a minute ago.
 */
function cleanupStart(PDO $pdo, string $kind, array $keep): array
{
    $keepSet = array_fill_keys($keep, true);
    $pending = [];
    $bytes = 0;

    foreach (cleanupCandidates($pdo, $kind) as $candidate) {
        if (isset($keepSet[$candidate['path']])) {
            continue;
        }
        $pending[] = ['id' => $candidate['id'], 'path' => $candidate['path']];
        $bytes += $candidate['size'];
    }

    $queue = [
        'kind' => $kind,
        'started_at' => date('Y-m-d H:i:s'),
        'total' => count($pending),
        'bytes' => $bytes,
        'trashed' => 0,
        'failed' => 0,
        'kept' => count($keepSet),
        'failures' => [],
        'pending' => $pending,
    ];

    _cleanupQueueWrite($queue);

    return $queue;
}

function _cleanupQueueRead(): ?array
{
    $file = _cleanupQueueFile();
    if (!is_file($file)) {
        return null;
    }
    $queue = json_decode((string) file_get_contents($file), true);

    return is_array($queue) && isset($queue['pending']) ? $queue : null;
}

function _cleanupQueueWrite(array $queue): void
{
    $file = _cleanupQueueFile();
    if (!is_dir(dirname($file))) {
        @mkdir(dirname($file), 0775, true);
    }
    @file_put_contents($file, json_encode($queue));
}

function cleanupClear(): void
{
    $file = _cleanupQueueFile();
    if (is_file($file)) {
        @unlink($file);
    }
}

/**
 * Moves the next few into the trash, and forgets them in the catalogue.
 *
 * Batched for the same reason the conversion is: forty thousand of anything is
 * longer than a request should be, and a progress bar beats a spinner that
 * might be a timeout.
 */
function cleanupStep(PDO $pdo, int $limit, ?int $by): ?array
{
    $queue = _cleanupQueueRead();
    if ($queue === null) {
        return null;
    }

    @set_time_limit((int) CLEANUP_SECONDS * 6);

    $root = realpath(_assetsRoot());
    $trashRoot = _trashRoot();
    $stamp = date('Ymd-His');
    $limit = max(1, min(2000, $limit));
    $deadline = microtime(true) + CLEANUP_SECONDS;
    $done = 0;
    $removedIds = [];

    while ($queue['pending'] && $done < $limit && microtime(true) < $deadline) {
        $entry = array_shift($queue['pending']);
        $done++;

        $source = $root . '/' . $entry['path'];
        $real = realpath($source);

        if ($real === false || !str_starts_with($real, $root) || !is_file($real)) {
            // Already gone. Forget the row too, or the catalogue keeps naming it.
            $removedIds[] = (int) $entry['id'];
            continue;
        }

        $trashDir = $trashRoot . '/' . dirname($entry['path']);
        if (!is_dir($trashDir) && !@mkdir($trashDir, 0755, true)) {
            $queue['failed']++;
            if (count($queue['failures']) < 25) {
                $queue['failures'][] = $entry['path'];
            }
            continue;
        }

        // Stamped, the way a single delete is: the trash keeps every version so
        // that undoing a mistake is possible even twice over.
        if (@rename($real, $trashDir . '/' . $stamp . '__' . basename($entry['path']))) {
            $queue['trashed']++;
            $removedIds[] = (int) $entry['id'];
        } else {
            $queue['failed']++;
            if (count($queue['failures']) < 25) {
                $queue['failures'][] = $entry['path'];
            }
        }
    }

    if ($removedIds) {
        $placeholders = implode(',', array_fill(0, count($removedIds), '?'));
        $pdo->prepare("DELETE FROM files WHERE id IN ($placeholders)")->execute($removedIds);
    }

    $queue['remaining'] = count($queue['pending']);
    $queue['finished'] = $queue['remaining'] === 0;
    _cleanupQueueWrite($queue);

    if ($queue['finished']) {
        // One entry for the run rather than forty thousand for the files, and
        // this one does carry a name: somebody chose it, unlike a reconcile.
        auditFile($pdo, 0, 'DELETE', [
            'what' => 'cleanup of ' . $queue['kind'] . ' originals',
            'trashed' => $queue['trashed'],
            'kept' => $queue['kept'],
            'failed' => $queue['failed'],
        ], $by);

        assetStatsForget();
        _assetFolderCacheClear();
    }

    return $queue;
}

/** Where a cleanup has got to, without moving anything. */
function cleanupProgress(): ?array
{
    $queue = _cleanupQueueRead();
    if ($queue === null) {
        return null;
    }
    $queue['remaining'] = count($queue['pending']);
    $queue['finished'] = $queue['remaining'] === 0;

    return $queue;
}
