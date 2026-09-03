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

/**
 * Everything about an account except the one thing nobody may read.
 *
 * Aliased to `u` because the two derived columns below need a table to hang a
 * correlated subquery off.
 */
const USER_COLUMNS = 'u.id, u.role, u.username, u.email, u.email_confirmed, u.background, u.language, '
    . 'u.theme_main, u.theme_admin, u.date_format, u.time_format, u.totp_enabled, u.force_password_change, '
    . 'u.deleted, u.version, u.created_at, u.updated_at';

/**
 * The two facts about an account that are not columns on it.
 *
 * Whether a Google account is attached lives in user_identities, one row per
 * provider per account. It is asked for here rather than left to the detail
 * view because "which of these people can get in without a password" is a
 * question about the whole list, and answering it a row at a time would be a
 * query per account.
 */
const USER_DERIVED = "EXISTS (SELECT 1 FROM user_identities i WHERE i.user_id = u.id AND i.provider = 'google') AS google_connected, "
    . "(SELECT i.email FROM user_identities i WHERE i.user_id = u.id AND i.provider = 'google' ORDER BY i.id LIMIT 1) AS google_email";

const USER_SELECT = 'SELECT ' . USER_COLUMNS . ', ' . USER_DERIVED . ' FROM users u';

const USER_ROLES = ['ADMIN', 'EDITOR', 'USER'];

/**
 * A boolean in the one form the driver and PostgreSQL both accept.
 *
 * PDO binds a PHP `true` as '1', which Postgres reads as true - and a PHP
 * `false` as the empty string, which it refuses outright with "invalid input
 * syntax for type boolean". So a false never reaches a bound parameter here as
 * itself, and the failure is at the moment of writing rather than anywhere it
 * could be mistaken for a rule.
 */
function userBool(bool $value): string
{
    return $value ? 'true' : 'false';
}

/**
 * One account, as every response here describes it.
 *
 * Read back rather than RETURNING-ed after a write: the derived columns above
 * are not part of the row being written, and one definition of what an
 * AdminUser is is worth the extra statement on a path nobody runs in a loop.
 */
function userRow(PDO $pdo, int $id): ?array
{
    $statement = $pdo->prepare(USER_SELECT . ' WHERE u.id = ?');
    $statement->execute([$id]);

    return $statement->fetch() ?: null;
}

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
        $where[] = '(u.username ILIKE ? OR u.email ILIKE ?)';
        $params[] = '%' . $search . '%';
        $params[] = '%' . $search . '%';
    }

    if (in_array($role, USER_ROLES, true)) {
        $where[] = 'upper(u.role) = ?';
        $params[] = $role;
    }

    if ($status === 'enabled' || $status === 'disabled') {
        $where[] = 'u.deleted = ?';
        $params[] = userBool($status === 'disabled');
    }

    // The rest are yes/no questions about an account, and each takes the same
    // three answers: yes, no, and the empty string for "do not ask". Written
    // as a table because five near-identical if-blocks is five places for a
    // typo to hide.
    $flags = [
        'confirmed' => 'u.email_confirmed',
        'twoFactor' => 'u.totp_enabled',
        'google'    => "EXISTS (SELECT 1 FROM user_identities i WHERE i.user_id = u.id AND i.provider = 'google')",
        'mustChange' => 'u.force_password_change',
    ];

    foreach ($flags as $parameter => $expression) {
        $value = (string) ($query[$parameter] ?? '');
        if ($value === 'yes' || $value === 'no') {
            $where[] = $expression . ($value === 'yes' ? ' = TRUE' : ' = FALSE');
        }
    }

    if ($language = trim((string) ($query['language'] ?? ''))) {
        $where[] = 'u.language = ?';
        $params[] = $language;
    }

    $statement = usersDb()->prepare(
        USER_SELECT . ' WHERE ' . implode(' AND ', $where) . ' ORDER BY u.created_at DESC, u.id DESC'
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

    // Only the languages somebody actually has, rather than every language the
    // site knows: a filter offering choices that match nothing is a filter
    // that wastes a click to tell you so.
    $languages = $pdo
        ->query("SELECT DISTINCT language FROM users WHERE language IS NOT NULL AND language <> '' ORDER BY language")
        ->fetchAll(PDO::FETCH_COLUMN);

    return respondJson($response, [
        'roles' => USER_ROLES,
        'byRole' => $byRole,
        'disabled' => (int) $pdo->query('SELECT count(*) FROM users WHERE deleted = true')->fetchColumn(),
        'total' => (int) $pdo->query('SELECT count(*) FROM users WHERE deleted = false')->fetchColumn(),
        'admins' => userAdminCount($pdo),
        'passwordMinLength' => USER_PASSWORD_MIN,
        'languages' => $languages,
    ]);
})->add(responds(UserFilters::class))->add(requireRole(...ROLES_SYSTEM_READ))->add(requireAuth());

// ── GET /api/users/{id} ──────────────────────────────────────────────────────

