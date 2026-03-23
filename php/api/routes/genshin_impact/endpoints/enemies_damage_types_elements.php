<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

// GET all
$app->get('/api/enemies-damage-types-elements', function (Request $request, Response $response) {
    $items = DbQuery::from(genshinDb(), 'enemies_damage_types_elements')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->includeExternal('updated_by', usersDb(), 'users', ['id', 'username'])
        ->orderBy('enemy_phase_id')
        ->fetchAll();
    return respondJson($response, $items);
});

// GET single
$app->get('/api/enemies-damage-types-elements/{id}', function (Request $request, Response $response, array $args) {
    $item = DbQuery::from(genshinDb(), 'enemies_damage_types_elements')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->includeExternal('updated_by', usersDb(), 'users', ['id', 'username'])
        ->find(['id' => $args['id']]);
    return $item
        ? respondJson($response, $item)
        : respondJson($response, ['error' => 'Not found'], 404);
});

// POST create
$app->post('/api/enemies-damage-types-elements', function (Request $request, Response $response) {
    $user = $request->getAttribute('user');
    $pdo  = genshinDb();
    $id   = DbQuery::insert($pdo, 'enemies_damage_types_elements', [
        ...EnemyDamageTypeElement::fromBody($request->getParsedBody())->toDbArray(),
        'created_by' => $user['id'],
    ]);
    $result = DbQuery::from($pdo, 'enemies_damage_types_elements')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->find(['id' => $id]);
    return respondJson($response, $result, 201);
})->add(validateRequest(EnemyDamageTypeElement::class))->add(requireRole('ADMIN', 'EDITOR'))->add(requireAuth());

// PUT update
$app->put('/api/enemies-damage-types-elements/{id}', function (Request $request, Response $response, array $args) {
    $user = $request->getAttribute('user');
    $pdo  = genshinDb();
    if (!DbQuery::from($pdo, 'enemies_damage_types_elements')->find(['id' => $args['id'], 'deleted' => false])) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }
    DbQuery::update($pdo, 'enemies_damage_types_elements', [
        ...EnemyDamageTypeElement::partialToDbArray($request->getParsedBody()),
        'updated_by' => $user['id'],
    ], $args['id']);
    $result = DbQuery::from($pdo, 'enemies_damage_types_elements')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->includeExternal('updated_by', usersDb(), 'users', ['id', 'username'])
        ->find(['id' => $args['id']]);
    return respondJson($response, $result);
})->add(validateRequest(EnemyDamageTypeElement::class, true))->add(requireRole('ADMIN', 'EDITOR'))->add(requireAuth());

// DELETE
$app->delete('/api/enemies-damage-types-elements/{id}', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();
    if (!DbQuery::from($pdo, 'enemies_damage_types_elements')->find(['id' => $args['id'], 'deleted' => false])) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }
    DbQuery::update($pdo, 'enemies_damage_types_elements', ['deleted' => true], $args['id']);
    return respondJson($response, ['message' => 'Deleted successfully']);
})->add(requireRole('ADMIN', 'EDITOR'))->add(requireAuth());
