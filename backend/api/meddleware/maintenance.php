<?php

use Anotoki\Lib\Auth\Http\Identify;
use Anotoki\Lib\Backups\Backups;
use Anotoki\Lib\Translations\Http\TranslationsRoutes;
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
 *   /api/settings/public      is how anything learns the site is closed at all -
 *                             and where to sign in, since that is the IAM's
 *   /api/me                   is who the signed-in reader is
 *   /api/translations/{code}  is the words on it, with the languages it can be
 *                             read in beside them - that path exactly, one
 *                             language, nothing under it
 *   /api/site-status          is whether the site is there at all - set up, and
 *                             not waiting for a database update (site_state.php);
 *                             shut, the pages would read it as a site that is
 *                             down and draw that instead of the closed sign
 *
 * They are judged before the switch is read, so they answer even while
 * nothing can be read - the status above all, which has to say "not set up"
 * when there are no settings to ask.
 *
 * And two links an admin's browser opens by itself, which carry no token to
 * let them past: a backup's download (/api/admin/backups/{id}/file, its
 * single-use ticket its only check) and a file's preview in the file explorer
 * (/api/admin/files/raw, signed for five minutes). Only an ADMIN gets either
 * link - from routes this gate lets nobody else reach while the site is
 * closed - so opening them here opens nothing.
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
 * letters, so /api/me does not open a future /api/media - or, where it starts
 * with `~`, exactly the paths the pattern matches (gatePathOpen()). The words
 * are the anotoki library's path, which it says itself
 * (TranslationsRoutes::openPath()); hence define() rather than const.
 */
define('MAINTENANCE_OPEN_PREFIXES', [
    '/api/settings/public',
    '/api/me',
    TranslationsRoutes::openPath(),
    '/api/site-status',
    '~^/api/admin/backups/' . Backups::ID_PATTERN . '/file$~D',
    '~^/api/admin/files/raw$~D',
]);

/**
 * Whether a gate leaves a path open, by its list: an entry starting with `~`
 * is a pattern the decoded path must match whole (end it with D); any other is
 * a path that is open itself, with everything under it.
 *
 * @param list<string> $open
 */
function gatePathOpen(string $path, array $open): bool
{
    foreach ($open as $entry) {
        if (str_starts_with($entry, '~') ? preg_match($entry, $path) === 1 : $path === $entry || str_starts_with($path, rtrim($entry, '/') . '/')) {
            return true;
        }
    }

    return false;
}

/**
 * Whoever is making this request, or null when that is nobody.
 *
 * Asked early - a global middleware runs before any route's own, so there is
 * no `user` attribute to read yet - and answered from the verified token alone
 * (the library's Identify ran first, meddleware/auth.php): the gates need only
 * the id and the role, and the token carries both, so no query is spent on a
 * request the gates are about to refuse.
 *
 * It never refuses: a token that does not verify was answered 401 by Identify
 * before any gate ran.
 */
function gateCaller(Request $request): ?array
{
    $person = Identify::person($request);

    return $person === null ? null : ['id' => $person->sub, 'role' => siteRoleOf($person)];
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

    return $path === '' || $path[0] !== '/' ? '/' . $path : $path;
}

function maintenanceGate(): callable
{
    return function (Request $request, RequestHandler $handler): Response {
        if (gatePathOpen(gatePath($request), MAINTENANCE_OPEN_PREFIXES)) {
            return $handler->handle($request);
        }

        if (!maintenanceModeOn()) {
            return $handler->handle($request);
        }

        if (isAdminUser(gateCaller($request))) {
            return $handler->handle($request);
        }

        return respondJson(new \Slim\Psr7\Response(), ['error' => 'The site is closed for maintenance', 'code' => 'maintenance'], 503);
    };
}
