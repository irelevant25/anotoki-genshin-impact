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
})->add(responds('materials', list: true));

// GET by name (must be before /{id} to avoid route collision)
$app->get('/api/materials/by-name/{name}', function (Request $request, Response $response, array $args) {
    $item = DbQuery::from(genshinDb(), 'materials')
        ->find(['name' => urldecode($args['name'])]);
    return $item
        ? respondJson($response, $item)
        : respondJson($response, ['error' => 'Not found'], 404);
})->add(responds('materials'));

// GET single
$app->get('/api/materials/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $item = DbQuery::from(genshinDb(), 'materials')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->includeExternal('updated_by', usersDb(), 'users', ['id', 'username'])
        ->find(['id' => $args['id']]);
    return $item
        ? respondJson($response, $item)
        : respondJson($response, ['error' => 'Not found'], 404);
})->add(responds('materials'));

// POST create
$app->post('/api/materials', function (Request $request, Response $response) {
    $user = $request->getAttribute('user');
    $pdo = genshinDb();
    $body = $request->getParsedBody() ?? [];
    resolveAssetBody($pdo, 'materials', $body, $user['id']);
    $id = DbQuery::insert($pdo, 'materials', [
        ...Material::fromBody($body)->toDbArray(),
        'created_by' => $user['id'],
    ]);
    $result = DbQuery::from($pdo, 'materials')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->find(['id' => $id]);
    return respondJson($response, $result, 201);
})->add(responds('materials'))->add(validateRequest(Material::class))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

// PUT update
$app->put('/api/materials/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $user = $request->getAttribute('user');
    $pdo = genshinDb();
    if (!DbQuery::from($pdo, 'materials')->find(['id' => $args['id'], 'deleted' => false])) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }
    $body = $request->getParsedBody() ?? [];
    resolveAssetBody($pdo, 'materials', $body, $user['id']);
    DbQuery::update($pdo, 'materials', [
        ...Material::partialToDbArray($body),
        'updated_by' => $user['id'],
    ], $args['id']);
    $result = DbQuery::from($pdo, 'materials')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->includeExternal('updated_by', usersDb(), 'users', ['id', 'username'])
        ->find(['id' => $args['id']]);
    return respondJson($response, $result);
})->add(responds('materials'))->add(validateRequest(Material::class, true))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

// DELETE
$app->delete('/api/materials/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();
    if (!DbQuery::from($pdo, 'materials')->find(['id' => $args['id'], 'deleted' => false])) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }
    DbQuery::update($pdo, 'materials', ['deleted' => true], $args['id']);
    return respondJson($response, ['message' => 'Deleted successfully']);
})->add(responds('materials'))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());
