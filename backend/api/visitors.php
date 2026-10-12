<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * Visitors: somebody playing without signing in - while the IAM does not
 * require it here (signInRequired()) - keeps their games and statistics on
 * the server like a person does, under a `users` row of their own: a
 * negative id from the sequence visitor_ids (an IAM user id is always 1 or
 * more), the name 'visitor', no address, and the SHA-256 of their key
 * (migration users/045). "The role visitor" is that mark, never an IAM role:
 * in the API a visitor is the array visitorUser() makes, `visitor` true. The
 * build analyzer's visitor accounts are the pattern; Piano Academy and the
 * survey have the same. This file is the only code that makes, finds, locks
 * or sweeps a visitor.
 *
 * The key: 32 random bytes the server makes, base64url without padding (43
 * characters). It leaves the server once, in the X-Visitor-Key header of the
 * answer to the save that made the visitor (never in a body, a URL or a
 * log); the browser keeps it and sends it back in the X-Visitor-Key request
 * header. The row keeps only its hash, and a request is that visitor when the
 * hash of the key it sends is a row's - the key has 256 bits, so a plain
 * lookup is safe.
 *
 * Who a request is (design 4.2 of the family; requireOwner() reads the key -
 * nothing else does but the move at sign-in, which needs a token too):
 *
 *   1. `Authorization: Bearer ...` - that person, or 401; the key is not
 *      read. Only Bearer claims anybody (`Basic ...` is the host's own).
 *   2. Else, sign-in required - 401 sign_in_required; a key is never looked
 *      up, counted or swept early.
 *   3. Else X-Visitor-Key - that visitor (visitorFind()), or 401
 *      visitor_unknown; a visitor whose row went during the request (moved
 *      in another tab, swept) is 401 visitor_unknown too (visitorLock()).
 *   4. Else nobody: what is public, and a first save that holds a play makes
 *      a visitor (visitorMake()) inside that save's own transaction - a
 *      refused or failed save makes nobody and counts nothing.
 *
 * A visitor reaches its own games and statistics and nothing else: never
 * the checks that mean a verified token (requireAuth(), requireRole()), the
 * admin panel, the Migrations page, backups, /api/me, or anybody's row.
 *
 *   visitorFind()     the visitor of a key, seen now (written at most once an
 *                     hour); unknown or malformed: 401 visitor_unknown
 *   visitorMake()     a new visitor, inside the transaction of the save that
 *                     makes it, after the limits (429 too_many_visitors)
 *   visitorLock()     a visitor's row taken FOR UPDATE before anything is
 *                     written for it - the quiz tables have no foreign key to
 *                     users, so this is what keeps a write from landing for a
 *                     visitor that was moved or swept meanwhile
 *   visitorSweep()    visitors unseen for keep_days deleted with everything
 *                     of theirs (VISITOR_PERSON_TABLES), a few at a time,
 *                     after somebody's answer (visitorSweepAfterAnswer())
 *   ownerWrite()      the one way a route writes somebody's own data: one
 *                     transaction, the visitor made in it or its row locked
 *                     first (a route never begins its own for that data)
 *   withVisitorMade() the new visitor's key on the answer that made it
 *   ownerPrivate()    the headers on every answer about somebody's own data
 *   visitorMove()     at sign-in, a visitor's games and statistics into the
 *                     person's account, and the visitor gone (POST
 *                     /api/visitor/move: the token AND the key) - after a
 *                     silent sign-in, only into an account with nothing here
 *
 * requireOwner() (api/meddleware/auth.php) says who a request is; the routes
 * in api/routes/genshin_impact/endpoints/quiz_progress.php are what it
 * guards.
 *
 * The limits are config/visitors.php's (each may be changed in the optional
 * config/visitors.local.php). There is no early sweep of visitors with
 * little kept: the pages promise keep_days after the last visit.
 *
 * Between an upload and users/045 being applied the column is not there:
 * every visitor path then answers 503 visitors_unavailable (never a 500), and
 * the sweep does nothing. Every transaction begun here is rolled back on the
 * way out of a failure - the connection may be a persistent one, and a
 * transaction left open would be the next request's.
 */

