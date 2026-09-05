<?php

/**
 * What went wrong, written down where somebody can read it.
 *
 * A file rather than a table, and deliberately: the errors most worth seeing
 * are the ones where the database is unreachable, and a logger that needs the
 * database loses exactly those. A day's worth of JSON lines needs no schema, no
 * migration, survives an outage, and rotates by being a new file tomorrow.
 *
 * One line per error, appended. Reading is a tail of the last few days rather
 * than a query, which is fine at this size and honest about what it is.
 *
 * Every entry carries a fingerprint - the kind of failure, where it was thrown,
 * and the message with the changing parts taken out. Five hundred copies of one
 * bug then read as one row with a count beside it, which is the difference
 * between a page that is worth opening and a wall of text.
 */

/** Days of logs kept. Older files are removed the next time one is written. */
const ERROR_LOG_DAYS = 30;

/** A single file cannot grow past this; past it, the day rolls to a second part. */
const ERROR_LOG_MAX_BYTES = 4 * 1024 * 1024;

function errorLogDir(): string
{
    return dirname(__DIR__) . '/storage/logs';
}

/**
 * The stable identity of a failure.
 *
 * The changing parts of the message are taken out first: without that, "no such
 * file X.avif" and "no such file Y.avif" are two bugs rather than one bug seen
 * twice. Only the parts that actually vary, though - a quoted run is collapsed
 * when it looks like a value (it carries a digit or a path separator) and kept
 * when it reads as prose, so that two different messages of the same shape do
 * not become one. Erasing every quoted run turned `{"error":"Not found"}` and
 * `{"error":"Invalid token"}` into the same string, and two unrelated failures
 * into one row.
 */
function errorFingerprint(string $type, string $file, int $line, string $message, int $status = 0): string
{
    $shape = preg_replace_callback(
        '/"[^"]*"|\'[^\']*\'/',
        fn($m) => preg_match('/[\d\/\\\\]/', $m[0]) ? $m[0][0] . '…' . $m[0][0] : $m[0],
        $message
    );
    $shape = preg_replace(['/\d+/', '/\s+/'], ['#', ' '], (string) $shape);

    return substr(md5($type . '|' . $file . '|' . $line . '|' . $status . '|' . $shape), 0, 12);
}

/** Today's file, or the next part of it once it has grown past the cap. */
function _errorLogFile(): string
{
    $dir = errorLogDir();
    $base = $dir . '/errors-' . date('Y-m-d');

    if (is_file($base . '.jsonl') && filesize($base . '.jsonl') < ERROR_LOG_MAX_BYTES) {
        return $base . '.jsonl';
    }
    if (!is_file($base . '.jsonl')) {
        return $base . '.jsonl';
    }

    for ($part = 2; $part < 100; $part++) {
        $candidate = $base . '.' . $part . '.jsonl';
        if (!is_file($candidate) || filesize($candidate) < ERROR_LOG_MAX_BYTES) {
            return $candidate;
        }
    }

    return $base . '.overflow.jsonl';
}

/** Removes anything older than ERROR_LOG_DAYS. Cheap: it is a handful of files. */
function _errorLogPrune(): void
{
    $cutoff = date('Y-m-d', strtotime('-' . ERROR_LOG_DAYS . ' days'));

    foreach (glob(errorLogDir() . '/errors-*.jsonl') ?: [] as $file) {
        if (preg_match('/errors-(\d{4}-\d{2}-\d{2})/', basename($file), $m) && $m[1] < $cutoff) {
            @unlink($file);
        }
    }
}

/**
 * Drops the machine's own path off everything, leaving the project-relative bit.
 *
 * `F:\\Repositories\\anotoki-genshin-impact\\php\\api\\db_query.php` says one
 * useful thing and eleven useless ones, and it says them on every line of every
 * trace. What is left - `api/db_query.php` - is the part that means anything to
 * somebody reading it, and it is the same on any machine the app runs on.
 */
function _errorTrimPaths(string $text): string
{
    $root = str_replace('\\', '/', dirname(__DIR__)) . '/';

    return str_replace([$root, str_replace('/', '\\', $root)], '', str_replace('\\', '/', $text));
}

/**
 * Writes one entry.
 *
 * Never throws and never warns: a logger that can break a request is worse than
 * one that occasionally loses a line.
 */
