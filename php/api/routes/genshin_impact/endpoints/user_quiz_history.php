<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

// GET all user quiz history (admin only)
$app->get('/api/user-quiz-history', function (Request $request, Response $response) {
    $stmt = genshinDb()->query('SELECT * FROM user_quiz_history ORDER BY created_at DESC');
    return respondJson($response, $stmt->fetchAll());
})->add(responds('user_quiz_history', list: true))->add(requireRole(...ROLES_SYSTEM_READ))->add(requireAuth());

// GET single user quiz history entry
$app->get('/api/user-quiz-history/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $stmt = genshinDb()->prepare('SELECT * FROM user_quiz_history WHERE id = ?');
    $stmt->execute([$args['id']]);
    $item = $stmt->fetch();

    if (!$item) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    // Keyed by its own id rather than by the owner, so the row has to be read
    // before it can be told whether the reader is entitled to it.
    if ($refusal = refuseForeignUserId($request, $item['user_id'] ?? null)) {
        return respondJson($response, ['error' => $refusal], 403);
    }

    return respondJson($response, $item);
})->add(responds('user_quiz_history'))->add(requireAuth());

// POST create user quiz history entry
$app->post('/api/user-quiz-history', function (Request $request, Response $response) {
    $pdo = genshinDb();
    $data = UserQuizHistory::fromBody($request->getParsedBody())->toDbArray();

    // The body says whose history this is; the token says who is asking.
    if ($refusal = refuseForeignUserId($request, $data['user_id'] ?? null)) {
        return respondJson($response, ['error' => $refusal], $refusal === 'user_id is required' ? 422 : 403);
    }

    $id = DbQuery::insert($pdo, 'user_quiz_history', $data);

    $stmt = $pdo->prepare('SELECT * FROM user_quiz_history WHERE id = ?');
    $stmt->execute([$id]);
    return respondJson($response, $stmt->fetch(), 201);
})->add(responds('user_quiz_history'))->add(validateRequest(UserQuizHistory::class))->add(requireAuth());

// DELETE user quiz history entry
$app->delete('/api/user-quiz-history/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();

    $stmt = $pdo->prepare('SELECT id FROM user_quiz_history WHERE id = ?');
    $stmt->execute([$args['id']]);
    if (!$stmt->fetch()) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    $pdo->prepare('DELETE FROM user_quiz_history WHERE id = ?')->execute([$args['id']]);
    return respondJson($response, ['message' => 'Deleted successfully']);
})->add(responds('user_quiz_history'))->add(requireRole(...ROLES_SYSTEM_WRITE))->add(requireAuth());
