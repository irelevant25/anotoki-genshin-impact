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
// These take the player from who the request is instead (requireOwner(), in
// api/meddleware/auth.php): the person the bearer token names or - while the
// IAM does not require sign-in here - this browser's visitor, whose key the
// browser sends in X-Visitor-Key (api/visitors.php). They address quizzes by
// the name the front end already uses, and upsert. Nothing identifying is in a
// body or a URL, and there is nothing to forge: whoever the request is, is
// whose progress it reads and writes.
//
// Nobody (no token, no key) gets nothing back from the reads - [] or
// {deleted: 0}, without a query. A save by nobody that holds a play makes a
// visitor first, inside the save's own transaction (ownerWrite()), and the
// answer hands its key back in X-Visitor-Key; a save of a question nobody has
// played yet (a fresh draw: no try, not finished - every quiz saves one on a
// page view) makes nobody and is refused, so a page view never makes a
// visitor. A visitor's game is at most state_max_bytes of JSON (413
// too_large) and its log at most max_results rows (422 visitor_limit) -
// config/visitors.php; a person's are not limited. Every write goes through
// ownerWrite(), which locks a visitor's row first: the quiz tables have no
// foreign key to users, and a save that waited for a move or a sweep must not
// write rows for an id nobody has any more.

/** How many games one carry may hold: six quizzes, each a free game and a daily one. */
const QUIZ_CARRY_MAX = 12;

/** Maps a quiz name to its id, so a caller never has to know the number. */
function quizIdByName(PDO $pdo, string $name): ?int
{
    $statement = $pdo->prepare('SELECT id FROM quizzes WHERE name = ? AND deleted = FALSE');
    $statement->execute([$name]);
    $id = $statement->fetchColumn();

    return $id === false ? null : (int) $id;
}

/** Every saved game of one player, as GET /api/quiz/progress answers them. */
function quizProgressRows(PDO $pdo, int $userId): array
{
    $statement = $pdo->prepare(
        'SELECT q.name AS quiz, s.state, s.is_daily, s.updated_at
           FROM quizzes_states s
           JOIN quizzes q ON q.id = s.quiz_id AND q.deleted = FALSE
          WHERE s.user_id = ?
          ORDER BY q.name'
    );
    $statement->execute([$userId]);

    // PDO hands a jsonb column back as text, so without this the caller would
    // get the state as a JSON string inside JSON and have to parse it again.
    return array_map(function (array $row): array {
        $row['state'] = $row['state'] === null ? null : json_decode($row['state'], true);
        $row['is_daily'] = (bool) $row['is_daily'];
        return $row;
    }, $statement->fetchAll(PDO::FETCH_ASSOC));
}

/**
 * Whether a saved game holds a play: a try, or a finished question (mismatch
 * has no tries - one click finishes it). A fresh draw holds neither, and every
 * quiz saves one as soon as its page opens, so only a game with a play may
 * make a visitor or be carried in from the browser.
 */
function quizStateHasPlay(array $state): bool
{
    $tries = $state['tries'] ?? null;

    return (is_array($tries) && $tries !== []) || ($state['isQuestionComplete'] ?? false) === true;
}

/** 413 too_large when a visitor's (or a carried) game is over state_max_bytes of JSON. */
function quizStateMustFit(array $state): void
{
    $max = visitorSetting('state_max_bytes');
    if (strlen((string) json_encode($state)) > $max) {
        throw new ApiRefusal(413, 'too_large', "A saved game is at most $max bytes without signing in.", [], ['max' => $max]);
    }
}

/** 422 invalid, naming the field: a body this cannot take. */
function quizRefusedBody(string $field, string $message): ApiRefusal
{
    return new ApiRefusal(422, 'invalid', $message, [], ['field' => $field]);
}

// GET every saved game of mine, in one request - the site loads them together
// rather than asking again on each quiz page.
$app->get('/api/quiz/progress', function (Request $request, Response $response) {
    $user = $request->getAttribute('user');
    if ($user === null) {
        return respondJson($response, []);
    }

    return respondJson($response, quizProgressRows(genshinDb(), (int) $user['id']));
})->add(responds(QuizProgress::class, list: true))->add(requireOwner('empty'));

