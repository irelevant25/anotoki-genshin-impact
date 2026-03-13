<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

// GET all migrations
$app->get('/api/migrations', function (Request $request, Response $response) {
    $stmt = genshinDb()->query('SELECT * FROM migrations ORDER BY applied_at ASC');
    return respondJson($response, $stmt->fetchAll());
})->add(requireRole('admin'))->add(requireAuth());

// GET single migration
$app->get('/api/migrations/{id}', function (Request $request, Response $response, array $args) {
    $stmt = genshinDb()->prepare('SELECT * FROM migrations WHERE id = ?');
    $stmt->execute([$args['id']]);
    $item = $stmt->fetch();

    return $item
        ? respondJson($response, $item)
        : respondJson($response, ['error' => 'Not found'], 404);
})->add(requireRole('admin'))->add(requireAuth());
