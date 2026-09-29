<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

// GET all
$app->get('/api/characters-ascensions', function (Request $request, Response $response) {
    $items = DbQuery::from(genshinDb(), 'characters_ascensions')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->includeExternal('updated_by', usersDb(), 'users', ['id', 'username'])
        ->orderBy('id')
        ->fetchAll();
    return respondJson($response, $items);
})->add(responds('characters_ascensions', list: true));

// GET single
$app->get('/api/characters-ascensions/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $item = DbQuery::from(genshinDb(), 'characters_ascensions')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->includeExternal('updated_by', usersDb(), 'users', ['id', 'username'])
        ->find(['id' => $args['id']]);
    return $item
        ? respondJson($response, $item)
        : respondJson($response, ['error' => 'Not found'], 404);
})->add(responds('characters_ascensions'));

// POST create
$app->post('/api/characters-ascensions', function (Request $request, Response $response) {
    $user = $request->getAttribute('user');
    $pdo = genshinDb();
    $id = DbQuery::insert($pdo, 'characters_ascensions', [
        ...CharacterAscension::fromBody($request->getParsedBody())->toDbArray(),
        'created_by' => $user['id'],
    ]);
    $result = DbQuery::from($pdo, 'characters_ascensions')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->find(['id' => $id]);
    return respondJson($response, $result, 201);
})->add(responds('characters_ascensions'))->add(validateRequest(CharacterAscension::class))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

// PUT update
$app->put('/api/characters-ascensions/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $user = $request->getAttribute('user');
    $pdo = genshinDb();
    if (!DbQuery::from($pdo, 'characters_ascensions')->find(['id' => $args['id'], 'deleted' => false])) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }
    DbQuery::update($pdo, 'characters_ascensions', [
        ...CharacterAscension::partialToDbArray($request->getParsedBody()),
        'updated_by' => $user['id'],
    ], $args['id']);
    $result = DbQuery::from($pdo, 'characters_ascensions')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->includeExternal('updated_by', usersDb(), 'users', ['id', 'username'])
        ->find(['id' => $args['id']]);
    return respondJson($response, $result);
})->add(responds('characters_ascensions'))->add(validateRequest(CharacterAscension::class, true))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

// DELETE
$app->delete('/api/characters-ascensions/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();
    if (!DbQuery::from($pdo, 'characters_ascensions')->find(['id' => $args['id'], 'deleted' => false])) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }
    DbQuery::update($pdo, 'characters_ascensions', ['deleted' => true], $args['id']);
    return respondJson($response, ['message' => 'Deleted successfully']);
})->add(responds('characters_ascensions'))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());
