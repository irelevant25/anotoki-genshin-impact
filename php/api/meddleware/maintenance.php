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
 *   /api/settings/public   is how anything learns the site is closed at all
 *   /api/auth/             is how an admin signs in to reopen it
 *   /api/languages         is which languages the sign can be read in
 *   /api/translations/     is the words on it
 *
 * Everything else answers 503 with a code the front end can act on. 503 rather
 * than 403: this is a state the site is in, not a judgement about who is
 * asking, and it is meant to end.
 */

/** The paths that answer normally while the site is closed. */
const MAINTENANCE_OPEN_PREFIXES = [
    '/api/settings/public',
    '/api/auth/',
    '/api/languages',
    '/api/translations/',
];

/**
 * Whoever is making this request, or null when that is nobody.
 *
 * The same three checks requireAuth() makes, made early - a global middleware
 * runs before any route's own, so there is no `user` attribute to read yet.
 * Memoised, because both gates below ask and neither should cost a second
 * round trip to the users table.
 *
 * It never refuses. A token this cannot make sense of belongs to nobody, and
 * the gates say what that means in their own words.
 */
function gateCaller(Request $request): ?array
{
    static $user = false;

    if ($user !== false) {
        return $user;
    }

    $user = null;
    $header = $request->getHeaderLine('Authorization');

    if (!str_starts_with($header, 'Bearer ')) {
        return null;
    }

    $decoded = jwtVerify(substr($header, 7));

    if (!$decoded || empty($decoded['sid'])) {
        return null;
    }

    try {
        $pdo = usersDb();

        if (!findSession($pdo, (string) $decoded['sid'])) {
            return null;
        }

        $found = DbQuery::from($pdo, 'users')->fetch('_t.id = ? AND _t.deleted = false', [$decoded['sub']]);
        $user = $found ?: null;
    } catch (\Throwable) {
        $user = null;
    }

    return $user;
}

function maintenanceGate(): callable
{
    return function (Request $request, RequestHandler $handler): Response {
        if (!maintenanceModeOn()) {
            return $handler->handle($request);
        }

        // Preflight is answered by the CORS middleware outside this one; a 503
        // here would show up in the browser as a CORS failure rather than as a
        // site that is closed.
        if ($request->getMethod() === 'OPTIONS') {
            return $handler->handle($request);
        }

        $path = $request->getUri()->getPath();

        foreach (MAINTENANCE_OPEN_PREFIXES as $prefix) {
            if (str_starts_with($path, $prefix)) {
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
