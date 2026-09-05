<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;

/**
 * Middleware: validates Bearer JWT, checks the session behind it is still
 * live, fetches fresh user from DB, and attaches both as request attributes.
 *
 * The session check is what makes signing out mean anything. A signature that
 * verifies is no longer enough on its own: the token names a session row, and
 * a revoked or expired row refuses the request however good the signature is.
 *
 * A token from before sessions existed carries no `sid` and is refused, so the
 * one deploy that introduces this asks everybody to sign in again. That is the
 * honest outcome - those tokens answer to nothing and cannot be revoked.
 *
 * If less than 24 h remain on the token, a freshly issued JWT is sent
 * back in the X-Refresh-Token response header so the client can store
 * it without an extra round-trip. It names the same session.
 */
function requireAuth(): callable
{
    return function (Request $request, RequestHandler $handler): Response {
        $authHeader = $request->getHeaderLine('Authorization');

        if (empty($authHeader) || !str_starts_with($authHeader, 'Bearer ')) {
            return respondJson(new \Slim\Psr7\Response(), ['error' => 'Missing or invalid Authorization header'], 401);
        }

        $token   = substr($authHeader, 7);
        $decoded = jwtVerify($token);

        if (!$decoded) {
            return respondJson(new \Slim\Psr7\Response(), ['error' => 'Invalid or expired token'], 401);
        }

        $pdo = usersDb();
        $session = findSession($pdo, (string) ($decoded['sid'] ?? ''));

        if (!$session) {
            return respondJson(new \Slim\Psr7\Response(), ['error' => 'Session has ended', 'code' => 'session_ended'], 401);
        }

        // Fetch a fresh copy of the user so deleted/changed accounts are caught
        $user = DbQuery::from($pdo, 'users')->fetch('_t.id = ? AND _t.deleted = false', [$decoded['sub']]);

        if (!$user) {
            return respondJson(new \Slim\Psr7\Response(), ['error' => 'User not found or inactive'], 401);
        }

        // A session belongs to one account, and a token that names somebody
        // else's is not a token this API issued.
        if ((int) $session['user_id'] !== (int) $user['id']) {
            return respondJson(new \Slim\Psr7\Response(), ['error' => 'Session has ended', 'code' => 'session_ended'], 401);
        }

        touchSession($pdo, $session);

        // Anything writing an audit row below can say which sign-in it was,
        // without being handed the request to find out.
        auditSession(isset($session['id']) ? (int) $session['id'] : null);

        $response = $handler->handle(
            $request->withAttribute('user', $user)->withAttribute('session', $session),
        );

        // Auto-renew: if less than 24 h remain, issue a fresh 48 h token
        $timeLeft = $decoded['exp'] - time();
        if ($timeLeft > 0 && $timeLeft < 86400) {
            $newToken = jwtIssue($user['id'], $user['username'], $user['email'], $user['role'], $session['token_id']);
            $response = $response->withHeader('X-Refresh-Token', $newToken);
        }

        return $response;
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
 * in for you, but not signing in is a perfectly good way to send one.
 *
 * Not middleware, because middleware here exists to reject. Call it from
 * inside the handler.
 */
function optionalAuthUser(Request $request): ?array
{
    $authHeader = $request->getHeaderLine('Authorization');
    if (empty($authHeader) || !str_starts_with($authHeader, 'Bearer ')) {
        return null;
    }

    $decoded = jwtVerify(substr($authHeader, 7));
    if (!$decoded) {
        // An expired token is not an error here, just an anonymous visitor.
        return null;
    }

    return DbQuery::from(usersDb(), 'users')->fetch('_t.id = ? AND _t.deleted = false', [$decoded['sub']]) ?: null;
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
//   System          the admin site's own machinery: accounts, audit logs,
//                   migrations, backups, feedback. ADMIN does everything,
//                   EDITOR can look but not touch, nobody else sees it.
//
//   Somebody's own  quiz progress and history. Yours, or an admin's to see.
//   data
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
