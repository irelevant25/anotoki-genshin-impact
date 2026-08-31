<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

// ── /api/quiz/progress and /api/quiz/result ───────────────────────────────────
//
// What a player's own quiz progress needs, as opposed to what the generic CRUD
// on quizzes_states offers.
//
// The prepared endpoints are the admin-facing shape: they take a user_id in the
// body or the path, they separate create from update, and they key on a numeric
// quiz id. Saving one guess through them would mean the browser knowing its own
// user id, knowing the numeric id of the quiz, and trying a POST to find out
// whether a PUT was needed - three round trips, and a user_id on the wire that
// the server then has to check is really yours.
//
// These take the player from the bearer token instead, address quizzes by the
// name the front end already uses, and upsert. Nothing identifying is sent, and
// there is nothing to forge: whoever the token says you are is whose progress
// you read and write.
//
// Signing in is required. A visitor who is not signed in has no row to write to,
// and keeps their game in the browser instead.

/** Maps a quiz name to its id, so a caller never has to know the number. */
function quizIdByName(PDO $pdo, string $name): ?int
{
    $statement = $pdo->prepare('SELECT id FROM quizzes WHERE name = ? AND deleted = FALSE');
    $statement->execute([$name]);
    $id = $statement->fetchColumn();

    return $id === false ? null : (int) $id;
}

// GET every saved game of mine, in one request - the site loads them together
// rather than asking again on each quiz page.
$app->get('/api/quiz/progress', function (Request $request, Response $response) {
    $user = $request->getAttribute('user');

    $statement = genshinDb()->prepare(
        'SELECT q.name AS quiz, s.state, s.is_daily, s.updated_at
           FROM quizzes_states s
           JOIN quizzes q ON q.id = s.quiz_id AND q.deleted = FALSE
          WHERE s.user_id = ?
          ORDER BY q.name'
    );
    $statement->execute([$user['id']]);

    // PDO hands a jsonb column back as text, so without this the caller would
    // get the state as a JSON string inside JSON and have to parse it again.
    $games = array_map(function (array $row): array {
        $row['state'] = $row['state'] === null ? null : json_decode($row['state'], true);
        $row['is_daily'] = (bool) $row['is_daily'];
        return $row;
    }, $statement->fetchAll(PDO::FETCH_ASSOC));

    return respondJson($response, $games);
})->add(requireAuth());

// PUT my saved game for one quiz. Upsert: a quiz is saved after every guess, and
// whether that is the first one is not something the caller should have to know.
$app->put('/api/quiz/progress/{quiz}', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();
    $user = $request->getAttribute('user');

    $quizId = quizIdByName($pdo, (string) $args['quiz']);
    if ($quizId === null) {
        return respondJson($response, ['error' => 'Unknown quiz'], 404);
    }

    $body = (array) $request->getParsedBody();
    $isDaily = !empty($body['is_daily']);

    // The state is the front end's own shape and is stored as it arrives. What
    // is in it is the browser's business - only who it belongs to is ours.
    $state = $body['state'] ?? null;
    if (!is_array($state)) {
        return respondJson($response, ['error' => 'state must be an object'], 422);
    }

    $statement = $pdo->prepare(
        'INSERT INTO quizzes_states (user_id, quiz_id, is_daily, state)
              VALUES (?, ?, ?, ?)
         ON CONFLICT (user_id, quiz_id, is_daily)
         DO UPDATE SET state = EXCLUDED.state'
    );
    // Cast: PDO sends a PHP false as an empty string, which Postgres will not
    // read as a boolean. DbQuery casts to int for the same reason.
    $statement->execute([$user['id'], $quizId, (int) $isDaily, json_encode($state)]);

    return respondJson($response, ['quiz' => $args['quiz'], 'is_daily' => $isDaily]);
})->add(requireAuth());

