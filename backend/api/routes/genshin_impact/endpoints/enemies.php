<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

// GET all
$app->get('/api/enemies', function (Request $request, Response $response) {
    $items = DbQuery::from(genshinDb(), 'enemies')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->includeExternal('updated_by', usersDb(), 'users', ['id', 'username'])
        ->orderBy('name')
        ->fetchAll();
    return respondJson($response, $items);
})->add(responds('enemies', list: true));

// GET single
$app->get('/api/enemies/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $item = DbQuery::from(genshinDb(), 'enemies')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->includeExternal('updated_by', usersDb(), 'users', ['id', 'username'])
        ->find(['id' => $args['id']]);
    return $item
        ? respondJson($response, $item)
        : respondJson($response, ['error' => 'Not found'], 404);
})->add(responds('enemies'));

// POST create
$app->post('/api/enemies', function (Request $request, Response $response) {
    $user = $request->getAttribute('user');
    $pdo = genshinDb();
    $body = $request->getParsedBody() ?? [];
    resolveAssetBody($pdo, 'enemies', $body, $user['id']);
    $id = DbQuery::insert($pdo, 'enemies', [
        ...Enemy::fromBody($body)->toDbArray(),
        'created_by' => $user['id'],
    ]);
    $result = DbQuery::from($pdo, 'enemies')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->find(['id' => $id]);
    return respondJson($response, $result, 201);
})->add(responds('enemies'))->add(validateRequest(Enemy::class))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

// PUT update
$app->put('/api/enemies/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $user = $request->getAttribute('user');
    $pdo = genshinDb();
    if (!DbQuery::from($pdo, 'enemies')->find(['id' => $args['id'], 'deleted' => false])) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }
    $body = $request->getParsedBody() ?? [];
    resolveAssetBody($pdo, 'enemies', $body, $user['id']);
    DbQuery::update($pdo, 'enemies', [
        ...Enemy::partialToDbArray($body),
        'updated_by' => $user['id'],
    ], $args['id']);
    $result = DbQuery::from($pdo, 'enemies')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->includeExternal('updated_by', usersDb(), 'users', ['id', 'username'])
        ->find(['id' => $args['id']]);
    return respondJson($response, $result);
})->add(responds('enemies'))->add(validateRequest(Enemy::class, true))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

// DELETE
$app->delete('/api/enemies/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();
    if (!DbQuery::from($pdo, 'enemies')->find(['id' => $args['id'], 'deleted' => false])) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }
    DbQuery::update($pdo, 'enemies', ['deleted' => true], $args['id']);
    return respondJson($response, ['message' => 'Deleted successfully']);
})->add(responds('enemies'))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());
