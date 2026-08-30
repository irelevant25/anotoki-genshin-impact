<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

// GET all
$app->get('/api/materials', function (Request $request, Response $response) {
    $items = DbQuery::from(genshinDb(), 'materials')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->includeExternal('updated_by', usersDb(), 'users', ['id', 'username'])
        ->orderBy('name')
        ->fetchAll();
    return respondJson($response, $items);
});

// GET by name (must be before /{id} to avoid route collision)
$app->get('/api/materials/by-name/{name}', function (Request $request, Response $response, array $args) {
    $item = DbQuery::from(genshinDb(), 'materials')
        ->find(['name' => urldecode($args['name'])]);
    return $item
        ? respondJson($response, $item)
        : respondJson($response, ['error' => 'Not found'], 404);
});

// GET single
$app->get('/api/materials/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $item = DbQuery::from(genshinDb(), 'materials')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->includeExternal('updated_by', usersDb(), 'users', ['id', 'username'])
        ->find(['id' => $args['id']]);
    return $item
        ? respondJson($response, $item)
        : respondJson($response, ['error' => 'Not found'], 404);
});

// POST create
$app->post('/api/materials', function (Request $request, Response $response) {
    $user = $request->getAttribute('user');
    $pdo = genshinDb();
    $id = DbQuery::insert($pdo, 'materials', [
        ...Material::fromBody($request->getParsedBody())->toDbArray(),
        'created_by' => $user['id'],
    ]);
    $result = DbQuery::from($pdo, 'materials')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->find(['id' => $id]);
    return respondJson($response, $result, 201);
})->add(validateRequest(Material::class))->add(requireRole('ADMIN', 'EDITOR'))->add(requireAuth());

// PUT update
$app->put('/api/materials/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $user = $request->getAttribute('user');
    $pdo = genshinDb();
    if (!DbQuery::from($pdo, 'materials')->find(['id' => $args['id'], 'deleted' => false])) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }
    DbQuery::update($pdo, 'materials', [
        ...Material::partialToDbArray($request->getParsedBody()),
        'updated_by' => $user['id'],
    ], $args['id']);
    $result = DbQuery::from($pdo, 'materials')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->includeExternal('updated_by', usersDb(), 'users', ['id', 'username'])
        ->find(['id' => $args['id']]);
    return respondJson($response, $result);
})->add(validateRequest(Material::class, true))->add(requireRole('ADMIN', 'EDITOR'))->add(requireAuth());

// DELETE
$app->delete('/api/materials/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();
    if (!DbQuery::from($pdo, 'materials')->find(['id' => $args['id'], 'deleted' => false])) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }
    DbQuery::update($pdo, 'materials', ['deleted' => true], $args['id']);
    return respondJson($response, ['message' => 'Deleted successfully']);
})->add(requireRole('ADMIN', 'EDITOR'))->add(requireAuth());
