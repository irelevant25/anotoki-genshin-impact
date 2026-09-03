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

/**
 * The account as every session-issuing endpoint describes it.
 *
 * The last four fields are what the account page needs to draw the ways in:
 * whether there is a password at all, whether it is still accepted, and which
 * Google account is attached. `password` itself is not here and never is.
 */
function authUserPayload(array $user): array
{
    $identity = identityFor(usersDb(), (int) $user['id'], IDENTITY_GOOGLE);

    return [
        'username'        => $user['username'],
        'email'           => $user['email'],
        'role'            => $user['role'],
        'background'      => $user['background'],
        'theme_main'      => $user['theme_main'],
        'theme_admin'     => $user['theme_admin'],
        'language'        => $user['language'],
        // Null means "however this device writes them" - see migration 029.
        'date_format'     => $user['date_format'] ?? null,
        'time_format'     => $user['time_format'] ?? null,
        'email_confirmed' => (bool) $user['email_confirmed'],
        'version'         => $user['version'],
        'created_at'      => $user['created_at'],
        'has_password'    => $user['password'] !== null,
        // Distinct from the above: there is a password, and it is not to be
        // accepted. See migration 019.
        'password_login_enabled' => (bool) ($user['password_login_enabled'] ?? true),
        'google_connected' => $identity !== null,
        'google_email'     => $identity['email'] ?? null,
        'totp_enabled'     => (bool) ($user['totp_enabled'] ?? false),
        // So the account page can say "3 left" and mean it.
        'recovery_codes_remaining' => empty($user['totp_enabled']) ? 0 : recoveryCodesRemaining(usersDb(), (int) $user['id']),
        // Browsers that will not be asked for a code again, so the account page
        // can offer to forget them.
        'trusted_devices' => empty($user['totp_enabled']) ? 0 : trustedDeviceCount(usersDb(), (int) $user['id']),
    ];
}

/**
 * The second factor, for the three endpoints that issue a session.
 *
 * Answers null when the sign-in may go ahead, and a response when it may not -
 * so each of them reads the same single line. `totp_required` and
 * `totp_invalid` are told apart because the front end does different things
 * with them: one asks for a code, the other says the code was wrong.
 */
function authTotpRefusal(Response $response, PDO $pdo, array $user, ?string $code, ?string $deviceToken = null): ?Response
{
    if (empty($user['totp_enabled'])) {
        return null;
    }

    // A browser that answered a code before, within the last thirty days. It
    // skips the six digits and nothing else: the password still had to be
    // right to get this far, so a stolen device token is not a way in on its
    // own. See trusted_device.php.
    if (trustedDeviceAccepted($pdo, (int) $user['id'], $deviceToken)) {
        return null;
    }

    if (trim((string) $code) === '') {
        return respondJson($response, ['error' => 'A code from your authenticator app is needed', 'code' => 'totp_required'], 403);
    }

    if (totpChallengePassed($pdo, $user, $code)) {
        return null;
    }

    return respondJson($response, ['error' => 'That code is not right', 'code' => 'totp_invalid'], 403);
}

/**
 * Whether email and password is a way into this account.
 *
 * Both halves matter. An account made through Google has no password to check,
 * and one that has turned password sign-in off has a password that is not to
 * be accepted - and the difference between them shows on the account page,
 * where one offers to set a password and the other to switch it back on.
 */
function authPasswordLoginAvailable(array $user): bool
{
    return $user['password'] !== null && ($user['password_login_enabled'] ?? true);
}

/** Every way into an account, so nothing closes the last one. */
function authWaysIn(PDO $pdo, array $user): int
{
    return (int) authPasswordLoginAvailable($user) + (int) (identityFor($pdo, (int) $user['id'], IDENTITY_GOOGLE) !== null);
}

/**
 * A signed-in session: a row, the bearer token that names it, and who it
 * belongs to.
 *
 * `method` is how this one was signed in, and is what makes the session list
 * worth reading - "Google, an hour ago, from this address" rather than a bare
 * timestamp. The successful attempt is recorded alongside, so the count of
 * failures since the last good sign-in has something to count from.
 */
