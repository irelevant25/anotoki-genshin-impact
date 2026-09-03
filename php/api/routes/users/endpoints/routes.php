<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * Which pages exist, and who they exist for.
 *
 *   GET /api/routes    the table, with what each page claims
 *   PUT /api/routes    save whatever changed
 *
 * The site's own copy is not here: it arrives with everything else in
 * GET /api/settings/public, because the menu needs it at the same moment as
 * the announcement and the closed sign, and two requests to draw one page is
 * one too many. This is the admin's copy - the same rows plus the endpoints
 * each claims and who last touched it.
 *
 * Saved as a whole form, like the settings are. Visibility, the switch and the
 * endpoints are one decision per page, and writing them separately leaves a
 * window where a page is locked and its data is not.
 */

/** The rows as the form draws them. */
function adminRouteRows(): array
{
    return array_map(static fn(array $route): array => [
        'id' => $route['id'],
        'path' => $route['path'],
        'visibility' => $route['visibility'],
        'blocked' => $route['blocked'],
        'endpoints' => $route['endpoints'],
        'updated_at' => $route['updated_at'],
        'updated_by' => $route['updated_by'],
    ], siteRoutesAll());
}

// ── GET /api/routes ──────────────────────────────────────────────────────────

$app->get('/api/routes', function (Request $request, Response $response) {
    return respondJson($response, [
        'routes' => adminRouteRows(),
        'levels' => ROUTE_VISIBILITY,
    ]);
})->add(responds(SiteRouteList::class))->add(requireRole('ADMIN'))->add(requireAuth());

// ── PUT /api/routes ──────────────────────────────────────────────────────────
//
// Takes the rows that changed. A path that has no row is refused rather than
// created: the pages that exist are the ones the router declares, seeded by a
// migration, and inventing one here would put a row in the table that governs
// nothing and looks like it does.

$app->put('/api/routes', function (Request $request, Response $response) {
    $body = $request->getParsedBody() ?? [];
    $incoming = $body['routes'] ?? null;

    if (!is_array($incoming)) {
        return respondJson($response, ['error' => 'routes must be a list of { id, visibility, blocked, endpoints }'], 422);
    }

    $known = [];
    foreach (siteRoutesAll() as $route) {
        $known[$route['id']] = $route;
    }

    // Everything is checked before anything is written, for the same reason
    // the settings are: these are read together, and half a saved form is a
    // combination nobody chose.
    $changes = [];

    foreach ($incoming as $entry) {
        $id = (int) ($entry['id'] ?? 0);

        if (!isset($known[$id])) {
            return respondJson($response, ['error' => "There is no page with id $id"], 422);
        }

        $visibility = (string) ($entry['visibility'] ?? $known[$id]['visibility']);

        if (!in_array($visibility, ROUTE_VISIBILITY, true)) {
            return respondJson($response, ['error' => "'$visibility' is not one of: " . implode(', ', ROUTE_VISIBILITY)], 422);
        }

        $endpoints = $entry['endpoints'] ?? $known[$id]['endpoints'];

        if (!is_array($endpoints)) {
            return respondJson($response, ['error' => 'endpoints must be a list of API paths'], 422);
        }

        $clean = [];
        foreach ($endpoints as $prefix) {
            if (!is_string($prefix)) {
                return respondJson($response, ['error' => 'endpoints must be a list of API paths'], 422);
            }

            $prefix = rtrim(trim($prefix), '/');

            if ($prefix === '') {
                continue;
            }

            if ($refusal = routeEndpointRefusalToSave($prefix)) {
                return respondJson($response, ['error' => $refusal], 422);
            }

            $clean[$prefix] = true;
        }

        $changes[$id] = [
            'visibility' => $visibility,
            'blocked' => (bool) ($entry['blocked'] ?? $known[$id]['blocked']),
            'endpoints' => array_keys($clean),
        ];
    }

    $pdo = usersDb();
    $user = $request->getAttribute('user');
    $written = 0;

    $pdo->beginTransaction();
    try {
        $update = $pdo->prepare(
            'UPDATE site_routes SET visibility = ?, blocked = ?, updated_at = CURRENT_TIMESTAMP, updated_by = ? WHERE id = ?'
        );
        $clear = $pdo->prepare('DELETE FROM site_route_endpoints WHERE route_id = ?');
        $add = $pdo->prepare('INSERT INTO site_route_endpoints (route_id, prefix) VALUES (?, ?)');

        foreach ($changes as $id => $change) {
            $before = $known[$id];

            $sameEndpoints = $change['endpoints'] == $before['endpoints'];
            $same = $change['visibility'] === $before['visibility']
                && $change['blocked'] === $before['blocked']
                && $sameEndpoints;

            // Unchanged rows are skipped rather than written and overwritten,
            // so `updated_at` keeps saying when the page was actually last
            // changed instead of when somebody last pressed Save.
            if ($same) {
                continue;
            }

            $written++;
            $update->execute([$change['visibility'], userBool($change['blocked']), (int) $user['id'], $id]);

            if (!$sameEndpoints) {
                // Replaced rather than reconciled. There are never more than a
                // handful, they have no identity of their own worth keeping,
                // and a diff would be more code than the thing it saves.
                $clear->execute([$id]);

                foreach ($change['endpoints'] as $prefix) {
                    $add->execute([$id, $prefix]);
                }
            }
        }

        $pdo->commit();
    } catch (\Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }

    if ($written > 0) {
        siteRoutesForget();
    }

    return respondJson($response, [
        'routes' => adminRouteRows(),
        'levels' => ROUTE_VISIBILITY,
    ]);
})->add(responds(SiteRouteList::class))->add(requireRole('ADMIN'))->add(requireAuth());
