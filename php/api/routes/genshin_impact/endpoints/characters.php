<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

$excludeCols = 'created_by, updated_by, created_at, updated_at';

// GET all characters - full
$app->get('/api/characters', function (Request $request, Response $response) {
    $characters = DbQuery::from(genshinDb(), 'characters')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->includeExternal('updated_by', usersDb(), 'users', ['id', 'username'])
        ->orderBy('name')
        ->fetchAll();

    return respondJson($response, $characters);
});

// GET all characters - minimal
$app->get('/api/characters/minimal', function (Request $request, Response $response) use ($excludeCols) {
    $characters = DbQuery::from(genshinDb(), 'characters')
        ->excludeCols($excludeCols)
        ->orderBy('name')
        ->fetchAll();

    return respondJson($response, $characters);
});

// GET single character
$app->get('/api/characters/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $character = DbQuery::from(genshinDb(), 'characters')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->includeExternal('updated_by', usersDb(), 'users', ['id', 'username'])
        ->find(['id' => $args['id']]);

    return $character
        ? respondJson($response, $character)
        : respondJson($response, ['error' => 'Not found'], 404);
});

// GET single random character
$app->get('/api/character/random', function (Request $request, Response $response) use ($excludeCols) {
    $characters = DbQuery::from(genshinDb(), 'characters')
        ->excludeCols($excludeCols)
        ->orderByRandom()
        ->limit(1)
        ->fetchAll();

    return isset($characters[0])
        ? respondJson($response, $characters[0])
        : respondJson($response, ['error' => 'Not found'], 404);
});

// POST create character
$app->post('/api/characters', function (Request $request, Response $response) use ($excludeCols) {
    $user = $request->getAttribute('user');
    $pdo = genshinDb();

    $id = DbQuery::insert($pdo, 'characters', [
        ...Character::fromBody($request->getParsedBody())->toDbArray(),
        'created_by' => $user['id'],
    ]);

    $result = DbQuery::from($pdo, 'characters')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->find(['id' => $id]);

    return respondJson($response, $result, 201);
})->add(validateRequest(Character::class))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

// PUT update character
$app->put('/api/characters/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $user = $request->getAttribute('user');
    $pdo = genshinDb();

    if (!DbQuery::from($pdo, 'characters')->find(['id' => $args['id']])) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    DbQuery::update($pdo, 'characters', [
        ...Character::partialToDbArray($request->getParsedBody()),
        'updated_by' => $user['id'],
    ], $args['id']);

    $character = DbQuery::from($pdo, 'characters')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->includeExternal('updated_by', usersDb(), 'users', ['id', 'username'])
        ->find(['id' => $args['id']]);

    return respondJson($response, $character);
})->add(validateRequest(Character::class, true))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

// DELETE character
$app->delete('/api/characters/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();

    if (!DbQuery::from($pdo, 'characters')->find(['id' => $args['id']])) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    DbQuery::update($pdo, 'characters', ['deleted' => true], $args['id']);
    return respondJson($response, ['message' => 'Deleted successfully']);
})->add(requireRole(...ROLES_CONTENT))->add(requireAuth());
