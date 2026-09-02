<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

// ---------------------------------------------------------------------------
// Signing up, signing in, and proving the address is yours
//
// An account cannot be used until the address on it has been confirmed. That
// is the rule the rest of this file is arranged around: register creates the
// account but hands back no session, the emailed link is what turns it on, and
// login refuses an unconfirmed account with a code the front end can act on.
//
// Two of these endpoints take an address and send mail to it if there is an
// account behind it. Both answer exactly the same whether or not there is,
// because an endpoint that answers differently is a way of asking whether
// somebody has an account here. Registration is the exception and has to be:
// a form that would not say "that username is taken" is a form nobody can
// finish. The address is already the caller's own by then anyway.
// ---------------------------------------------------------------------------

/** The account as every session-issuing endpoint describes it. */
function authUserPayload(array $user): array
{
    return [
        'username'        => $user['username'],
        'email'           => $user['email'],
        'role'            => $user['role'],
        'background'      => $user['background'],
        'theme_main'      => $user['theme_main'],
        'theme_admin'     => $user['theme_admin'],
        'language'        => $user['language'],
        'email_confirmed' => (bool) $user['email_confirmed'],
        'version'         => $user['version'],
        'created_at'      => $user['created_at'],
    ];
}

/** A signed-in session: the bearer token, and who it belongs to. */
function authSession(array $user): array
{
    return [
        'token' => jwtIssue((int) $user['id'], $user['username'], $user['email'], $user['role']),
        'user'  => authUserPayload($user),
    ];
}

/** Reads one account by address, deleted ones excluded. */
function authFindByEmail(PDO $pdo, string $email): ?array
{
    $user = DbQuery::from($pdo, 'users')->fetch('_t.email = ? AND _t.deleted = false', [$email]);

    return $user ?: null;
}

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------
$app->post('/api/auth/register', function (Request $request, Response $response) {
    $body = $request->getParsedBody() ?? [];

    $username = trim((string) ($body['username'] ?? ''));
    $email    = trim((string) ($body['email'] ?? ''));
    $password = (string) ($body['password'] ?? '');
    // The site the form was filled in on, so the confirmation arrives in the
    // language it was read in. Anything else falls back to English.
    $language = in_array($body['language'] ?? '', ['en', 'sk'], true) ? $body['language'] : 'en';

    if ($username === '' || $email === '' || $password === '') {
        return respondJson($response, ['error' => 'username, email and password are required'], 422);
    }

    if (!userValidEmail($email)) {
        return respondJson($response, ['error' => 'That does not look like an email address'], 422);
    }

    if (strlen($password) < USER_PASSWORD_MIN) {
        return respondJson($response, ['error' => 'The password needs at least ' . USER_PASSWORD_MIN . ' characters'], 422);
    }

    $pdo = usersDb();

    // Checked rather than left to the unique index, so the answer says which
    // field is the problem instead of surfacing a constraint name.
    if (DbQuery::from($pdo, 'users')->find(['email' => $email])) {
        return respondJson($response, ['error' => 'That email address is already taken'], 409);
    }

    if (DbQuery::from($pdo, 'users')->find(['username' => $username])) {
        return respondJson($response, ['error' => 'That username is already taken'], 409);
    }

    $pdo->prepare('INSERT INTO users (username, email, password, role, language) VALUES (?, ?, ?, ?, ?)')
        ->execute([$username, $email, password_hash($password, PASSWORD_DEFAULT), 'USER', $language]);

    $userId = (int) $pdo->lastInsertId();
    $user = ['id' => $userId, 'username' => $username, 'email' => $email, 'language' => $language];

    $token = issueOneTimeToken($pdo, $userId, TOKEN_EMAIL_CONFIRM, MAIL_CONFIRM_HOURS * 3600);
    $sent = $token !== null && sendConfirmationMail($user, $token);

    // No session. The account exists and is unusable until somebody opens the
    // link, which is the whole point of sending one.
    return respondJson($response, ['email' => $email, 'sent' => $sent], 201);
})->add(responds(AuthPending::class));

// ---------------------------------------------------------------------------
// POST /api/auth/confirm  — the emailed link lands here
// ---------------------------------------------------------------------------
$app->post('/api/auth/confirm', function (Request $request, Response $response) {
    $body = $request->getParsedBody() ?? [];
    $pdo = usersDb();

    $token = findOneTimeToken($pdo, (string) ($body['token'] ?? ''), TOKEN_EMAIL_CONFIRM);

    if (!$token || !consumeOneTimeToken($pdo, (int) $token['id'])) {
        return respondJson($response, ['error' => 'That link is no longer valid', 'code' => 'invalid_token'], 400);
    }

    $pdo->prepare('UPDATE users SET email_confirmed = TRUE WHERE id = ?')->execute([$token['user_id']]);

    $user = DbQuery::from($pdo, 'users')->fetch('_t.id = ? AND _t.deleted = false', [$token['user_id']]);
    if (!$user) {
        return respondJson($response, ['error' => 'That link is no longer valid', 'code' => 'invalid_token'], 400);
    }

    // Signed in on the spot. Holding the link is proof of the mailbox, which is
    // a stronger claim than the password they would otherwise be asked for.
    return respondJson($response, authSession($user));
})->add(responds(AuthSession::class));