function logApiError(array $entry): void
{
    try {
        $dir = errorLogDir();
        if (!is_dir($dir) && !@mkdir($dir, 0775, true)) {
            return;
        }

        $entry += [
            'at' => date('Y-m-d H:i:s'),
            'level' => 'error',
            'status' => 500,
            'type' => 'Error',
            'message' => '',
            'file' => '',
            'line' => 0,
            'method' => '',
            'path' => '',
            'user_id' => null,
            'session_id' => null,
            'ip' => null,
        ];

        $entry['fingerprint'] = errorFingerprint(
            (string) $entry['type'],
            (string) $entry['file'],
            (int) $entry['line'],
            (string) $entry['message'],
            (int) $entry['status']
        );

        // A stack trace is the difference between knowing something broke and
        // knowing why, but it is also most of the bytes - so it is trimmed to
        // the frames inside this application.
        if (isset($entry['trace']) && is_string($entry['trace'])) {
            $entry['trace'] = _errorTrimPaths(implode("\n", array_slice(explode("\n", $entry['trace']), 0, 12)));
        }
        $entry['file'] = _errorTrimPaths((string) $entry['file']);

        $line = json_encode($entry, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        if ($line === false) {
            return;
        }

        $file = _errorLogFile();
        $fresh = !is_file($file);
        @file_put_contents($file, $line . "\n", FILE_APPEND | LOCK_EX);

        if ($fresh) {
            _errorLogPrune();
        }
    } catch (\Throwable) {
        // Deliberately silent. See the docblock.
    }
}

/**
 * Reads entries back, newest first.
 *
 * @param array{days?:int,level?:string,status?:int,search?:string,limit?:int} $filter
 * @return array{entries: array<int, array<string, mixed>>, total: int, days: array<int, string>}
 */
function readApiErrors(array $filter = []): array
{
    $days = max(1, (int) ($filter['days'] ?? 7));
    $limit = max(1, min(2000, (int) ($filter['limit'] ?? 500)));
    $search = strtolower(trim((string) ($filter['search'] ?? '')));

    $files = glob(errorLogDir() . '/errors-*.jsonl') ?: [];
    rsort($files);

    $cutoff = date('Y-m-d', strtotime('-' . ($days - 1) . ' days'));
    $entries = [];
    $available = [];

    foreach ($files as $file) {
        if (!preg_match('/errors-(\d{4}-\d{2}-\d{2})/', basename($file), $m)) {
            continue;
        }
        $available[$m[1]] = true;
        if ($m[1] < $cutoff) {
            continue;
        }

        foreach (array_reverse(file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: []) as $line) {
            $entry = json_decode($line, true);
            if (!is_array($entry)) {
                continue;
            }
            if (!empty($filter['level']) && ($entry['level'] ?? '') !== $filter['level']) {
                continue;
            }
            if (!empty($filter['status']) && (int) ($entry['status'] ?? 0) !== (int) $filter['status']) {
                continue;
            }
            if ($search !== '' && !str_contains(strtolower($line), $search)) {
                continue;
            }
            $entries[] = $entry;
        }
    }

    // Newest first across files, since a day's file is only sorted within itself.
    usort($entries, fn($a, $b) => strcmp((string) ($b['at'] ?? ''), (string) ($a['at'] ?? '')));

    $total = count($entries);
    $available = array_keys($available);
    rsort($available);

    return ['entries' => array_slice($entries, 0, $limit), 'total' => $total, 'days' => $available];
}

/**
 * Whether this request has already been written down.
 *
 * An exception is caught by Slim's error middleware, which turns it into a
 * response - and that response then passes back out through the middleware
 * that logs failed responses. Without this the interesting entry, the one with
 * the trace, would be shadowed by a second entry saying only "500".
 */
function errorLogHandled(?bool $set = null): bool
{
    static $handled = false;

    if ($set !== null) {
        $handled = $set;
    }

    return $handled;
}

/** Deletes every log file. Returns how many went. */
function clearApiErrors(): int
{
    $gone = 0;
    foreach (glob(errorLogDir() . '/errors-*.jsonl') ?: [] as $file) {
        if (@unlink($file)) {
            $gone++;
        }
    }

    return $gone;
}