$app->get('/api/users/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $user = userRow(usersDb(), (int) $args['id']);

    return $user
        ? respondJson($response, $user)
        : respondJson($response, ['error' => 'Not found'], 404);
})->add(responds(AdminUser::class))->add(requireRole(...ROLES_SYSTEM_READ))->add(requireAuth());

// ── GET /api/users/{id}/detail ───────────────────────────────────────────────
//
// Everything about one account that is spread across five tables, gathered so
// the admin panel can show a person rather than a row: how they have their
// site set up, which ways in they have, where they have signed in from, and
// what has been tried against them and failed.
//
// Read-only, and it is worth saying what it deliberately does not carry. No
// password hash, no TOTP secret, no recovery codes, no device tokens - not
// even their hashes. Knowing somebody has two-factor on is administration;
// being able to read the secret behind it is not.

$app->get('/api/users/{id:[0-9]+}/detail', function (Request $request, Response $response, array $args) {
    $pdo = usersDb();
    $id = (int) $args['id'];

    $account = userRow($pdo, $id);

    if (!$account) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    $identities = $pdo->prepare('SELECT id, provider, email, created_at FROM user_identities WHERE user_id = ? ORDER BY id');
    $identities->execute([$id]);

    $sessions = array_map(static fn(array $session): array => [
        'id' => (int) $session['id'],
        'method' => $session['method'],
        'ip' => $session['ip'],
        'mac' => $session['mac'],
        'user_agent' => $session['user_agent'],
        'created_at' => $session['created_at'],
        'last_seen_at' => $session['last_seen_at'],
        'expires_at' => $session['expires_at'],
        'revoked_at' => $session['revoked_at'],
        'revoked_reason' => $session['revoked_reason'],
        'active' => $session['revoked_at'] === null && strtotime((string) $session['expires_at']) > time(),
        // Never this one: an admin reading somebody else's account is not
        // sitting in any of these sessions.
        'current' => false,
    ], sessionsFor($pdo, $id));

    // Attempts against this account, successes included - the failures alone
    // would not show that somebody eventually got in.
    $attempts = $pdo->prepare(
        'SELECT id, email, ip, method, outcome, created_at FROM user_login_attempts
          WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 50'
    );
    $attempts->execute([$id]);

    return respondJson($response, [
        'account' => $account,
        'identities' => $identities->fetchAll(),
        'sessions' => $sessions,
        'login_attempts' => $attempts->fetchAll(),
        'active_sessions' => count(array_filter($sessions, static fn(array $s): bool => $s['active'])),
        'trusted_devices' => trustedDeviceCount($pdo, $id),
        'recovery_codes_remaining' => empty($account['totp_enabled']) ? 0 : recoveryCodesRemaining($pdo, $id),
        'failed_since_last_login' => failedAttemptsSinceLastLogin($pdo, $id),
    ]);
})->add(responds(AdminUserDetail::class))->add(requireRole(...ROLES_SYSTEM_READ))->add(requireAuth());

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
        'INSERT INTO users (username, email, password, role, email_confirmed, language, force_password_change)
         VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id'
    );
    $insert->execute([
        $username,
        $email,
        password_hash($password, PASSWORD_DEFAULT),
        $role,
        // Made by an admin who typed the address in, so there is nobody to
        // confirm it to.
        userBool(true),
        trim((string) ($body['language'] ?? 'en')) ?: 'en',
        // Off unless asked for. The same form makes an account for somebody
        // sitting in the room, who can type their own password into it there
        // and then, and one for somebody who will be sent this password by
        // whatever means - and only the second needs replacing on arrival.
        userBool(!empty($body['force_password_change'])),
    ]);

    return respondJson($response, userRow($pdo, (int) $insert->fetchColumn()), 201);
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
        $changes['email_confirmed'] = userBool(!empty($body['email_confirmed']));
    }

    // Settable both ways: an admin can require a change on an existing account
    // - a password that has been read out over the phone, say - and can take
    // the requirement back off one that was flagged by mistake.
    if (array_key_exists('force_password_change', $body)) {
        $changes['force_password_change'] = userBool(!empty($body['force_password_change']));
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
    $pdo->prepare('UPDATE users SET ' . $sets . ', updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        ->execute([...array_values($changes), $id]);

    return respondJson($response, userRow($pdo, $id));
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

    // Absent leaves the flag as it is. The admin panel always sends it, and
    // sends it checked by default here: a password an admin has just typed is
    // one its owner did not choose, which is the whole of what the flag means.
    if (array_key_exists('force_password_change', $body)) {
        $pdo->prepare('UPDATE users SET force_password_change = ? WHERE id = ?')
            ->execute([userBool(!empty($body['force_password_change'])), $args['id']]);
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

    $pdo->prepare('UPDATE users SET deleted = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        ->execute([userBool(!$enabled), $id]);

    return respondJson($response, userRow($pdo, $id));
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
