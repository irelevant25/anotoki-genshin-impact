<?php

use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * Sessions, and the attempts that did not become one.
 *
 * A token now names a row. That is what makes signing out mean something -
 * the row is revoked and the token stops working, rather than staying valid
 * until it expires - and it is what lets an account list where it is signed in
 * and end a session it does not recognise.
 *
 * The cost is a lookup per authenticated request, which is a lookup this API
 * was already making: requireAuth() has always re-read the user from the
 * database rather than trusting the claims in the token.
 */

/** How the session was signed in. */
const SESSION_METHOD_PASSWORD = 'password';
const SESSION_METHOD_LOGIN_CODE = 'login_code';
const SESSION_METHOD_GOOGLE = 'google';
/** Followed a link we emailed: confirming an address, or resetting a password. */
const SESSION_METHOD_EMAIL_LINK = 'email_link';

/** Why a session ended, where anything ended it but its own expiry. */
const SESSION_REVOKED_SIGNOUT = 'signed_out';
const SESSION_REVOKED_ELSEWHERE = 'signed_out_elsewhere';
const SESSION_REVOKED_PASSWORD = 'password_changed';
const SESSION_REVOKED_SECURITY = 'security_change';

/** Matches the token's own lifetime - see jwtIssue(). */
const SESSION_LIFETIME = 172800;

/**
 * How stale last_seen_at is allowed to get before it is written again.
 *
 * Without this every authenticated request would be a write. A minute is far
 * finer than "is this session still in use", which is all it is read for.
 */
const SESSION_TOUCH_INTERVAL = 60;

// ─────────────────────────────────────────────────────────────────────────────
// Where the request came from
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The caller's address, as far as it can be known.
 *
 * REMOTE_ADDR only. X-Forwarded-For is a header the caller writes, so trusting
 * it would let anybody set their own address and walk past the rate limiter by
 * changing it each time. Behind a proxy this records the proxy, which makes
 * the limit shared rather than absent - if this is ever deployed that way, the
 * fix is a list of trusted proxies here, not trusting the header.
 */
function requestIp(Request $request): ?string
{
    $server = $request->getServerParams();
    $ip = $server['REMOTE_ADDR'] ?? null;

    return is_string($ip) && $ip !== '' ? substr($ip, 0, 45) : null;
}

/** The browser, trimmed to what the column holds. */
function requestUserAgent(Request $request): ?string
{
    $agent = trim($request->getHeaderLine('User-Agent'));

    return $agent === '' ? null : substr($agent, 0, 255);
}

/**
 * The caller's hardware address, on the rare occasion there is one to read.
 *
 * A MAC address belongs to the link the request last crossed, not to the
 * request. Every router rewrites it, so a public server sees its own upstream
 * hop and never the caller - and there is no header carrying the real one, nor
 * would a header be worth believing if there were. So this is read here or not
 * at all, and "not at all" is the usual answer.
 *
 * What it does catch is a caller on the same network as the server, which is
 * still in its neighbour table: a phone against a development machine, a
 * browser on the same office network. Everything else gets null, and null is
 * the truthful value rather than a gap to be filled with a guess.
 *
 * Nothing is spawned for an address that could not possibly be a neighbour,
 * which keeps this off the sign-in path of every real deployment.
 */
function requestMac(Request $request): ?string
{
    $ip = requestIp($request);

    if ($ip === null || !macWorthLookingUp($ip)) {
        return null;
    }

    return arpLookup($ip) ?? null;
}

/**
 * Whether an address could be a neighbour at all.
 *
 * Private and link-local ranges only. A public address is by definition
 * somewhere beyond a router, and loopback never appears in a neighbour table -
 * so both are answered without touching the system. IPv6 is left out because
 * its neighbours live somewhere other than the ARP table on both platforms,
 * and a nullable column is a better answer than a second implementation.
 */
function macWorthLookingUp(string $ip): bool
{
    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) === false) {
        return false;
    }

    if (str_starts_with($ip, '127.')) {
        return false;
    }

    // False here means the address is private or reserved - the only kind that
    // can share a link with us.
    return filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false;
}

