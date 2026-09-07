<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * Read-only browsing of email_log - the record of what the API has sent.
 *
 *   GET /api/emails/filters   the distinct kinds and statuses, for the dropdowns
 *   GET /api/emails?...       one page, newest first, filtered in SQL
 *
 * Written at sendMail() (see api/mail.php); this only reads it. Metadata only -
 * no bodies, and a subject only for the kinds whose subject is not sensitive.
 */

const EMAIL_LOG_PAGE_SIZE = 50;

$app->get('/api/emails/filters', function (Request $request, Response $response) {
    $pdo = usersDb();

    $kinds = array_column($pdo->query('SELECT DISTINCT kind FROM email_log ORDER BY kind')->fetchAll(), 'kind');
    $statuses = array_column($pdo->query('SELECT DISTINCT status FROM email_log ORDER BY status')->fetchAll(), 'status');

    return respondJson($response, ['kinds' => $kinds, 'statuses' => $statuses]);
})->add(responds(EmailLogFilters::class))->add(requireRole(...ROLES_SYSTEM_READ))->add(requireAuth());

$app->get('/api/emails', function (Request $request, Response $response) {
    $query = $request->getQueryParams();
    $pdo = usersDb();

    $where = [];
    $params = [];

    if (!empty($query['kind'])) {
        $where[] = 'e.kind = ?';
        $params[] = (string) $query['kind'];
    }
    if (!empty($query['status'])) {
        $where[] = 'e.status = ?';
        $params[] = (string) $query['status'];
    }
    if (!empty($query['recipient'])) {
        $where[] = 'e.recipient ILIKE ?';
        $params[] = '%' . $query['recipient'] . '%';
    }
    if (!empty($query['from'])) {
        $where[] = 'e.created_at >= ?';
        $params[] = (string) $query['from'];
    }
    if (!empty($query['to'])) {
        // Inclusive of the whole day when only a date is given.
        $where[] = "e.created_at < (?::timestamp + interval '1 day')";
        $params[] = (string) $query['to'];
    }

    $sql = $where ? ' WHERE ' . implode(' AND ', $where) : '';

    $countStmt = $pdo->prepare("SELECT count(*) FROM email_log e$sql");
    $countStmt->execute($params);
    $total = (int) $countStmt->fetchColumn();

    $page = max(1, (int) ($query['page'] ?? 1));
    $offset = ($page - 1) * EMAIL_LOG_PAGE_SIZE;

    // The username is resolved in the same query - email_log and users are in
    // this one database, unlike the cross-database audit log.
    $stmt = $pdo->prepare(
        "SELECT e.*, u.username
         FROM email_log e
         LEFT JOIN users u ON u.id = e.user_id
         $sql
         ORDER BY e.created_at DESC, e.id DESC
         LIMIT " . EMAIL_LOG_PAGE_SIZE . " OFFSET $offset"
    );
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    return respondJson($response, [
        'total' => $total,
        'page' => $page,
        'pageSize' => EMAIL_LOG_PAGE_SIZE,
        'items' => $rows,
    ]);
})->add(responds(EmailLogPage::class))->add(requireRole(...ROLES_SYSTEM_READ))->add(requireAuth());
