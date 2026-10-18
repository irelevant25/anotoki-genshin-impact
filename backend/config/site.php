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
// site.local.php is gitignored, like the other .local.php files, and read
// cleanly or not at all (config/local.php): one that cannot be read cleanly,
// or names no site, leaves the site not set up (localConfigProblems()) -
// never genshin_impact's switches read in another site's database, which
// would find none of them (no maintenance, no page locked).
// ---------------------------------------------------------------------------

require_once __DIR__ . '/local.php';

function currentSite(): string
{
    static $site = null;

    if ($site === null) {
        if (!is_file(localConfigPath('site'))) {
            $site = 'genshin_impact';
        } else {
            $named = localConfig('site');
            if (localConfigError('site') !== null || !is_string($named) || trim($named) === '') {
                // The SiteGate answers not_set_up before any route asks (localConfigProblems()); a command-line
                // script that asks meets this.
                notSetUp('site.local.php', 'which site this is');
            }
            $site = trim($named);
        }
    }

    return $site;
}
