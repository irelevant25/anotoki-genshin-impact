<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

$app->get('/api/relationship-types', function (Request $request, Response $response) {
    $stmt = genshinDb()->query('SELECT * FROM relationship_types ORDER BY name ASC');
    return respondJson($response, $stmt->fetchAll());
})->add(responds('relationship_types', list: true));

$app->get('/api/relationship-types/{name}', function (Request $request, Response $response, array $args) {
    $stmt = genshinDb()->prepare('SELECT * FROM relationship_types WHERE name = ?');
    $stmt->execute([$args['name']]);
    $item = $stmt->fetch();
    return $item
        ? respondJson($response, $item)
        : respondJson($response, ['error' => 'Not found'], 404);
})->add(responds('relationship_types'));

$app->post('/api/relationship-types', function (Request $request, Response $response) {
    $pdo = genshinDb();
    $body = $request->getParsedBody();
    $pdo->prepare('INSERT INTO relationship_types (name) VALUES (?)')->execute([$body['name']]);
    $stmt = $pdo->prepare('SELECT * FROM relationship_types WHERE name = ?');
    $stmt->execute([$body['name']]);
    return respondJson($response, $stmt->fetch(), 201);
})->add(responds('relationship_types'))->add(validateRequest(RelationshipType::class))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

$app->delete('/api/relationship-types/{name}', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();
    $stmt = $pdo->prepare('SELECT name FROM relationship_types WHERE name = ?');
    $stmt->execute([$args['name']]);
    if (!$stmt->fetch()) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }
    $pdo->prepare('DELETE FROM relationship_types WHERE name = ?')->execute([$args['name']]);
    return respondJson($response, ['message' => 'Deleted successfully']);
})->add(responds('relationship_types'))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());
