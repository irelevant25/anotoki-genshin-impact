<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

// GET all
$app->get('/api/artifacts', function (Request $request, Response $response) {
    $items = DbQuery::from(genshinDb(), 'artifacts')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->includeExternal('updated_by', usersDb(), 'users', ['id', 'username'])
        ->orderBy('name')
        ->fetchAll();
    return respondJson($response, $items);
})->add(responds('artifacts', list: true));

// GET single
$app->get('/api/artifacts/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $item = DbQuery::from(genshinDb(), 'artifacts')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->includeExternal('updated_by', usersDb(), 'users', ['id', 'username'])
        ->find(['id' => $args['id']]);
    return $item
        ? respondJson($response, $item)
        : respondJson($response, ['error' => 'Not found'], 404);
})->add(responds('artifacts'));

// POST create
$app->post('/api/artifacts', function (Request $request, Response $response) {
    $user = $request->getAttribute('user');
    $pdo = genshinDb();
    $body = $request->getParsedBody() ?? [];
    resolveAssetBody($pdo, 'artifacts', $body, $user['id']);
    $id = DbQuery::insert($pdo, 'artifacts', [
        ...Artifact::fromBody($body)->toDbArray(),
        'created_by' => $user['id'],
    ]);
    $result = DbQuery::from($pdo, 'artifacts')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->find(['id' => $id]);
    return respondJson($response, $result, 201);
})->add(responds('artifacts'))->add(validateRequest(Artifact::class))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

// PUT update
$app->put('/api/artifacts/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $user = $request->getAttribute('user');
    $pdo = genshinDb();
    if (!DbQuery::from($pdo, 'artifacts')->find(['id' => $args['id'], 'deleted' => false])) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }
    $body = $request->getParsedBody() ?? [];
    resolveAssetBody($pdo, 'artifacts', $body, $user['id']);
    DbQuery::update($pdo, 'artifacts', [
        ...Artifact::partialToDbArray($body),
        'updated_by' => $user['id'],
    ], $args['id']);
    $result = DbQuery::from($pdo, 'artifacts')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->includeExternal('updated_by', usersDb(), 'users', ['id', 'username'])
        ->find(['id' => $args['id']]);
    return respondJson($response, $result);
})->add(responds('artifacts'))->add(validateRequest(Artifact::class, true))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

// DELETE
$app->delete('/api/artifacts/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();
    if (!DbQuery::from($pdo, 'artifacts')->find(['id' => $args['id'], 'deleted' => false])) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }
    DbQuery::update($pdo, 'artifacts', ['deleted' => true], $args['id']);
    return respondJson($response, ['message' => 'Deleted successfully']);
})->add(responds('artifacts'))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());
