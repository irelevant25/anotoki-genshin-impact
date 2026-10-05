<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;

/**
 * Middleware: while the IAM requires sign-in for this site, nobody who has not
 * signed in gets past.
 *
 * The switch is the IAM's ("Sign-in required" on this site's page in its admin
 * console; signInRequired() reads it). Off - this site's default, and what it
 * has always been - this does nothing. On, the site is for people with an
 * account: every API path answers 401 `sign_in_required` to a request without
 * a verified token, and the frontend sends the person to sign in.
 *
 * A gate of its own rather than requireAuth() on every route, because the
 * reference pages, the quizzes and the games are some hundred public GET
 * routes, and one forgotten would be a hole nobody notices. Like the two gates
 * beside it, it never reads the `user` attribute - there is not one yet - and
 * asks gateCaller(), so a request pays for the token once.
 *
 * Open whatever the switch, because without them the sign-in card cannot be
 * drawn or worded:
 *
 *   /api/settings/public   is how the page learns that sign-in is required
 *                          (and where the IAM is, and whether the site is closed)
 *   /api/languages         is which languages the card can be read in
 *   /api/translations/     is the words on it
 *
 * and one more, because a browser cannot send it a token:
 *
 *   /api/files/raw         a file of the asset tree, for the admin panel's
 *                          previews - an <img> or <audio> sends no Authorization
 *                          header, so gating it would break them for the admins
 *                          themselves, and it protects nothing: the same bytes
 *                          are under assets/
 *
 * (/api/me, open during maintenance, is not here: it needs a token anyway.)
 * The pictures and audio under assets/ are the web server's, served without
 * PHP, and stay reachable by address - game art, nothing of anybody's.
 *
 * Who passes is the IAM's decision, not this one's: any token that verifies
 * passes, whatever roles it lists - the IAM has already refused a sign-in to
 * anybody without a role here that may sign in (MEMBER, which every account
 * holds until an admin takes it away). And only an `Authorization: Bearer`
 * header claims to be somebody: a token that does not verify answers 401
 * `invalid_token`, so the frontend refreshes it, while `Basic ...` (what a host
 * behind a password file sends with everything) is no claim at all.
 *
 * Every path is judged as the router will read it (gatePath(): decoded once),
 * never as it arrived - `/%61pi/characters` is routed to /api/characters, so
 * it is refused like it. And there is no "outside /api/" to wave through:
 * whatever reaches this stack is the API, open below or behind the switch.
 *
 * Registered between the maintenance gate and the route gate: the closed sign
 * (503) is still the first answer, then this, then the per-page locks (423).
 */

/** The paths that answer whatever the switch: each one itself and everything under it. */
const SIGN_IN_OPEN_PREFIXES = [
    '/api/settings/public',
    '/api/languages',
    '/api/translations/',
    '/api/files/raw',
];

function signInGate(): callable
{
    return function (Request $request, RequestHandler $handler): Response {
        // Decoded, as the router reads it (gatePath()), and no "only under
        // /api/" shortcut: everything that reaches this stack is the API, so a
        // path is either open below or behind the switch - a spelling of a
        // route this did not think of is still behind it.
        $path = gatePath($request);

        foreach (SIGN_IN_OPEN_PREFIXES as $open) {
            if ($path === $open || str_starts_with($path, rtrim($open, '/') . '/')) {
                return $handler->handle($request);
            }
        }

        // A signed-in request never needs the switch: asked first, it costs
        // them nothing when the IAM is slow.
        if (gateCaller($request) !== null || !signInRequired()) {
            return $handler->handle($request);
        }

        if (anotoki_iam_sent_bearer($request->getHeaderLine('Authorization'))) {
            return respondJson(new \Slim\Psr7\Response(), [
                'error' => 'Sign in to do this',
                'code' => 'invalid_token',
            ], 401)->withHeader('WWW-Authenticate', 'Bearer error="invalid_token"');
        }

        return respondJson(
            new \Slim\Psr7\Response(),
            ['error' => 'Sign in to continue', 'code' => 'sign_in_required'],
            401,
        )->withHeader('WWW-Authenticate', 'Bearer');
    };
}
