<?php

use Anotoki\Lib\Auth\Http\Identify;
use Anotoki\Lib\Backups\Backups;
use Anotoki\Lib\Translations\Http\TranslationsRoutes;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;

/**
 * The paths that never read who is asking, whatever the request sends: the
 * site's status, the words' bundle, the boot settings and the site settings
 * every page is told (what a page needs before anybody can be signed in - the
 * same answer to everybody), the asset previews an <img> loads (no header can
 * go with one), and the two links the admin tools hand out to be opened by the
 * browser itself - a backup's download, its single-use ticket its only check,
 * and a file's preview, its signature its only check. Each entry is a path
 * with everything under it, or a pattern starting with `~` (gatePathOpen(),
 * api/helpers.php).
 *
 * A token sent to one of them is not looked at - so one that has run out
 * cannot turn the boot or the words into a 401 - as before the library judged
 * who a request is.
 */
define('TOKENLESS_PATHS', [
    '/api/site-status',
    TranslationsRoutes::openPath(),
    '/api/settings/public',
    '/api/site-settings',
    '/api/files/raw',
    '/api/admin/files/raw',
    '~^/api/admin/backups/' . Backups::ID_PATTERN . '/file$~D',
]);

/**
 * Middleware, once for every request (api/index.php, inside the SiteGate and
 * in front of the other gates): who it is, by the anotoki library's Identify
 * (siteIdentify(), api/admin_tools.php) - an `Authorization: Bearer` token
 * that verifies is that person (Identify::person() from here on); one that
 * does not, or a Bearer header with none, is 401 invalid_token, on every path
 * but TOKENLESS_PATHS, which are nobody whatever was sent. Only the Bearer
 * scheme claims anybody: `Basic ...` (what a host behind a password file
 * sends with everything) is nobody. No cookie is ever read as somebody - the
 * IAM's sign-in hint least of all - and the visitor key is not read here:
 * requireOwner() and requireVisitorKey() below are its only readers.
 *
 * On TOKENLESS_PATHS Identify is not asked at all: the request gets the
 * attributes it gives nobody. Taking the header off was not enough - the
 * library reads the server's copies of it too (HTTP_AUTHORIZATION,
 * REDIRECT_HTTP_AUTHORIZATION, which php-fpm, CGI and `php -S` set), so a token
 * that had run out still turned the boot and the words into a 401 there.
 */
function identifyRequests(Identify $identify): callable
{
    return function (Request $request, RequestHandler $handler) use ($identify): Response {
        if (gatePathOpen(gatePath($request), TOKENLESS_PATHS)) {
            // What Identify::process() does for nobody: the one answer about
            // signing in asked afresh for this request, and who it is.
            siteSignInRule()->reset();

            return $handler->handle(
                $request->withAttribute(Identify::SELF, $identify)->withAttribute(Identify::PERSON, null)->withAttribute(Identify::VISITOR, null)->withAttribute(Identify::CALLER, 'nobody'),
            );
        }

        return $identify->process($request, $handler);
    };
}

/**
 * Middleware: somebody signed in, and who they are here.
 *
 * Signing in happens at the IAM (see site_user.php); Identify has checked the
 * token the site's frontend got there - a token that did not verify never gets
 * this far (401 invalid_token). Without one, this answers 401
 * sign_in_required. There is no session row to look up any more - the token
 * names the IAM session in `sid`, and the IAM ends sessions by refusing the
 * next refresh, so a signed-out person is anonymous here within one access
 * token's lifetime (ten minutes).
 *
 * The request carries `user` (this site's record, kept by the library's
 * PeopleRecorder, plus the `role` the token grants) and `session`
 * (`['id' => sid]`). The audit log knows the session already: the library's
 * AuditContextMiddleware holds it for the request.
 */
function requireAuth(): callable
{
    return function (Request $request, RequestHandler $handler): Response {
        $person = Identify::person($request);

        if ($person === null) {
            return Identify::of($request)->signInRequiredRefusal();
        }

        return $handler->handle($request->withAttribute('user', siteUserOf($person))->withAttribute('session', ['id' => $person->sid]));
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
 *      person - Identify's - or 401 invalid_token, which Identify answered
 *      before this ran: a bad or expired token never falls back to the key,
 *      which is not even read. Only the Bearer scheme claims anybody:
 *      `Basic ...` (a host behind a password file sends it with everything)
 *      is as if nothing was sent.
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
    $person = Identify::person($request);
    if ($person !== null) {
        visitorSweepAfterAnswer();

        return $request->withAttribute('user', siteUserOf($person))->withAttribute('session', ['id' => $person->sid]);
    }

    // The one answer about signing in this request has (Identify asked it).
    if (Identify::of($request)->signInRequired()) {
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
//   System          the admin site's own machinery. The anotoki library's
//                   admin tools - the error log, the audit log, feedback,
//                   backups, the file explorer, the People page - and the
//                   Migrations page are ADMIN's alone (the owner's decision:
//                   EDITORs see none of them), judged from the token
//                   (RequireRole::admin(), api/index.php), so they need no
//                   table a waiting update may change. The site settings -
//                   the library's page, maintenance, the announcement and
//                   Page access - are ADMIN's too; the dashboard is ADMIN's
//                   and EDITOR's, without the feedback and the audit figures
//                   for an EDITOR. (Accounts used to be here too; they are
//                   the IAM's now.)
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

/** Reading what of the System area is this site's own (the dashboard). Editors get to look. */
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
