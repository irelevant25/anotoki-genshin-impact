<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * Feedback and contact messages from the site.
 *
 *   POST   /api/feedback              open to everyone, signed in or not
 *   GET    /api/feedback              admin list, filtered and paged
 *   GET    /api/feedback/filters      the sections and counts the list needs
 *   GET    /api/feedback/{id}         one message in full
 *   PUT    /api/feedback/{id}/status  new / read / resolved / spam
 *   DELETE /api/feedback/{id}         for the ones that are only ever spam
 */

const FEEDBACK_PAGE_SIZE = 25;

/** How many one sender may post per hour before being asked to slow down. */
const FEEDBACK_RATE_LIMIT = 5;

const FEEDBACK_TYPES = ['Bug', 'Suggestion', 'Other'];
const FEEDBACK_STATUSES = ['new', 'read', 'resolved', 'spam'];

/** Long-text fields, capped so a public endpoint cannot be used to store a novel. */
const FEEDBACK_TEXT_FIELDS = [
    'message' => 5000,
    'steps_to_reproduce' => 5000,
    'expected_behavior' => 2000,
    'actual_behavior' => 2000,
    'browser_device_info' => 500,
    'details' => 5000,
    'why_important' => 2000,
    'additional_info' => 5000,
];

/**
 * A stable, non-reversible id for the sender, for rate limiting only.
 *
 * The address itself is never stored: the point is to notice the same sender
 * twice in an hour, not to keep a record of where anybody was.
 */
function feedbackSubmitterHash(Request $request): string
{
    $server = $request->getServerParams();
    $address = $server['REMOTE_ADDR'] ?? 'unknown';

    // Salted with the JWT secret so the hashes cannot be reproduced by anyone
    // guessing at addresses and hashing them.
    return hash('sha256', getJwtSecret() . '|feedback|' . $address);
}

function feedbackTrim(mixed $value, int $limit): ?string
{
    if ($value === null) {
        return null;
    }
    $text = trim((string) $value);
    if ($text === '') {
        return null;
    }
    return mb_substr($text, 0, $limit);
}

// ---------------------------------------------------------------------------
// POST /api/feedback
// ---------------------------------------------------------------------------
$app->post('/api/feedback', function (Request $request, Response $response) {
    $pdo = genshinDb();
    $body = $request->getParsedBody() ?? [];

    $type = $body['type'] ?? '';
    if (!in_array($type, FEEDBACK_TYPES, true)) {
        return respondJson($response, ['error' => 'Choose a type of Bug, Suggestion or Other'], 422);
    }

    // A report with nothing in it helps nobody, and the required field differs
    // by type, which is the check the form itself was getting wrong.
    $required = $type === 'Other' ? 'message' : 'title';
    if (feedbackTrim($body[$required] ?? null, 5000) === null) {
        $wanted = $required === 'message' ? 'Please write a message' : 'Please give it a title';
        return respondJson($response, ['error' => $wanted], 422);
    }

    $hash = feedbackSubmitterHash($request);
    $recent = $pdo->prepare(
        "SELECT count(*) FROM feedback WHERE submitter_hash = ? AND created_at >= now() - interval '1 hour'"
    );
    $recent->execute([$hash]);
    if ((int) $recent->fetchColumn() >= FEEDBACK_RATE_LIMIT) {
        return respondJson($response, ['error' => 'That is a lot of messages in one hour. Please try again later.'], 429);
    }

    // Identity comes from the token, never from the body: the browser may say
    // who it is, but only the token proves it. Ticking anonymous drops it
    // entirely, even for someone signed in.
    $anonymous = !empty($body['anonymous']);
    $user = $anonymous ? null : optionalAuthUser($request);

    $email = $anonymous ? null : feedbackTrim($body['email'] ?? null, 255);
    if ($email !== null && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return respondJson($response, ['error' => 'That does not look like an email address'], 422);
    }

    $columns = [
        'type' => $type,
        'section' => feedbackTrim($body['section'] ?? null, 100),
        'title' => feedbackTrim($body['title'] ?? null, 200),
        'user_id' => $user['id'] ?? null,
        'username' => $user['username'] ?? null,
        // Someone signed in who leaves the box alone is reachable at their
        // account address, which saves them retyping it.
        'email' => $email ?? ($user['email'] ?? null),
        'page_url' => feedbackTrim($body['page_url'] ?? null, 500),
        'user_agent' => feedbackTrim($request->getHeaderLine('User-Agent'), 500),
        'language' => feedbackTrim($body['language'] ?? null, 10),
        'submitter_hash' => $hash,
    ];
    foreach (FEEDBACK_TEXT_FIELDS as $field => $limit) {
        $columns[$field] = feedbackTrim($body[$field] ?? null, $limit);
    }

    $names = implode(', ', array_keys($columns));
    $marks = implode(', ', array_fill(0, count($columns), '?'));
    $pdo->prepare("INSERT INTO feedback ($names) VALUES ($marks)")->execute(array_values($columns));

    // Deliberately thin: the sender does not need the row back, and handing an
    // id to an unauthenticated caller invites poking at it.
    return respondJson($response, ['message' => 'Thank you - your message has been received.'], 201);
})->add(responds(ApiMessage::class));

