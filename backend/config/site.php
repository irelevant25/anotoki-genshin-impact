<?php

// ---------------------------------------------------------------------------
// config/site.php — which site this deployment is
// ---------------------------------------------------------------------------
// The site settings and the page switches are kept per site, in a `site`
// column (site_settings, site_routes): a request reads the rows marked with
// this code. (The translation keys were scoped the same way until users/050:
// every key is this site's now, and the words are the anotoki library's
// business - api/translations.php.)
//
// It is this codebase's identity rather than anything about where it runs,
// which is why it is the one thing in config/ with a default.
//
// To override per deployment, create config/site.local.php returning the code:
//   <?php return 'star_rail';
// site.local.php is gitignored, like the other .local.php files.
// ---------------------------------------------------------------------------

function currentSite(): string
{
    static $site = null;

    if ($site === null) {
        $localFile = __DIR__ . '/site.local.php';
        $site = file_exists($localFile) ? (string) require $localFile : 'genshin_impact';
    }

    return $site;
}