const VISITOR_HEADER = 'X-Visitor-Key';

const VISITOR_KEY_PATTERN = '/^[A-Za-z0-9_-]{43}$/D';

/** The advisory lock new visitors are made under, so the limits count exactly (beside MIGRATION_LOCK). */
const VISITOR_MAKE_LOCK = 4260917002;

/**
 * Every table that keeps something of a person's by `user_id` - what the
 * sweep deletes with a visitor and what the move at sign-in takes into the
 * person's account. A table added later that is keyed by the user id goes
 * here, once.
 */
const VISITOR_PERSON_TABLES = ['quizzes_states', 'user_quiz_history', 'quiz_stats_history'];

/**
 * What PostgreSQL says when the move met another request's work on the same
 * rows - a unique key, a serialization failure, a deadlock, a lock not had
 * within move_lock_timeout_ms: nothing was moved, and asking again is the
 * answer (503 visitor_move_retry).
 */
const VISITOR_MOVE_RETRY_STATES = ['23505', '40001', '40P01', '55P03'];

/** The sweep runs at most once in this many seconds across the site (but always after a visitor is made). */
const VISITOR_SWEEP_EVERY = 3600;

/** One of config/visitors.php's numbers ('keep_days', 'max_visitors', ...), already checked. */
function visitorSetting(string $name): int
{
    $settings = visitorSettings()['visitors'];
    if (!array_key_exists($name, $settings)) {
        throw new LogicException("No visitor setting $name.");
    }

    return $settings[$name];
}

/** The key a request sends, or null when it sends none (an empty header is none). */
function visitorKeyOf(Request $request): ?string
{
    $key = trim($request->getHeaderLine(VISITOR_HEADER));

    return $key === '' ? null : $key;
}

/** Whether $key could be a key at all: 43 characters of base64url. */
function visitorKeyWellFormed(string $key): bool
{
    return preg_match(VISITOR_KEY_PATTERN, $key) === 1;
}

/** What the row keeps of a key: its SHA-256, 64 hex characters. */
function visitorKeyHash(string $key): string
{
    return hash('sha256', $key);
}

/** A new key: 32 random bytes, base64url without padding. */
function visitorNewKey(): string
{
    return rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
}

/** A visitor as the API carries one in the request's `user` attribute. */
function visitorUser(int $id): array
{
    return ['id' => $id, 'username' => 'visitor', 'role' => 'VISITOR', 'roles' => [], 'visitor' => true];
}

/** Whether a `user` attribute is a visitor's. */
function isVisitor(?array $user): bool
{
    return is_array($user) && ($user['visitor'] ?? false) === true;
}

/**
 * Whether users/045 is applied: the column of the visitors' keys is there.
 * Asked once a request ($reset: the checks that change the database under
 * a running script).
 */
function visitorsReady(bool $reset = false): bool
{
    static $ready = null;

    if ($reset) {
        $ready = null;
    }
    if ($ready === null) {
        try {
            $statement = usersDb()->query(
                "SELECT EXISTS (SELECT 1 FROM information_schema.columns
                                 WHERE table_schema = current_schema() AND table_name = 'users'
                                   AND column_name = 'visitor_key_hash')"
            );
            $ready = (bool) $statement->fetchColumn();
        } catch (\PDOException) {
            $ready = false;
        }
    }

    return $ready;
}

/** 503 visitors_unavailable while users/045 waits - a 503 with a code, never a 500. */
function visitorsMustBeReady(): void
{
    if (!visitorsReady()) {
        throw new ApiRefusal(
            503,
            'visitors_unavailable',
            'Playing without signing in is not ready yet: an administrator applies the waiting database update on the admin panel\'s Migrations page. Sign in to continue.',
            ['Retry-After' => '60'],
        );
    }
}

/** 401 visitor_unknown: no visitor has this key (any more). */
function visitorUnknown(): ApiRefusal
{
    return new ApiRefusal(
        401,
        'visitor_unknown',
        'This browser\'s games without signing in have ended: they were not used for ' . visitorSetting('keep_days')
            . ' days, or they were moved into an account at a sign-in.',
    );
}

