<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/** Raw SQL here rather than DbQuery, so its own resolve step never runs. */
function _backgroundRow(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare('SELECT * FROM backgrounds WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) {
        return null;
    }
    $rows = [$row];
    resolveAssetRows($pdo, 'backgrounds', $rows);
    return $rows[0];
}

// GET all backgrounds
$app->get('/api/backgrounds', function (Request $request, Response $response) {
    $stmt = genshinDb()->query('SELECT * FROM backgrounds WHERE deleted = FALSE ORDER BY name ASC');
    $rows = $stmt->fetchAll();
    resolveAssetRows(genshinDb(), 'backgrounds', $rows);
    return respondJson($response, $rows);
})->add(responds('backgrounds', list: true));

// GET single background
$app->get('/api/backgrounds/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $item = _backgroundRow(genshinDb(), (int) $args['id']);

    return $item
        ? respondJson($response, $item)
        : respondJson($response, ['error' => 'Not found'], 404);
})->add(responds('backgrounds'));

// POST create background
$app->post('/api/backgrounds', function (Request $request, Response $response) {
    $user = $request->getAttribute('user');
    $pdo = genshinDb();
    $body = $request->getParsedBody() ?? [];
    resolveAssetBody($pdo, 'backgrounds', $body, $user['id']);
    $id = DbQuery::insert($pdo, 'backgrounds', [
        ...Background::fromBody($body)->toDbArray(),
        'created_by' => $user['id'],
    ]);

    return respondJson($response, _backgroundRow($pdo, (int) $id), 201);
})->add(responds('backgrounds'))->add(validateRequest(Background::class))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

// PUT update background
$app->put('/api/backgrounds/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $user = $request->getAttribute('user');
    $pdo = genshinDb();

    $stmt = $pdo->prepare('SELECT id FROM backgrounds WHERE id = ? AND deleted = FALSE');
    $stmt->execute([$args['id']]);
    if (!$stmt->fetch()) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    $body = $request->getParsedBody() ?? [];
    resolveAssetBody($pdo, 'backgrounds', $body, $user['id']);
    DbQuery::update($pdo, 'backgrounds', [
        ...Background::partialToDbArray($body),
        'updated_by' => $user['id'],
    ], $args['id']);

    return respondJson($response, _backgroundRow($pdo, (int) $args['id']));
})->add(responds('backgrounds'))->add(validateRequest(Background::class, true))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

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
})->add(responds('backgrounds'))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());
