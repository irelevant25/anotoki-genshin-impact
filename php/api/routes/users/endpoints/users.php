<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * Accounts.
 *
 *   GET    /api/users                  everyone, with filters
 *   GET    /api/users/{id}             one account
 *   POST   /api/users                  create one by hand
 *   PUT    /api/users/{id}             change username, email, role, language
 *   PUT    /api/users/{id}/password    set a new password without the old one
 *   PUT    /api/users/{id}/enabled     switch an account off, or back on
 *   DELETE /api/users/{id}             soft delete
 *
 * This is System: admins do all of it, editors may look, and nobody else gets
 * near it. Reading used to be open to the whole internet, which quietly
 * published every registered email address.
 *
 * `password` never leaves here, in any response, for anybody.
 */

/** Everything about an account except the one thing nobody may read. */
const USER_COLUMNS = 'id, role, username, email, email_confirmed, background, language, '
    . 'theme_main, theme_admin, deleted, version, created_at, updated_at';

const USER_ROLES = ['ADMIN', 'EDITOR', 'USER'];

/** Long enough to be worth having, short enough that nobody argues. */
const USER_PASSWORD_MIN = 8;

/**
 * Deliberately looser than FILTER_VALIDATE_EMAIL.
 *
 * That filter rejects a domain without a dot, which rules out `admin@localhost`
 * - the shape of the account this installation already has. An admin typing an
 * address in by hand is a different situation from a stranger submitting one
 * through a public form, where the strict filter still applies.
 */
function userValidEmail(string $email): bool
{
    if (preg_match('/\s/', $email) || substr_count($email, '@') !== 1) {
        return false;
    }

    [$local, $domain] = explode('@', $email);

    return $local !== '' && $domain !== '' && !str_starts_with($domain, '.') && !str_ends_with($domain, '.');
}

function userValidateRole(?string $role): ?string
{
    if ($role === null || $role === '') {
        return null;
    }
    return in_array(strtoupper($role), USER_ROLES, true) ? null : 'Role must be one of ' . implode(', ', USER_ROLES);
}

/**
 * Refuses the changes an admin should not be able to make to their own account.
 *
 * Locking yourself out of the only admin account is a five-second mistake and a
 * long evening with a SQL prompt.
 */
function userRefuseSelfLockout(array $actor, int $targetId, ?string $newRole, ?bool $enabled): ?string
{
    if ((int) $actor['id'] !== $targetId) {
        return null;
    }

    if ($enabled === false) {
        return 'You cannot disable or delete your own account';
    }

    if ($newRole !== null && strtoupper($newRole) !== 'ADMIN') {
        return 'You cannot take the admin role away from yourself';
    }

    return null;
}

/** How many admins are left, so the last one cannot be removed by accident. */
function userAdminCount(PDO $pdo): int
{
    return (int) $pdo
        ->query("SELECT count(*) FROM users WHERE upper(role) = 'ADMIN' AND deleted = false")
        ->fetchColumn();
}

// ── GET /api/users ───────────────────────────────────────────────────────────
// Disabled accounts are included, flagged rather than hidden: an admin list
// that silently omits them is how somebody ends up wondering where a user went.

$app->get('/api/users', function (Request $request, Response $response) {
    $query = $request->getQueryParams();
    $search = trim((string) ($query['search'] ?? ''));
    $role = strtoupper(trim((string) ($query['role'] ?? '')));
    $status = (string) ($query['status'] ?? '');

    $where = ['1 = 1'];
    $params = [];

    if ($search !== '') {
        $where[] = '(username ILIKE ? OR email ILIKE ?)';
        $params[] = '%' . $search . '%';
        $params[] = '%' . $search . '%';
    }

    if (in_array($role, USER_ROLES, true)) {
        $where[] = 'upper(role) = ?';
        $params[] = $role;
    }

    if ($status === 'enabled' || $status === 'disabled') {
        $where[] = 'deleted = ?';
        $params[] = $status === 'disabled' ? 'true' : 'false';
    }

    $statement = usersDb()->prepare(
        'SELECT ' . USER_COLUMNS . ' FROM users WHERE ' . implode(' AND ', $where) . ' ORDER BY created_at DESC, id DESC'
    );
    $statement->execute($params);

    return respondJson($response, $statement->fetchAll());
})->add(responds(AdminUser::class, list: true))->add(requireRole(...ROLES_SYSTEM_READ))->add(requireAuth());

// ── GET /api/users/filters ───────────────────────────────────────────────────

$app->get('/api/users/filters', function (Request $request, Response $response) {
    $pdo = usersDb();

    $byRole = [];
    foreach ($pdo->query('SELECT role, count(*) AS total FROM users WHERE deleted = false GROUP BY role')->fetchAll() as $row) {
        $byRole[strtoupper($row['role'])] = (int) $row['total'];
    }

    return respondJson($response, [
        'roles' => USER_ROLES,
        'byRole' => $byRole,
        'disabled' => (int) $pdo->query('SELECT count(*) FROM users WHERE deleted = true')->fetchColumn(),
        'total' => (int) $pdo->query('SELECT count(*) FROM users WHERE deleted = false')->fetchColumn(),
        'admins' => userAdminCount($pdo),
        'passwordMinLength' => USER_PASSWORD_MIN,
    ]);
})->add(responds(UserFilters::class))->add(requireRole(...ROLES_SYSTEM_READ))->add(requireAuth());

