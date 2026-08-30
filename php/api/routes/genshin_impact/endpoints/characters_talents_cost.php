<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

// GET all
$app->get('/api/characters-talents-cost', function (Request $request, Response $response) {
    $items = DbQuery::from(genshinDb(), 'characters_talents_cost')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->includeExternal('updated_by', usersDb(), 'users', ['id', 'username'])
        ->orderBy('id')
        ->fetchAll();
    return respondJson($response, $items);
});

// GET single
$app->get('/api/characters-talents-cost/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $item = DbQuery::from(genshinDb(), 'characters_talents_cost')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->includeExternal('updated_by', usersDb(), 'users', ['id', 'username'])
        ->find(['id' => $args['id']]);
    return $item
        ? respondJson($response, $item)
        : respondJson($response, ['error' => 'Not found'], 404);
});

// POST create
$app->post('/api/characters-talents-cost', function (Request $request, Response $response) {
    $user = $request->getAttribute('user');
    $pdo = genshinDb();
    $id = DbQuery::insert($pdo, 'characters_talents_cost', [
        ...CharacterTalentCost::fromBody($request->getParsedBody())->toDbArray(),
        'created_by' => $user['id'],
    ]);
    $result = DbQuery::from($pdo, 'characters_talents_cost')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->find(['id' => $id]);
    return respondJson($response, $result, 201);
})->add(validateRequest(CharacterTalentCost::class))->add(requireRole('ADMIN', 'EDITOR'))->add(requireAuth());

// PUT update
$app->put('/api/characters-talents-cost/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $user = $request->getAttribute('user');
    $pdo = genshinDb();
    if (!DbQuery::from($pdo, 'characters_talents_cost')->find(['id' => $args['id'], 'deleted' => false])) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }
    DbQuery::update($pdo, 'characters_talents_cost', [
        ...CharacterTalentCost::partialToDbArray($request->getParsedBody()),
        'updated_by' => $user['id'],
    ], $args['id']);
    $result = DbQuery::from($pdo, 'characters_talents_cost')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->includeExternal('updated_by', usersDb(), 'users', ['id', 'username'])
        ->find(['id' => $args['id']]);
    return respondJson($response, $result);
})->add(validateRequest(CharacterTalentCost::class, true))->add(requireRole('ADMIN', 'EDITOR'))->add(requireAuth());

// DELETE
$app->delete('/api/characters-talents-cost/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();
    if (!DbQuery::from($pdo, 'characters_talents_cost')->find(['id' => $args['id'], 'deleted' => false])) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }
    DbQuery::update($pdo, 'characters_talents_cost', ['deleted' => true], $args['id']);
    return respondJson($response, ['message' => 'Deleted successfully']);
})->add(requireRole('ADMIN', 'EDITOR'))->add(requireAuth());