/**
 * The visitor of this key, seen now - last_seen_at written at most once an
 * hour, so a visitor's every request is not a write - or 401
 * visitor_unknown (a key that is malformed, or nobody's).
 */
function visitorFind(string $key): array
{
    if (!visitorKeyWellFormed($key)) {
        throw visitorUnknown();
    }
    visitorsMustBeReady();

    $pdo = usersDb();
    $statement = $pdo->prepare(
        "SELECT id, last_seen_at < now() - interval '1 hour' AS stale FROM users WHERE visitor_key_hash = ? AND id < 0"
    );
    $statement->execute([visitorKeyHash($key)]);
    $row = $statement->fetch();
    if ($row === false) {
        throw visitorUnknown();
    }
    if ($row['stale'] === true || $row['stale'] === 't') {
        $pdo->prepare("UPDATE users SET last_seen_at = now() WHERE id = ? AND id < 0 AND last_seen_at < now() - interval '1 hour'")
            ->execute([(int) $row['id']]);
    }

    return visitorUser((int) $row['id']);
}

/**
 * A new visitor for the save that is being made, INSIDE that save's
 * transaction - so a save that fails or is refused afterwards makes nobody,
 * and its count goes with it - or 429 too_many_visitors when there are as
 * many visitors as max_visitors already (existing visitors keep working; only
 * new ones are refused), or new_per_hour from everywhere, or
 * new_per_hour_per_address from this address - counted, and kept for the
 * hour, as a keyed HMAC of its bucket, never the address
 * (api/client_address.php's clientAddressHash(); users/054). Under an
 * advisory lock held to the end of the transaction, so two at once count
 * exactly.
 *
 * @return array{user: array, key: string}
 */
function visitorMake(Request $request): array
{
    $pdo = usersDb();
    if (!$pdo->inTransaction()) {
        throw new LogicException('visitorMake() belongs inside the transaction of the save that makes the visitor.');
    }
    visitorsMustBeReady();

    $pdo->prepare('SELECT pg_advisory_xact_lock(?::bigint)')->execute([VISITOR_MAKE_LOCK]);
    // The counts of an hour ago and more are kept no longer than needed.
    $pdo->exec("DELETE FROM visitor_starts WHERE started_at < now() - interval '1 hour'");

    $address = clientAddressHash($request);
    $statement = $pdo->prepare(
        'SELECT (SELECT count(*) FROM users WHERE id < 0) AS visitors,
                (SELECT count(*) FROM visitor_starts WHERE address = ?) AS here,
                (SELECT count(*) FROM visitor_starts) AS everywhere'
    );
    $statement->execute([$address]);
    $counts = $statement->fetch();
    if ((int) $counts['visitors'] >= visitorSetting('max_visitors')) {
        throw visitorTooMany('Too many people are playing without signing in just now. Sign in to continue, or try again later.');
    }
    if ((int) $counts['here'] >= visitorSetting('new_per_hour_per_address')) {
        throw visitorTooMany('Too many people started playing without signing in from this address this hour. Sign in to continue, or try again later.');
    }
    if ((int) $counts['everywhere'] >= visitorSetting('new_per_hour')) {
        throw visitorTooMany('Too many people started playing without signing in this hour. Sign in to continue, or try again later.');
    }

    $pdo->prepare('INSERT INTO visitor_starts (address) VALUES (?)')->execute([$address]);
    $key = visitorNewKey();
    $insert = $pdo->prepare(
        "INSERT INTO users (id, username, visitor_key_hash, last_seen_at) VALUES (nextval('visitor_ids'), 'visitor', ?, now()) RETURNING id"
    );
    $insert->execute([visitorKeyHash($key)]);

    return ['user' => visitorUser((int) $insert->fetchColumn()), 'key' => $key];
}

/** 429 too_many_visitors: no NEW visitor now - the browser keeps its games, as before visitor accounts. */
function visitorTooMany(string $message): ApiRefusal
{
    return new ApiRefusal(429, 'too_many_visitors', $message, ['Retry-After' => '3600']);
}

