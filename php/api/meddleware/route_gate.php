<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;

/**
 * Middleware: the API half of switching a page off.
 *
 * A page that is off leaves the menu and stops matching in the router, and
 * that is where it ends unless somebody says otherwise: the row for a page can
 * name the API paths that belong to it, and then those answer 423 to anybody
 * the page itself is not drawn for.
 *
 * The default is that a page is governed and its data is not. Most of what
 * this exists for is "that page is not finished this week", where locking the
 * endpoints would break other pages that share them for no gain. Naming an
 * endpoint is the deliberate act that turns the sign into a lock.
 *
 * 423 rather than 404. The caller is not being lied to about what exists, the
 * state is one somebody put the site into on purpose, and it is meant to end -
 * which is exactly what Locked means and exactly what Not Found does not.
 *
 * Admins are exempt, like everywhere else here: whoever locked it has to be
 * able to look at it and unlock it. See routeEndpointRefusal() for what
 * happens when two pages claim the same prefix, and ROUTE_ENDPOINT_RESERVED
 * for the paths a page is not allowed to claim at all.
 *
 * Nothing here reads the `user` attribute, because a global middleware runs
 * before any route's own and there is not one yet. It identifies the caller
 * itself, through the same gateCaller() the maintenance gate uses, so a
 * request pays for that lookup once however many gates ask.
 */
function routeGate(): callable
{
    return function (Request $request, RequestHandler $handler): Response {
        if ($request->getMethod() === 'OPTIONS') {
            return $handler->handle($request);
        }

        $path = $request->getUri()->getPath();

        // Nothing outside the API is served through this middleware stack, but
        // the check is cheap and it keeps the gate honest about its own scope.
        if (!str_starts_with($path, '/api/')) {
            return $handler->handle($request);
        }

        $user = gateCaller($request);

        if (isAdminUser($user)) {
            return $handler->handle($request);
        }

        $refusal = routeEndpointRefusal($path, $user);

        if ($refusal !== null) {
            return respondJson(new \Slim\Psr7\Response(), $refusal, 423);
        }

        return $handler->handle($request);
    };
}