// ---------------------------------------------------------------------------
// GET /api/feedback/filters
// ---------------------------------------------------------------------------
$app->get('/api/feedback/filters', function (Request $request, Response $response) {
    $pdo = genshinDb();

    $sections = array_column(
        $pdo->query("SELECT DISTINCT section FROM feedback WHERE section IS NOT NULL AND section <> '' ORDER BY section")->fetchAll(),
        'section'
    );

    $byStatus = [];
    foreach ($pdo->query('SELECT status, count(*) AS total FROM feedback GROUP BY status') as $row) {
        $byStatus[$row['status']] = (int) $row['total'];
    }
    $byType = [];
    foreach ($pdo->query('SELECT type, count(*) AS total FROM feedback GROUP BY type') as $row) {
        $byType[$row['type']] = (int) $row['total'];
    }

    return respondJson($response, [
        'sections' => $sections,
        'statuses' => FEEDBACK_STATUSES,
        'types' => FEEDBACK_TYPES,
        'byStatus' => $byStatus,
        'byType' => $byType,
    ]);
})->add(responds(FeedbackFilters::class))->add(requireRole(...ROLES_SYSTEM_READ))->add(requireAuth());

// ---------------------------------------------------------------------------
// GET /api/feedback
// ---------------------------------------------------------------------------
$app->get('/api/feedback', function (Request $request, Response $response) {
    $pdo = genshinDb();
    $query = $request->getQueryParams();

    $where = [];
    $params = [];

    if (!empty($query['type'])) {
        $where[] = 'type = ?';
        $params[] = $query['type'];
    }
    if (!empty($query['status'])) {
        $where[] = 'status = ?';
        $params[] = $query['status'];
    }
    if (!empty($query['section'])) {
        $where[] = 'section = ?';
        $params[] = $query['section'];
    }
    if (trim((string) ($query['search'] ?? '')) !== '') {
        // Across everything a message can carry text in, so searching for a
        // phrase someone used finds it wherever the form put it.
        $where[] = '(title ILIKE ? OR message ILIKE ? OR details ILIKE ? OR steps_to_reproduce ILIKE ?
                     OR actual_behavior ILIKE ? OR expected_behavior ILIKE ? OR additional_info ILIKE ?
                     OR why_important ILIKE ? OR email ILIKE ? OR username ILIKE ?)';
        $needle = '%' . trim((string) $query['search']) . '%';
        $params = array_merge($params, array_fill(0, 10, $needle));
    }

    $sql = $where ? ' WHERE ' . implode(' AND ', $where) : '';

    $countStmt = $pdo->prepare("SELECT count(*) FROM feedback$sql");
    $countStmt->execute($params);
    $total = (int) $countStmt->fetchColumn();

    $page = max(1, (int) ($query['page'] ?? 1));
    $offset = ($page - 1) * FEEDBACK_PAGE_SIZE;

    $stmt = $pdo->prepare(
        "SELECT * FROM feedback$sql ORDER BY created_at DESC, id DESC LIMIT " . FEEDBACK_PAGE_SIZE . " OFFSET $offset"
    );
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    foreach ($rows as &$row) {
        // Never leaves the server: it exists for rate limiting, not for reading.
        unset($row['submitter_hash']);
    }
    unset($row);

    return respondJson($response, [
        'total' => $total,
        'page' => $page,
        'pageSize' => FEEDBACK_PAGE_SIZE,
        'items' => $rows,
    ]);
})->add(responds(FeedbackPage::class))->add(requireRole(...ROLES_SYSTEM_READ))->add(requireAuth());

// ---------------------------------------------------------------------------
// GET /api/feedback/{id}
// ---------------------------------------------------------------------------
$app->get('/api/feedback/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $stmt = genshinDb()->prepare('SELECT * FROM feedback WHERE id = ?');
    $stmt->execute([(int) $args['id']]);
    $row = $stmt->fetch();

    if (!$row) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }
    unset($row['submitter_hash']);

    return respondJson($response, $row);
})->add(responds('feedback'))->add(requireRole(...ROLES_SYSTEM_READ))->add(requireAuth());

// ---------------------------------------------------------------------------
// PUT /api/feedback/{id}/status
//
// The only thing an admin can change. The message itself is what someone
// wrote, so nothing here edits it.
// ---------------------------------------------------------------------------
$app->put('/api/feedback/{id}/status', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();
    $status = $request->getParsedBody()['status'] ?? '';

    if (!in_array($status, FEEDBACK_STATUSES, true)) {
        return respondJson($response, ['error' => "Unknown status '$status'"], 422);
    }

    $stmt = $pdo->prepare('UPDATE feedback SET status = ? WHERE id = ?');
    $stmt->execute([$status, (int) $args['id']]);

    if (!$stmt->rowCount()) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }
    return respondJson($response, ['id' => (int) $args['id'], 'status' => $status]);
})->add(responds(FeedbackStatusChanged::class))->add(requireRole(...ROLES_SYSTEM_WRITE))->add(requireAuth());

// ---------------------------------------------------------------------------
// DELETE /api/feedback/{id}
//
// Admin only. Marking something as spam keeps it out of the way, so deleting
// is for when it should not be kept at all.
// ---------------------------------------------------------------------------
$app->delete('/api/feedback/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();
    $stmt = $pdo->prepare('DELETE FROM feedback WHERE id = ?');
    $stmt->execute([(int) $args['id']]);

    return $stmt->rowCount()
        ? respondJson($response, ['message' => 'Deleted successfully'])
        : respondJson($response, ['error' => 'Not found'], 404);
})->add(responds('feedback'))->add(requireRole(...ROLES_SYSTEM_WRITE))->add(requireAuth());
