<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

// GET all backgrounds
$app->get('/api/backgrounds', function (Request $request, Response $response) {
    $stmt = genshinDb()->query('SELECT * FROM backgrounds WHERE deleted = FALSE ORDER BY name ASC');
    return respondJson($response, $stmt->fetchAll());
});

// GET single background
$app->get('/api/backgrounds/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $stmt = genshinDb()->prepare('SELECT * FROM backgrounds WHERE id = ?');
    $stmt->execute([$args['id']]);
    $item = $stmt->fetch();

    return $item
        ? respondJson($response, $item)
        : respondJson($response, ['error' => 'Not found'], 404);
});

// POST create background
$app->post('/api/backgrounds', function (Request $request, Response $response) {
    $user = $request->getAttribute('user');
    $pdo = genshinDb();
    $id = DbQuery::insert($pdo, 'backgrounds', [
        ...Background::fromBody($request->getParsedBody())->toDbArray(),
        'created_by' => $user['id'],
    ]);

    $stmt = $pdo->prepare('SELECT * FROM backgrounds WHERE id = ?');
    $stmt->execute([$id]);
    return respondJson($response, $stmt->fetch(), 201);
})->add(validateRequest(Background::class))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

// PUT update background
$app->put('/api/backgrounds/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $user = $request->getAttribute('user');
    $pdo = genshinDb();

    $stmt = $pdo->prepare('SELECT id FROM backgrounds WHERE id = ? AND deleted = FALSE');
    $stmt->execute([$args['id']]);
    if (!$stmt->fetch()) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    DbQuery::update($pdo, 'backgrounds', [
        ...Background::partialToDbArray($request->getParsedBody()),
        'updated_by' => $user['id'],
    ], $args['id']);

    $stmt = $pdo->prepare('SELECT * FROM backgrounds WHERE id = ?');
    $stmt->execute([$args['id']]);
    return respondJson($response, $stmt->fetch());
})->add(validateRequest(Background::class, true))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

// DELETE background
$app->delete('/api/backgrounds/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();

    $stmt = $pdo->prepare('SELECT id FROM backgrounds WHERE id = ? AND deleted = FALSE');
    $stmt->execute([$args['id']]);
    if (!$stmt->fetch()) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    DbQuery::update($pdo, 'backgrounds', ['deleted' => true], $args['id']);
    return respondJson($response, ['message' => 'Deleted successfully']);
})->add(requireRole(...ROLES_CONTENT))->add(requireAuth());
