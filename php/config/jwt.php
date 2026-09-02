<?php

// ---------------------------------------------------------------------------
// JWT helpers — no external library, uses PHP built-in hash_hmac (HS256)
// ---------------------------------------------------------------------------
// To set your secret create config/jwt.local.php that simply returns a string:
//   <?php return 'your-strong-random-secret-here-min-32-chars';
// jwt.local.php must be listed in .gitignore.
// ---------------------------------------------------------------------------

function _jwtBase64UrlEncode(string $data): string
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function _jwtBase64UrlDecode(string $data): string
{
    return base64_decode(strtr($data, '-_', '+/'));
}

function getJwtSecret(): string
{
    $localFile = __DIR__ . '/jwt.local.php';
    if (file_exists($localFile)) {
        return require $localFile;
    }
    // Fallback — override this in production via config/jwt.local.php
    return 'changeme-create-config-jwt-local-php-with-strong-secret';
}

/**
 * Issues a signed JWT valid for 48 hours.
 *
 * `sid` names the session row the token belongs to. It is what makes signing
 * out mean something: without it a token answered to nothing once issued and
 * stayed good until it expired, however many times somebody signed out.
 *
 * It is optional only so a token can still be minted where there is no session
 * to name - which, after the session work, is nowhere, but a signature that
 * silently produced an unusable token would be worse than one that did not
 * compile.
 */
function jwtIssue(int $userId, string $username, string $email, string $role, ?string $sessionId = null): string
{
    $header  = _jwtBase64UrlEncode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
    $payload = _jwtBase64UrlEncode(json_encode([
        'sub'      => $userId,
        'username' => $username,
        'email'    => $email,
        'role'     => $role,
        'sid'      => $sessionId,
        'iat'      => time(),
        'exp'      => time() + 172800, // 48 hours
    ]));
    $signature = _jwtBase64UrlEncode(hash_hmac('sha256', "$header.$payload", getJwtSecret(), true));

    return "$header.$payload.$signature";
}

/**
 * Verifies a JWT signature and expiry.
 * Returns the decoded payload array on success, null on any failure.
 */
function jwtVerify(string $token): ?array
{
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return null;
    }

    [$header, $payload, $sig] = $parts;

    $expected = _jwtBase64UrlEncode(hash_hmac('sha256', "$header.$payload", getJwtSecret(), true));
    if (!hash_equals($expected, $sig)) {
        return null;
    }

    $data = json_decode(_jwtBase64UrlDecode($payload), true);
    if (!is_array($data)) {
        return null;
    }

    if (isset($data['exp']) && $data['exp'] < time()) {
        return null;
    }

    return $data;
}