// PUT my saved game for one quiz. Upsert: a quiz is saved after every guess, and
// whether that is the first one is not something the caller should have to know.
$app->put('/api/quiz/progress/{quiz}', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();
    $user = $request->getAttribute('user');
    $maker = $user === null;

    $quizId = quizIdByName($pdo, (string) $args['quiz']);
    if ($quizId === null) {
        return respondJson($response, ['error' => 'Unknown quiz'], 404);
    }

    $body = (array) $request->getParsedBody();
    $isDaily = !empty($body['is_daily']);

    // The state is the front end's own shape and is stored as it arrives. What
    // is in it is the browser's business - only who it belongs to is ours (and,
    // without signing in, how big it is).
    $state = $body['state'] ?? null;
    if (!is_array($state)) {
        return respondJson($response, ['error' => 'state must be an object'], 422);
    }
    if ($maker || isVisitor($user)) {
        quizStateMustFit($state);
    }
    if ($maker && !quizStateHasPlay($state)) {
        throw quizRefusedBody('state', 'Nothing in this game has been played yet, so there is nothing to keep.');
    }

    $written = ownerWrite($request, function (PDO $pdo, int $userId) use ($quizId, $isDaily, $state): void {
        // Cast: PDO sends a PHP false as an empty string, which Postgres will
        // not read as a boolean. DbQuery casts to int for the same reason.
        $pdo->prepare(
            'INSERT INTO quizzes_states (user_id, quiz_id, is_daily, state)
                  VALUES (?, ?, ?, ?)
             ON CONFLICT (user_id, quiz_id, is_daily)
             DO UPDATE SET state = EXCLUDED.state'
        )->execute([$userId, $quizId, (int) $isDaily, json_encode($state)]);
    });

    return withVisitorMade(respondJson($response, ['quiz' => $args['quiz'], 'is_daily' => $isDaily]), $written['key']);
})->add(responds(QuizProgressSaved::class))->add(requireOwner('make'));

// DELETE my saved game, for when a quiz is finished with and started afresh.
$app->delete('/api/quiz/progress/{quiz}', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();
    if ($request->getAttribute('user') === null) {
        return respondJson($response, ['deleted' => 0]);
    }

    $quizId = quizIdByName($pdo, (string) $args['quiz']);
    if ($quizId === null) {
        return respondJson($response, ['error' => 'Unknown quiz'], 404);
    }

    $isDaily = (int) in_array($request->getQueryParams()['daily'] ?? '0', ['1', 'true'], true);
    $written = ownerWrite($request, function (PDO $pdo, int $userId) use ($quizId, $isDaily): int {
        $statement = $pdo->prepare('DELETE FROM quizzes_states WHERE user_id = ? AND quiz_id = ? AND is_daily = ?');
        $statement->execute([$userId, $quizId, $isDaily]);

        return $statement->rowCount();
    });

    return respondJson($response, ['deleted' => $written['result']]);
})->add(responds(QuizProgressDeleted::class))->add(requireOwner('empty'));

