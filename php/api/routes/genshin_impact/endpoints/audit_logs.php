<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * Read-only browsing of the audit trail written by DbQuery::insert/update.
 *
 *   GET /api/audit-logs/filters   the distinct tables, actions and users
 *   GET /api/audit-logs?...       one page, newest first
 *
 * There are six figures of rows, so everything is filtered and paged in SQL.
 */

const AUDIT_PAGE_SIZE = 50;

$app->get('/api/audit-logs/filters', function (Request $request, Response $response) {
    $pdo = genshinDb();

    $tables = array_column($pdo->query('SELECT DISTINCT table_name FROM audit_logs ORDER BY table_name')->fetchAll(), 'table_name');
    $actions = array_column($pdo->query('SELECT DISTINCT action FROM audit_logs ORDER BY action')->fetchAll(), 'action');
    $userIds = array_filter(array_column($pdo->query('SELECT DISTINCT changed_by FROM audit_logs')->fetchAll(), 'changed_by'));

    // The users live in a separate database, so resolve the names separately.
    $users = [];
    if ($userIds) {
        $placeholders = implode(',', array_fill(0, count($userIds), '?'));
        $stmt = usersDb()->prepare("SELECT id, username FROM users WHERE id IN ($placeholders)");
        $stmt->execute(array_values($userIds));
        $users = $stmt->fetchAll();
    }

    return respondJson($response, ['tables' => $tables, 'actions' => $actions, 'users' => $users]);
})->add(requireRole(...ROLES_SYSTEM_READ))->add(requireAuth());

$app->get('/api/audit-logs', function (Request $request, Response $response) {
    $query = $request->getQueryParams();
    $pdo = genshinDb();

    $where = [];
    $params = [];

    if (!empty($query['table'])) {
        $where[] = 'table_name = ?';
        $params[] = $query['table'];
    }
    if (!empty($query['action'])) {
        $where[] = 'action = ?';
        $params[] = $query['action'];
    }
    if (!empty($query['user'])) {
        $where[] = 'changed_by = ?';
        $params[] = (int) $query['user'];
    }
    if (!empty($query['recordId'])) {
        $where[] = 'record_id = ?';
        $params[] = (string) $query['recordId'];
    }
    if (!empty($query['from'])) {
        $where[] = 'changed_at >= ?';
        $params[] = $query['from'];
    }
    if (!empty($query['to'])) {
        // Inclusive of the whole day when only a date is given.
        $where[] = 'changed_at < (?::timestamp + interval \'1 day\')';
        $params[] = $query['to'];
    }

    $sql = $where ? ' WHERE ' . implode(' AND ', $where) : '';

    $countStmt = $pdo->prepare("SELECT count(*) FROM audit_logs$sql");
    $countStmt->execute($params);
    $total = (int) $countStmt->fetchColumn();

    $page = max(1, (int) ($query['page'] ?? 1));
    $offset = ($page - 1) * AUDIT_PAGE_SIZE;

    $stmt = $pdo->prepare("SELECT * FROM audit_logs$sql ORDER BY changed_at DESC, id DESC LIMIT " . AUDIT_PAGE_SIZE . " OFFSET $offset");
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    // Attach the username for display; the ids come from the users database.
    $userIds = array_filter(array_unique(array_column($rows, 'changed_by')));
    $names = [];
    if ($userIds) {
        $placeholders = implode(',', array_fill(0, count($userIds), '?'));
        $userStmt = usersDb()->prepare("SELECT id, username FROM users WHERE id IN ($placeholders)");
        $userStmt->execute(array_values($userIds));
        foreach ($userStmt->fetchAll() as $user) {
            $names[$user['id']] = $user['username'];
        }
    }
    foreach ($rows as &$row) {
        $row['changed_by_username'] = $names[$row['changed_by']] ?? null;
        $row['changes'] = json_decode((string) $row['changes'], true);
    }
    unset($row);

    return respondJson($response, [
        'total' => $total,
        'page' => $page,
        'pageSize' => AUDIT_PAGE_SIZE,
        'items' => $rows,
    ]);
})->add(requireRole(...ROLES_SYSTEM_READ))->add(requireAuth());
