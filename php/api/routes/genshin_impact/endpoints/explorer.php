<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * The real asset tree on disk, browsed like a file manager.
 *
 *   GET  /api/explorer?path=&search=&page=   one folder's sub-folders and files
 *   GET  /api/explorer/new?search=&page=     files new since the last re-scan
 *   GET  /api/explorer/status                when it was scanned, and how much is new
 *   POST /api/explorer/rescan                walk the disk again, refresh the snapshot
 *
 * Everything reads a cached snapshot (see api/explorer.php) so browsing never
 * walks the disk; only a re-scan does, and that same snapshot feeds the Files
 * page's on-disk-vs-database figures.
 */

$app->get('/api/explorer', function (Request $request, Response $response) {
    $query = $request->getQueryParams();
    $snapshot = explorerSnapshot();
    $listing = explorerListing(
        $snapshot,
        (string) ($query['path'] ?? ''),
        (string) ($query['search'] ?? ''),
        (int) ($query['page'] ?? 1)
    );

    return respondJson($response, $listing + ['status' => explorerStatus($snapshot)]);
})->add(responds(ExplorerListing::class))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

$app->get('/api/explorer/new', function (Request $request, Response $response) {
    $query = $request->getQueryParams();
    $snapshot = explorerSnapshot();
    $listing = explorerNewListing(
        $snapshot,
        (string) ($query['search'] ?? ''),
        (int) ($query['page'] ?? 1)
    );

    return respondJson($response, $listing + ['status' => explorerStatus($snapshot)]);
})->add(responds(ExplorerListing::class))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

$app->get('/api/explorer/status', function (Request $request, Response $response) {
    // Without a snapshot yet, say so rather than paying for a walk here - the
    // reload button is what a first scan is for.
    if (!explorerHasSnapshot()) {
        return respondJson($response, ['scanned_at' => null, 'previous_scanned_at' => null, 'total' => 0, 'new_count' => 0]);
    }

    return respondJson($response, explorerStatus(explorerSnapshot()));
})->add(responds(ExplorerStatus::class))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

$app->post('/api/explorer/rescan', function (Request $request, Response $response) {
    // The one thing that walks the disk. Refreshing the snapshot here is what
    // also refreshes the Files page's drift figures - they read the same file.
    $snapshot = explorerSnapshot(refresh: true);

    return respondJson($response, explorerStatus($snapshot));
})->add(responds(ExplorerStatus::class))->add(requireRole(...ROLES_SYSTEM_READ))->add(requireAuth());
