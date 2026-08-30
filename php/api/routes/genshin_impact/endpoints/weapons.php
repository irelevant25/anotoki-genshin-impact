<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

// GET all
$app->get('/api/weapons', function (Request $request, Response $response) {
    $items = DbQuery::from(genshinDb(), 'weapons')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->includeExternal('updated_by', usersDb(), 'users', ['id', 'username'])
        ->orderBy('name')
        ->fetchAll();
    return respondJson($response, $items);
});

// GET single
$app->get('/api/weapons/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $item = DbQuery::from(genshinDb(), 'weapons')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->includeExternal('updated_by', usersDb(), 'users', ['id', 'username'])
        ->find(['id' => $args['id']]);
    return $item
        ? respondJson($response, $item)
        : respondJson($response, ['error' => 'Not found'], 404);
});

// POST create
$app->post('/api/weapons', function (Request $request, Response $response) {
    $user = $request->getAttribute('user');
    $pdo = genshinDb();
    $id = DbQuery::insert($pdo, 'weapons', [
        ...Weapon::fromBody($request->getParsedBody())->toDbArray(),
        'created_by' => $user['id'],
    ]);
    $result = DbQuery::from($pdo, 'weapons')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->find(['id' => $id]);
    return respondJson($response, $result, 201);
})->add(validateRequest(Weapon::class))->add(requireRole('ADMIN', 'EDITOR'))->add(requireAuth());

// PUT update
$app->put('/api/weapons/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $user = $request->getAttribute('user');
    $pdo = genshinDb();
    if (!DbQuery::from($pdo, 'weapons')->find(['id' => $args['id'], 'deleted' => false])) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }
    DbQuery::update($pdo, 'weapons', [
        ...Weapon::partialToDbArray($request->getParsedBody()),
        'updated_by' => $user['id'],
    ], $args['id']);
    $result = DbQuery::from($pdo, 'weapons')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->includeExternal('updated_by', usersDb(), 'users', ['id', 'username'])
        ->find(['id' => $args['id']]);
    return respondJson($response, $result);
})->add(validateRequest(Weapon::class, true))->add(requireRole('ADMIN', 'EDITOR'))->add(requireAuth());

// DELETE
$app->delete('/api/weapons/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();
    if (!DbQuery::from($pdo, 'weapons')->find(['id' => $args['id'], 'deleted' => false])) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }
    DbQuery::update($pdo, 'weapons', ['deleted' => true], $args['id']);
    return respondJson($response, ['message' => 'Deleted successfully']);
})->add(requireRole('ADMIN', 'EDITOR'))->add(requireAuth());
