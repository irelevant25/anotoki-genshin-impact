<?php

// ---------------------------------------------------------------------------
// config/site.php — which site this deployment is
// ---------------------------------------------------------------------------
// Translations are shared across the whole family of sites, scoped by a `site`
// column: a request gets the keys marked 'common' plus the keys marked with
// this code. Without knowing which site it is, the API would have to serve
// every site's strings to everybody.
//
// The code matches the database alias in config/database.php and a row in the
// `sites` table, so there is one spelling of "which site" everywhere.
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