/**
 * The visitor's row, taken FOR UPDATE in the caller's transaction before
 * anything is written for it - or 401 visitor_unknown when it went (moved
 * into an account in another tab, swept). Without it a save that waited for
 * a move or a sweep would write rows for an id nobody has any more: the quiz
 * tables have no foreign key to users.
 */
function visitorLock(int $id): void
{
    $pdo = usersDb();
    if (!$pdo->inTransaction()) {
        throw new LogicException('visitorLock() belongs inside the transaction of the write it guards.');
    }
    $statement = $pdo->prepare('SELECT 1 FROM users WHERE id = ? AND id < 0 FOR UPDATE');
    $statement->execute([$id]);
    if ($statement->fetchColumn() === false) {
        throw visitorUnknown();
    }
}

/**
 * A write to somebody's own data, for whoever requireOwner() found, in one
 * transaction this begins - the one place such a write happens:
 *
 *   a visitor to be made (nobody, on a route with requireOwner('make')):
 *       visitorMake() first, inside this transaction - so a write that fails
 *       or is refused afterwards (an ApiRefusal from $write) makes nobody and
 *       counts nothing; the key comes back for withVisitorMade(), and the
 *       sweep runs after the answer;
 *   a visitor: its row locked first (visitorLock()) - 401 visitor_unknown
 *       when it went meanwhile, and nothing written;
 *   a person: the transaction alone.
 *
 * $write(PDO $pdo, int $userId, bool $visitor) does the work and returns what
 * the route answers from. Rolled back on anything thrown, which goes on.
 *
 * @return array{result: mixed, key: ?string}
 */
function ownerWrite(Request $request, callable $write): array
{
    $user = $request->getAttribute('user');
    $make = $user === null && $request->getAttribute('visitor_to_make') === true;
    if ($user === null && !$make) {
        throw new LogicException('ownerWrite() writes for whoever requireOwner() found, and this request is nobody.');
    }

    $pdo = usersDb();
    if ($pdo->inTransaction()) {
        throw new LogicException('ownerWrite() begins its own transaction.');
    }
    $pdo->beginTransaction();
    try {
        $key = null;
        if ($make) {
            ['user' => $user, 'key' => $key] = visitorMake($request);
        } elseif (isVisitor($user)) {
            visitorLock((int) $user['id']);
        }
        $result = $write($pdo, (int) $user['id'], isVisitor($user));
        $pdo->commit();
    } catch (\Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }

    if ($key !== null) {
        visitorSweepAfterAnswer(true);
    }

    return ['result' => $result, 'key' => $key];
}

/**
 * The answer that made a visitor, with its key: the one time the key leaves
 * the server (ownerPrivate() keeps every cache from holding it). Without a
 * key, the answer as it is.
 */
function withVisitorMade(Response $response, ?string $key): Response
{
    return $key === null ? $response : $response->withHeader(VISITOR_HEADER, $key);
}

/**
 * What every answer about somebody's own data carries (requireOwner(), and
 * the move at sign-in): no cache anywhere may keep it, and one that does not
 * listen must at least know the answer depends on the token and the key. A
 * visitor's request has no Authorization header and its URL is every
 * visitor's, so without this a shared cache could hand one visitor's games to
 * the next. (There is no API-wide default Cache-Control: only a few routes
 * set their own - a file's bytes, the strings, the not-set-up answer.)
 */
function ownerPrivate(Response $response): Response
{
    return $response
        ->withHeader('Cache-Control', 'private, no-store')
        ->withHeader('Vary', 'Authorization, ' . VISITOR_HEADER);
}

