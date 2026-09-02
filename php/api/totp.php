<?php

/**
 * Time-based one-time passwords, and the codes for when the phone is gone.
 *
 * RFC 6238 over RFC 4226, which is what every authenticator app speaks: a
 * shared secret, the clock divided into thirty-second steps, and six digits
 * derived from an HMAC of the step number. Nothing about it is specific to any
 * app - the secret is handed over as an otpauth:// URI and whatever scans it
 * produces the same digits.
 *
 * SHA-1 is not a mistake here. RFC 6238 allows SHA-256, but Google
 * Authenticator and most others ignore the algorithm parameter in the URI and
 * assume SHA-1, so anything else produces codes that do not match and a
 * confusing setup screen. The construction is HMAC, where SHA-1's collision
 * weakness does not apply, and the output is truncated to six digits and lives
 * thirty seconds.
 *
 * The secret is stored as it is, because verifying a code means computing one
 * and that needs the secret back. That is worth knowing: anybody who can read
 * the users table can generate codes. It is the same table that holds the
 * password hashes, and unlike those the secret cannot be one-way - so 2FA here
 * is protection against a stolen password, not against a stolen database.
 */

/** The step, in seconds. Thirty is what every authenticator assumes. */
const TOTP_STEP = 30;

/** Digits in a code. Six, for the same reason. */
const TOTP_DIGITS = 6;

/**
 * How many steps either side of now are accepted.
 *
 * One, so a code typed as it turns over still works and a phone whose clock is
 * half a minute out is not useless. Wider than that starts to matter: each
 * extra step is another code an attacker guessing at random can hit.
 */
const TOTP_WINDOW = 1;

/** How many recovery codes are issued at a time. */
const TOTP_RECOVERY_COUNT = 10;

const TOTP_BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Bytes as base32, which is how a secret is written in an otpauth:// URI and
 * typed into an app by hand.
 *
 * No padding: the URI form does not use it, and apps that accept a typed key
 * generally reject it.
 */
function base32Encode(string $bytes): string
{
    $bits = '';
    foreach (str_split($bytes) as $byte) {
        $bits .= str_pad(decbin(ord($byte)), 8, '0', STR_PAD_LEFT);
    }

    $encoded = '';
    foreach (str_split($bits, 5) as $chunk) {
        $encoded .= TOTP_BASE32_ALPHABET[bindec(str_pad($chunk, 5, '0', STR_PAD_RIGHT))];
    }

    return $encoded;
}

/** The other direction. Empty string for anything that is not base32. */
function base32Decode(string $encoded): string
{
    $encoded = strtoupper(rtrim($encoded, '='));
    $bits = '';

    foreach (str_split($encoded) as $character) {
        $index = strpos(TOTP_BASE32_ALPHABET, $character);
        if ($index === false) {
            return '';
        }
        $bits .= str_pad(decbin($index), 5, '0', STR_PAD_LEFT);
    }

    $bytes = '';
    // Whole bytes only: the trailing bits of the last group are padding.
    foreach (str_split($bits, 8) as $chunk) {
        if (strlen($chunk) === 8) {
            $bytes .= chr(bindec($chunk));
        }
    }

    return $bytes;
}

/** A fresh secret: 160 bits, which is what RFC 4226 recommends for SHA-1. */
function totpSecret(): string
{
    return base32Encode(random_bytes(20));
}

/** The six digits for one step of the clock. */
function totpCode(string $secret, int $counter): string
{
    $key = base32Decode($secret);

    if ($key === '') {
        return '';
    }

    // The counter as eight bytes, big-endian. pack('J') is 64-bit big-endian,
    // which is exactly the RFC's C.
    $hash = hash_hmac('sha1', pack('J', $counter), $key, true);

    // Dynamic truncation: the low nibble of the last byte picks where to read
    // four bytes from, and the top bit of those is masked off so the result is
    // positive on every platform.
    $offset = ord($hash[19]) & 0x0F;
    $binary = ((ord($hash[$offset]) & 0x7F) << 24)
        | (ord($hash[$offset + 1]) << 16)
        | (ord($hash[$offset + 2]) << 8)
        | ord($hash[$offset + 3]);

    return str_pad((string) ($binary % (10 ** TOTP_DIGITS)), TOTP_DIGITS, '0', STR_PAD_LEFT);
}