function authSession(PDO $pdo, Request $request, array $user, string $method, bool $rememberDevice = false): array
{
    $tokenId = openSession($pdo, (int) $user['id'], $method, $request);
    recordLoginAttempt($pdo, $request, (string) $user['email'], (int) $user['id'], $method, 'ok');

    // Only worth issuing where there is something to skip. An account without
    // two-factor has nothing to remember a device for, and handing one out
    // anyway would leave a bearer secret in a browser for no reason at all.
    $deviceToken = $rememberDevice && !empty($user['totp_enabled'])
        ? issueTrustedDevice($pdo, (int) $user['id'], $request)
        : null;

    return [
        'token' => jwtIssue((int) $user['id'], $user['username'], $user['email'], $user['role'], $tokenId),
        'user'  => authUserPayload($user),
        'device_token' => $deviceToken,
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
    return respondJson($response, authSession($pdo, $request, $user, SESSION_METHOD_EMAIL_LINK));
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

    $pdo = usersDb();
    $email = (string) $body['email'];

    // Checked before anything else is, including whether the account exists -
    // a limiter that only applies to real addresses tells you which ones those
    // are. See loginAttemptsExceeded() for why it is not keyed on the address
    // alone.
    if (loginAttemptsExceeded($pdo, $request, $email)) {
        return respondJson($response, [
            'error' => 'Too many attempts. Wait a few minutes and try again.',
            'code'  => 'too_many_attempts',
        ], 429);
    }

    $user = authFindByEmail($pdo, $email);

    if (!$user) {
        recordLoginAttempt($pdo, $request, $email, null, SESSION_METHOD_PASSWORD, 'unknown_email');
        return respondJson($response, ['error' => 'Invalid credentials'], 401);
    }

    // The account is real but this is not the way into it: either it was made
    // through Google and has no password, or it has one and has asked for it
    // not to be accepted. Saying so does admit that the address has an account
    // here, which the answers above are careful not to - a deliberate trade,
    // because the alternative is telling somebody their password is wrong when
    // the truth is that they do not have one, and leaving them with nothing to
    // try. Nothing is sent from here: the code has to be asked for, through an
    // endpoint that answers the same for every address.
    if (!authPasswordLoginAvailable($user)) {
        recordLoginAttempt($pdo, $request, $email, (int) $user['id'], SESSION_METHOD_PASSWORD, 'password_unavailable');
        return respondJson($response, [
            'error' => 'This account signs in another way',
            'code'  => 'password_login_unavailable',
        ], 403);
    }

    if (!password_verify((string) $body['password'], $user['password'])) {
        recordLoginAttempt($pdo, $request, $email, (int) $user['id'], SESSION_METHOD_PASSWORD, 'bad_password');
        return respondJson($response, ['error' => 'Invalid credentials'], 401);
    }

    if ($refusal = authTotpRefusal($response, $pdo, $user, $body['totp'] ?? null, $body['device_token'] ?? null)) {
        // The password was right, so this is worth telling apart from a wrong
        // one: it is either the owner reaching for their phone or somebody who
        // has the password and not the phone.
        $missing = trim((string) ($body['totp'] ?? '')) === '';
        recordLoginAttempt($pdo, $request, $email, (int) $user['id'], SESSION_METHOD_PASSWORD, $missing ? 'totp_required' : 'bad_totp');
        return $refusal;
    }

    if (!$user['email_confirmed']) {
        recordLoginAttempt($pdo, $request, $email, (int) $user['id'], SESSION_METHOD_PASSWORD, 'unconfirmed');
        return respondJson($response, [
            'error' => 'Confirm your email address before signing in',
            'code'  => 'email_not_confirmed',
        ], 403);
    }

    return respondJson($response, authSession($pdo, $request, $user, SESSION_METHOD_PASSWORD, !empty($body['remember_device'])));
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
    // just changed - both the unused reset links and any session somebody else
    // is already signed in on. Resetting a password is the usual way somebody
    // takes an account back, and it should take it back completely.
    revokeOneTimeTokens($pdo, (int) $token['user_id'], TOKEN_PASSWORD_RESET);
    revokeSessionsFor($pdo, (int) $token['user_id'], SESSION_REVOKED_PASSWORD);
    revokeTrustedDevices($pdo, (int) $token['user_id']);

    $user = DbQuery::from($pdo, 'users')->fetch('_t.id = ? AND _t.deleted = false', [$token['user_id']]);
    if (!$user) {
        return respondJson($response, ['error' => 'That link is no longer valid', 'code' => 'invalid_token'], 400);
    }

    return respondJson($response, authSession($pdo, $request, $user, SESSION_METHOD_EMAIL_LINK));
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
// PUT /api/auth/formats  — how this reader wants dates and times written
//
// 1.3.2026 and 03/01/2026 are the same day written by two people who would
// each misread the other, so there is no single right answer to bake in. The
// device's own setting is the default and null is how that is stored: an
// account with nothing here follows whatever machine it is read on, which is
// the answer that is right without anyone being asked.
//
// These columns are for the reader whose device disagrees with them - someone
// in Slovakia on a laptop bought in the States, or anyone who simply wants a
// 24-hour clock wherever they are.
// ---------------------------------------------------------------------------
$app->put('/api/auth/formats', function (Request $request, Response $response) {
    $body = $request->getParsedBody() ?? [];
    $user = $request->getAttribute('user');
    $pdo  = usersDb();

    // A short list rather than a format string. A free-typed pattern is a way
    // to produce a date nobody can read, and these are the orders in use.
    $dates = ['dmy_dot', 'dmy_slash', 'mdy_slash', 'ymd_dash'];
    $times = ['24', '12'];

    // Absent leaves the setting alone; null clears it back to the device.
    if (array_key_exists('date_format', $body)) {
        $date = $body['date_format'];
        $date = ($date === null || $date === '' || $date === 'auto') ? null : (string) $date;

        if ($date !== null && !in_array($date, $dates, true)) {
            return respondJson($response, ['error' => "Unknown date format '$date'"], 400);
        }

        $pdo->prepare('UPDATE users SET date_format = ? WHERE id = ?')->execute([$date, $user['id']]);
    }

    if (array_key_exists('time_format', $body)) {
        $time = $body['time_format'];
        $time = ($time === null || $time === '' || $time === 'auto') ? null : (string) $time;

        if ($time !== null && !in_array($time, $times, true)) {
            return respondJson($response, ['error' => "Unknown time format '$time'"], 400);
        }

        $pdo->prepare('UPDATE users SET time_format = ? WHERE id = ?')->execute([$time, $user['id']]);
    }

    $fresh = DbQuery::from($pdo, 'users')->fetch('_t.id = ?', [$user['id']]);

    return respondJson($response, authUserPayload($fresh));
})->add(responds(AuthUser::class))->add(requireAuth());

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
// POST /api/auth/logout
//
// This used to be a courtesy call: the browser cleared its own copy and the
// token stayed valid until it expired, so signing out did not sign anything
// out. Now it ends the session the token names, and the token stops working.
//
// requireAuth is deliberately not on it. A caller whose session has already
// ended, or whose token is past its expiry, is trying to do the thing that has
// already happened - answering 401 to that would be pedantry. Whatever it
// finds, the answer is the same.
// ---------------------------------------------------------------------------
$app->post('/api/auth/logout', function (Request $request, Response $response) {
    $header = $request->getHeaderLine('Authorization');
    $decoded = str_starts_with($header, 'Bearer ') ? jwtVerify(substr($header, 7)) : null;

    if ($decoded && !empty($decoded['sid'])) {
        $pdo = usersDb();
        if ($session = findSession($pdo, (string) $decoded['sid'])) {
            revokeSession($pdo, (int) $session['id'], SESSION_REVOKED_SIGNOUT);
        }
    }

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

    // Everywhere else is signed out. Changing a password is what somebody does
    // when they think another person has it, and leaving that person's session
    // running would make the change ceremonial.
    $session = $request->getAttribute('session');
    revokeSessionsFor($pdo, (int) $user['id'], SESSION_REVOKED_PASSWORD, $session ? (int) $session['id'] : null);
    revokeTrustedDevices($pdo, (int) $user['id']);

    return respondJson($response, ['message' => 'Password changed successfully']);
})->add(responds(ApiMessage::class))->add(requireAuth());

// ---------------------------------------------------------------------------
// Signing in with Google, and the doors an account can open and close
//
// An account may be reachable by password, by Google, or by both. The rules
// below are all one rule seen from different sides: an account must always
// keep at least one way in. Disconnecting Google from an account with no
// password is refused, turning password sign-in off without Google attached is
// refused, and the account page reads those same conditions to decide what to
// offer.
//
// The emailed sign-in code is the way in for somebody who has neither to hand
// - registered with Google and now sitting at a machine where they would
// rather not, or handing the account over to somebody else. It proves the same
// thing the confirmation link proves, which is why it is allowed to do the
// same job.
// ---------------------------------------------------------------------------

/**
 * GET /api/auth/providers - which ways in this deployment offers.
 *
 * Open, and asked before anybody has signed in: the login form needs to know
 * whether to draw the Google button at all. The client id is public by design
 * - it travels in the page and identifies the site to Google - so serving it
 * here gives nothing away that the rendered button would not.
 */
$app->get('/api/auth/providers', function (Request $request, Response $response) {
    return respondJson($response, [
        'google_enabled'   => googleClientId() !== null,
        'google_client_id' => googleClientId(),
    ]);
})->add(responds(AuthProviders::class));

/**
 * POST /api/auth/google - sign in, or make an account, with a Google token.
 *
 * Three ways this can land, and the order matters.
 *
 * The identity is already attached to an account: that is the account, and
 * nothing about the address enters into it. Somebody who changed their Google
 * address is still the same person.
 *
 * Otherwise, if Google says this address is theirs and verified, and an
 * account here already has it, the identity is attached to that account. This
 * is the "I registered with a password and now I am pressing the Google
 * button" case, and it has to work - the alternative is telling somebody their
 * own address is taken. `email_verified` is what makes it safe: without that
 * claim the address is a string Google has not vouched for, and attaching on
 * it would be a way in to somebody else's account.
 *
 * Otherwise it is a new account, confirmed on arrival, with no password.
 */
$app->post('/api/auth/google', function (Request $request, Response $response) {
    $body = $request->getParsedBody() ?? [];
    $claims = googleVerifyIdToken((string) ($body['credential'] ?? ''));

    if ($claims === null) {
        return respondJson($response, ['error' => 'That Google sign-in could not be verified', 'code' => 'invalid_token'], 400);
    }

    $pdo = usersDb();
    $subject = (string) $claims['sub'];
    $email = strtolower(trim((string) ($claims['email'] ?? '')));
    $verified = !empty($claims['email_verified']);

    if ($user = identityOwner($pdo, IDENTITY_GOOGLE, $subject)) {
        if ($refusal = authTotpRefusal($response, $pdo, $user, $body['totp'] ?? null, $body['device_token'] ?? null)) {
            return $refusal;
        }

        return respondJson($response, authSession($pdo, $request, $user, SESSION_METHOD_GOOGLE, !empty($body['remember_device'])));
    }

    if ($verified && $email !== '' && ($user = authFindByEmail($pdo, $email))) {
        // Checked before anything is attached: an account with 2FA on must not
        // gain a new way in on the strength of a Google token alone.
        if ($refusal = authTotpRefusal($response, $pdo, $user, $body['totp'] ?? null, $body['device_token'] ?? null)) {
            return $refusal;
        }

        attachIdentity($pdo, (int) $user['id'], IDENTITY_GOOGLE, $subject, $email);

        // Google has just vouched for the address, which is the same thing the
        // confirmation link is for. An account that never got round to
        // confirming is confirmed by arriving here.
        $pdo->prepare('UPDATE users SET email_confirmed = TRUE WHERE id = ?')->execute([$user['id']]);
        $user = DbQuery::from($pdo, 'users')->fetch('_t.id = ?', [$user['id']]);

        return respondJson($response, authSession($pdo, $request, $user, SESSION_METHOD_GOOGLE, !empty($body['remember_device'])));
    }

    if (!$verified || $email === '') {
        return respondJson($response, ['error' => 'Google did not confirm an email address for that account'], 422);
    }

    $username = authAvailableUsername($pdo, (string) ($claims['name'] ?? ''), $email);

    // No password, and email_confirmed straight away: there is nothing to
    // confirm that Google has not just confirmed.
    $pdo->prepare('INSERT INTO users (username, email, password, role, email_confirmed) VALUES (?, ?, NULL, ?, TRUE)')
        ->execute([$username, $email, 'USER']);

    $userId = (int) $pdo->lastInsertId();
    attachIdentity($pdo, $userId, IDENTITY_GOOGLE, $subject, $email);

    $user = DbQuery::from($pdo, 'users')->fetch('_t.id = ?', [$userId]);

    return respondJson($response, authSession($pdo, $request, $user, SESSION_METHOD_GOOGLE), 201);
})->add(responds(AuthSession::class));

/**
 * A username nobody else has, derived from what Google offered.
 *
 * `username` is unique and required, and Google's display name is neither
 * unique nor guaranteed to be there. So the name is cleaned up, falls back to
 * the local part of the address, and finally gains a number - and whoever ends
 * up as "peter2" can change it afterwards, which is a smaller annoyance than
 * being asked to invent one before being let in.
 */
function authAvailableUsername(PDO $pdo, string $preferred, string $email): string
{
    $base = trim(preg_replace('/\s+/', ' ', $preferred));

    if ($base === '') {
        $base = (string) strstr($email, '@', true);
    }

    $base = substr(trim($base), 0, 90);
    if ($base === '') {
        $base = 'player';
    }

    $candidate = $base;
    for ($suffix = 2; DbQuery::from($pdo, 'users')->find(['username' => $candidate]); $suffix++) {
        $candidate = $base . $suffix;
    }

    return $candidate;
}

/**
 * POST /api/auth/google/link - attach Google to the account already signed in.
 *
 * Being signed in is the proof that this is your account; the token is the
 * proof that the Google side is yours. Refused if that Google user already
 * belongs to another account here, because one person at a provider is one
 * account - see migration 019.
 */
$app->post('/api/auth/google/link', function (Request $request, Response $response) {
    $body = $request->getParsedBody() ?? [];
    $user = $request->getAttribute('user');
    $claims = googleVerifyIdToken((string) ($body['credential'] ?? ''));

    if ($claims === null) {
        return respondJson($response, ['error' => 'That Google sign-in could not be verified', 'code' => 'invalid_token'], 400);
    }

    $pdo = usersDb();
    $subject = (string) $claims['sub'];

    if ($owner = identityOwner($pdo, IDENTITY_GOOGLE, $subject)) {
        // Already this account's: nothing to do, and saying so is friendlier
        // than an error about a conflict with yourself.
        if ((int) $owner['id'] === (int) $user['id']) {
            return respondJson($response, authUserPayload($owner));
        }

        return respondJson($response, ['error' => 'That Google account is already connected to another account here'], 409);
    }

    if (identityFor($pdo, (int) $user['id'], IDENTITY_GOOGLE)) {
        return respondJson($response, ['error' => 'This account already has Google connected'], 409);
    }

    attachIdentity($pdo, (int) $user['id'], IDENTITY_GOOGLE, $subject, strtolower(trim((string) ($claims['email'] ?? ''))) ?: null);

    return respondJson($response, authUserPayload(DbQuery::from($pdo, 'users')->fetch('_t.id = ?', [$user['id']])));
})->add(responds(AuthUser::class))->add(requireAuth());

/**
 * DELETE /api/auth/google/link - detach it again.
 *
 * Refused when it would leave the account with no way in at all. Somebody
 * handing an account over sets a password first, and the account page only
 * offers the button once there is one.
 */
$app->delete('/api/auth/google/link', function (Request $request, Response $response) {
    $user = $request->getAttribute('user');
    $pdo = usersDb();

    if (!identityFor($pdo, (int) $user['id'], IDENTITY_GOOGLE)) {
        return respondJson($response, ['error' => 'This account does not have Google connected'], 409);
    }

    if (!authPasswordLoginAvailable($user)) {
        return respondJson($response, [
            'error' => 'Set a password first, or you would not be able to sign in again',
            'code'  => 'would_lock_account',
        ], 409);
    }

    $pdo->prepare('DELETE FROM user_identities WHERE user_id = ? AND provider = ?')
        ->execute([$user['id'], IDENTITY_GOOGLE]);

    return respondJson($response, authUserPayload(DbQuery::from($pdo, 'users')->fetch('_t.id = ?', [$user['id']])));
})->add(responds(AuthUser::class))->add(requireAuth());

/**
 * POST /api/auth/login/code - ask for a sign-in code by email.
 *
 * As incurious as the other two that take an address: the same answer for an
 * address with an account, one without, and one that is not confirmed. This is
 * the endpoint the login form points at when it is told the password is not
 * the way in, and it is also simply a way to sign in for anybody who would
 * rather not type a password.
 */
$app->post('/api/auth/login/code', function (Request $request, Response $response) {
    $pdo = usersDb();
    $body = $request->getParsedBody() ?? [];

    $user = authFindByEmail($pdo, trim((string) ($body['email'] ?? '')));

    // Not for accounts that have never confirmed. The code would confirm the
    // address as a side effect, and the confirmation link is the way that is
    // meant to happen.
    if ($user && $user['email_confirmed']) {
        $code = issueLoginCode($pdo, (int) $user['id'], MAIL_LOGIN_CODE_MINUTES * 60);
        if ($code !== null) {
            sendLoginCodeMail($user, $code);
        }
    }

    return respondJson($response, ['requested' => true]);
})->add(responds(AuthMailRequested::class));

/**
 * POST /api/auth/login/code/verify - hand the code back, and be signed in.
 *
 * The address is needed as well as the code, because a code only means
 * anything against the account it was issued for - six digits are not unique
 * on their own. Wrong guesses are counted against every live code the account
 * holds, and five of them put all of them out.
 */
$app->post('/api/auth/login/code/verify', function (Request $request, Response $response) {
    $pdo = usersDb();
    $body = $request->getParsedBody() ?? [];

    $user = authFindByEmail($pdo, trim((string) ($body['email'] ?? '')));
    $code = preg_replace('/\D/', '', (string) ($body['code'] ?? ''));

    if (!$user || $code === '') {
        return respondJson($response, ['error' => 'That code is not valid', 'code' => 'invalid_code'], 400);
    }

    if ($refusal = authTotpRefusal($response, $pdo, $user, $body['totp'] ?? null, $body['device_token'] ?? null)) {
        return $refusal;
    }

    $token = findLoginCode($pdo, (int) $user['id'], $code);

    if (!$token || !consumeOneTimeToken($pdo, (int) $token['id'])) {
        return respondJson($response, ['error' => 'That code is not valid', 'code' => 'invalid_code'], 400);
    }

    return respondJson($response, authSession($pdo, $request, $user, SESSION_METHOD_LOGIN_CODE, !empty($body['remember_device'])));
})->add(responds(AuthSession::class));

/**
 * POST /api/auth/password/set - put a first password on an account with none.
 *
 * Being signed in is the whole proof, which is enough because getting signed
 * in already took either Google or a code from the account's own mailbox.
 * Refused when there is already a password: changing one is a different
 * operation and asks for the old one.
 */
$app->post('/api/auth/password/set', function (Request $request, Response $response) {
    $user = $request->getAttribute('user');
    $body = $request->getParsedBody() ?? [];
    $password = (string) ($body['password'] ?? '');

    if ($user['password'] !== null) {
        return respondJson($response, ['error' => 'This account already has a password', 'code' => 'password_already_set'], 409);
    }

    if (strlen($password) < USER_PASSWORD_MIN) {
        return respondJson($response, ['error' => 'The password needs at least ' . USER_PASSWORD_MIN . ' characters'], 422);
    }

    $pdo = usersDb();
    $pdo->prepare('UPDATE users SET password = ?, password_login_enabled = TRUE WHERE id = ?')
        ->execute([password_hash($password, PASSWORD_DEFAULT), $user['id']]);

    return respondJson($response, authUserPayload(DbQuery::from($pdo, 'users')->fetch('_t.id = ?', [$user['id']])));
})->add(responds(AuthUser::class))->add(requireAuth());

/**
 * PUT /api/auth/password/enabled - stop accepting the password, or start again.
 *
 * Turning it off leaves the password where it is rather than deleting it, so
 * turning it back on is a switch rather than a reset. Refused when it would
 * leave nothing to sign in with, which is the same rule the unlink endpoint
 * applies from the other side.
 */
$app->put('/api/auth/password/enabled', function (Request $request, Response $response) {
    $user = $request->getAttribute('user');
    $body = $request->getParsedBody() ?? [];
    $enabled = !empty($body['enabled']);
    $pdo = usersDb();

    if ($enabled && $user['password'] === null) {
        return respondJson($response, ['error' => 'There is no password on this account to enable', 'code' => 'no_password'], 409);
    }

    if (!$enabled && !identityFor($pdo, (int) $user['id'], IDENTITY_GOOGLE)) {
        return respondJson($response, [
            'error' => 'Connect Google first, or you would not be able to sign in again',
            'code'  => 'would_lock_account',
        ], 409);
    }

    $pdo->prepare('UPDATE users SET password_login_enabled = ? WHERE id = ?')->execute([(int) $enabled, $user['id']]);

    return respondJson($response, authUserPayload(DbQuery::from($pdo, 'users')->fetch('_t.id = ?', [$user['id']])));
})->add(responds(AuthUser::class))->add(requireAuth());

// ---------------------------------------------------------------------------
// Two-factor authentication
//
// Off unless somebody turns it on, and once it is on it applies to every way
// into the account - password, emailed code and Google alike. A single rule is
// easier to hold in the head than a list of exceptions, and an account that
// demanded a code from one door and not another would be worth less than it
// appeared to be.
//
// Setting it up has three steps because the middle one matters: a secret is
// issued and shown, a code computed from it is handed back as proof that it
// was really scanned, and only then does the account start requiring one. An
// account that started demanding codes the moment a QR was drawn would lock
// out anybody whose camera did not focus.
// ---------------------------------------------------------------------------

/**
 * POST /api/auth/2fa/setup - issue a secret and show it.
 *
 * Nothing is required yet. The secret is written to the account so the enable
 * step can check a code against it, but `totp_enabled` stays false and sign-in
 * is unaffected until it flips. Asking again replaces the secret, which is
 * what somebody who abandoned the setup halfway and came back expects.
 */
$app->post('/api/auth/2fa/setup', function (Request $request, Response $response) {
    $user = $request->getAttribute('user');

    if (!empty($user['totp_enabled'])) {
        return respondJson($response, ['error' => 'Two-factor authentication is already on', 'code' => 'totp_already_on'], 409);
    }

    $secret = totpSecret();
    usersDb()->prepare('UPDATE users SET totp_secret = ? WHERE id = ?')->execute([$secret, $user['id']]);

    return respondJson($response, [
        'secret' => $secret,
        'uri' => totpUri($secret, (string) $user['email']),
    ]);
})->add(responds(TotpSetup::class))->add(requireAuth());

/**
 * POST /api/auth/2fa/enable - prove the secret was scanned, and turn it on.
 *
 * The recovery codes are generated here and returned once. They are stored
 * hashed, so this is genuinely the only time they can be shown - which is why
 * the front end makes rather a fuss about writing them down.
 */
$app->post('/api/auth/2fa/enable', function (Request $request, Response $response) {
    $user = $request->getAttribute('user');
    $body = $request->getParsedBody() ?? [];
    $pdo = usersDb();

    if (!empty($user['totp_enabled'])) {
        return respondJson($response, ['error' => 'Two-factor authentication is already on', 'code' => 'totp_already_on'], 409);
    }

    if (empty($user['totp_secret'])) {
        return respondJson($response, ['error' => 'Start again - there is no secret to confirm', 'code' => 'totp_not_started'], 409);
    }

    if (!totpVerify((string) $user['totp_secret'], (string) ($body['code'] ?? ''))) {
        return respondJson($response, ['error' => 'That code is not right', 'code' => 'totp_invalid'], 400);
    }

    $pdo->prepare('UPDATE users SET totp_enabled = TRUE WHERE id = ?')->execute([$user['id']]);
    $codes = generateRecoveryCodes($pdo, (int) $user['id']);

    // Other sessions were signed in without the second factor, which is what
    // was just decided to be insufficient.
    $session = $request->getAttribute('session');
    revokeSessionsFor($pdo, (int) $user['id'], SESSION_REVOKED_SECURITY, $session ? (int) $session['id'] : null);
    revokeTrustedDevices($pdo, (int) $user['id']);

    return respondJson($response, ['recovery_codes' => $codes]);
})->add(responds(TotpRecoveryCodes::class))->add(requireAuth());

/**
 * POST /api/auth/2fa/disable - turn it off again.
 *
 * A current code is required, for the same reason changing a password requires
 * the old one: somebody sitting at a signed-in machine should not be able to
 * quietly remove the thing that would have stopped them. A recovery code is
 * accepted too - being locked out of the app is exactly when this is needed.
 */
$app->post('/api/auth/2fa/disable', function (Request $request, Response $response) {
    $user = $request->getAttribute('user');
    $body = $request->getParsedBody() ?? [];
    $pdo = usersDb();

    if (empty($user['totp_enabled'])) {
        return respondJson($response, ['error' => 'Two-factor authentication is not on', 'code' => 'totp_not_on'], 409);
    }

    if (!totpChallengePassed($pdo, $user, (string) ($body['code'] ?? ''))) {
        return respondJson($response, ['error' => 'That code is not right', 'code' => 'totp_invalid'], 400);
    }

    $pdo->prepare('UPDATE users SET totp_enabled = FALSE, totp_secret = NULL WHERE id = ?')->execute([$user['id']]);
    $pdo->prepare('DELETE FROM user_recovery_codes WHERE user_id = ?')->execute([$user['id']]);

    $session = $request->getAttribute('session');
    revokeSessionsFor($pdo, (int) $user['id'], SESSION_REVOKED_SECURITY, $session ? (int) $session['id'] : null);
    revokeTrustedDevices($pdo, (int) $user['id']);

    return respondJson($response, authUserPayload(DbQuery::from($pdo, 'users')->fetch('_t.id = ?', [$user['id']])));
})->add(responds(AuthUser::class))->add(requireAuth());

/**
 * POST /api/auth/2fa/recovery - a fresh set of recovery codes.
 *
 * The old ones stop working, including any that were never used: somebody
 * asking for new codes is usually doing it because they are no longer sure who
 * has seen the old ones.
 */
$app->post('/api/auth/2fa/recovery', function (Request $request, Response $response) {
    $user = $request->getAttribute('user');
    $body = $request->getParsedBody() ?? [];
    $pdo = usersDb();

    if (empty($user['totp_enabled'])) {
        return respondJson($response, ['error' => 'Two-factor authentication is not on', 'code' => 'totp_not_on'], 409);
    }

    // A code from the app only. A recovery code cannot mint ten more of itself
    // - that would make one leaked code permanent.
    if (!totpVerify((string) $user['totp_secret'], (string) ($body['code'] ?? ''))) {
        return respondJson($response, ['error' => 'That code is not right', 'code' => 'totp_invalid'], 400);
    }

    return respondJson($response, ['recovery_codes' => generateRecoveryCodes($pdo, (int) $user['id'])]);
})->add(responds(TotpRecoveryCodes::class))->add(requireAuth());

// ---------------------------------------------------------------------------
// Sessions
//
// Where an account can see what has been signed in as it, and end anything it
// does not recognise. Everything here is scoped to the caller's own account by
// the query rather than by a check afterwards - there is no path through which
// one account can name another's session.
// ---------------------------------------------------------------------------

/**
 * GET /api/auth/sessions - where this account is signed in, and where it was.
 *
 * Live ones and finished ones together, newest first, because the useful
 * question is usually about one that has already ended. `current` marks the
 * session asking, so the page can say "this device" and refuse to offer a
 * button that would sign the reader out by surprise.
 *
 * `failed_since_last_login` rides along because it belongs to the same
 * question and would otherwise be a second request to answer half of it.
 */
$app->get('/api/auth/sessions', function (Request $request, Response $response) {
    $user = $request->getAttribute('user');
    $current = $request->getAttribute('session');
    $pdo = usersDb();

    $sessions = array_map(static function (array $session) use ($current): array {
        return [
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
            // Worked out here rather than left to the caller, which would have
            // to compare an expiry against a clock it does not share with us.
            'active' => $session['revoked_at'] === null && strtotime((string) $session['expires_at']) > time(),
            'current' => $current !== null && (int) $session['id'] === (int) $current['id'],
        ];
    }, sessionsFor($pdo, (int) $user['id']));

    return respondJson($response, [
        'sessions' => $sessions,
        'failed_since_last_login' => failedAttemptsSinceLastLogin($pdo, (int) $user['id']),
    ]);
})->add(responds(SessionList::class))->add(requireAuth());

/**
 * DELETE /api/auth/sessions/{id} - end one of them.
 *
 * Including the current one, which is simply signing out from a page that
 * happens to list it. The user_id in the WHERE clause is what makes this safe:
 * a session belonging to somebody else is not found rather than refused, so
 * the endpoint cannot be used to discover which ids exist.
 */
$app->delete('/api/auth/sessions/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $user = $request->getAttribute('user');
    $pdo = usersDb();

    $statement = $pdo->prepare('SELECT id FROM user_sessions WHERE id = ? AND user_id = ?');
    $statement->execute([$args['id'], $user['id']]);

    if (!$statement->fetch()) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    revokeSession($pdo, (int) $args['id'], SESSION_REVOKED_ELSEWHERE);

    return respondJson($response, ['message' => 'Session ended']);
})->add(responds(ApiMessage::class))->add(requireAuth());

/**
 * DELETE /api/auth/sessions - end all of them but this one.
 *
 * The button for somebody who suspects an old phone, a shared machine or
 * somebody else entirely. This one is spared deliberately: signing the reader
 * out as well would send them to a login form instead of showing them that it
 * worked.
 */
$app->delete('/api/auth/sessions', function (Request $request, Response $response) {
    $user = $request->getAttribute('user');
    $current = $request->getAttribute('session');
    $pdo = usersDb();

    $ended = revokeSessionsFor($pdo, (int) $user['id'], SESSION_REVOKED_ELSEWHERE, $current ? (int) $current['id'] : null);

    return respondJson($response, ['ended' => $ended]);
})->add(responds(SessionsEnded::class))->add(requireAuth());

/**
 * DELETE /api/auth/devices - ask for a code again from every browser.
 *
 * Remembering a device is a convenience, and this is how somebody takes it
 * back: a laptop lent out, a machine sold, or simply not being sure any more.
 * It ends nothing else - the sessions those browsers hold are a separate
 * question, with a separate button.
 */
$app->delete('/api/auth/devices', function (Request $request, Response $response) {
    $user = $request->getAttribute('user');

    return respondJson($response, ['ended' => revokeTrustedDevices(usersDb(), (int) $user['id'])]);
})->add(responds(SessionsEnded::class))->add(requireAuth());
