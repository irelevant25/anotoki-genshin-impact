<?php

// ---------------------------------------------------------------------------
// config/app.php - this site's own public address
// ---------------------------------------------------------------------------
// The address robots.txt names the sitemap at and every address of
// sitemap.xml begins with (the anotoki library's Robots, api/robots.php):
// this installation's own, scheme and host - https://genshin.anotoki.eu on the
// host, http://localhost:4200 in development (ng serve, which hands both
// files to the PHP server). Never an address read off a request: a Host header
// is anybody's to write, and a sitemap served under somebody else's name
// would send search engines there.
//
// It lives in the OPTIONAL config/app.local.php - gitignored like every
// *.local.php - under the key the setup page wrote it with from 2026-09-29
// to 2026-10-05 (it named this site's address for the CORS allowlist the API
// no longer has; an old file's cors_origins are not read):
//
//   <?php return ['url' => 'https://genshin.anotoki.eu'];
//
// setup.php does not write it: the address it works out is read off the
// request, believed for its IAM test and a sentence only, never for anything
// written (setupSiteAddress()). So on a host installed since, it is put there
// by hand (FTP), as visitors.local.php and cloudflare.local.php are.
//
// Without it - or with one that cannot be read cleanly (config/local.php: said
// once in the PHP log, nothing in it read), or one whose url is no http(s)
// origin - the site keeps running and is no less set up: robots.txt names no
// sitemap, and GET /sitemap.xml answers 404 `not_configured`, which the error
// log keeps (it is a setting to mend, not a state the owner chose).
// ---------------------------------------------------------------------------

require_once __DIR__ . '/local.php';

/**
 * This site's public address - its origin, `scheme://host[:port]` - or null
 * while config/app.local.php names none.
 */
function siteAddress(): ?string
{
    $local = localConfig('app');

    return is_array($local) ? localConfigOrigin($local['url'] ?? null) : null;
}
