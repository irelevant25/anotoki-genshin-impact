<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------
$app->post('/api/auth/register', function (Request $request, Response $response) {
    $body = $request->getParsedBody();

    if (empty($body['username']) || empty($body['email']) || empty($body['password'])) {
        return respondJson($response, ['error' => 'username, email and password are required'], 400);
    }

    $pdo = usersDb();

    if (DbQuery::from($pdo, 'users')->find(['email' => $body['email']])) {
        return respondJson($response, ['error' => 'Email already in use'], 409);
    }

    if (DbQuery::from($pdo, 'users')->find(['username' => $body['username']])) {
        return respondJson($response, ['error' => 'Username already in use'], 409);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute([
        $body['username'],
        $body['email'],
        password_hash($body['password'], PASSWORD_DEFAULT),
        'USER',
    ]);

    $userId = (int) $pdo->lastInsertId();
    $token  = jwtIssue($userId, $body['username'], $body['email'], 'USER');

    return respondJson($response, [
        'token' => $token,
        'user'  => [
            'username'        => $body['username'],
            'email'           => $body['email'],
            'role'            => 'USER',
            'background'      => null,
            'theme_main'      => 'light',
            'theme_admin'     => 'dark',
            'email_confirmed' => false,
            'version'         => null,
            'created_at'      => date('Y-m-d H:i:s'),
        ],
    ], 201);
});

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
$app->post('/api/auth/login', function (Request $request, Response $response) {
    $body = $request->getParsedBody();

    if (empty($body['email']) || empty($body['password'])) {
        return respondJson($response, ['error' => 'email and password are required'], 400);
    }

    $pdo  = usersDb();
    $user = DbQuery::from($pdo, 'users')->fetch('_t.email = ? AND _t.deleted = false', [$body['email']]);

    if (!$user || !password_verify($body['password'], $user['password'])) {
        return respondJson($response, ['error' => 'Invalid credentials'], 401);
    }

    $token = jwtIssue($user['id'], $user['username'], $user['email'], $user['role']);

    return respondJson($response, [
        'token' => $token,
        'user'  => [
            'username'        => $user['username'],
            'email'           => $user['email'],
            'role'            => $user['role'],
            'background'      => $user['background'],
            'theme_main'      => $user['theme_main'],
            'theme_admin'     => $user['theme_admin'],
            'email_confirmed' => (bool) $user['email_confirmed'],
            'version'         => $user['version'],
            'created_at'      => $user['created_at'],
        ],
    ]);
});

// ---------------------------------------------------------------------------
// GET /api/auth/me  — returns fresh user data for the bearer token owner
// ---------------------------------------------------------------------------
$app->get('/api/auth/me', function (Request $request, Response $response) {
    $user = $request->getAttribute('user');

    return respondJson($response, [
        'username'        => $user['username'],
        'email'           => $user['email'],
        'role'            => $user['role'],
        'background'      => $user['background'],
        'theme_main'      => $user['theme_main'],
        'theme_admin'     => $user['theme_admin'],
        'email_confirmed' => (bool) $user['email_confirmed'],
        'version'         => $user['version'],
        'created_at'      => $user['created_at'],
    ]);
})->add(requireAuth());

// ---------------------------------------------------------------------------
// PUT /api/auth/theme  — saves the caller's own light/dark choice
//
// One row per area: the site and the admin panel are remembered separately.
// Anyone signed in may change their own; no wider rights are involved.
// ---------------------------------------------------------------------------
$app->put('/api/auth/theme', function (Request $request, Response $response) {
    $body  = $request->getParsedBody() ?? [];
    $area  = $body['area']  ?? '';
    $theme = $body['theme'] ?? '';

    $columns = ['main' => 'theme_main', 'admin' => 'theme_admin'];
    if (!isset($columns[$area])) {
        return respondJson($response, ['error' => "Unknown area '$area'"], 400);
    }
    if (!in_array($theme, ['light', 'dark', 'auto'], true)) {
        return respondJson($response, ['error' => "Unknown theme '$theme'"], 400);
    }

    $user = $request->getAttribute('user');
    $pdo  = usersDb();
    $stmt = $pdo->prepare("UPDATE users SET {$columns[$area]} = ? WHERE id = ?");
    $stmt->execute([$theme, $user['id']]);

    return respondJson($response, ['area' => $area, 'theme' => $theme]);
})->add(requireAuth());

// ---------------------------------------------------------------------------
// POST /api/auth/logout  — stateless JWT: real logout happens client-side;
// this endpoint exists so the FE can fire a courtesy call.
// ---------------------------------------------------------------------------
$app->post('/api/auth/logout', function (Request $_request, Response $response) {
    return respondJson($response, ['message' => 'Logged out']);
});

// ---------------------------------------------------------------------------
// PUT /api/auth/password
// ---------------------------------------------------------------------------
$app->put('/api/auth/password', function (Request $request, Response $response) {
    $user = $request->getAttribute('user');
    $body = $request->getParsedBody();

    if (empty($body['current_password']) || empty($body['new_password'])) {
        return respondJson($response, ['error' => 'current_password and new_password are required'], 400);
    }

    if (!password_verify($body['current_password'], $user['password'])) {
        return respondJson($response, ['error' => 'Current password is incorrect'], 401);
    }

    if (strlen($body['new_password']) < 8) {
        return respondJson($response, ['error' => 'New password must be at least 8 characters'], 422);
    }

    $pdo = usersDb();
    $pdo->prepare('UPDATE users SET password = ? WHERE id = ?')
        ->execute([password_hash($body['new_password'], PASSWORD_DEFAULT), $user['id']]);

    return respondJson($response, ['message' => 'Password changed successfully']);
})->add(requireAuth());
