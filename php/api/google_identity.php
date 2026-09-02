<?php

/**
 * Checking that a Google id token really is one.
 *
 * The browser gets the token from Google Identity Services and posts it here.
 * It is a JWT signed with RS256 by a key Google publishes, so verifying it is
 * three things: the signature is Google's, the token was minted for this site,
 * and it has not expired. All three, or nothing - a token that fails any of
 * them is refused, and every failure below returns null rather than a reason.
 *
 * The audience check is the one that carries the weight. Anybody can obtain a
 * valid, correctly signed Google id token - by signing in to any site that
 * uses Google. What makes one of them proof of anything here is that `aud`
 * says it was minted for this site's client id, so a token collected elsewhere
 * cannot be replayed at this one.
 *
 * The signature is checked here rather than by asking Google's tokeninfo
 * endpoint. That would be a round trip on every sign-in, and the keys are
 * published precisely so it does not have to be one. Nothing here is
 * hand-rolled cryptography: the RSA key is assembled into a PEM and openssl
 * does the verifying. If that assembly is ever wrong, openssl refuses the key
 * and the token fails - it cannot fail the other way.
 */

const GOOGLE_KEYS_URL = 'https://www.googleapis.com/oauth2/v3/certs';

/** Google's two spellings of itself. Both appear in real tokens. */
const GOOGLE_ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];

/** How long a cached key set is used for when Google does not say. */
const GOOGLE_KEYS_FALLBACK_TTL = 3600;

/**
 * A little slack on the clock, for a token minted a moment ago on a server
 * whose clock is a moment behind Google's.
 */
const GOOGLE_CLOCK_SKEW = 60;

function googleConfig(): array
{
    static $config = null;

    if ($config === null) {
        $localFile = __DIR__ . '/../config/google.local.php';
        $config = require file_exists($localFile) ? $localFile : __DIR__ . '/../config/google.php';
    }

    return $config;
}

/** The client id, or null while signing in with Google is switched off. */
function googleClientId(): ?string
{
    $id = trim((string) (googleConfig()['client_id'] ?? ''));

    return $id === '' ? null : $id;
}

// ─────────────────────────────────────────────────────────────────────────────
// Google's signing keys
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Google's current public keys, by key id.
 *
 * Cached on disk, because they change every few days and fetching them on
 * every sign-in would put Google in the path of signing in. A cache that
 * cannot be read or written is not an error: the keys are simply fetched, and
 * the only cost is the request.
 */
function googleSigningKeys(bool $ignoreCache = false): array
{
    $cacheFile = __DIR__ . '/../storage/cache/google-jwks.json';

    if (!$ignoreCache && is_file($cacheFile)) {
        $cached = json_decode((string) @file_get_contents($cacheFile), true);
        if (is_array($cached) && ($cached['expires_at'] ?? 0) > time()) {
            return $cached['keys'] ?? [];
        }
    }

    $context = stream_context_create(['http' => ['timeout' => 10, 'ignore_errors' => true]]);
    $body = @file_get_contents(GOOGLE_KEYS_URL, false, $context);

    if ($body === false) {
        // Nothing fresh to be had. Stale keys are still worth trying: they
        // verify tokens signed before the rotation, and a token signed with a
        // key not among them is refused anyway.
        $cached = is_file($cacheFile) ? json_decode((string) @file_get_contents($cacheFile), true) : null;
        return is_array($cached) ? ($cached['keys'] ?? []) : [];
    }

    $document = json_decode($body, true);
    $keys = [];

    foreach ($document['keys'] ?? [] as $key) {
        // Only the RSA signing keys are any use here, and only ones with
        // everything needed to rebuild them.
        if (($key['kty'] ?? '') === 'RSA' && isset($key['kid'], $key['n'], $key['e'])) {
            $keys[$key['kid']] = $key;
        }
    }

    $directory = dirname($cacheFile);
    if (is_dir($directory) || @mkdir($directory, 0777, true) || is_dir($directory)) {
        @file_put_contents($cacheFile, json_encode([
            'expires_at' => time() + googleKeysLifetime($http_response_header ?? []),
            'keys' => $keys,
        ]));
    }

    return $keys;
}

/** How long the response says its keys are good for. */
function googleKeysLifetime(array $headers): int
{
    foreach ($headers as $header) {
        if (preg_match('/^cache-control:.*max-age=(\d+)/i', $header, $found)) {
            return max(300, (int) $found[1]);
        }
    }

    return GOOGLE_KEYS_FALLBACK_TTL;
}

// ─────────────────────────────────────────────────────────────────────────────
// DER, so openssl has a key it recognises
// ─────────────────────────────────────────────────────────────────────────────
//
// A JWK gives the modulus and exponent as two numbers. openssl wants a PEM,
// which is base64 around a DER SubjectPublicKeyInfo, so the numbers have to be
// wrapped back up in the structure they were unwrapped from.

function derLength(int $length): string
{
    if ($length < 128) {
        return chr($length);
    }

    $bytes = ltrim(pack('N', $length), "\x00");

    return chr(0x80 | strlen($bytes)) . $bytes;
}

/**
 * A DER INTEGER.
 *
 * DER integers are signed, and these two are not, so a leading byte of 0x80 or
 * more has to be pushed clear of the sign bit with a zero in front of it -
 * without which a 2048-bit modulus reads as a negative number and the key is
 * rejected.
 */
function derInteger(string $bytes): string
{
    $bytes = ltrim($bytes, "\x00");

    if ($bytes === '') {
        $bytes = "\x00";
    }

    if (ord($bytes[0]) > 0x7F) {
        $bytes = "\x00" . $bytes;
    }

    return "\x02" . derLength(strlen($bytes)) . $bytes;
}

