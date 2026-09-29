<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

$app->get('/api/food-types', function (Request $request, Response $response) {
    $stmt = genshinDb()->query('SELECT * FROM food_types ORDER BY name ASC');
    return respondJson($response, $stmt->fetchAll());
})->add(responds('food_types', list: true));

$app->get('/api/food-types/{name}', function (Request $request, Response $response, array $args) {
    $stmt = genshinDb()->prepare('SELECT * FROM food_types WHERE name = ?');
    $stmt->execute([$args['name']]);
    $item = $stmt->fetch();
    return $item
        ? respondJson($response, $item)
        : respondJson($response, ['error' => 'Not found'], 404);
})->add(responds('food_types'));

$app->post('/api/food-types', function (Request $request, Response $response) {
    $pdo = genshinDb();
    $body = $request->getParsedBody();
    $pdo->prepare('INSERT INTO food_types (name) VALUES (?)')->execute([$body['name']]);
    $stmt = $pdo->prepare('SELECT * FROM food_types WHERE name = ?');
    $stmt->execute([$body['name']]);
    return respondJson($response, $stmt->fetch(), 201);
})->add(responds('food_types'))->add(validateRequest(FoodType::class))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

$app->delete('/api/food-types/{name}', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();
    $stmt = $pdo->prepare('SELECT name FROM food_types WHERE name = ?');
    $stmt->execute([$args['name']]);
    if (!$stmt->fetch()) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }
    $pdo->prepare('DELETE FROM food_types WHERE name = ?')->execute([$args['name']]);
    return respondJson($response, ['message' => 'Deleted successfully']);
})->add(responds('food_types'))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());
