<?php

use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * Devices that have already proved a code once.
 *
 * Two-factor that asks on every sign-in from the same laptop is a nuisance,
 * and nuisance is what makes people turn it off. So a browser can be
 * remembered: it holds a secret, presents it next time, and the password alone
 * gets in until the secret expires.
 *
 * It is a convenience, not a second factor - so it is never enough on its own.
 * The password (or Google, or an emailed code) still has to be right; all this
 * skips is the six digits. That is what stops a stolen device token being a way
 * into an account by itself.
 *
 * Stored as a hash, like every other token here. The browser has the secret and
 * a copy of this table is no use to anybody.
 */

/** Thirty days. "Remember me" that lasts forever is not a second factor. */
const TRUSTED_DEVICE_LIFETIME = 2592000;

/** How often a device's last-used stamp is worth rewriting. */
const TRUSTED_DEVICE_TOUCH_INTERVAL = 3600;

function trustedDeviceHash(string $token): string
{
    return hash('sha256', $token);
}

/**
 * Remembers this browser, and hands back the secret for it to keep.
 *
 * 32 bytes from the CSPRNG: this is a bearer secret, and the only thing making
 * it unguessable is its length.
 */
function issueTrustedDevice(PDO $pdo, int $userId, Request $request): string
{
    $token = bin2hex(random_bytes(32));

    $pdo->prepare(
        'INSERT INTO user_trusted_devices (user_id, token_hash, user_agent, ip, last_used_at, expires_at)
              VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + (? * INTERVAL \'1 second\'))'
    )->execute([$userId, trustedDeviceHash($token), requestUserAgent($request), requestIp($request), TRUSTED_DEVICE_LIFETIME]);

    return $token;
}

/**
 * Whether this account has already answered a code from this browser.
 *
 * The device must belong to the account being signed into. Without that check
 * a token issued to one account would skip the code on another, which is the
 * whole thing this is meant to be careful about.
 */
function trustedDeviceAccepted(PDO $pdo, int $userId, ?string $token): bool
{
    if (!is_string($token) || $token === '') {
        return false;
    }

    $statement = $pdo->prepare(
        'SELECT id, last_used_at FROM user_trusted_devices
          WHERE token_hash = ? AND user_id = ? AND revoked_at IS NULL AND expires_at > CURRENT_TIMESTAMP'
    );
    $statement->execute([trustedDeviceHash($token), $userId]);
    $device = $statement->fetch();

    if ($device === false) {
        return false;
    }

    $lastUsed = $device['last_used_at'] ?? null;
    if ($lastUsed === null || time() - strtotime((string) $lastUsed) >= TRUSTED_DEVICE_TOUCH_INTERVAL) {
        $pdo->prepare('UPDATE user_trusted_devices SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?')
            ->execute([$device['id']]);
    }

    return true;
}

/**
 * Forgets every remembered device for an account.
 *
 * Called wherever the second factor or the password changes. Those are the
 * moments somebody is shutting somebody else out, and a remembered device is
 * exactly what they would be trying to shut out.
 */
function revokeTrustedDevices(PDO $pdo, int $userId): int
{
    $statement = $pdo->prepare(
        'UPDATE user_trusted_devices SET revoked_at = CURRENT_TIMESTAMP
          WHERE user_id = ? AND revoked_at IS NULL'
    );
    $statement->execute([$userId]);

    return $statement->rowCount();
}

/** How many are still remembered, for the account page to offer to clear. */
function trustedDeviceCount(PDO $pdo, int $userId): int
{
    $statement = $pdo->prepare(
        'SELECT COUNT(*) FROM user_trusted_devices
          WHERE user_id = ? AND revoked_at IS NULL AND expires_at > CURRENT_TIMESTAMP'
    );
    $statement->execute([$userId]);

    return (int) $statement->fetchColumn();
}
