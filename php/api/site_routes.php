<?php

/**
 * Which pages exist, and who they exist for.
 *
 * A row per front-end route, carrying two separate decisions: `visibility` is
 * the lowest kind of reader the page is drawn for, and `blocked` takes it away
 * from everybody who is not an admin. "Members only" and "off this week" are
 * different things, and a page can be either, both, or neither.
 *
 * Optionally a row also names the API paths that belong to it, and then the
 * gate refuses those too. Empty means the page is governed and its data is
 * not, which is the right default: most of what this is for is "that page is
 * not finished", rather than "nobody may have this".
 *
 * Read once per request and cached, because the gate consults it on every call
 * that reaches the API.
 */

/** Visibility levels, from the most open to the least. */
const ROUTE_VISIBILITY = ['PUBLIC', 'USER', 'EDITOR', 'ADMIN'];

/**
 * API paths a route may never claim.
 *
 * An admin is always exempt from the gate, so nobody can lock themselves out
 * with these - but they can lock out everybody else, and these are the paths
 * where that is worst. Signing in, the settings that would undo it, the route
 * table itself, and the strings the resulting page would be written in.
 *
 * Checked in both directions: '/api/' is refused because it covers /api/auth,
 * and '/api/auth/login' is refused because it is covered by it.
 */
const ROUTE_ENDPOINT_RESERVED = ['/api/auth', '/api/settings', '/api/routes', '/api/languages', '/api/translations'];

/**
 * Every route for this site, newest read cached, each with its endpoints.
 *
 * `$reload` is for the one request that has just written to the table and now
 * has to answer with what it wrote.
 */
function siteRoutesAll(bool $reload = false): array
{
    static $routes = null;

    if ($reload) {
        $routes = null;
    }

    if ($routes !== null) {
        return $routes;
    }

    try {
        $pdo = usersDb();

        $statement = $pdo->prepare(
            'SELECT r.id, r.path, r.visibility, r.blocked, r.sort_order, r.updated_at, u.username AS updated_by
               FROM site_routes r
               LEFT JOIN users u ON u.id = r.updated_by
              WHERE r.site = ?
              ORDER BY r.sort_order ASC, r.path ASC'
        );
        $statement->execute([currentSite()]);

        $routes = [];
        foreach ($statement->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $routes[(int) $row['id']] = [
                'id' => (int) $row['id'],
                'path' => $row['path'],
                'visibility' => $row['visibility'],
                'blocked' => (bool) $row['blocked'],
                'updated_at' => $row['updated_at'],
                'updated_by' => $row['updated_by'],
                'endpoints' => [],
            ];
        }

        if ($routes !== []) {
            $endpoints = $pdo->query(
                'SELECT route_id, prefix FROM site_route_endpoints
                  WHERE route_id IN (' . implode(',', array_keys($routes)) . ')
                  ORDER BY prefix'
            );

            foreach ($endpoints->fetchAll(PDO::FETCH_ASSOC) as $row) {
                $routes[(int) $row['route_id']]['endpoints'][] = $row['prefix'];
            }
        }

        $routes = array_values($routes);
    } catch (\PDOException) {
        // Before migration 035 has run there is no table, and every page is
        // ungoverned. That is the right way round: the absence of the table
        // means "nothing is switched off", never "everything is".
        $routes = [];
    }

    return $routes;
}

/** Drops the cache, for the one request that has just written to the table. */
function siteRoutesForget(): void
{
    siteRoutesAll(true);
}

/**
 * Whether a stored path matches a URL.
 *
 * A ':id' segment stands for any one segment, which is how the router writes
 * it and the only pattern this needs - the site has no wildcards deeper than a
 * single id. Segment counts have to match, so '/database/characters' does not
 * match '/database/characters/5': those are two rows and two decisions.
 */
