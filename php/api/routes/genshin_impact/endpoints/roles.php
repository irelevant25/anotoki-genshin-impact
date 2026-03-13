<?php

use GenshinImpact\Role;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

// GET all roles
$app->get('/api/roles', function (Request $request, Response $response) {
    $stmt = genshinDb()->query('SELECT * FROM roles ORDER BY name ASC');
    return respondJson($response, $stmt->fetchAll());
});

// GET single role
$app->get('/api/roles/{name}', function (Request $request, Response $response, array $args) {
    $stmt = genshinDb()->prepare('SELECT * FROM roles WHERE name = ?');
    $stmt->execute([$args['name']]);
    $item = $stmt->fetch();

    return $item
        ? respondJson($response, $item)
        : respondJson($response, ['error' => 'Not found'], 404);
});

// POST create role
$app->post('/api/roles', function (Request $request, Response $response) {
    $pdo = genshinDb();
    DbQuery::insert($pdo, 'roles', Role::fromBody($request->getParsedBody())->toDbArray());

    $stmt = $pdo->prepare('SELECT * FROM roles WHERE name = ?');
    $stmt->execute([$request->getParsedBody()['name']]);
    return respondJson($response, $stmt->fetch(), 201);
})->add(validateRequest(Role::class))->add(requireRole('ADMIN', 'EDITOR'))->add(requireAuth());

// DELETE role
$app->delete('/api/roles/{name}', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();

    $stmt = $pdo->prepare('SELECT name FROM roles WHERE name = ?');
    $stmt->execute([$args['name']]);
    if (!$stmt->fetch()) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    $pdo->prepare('DELETE FROM roles WHERE name = ?')->execute([$args['name']]);
    return respondJson($response, ['message' => 'Deleted successfully']);
})->add(requireRole('ADMIN', 'EDITOR'))->add(requireAuth());
