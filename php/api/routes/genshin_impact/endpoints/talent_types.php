<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

$app->get('/api/talent-types', function (Request $request, Response $response) {
    $stmt = genshinDb()->query('SELECT * FROM talent_types ORDER BY name ASC');
    return respondJson($response, $stmt->fetchAll());
});

$app->get('/api/talent-types/{name}', function (Request $request, Response $response, array $args) {
    $stmt = genshinDb()->prepare('SELECT * FROM talent_types WHERE name = ?');
    $stmt->execute([$args['name']]);
    $item = $stmt->fetch();
    return $item
        ? respondJson($response, $item)
        : respondJson($response, ['error' => 'Not found'], 404);
});

$app->post('/api/talent-types', function (Request $request, Response $response) {
    $pdo = genshinDb();
    $body = $request->getParsedBody();
    $pdo->prepare('INSERT INTO talent_types (name) VALUES (?)')->execute([$body['name']]);
    $stmt = $pdo->prepare('SELECT * FROM talent_types WHERE name = ?');
    $stmt->execute([$body['name']]);
    return respondJson($response, $stmt->fetch(), 201);
})->add(validateRequest(TalentType::class))->add(requireRole('ADMIN', 'EDITOR'))->add(requireAuth());

$app->delete('/api/talent-types/{name}', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();
    $stmt = $pdo->prepare('SELECT name FROM talent_types WHERE name = ?');
    $stmt->execute([$args['name']]);
    if (!$stmt->fetch()) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }
    $pdo->prepare('DELETE FROM talent_types WHERE name = ?')->execute([$args['name']]);
    return respondJson($response, ['message' => 'Deleted successfully']);
})->add(requireRole('ADMIN', 'EDITOR'))->add(requireAuth());