// DELETE my saved game, for when a quiz is finished with and started afresh.
$app->delete('/api/quiz/progress/{quiz}', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();
    $user = $request->getAttribute('user');

    $quizId = quizIdByName($pdo, (string) $args['quiz']);
    if ($quizId === null) {
        return respondJson($response, ['error' => 'Unknown quiz'], 404);
    }

    $isDaily = $request->getQueryParams()['daily'] ?? '0';
    $statement = $pdo->prepare('DELETE FROM quizzes_states WHERE user_id = ? AND quiz_id = ? AND is_daily = ?');
    $statement->execute([$user['id'], $quizId, (int) in_array($isDaily, ['1', 'true'], true)]);

    return respondJson($response, ['deleted' => $statement->rowCount()]);
})->add(requireAuth());

// POST a finished question.
//
// Two tables, and they have to agree: user_quiz_history is the log of what
// happened, quiz_stats_history the running total. A total that has drifted from
// the log is worse than no total, so both are written or neither is.
$app->post('/api/quiz/result', function (Request $request, Response $response) {
    $pdo = genshinDb();
    $user = $request->getAttribute('user');
    $body = (array) $request->getParsedBody();

    $quizId = quizIdByName($pdo, (string) ($body['quiz'] ?? ''));
    if ($quizId === null) {
        return respondJson($response, ['error' => 'Unknown quiz'], 404);
    }

    $characterId = (int) ($body['character_id'] ?? 0);
    if ($characterId <= 0) {
        return respondJson($response, ['error' => 'character_id is required'], 422);
    }

    // The character has to exist: both tables have a foreign key to it, and a
    // constraint violation halfway through is a worse error than this one.
    $statement = $pdo->prepare('SELECT id FROM characters WHERE id = ? AND deleted = FALSE');
    $statement->execute([$characterId]);
    if (!$statement->fetch()) {
        return respondJson($response, ['error' => 'Unknown character'], 404);
    }

    $win = !empty($body['win']);
    $attempts = max(0, (int) ($body['attempts'] ?? 0));
    $difficulty = isset($body['difficulty']) ? (int) $body['difficulty'] : null;

    $pdo->beginTransaction();
    try {
        $pdo->prepare(
            'INSERT INTO user_quiz_history (user_id, character_id, quiz_id, win, attempts, difficulty)
                  VALUES (?, ?, ?, ?, ?, ?)'
        )->execute([$user['id'], $characterId, $quizId, (int) $win, $attempts, $difficulty]);

        // Totals are added to rather than recounted: the log can grow to
        // thousands of rows per player and this runs after every question.
        $pdo->prepare(
            'INSERT INTO quiz_stats_history (user_id, character_id, quiz_id, wins, losses, attempts)
                  VALUES (?, ?, ?, ?, ?, ?)
             ON CONFLICT (user_id, character_id, quiz_id)
             DO UPDATE SET wins   = quiz_stats_history.wins   + EXCLUDED.wins,
                           losses = quiz_stats_history.losses + EXCLUDED.losses,
                           attempts = quiz_stats_history.attempts + EXCLUDED.attempts'
        )->execute([$user['id'], $characterId, $quizId, $win ? 1 : 0, $win ? 0 : 1, $attempts]);

        $pdo->commit();
    } catch (\Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }

    return respondJson($response, ['recorded' => true], 201);
})->add(requireAuth());

// GET my totals, so a profile page has something to draw.
$app->get('/api/quiz/stats', function (Request $request, Response $response) {
    $user = $request->getAttribute('user');

    $statement = genshinDb()->prepare(
        'SELECT q.name AS quiz, c.name AS character_name, c.id AS character_id, c.icon_name,
                s.wins, s.losses, s.attempts
           FROM quiz_stats_history s
           JOIN quizzes q ON q.id = s.quiz_id
           JOIN characters c ON c.id = s.character_id
          WHERE s.user_id = ?
          ORDER BY q.name, c.name'
    );
    $statement->execute([$user['id']]);

    return respondJson($response, $statement->fetchAll(PDO::FETCH_ASSOC));
})->add(requireAuth());