// ── GET /api/users/{id} ──────────────────────────────────────────────────────

$app->get('/api/users/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $statement = usersDb()->prepare('SELECT ' . USER_COLUMNS . ' FROM users WHERE id = ?');
    $statement->execute([$args['id']]);
    $user = $statement->fetch();

    return $user
        ? respondJson($response, $user)
        : respondJson($response, ['error' => 'Not found'], 404);
})->add(responds(AdminUser::class))->add(requireRole(...ROLES_SYSTEM_READ))->add(requireAuth());

// ── POST /api/users ──────────────────────────────────────────────────────────
// Creating an account by hand, for the people who should not have to register
// and then wait to be promoted.

$app->post('/api/users', function (Request $request, Response $response) {
    $pdo = usersDb();
    $body = $request->getParsedBody() ?? [];

    $username = trim((string) ($body['username'] ?? ''));
    $email = trim((string) ($body['email'] ?? ''));
    $password = (string) ($body['password'] ?? '');
    $role = strtoupper(trim((string) ($body['role'] ?? 'USER')));

    if ($username === '' || $email === '') {
        return respondJson($response, ['error' => 'Username and email are required'], 422);
    }

    if (!userValidEmail($email)) {
        return respondJson($response, ['error' => 'That does not look like an email address'], 422);
    }

    if (strlen($password) < USER_PASSWORD_MIN) {
        return respondJson($response, ['error' => 'The password needs at least ' . USER_PASSWORD_MIN . ' characters'], 422);
    }

    if ($error = userValidateRole($role)) {
        return respondJson($response, ['error' => $error], 422);
    }

    // Checked rather than left to the unique index, so the answer says which
    // field is the problem instead of surfacing a constraint name.
    $taken = $pdo->prepare('SELECT username, email FROM users WHERE username = ? OR email = ?');
    $taken->execute([$username, $email]);
    if ($existing = $taken->fetch()) {
        $field = strcasecmp($existing['username'], $username) === 0 ? 'username' : 'email address';
        return respondJson($response, ['error' => 'That ' . $field . ' is already taken'], 409);
    }

    $insert = $pdo->prepare(
        'INSERT INTO users (username, email, password, role, email_confirmed, language)
         VALUES (?, ?, ?, ?, ?, ?) RETURNING ' . USER_COLUMNS
    );
    $insert->execute([
        $username,
        $email,
        password_hash($password, PASSWORD_DEFAULT),
        $role,
        // Made by an admin who typed the address in, so there is nobody to
        // confirm it to.
        true,
        trim((string) ($body['language'] ?? 'en')) ?: 'en',
    ]);

    return respondJson($response, $insert->fetch(), 201);
})->add(responds(AdminUser::class))->add(requireRole(...ROLES_SYSTEM_WRITE))->add(requireAuth());

// ── PUT /api/users/{id} ──────────────────────────────────────────────────────
// Username, email, role and language. The password has its own endpoint, so it
// cannot be changed by accident along with everything else.

$app->put('/api/users/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $pdo = usersDb();
    $id = (int) $args['id'];
    $body = $request->getParsedBody() ?? [];
    $actor = $request->getAttribute('user');

    $existing = $pdo->prepare('SELECT * FROM users WHERE id = ?');
    $existing->execute([$id]);
    $target = $existing->fetch();

    if (!$target) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    $changes = [];

    if (array_key_exists('username', $body)) {
        $username = trim((string) $body['username']);
        if ($username === '') {
            return respondJson($response, ['error' => 'Username cannot be empty'], 422);
        }
        $changes['username'] = $username;
    }

    if (array_key_exists('email', $body)) {
        $email = trim((string) $body['email']);
        if (!userValidEmail($email)) {
            return respondJson($response, ['error' => 'That does not look like an email address'], 422);
        }
        $changes['email'] = $email;
    }

    if (array_key_exists('role', $body)) {
        $role = strtoupper(trim((string) $body['role']));
        if ($error = userValidateRole($role)) {
            return respondJson($response, ['error' => $error], 422);
        }
        if ($error = userRefuseSelfLockout($actor, $id, $role, null)) {
            return respondJson($response, ['error' => $error], 422);
        }
        if (strtoupper($target['role']) === 'ADMIN' && $role !== 'ADMIN' && userAdminCount($pdo) <= 1) {
            return respondJson($response, ['error' => 'This is the only admin account left'], 422);
        }
        $changes['role'] = $role;
    }

    if (array_key_exists('language', $body)) {
        $changes['language'] = trim((string) $body['language']) ?: 'en';
    }

    if (array_key_exists('email_confirmed', $body)) {
        $changes['email_confirmed'] = !empty($body['email_confirmed']);
    }

    if (!$changes) {
        return respondJson($response, ['error' => 'Nothing to change'], 422);
    }

    $clash = $pdo->prepare('SELECT username, email FROM users WHERE id <> ? AND (username = ? OR email = ?)');
    $clash->execute([$id, $changes['username'] ?? $target['username'], $changes['email'] ?? $target['email']]);
    if ($other = $clash->fetch()) {
        $field = strcasecmp($other['username'], $changes['username'] ?? $target['username']) === 0 ? 'username' : 'email address';
        return respondJson($response, ['error' => 'That ' . $field . ' is already taken'], 409);
    }

    $sets = implode(', ', array_map(fn($column) => $column . ' = ?', array_keys($changes)));
    $update = $pdo->prepare(
        'UPDATE users SET ' . $sets . ', updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING ' . USER_COLUMNS
    );
    $update->execute([...array_values($changes), $id]);

    return respondJson($response, $update->fetch());
})->add(responds(AdminUser::class))->add(requireRole(...ROLES_SYSTEM_WRITE))->add(requireAuth());