/**
 * Looks one address up in the system's neighbour table.
 *
 * Linux first, by reading /proc/net/arp, which needs no process and no shell.
 * Windows has no equivalent file, so it falls back to `arp`, and only if the
 * host has not disabled the means of running it - shared hosting usually has,
 * which is fine: shared hosting is also where the answer is always null.
 *
 * The address reaching the command line has already been through
 * FILTER_VALIDATE_IP and is escaped besides, so there is nothing in it for a
 * shell to find interesting.
 */
function arpLookup(string $ip): ?string
{
    $table = @file_get_contents('/proc/net/arp');

    if ($table === false) {
        $table = shellAvailable() ? @shell_exec('arp -a ' . escapeshellarg($ip) . ' 2>&1') : null;
    }

    if (!is_string($table) || $table === '') {
        return null;
    }

    foreach (explode("\n", $table) as $line) {
        $fields = preg_split('/\s+/', trim($line));

        if ($fields === false || !in_array($ip, $fields, true)) {
            continue;
        }

        foreach ($fields as $field) {
            $mac = normaliseMac($field);

            // All zeroes is the table saying it asked and got no answer.
            if ($mac !== null && $mac !== '00:00:00:00:00:00') {
                return $mac;
            }
        }
    }

    return null;
}

/** A MAC in one shape, from either of the two the platforms print. */
function normaliseMac(string $value): ?string
{
    if (!preg_match('/^[0-9a-f]{2}([:-][0-9a-f]{2}){5}$/i', $value)) {
        return null;
    }

    return strtolower(str_replace('-', ':', $value));
}

/** Whether this host will let us run anything at all. */
function shellAvailable(): bool
{
    if (!function_exists('shell_exec')) {
        return false;
    }

    $disabled = array_map('trim', explode(',', (string) ini_get('disable_functions')));

    return !in_array('shell_exec', $disabled, true);
}

// ─────────────────────────────────────────────────────────────────────────────
// Sessions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Opens a session and hands back its token id, for the JWT to carry.
 *
 * 16 bytes from the CSPRNG. It is not a secret on its own - the token's
 * signature is what makes it unforgeable - but it must not be guessable
 * either, or one account could name another's session.
 */
