<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

// GET all quiz states (admin only)
$app->get('/api/quiz-states', function (Request $request, Response $response) {
    $stmt = genshinDb()->query('SELECT * FROM quizzes_states ORDER BY created_at DESC');
    return respondJson($response, $stmt->fetchAll());
})->add(requireRole('admin'))->add(requireAuth());

// GET single quiz state by composite key
$app->get('/api/quiz-states/{user_id}/{quiz_id}', function (Request $request, Response $response, array $args) {
    $stmt = genshinDb()->prepare('SELECT * FROM quizzes_states WHERE user_id = ? AND quiz_id = ?');
    $stmt->execute([$args['user_id'], $args['quiz_id']]);
    $item = $stmt->fetch();

    return $item
        ? respondJson($response, $item)
        : respondJson($response, ['error' => 'Not found'], 404);
})->add(requireAuth());

// POST create quiz state
$app->post('/api/quiz-states', function (Request $request, Response $response) {
    $pdo  = genshinDb();
    $data = array_filter(QuizState::fromBody($request->getParsedBody())->toDbArray(), fn($v) => $v !== null);

    $stmt = $pdo->prepare('SELECT user_id FROM quizzes_states WHERE user_id = ? AND quiz_id = ?');
    $stmt->execute([$data['user_id'], $data['quiz_id']]);
    if ($stmt->fetch()) {
        return respondJson($response, ['error' => 'Quiz state already exists'], 409);
    }

    DbQuery::insert($pdo, 'quizzes_states', $data);

    $stmt = $pdo->prepare('SELECT * FROM quizzes_states WHERE user_id = ? AND quiz_id = ?');
    $stmt->execute([$data['user_id'], $data['quiz_id']]);
    return respondJson($response, $stmt->fetch(), 201);
})->add(validateRequest(QuizState::class))->add(requireAuth());

// PUT update quiz state by composite key
$app->put('/api/quiz-states/{user_id}/{quiz_id}', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();

    $stmt = $pdo->prepare('SELECT user_id FROM quizzes_states WHERE user_id = ? AND quiz_id = ?');
    $stmt->execute([$args['user_id'], $args['quiz_id']]);
    if (!$stmt->fetch()) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    $data = QuizState::partialToDbArray($request->getParsedBody());
    $sets = implode(', ', array_map(fn($col) => "$col = ?", array_keys($data)));
    $pdo->prepare("UPDATE quizzes_states SET $sets WHERE user_id = ? AND quiz_id = ?")
        ->execute([...array_values($data), $args['user_id'], $args['quiz_id']]);

    $stmt = $pdo->prepare('SELECT * FROM quizzes_states WHERE user_id = ? AND quiz_id = ?');
    $stmt->execute([$args['user_id'], $args['quiz_id']]);
    return respondJson($response, $stmt->fetch());
})->add(validateRequest(QuizState::class, true))->add(requireAuth());

// DELETE quiz state by composite key
$app->delete('/api/quiz-states/{user_id}/{quiz_id}', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();

    $stmt = $pdo->prepare('SELECT user_id FROM quizzes_states WHERE user_id = ? AND quiz_id = ?');
    $stmt->execute([$args['user_id'], $args['quiz_id']]);
    if (!$stmt->fetch()) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    $pdo->prepare('DELETE FROM quizzes_states WHERE user_id = ? AND quiz_id = ?')
        ->execute([$args['user_id'], $args['quiz_id']]);
    return respondJson($response, ['message' => 'Deleted successfully']);
})->add(requireAuth());
