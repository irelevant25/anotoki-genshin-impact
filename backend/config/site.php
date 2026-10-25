<?php

// ---------------------------------------------------------------------------
// config/site.php — which site this deployment is
// ---------------------------------------------------------------------------
// The generated API document names the site by this code (generate-api-spec.php).
// Nothing in the database is scoped by it any more: the translation keys were
// until users/050, and the site settings and the page switches (site_settings,
// site_routes, a `site` column each) until users/066 moved genshin's rows into
// the anotoki library's tables, which hold one site's switches - every
// anotoki site has a database of its own.
//
// It is this codebase's identity rather than anything about where it runs,
// which is why it is the one thing in config/ with a default.
//
// To override per deployment, create config/site.local.php returning the code:
//   <?php return 'star_rail';
// site.local.php is gitignored, like the other .local.php files, and read
// cleanly or not at all (config/local.php): one that cannot be read cleanly,
// or names no site, leaves the site not set up (localConfigProblems()) -
// never a site guessed.
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
