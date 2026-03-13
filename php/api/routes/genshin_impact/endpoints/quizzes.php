<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

// GET all quizzes
$app->get('/api/quizzes', function (Request $request, Response $response) {
    $stmt = genshinDb()->query('SELECT * FROM quizzes WHERE deleted = 0 ORDER BY name ASC');
    return respondJson($response, $stmt->fetchAll());
});

// GET single quiz
$app->get('/api/quizzes/{id}', function (Request $request, Response $response, array $args) {
    $stmt = genshinDb()->prepare('SELECT * FROM quizzes WHERE id = ?');
    $stmt->execute([$args['id']]);
    $item = $stmt->fetch();

    return $item
        ? respondJson($response, $item)
        : respondJson($response, ['error' => 'Not found'], 404);
});

// POST create quiz
$app->post('/api/quizzes', function (Request $request, Response $response) {
    $pdo = genshinDb();
    $id  = DbQuery::insert($pdo, 'quizzes', Quiz::fromBody($request->getParsedBody())->toDbArray());

    $stmt = $pdo->prepare('SELECT * FROM quizzes WHERE id = ?');
    $stmt->execute([$id]);
    return respondJson($response, $stmt->fetch(), 201);
})->add(validateRequest(Quiz::class))->add(requireRole('admin', 'editor'))->add(requireAuth());

// PUT update quiz
$app->put('/api/quizzes/{id}', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();

    $stmt = $pdo->prepare('SELECT id FROM quizzes WHERE id = ? AND deleted = 0');
    $stmt->execute([$args['id']]);
    if (!$stmt->fetch()) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    DbQuery::update($pdo, 'quizzes', Quiz::partialToDbArray($request->getParsedBody()), $args['id']);

    $stmt = $pdo->prepare('SELECT * FROM quizzes WHERE id = ?');
    $stmt->execute([$args['id']]);
    return respondJson($response, $stmt->fetch());
})->add(validateRequest(Quiz::class, true))->add(requireRole('admin', 'editor'))->add(requireAuth());

// DELETE quiz
$app->delete('/api/quizzes/{id}', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();

    $stmt = $pdo->prepare('SELECT id FROM quizzes WHERE id = ? AND deleted = 0');
    $stmt->execute([$args['id']]);
    if (!$stmt->fetch()) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    DbQuery::update($pdo, 'quizzes', ['deleted' => true], $args['id']);
    return respondJson($response, ['message' => 'Deleted successfully']);
})->add(requireRole('admin', 'editor'))->add(requireAuth());
