<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

$app->get('/api/enemy-families', function (Request $request, Response $response) {
    $stmt = genshinDb()->query('SELECT * FROM enemy_families ORDER BY name ASC');
    return respondJson($response, $stmt->fetchAll());
})->add(responds('enemy_families', list: true));

$app->get('/api/enemy-families/{name}', function (Request $request, Response $response, array $args) {
    $stmt = genshinDb()->prepare('SELECT * FROM enemy_families WHERE name = ?');
    $stmt->execute([$args['name']]);
    $item = $stmt->fetch();
    return $item
        ? respondJson($response, $item)
        : respondJson($response, ['error' => 'Not found'], 404);
})->add(responds('enemy_families'));

$app->post('/api/enemy-families', function (Request $request, Response $response) {
    $pdo = genshinDb();
    $body = $request->getParsedBody();
    $pdo->prepare('INSERT INTO enemy_families (name) VALUES (?)')->execute([$body['name']]);
    $stmt = $pdo->prepare('SELECT * FROM enemy_families WHERE name = ?');
    $stmt->execute([$body['name']]);
    return respondJson($response, $stmt->fetch(), 201);
})->add(responds('enemy_families'))->add(validateRequest(EnemyFamily::class))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

$app->delete('/api/enemy-families/{name}', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();
    $stmt = $pdo->prepare('SELECT name FROM enemy_families WHERE name = ?');
    $stmt->execute([$args['name']]);
    if (!$stmt->fetch()) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }
    $pdo->prepare('DELETE FROM enemy_families WHERE name = ?')->execute([$args['name']]);
    return respondJson($response, ['message' => 'Deleted successfully']);
})->add(responds('enemy_families'))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());
