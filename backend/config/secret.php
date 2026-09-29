<?php

// ---------------------------------------------------------------------------
// config/secret.php - the site's own secret
// ---------------------------------------------------------------------------
// Tokens are signed by the IAM now, so this site holds no signing key. What is
// left needing a secret is small - the feedback form keys its per-address
// limit on a hash of the address with this mixed in, so the stored value says
// nothing about who sent it.
//
// It comes from config/secret.local.php, returning a random string of at least
// 32 characters, which setup.php writes (and never overwrites). An installation
// from before the IAM has config/jwt.local.php instead, and that is read in its
// place: it keeps the hashes already made with it valid across the move. There
// is no environment variable and no default - see config/local.php.
// ---------------------------------------------------------------------------

require_once __DIR__ . '/local.php';

function appSecret(): string
{
    static $secret = null;

    if ($secret !== null) {
        return $secret;
    }

    $found = localSecret();

    if ($found === null) {
        notSetUp('secret.local.php', 'the site secret');
    }

    return $secret = $found;
}