// ---------------------------------------------------------------------------
// POST /api/auth/confirm/resend
//
// Open, because somebody who cannot sign in is exactly who needs it. Answers
// the same whatever the address turns out to be.
// ---------------------------------------------------------------------------
$app->post('/api/auth/confirm/resend', function (Request $request, Response $response) {
    $body = $request->getParsedBody() ?? [];
    $pdo = usersDb();

    $user = authFindByEmail($pdo, trim((string) ($body['email'] ?? '')));

    if ($user && !$user['email_confirmed']) {
        $token = issueOneTimeToken($pdo, (int) $user['id'], TOKEN_EMAIL_CONFIRM, MAIL_CONFIRM_HOURS * 3600);
        if ($token !== null) {
            sendConfirmationMail($user, $token);
        }
    }

    return respondJson($response, ['requested' => true]);
})->add(responds(AuthMailRequested::class));

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
$app->post('/api/auth/login', function (Request $request, Response $response) {
    $body = $request->getParsedBody() ?? [];

    if (empty($body['email']) || empty($body['password'])) {
        return respondJson($response, ['error' => 'email and password are required'], 422);
    }

    $user = authFindByEmail(usersDb(), (string) $body['email']);

    // A null password is an account that signs in some other way rather than
    // one with an empty password, so it is refused here before password_verify
    // is asked to make sense of it. Same answer as a wrong password: which of
    // the two it was is not the caller's business.
    if (!$user || $user['password'] === null || !password_verify((string) $body['password'], $user['password'])) {
        return respondJson($response, ['error' => 'Invalid credentials'], 401);
    }

    if (!$user['email_confirmed']) {
        return respondJson($response, [
            'error' => 'Confirm your email address before signing in',
            'code'  => 'email_not_confirmed',
        ], 403);
    }

    return respondJson($response, authSession($user));
})->add(responds(AuthSession::class));

// ---------------------------------------------------------------------------
// POST /api/auth/password/forgot
//
// Open, and deliberately incurious: the same answer for an address with an
// account, an address without one, and a malformed one.
// ---------------------------------------------------------------------------
$app->post('/api/auth/password/forgot', function (Request $request, Response $response) {
    $body = $request->getParsedBody() ?? [];
    $pdo = usersDb();

    $user = authFindByEmail($pdo, trim((string) ($body['email'] ?? '')));

    // Only for accounts that have a password to reset. One that signs in
    // another way has nothing here to set, and saying so would say which.
    if ($user && $user['password'] !== null) {
        $token = issueOneTimeToken($pdo, (int) $user['id'], TOKEN_PASSWORD_RESET, MAIL_RESET_MINUTES * 60);
        if ($token !== null) {
            sendPasswordResetMail($user, $token);
        }
    }

    return respondJson($response, ['requested' => true]);
})->add(responds(AuthMailRequested::class));

// ---------------------------------------------------------------------------
// POST /api/auth/password/reset
// ---------------------------------------------------------------------------
$app->post('/api/auth/password/reset', function (Request $request, Response $response) {
    $body = $request->getParsedBody() ?? [];
    $password = (string) ($body['password'] ?? '');
    $pdo = usersDb();

    if (strlen($password) < USER_PASSWORD_MIN) {
        return respondJson($response, ['error' => 'The password needs at least ' . USER_PASSWORD_MIN . ' characters'], 422);
    }

    $token = findOneTimeToken($pdo, (string) ($body['token'] ?? ''), TOKEN_PASSWORD_RESET);

    if (!$token || !consumeOneTimeToken($pdo, (int) $token['id'])) {
        return respondJson($response, ['error' => 'That link is no longer valid', 'code' => 'invalid_token'], 400);
    }

    // The address is confirmed on the way past. Reading the message proves the
    // mailbox just as well as the confirmation link does, and an account that
    // could reset its password but still not sign in would be a trap.
    $pdo->prepare('UPDATE users SET password = ?, email_confirmed = TRUE WHERE id = ?')
        ->execute([password_hash($password, PASSWORD_DEFAULT), $token['user_id']]);

    // Anything else outstanding is a spare key to an account whose password has
    // just changed.
    revokeOneTimeTokens($pdo, (int) $token['user_id'], TOKEN_PASSWORD_RESET);

    $user = DbQuery::from($pdo, 'users')->fetch('_t.id = ? AND _t.deleted = false', [$token['user_id']]);
    if (!$user) {
        return respondJson($response, ['error' => 'That link is no longer valid', 'code' => 'invalid_token'], 400);
    }

    return respondJson($response, authSession($user));
})->add(responds(AuthSession::class));