function derSequence(string $contents): string
{
    return "\x30" . derLength(strlen($contents)) . $contents;
}

/** A BIT STRING, with the leading byte that says no bits are unused. */
function derBitString(string $contents): string
{
    return "\x03" . derLength(strlen($contents) + 1) . "\x00" . $contents;
}

/** base64url, as every field in a JWT is encoded. */
function googleBase64UrlDecode(string $data): string
{
    return (string) base64_decode(strtr($data, '-_', '+/'), true);
}

/** A JWK's modulus and exponent, as a PEM public key openssl will take. */
function googleJwkToPem(array $key): ?string
{
    $modulus = googleBase64UrlDecode($key['n']);
    $exponent = googleBase64UrlDecode($key['e']);

    if ($modulus === '' || $exponent === '') {
        return null;
    }

    // OID 1.2.840.113549.1.1.1 (rsaEncryption), then the NULL parameters that
    // an RSA key's algorithm identifier carries.
    $algorithm = derSequence("\x06\x09\x2a\x86\x48\x86\xf7\x0d\x01\x01\x01" . "\x05\x00");
    $publicKey = derSequence(derInteger($modulus) . derInteger($exponent));
    $info = derSequence($algorithm . derBitString($publicKey));

    return "-----BEGIN PUBLIC KEY-----\n" . chunk_split(base64_encode($info), 64, "\n") . "-----END PUBLIC KEY-----\n";
}

// ─────────────────────────────────────────────────────────────────────────────
// The token
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The claims in a Google id token, once it has been shown to be one.
 *
 * Null for every way it can fail to be - malformed, signed by a key that is
 * not Google's, minted for another site, expired, or arriving while signing in
 * with Google is switched off. The caller is told none of them apart, because
 * to anybody holding a token that did not work the answer is the same.
 */
function googleVerifyIdToken(string $idToken): ?array
{
    $clientId = googleClientId();

    if ($clientId === null) {
        return null;
    }

    $parts = explode('.', $idToken);

    if (count($parts) !== 3) {
        return null;
    }

    [$encodedHeader, $encodedPayload, $encodedSignature] = $parts;

    $header = json_decode(googleBase64UrlDecode($encodedHeader), true);
    $claims = json_decode(googleBase64UrlDecode($encodedPayload), true);
    $signature = googleBase64UrlDecode($encodedSignature);

    if (!is_array($header) || !is_array($claims) || $signature === '') {
        return null;
    }

    // The algorithm is pinned rather than read from the token. A token is not
    // allowed to nominate how it should be checked - that is how "alg: none"
    // and HMAC-with-the-public-key get in.
    if (($header['alg'] ?? '') !== 'RS256' || empty($header['kid'])) {
        return null;
    }

    if (!googleSignatureIsGoogles($encodedHeader . '.' . $encodedPayload, $signature, $header['kid'])) {
        return null;
    }

    if (!in_array($claims['iss'] ?? '', GOOGLE_ISSUERS, true)) {
        return null;
    }

    // The check that makes any of this proof of anything here.
    if (($claims['aud'] ?? '') !== $clientId) {
        return null;
    }

    if ((int) ($claims['exp'] ?? 0) + GOOGLE_CLOCK_SKEW < time()) {
        return null;
    }

    if (empty($claims['sub'])) {
        return null;
    }

    return $claims;
}

/**
 * Whether the signature is Google's, by the key the token names.
 *
 * A key id that is not in the cached set is worth one refetch before giving
 * up: Google rotates keys, and the first token signed with a new one arrives
 * before the cache has expired.
 */
function googleSignatureIsGoogles(string $signed, string $signature, string $keyId): bool
{
    foreach ([false, true] as $ignoreCache) {
        $keys = googleSigningKeys($ignoreCache);

        if (!isset($keys[$keyId])) {
            continue;
        }

        $pem = googleJwkToPem($keys[$keyId]);

        // openssl_verify answers 1, 0 or -1, and only 1 is a good signature.
        return $pem !== null && openssl_verify($signed, $signature, $pem, OPENSSL_ALGO_SHA256) === 1;
    }

    return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Identities
// ─────────────────────────────────────────────────────────────────────────────

const IDENTITY_GOOGLE = 'google';

/** The account an identity belongs to, or null if nobody has claimed it. */
function identityOwner(PDO $pdo, string $provider, string $subject): ?array
{
    $statement = $pdo->prepare(
        'SELECT u.* FROM user_identities i
           JOIN users u ON u.id = i.user_id AND u.deleted = FALSE
          WHERE i.provider = ? AND i.subject = ?'
    );
    $statement->execute([$provider, $subject]);
    $user = $statement->fetch();

    return $user === false ? null : $user;
}

/** One account's identity with a provider, if it has one. */
function identityFor(PDO $pdo, int $userId, string $provider): ?array
{
    $statement = $pdo->prepare('SELECT * FROM user_identities WHERE user_id = ? AND provider = ?');
    $statement->execute([$userId, $provider]);
    $identity = $statement->fetch();

    return $identity === false ? null : $identity;
}

/** Attaches an identity to an account. */
function attachIdentity(PDO $pdo, int $userId, string $provider, string $subject, ?string $email): void
{
    $pdo->prepare('INSERT INTO user_identities (user_id, provider, subject, email) VALUES (?, ?, ?, ?)')
        ->execute([$userId, $provider, $subject, $email]);
}
