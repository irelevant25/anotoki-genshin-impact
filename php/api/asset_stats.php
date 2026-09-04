<?php

/**
 * What is in the asset tree, and what is missing from it.
 *
 * The site serves AVIF and Opus. Everything uploaded through the API is
 * re-encoded on the way in, but the tree also holds tens of thousands of files
 * that arrived before that was true, or were dropped in by the one-off scripts
 * in /formats-converters. This is the survey that says which of them still have
 * no converted twin, and the queue that works through them.
 *
 * Two things are counted and they are not the same job:
 *
 *   missing     a source with no converted file beside it. This is work: the
 *               encoder can make the missing half.
 *   converted   an AVIF or Opus whose source is gone - usually because the
 *   only        opus script was run with DELETE_ORIGINAL on. Nothing to fix.
 *               A PNG decoded back out of an AVIF is not the original, it is a
 *               bigger copy of the lossy one, so this is reported and left.
 *
 * The whole survey is one pass over ~65,000 files and takes a couple of
 * seconds, so it is cached for a day and rebuilt on request.
 */

/** How long a survey is trusted before it is walked again. */
const ASSET_STATS_TTL = 86400;

/** Raster sources that should have an AVIF beside them. */
const ASSET_TO_AVIF = ['png', 'jpg', 'jpeg', 'webp'];

/** Audio sources that should have an Opus beside them. */
const ASSET_TO_OPUS = ['mp3', 'ogg', 'wav', 'm4a'];

/** Files one convert request will attempt before answering, and the ceiling. */
const ASSET_CONVERT_BATCH = 24;
const ASSET_CONVERT_BATCH_MAX = 250;

/**
 * How long a convert request keeps going before answering with what it has.
 *
 * A batch is bounded by time as well as by count because the two media are
 * nothing like each other: an AVIF is tens of milliseconds and an ffmpeg
 * re-encode of a voice line can be a second or more. Counting alone would make
 * one kind of batch instant and the other a timeout.
 *
 * Short, because this is also how often the progress bar can move. At ten
 * seconds a batch the bar sat still long enough to look broken; the extra
 * round trips cost nothing next to the encoding they carry.
 */
const ASSET_CONVERT_SECONDS = 3.0;

/** Failures kept for the report. Enough to see a pattern, not a log file. */
const ASSET_FAILURE_SAMPLE = 25;

function _assetCacheDir(): string
{
    return dirname(__DIR__) . '/storage/cache';
}

function _assetStatsFile(): string
{
    return _assetCacheDir() . '/asset-stats.json';
}

function _assetQueueFile(): string
{
    return _assetCacheDir() . '/asset-convert-queue.json';
}

/**
 * The name two spellings of the same asset share.
 *
 * The tree holds both the display name and an upper-snake spelling of it -
 * `Adventurer's Bandana.avif` sits beside `ADVENTURERS_BANDANA.png`, and they
 * are the same picture - because the front end resolves art by trying both in
 * turn (materialUpperSnake in material-icon.directive.ts). Pairing on the raw
 * stem would report several thousand images as unconverted and then convert
 * them a second time under the other name.
 *
 * Letters and digits are kept whatever alphabet they are in: voice lines and
 * talents are named in Japanese, Chinese and Korean, and folding those to an
 * empty key would file every one of them under the same group.
 */
function assetNameKey(string $stem): string
{
    // Apostrophes and hyphens vanish rather than becoming separators, which is
    // what makes "Adventurer's" and "ADVENTURERS" the same word.
    $stem = preg_replace('/[\'’"\-]/u', '', $stem);
    $stem = mb_strtoupper($stem, 'UTF-8');
    $stem = preg_replace('/[^\p{L}\p{N}]+/u', '_', $stem);

    return trim($stem, '_');
}

/** The converted extension a source should have beside it, or null. */
function assetTargetExtension(string $extension): ?string
{
    if (in_array($extension, ASSET_TO_AVIF, true)) {
        return 'avif';
    }
    if (in_array($extension, ASSET_TO_OPUS, true)) {
        return 'opus';
    }
    return null;
}

// ── The survey ───────────────────────────────────────────────────────────────

/**
 * One pass over the tree, producing everything both pages show.
 *
 * Written as a single walk on purpose. The folder listing next door learned the
 * hard way that asking the filesystem twice about 65,000 files is the
 * difference between one second and nine.
 */
