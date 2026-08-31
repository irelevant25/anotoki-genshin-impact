<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

// A saved game is identified by three things, not two: the daily run and the
// ordinary one are separate games of the same quiz, and since the primary key
// took `is_daily` in, (user_id, quiz_id) no longer names a single row. These
// routes keep their URLs and read the flag from `?daily=1`, defaulting to the
// ordinary game.
function quizStateIsDaily(Request $request): int
{
    return (int) in_array($request->getQueryParams()['daily'] ?? '0', ['1', 'true'], true);
}

// GET all quiz states (admin only)
$app->get('/api/quiz-states', function (Request $request, Response $response) {
    $stmt = genshinDb()->query('SELECT * FROM quizzes_states ORDER BY created_at DESC');
    return respondJson($response, $stmt->fetchAll());
})->add(requireRole(...ROLES_SYSTEM_READ))->add(requireAuth());

// GET single quiz state by composite key
$app->get('/api/quiz-states/{user_id}/{quiz_id}', function (Request $request, Response $response, array $args) {
    $stmt = genshinDb()->prepare('SELECT * FROM quizzes_states WHERE user_id = ? AND quiz_id = ? AND is_daily = ?');
    $stmt->execute([$args['user_id'], $args['quiz_id'], quizStateIsDaily($request)]);
    $item = $stmt->fetch();

    return $item
        ? respondJson($response, $item)
        : respondJson($response, ['error' => 'Not found'], 404);
})->add(requireSelfOrAdmin('user_id'))->add(requireAuth());

// POST create quiz state
$app->post('/api/quiz-states', function (Request $request, Response $response) {
    $pdo  = genshinDb();
    $data = array_filter(QuizState::fromBody($request->getParsedBody())->toDbArray(), fn($v) => $v !== null);

    // The body says whose progress this is; the token says who is asking.
    if ($refusal = refuseForeignUserId($request, $data['user_id'] ?? null)) {
        return respondJson($response, ['error' => $refusal], $refusal === 'user_id is required' ? 422 : 403);
    }

    $stmt = $pdo->prepare('SELECT user_id FROM quizzes_states WHERE user_id = ? AND quiz_id = ? AND is_daily = ?');
    $stmt->execute([$data['user_id'], $data['quiz_id'], (int) ($data['is_daily'] ?? false)]);
    if ($stmt->fetch()) {
        return respondJson($response, ['error' => 'Quiz state already exists'], 409);
    }

    // A plain insert rather than DbQuery::insert: that helper ends its statement
    // with RETURNING id, and this table is keyed on its columns rather than on a
    // serial, so there is no id to return.
    $columns = implode(', ', array_map(fn($column) => '"' . $column . '"', array_keys($data)));
    $placeholders = implode(', ', array_fill(0, count($data), '?'));
    $pdo->prepare("INSERT INTO quizzes_states ($columns) VALUES ($placeholders)")
        ->execute(array_map(fn($value) => is_bool($value) ? (int) $value : $value, array_values($data)));

    $stmt = $pdo->prepare('SELECT * FROM quizzes_states WHERE user_id = ? AND quiz_id = ? AND is_daily = ?');
    $stmt->execute([$data['user_id'], $data['quiz_id'], (int) ($data['is_daily'] ?? false)]);
    return respondJson($response, $stmt->fetch(), 201);
})->add(validateRequest(QuizState::class))->add(requireAuth());

// PUT update quiz state by composite key
$app->put('/api/quiz-states/{user_id}/{quiz_id}', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();

    $isDaily = quizStateIsDaily($request);

    $stmt = $pdo->prepare('SELECT user_id FROM quizzes_states WHERE user_id = ? AND quiz_id = ? AND is_daily = ?');
    $stmt->execute([$args['user_id'], $args['quiz_id'], $isDaily]);
    if (!$stmt->fetch()) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    $data = QuizState::partialToDbArray($request->getParsedBody());
    $sets = implode(', ', array_map(fn($col) => "$col = ?", array_keys($data)));
    $pdo->prepare("UPDATE quizzes_states SET $sets WHERE user_id = ? AND quiz_id = ? AND is_daily = ?")
        ->execute([...array_values($data), $args['user_id'], $args['quiz_id'], $isDaily]);

    $stmt = $pdo->prepare('SELECT * FROM quizzes_states WHERE user_id = ? AND quiz_id = ? AND is_daily = ?');
    $stmt->execute([$args['user_id'], $args['quiz_id'], $isDaily]);
    return respondJson($response, $stmt->fetch());
})->add(validateRequest(QuizState::class, true))->add(requireSelfOrAdmin('user_id'))->add(requireAuth());

// DELETE quiz state by composite key
$app->delete('/api/quiz-states/{user_id}/{quiz_id}', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();

    $isDaily = quizStateIsDaily($request);

    $stmt = $pdo->prepare('SELECT user_id FROM quizzes_states WHERE user_id = ? AND quiz_id = ? AND is_daily = ?');
    $stmt->execute([$args['user_id'], $args['quiz_id'], $isDaily]);
    if (!$stmt->fetch()) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    $pdo->prepare('DELETE FROM quizzes_states WHERE user_id = ? AND quiz_id = ? AND is_daily = ?')
        ->execute([$args['user_id'], $args['quiz_id'], $isDaily]);
    return respondJson($response, ['message' => 'Deleted successfully']);
})->add(requireSelfOrAdmin('user_id'))->add(requireAuth());
