<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

// GET all
$app->get('/api/artifacts-pieces', function (Request $request, Response $response) {
    $items = DbQuery::from(genshinDb(), 'artifacts_pieces')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->includeExternal('updated_by', usersDb(), 'users', ['id', 'username'])
        ->orderBy('id')
        ->fetchAll();
    return respondJson($response, $items);
})->add(responds('artifacts_pieces', list: true));

// GET single
$app->get('/api/artifacts-pieces/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $item = DbQuery::from(genshinDb(), 'artifacts_pieces')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->includeExternal('updated_by', usersDb(), 'users', ['id', 'username'])
        ->find(['id' => $args['id']]);
    return $item
        ? respondJson($response, $item)
        : respondJson($response, ['error' => 'Not found'], 404);
})->add(responds('artifacts_pieces'));

// POST create
$app->post('/api/artifacts-pieces', function (Request $request, Response $response) {
    $user = $request->getAttribute('user');
    $pdo = genshinDb();
    $body = $request->getParsedBody() ?? [];
    resolveAssetBody($pdo, 'artifacts_pieces', $body, $user['id']);
    $id = DbQuery::insert($pdo, 'artifacts_pieces', [
        ...ArtifactPiece::fromBody($body)->toDbArray(),
        'created_by' => $user['id'],
    ]);
    $result = DbQuery::from($pdo, 'artifacts_pieces')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->find(['id' => $id]);
    return respondJson($response, $result, 201);
})->add(responds('artifacts_pieces'))->add(validateRequest(ArtifactPiece::class))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

// PUT update
$app->put('/api/artifacts-pieces/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $user = $request->getAttribute('user');
    $pdo = genshinDb();
    if (!DbQuery::from($pdo, 'artifacts_pieces')->find(['id' => $args['id'], 'deleted' => false])) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }
    $body = $request->getParsedBody() ?? [];
    resolveAssetBody($pdo, 'artifacts_pieces', $body, $user['id']);
    DbQuery::update($pdo, 'artifacts_pieces', [
        ...ArtifactPiece::partialToDbArray($body),
        'updated_by' => $user['id'],
    ], $args['id']);
    $result = DbQuery::from($pdo, 'artifacts_pieces')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->includeExternal('updated_by', usersDb(), 'users', ['id', 'username'])
        ->find(['id' => $args['id']]);
    return respondJson($response, $result);
})->add(responds('artifacts_pieces'))->add(validateRequest(ArtifactPiece::class, true))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

// DELETE
$app->delete('/api/artifacts-pieces/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();
    if (!DbQuery::from($pdo, 'artifacts_pieces')->find(['id' => $args['id'], 'deleted' => false])) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }
    DbQuery::update($pdo, 'artifacts_pieces', ['deleted' => true], $args['id']);
    return respondJson($response, ['message' => 'Deleted successfully']);
})->add(responds('artifacts_pieces'))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());