function assetSurvey(): array
{
    // _assetsRoot() lives with the upload endpoints, which is where the one
    // definition of "where the assets are" belongs. Spelling the path again
    // here would be a second thing to keep in step.
    $root = _assetsRoot();

    $formats = [];
    $groups = [];
    $totalFiles = 0;
    $totalBytes = 0;

    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS | FilesystemIterator::UNIX_PATHS),
        RecursiveIteratorIterator::SELF_FIRST
    );

    foreach ($iterator as $path => $info) {
        if ($info->isDir()) {
            continue;
        }

        $relative = substr($path, strlen($root) + 1);
        // Hidden directories are skipped the way the folder listing skips them.
        // Hidden files are not: several talents are named like "...Now That's
        // Rock 'N' Roll!", and dropping those would lose real assets.
        if (str_contains('/' . $relative, '/.')) {
            continue;
        }

        $extension = strtolower(pathinfo($relative, PATHINFO_EXTENSION));
        $size = $info->getSize();

        $totalFiles++;
        $totalBytes += $size;
        $formats[$extension]['files'] = ($formats[$extension]['files'] ?? 0) + 1;
        $formats[$extension]['bytes'] = ($formats[$extension]['bytes'] ?? 0) + $size;

        $slash = strrpos($relative, '/');
        $folder = $slash === false ? '' : substr($relative, 0, $slash);
        $key = $folder . '|' . assetNameKey(pathinfo($relative, PATHINFO_FILENAME));

        // Only the first path of each extension in a group is kept. Where two
        // spellings of one picture both need converting, one AVIF answers for
        // both - and it is the one the group is asked for by name.
        $groups[$key][$extension] ??= $relative;
    }

    return _assetSurveyTotals($groups, $formats, $totalFiles, $totalBytes);
}

/** Turns the walk's two tallies into the shape both pages read. */
function _assetSurveyTotals(array $groups, array $formats, int $totalFiles, int $totalBytes): array
{
    $missingAvif = [];
    $missingOpus = [];
    $imageSources = 0;
    $audioSources = 0;
    $avifOnly = 0;
    $opusOnly = 0;

    foreach ($groups as $extensions) {
        $image = _assetFirstOf($extensions, ASSET_TO_AVIF);
        $audio = _assetFirstOf($extensions, ASSET_TO_OPUS);

        if ($image !== null) {
            $imageSources++;
            if (!isset($extensions['avif'])) {
                $missingAvif[] = $image;
            }
        } elseif (isset($extensions['avif'])) {
            $avifOnly++;
        }

        if ($audio !== null) {
            $audioSources++;
            if (!isset($extensions['opus'])) {
                $missingOpus[] = $audio;
            }
        } elseif (isset($extensions['opus'])) {
            $opusOnly++;
        }
    }

    $rows = [];
    foreach ($formats as $extension => $row) {
        $rows[] = [
            'extension' => $extension === '' ? '(none)' : $extension,
            'files' => $row['files'],
            'bytes' => $row['bytes'],
        ];
    }
    // Biggest first: what a table of formats is actually being read for is
    // where the ten gigabytes went, not which extension sorts first.
    usort($rows, fn(array $a, array $b) => $b['bytes'] <=> $a['bytes']);

    return [
        'generated_at' => date('Y-m-d H:i:s'),
        'total_files' => $totalFiles,
        'total_bytes' => $totalBytes,
        'formats' => $rows,
        'images' => [
            'sources' => $imageSources,
            'missing' => count($missingAvif),
            'converted_only' => $avifOnly,
        ],
        'audio' => [
            'sources' => $audioSources,
            'missing' => count($missingOpus),
            'converted_only' => $opusOnly,
        ],
        // Kept in the cache but not answered with: it is the expensive half of
        // the walk, and building the convert queue from it beats walking again.
        'pending' => ['images' => $missingAvif, 'audio' => $missingOpus],
    ];
}

/** The first of `$wanted` this group has, or null. */
function _assetFirstOf(array $extensions, array $wanted): ?string
{
    foreach ($wanted as $extension) {
        if (isset($extensions[$extension])) {
            return $extensions[$extension];
        }
    }
    return null;
}

/** The survey, from cache while it is still fresh. */
function assetStats(bool $refresh = false): array
{
    $file = _assetStatsFile();

    if (!$refresh && is_file($file) && (time() - (int) filemtime($file)) < ASSET_STATS_TTL) {
        $cached = json_decode((string) file_get_contents($file), true);
        if (is_array($cached) && isset($cached['total_files'])) {
            return $cached;
        }
    }

    $stats = assetSurvey();

    if (!is_dir(dirname($file))) {
        @mkdir(dirname($file), 0775, true);
    }
    // A cache that cannot be written is not worth failing the request over -
    // it only means the next caller walks the tree again.
    @file_put_contents($file, json_encode($stats));

    return $stats;
}

/** Called by anything that adds or removes an asset. */
function assetStatsForget(): void
{
    $file = _assetStatsFile();
    if (is_file($file)) {
        @unlink($file);
    }
}

/** How old the cached survey is in seconds, or null when there is none. */
function assetStatsAge(): ?int
{
    $file = _assetStatsFile();
    return is_file($file) ? time() - (int) filemtime($file) : null;
}

