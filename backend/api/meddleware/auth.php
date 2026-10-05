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
 * Middleware: whose own games and statistics a request reads and writes - the
 * only code that reads a visitor's key (X-Visitor-Key, api/visitors.php) to
 * find who a request is, and so the only way a visitor reaches anything (the
 * move at sign-in, requireVisitorKey(), reads it only beside a person's
 * token). Who the request is, in this
 * order (the family's design, 4.2):
 *
 *   1. `Authorization: Bearer ...` (with or without a token after it): that
 *      person, or 401 invalid_token as requireAuth() answers - a bad or
 *      expired token never falls back to the key, which is not even read.
 *      Only the Bearer scheme claims anybody: `Basic ...` (a host behind a
 *      password file sends it with everything) is as if nothing was sent.
 *   2. Else, while the IAM requires sign-in here (signInRequired()): 401
 *      sign_in_required. The key is never looked up, counted or swept early,
 *      and nobody is made. (signInGate() has answered this already; asking
 *      again costs nothing - the answer is kept for the request.)
 *   3. Else an X-Visitor-Key: that visitor (visitorFind()) - a key that is
 *      malformed or nobody's is 401 visitor_unknown, and while users/045
 *      waits every visitor path is 503 visitors_unavailable.
 *   4. Else nobody, as $nobody says:
 *        'refuse'  401 sign_in_required
 *        'empty'   the route goes on with no `user`, and answers what nobody
 *                  has - nothing - without a query
 *        'make'    the route goes on with `visitor_to_make`: a save that
 *                  holds a play makes a visitor inside its own transaction
 *                  (ownerWrite()) and hands its key back in X-Visitor-Key
 *
 * Every answer of such a route - its own, a refusal, the one that makes a
 * visitor - goes out through ownerPrivate(): `Cache-Control: private,
 * no-store` and `Vary: Authorization, X-Visitor-Key`. A visitor's request
 * carries no Authorization and its URL is every visitor's, so nothing between
 * here and the browser may keep one answer for the next caller.
 *
 * A person's or a visitor's request also leaves the sweep of long-unseen
 * visitors for after its answer (at most once an hour across the site).
 */
function requireOwner(string $nobody = 'refuse'): callable
{
    if (!in_array($nobody, ['refuse', 'empty', 'make'], true)) {
        throw new LogicException("requireOwner('$nobody'): nobody is 'refuse', 'empty' or 'make'.");
    }

    return function (Request $request, RequestHandler $handler) use ($nobody): Response {
        try {
            $response = $handler->handle(ownerRequest($request, $nobody));
        } catch (ApiRefusal $refusal) {
            // Answered here rather than by the default error handler, so a
            // refusal carries the same headers as everything else about
            // somebody's own data. Whoever began a transaction has rolled it
            // back on the way out (ownerWrite()).
            $response = apiRefusalResponse($refusal);
        }

        return ownerPrivate($response);
    };
}

/** The request with its owner on it (requireOwner()'s four kinds), or an ApiRefusal. */
function ownerRequest(Request $request, string $nobody): Request
{
    if (anotoki_iam_sent_bearer($request->getHeaderLine('Authorization'))) {
        $claims = iamBearerClaims($request);
        if ($claims === null) {
            throw new ApiRefusal(401, 'invalid_token', 'Sign in to do this', ['WWW-Authenticate' => 'Bearer error="invalid_token"']);
        }
        $user = siteUserFromClaims($claims);
        $sessionId = isset($claims['sid']) ? (string) $claims['sid'] : null;
        auditSession($sessionId);
        visitorSweepAfterAnswer();

        return $request->withAttribute('user', $user)->withAttribute('session', ['id' => $sessionId]);
    }

    if (signInRequired()) {
        throw ownerSignInRequired();
    }

    $key = visitorKeyOf($request);
    if ($key !== null) {
        $visitor = visitorFind($key);
        visitorSweepAfterAnswer();

        return $request->withAttribute('user', $visitor);
    }

    return match ($nobody) {
        'empty' => $request,
        'make' => $request->withAttribute('visitor_to_make', true),
        default => throw ownerSignInRequired(),
    };
}

/** 401 sign_in_required, in the words and with the header signInGate() answers it. */
function ownerSignInRequired(): ApiRefusal
{
    return new ApiRefusal(401, 'sign_in_required', 'Sign in to continue', ['WWW-Authenticate' => 'Bearer']);
}

/**
 * Middleware: this browser's visitor key beside the person's token - for the
 * one route that takes both, the move at sign-in (POST /api/visitor/move).
 * Added before requireAuth() in the chain, so it runs after it: the person
 * is known first, and a request without a token never gets this far (401).
 *
 * No X-Visitor-Key, or one that cannot be a key: 422 invalid (field
 * visitor_key). Else the key goes on the request as `visitor_key`, not looked
 * up - whose it is, if anybody's, is the move's own business (visitorMove()),
 * and so is what the IAM's switch says: requiring sign-in stops a key from
 * being somebody (requireOwner()), not from being handed in with a token.
 *
 * Every answer past it - its own refusals, the route's, an ApiRefusal from
 * inside the move - goes out through ownerPrivate(), as an owner route's do.
 * Besides requireOwner(), the only code that reads the key.
 */
function requireVisitorKey(): callable
{
    return function (Request $request, RequestHandler $handler): Response {
        try {
            $key = visitorKeyOf($request);
            if ($key === null) {
                throw new ApiRefusal(422, 'invalid', 'The X-Visitor-Key header is required.', [], ['field' => 'visitor_key']);
            }
            if (!visitorKeyWellFormed($key)) {
                throw new ApiRefusal(422, 'invalid', 'The X-Visitor-Key header is not a visitor key.', [], ['field' => 'visitor_key']);
            }
            $response = $handler->handle($request->withAttribute('visitor_key', $key));
        } catch (ApiRefusal $refusal) {
            $response = apiRefusalResponse($refusal);
        }

        return ownerPrivate($response);
    };
}

/**
 * Middleware: ensures the already-authenticated user has one of the given roles.
 * Must be used after requireAuth().
 *
 * A visitor is refused by name, whatever its array says: requireAuth() never
 * puts one on a request, so meeting one here means a route was wired wrong,
 * and a role check is no place to find out what a visitor's `role` holds.
 */
function requireRole(string ...$roles): callable
{
    return function (Request $request, RequestHandler $handler) use ($roles): Response {
        $user = $request->getAttribute('user');

        // Roles are spelled inconsistently across the endpoints ('ADMIN' vs
        // 'admin'), so compare case-insensitively rather than silently refusing.
        $userRole = strtoupper((string) ($user['role'] ?? ''));
        $allowed = array_map('strtoupper', $roles);

        if (!$user || isVisitor($user) || !in_array($userRole, $allowed, true)) {
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
//                   it without an account. (Unless the IAM's "Sign-in
//                   required" is on for it: then signInGate() turns away
//                   everybody not signed in, before any route is reached.)
//
//   System          the admin site's own machinery: audit logs, migrations,
//                   backups, feedback. ADMIN does everything, EDITOR can look
//                   but not touch, nobody else sees it. (Accounts used to be
//                   here too; they are the IAM's now.)
//
//   Somebody's own  quiz progress and history. Yours, or an admin's to see
//   data            (the admin routes on those tables). A player's own
//                   routes (/api/quiz/progress, /result, /stats, ...) take
//                   requireOwner() below: the signed-in person, or this
//                   browser's visitor while the site does not require
//                   sign-in - and nothing else ever reads a visitor's key
//                   but requireVisitorKey(), the move at sign-in.
//
// The roles themselves are granted in the IAM's admin console, per site: a
// token for this site lists this site's roles and nothing else - MEMBER for
// everybody (an ordinary reader, USER here), ADMIN or EDITOR beside it.
//
// The constants below name those groups so an endpoint says which one it is
// rather than repeating a role list that drifts out of step file by file.

/** Writing game content: entries, lookup tables, uploaded files. */
const ROLES_CONTENT = ['ADMIN', 'EDITOR'];

/** Reading the System area. Editors get to look. */
const ROLES_SYSTEM_READ = ['ADMIN', 'EDITOR'];

/** Changing anything in the System area. */
const ROLES_SYSTEM_WRITE = ['ADMIN'];

/** An admin: a person whose token grants ADMIN here - never a visitor, whatever its array says. */
function isAdminUser(?array $user): bool
{
    return !isVisitor($user) && strtoupper((string) ($user['role'] ?? '')) === 'ADMIN';
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
