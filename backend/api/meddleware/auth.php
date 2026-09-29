<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;

/**
 * Middleware: a valid IAM access token, and who it names.
 *
 * Signing in happens at the IAM (see site_user.php); this only checks the
 * token the site's frontend got there. There is no session row to look up any
 * more - the token names the IAM session in `sid`, and the IAM ends sessions by
 * refusing the next refresh, so a signed-out person is anonymous here within
 * one access token's lifetime (ten minutes).
 *
 * The request carries `user` (this site's record plus the `role` the token
 * grants) and `session` (`['id' => sid]`, for the audit log to say which
 * sign-in a change came from).
 */
function requireAuth(): callable
{
    return function (Request $request, RequestHandler $handler): Response {
        $claims = iamBearerClaims($request);

        if ($claims === null) {
            return respondJson(new \Slim\Psr7\Response(), [
                'error' => 'Sign in to do this',
                'code' => 'invalid_token',
            ], 401)->withHeader('WWW-Authenticate', 'Bearer error="invalid_token"');
        }

        $user = siteUserFromClaims($claims);
        $sessionId = isset($claims['sid']) ? (string) $claims['sid'] : null;

        // Anything writing an audit row below can say which sign-in it was,
        // without being handed the request to find out.
        auditSession($sessionId);

        return $handler->handle(
            $request->withAttribute('user', $user)->withAttribute('session', ['id' => $sessionId]),
        );
    };
}

/**
 * Middleware: ensures the already-authenticated user has one of the given roles.
 * Must be used after requireAuth().
 */
function requireRole(string ...$roles): callable
{
    return function (Request $request, RequestHandler $handler) use ($roles): Response {
        $user = $request->getAttribute('user');

        // Roles are spelled inconsistently across the endpoints ('ADMIN' vs
        // 'admin'), so compare case-insensitively rather than silently refusing.
        $userRole = strtoupper((string) ($user['role'] ?? ''));
        $allowed = array_map('strtoupper', $roles);

        if (!$user || !in_array($userRole, $allowed, true)) {
            return respondJson(new \Slim\Psr7\Response(), ['error' => 'Forbidden: insufficient permissions'], 403);
        }

        return $handler->handle($request);
    };
}

/**
 * The signed-in user, or null - without refusing the request either way.
 *
 * For endpoints that are open to everyone but behave differently when they
 * know who is asking, such as the feedback form: signing in fills the sender
 * in for you, but not signing in is a perfectly good way to send one. An
 * expired token is not an error here, just an anonymous visitor.
 *
 * Not middleware, because middleware here exists to reject. Call it from
 * inside the handler.
 */
function optionalAuthUser(Request $request): ?array
{
    $claims = iamBearerClaims($request);

    return $claims === null ? null : siteUserFromClaims($claims);
}

/**
 * Proof the person at the keyboard signed in a moment ago, for the few actions
 * worth asking that of - restoring a database over its current contents.
 *
 * It replaces "type your password again", which this site can no longer ask:
 * it has no passwords. `auth_time` in the token is when the credentials were
 * last presented at the IAM (a refresh does not move it), so the frontend
 * answers `reauth_required` by sending the person through the IAM's sign-in
 * once more and trying again.
 */
function recentSignInRefusal(array $user, int $withinSeconds = 600): ?array
{
    $authTime = $user['auth_time'] ?? null;

    if ($authTime === null || $authTime + $withinSeconds < time()) {
        return [
            'error' => 'Sign in again to confirm - this asks for a sign-in from the last ten minutes',
            'code' => 'reauth_required',
        ];
    }

    return null;
}

// ---------------------------------------------------------------------------
// Who is allowed to do what
// ---------------------------------------------------------------------------
// Three roles, and three shapes of endpoint:
//
//   Game content    reading is public, writing is ADMIN or EDITOR. The site is
//                   a reference work - the whole point is that anyone can read
//                   it without an account.
//
//   System          the admin site's own machinery: audit logs, migrations,
//                   backups, feedback. ADMIN does everything, EDITOR can look
//                   but not touch, nobody else sees it. (Accounts used to be
//                   here too; they are the IAM's now.)
//
//   Somebody's own  quiz progress and history. Yours, or an admin's to see.
//   data
//
// The roles themselves are granted in the IAM's admin console, per site: a
// token for this site lists this site's roles and nothing else.
//
// The constants below name those groups so an endpoint says which one it is
// rather than repeating a role list that drifts out of step file by file.

/** Writing game content: entries, lookup tables, uploaded files. */
const ROLES_CONTENT = ['ADMIN', 'EDITOR'];

/** Reading the System area. Editors get to look. */
const ROLES_SYSTEM_READ = ['ADMIN', 'EDITOR'];

/** Changing anything in the System area. */
const ROLES_SYSTEM_WRITE = ['ADMIN'];

function isAdminUser(?array $user): bool
{
    return strtoupper((string) ($user['role'] ?? '')) === 'ADMIN';
}

/**
 * Middleware: the row has to belong to whoever is asking, unless they are an
 * admin.
 *
 * `$param` is the route placeholder holding the user id. Without this, every
 * signed-in account could read and rewrite every other account's quiz progress
 * simply by changing the number in the URL.
 */
function requireSelfOrAdmin(string $param = 'user_id'): callable
{
    return function (Request $request, RequestHandler $handler) use ($param): Response {
        $user = $request->getAttribute('user');
        $route = \Slim\Routing\RouteContext::fromRequest($request)->getRoute();
        $target = $route?->getArgument($param);

        if (!isAdminUser($user) && (string) $target !== (string) ($user['id'] ?? '')) {
            return respondJson(new \Slim\Psr7\Response(), ['error' => 'Forbidden: that is not yours'], 403);
        }

        return $handler->handle($request);
    };
}

/**
 * The same rule for a user id that arrives in the body rather than the path.
 *
 * Returns an error message, or null when the caller may act for that user.
 * Not middleware: the body has already been parsed by the time a handler runs,
 * and only the handler knows which field carries the id.
 */
function refuseForeignUserId(Request $request, mixed $userId): ?string
{
    $user = $request->getAttribute('user');

    if ($userId === null || $userId === '') {
        return 'user_id is required';
    }

    if (!isAdminUser($user) && (string) $userId !== (string) ($user['id'] ?? '')) {
        return 'Forbidden: that is not yours';
    }

    return null;
}