// ---------------------------------------------------------------------------
// GET /api/auth/me  — returns fresh user data for the bearer token owner
// ---------------------------------------------------------------------------
$app->get('/api/auth/me', function (Request $request, Response $response) {
    return respondJson($response, authUserPayload($request->getAttribute('user')));
})->add(responds(AuthUser::class))->add(requireAuth());

// ---------------------------------------------------------------------------
// PUT /api/auth/theme  — saves the caller's own light/dark choice
//
// One row per area: the site and the admin panel are remembered separately.
// Anyone signed in may change their own; no wider rights are involved.
// ---------------------------------------------------------------------------
$app->put('/api/auth/theme', function (Request $request, Response $response) {
    $body  = $request->getParsedBody() ?? [];
    $area  = $body['area']  ?? '';
    $theme = $body['theme'] ?? '';

    $columns = ['main' => 'theme_main', 'admin' => 'theme_admin'];
    if (!isset($columns[$area])) {
        return respondJson($response, ['error' => "Unknown area '$area'"], 400);
    }
    if (!in_array($theme, ['light', 'dark', 'auto'], true)) {
        return respondJson($response, ['error' => "Unknown theme '$theme'"], 400);
    }

    $user = $request->getAttribute('user');
    $pdo  = usersDb();
    $stmt = $pdo->prepare("UPDATE users SET {$columns[$area]} = ? WHERE id = ?");
    $stmt->execute([$theme, $user['id']]);

    return respondJson($response, ['area' => $area, 'theme' => $theme]);
})->add(responds(ThemeChanged::class))->add(requireAuth());

// ---------------------------------------------------------------------------
// PUT /api/auth/language  — saves the caller's own reading language
//
// The site only. The admin panel is English, so there is nothing to remember
// for it. Anyone signed in may change their own; no wider rights are involved.
// ---------------------------------------------------------------------------
$app->put('/api/auth/language', function (Request $request, Response $response) {
    $body = $request->getParsedBody() ?? [];
    $code = strtolower(trim((string) ($body['language'] ?? '')));

    $pdo      = usersDb();
    $language = DbQuery::from($pdo, 'languages')->find(['code' => $code]);

    if (!$language || !$language['enabled']) {
        return respondJson($response, ['error' => "Unknown or unavailable language '$code'"], 400);
    }

    $user = $request->getAttribute('user');
    $pdo->prepare('UPDATE users SET language = ? WHERE id = ?')->execute([$code, $user['id']]);

    return respondJson($response, ['language' => $code]);
})->add(responds(LanguageChanged::class))->add(requireAuth());

// ---------------------------------------------------------------------------
// POST /api/auth/logout  — stateless JWT: real logout happens client-side;
// this endpoint exists so the FE can fire a courtesy call.
// ---------------------------------------------------------------------------
$app->post('/api/auth/logout', function (Request $_request, Response $response) {
    return respondJson($response, ['message' => 'Logged out']);
})->add(responds(ApiMessage::class));

// ---------------------------------------------------------------------------
// PUT /api/auth/password
// ---------------------------------------------------------------------------
$app->put('/api/auth/password', function (Request $request, Response $response) {
    $user = $request->getAttribute('user');
    $body = $request->getParsedBody();

    if (empty($body['current_password']) || empty($body['new_password'])) {
        return respondJson($response, ['error' => 'current_password and new_password are required'], 400);
    }

    // An account with no password has none to confirm. Setting a first one is
    // a different operation with a different proof behind it, and it arrives
    // with the next stage.
    if ($user['password'] === null || !password_verify($body['current_password'], $user['password'])) {
        return respondJson($response, ['error' => 'Current password is incorrect'], 401);
    }

    if (strlen($body['new_password']) < USER_PASSWORD_MIN) {
        return respondJson($response, ['error' => 'New password must be at least ' . USER_PASSWORD_MIN . ' characters'], 422);
    }

    $pdo = usersDb();
    $pdo->prepare('UPDATE users SET password = ? WHERE id = ?')
        ->execute([password_hash($body['new_password'], PASSWORD_DEFAULT), $user['id']]);

    return respondJson($response, ['message' => 'Password changed successfully']);
})->add(responds(ApiMessage::class))->add(requireAuth());
