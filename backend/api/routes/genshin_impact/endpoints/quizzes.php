<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

// GET all quizzes
$app->get('/api/quizzes', function (Request $request, Response $response) {
    $stmt = genshinDb()->query('SELECT * FROM quizzes WHERE deleted = FALSE ORDER BY name ASC');
    return respondJson($response, $stmt->fetchAll());
})->add(responds('quizzes', list: true));

// GET single quiz
$app->get('/api/quizzes/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $stmt = genshinDb()->prepare('SELECT * FROM quizzes WHERE id = ?');
    $stmt->execute([$args['id']]);
    $item = $stmt->fetch();

    return $item
        ? respondJson($response, $item)
        : respondJson($response, ['error' => 'Not found'], 404);
})->add(responds('quizzes'));

// POST create quiz
$app->post('/api/quizzes', function (Request $request, Response $response) {
    $pdo = genshinDb();
    $id = DbQuery::insert($pdo, 'quizzes', Quiz::fromBody($request->getParsedBody())->toDbArray());

    $stmt = $pdo->prepare('SELECT * FROM quizzes WHERE id = ?');
    $stmt->execute([$id]);
    return respondJson($response, $stmt->fetch(), 201);
})->add(responds('quizzes'))->add(validateRequest(Quiz::class))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

// PUT update quiz
$app->put('/api/quizzes/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();

    $stmt = $pdo->prepare('SELECT id FROM quizzes WHERE id = ? AND deleted = FALSE');
    $stmt->execute([$args['id']]);
    if (!$stmt->fetch()) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    DbQuery::update($pdo, 'quizzes', Quiz::partialToDbArray($request->getParsedBody()), $args['id']);

    $stmt = $pdo->prepare('SELECT * FROM quizzes WHERE id = ?');
    $stmt->execute([$args['id']]);
    return respondJson($response, $stmt->fetch());
})->add(responds('quizzes'))->add(validateRequest(Quiz::class, true))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

// DELETE quiz
$app->delete('/api/quizzes/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();

    $stmt = $pdo->prepare('SELECT id FROM quizzes WHERE id = ? AND deleted = FALSE');
    $stmt->execute([$args['id']]);
    if (!$stmt->fetch()) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    DbQuery::update($pdo, 'quizzes', ['deleted' => true], $args['id']);
    return respondJson($response, ['message' => 'Deleted successfully']);
})->add(responds('quizzes'))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());