// ── Converting what is missing ───────────────────────────────────────────────
//
// A queue on disk rather than one long request. Seven thousand files is minutes
// of work, the development server is single threaded, and any request long
// enough to do it all is long enough to be killed by something. So the client
// asks for a batch at a time and draws the progress; each batch is resumable,
// and a browser closed halfway leaves the rest waiting rather than lost.

function _assetQueueRead(): ?array
{
    $file = _assetQueueFile();
    if (!is_file($file)) {
        return null;
    }
    $queue = json_decode((string) file_get_contents($file), true);

    return is_array($queue) && isset($queue['pending']) ? $queue : null;
}

function _assetQueueWrite(array $queue): void
{
    $file = _assetQueueFile();
    if (!is_dir(dirname($file))) {
        @mkdir(dirname($file), 0775, true);
    }
    @file_put_contents($file, json_encode($queue));
}

function assetQueueClear(): void
{
    $file = _assetQueueFile();
    if (is_file($file)) {
        @unlink($file);
    }
}

/**
 * Builds the work list.
 *
 * Only what this box can actually encode goes in. Queueing five thousand voice
 * lines on a server without ffmpeg would produce five thousand identical
 * failures and a progress bar that means nothing; the counts come back instead,
 * so the page can say what is waiting on an encoder rather than on a click.
 */
function assetConvertStart(): array
{
    // Fresh rather than cached: a queue built from a day-old survey would spend
    // its first minutes on files somebody has already converted.
    $stats = assetStats(true);

    $pending = [];
    $blocked = ['images' => 0, 'audio' => 0];

    if (mediaCanWriteAvif()) {
        $pending = array_merge($pending, $stats['pending']['images']);
    } else {
        $blocked['images'] = count($stats['pending']['images']);
    }

    if (mediaCanWriteOpus()) {
        $pending = array_merge($pending, $stats['pending']['audio']);
    } else {
        $blocked['audio'] = count($stats['pending']['audio']);
    }

    $queue = [
        'started_at' => date('Y-m-d H:i:s'),
        'total' => count($pending),
        'converted' => 0,
        'failed' => 0,
        'skipped' => 0,
        'blocked' => $blocked,
        'failures' => [],
        'pending' => array_values($pending),
    ];

    _assetQueueWrite($queue);

    return $queue;
}

/**
 * Converts the next few, and answers with where the whole job has got to.
 *
 * Bounded by both a count and a clock, so a batch of AVIFs does not come back
 * in fifty milliseconds and a batch of voice lines does not run for a minute.
 */
function assetConvertStep(int $limit): ?array
{
    $queue = _assetQueueRead();
    if ($queue === null) {
        return null;
    }

    // Long enough for the batch, short enough that a wedged encode still ends.
    @set_time_limit((int) ASSET_CONVERT_SECONDS * 6);

    $root = realpath(_assetsRoot());
    $limit = max(1, min(ASSET_CONVERT_BATCH_MAX, $limit));
    $deadline = microtime(true) + ASSET_CONVERT_SECONDS;
    $attempted = 0;

    while ($queue['pending'] && $attempted < $limit && microtime(true) < $deadline) {
        $relative = (string) array_shift($queue['pending']);
        $attempted++;
        _assetConvertOne($queue, $root, $relative);
    }

    $queue['remaining'] = count($queue['pending']);
    $queue['finished'] = $queue['remaining'] === 0;
    _assetQueueWrite($queue);

    // Both pages are now quoting numbers that have changed underneath them.
    assetStatsForget();
    _assetFolderCacheClear();

    return $queue;
}

/** One file, with its tallies written back onto the queue. */
function _assetConvertOne(array &$queue, string $root, string $relative): void
{
    $source = $root . '/' . $relative;
    $real = realpath($source);

    // The list is our own, built by our own walk, so this cannot normally fail
    // - which is exactly why it is worth refusing rather than writing blind.
    if ($real === false || !str_starts_with($real, $root) || !is_file($real)) {
        $queue['skipped']++;
        return;
    }

    $extension = strtolower(pathinfo($relative, PATHINFO_EXTENSION));
    $target = assetTargetExtension($extension);
    if ($target === null) {
        $queue['skipped']++;
        return;
    }

    $written = substr($real, 0, -strlen($extension)) . $target;

    // Somebody may have converted it since the survey, here or by hand.
    if (is_file($written)) {
        $queue['skipped']++;
        return;
    }

    $ok = $target === 'opus' ? mediaToOpus($real, $written) : mediaToAvif($real, $written);

    if ($ok) {
        $queue['converted']++;
        return;
    }

    $queue['failed']++;
    if (count($queue['failures']) < ASSET_FAILURE_SAMPLE) {
        $queue['failures'][] = $relative;
    }
}

/** Where the job has got to, without touching it. */
function assetConvertProgress(): ?array
{
    $queue = _assetQueueRead();
    if ($queue === null) {
        return null;
    }

    $queue['remaining'] = count($queue['pending']);
    $queue['finished'] = $queue['remaining'] === 0;

    return $queue;
}