/**
 * Whether a code is one of the ones valid around now.
 *
 * hash_equals on every comparison: the codes are compared against a value the
 * caller supplied, and a short-circuiting comparison leaks how much of a guess
 * was right. Every candidate is checked rather than returning on the first
 * match, so the work does not depend on which step matched either.
 */
function totpVerify(string $secret, string $code, ?int $now = null): bool
{
    $code = preg_replace('/\D/', '', $code);

    if (strlen($code) !== TOTP_DIGITS || $secret === '') {
        return false;
    }

    $counter = intdiv($now ?? time(), TOTP_STEP);
    $matched = false;

    for ($step = -TOTP_WINDOW; $step <= TOTP_WINDOW; $step++) {
        $matched = hash_equals(totpCode($secret, $counter + $step), $code) || $matched;
    }

    return $matched;
}

/**
 * The otpauth:// URI an authenticator reads, as a QR code or from a link.
 *
 * The label carries the issuer as well as the account, which is the convention
 * that makes an app show "Anotoki (someone@example.com)" rather than a bare
 * address among a dozen others.
 */
function totpUri(string $secret, string $account, string $issuer = 'Anotoki'): string
{
    $label = rawurlencode($issuer) . ':' . rawurlencode($account);

    return 'otpauth://totp/' . $label . '?' . http_build_query([
        'secret' => $secret,
        'issuer' => $issuer,
        'algorithm' => 'SHA1',
        'digits' => TOTP_DIGITS,
        'period' => TOTP_STEP,
    ]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Recovery codes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ten codes, shown once and stored only as hashes.
 *
 * These are the way back in when the phone is lost, so they are the one thing
 * on the account as powerful as the password itself - hence hashed like one,
 * and hence single-use. Ten characters of base32 is fifty bits, which is far
 * past guessing and still short enough to write on paper.
 */
function generateRecoveryCodes(PDO $pdo, int $userId): array
{
    $pdo->prepare('DELETE FROM user_recovery_codes WHERE user_id = ?')->execute([$userId]);

    $insert = $pdo->prepare('INSERT INTO user_recovery_codes (user_id, code_hash) VALUES (?, ?)');
    $codes = [];

    for ($index = 0; $index < TOTP_RECOVERY_COUNT; $index++) {
        // Split in the middle, which is how every site writes these and how
        // people manage to copy them down without losing their place.
        $raw = substr(base32Encode(random_bytes(10)), 0, 10);
        $code = substr($raw, 0, 5) . '-' . substr($raw, 5, 5);

        $insert->execute([$userId, hash('sha256', $raw)]);
        $codes[] = $code;
    }

    return $codes;
}

/**
 * Spends a recovery code, if it is one of this account's unused ones.
 *
 * The hyphen and case are cosmetic, so they are stripped before hashing - a
 * code read off paper is not going to be typed the way it was printed.
 */
function consumeRecoveryCode(PDO $pdo, int $userId, string $code): bool
{
    $normalised = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $code));

    if ($normalised === '') {
        return false;
    }

    // The WHERE clause carries the "unused" condition rather than trusting a
    // read that came before it, so the same code arriving twice at once cannot
    // be spent twice.
    $statement = $pdo->prepare(
        'UPDATE user_recovery_codes SET used_at = CURRENT_TIMESTAMP
          WHERE user_id = ? AND code_hash = ? AND used_at IS NULL'
    );
    $statement->execute([$userId, hash('sha256', $normalised)]);

    return $statement->rowCount() === 1;
}

/** How many are left, for the account page to warn when they are running out. */
function recoveryCodesRemaining(PDO $pdo, int $userId): int
{
    $statement = $pdo->prepare('SELECT COUNT(*) FROM user_recovery_codes WHERE user_id = ? AND used_at IS NULL');
    $statement->execute([$userId]);

    return (int) $statement->fetchColumn();
}

/**
 * The second factor, checked the same way wherever a sign-in happens.
 *
 * Either the app's current code or one of the recovery codes, and the recovery
 * code is spent by being used. Returns false when the account has 2FA on and
 * neither was given, which is what the sign-in endpoints turn into a refusal
 * the front end can act on.
 */
function totpChallengePassed(PDO $pdo, array $user, ?string $code): bool
{
    if (empty($user['totp_enabled'])) {
        return true;
    }

    $code = trim((string) $code);

    if ($code === '') {
        return false;
    }

    return totpVerify((string) $user['totp_secret'], $code) || consumeRecoveryCode($pdo, (int) $user['id'], $code);
}
