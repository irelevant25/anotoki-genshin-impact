<?php

/**
 * reset-password.php - set a new password for an account from the command line.
 *
 *   php reset-password.php <email> [new-password] [--clear-2fa]
 *
 * For when the password to an account is lost and the emailed reset cannot be
 * used - locally, where mail is written to storage/mail/ rather than sent, or
 * any time the mailbox is out of reach. Run from a machine with filesystem
 * access to this install; there is no other gate, because that access is the
 * gate.
 *
 * It does the whole "let me back in" and not just the password: the account is
 * marked confirmed and password sign-in is re-enabled (a disabled one cannot be
 * signed into however right the password is), and any lockout from failed
 * attempts is cleared. Two-factor is left alone unless --clear-2fa is given, so
 * losing a password does not quietly turn off 2FA.
 *
 * With no password given, a strong one is generated, printed once, and flagged
 * so the site asks for a new one at first sign-in.
 *
 * A maintenance script: not reachable over the web (CLI only), and not shipped
 * by build-dist.php. On a shell-less production host, use the emailed reset.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit("reset-password.php is a command-line tool.\n");
}

require_once __DIR__ . '/config/db.php';

// ── Arguments ───────────────────────────────────────────────────────────────

$args = array_slice($argv, 1);
$clear2fa = in_array('--clear-2fa', $args, true);
$positional = array_values(array_filter($args, fn($a) => !str_starts_with($a, '--')));

$email = $positional[0] ?? null;
$given = $positional[1] ?? null;

if ($email === null) {
    echo "Usage: php reset-password.php <email> [new-password] [--clear-2fa]\n";
    echo "  With no password, a strong one is generated and printed.\n";
    exit(1);
}

// ── Find the account ────────────────────────────────────────────────────────

$db = usersDb();
$stmt = $db->prepare('SELECT id, username, email, role, deleted, totp_enabled FROM users WHERE lower(email) = lower(?)');
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo "No account with the email '{$email}'.\n";
    exit(1);
}
if ($user['deleted']) {
    echo "The account '{$email}' is deleted. Restore it in the admin panel first, then reset.\n";
    exit(1);
}

// ── Decide the password ─────────────────────────────────────────────────────

if ($given !== null) {
    if (strlen($given) < 8) {
        echo "The password must be at least 8 characters.\n";
        exit(1);
    }
    $password = $given;
    $forceChange = false;
} else {
    // Readable but strong; printed once below.
    $password = bin2hex(random_bytes(6));
    $forceChange = true;
}

// ── Apply ───────────────────────────────────────────────────────────────────

// The boolean flags are literals, not input, so they go straight into the SQL;
// only the hash and the id are bound.
$sql = 'UPDATE users SET password = ?, email_confirmed = TRUE, password_login_enabled = TRUE, '
    . 'force_password_change = ' . ($forceChange ? 'TRUE' : 'FALSE');
if ($clear2fa) {
    $sql .= ', totp_enabled = FALSE, totp_secret = NULL';
}
$sql .= ' WHERE id = ?';

$db->prepare($sql)->execute([password_hash($password, PASSWORD_DEFAULT), $user['id']]);

// Clear any lockout from failed attempts, if that table is present.
try {
    $db->prepare('DELETE FROM user_login_attempts WHERE lower(email) = lower(?)')->execute([$email]);
} catch (\Throwable $e) {
    // No such table on this install; nothing to clear.
}

// ── Report ──────────────────────────────────────────────────────────────────

echo "Reset access for {$user['username']} <{$user['email']}> (role {$user['role']}).\n";
if ($forceChange) {
    echo "  New password: {$password}\n";
    echo "  The site will ask for a new one at first sign-in.\n";
} else {
    echo "  The password is the one you provided.\n";
}
echo "  Password sign-in is enabled and the address is confirmed; any lockout is cleared.\n";

if ($clear2fa && $user['totp_enabled']) {
    echo "  Two-factor authentication has been turned off.\n";
} elseif ($user['totp_enabled']) {
    echo "  Note: two-factor is still ON. If you also lost that, re-run with --clear-2fa.\n";
}