// POST the games this browser kept for itself, into whoever the request is -
// once: the browser forgets every game it sent after a 200.
//
// Two callers. Somebody playing without signing in, whose first save with a
// play is this carry (every game the browser holds, the one just played among
// them) - it makes the visitor. And a person who has just signed in, whose
// browser still holds games from before. Per game: the account's own stays
// where it has one for that quiz ("kept"); a daily of another day than today
// (UTC) never moves ("stale") - and an account's daily of another day is
// replaced by the browser's of today; a game nobody has played yet
// ("unplayed") and a quiz this site does not know ("unknown") are skipped.
// A carry that would make a visitor and keeps nothing makes nobody (422).
//
// A person's carry after a silent sign-in - the IAM's sign-in hint signed them
// in without a click, and the page says so (`silent: true`) - carries nothing
// into an account that already has something here (personHasData()): it
// answers `stayed: true` with zeros and the account's games, and the browser
// keeps its own (the owner's decision of 2026-10-11, the move's rule:
// api/visitors.php, visitorMove()). A sign-in the person makes carries as
// above. `silent` says nothing on a visitor's carry; other than true or
// false it is 422.
$app->post('/api/quiz/progress/carry', function (Request $request, Response $response) {
    $maker = $request->getAttribute('user') === null;
    $body = (array) $request->getParsedBody();

    $games = $body['games'] ?? null;
    if (!is_array($games) || !array_is_list($games) || count($games) > QUIZ_CARRY_MAX) {
        throw quizRefusedBody('games', 'games must be a list of at most ' . QUIZ_CARRY_MAX . ' saved games.');
    }
    foreach ($games as $i => $game) {
        if (!is_array($game) || !is_string($game['quiz'] ?? null) || !is_bool($game['is_daily'] ?? null) || !is_array($game['state'] ?? null)) {
            throw quizRefusedBody("games[$i]", 'Each game is {quiz: string, is_daily: boolean, state: object}.');
        }
        quizStateMustFit($game['state']);
    }
    $silent = $body['silent'] ?? false;
    if (!is_bool($silent)) {
        throw quizRefusedBody('silent', 'silent is true or false: whether the sign-in was the IAM\'s silent one.');
    }
    if ($maker && $games === []) {
        throw quizRefusedBody('games', 'There are no games to keep.');
    }

    $today = gmdate('Y-m-d');
    $written = ownerWrite($request, function (PDO $pdo, int $userId, bool $visitor) use ($games, $today, $maker, $silent): array {
        $counts = ['carried' => 0, 'kept' => 0, 'stale' => 0, 'unknown' => 0, 'unplayed' => 0];
        // After a silent sign-in, nothing comes into an account that has its
        // own here: the browser keeps its games (the owner's decision).
        if ($silent && !$visitor && personHasData($pdo, $userId)) {
            return $counts + ['games' => quizProgressRows($pdo, $userId), 'stayed' => true];
        }
        // An existing game stays, but for a daily of another day; what does
        // not write is "kept". (No jsonb `?` operator here: it would be read
        // as a placeholder.)
        $upsert = $pdo->prepare(
            "INSERT INTO quizzes_states (user_id, quiz_id, is_daily, state)
                  VALUES (?, ?, ?, ?)
             ON CONFLICT (user_id, quiz_id, is_daily)
             DO UPDATE SET state = EXCLUDED.state
                     WHERE quizzes_states.is_daily
                       AND (quizzes_states.state ->> 'date') IS DISTINCT FROM ?"
        );
        foreach ($games as $game) {
            $quizId = quizIdByName($pdo, $game['quiz']);
            if ($quizId === null) {
                $counts['unknown']++;
            } elseif ($game['is_daily'] && ($game['state']['date'] ?? null) !== $today) {
                $counts['stale']++;
            } elseif (!quizStateHasPlay($game['state'])) {
                $counts['unplayed']++;
            } else {
                $upsert->execute([$userId, $quizId, (int) $game['is_daily'], json_encode($game['state']), $today]);
                $counts[$upsert->rowCount() === 1 ? 'carried' : 'kept']++;
            }
        }
        if ($maker && $counts['carried'] + $counts['kept'] === 0) {
            // Thrown inside the transaction: the visitor just made goes with it,
            // uncounted.
            throw quizRefusedBody('games', 'None of these games has been played today, so there is nothing to keep.');
        }

        return $counts + ['games' => quizProgressRows($pdo, $userId), 'stayed' => false];
    });

    return withVisitorMade(respondJson($response, $written['result']), $written['key']);
})->add(responds(QuizCarryResult::class))->add(requireOwner('make'));

// POST a finished question.
//
// Two tables, and they have to agree: user_quiz_history is the log of what
// happened, quiz_stats_history the running total. A total that has drifted from
// the log is worse than no total, so both are written or neither is.
$app->post('/api/quiz/result', function (Request $request, Response $response) {
    $pdo = genshinDb();
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

    $written = ownerWrite($request, function (PDO $pdo, int $userId, bool $visitor) use ($characterId, $quizId, $win, $attempts, $difficulty): void {
        // A visitor's log has a ceiling; counted under the row's lock, so two
        // results at once cannot both slip under it.
        if ($visitor) {
            $max = visitorSetting('max_results');
            $count = $pdo->prepare('SELECT count(*) FROM user_quiz_history WHERE user_id = ?');
            $count->execute([$userId]);
            if ((int) $count->fetchColumn() >= $max) {
                throw new ApiRefusal(
                    422,
                    'visitor_limit',
                    'Without signing in, this browser cannot record more results. Sign in and your statistics keep growing.',
                    [],
                    ['limit' => 'results', 'max' => $max],
                );
            }
        }

        $pdo->prepare(
            'INSERT INTO user_quiz_history (user_id, character_id, quiz_id, win, attempts, difficulty)
                  VALUES (?, ?, ?, ?, ?, ?)'
        )->execute([$userId, $characterId, $quizId, (int) $win, $attempts, $difficulty]);

        // Totals are added to rather than recounted: the log can grow to
        // thousands of rows per player and this runs after every question.
        $pdo->prepare(
            'INSERT INTO quiz_stats_history (user_id, character_id, quiz_id, wins, losses, attempts)
                  VALUES (?, ?, ?, ?, ?, ?)
             ON CONFLICT (user_id, character_id, quiz_id)
             DO UPDATE SET wins   = quiz_stats_history.wins   + EXCLUDED.wins,
                           losses = quiz_stats_history.losses + EXCLUDED.losses,
                           attempts = quiz_stats_history.attempts + EXCLUDED.attempts'
        )->execute([$userId, $characterId, $quizId, $win ? 1 : 0, $win ? 0 : 1, $attempts]);
    });

    return withVisitorMade(respondJson($response, ['recorded' => true], 201), $written['key']);
})->add(responds(QuizResultAck::class))->add(requireOwner('make'));

