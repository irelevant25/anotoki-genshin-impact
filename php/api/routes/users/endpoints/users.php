<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

$includeCols = 'id, role, username, email, background, theme_main, theme_admin, version, created_at, updated_at';

// GET all users
$app->get('/api/users', function (Request $request, Response $response) use ($includeCols) {
    $users = DbQuery::from(usersDb(), 'users')
        ->includeCols($includeCols)
        ->orderBy('created_at DESC')
        ->fetchAll('_t.deleted = false');
    return respondJson($response, $users);
});

// GET single user
$app->get('/api/users/{id:[0-9]+}', function (Request $request, Response $response, array $args) use ($includeCols) {
    $user = DbQuery::from(usersDb(), 'users')
        ->includeCols($includeCols)
        ->fetch('_t.id = ? AND _t.deleted = false', [$args['id']]);

    return $user
        ? respondJson($response, $user)
        : respondJson($response, ['error' => 'Not found'], 404);
});

// POST create user
$app->post('/api/users', function (Request $request, Response $response) use ($includeCols) {
    $pdo = usersDb();
    $data = array_filter(User::fromBody($request->getParsedBody())->toDbArray(), fn($v) => $v !== null);
    $data['password'] = password_hash($data['password'], PASSWORD_DEFAULT);

    $id = DbQuery::insert($pdo, 'users', $data);

    $user = DbQuery::from($pdo, 'users')->includeCols($includeCols)->find(['id' => $id]);
    return respondJson($response, $user, 201);
})->add(validateRequest(User::class))->add(requireRole('admin'))->add(requireAuth());

// PUT update user
$app->put('/api/users/{id:[0-9]+}', function (Request $request, Response $response, array $args) use ($includeCols) {
    $pdo = usersDb();

    if (!DbQuery::from($pdo, 'users')->fetch('_t.id = ? AND _t.deleted = false', [$args['id']])) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    $data = User::partialToDbArray($request->getParsedBody());
    if (isset($data['password'])) {
        $data['password'] = password_hash($data['password'], PASSWORD_DEFAULT);
    }
    DbQuery::update($pdo, 'users', $data, $args['id']);

    $user = DbQuery::from($pdo, 'users')->includeCols($includeCols)->find(['id' => $args['id']]);
    return respondJson($response, $user);
})->add(validateRequest(User::class, true))->add(requireRole('admin'))->add(requireAuth());

// DELETE user
$app->delete('/api/users/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $pdo = usersDb();

    if (!DbQuery::from($pdo, 'users')->fetch('_t.id = ? AND _t.deleted = false', [$args['id']])) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    DbQuery::update($pdo, 'users', ['deleted' => true], $args['id']);
    return respondJson($response, ['message' => 'Deleted successfully']);
})->add(requireRole('admin'))->add(requireAuth());
