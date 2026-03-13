<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

// GET all user quiz history (admin only)
$app->get('/api/user-quiz-history', function (Request $request, Response $response) {
    $stmt = genshinDb()->query('SELECT * FROM user_quiz_history ORDER BY created_at DESC');
    return respondJson($response, $stmt->fetchAll());
})->add(requireRole('admin'))->add(requireAuth());

// GET single user quiz history entry
$app->get('/api/user-quiz-history/{id}', function (Request $request, Response $response, array $args) {
    $stmt = genshinDb()->prepare('SELECT * FROM user_quiz_history WHERE id = ?');
    $stmt->execute([$args['id']]);
    $item = $stmt->fetch();

    return $item
        ? respondJson($response, $item)
        : respondJson($response, ['error' => 'Not found'], 404);
})->add(requireAuth());

// POST create user quiz history entry
$app->post('/api/user-quiz-history', function (Request $request, Response $response) {
    $pdo = genshinDb();
    $id  = DbQuery::insert($pdo, 'user_quiz_history', UserQuizHistory::fromBody($request->getParsedBody())->toDbArray());

    $stmt = $pdo->prepare('SELECT * FROM user_quiz_history WHERE id = ?');
    $stmt->execute([$id]);
    return respondJson($response, $stmt->fetch(), 201);
})->add(validateRequest(UserQuizHistory::class))->add(requireAuth());

// DELETE user quiz history entry
$app->delete('/api/user-quiz-history/{id}', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();

    $stmt = $pdo->prepare('SELECT id FROM user_quiz_history WHERE id = ?');
    $stmt->execute([$args['id']]);
    if (!$stmt->fetch()) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    $pdo->prepare('DELETE FROM user_quiz_history WHERE id = ?')->execute([$args['id']]);
    return respondJson($response, ['message' => 'Deleted successfully']);
})->add(requireRole('admin'))->add(requireAuth());