/**
 * At sign-in: everything the visitor of $key played becomes $person's, and
 * the visitor goes - its key opens nothing from then on. One transaction:
 * the visitor's row, then the person's, taken FOR UPDATE (always in that
 * order) with a lock timeout of move_lock_timeout_ms, so a save of the
 * visitor's that arrives meanwhile waits and then finds no visitor (401
 * visitor_unknown, nothing written - visitorLock()), and the sweep skips it.
 *
 * What both have, the person's stays:
 *   saved games  per quiz and kind (free / daily): the person's game stays
 *                ("kept"), the visitor's moves where the person has none
 *                ("moved"); a daily is today's (UTC) or nothing - the
 *                visitor's of another day never moves ("stale"), the
 *                person's of another day is replaced by the visitor's of
 *                today (the carry's rule, api/routes/genshin_impact/endpoints/
 *                quiz_progress.php);
 *   the log      every row moves as it is - id, time and all (each is a
 *                question really played) - "results";
 *   the totals   added to the person's per character and quiz, so they
 *                still add up to the log.
 *
 * After a silent sign-in ($silent: the IAM's sign-in hint signed the person
 * in, nobody clicked anything - the page says so) only into an account that
 * has nothing here yet: one with anything of its own here
 * (personHasData()) takes nothing in, and the visitor stays as it is -
 * {found: true, stayed: true} with zeros - its key still opening it on that
 * browser, until a sign-in the person makes there (the owner's decision of
 * 2026-10-11: a browser's games never land silently in an account that
 * already has its own here). Asked under the same locks, so what the answer
 * says is what was there.
 *
 * Repeatable: a key nobody has (moved already by another tab, swept, never
 * there) is {found: false} with zeros - no error. Another request holding
 * the rows past the lock timeout, or a write that met the move's (a deadlock,
 * a serialization failure, a unique key): 503 visitor_move_retry, nothing
 * moved, ask again. The person's own row gone meanwhile: 401
 * sign_in_required, nothing moved. While users/045 waits: 503
 * visitors_unavailable. Whatever the IAM's switch says - requiring sign-in
 * stops a key from being somebody, not from being handed in with a token.
 *
 * @return array{found: bool, games: array{moved: int, kept: int, stale: int}, results: int, stayed: bool}
 */