// ── PUT /api/users/{id}/password ─────────────────────────────────────────────
// An admin setting somebody's password without knowing the old one, which is
// what "I am locked out" actually needs.

$app->put('/api/users/{id:[0-9]+}/password', function (Request $request, Response $response, array $args) {
    $pdo = usersDb();
    $body = $request->getParsedBody() ?? [];
    $password = (string) ($body['password'] ?? '');

    if (strlen($password) < USER_PASSWORD_MIN) {
        return respondJson($response, ['error' => 'The password needs at least ' . USER_PASSWORD_MIN . ' characters'], 422);
    }

    $exists = $pdo->prepare('SELECT id FROM users WHERE id = ?');
    $exists->execute([$args['id']]);
    if (!$exists->fetch()) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    $pdo->prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        ->execute([password_hash($password, PASSWORD_DEFAULT), $args['id']]);

    // Existing tokens keep working: they are signed, not looked up. Worth
    // saying so rather than letting an admin believe this kicks somebody out.
    return respondJson($response, [
        'message' => 'Password changed',
        'note' => 'Any session they already have stays signed in until its token expires.',
    ]);
})->add(responds(ApiMessage::class))->add(requireRole(...ROLES_SYSTEM_WRITE))->add(requireAuth());

// ── PUT /api/users/{id}/enabled ──────────────────────────────────────────────
// `deleted` is what the rest of the API already checks on every request, so
// switching it is what disabling an account means here. Nothing is destroyed.

$app->put('/api/users/{id:[0-9]+}/enabled', function (Request $request, Response $response, array $args) {
    $pdo = usersDb();
    $id = (int) $args['id'];
    $body = $request->getParsedBody() ?? [];
    $actor = $request->getAttribute('user');

    if (!array_key_exists('enabled', $body)) {
        return respondJson($response, ['error' => 'enabled is required'], 422);
    }

    $enabled = (bool) $body['enabled'];

    $existing = $pdo->prepare('SELECT role, deleted FROM users WHERE id = ?');
    $existing->execute([$id]);
    $target = $existing->fetch();

    if (!$target) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    if ($error = userRefuseSelfLockout($actor, $id, null, $enabled)) {
        return respondJson($response, ['error' => $error], 422);
    }

    if (!$enabled && strtoupper($target['role']) === 'ADMIN' && userAdminCount($pdo) <= 1) {
        return respondJson($response, ['error' => 'This is the only admin account left'], 422);
    }

    $update = $pdo->prepare(
        'UPDATE users SET deleted = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING ' . USER_COLUMNS
    );
    $update->execute([$enabled ? 'false' : 'true', $id]);

    return respondJson($response, $update->fetch());
})->add(responds(AdminUser::class))->add(requireRole(...ROLES_SYSTEM_WRITE))->add(requireAuth());

// ── DELETE /api/users/{id} ───────────────────────────────────────────────────
// The same soft delete as disabling, kept because the rest of the API and
// anything already written against it expect this route to exist.

$app->delete('/api/users/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $pdo = usersDb();
    $id = (int) $args['id'];
    $actor = $request->getAttribute('user');

    $existing = $pdo->prepare('SELECT role FROM users WHERE id = ? AND deleted = false');
    $existing->execute([$id]);
    $target = $existing->fetch();

    if (!$target) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    if ($error = userRefuseSelfLockout($actor, $id, null, false)) {
        return respondJson($response, ['error' => $error], 422);
    }

    if (strtoupper($target['role']) === 'ADMIN' && userAdminCount($pdo) <= 1) {
        return respondJson($response, ['error' => 'This is the only admin account left'], 422);
    }

    $pdo->prepare('UPDATE users SET deleted = true, updated_at = CURRENT_TIMESTAMP WHERE id = ?')->execute([$id]);

    return respondJson($response, ['message' => 'Deleted successfully']);
})->add(responds('users'))->add(requireRole(...ROLES_SYSTEM_WRITE))->add(requireAuth());
