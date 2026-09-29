<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * Reading back what went wrong.
 *
 *   GET    /api/errors?days=&level=&status=&search=   grouped, with counts to chart
 *   GET    /api/errors/{fingerprint}?days=            every occurrence of one failure
 *   DELETE /api/errors                                clear the log
 *
 * The writing side lives in api/error_log.php, and deliberately writes files
 * rather than rows - see the reasoning there.
 *
 * Answers are grouped by fingerprint, because a log is only useful if a bug
 * that fired four hundred times reads as one line saying four hundred.
 */

/** Collapses entries sharing a fingerprint into one row, loudest first. */
function _groupErrors(array $entries): array
{
    $groups = [];

    foreach ($entries as $entry) {
        $key = (string) ($entry['fingerprint'] ?? '');

        if (!isset($groups[$key])) {
            $groups[$key] = [
                'fingerprint' => $key,
                'level' => (string) ($entry['level'] ?? 'error'),
                'status' => (int) ($entry['status'] ?? 500),
                'type' => (string) ($entry['type'] ?? ''),
                'message' => (string) ($entry['message'] ?? ''),
                'file' => (string) ($entry['file'] ?? ''),
                'line' => (int) ($entry['line'] ?? 0),
                'count' => 0,
                'first_at' => (string) ($entry['at'] ?? ''),
                'last_at' => (string) ($entry['at'] ?? ''),
                'paths' => [],
                // Entries arrive newest first, so the first one seen is the latest.
                'latest' => $entry,
            ];
        }

        $group = &$groups[$key];
        $group['count']++;
        $at = (string) ($entry['at'] ?? '');
        if ($at !== '' && ($group['first_at'] === '' || $at < $group['first_at'])) {
            $group['first_at'] = $at;
        }
        if ($at > $group['last_at']) {
            $group['last_at'] = $at;
        }
        $path = (string) ($entry['path'] ?? '');
        $group['paths'][$path] = ($group['paths'][$path] ?? 0) + 1;
        unset($group);
    }

    foreach ($groups as &$group) {
        arsort($group['paths']);
        $group['paths'] = array_slice(array_keys($group['paths']), 0, 8);
        $group['latest'] = _fillErrorEntry($group['latest']);
    }
    unset($group);

    // Loudest first, then most recent: the thing firing constantly is the thing
    // to look at, and among equals the one still happening.
    usort($groups, fn($a, $b) => [$b['count'], $b['last_at']] <=> [$a['count'], $a['last_at']]);

    return array_values($groups);
}

/** A line written by an older version may lack a field the shape declares. */
function _fillErrorEntry(array $entry): array
{
    return $entry + [
        'at' => '',
        'level' => 'error',
        'status' => 500,
        'type' => '',
        'message' => '',
        'file' => '',
        'line' => 0,
        'method' => '',
        'path' => '',
        'user_id' => null,
        'session_id' => null,
        'ip' => null,
        'fingerprint' => '',
        'trace' => null,
    ];
}

/** The filter every read shares. */
function _errorFilter(Request $request): array
{
    $query = $request->getQueryParams();

    return [
        'days' => max(1, min(30, (int) ($query['days'] ?? 7))),
        'level' => in_array($query['level'] ?? '', ['error', 'warning'], true) ? $query['level'] : '',
        'status' => (int) ($query['status'] ?? 0),
        'search' => (string) ($query['search'] ?? ''),
        'limit' => 2000,
    ];
}

// ── GET /api/errors ───────────────────────────────────────────────────────────

$app->get('/api/errors', function (Request $request, Response $response) {
    $filter = _errorFilter($request);
    $read = readApiErrors($filter);
    $entries = $read['entries'];

    // Counts for the chart: a row for every day in range even when nothing
    // failed, so a quiet day reads as a quiet day rather than as no data.
    $daily = [];
    for ($i = $filter['days'] - 1; $i >= 0; $i--) {
        $daily[date('Y-m-d', strtotime("-$i days"))] = ['errors' => 0, 'warnings' => 0];
    }

    $statuses = [];
    $errors = 0;
    $warnings = 0;

    foreach ($entries as $entry) {
        $isError = ($entry['level'] ?? 'error') === 'error';
        $isError ? $errors++ : $warnings++;

        $day = substr((string) ($entry['at'] ?? ''), 0, 10);
        if (isset($daily[$day])) {
            $daily[$day][$isError ? 'errors' : 'warnings']++;
        }

        $status = (string) (int) ($entry['status'] ?? 0);
        $statuses[$status] ??= ['errors' => 0, 'warnings' => 0];
        $statuses[$status][$isError ? 'errors' : 'warnings']++;
    }

    ksort($statuses);
    $tally = fn(array $rows) => array_map(
        fn($key, $row) => ['key' => (string) $key] + $row,
        array_keys($rows),
        array_values($rows)
    );

    $groups = _groupErrors($entries);

    return respondJson($response, [
        'total' => $read['total'],
        'errors' => $errors,
        'warnings' => $warnings,
        'distinct' => count($groups),
        'days' => $read['days'],
        'daily' => $tally($daily),
        'statuses' => $tally($statuses),
        'groups' => $groups,
    ]);
})->add(responds(ErrorLogReport::class))->add(requireRole(...ROLES_SYSTEM_READ))->add(requireAuth());

// ── GET /api/errors/{fingerprint} ─────────────────────────────────────────────
// Every occurrence of one failure, for when the count is not the interesting
// part and the pattern of when it happens is.

$app->get('/api/errors/{fingerprint}', function (Request $request, Response $response, array $args) {
    $filter = _errorFilter($request);
    $wanted = (string) $args['fingerprint'];

    $entries = array_values(array_filter(
        readApiErrors($filter)['entries'],
        fn($entry) => ($entry['fingerprint'] ?? '') === $wanted
    ));

    if (!$entries) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    return respondJson($response, array_map('_fillErrorEntry', $entries));
})->add(responds(ErrorLogEntry::class, list: true))->add(requireRole(...ROLES_SYSTEM_READ))->add(requireAuth());

// ── DELETE /api/errors ────────────────────────────────────────────────────────

$app->delete('/api/errors', function (Request $request, Response $response) {
    return respondJson($response, ['deleted' => clearApiErrors()]);
})->add(responds(ErrorLogCleared::class))->add(requireRole(...ROLES_SYSTEM_WRITE))->add(requireAuth());