function visitorMove(array $person, string $key, bool $silent = false): array
{
    if (isVisitor($person) || (int) ($person['id'] ?? 0) < 1) {
        throw new LogicException('Only a signed-in person takes a visitor in.');
    }
    // Every table that holds something of a person's needs its own rule here:
    // the move ends by deleting the visitor's rows in all of them.
    if (VISITOR_PERSON_TABLES !== ['quizzes_states', 'user_quiz_history', 'quiz_stats_history']) {
        throw new LogicException('A table in VISITOR_PERSON_TABLES has no rule in visitorMove() yet.');
    }
    visitorsMustBeReady();

    $personId = (int) $person['id'];
    $today = gmdate('Y-m-d');
    try {
        $moved = visitorTransaction(static function (PDO $pdo) use ($key, $personId, $today, $silent): array|null|false {
            $pdo->prepare("SELECT set_config('lock_timeout', ?, true)")->execute([visitorSetting('move_lock_timeout_ms') . 'ms']);

            $select = $pdo->prepare('SELECT id FROM users WHERE visitor_key_hash = ? AND id < 0 FOR UPDATE');
            $select->execute([visitorKeyHash($key)]);
            $visitorId = $select->fetchColumn();
            if ($visitorId === false) {
                return null;
            }
            $visitorId = (int) $visitorId;
            $select = $pdo->prepare('SELECT id FROM users WHERE id = ? AND id > 0 FOR UPDATE');
            $select->execute([$personId]);
            if ($select->fetchColumn() === false) {
                return false;
            }

            // A silent sign-in brings nothing into an account that has its own
            // here: the visitor stays, untouched (the owner's decision).
            if ($silent && personHasData($pdo, $personId)) {
                return ['games' => ['moved' => 0, 'kept' => 0, 'stale' => 0], 'results' => 0, 'stayed' => true];
            }

            // The saved games. (No jsonb `?` operator: it would be read as a
            // placeholder.)
            $count = $pdo->prepare(
                "SELECT count(*) FILTER (WHERE is_daily AND (state ->> 'date') IS DISTINCT FROM ?) AS stale,
                        count(*) FILTER (WHERE NOT is_daily OR (state ->> 'date') = ?) AS movable
                   FROM quizzes_states WHERE user_id = ?"
            );
            $count->execute([$today, $today, $visitorId]);
            $games = $count->fetch(PDO::FETCH_ASSOC);
            $insert = $pdo->prepare(
                "INSERT INTO quizzes_states (user_id, quiz_id, is_daily, state, created_at, updated_at)
                 SELECT ?, quiz_id, is_daily, state, created_at, updated_at
                   FROM quizzes_states
                  WHERE user_id = ? AND (NOT is_daily OR (state ->> 'date') = ?)
                 ON CONFLICT (user_id, quiz_id, is_daily)
                 DO UPDATE SET state = EXCLUDED.state
                         WHERE quizzes_states.is_daily
                           AND (quizzes_states.state ->> 'date') IS DISTINCT FROM ?"
            );
            $insert->execute([$personId, $visitorId, $today, $today]);
            $movedGames = $insert->rowCount();

            // The log, row by row as it is.
            $log = $pdo->prepare('UPDATE user_quiz_history SET user_id = ? WHERE user_id = ?');
            $log->execute([$personId, $visitorId]);

            // The totals, added to the person's.
            $pdo->prepare(
                'INSERT INTO quiz_stats_history (user_id, character_id, quiz_id, wins, losses, attempts, created_at, updated_at)
                 SELECT ?, character_id, quiz_id, wins, losses, attempts, created_at, updated_at
                   FROM quiz_stats_history
                  WHERE user_id = ?
                 ON CONFLICT (user_id, character_id, quiz_id)
                 DO UPDATE SET wins     = quiz_stats_history.wins     + EXCLUDED.wins,
                               losses   = quiz_stats_history.losses   + EXCLUDED.losses,
                               attempts = quiz_stats_history.attempts + EXCLUDED.attempts'
            )->execute([$personId, $visitorId]);

            foreach (VISITOR_PERSON_TABLES as $table) {
                $pdo->prepare("DELETE FROM $table WHERE user_id = ?")->execute([$visitorId]);
            }
            $pdo->prepare('DELETE FROM users WHERE id = ? AND id < 0')->execute([$visitorId]);

            return [
                'games' => ['moved' => $movedGames, 'kept' => (int) $games['movable'] - $movedGames, 'stale' => (int) $games['stale']],
                'results' => $log->rowCount(),
                'stayed' => false,
            ];
        });
    } catch (\PDOException $e) {
        if (in_array((string) $e->getCode(), VISITOR_MOVE_RETRY_STATES, true)) {
            throw new ApiRefusal(
                503,
                'visitor_move_retry',
                'Moving this browser\'s games did not finish this time. Try again in a moment.',
                ['Retry-After' => '2'],
            );
        }
        throw $e;
    }

    if ($moved === false) {
        throw new ApiRefusal(
            401,
            'sign_in_required',
            'Your record here went while this browser\'s games were being moved, and nothing was moved. Sign in to continue.',
            ['WWW-Authenticate' => 'Bearer'],
        );
    }

    return $moved === null
        ? ['found' => false, 'games' => ['moved' => 0, 'kept' => 0, 'stale' => 0], 'results' => 0, 'stayed' => false]
        : ['found' => true] + $moved;
}

/**
 * Whether $userId has anything of its own here yet - a saved game (even a
 * fresh draw: a quiz page was opened), a finished question or a total, in
 * any of VISITOR_PERSON_TABLES. What a silent sign-in's move asks
 * (visitorMove()): an account with none is somebody here for the first time.
 */
function personHasData(PDO $pdo, int $userId): bool
{
    foreach (VISITOR_PERSON_TABLES as $table) {
        $statement = $pdo->prepare("SELECT 1 FROM $table WHERE user_id = ? LIMIT 1");
        $statement->execute([$userId]);
        if ($statement->fetchColumn() !== false) {
            return true;
        }
    }

    return false;
}

/**
 * Deletes the visitors unseen for keep_days with everything of theirs
 * (VISITOR_PERSON_TABLES, then the users row), oldest first, sweep_batch at
 * a time - each batch its own transaction, each statement allowed
 * sweep_timeout_ms, and no new batch once sweep_budget_ms have gone. A
 * visitor another request holds (a save that is writing) is skipped, never
 * waited for: the next sweep takes it. People (positive ids) are never
 * touched, however long ago they were here. Then the counts of new visitors
 * older than an hour go. Nothing while users/045 waits. Returns how many
 * visitors went.
 */