// GET my totals, so a profile page has something to draw.
$app->get('/api/quiz/stats', function (Request $request, Response $response) {
    $user = $request->getAttribute('user');
    if ($user === null) {
        return respondJson($response, []);
    }

    $statement = genshinDb()->prepare(
        'SELECT q.name AS quiz, c.name AS character_name, c.id AS character_id, c.icon_file_id,
                s.wins, s.losses, s.attempts
           FROM quiz_stats_history s
           JOIN quizzes q ON q.id = s.quiz_id
           JOIN characters c ON c.id = s.character_id
          WHERE s.user_id = ?
          ORDER BY q.name, c.name'
    );
    $statement->execute([$user['id']]);

    $rows = $statement->fetchAll(PDO::FETCH_ASSOC);
    resolveAssetRows(genshinDb(), 'characters', $rows);

    return respondJson($response, $rows);
})->add(responds(QuizStatsRow::class, list: true))->add(requireOwner('empty'));

// ── The reads behind the profile page ────────────────────────────────────────
//
// /api/quiz/stats above hands back the lifetime table as it stands: one row per
// character per quiz. That covers most of a profile - how a player does at each
// quiz, and how they do against each character - but two things it cannot
// answer at all, because neither difficulty nor the date is part of its key.
// Winning on hard and winning on easy land in the same row, and a row that has
// been added to for a year cannot say when any of it happened.
//
// Both survive in user_quiz_history, which keeps one row per finished question,
// so these three aggregate from the log instead. Like every route above, the
// player is who the request is (requireOwner()): there is no id on the wire to
// forge, and nobody gets nothing.

// GET my totals split by difficulty.
$app->get('/api/quiz/stats/difficulty', function (Request $request, Response $response) {
    $user = $request->getAttribute('user');
    if ($user === null) {
        return respondJson($response, []);
    }

    $statement = genshinDb()->prepare(
        'SELECT q.name AS quiz,
                h.difficulty,
                COUNT(*) FILTER (WHERE h.win)     AS wins,
                COUNT(*) FILTER (WHERE NOT h.win) AS losses,
                COALESCE(SUM(h.attempts), 0)      AS attempts
           FROM user_quiz_history h
           JOIN quizzes q ON q.id = h.quiz_id
          WHERE h.user_id = ?
          GROUP BY q.name, h.difficulty
          ORDER BY q.name, h.difficulty'
    );
    $statement->execute([$user['id']]);

    return respondJson($response, $statement->fetchAll(PDO::FETCH_ASSOC));
})->add(responds(QuizDifficultyRow::class, list: true))->add(requireOwner('empty'));

// GET the days I played on, over the past year.
//
// Only the days with something on them. A year of mostly zeroes would be 365
// rows saying nothing, and the page has to decide how far back it draws anyway,
// so it fills its own gaps.
$app->get('/api/quiz/activity', function (Request $request, Response $response) {
    $user = $request->getAttribute('user');
    if ($user === null) {
        return respondJson($response, []);
    }

    $statement = genshinDb()->prepare(
        "SELECT to_char(h.created_at::date, 'YYYY-MM-DD') AS day,
                COUNT(*)                          AS played,
                COUNT(*) FILTER (WHERE h.win)     AS wins
           FROM user_quiz_history h
          WHERE h.user_id = ?
            AND h.created_at >= CURRENT_DATE - INTERVAL '1 year'
          GROUP BY 1
          ORDER BY 1"
    );
    $statement->execute([$user['id']]);

    return respondJson($response, $statement->fetchAll(PDO::FETCH_ASSOC));
})->add(responds(QuizActivityDay::class, list: true))->add(requireOwner('empty'));

// GET my last twenty finished questions, newest first.
//
// A fixed count rather than a ?limit: this is one list on one page, and a
// number on the query string would be a knob with nothing to turn it.
$app->get('/api/quiz/results', function (Request $request, Response $response) {
    $user = $request->getAttribute('user');
    if ($user === null) {
        return respondJson($response, []);
    }

    $statement = genshinDb()->prepare(
        'SELECT h.id, q.name AS quiz, c.id AS character_id, c.name AS character_name,
                c.icon_file_id, h.win, h.attempts, h.difficulty, h.created_at
           FROM user_quiz_history h
           JOIN quizzes q ON q.id = h.quiz_id
           JOIN characters c ON c.id = h.character_id
          WHERE h.user_id = ?
          ORDER BY h.created_at DESC, h.id DESC
          LIMIT 20'
    );
    $statement->execute([$user['id']]);

    $rows = $statement->fetchAll(PDO::FETCH_ASSOC);
    resolveAssetRows(genshinDb(), 'characters', $rows);

    return respondJson($response, $rows);
})->add(responds(QuizRecentResult::class, list: true))->add(requireOwner('empty'));
