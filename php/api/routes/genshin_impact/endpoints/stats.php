<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

// GET all stats
$app->get('/api/stats', function (Request $request, Response $response) {
    $stmt = genshinDb()->query('SELECT * FROM stats ORDER BY name ASC');
    return respondJson($response, $stmt->fetchAll());
});

// GET single stat
$app->get('/api/stats/{id}', function (Request $request, Response $response, array $args) {
    $stmt = genshinDb()->prepare('SELECT * FROM stats WHERE id = ?');
    $stmt->execute([$args['id']]);
    $item = $stmt->fetch();

    return $item
        ? respondJson($response, $item)
        : respondJson($response, ['error' => 'Not found'], 404);
});

// POST create stat
$app->post('/api/stats', function (Request $request, Response $response) {
    $pdo = genshinDb();
    $id  = DbQuery::insert($pdo, 'stats', Stat::fromBody($request->getParsedBody())->toDbArray());

    $stmt = $pdo->prepare('SELECT * FROM stats WHERE id = ?');
    $stmt->execute([$id]);
    return respondJson($response, $stmt->fetch(), 201);
})->add(validateRequest(Stat::class))->add(requireRole('admin', 'editor'))->add(requireAuth());

// PUT update stat
$app->put('/api/stats/{id}', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();

    $stmt = $pdo->prepare('SELECT id FROM stats WHERE id = ?');
    $stmt->execute([$args['id']]);
    if (!$stmt->fetch()) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    DbQuery::update($pdo, 'stats', Stat::partialToDbArray($request->getParsedBody()), $args['id']);

    $stmt = $pdo->prepare('SELECT * FROM stats WHERE id = ?');
    $stmt->execute([$args['id']]);
    return respondJson($response, $stmt->fetch());
})->add(validateRequest(Stat::class, true))->add(requireRole('admin', 'editor'))->add(requireAuth());

// DELETE stat
$app->delete('/api/stats/{id}', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();

    $stmt = $pdo->prepare('SELECT id FROM stats WHERE id = ?');
    $stmt->execute([$args['id']]);
    if (!$stmt->fetch()) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    $pdo->prepare('DELETE FROM stats WHERE id = ?')->execute([$args['id']]);
    return respondJson($response, ['message' => 'Deleted successfully']);
})->add(requireRole('admin', 'editor'))->add(requireAuth());
