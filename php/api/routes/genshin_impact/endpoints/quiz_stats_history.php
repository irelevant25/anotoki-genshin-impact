<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

// GET all quiz stats history (admin only)
$app->get('/api/quiz-stats-history', function (Request $request, Response $response) {
    $stmt = genshinDb()->query('SELECT * FROM quiz_stats_history ORDER BY created_at DESC');
    return respondJson($response, $stmt->fetchAll());
})->add(requireRole('admin'))->add(requireAuth());

// GET single quiz stats history entry by composite key
$app->get('/api/quiz-stats-history/{user_id}/{character_id}/{quiz_id}', function (Request $request, Response $response, array $args) {
    $stmt = genshinDb()->prepare('SELECT * FROM quiz_stats_history WHERE user_id = ? AND character_id = ? AND quiz_id = ?');
    $stmt->execute([$args['user_id'], $args['character_id'], $args['quiz_id']]);
    $item = $stmt->fetch();

    return $item
        ? respondJson($response, $item)
        : respondJson($response, ['error' => 'Not found'], 404);
})->add(requireAuth());

// POST create quiz stats history entry
$app->post('/api/quiz-stats-history', function (Request $request, Response $response) {
    $pdo  = genshinDb();
    $data = QuizStatsHistory::fromBody($request->getParsedBody())->toDbArray();

    $stmt = $pdo->prepare('SELECT user_id FROM quiz_stats_history WHERE user_id = ? AND character_id = ? AND quiz_id = ?');
    $stmt->execute([$data['user_id'], $data['character_id'], $data['quiz_id']]);
    if ($stmt->fetch()) {
        return respondJson($response, ['error' => 'Entry already exists'], 409);
    }

    DbQuery::insert($pdo, 'quiz_stats_history', $data);

    $stmt = $pdo->prepare('SELECT * FROM quiz_stats_history WHERE user_id = ? AND character_id = ? AND quiz_id = ?');
    $stmt->execute([$data['user_id'], $data['character_id'], $data['quiz_id']]);
    return respondJson($response, $stmt->fetch(), 201);
})->add(validateRequest(QuizStatsHistory::class))->add(requireAuth());

// PUT update quiz stats history entry by composite key
$app->put('/api/quiz-stats-history/{user_id}/{character_id}/{quiz_id}', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();

    $stmt = $pdo->prepare('SELECT user_id FROM quiz_stats_history WHERE user_id = ? AND character_id = ? AND quiz_id = ?');
    $stmt->execute([$args['user_id'], $args['character_id'], $args['quiz_id']]);
    if (!$stmt->fetch()) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    $data = QuizStatsHistory::partialToDbArray($request->getParsedBody());
    $sets = implode(', ', array_map(fn($col) => "$col = ?", array_keys($data)));
    $pdo->prepare("UPDATE quiz_stats_history SET $sets WHERE user_id = ? AND character_id = ? AND quiz_id = ?")
        ->execute([...array_values($data), $args['user_id'], $args['character_id'], $args['quiz_id']]);

    $stmt = $pdo->prepare('SELECT * FROM quiz_stats_history WHERE user_id = ? AND character_id = ? AND quiz_id = ?');
    $stmt->execute([$args['user_id'], $args['character_id'], $args['quiz_id']]);
    return respondJson($response, $stmt->fetch());
})->add(validateRequest(QuizStatsHistory::class, true))->add(requireAuth());

// DELETE quiz stats history entry by composite key
$app->delete('/api/quiz-stats-history/{user_id}/{character_id}/{quiz_id}', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();

    $stmt = $pdo->prepare('SELECT user_id FROM quiz_stats_history WHERE user_id = ? AND character_id = ? AND quiz_id = ?');
    $stmt->execute([$args['user_id'], $args['character_id'], $args['quiz_id']]);
    if (!$stmt->fetch()) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    $pdo->prepare('DELETE FROM quiz_stats_history WHERE user_id = ? AND character_id = ? AND quiz_id = ?')
        ->execute([$args['user_id'], $args['character_id'], $args['quiz_id']]);
    return respondJson($response, ['message' => 'Deleted successfully']);
})->add(requireAuth());
