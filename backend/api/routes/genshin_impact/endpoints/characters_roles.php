<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

// GET all character roles
$app->get('/api/characters-roles', function (Request $request, Response $response) {
    $items = DbQuery::from(genshinDb(), 'characters_roles')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->includeExternal('updated_by', usersDb(), 'users', ['id', 'username'])
        ->fetchAll();
    return respondJson($response, $items);
})->add(responds('characters_roles', list: true));

// GET single character role
$app->get('/api/characters-roles/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $item = DbQuery::from(genshinDb(), 'characters_roles')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->includeExternal('updated_by', usersDb(), 'users', ['id', 'username'])
        ->find(['id' => $args['id']]);
    return $item
        ? respondJson($response, $item)
        : respondJson($response, ['error' => 'Not found'], 404);
})->add(responds('characters_roles'));

// POST create character role
$app->post('/api/characters-roles', function (Request $request, Response $response) {
    $user = $request->getAttribute('user');
    $pdo = genshinDb();
    $id = DbQuery::insert($pdo, 'characters_roles', [
        ...CharacterRole::fromBody($request->getParsedBody())->toDbArray(),
        'created_by' => $user['id'],
    ]);
    $result = DbQuery::from($pdo, 'characters_roles')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->find(['id' => $id]);
    return respondJson($response, $result, 201);
})->add(responds('characters_roles'))->add(validateRequest(CharacterRole::class))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

// DELETE character role
$app->delete('/api/characters-roles/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();
    if (!DbQuery::from($pdo, 'characters_roles')->find(['id' => $args['id'], 'deleted' => false])) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }
    DbQuery::update($pdo, 'characters_roles', ['deleted' => true], $args['id']);
    return respondJson($response, ['message' => 'Deleted successfully']);
})->add(responds('characters_roles'))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());
