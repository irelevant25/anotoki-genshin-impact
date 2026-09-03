<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * The session history, for the whole installation.
 *
 *   GET    /api/sessions           every session ever, filtered
 *   DELETE /api/sessions/{id}      end one of them
 *
 * A person can already see their own sessions on their profile. This is the
 * same table read from the other side: who has signed in here, from where,
 * how, and which of those are still live right now.
 *
 * It is a read an admin makes about other people, so it is System and it is
 * ADMIN rather than editor-readable. What it carries is what the request
 * carried - an address and a user agent, neither examined and neither
 * trustworthy on its own - plus how the session was started and how it ended.
 * Nothing here is a secret: the token id that actually names a session is not
 * in any response, because knowing it is most of the way to using it.
 */

/** As many rows as a page can usefully draw before the filter is the answer. */
const ADMIN_SESSION_PAGE = 200;

/** Every column of a session, plus whose it is. */
const ADMIN_SESSION_SELECT =
    'SELECT s.id, s.user_id, u.username, u.email, s.method, s.ip, s.mac, s.user_agent,
            s.created_at, s.last_seen_at, s.expires_at, s.revoked_at, s.revoked_reason
       FROM user_sessions s
       JOIN users u ON u.id = s.user_id';

// ── GET /api/sessions ────────────────────────────────────────────────────────
//
// `status=active` is the filter the page exists for: not "sessions that have
// not been signed out" but sessions that would work if their browser made a
// request this second, which means unrevoked and unexpired both. Expiry is
// compared here against the database's own clock rather than handed to the
// caller to work out - the browser reading this is in some other timezone with
// some other idea of what time it is.

$app->get('/api/sessions', function (Request $request, Response $response) {
    $pdo = usersDb();
    $query = $request->getQueryParams();

    $where = ['1 = 1'];
    $params = [];

    if ($search = trim((string) ($query['search'] ?? ''))) {
        $where[] = '(u.username ILIKE ? OR u.email ILIKE ? OR s.ip ILIKE ?)';
        $params[] = '%' . $search . '%';
        $params[] = '%' . $search . '%';
        $params[] = '%' . $search . '%';
    }

    if ($userId = (int) ($query['user_id'] ?? 0)) {
        $where[] = 's.user_id = ?';
        $params[] = $userId;
    }

    if ($method = trim((string) ($query['method'] ?? ''))) {
        $where[] = 's.method = ?';
        $params[] = $method;
    }

    $live = 's.revoked_at IS NULL AND s.expires_at > CURRENT_TIMESTAMP';
    $status = (string) ($query['status'] ?? '');

    if ($status === 'active') {
        $where[] = $live;
    } elseif ($status === 'ended') {
        $where[] = 'NOT (' . $live . ')';
    }

    $filter = implode(' AND ', $where);

    $statement = $pdo->prepare(ADMIN_SESSION_SELECT . ' WHERE ' . $filter . ' ORDER BY s.created_at DESC, s.id DESC LIMIT ' . ADMIN_SESSION_PAGE);
    $statement->execute($params);

    $sessions = array_map(static fn(array $row): array => [
        'id' => (int) $row['id'],
        'user_id' => (int) $row['user_id'],
        'username' => $row['username'],
        'email' => $row['email'],
        'method' => $row['method'],
        'ip' => $row['ip'],
        'mac' => $row['mac'],
        'user_agent' => $row['user_agent'],
        'created_at' => $row['created_at'],
        'last_seen_at' => $row['last_seen_at'],
        'expires_at' => $row['expires_at'],
        'revoked_at' => $row['revoked_at'],
        'revoked_reason' => $row['revoked_reason'],
        'active' => $row['revoked_at'] === null && strtotime((string) $row['expires_at']) > time(),
    ], $statement->fetchAll());

    // How many the filter actually matched, so a page that had to stop at
    // ADMIN_SESSION_PAGE rows can say it did rather than quietly appear
    // complete.
    $counted = $pdo->prepare('SELECT count(*) FROM user_sessions s JOIN users u ON u.id = s.user_id WHERE ' . $filter);
    $counted->execute($params);

    return respondJson($response, [
        'sessions' => $sessions,
        'total' => (int) $counted->fetchColumn(),
        // Unfiltered on purpose: "how many people are signed in right now" is
        // the number worth having at the top of the page, and it should not
        // change because somebody typed a name into the search box.
        'active' => (int) $pdo->query('SELECT count(*) FROM user_sessions s WHERE ' . $live)->fetchColumn(),
        'methods' => $pdo->query('SELECT DISTINCT method FROM user_sessions ORDER BY method')->fetchAll(PDO::FETCH_COLUMN),
    ]);
})->add(responds(AdminSessionList::class))->add(requireRole('ADMIN'))->add(requireAuth());

// ── DELETE /api/sessions/{id} ────────────────────────────────────────────────
//
// Ending somebody else's session, for the case this page is really for: a
// laptop left signed in somewhere it should not be. The row stays and gains a
// reason, like every other way a session ends - the history is the point, and
// a history with holes in it is not one.

$app->delete('/api/sessions/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $pdo = usersDb();
    $id = (int) $args['id'];

    $statement = $pdo->prepare('SELECT id FROM user_sessions WHERE id = ?');
    $statement->execute([$id]);

    if (!$statement->fetch()) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    // False when it had already ended, which is not an error worth raising:
    // the caller asked for it to be over and it is over.
    revokeSession($pdo, $id, SESSION_REVOKED_SECURITY);

    return respondJson($response, ['message' => 'Session ended']);
})->add(responds(ApiMessage::class))->add(requireRole('ADMIN'))->add(requireAuth());