function routeMatchesPath(string $pattern, string $path): bool
{
    $left = explode('/', trim($pattern, '/'));
    $right = explode('/', trim($path, '/'));

    if (count($left) !== count($right)) {
        return false;
    }

    foreach ($left as $index => $segment) {
        if (!str_starts_with($segment, ':') && $segment !== $right[$index]) {
            return false;
        }
    }

    return true;
}

/** The row governing a URL, or null when nothing governs it. */
function siteRouteFor(string $path): ?array
{
    foreach (siteRoutesAll() as $route) {
        if (routeMatchesPath($route['path'], $path)) {
            return $route;
        }
    }

    return null;
}

/** Whether this reader is one of the kinds a visibility level admits. */
function routeVisibleTo(string $visibility, ?array $user): bool
{
    $role = strtoupper((string) ($user['role'] ?? ''));

    return match ($visibility) {
        'PUBLIC' => true,
        'USER' => $user !== null,
        'EDITOR' => in_array($role, ['EDITOR', 'ADMIN'], true),
        'ADMIN' => $role === 'ADMIN',
        // A level the column should not be able to hold. Treated as the
        // strictest rather than the most open: a value nothing understands is
        // not a reason to hand the page out.
        default => $role === 'ADMIN',
    };
}

/** Whether this reader may have the page at all. */
function routeAllows(array $route, ?array $user): bool
{
    if ($route['blocked'] && strtoupper((string) ($user['role'] ?? '')) !== 'ADMIN') {
        return false;
    }

    return routeVisibleTo($route['visibility'], $user);
}

/**
 * Why this API path is refused, or null when it is not.
 *
 * A path is governed only by the routes that actually name it, and it is
 * refused only when every one of them would refuse this reader. Where two
 * pages claim the same prefix - /daily and /quizzes both run on /api/quiz -
 * the more open one wins, because switching one page to members-only should
 * not quietly take an endpoint away from another page that is still public.
 * The alternative rule makes every shared endpoint as restricted as the
 * strictest page that ever touched it, which nobody would predict.
 */
function routeEndpointRefusal(string $path, ?array $user): ?array
{
    $claimed = false;

    foreach (siteRoutesAll() as $route) {
        foreach ($route['endpoints'] as $prefix) {
            if (!str_starts_with($path, $prefix)) {
                continue;
            }

            $claimed = true;

            if (routeAllows($route, $user)) {
                return null;
            }
        }
    }

    if (!$claimed) {
        return null;
    }

    // 423 rather than 404: the caller is not being told a lie about what
    // exists, and this is a state somebody put the site into deliberately and
    // can take it out of again.
    return ['error' => 'That part of the site is not available', 'code' => 'route_locked'];
}

/** Why this prefix may not be saved, or null when it may. */
function routeEndpointRefusalToSave(string $prefix): ?string
{
    if (!str_starts_with($prefix, '/api/')) {
        return "'$prefix' is not an API path - they all begin with /api/";
    }

    if (strlen($prefix) > 255) {
        return 'That path is too long';
    }

    foreach (ROUTE_ENDPOINT_RESERVED as $reserved) {
        if (str_starts_with($reserved, $prefix) || str_starts_with($prefix, $reserved)) {
            return "'$prefix' covers $reserved, which has to keep answering - it is how somebody signs in, "
                 . 'reads this table, and undoes whatever was just done to it';
        }
    }

    return null;
}

/**
 * What the site is told about its own pages, before anybody has signed in.
 *
 * Endpoints are left out: they are the gate's business, the front end has no
 * use for them, and a list of which API paths are locked is a map of the site
 * nobody browsing it needs. What is here is what the menu needs to decide what
 * to draw - and every path in it is already in the router in the JavaScript
 * bundle.
 */
function publicSiteRoutes(): array
{
    return array_map(static fn(array $route): array => [
        'path' => $route['path'],
        'visibility' => $route['visibility'],
        'blocked' => $route['blocked'],
    ], siteRoutesAll());
}