function visitorSweep(): int
{
    if (!visitorsReady()) {
        return 0;
    }

    $pdo = usersDb();
    $keepDays = visitorSetting('keep_days');
    $batch = visitorSetting('sweep_batch');
    $started = hrtime(true);
    $left = static fn(): int => visitorSetting('sweep_budget_ms') - intdiv(hrtime(true) - $started, 1_000_000);
    $gone = 0;

    while ($left() > 0) {
        $timeout = max(1, min(visitorSetting('sweep_timeout_ms'), $left()));
        $swept = visitorTransaction(static function (PDO $pdo) use ($timeout, $keepDays, $batch): int {
            $pdo->prepare("SELECT set_config('statement_timeout', ?, true)")->execute([$timeout . 'ms']);
            $select = $pdo->prepare(
                'SELECT id FROM users WHERE id < 0 AND last_seen_at < now() - make_interval(days => ?::int)
                  ORDER BY last_seen_at LIMIT ? FOR UPDATE SKIP LOCKED'
            );
            $select->execute([$keepDays, $batch]);
            $ids = array_map('intval', $select->fetchAll(PDO::FETCH_COLUMN));
            if ($ids === []) {
                return 0;
            }
            $list = '{' . implode(',', $ids) . '}';
            foreach (VISITOR_PERSON_TABLES as $table) {
                $pdo->prepare("DELETE FROM $table WHERE user_id = ANY(?::int[])")->execute([$list]);
            }
            $delete = $pdo->prepare('DELETE FROM users WHERE id = ANY(?::int[]) AND id < 0');
            $delete->execute([$list]);

            return $delete->rowCount();
        });
        $gone += $swept;
        if ($swept < $batch) {
            break;
        }
    }
    $pdo->exec("DELETE FROM visitor_starts WHERE started_at < now() - interval '1 hour'");
    if ($gone > 0) {
        error_log("[visitors] unseen for $keepDays days, deleted: $gone");
    }

    return $gone;
}

/**
 * $work($pdo) in a transaction of its own: committed when it returns,
 * rolled back when it throws (and the exception goes on). Never inside
 * another one - the sweep runs after the answer, when nothing else is open.
 */
function visitorTransaction(callable $work): mixed
{
    $pdo = usersDb();
    if ($pdo->inTransaction()) {
        throw new LogicException('A visitor transaction never runs inside another one.');
    }
    $pdo->beginTransaction();
    try {
        $result = $work($pdo);
        $pdo->commit();

        return $result;
    } catch (\Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}

/**
 * The sweep, after this request's answer (api/after_response.php): always
 * when $now (a visitor was just made), else at most once every
 * VISITOR_SWEEP_EVERY seconds across the site (the time of the file
 * storage/visitors-swept). Queued once a request, whichever asks first; a
 * later $now still makes it run. It never fails the request: a failure is
 * logged ("[after] ...").
 */
function visitorSweepAfterAnswer(bool $now = false): void
{
    static $queued = false;
    static $forced = false;

    $forced = $forced || $now;
    if ($queued) {
        return;
    }
    $queued = true;
    afterResponse(static function () use (&$forced): void {
        if ($forced || visitorSweepDue()) {
            visitorSweep();
        }
    });
}

/** Where the time of the last sweep is kept (backend/storage/, gitignored, shipped hardened). */
function visitorSweepMarker(): string
{
    return dirname(__DIR__) . '/storage/visitors-swept';
}

/**
 * Is a sweep due - the marker missing or older than VISITOR_SWEEP_EVERY? If
 * so it is touched first, so the requests right after this one do not sweep
 * too. (A storage that cannot be written sweeps every time, which costs one
 * indexed look.)
 */
function visitorSweepDue(): bool
{
    $marker = visitorSweepMarker();
    clearstatcache(true, $marker);
    $at = @filemtime($marker);
    if ($at !== false && $at > time() - VISITOR_SWEEP_EVERY) {
        return false;
    }
    if (!is_dir(dirname($marker))) {
        @mkdir(dirname($marker), 0775, true);
    }
    @touch($marker);

    return true;
}
