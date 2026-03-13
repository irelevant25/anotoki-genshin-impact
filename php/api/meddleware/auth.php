<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;

/**
 * Middleware: validates Bearer JWT, fetches fresh user from DB,
 * and attaches it as the 'user' request attribute.
 *
 * If less than 24 h remain on the token, a freshly issued JWT is sent
 * back in the X-Refresh-Token response header so the client can store
 * it without an extra round-trip.
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

        // Fetch a fresh copy of the user so deleted/changed accounts are caught
        $pdo  = usersDb();
        $user = DbQuery::from($pdo, 'users')->fetch('_t.id = ? AND _t.deleted = false', [$decoded['sub']]);

        if (!$user) {
            return respondJson(new \Slim\Psr7\Response(), ['error' => 'User not found or inactive'], 401);
        }

        $response = $handler->handle($request->withAttribute('user', $user));

        // Auto-renew: if less than 24 h remain, issue a fresh 48 h token
        $timeLeft = $decoded['exp'] - time();
        if ($timeLeft > 0 && $timeLeft < 86400) {
            $newToken = jwtIssue($user['id'], $user['username'], $user['email'], $user['role']);
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

        if (!$user || !in_array($user['role'], $roles, true)) {
            return respondJson(new \Slim\Psr7\Response(), ['error' => 'Forbidden: insufficient permissions'], 403);
        }

        return $handler->handle($request);
    };
}
