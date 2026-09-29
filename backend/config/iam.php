<?php

// ---------------------------------------------------------------------------
// config/iam.php - which IAM signs people in, and who this site is to it
// ---------------------------------------------------------------------------
// Signing in happens at the anotoki IAM (iam.anotoki.eu), not here. The site's
// frontend sends people there and comes back with tokens; this API checks the
// access token on each request against the IAM's published keys and never
// sees a password. See the IAM repository's docs/integrating-an-app.md.
//
// Both values come from config/iam.local.php, which setup.php writes:
//
//   issuer      the IAM's address, exactly as it signs tokens (`iss`):
//               http://localhost:4300 in development (the IAM's own dev
//               server), https://iam.anotoki.eu once deployed
//   client_id   this site's name there - `genshin`; a Star Rail deployment of
//               the same code would be registered and named separately
//
// Optional there: cache_dir (where the IAM's key set is cached between
// requests, storage/cache by default) and the SDK's own keys - see
// api/anotoki_iam.php. There is no committed default for either value: a site
// that silently signed people in at somebody's localhost would be worse than
// one that says it is not set up.
// ---------------------------------------------------------------------------

require_once __DIR__ . '/local.php';

function iamClientConfig(): array
{
    static $config = null;

    if ($config !== null) {
        return $config;
    }

    $local = localConfig('iam');
    $issuer = is_array($local) ? localConfigOrigin($local['issuer'] ?? null) : null;
    $clientId = is_array($local) ? trim((string) ($local['client_id'] ?? '')) : '';

    if ($issuer === null || $clientId === '') {
        notSetUp('iam.local.php', 'the IAM\'s address and this site\'s client id');
    }

    return $config = array_replace(
        ['cache_dir' => dirname(__DIR__) . '/storage/cache'],
        $local,
        ['issuer' => $issuer, 'client_id' => $clientId],
    );
}