function openSession(PDO $pdo, int $userId, string $method, Request $request): string
{
    $tokenId = bin2hex(random_bytes(16));

    $pdo->prepare(
        'INSERT INTO user_sessions (user_id, token_id, method, ip, mac, user_agent, last_seen_at, expires_at)
              VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + (? * INTERVAL \'1 second\'))'
    )->execute([$userId, $tokenId, $method, requestIp($request), requestMac($request), requestUserAgent($request), SESSION_LIFETIME]);

    return $tokenId;
}

/** The live session with this id, or null if there is not one. */
function findSession(PDO $pdo, string $tokenId): ?array
{
    if ($tokenId === '') {
        return null;
    }

    $statement = $pdo->prepare(
        'SELECT * FROM user_sessions
          WHERE token_id = ? AND revoked_at IS NULL AND expires_at > CURRENT_TIMESTAMP'
    );
    $statement->execute([$tokenId]);
    $session = $statement->fetch();

    return $session === false ? null : $session;
}

/** Notes that a session is still in use, at most once a minute. */
function touchSession(PDO $pdo, array $session): void
{
    $lastSeen = $session['last_seen_at'] ?? null;

    if ($lastSeen !== null && time() - strtotime((string) $lastSeen) < SESSION_TOUCH_INTERVAL) {
        return;
    }

    $pdo->prepare('UPDATE user_sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?')->execute([$session['id']]);
}

/** Ends one session. */
function revokeSession(PDO $pdo, int $sessionId, string $reason): bool
{
    $statement = $pdo->prepare(
        'UPDATE user_sessions SET revoked_at = CURRENT_TIMESTAMP, revoked_reason = ?
          WHERE id = ? AND revoked_at IS NULL'
    );
    $statement->execute([$reason, $sessionId]);

    return $statement->rowCount() === 1;
}

/**
 * Ends every live session for an account, optionally sparing one.
 *
 * Used by "sign out everywhere else", and by the changes that ought to end
 * other sessions: a new password, or two-factor being turned on or off. Those
 * are the moments somebody is most likely to be shutting somebody else out.
 */
function revokeSessionsFor(PDO $pdo, int $userId, string $reason, ?int $exceptSessionId = null): int
{
    $sql = 'UPDATE user_sessions SET revoked_at = CURRENT_TIMESTAMP, revoked_reason = ?
             WHERE user_id = ? AND revoked_at IS NULL AND expires_at > CURRENT_TIMESTAMP';
    $parameters = [$reason, $userId];

    if ($exceptSessionId !== null) {
        $sql .= ' AND id <> ?';
        $parameters[] = $exceptSessionId;
    }

    $statement = $pdo->prepare($sql);
    $statement->execute($parameters);

    return $statement->rowCount();
}

/** An account's sessions, newest first, live ones and finished ones alike. */
function sessionsFor(PDO $pdo, int $userId, int $limit = 50): array
{
    $statement = $pdo->prepare(
        'SELECT * FROM user_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
    );
    $statement->execute([$userId, $limit]);

    return $statement->fetchAll(PDO::FETCH_ASSOC);
}

// ─────────────────────────────────────────────────────────────────────────────
// Attempts
// ─────────────────────────────────────────────────────────────────────────────

/** How far back the limiter counts. */
const ATTEMPT_WINDOW = 900;

/**
 * Failures from one source against one address before it is refused outright.
 *
 * Deliberately keyed on the pair rather than on the address alone. A limit on
 * the address by itself hands anybody a way to lock somebody else out of their
 * own account by failing at it ten times, which trades a guessing problem for
 * a denial-of-service one.
 */
const ATTEMPT_MAX_PER_EMAIL_IP = 10;

/** And a looser ceiling per source, so one machine cannot work through a list. */
const ATTEMPT_MAX_PER_IP = 50;

/** Records how a sign-in went, whichever way it was tried. */
function recordLoginAttempt(PDO $pdo, Request $request, string $email, ?int $userId, string $method, string $outcome): void
{
    $pdo->prepare('INSERT INTO user_login_attempts (email, user_id, ip, method, outcome) VALUES (?, ?, ?, ?, ?)')
        ->execute([substr($email, 0, 255), $userId, requestIp($request), $method, $outcome]);
}

/**
 * Whether this caller has failed too often to be allowed another go.
 *
 * Counted rather than locked: nothing is stored against the account, so the
 * refusal lifts on its own once the window rolls past. There is no state here
 * for an attacker to leave behind.
 */
function loginAttemptsExceeded(PDO $pdo, Request $request, string $email): bool
{
    $ip = requestIp($request);

    if ($ip === null) {
        return false;
    }

    $window = "CURRENT_TIMESTAMP - (" . ATTEMPT_WINDOW . " * INTERVAL '1 second')";

    $perPair = $pdo->prepare(
        "SELECT COUNT(*) FROM user_login_attempts
          WHERE email = ? AND ip = ? AND outcome <> 'ok' AND created_at > $window"
    );
    $perPair->execute([$email, $ip]);

    if ((int) $perPair->fetchColumn() >= ATTEMPT_MAX_PER_EMAIL_IP) {
        return true;
    }

    $perIp = $pdo->prepare(
        "SELECT COUNT(*) FROM user_login_attempts
          WHERE ip = ? AND outcome <> 'ok' AND created_at > $window"
    );
    $perIp->execute([$ip]);

    return (int) $perIp->fetchColumn() >= ATTEMPT_MAX_PER_IP;
}

/**
 * Failed attempts on an account since it last signed in successfully.
 *
 * The number worth showing somebody: not a lifetime total, which only grows,
 * but "somebody has been trying since you were last here".
 */
function failedAttemptsSinceLastLogin(PDO $pdo, int $userId): int
{
    $statement = $pdo->prepare(
        "SELECT COUNT(*) FROM user_login_attempts
          WHERE user_id = ? AND outcome <> 'ok'
            AND created_at > COALESCE(
                (SELECT MAX(created_at) FROM user_login_attempts WHERE user_id = ? AND outcome = 'ok'),
                TIMESTAMP 'epoch')"
    );
    $statement->execute([$userId, $userId]);

    return (int) $statement->fetchColumn();
}
