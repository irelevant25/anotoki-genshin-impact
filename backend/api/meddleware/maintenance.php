<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;

/**
 * Middleware: while the site is closed, only admins get past.
 *
 * This is the half of maintenance mode that means something. Hiding the site
 * behind a closed sign in the browser stops people who were going to read the
 * page; it does not stop a saved bookmark to the API, a second tab that was
 * already open, or anything else that talks to it directly. So the closed sign
 * is drawn by the front end and enforced here, and the second one is the one
 * that decides.
 *
 * Four things stay open regardless, because without them the closed sign
 * cannot be drawn or got past:
 *
 *   /api/settings/public   is how anything learns the site is closed at all -
 *                          and where to sign in, since that is the IAM's
 *   /api/me                is who the signed-in reader is
 *   /api/languages         is which languages the sign can be read in
 *   /api/translations/     is the words on it
 *
 * Signing in itself happens at the IAM, which this switch does not reach: an
 * admin signs in there as usual and is let through here by their role.
 *
 * Everything else answers 503 with a code the front end can act on. 503 rather
 * than 403: this is a state the site is in, not a judgement about who is
 * asking, and it is meant to end.
 */

/**
 * The paths that answer normally while the site is closed: each one itself and
 * everything under it - not every path that merely begins with the same
 * letters, so /api/languages keeps /api/languages/sk open, and /api/me does
 * not open a future /api/media.
 */
const MAINTENANCE_OPEN_PREFIXES = [
    '/api/settings/public',
    '/api/me',
    '/api/languages',
    '/api/translations/',
];

/**
 * Whoever is making this request, or null when that is nobody.
 *
 * Asked early - a global middleware runs before any route's own, so there is
 * no `user` attribute to read yet - and answered from the verified token alone:
 * the gates need only the id and the role, and the token carries both, so no
 * query is spent on a request the gates are about to refuse.
 *
 * It never refuses. A token this cannot make sense of belongs to nobody, and
 * the gates say what that means in their own words.
 */
function gateCaller(Request $request): ?array
{
    $claims = iamBearerClaims($request);

    if ($claims === null) {
        return null;
    }

    return ['id' => anotoki_iam_user_id($claims), 'role' => siteRoleFromClaims($claims)];
}

/**
 * The path a gate judges: the one the router will route on, never the one the
 * request arrived with.
 *
 * The request keeps its path percent-encoded, as the browser sent it; Slim's
 * router decodes it once (rawurldecode) and puts a slash in front when there
 * is none, and only then picks the route (RouteResolver::computeRoutingResults).
 * A gate that read the raw path would let `/%61pi/characters` past every
 * `/api/` check and still be routed to `/api/characters` - so every gate asks
 * this, which does exactly what the router does.
 */
function gatePath(Request $request): string
{
    $path = rawurldecode($request->getUri()->getPath());

    return ($path === '' || $path[0] !== '/') ? '/' . $path : $path;
}

function maintenanceGate(): callable
{
    return function (Request $request, RequestHandler $handler): Response {
        if (!maintenanceModeOn()) {
            return $handler->handle($request);
        }

        $path = gatePath($request);

        foreach (MAINTENANCE_OPEN_PREFIXES as $open) {
            if ($path === $open || str_starts_with($path, rtrim($open, '/') . '/')) {
                return $handler->handle($request);
            }
        }

        if (isAdminUser(gateCaller($request))) {
            return $handler->handle($request);
        }

        return respondJson(
            new \Slim\Psr7\Response(),
            ['error' => 'The site is closed for maintenance', 'code' => 'maintenance'],
            503,
        );
    };
}
