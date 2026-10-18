<?php

use Anotoki\Lib\Auth\Http\AuthRoutes;

/**
 * The switches an admin can throw without a deploy.
 *
 * Everything here is one row of `site_settings`: a name, a declared type, and
 * a value as text. The alternative was a column per switch, which turns every
 * new one into a migration, an ALTER, a model change and a form field. A row
 * per switch turns it into a row and two translation keys.
 *
 * The type is what makes a text column safe to read back: 'boolean' is 'true'
 * or 'false', 'i18n' is a JSON object keyed by language code, 'routes' is a
 * JSON array of section names, and 'choice' is one of the values in `options`.
 * Nothing here trusts the column - a value that will not parse falls back to
 * the default the caller asked for, because a settings table that has been
 * hand-edited into nonsense should not take the site down with it.
 *
 * Read once per request and cached. Several of these are consulted on every
 * request that goes near the maintenance gate, and a settings table is not
 * something to re-read four times to answer the same question.
 */

/** The value shapes a setting can have. The admin form has a control per type. */
const SETTING_TYPES = ['boolean', 'text', 'i18n', 'choice', 'routes'];

/**
 * Every setting for this site, keyed by name. Empty if the table is not there yet.
 *
 * `$reload` is for the one request that has just written to the table and now
 * has to answer with what it wrote.
 */
function siteSettingsAll(bool $reload = false): array
{
    static $settings = null;

    if ($reload) {
        $settings = null;
    }

    if ($settings !== null) {
        return $settings;
    }

    try {
        $statement = usersDb()->prepare(
            'SELECT name, group_name, type, options, value, sort_order, updated_at, updated_by
               FROM site_settings
              WHERE site = ?
              ORDER BY sort_order ASC, name ASC',
        );
        $statement->execute([currentSite()]);

        $settings = [];
        foreach ($statement->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $settings[$row['name']] = $row;
        }
    } catch (\PDOException) {
        // Before migration 034 has run there is no table, and every caller
        // below then gets the default it asked for. The site works; nothing is
        // switched off. That is the right way round for a settings table: its
        // absence should mean "no overrides", not "everything is off".
        $settings = [];
    }

    return $settings;
}

/** Drops the cache, for the one request that has just written to the table. */
function siteSettingsForget(): void
{
    siteSettingsAll(true);
}

/** The raw text of one setting, or the default when it has no row. */
function siteSettingValue(string $name, ?string $default = null): ?string
{
    $settings = siteSettingsAll();

    return array_key_exists($name, $settings) ? $settings[$name]['value'] : $default;
}

/** One boolean setting. Anything that is not the word 'true' is false. */
function siteSettingBool(string $name, bool $default = false): bool
{
    $value = siteSettingValue($name);

    if ($value === null || $value === '') {
        return $default;
    }

    return strtolower(trim($value)) === 'true';
}

/** One JSON setting - an i18n map or a list - as an array, never null. */
function siteSettingArray(string $name): array
{
    $decoded = json_decode((string) siteSettingValue($name, '[]'), true);

    return is_array($decoded) ? $decoded : [];
}

// ---------------------------------------------------------------------------
// The questions the rest of the API asks
// ---------------------------------------------------------------------------
//
// Whether anybody may sign in, and whether Google is offered, used to be
// switches here too. Signing in is the IAM's now, and so are those switches -
// they are in its admin console, for every site at once. So is the one below
// that is not in this table: whether this site may be used without signing in.

/** Whether the site is closed to everybody but its admins. */
function maintenanceModeOn(): bool
{
    return siteSettingBool('maintenance_mode', false);
}

/**
 * Whether the IAM says everybody must sign in before using this site.
 *
 * The IAM's switch, on this site's page in its admin console ("Sign-in
 * required"): read by the anotoki library's SignInRule (siteSignInRule(),
 * api/admin_tools.php) from the IAM's public answer about the application,
 * kept for a minute in the cache folder (config/iam.php's cache_dir, beside
 * the key set - a folder only this site writes, since the kept answer is what
 * opens the site to people who have not signed in), and true whenever nothing
 * better is known: an IAM that does not know `genshin` or has switched it off
 * answers 404, which means required; an IAM out of reach leaves the last
 * answer standing, or required when there never was one. One answer for the
 * whole request (the library's Identify asks it afresh for each), so the gate
 * and the public settings agree.
 *
 * Off is what this site has always been - a reference work anyone can read -
 * and the IAM's default for it. Only somebody who has not signed in is ever
 * affected, so the gate asks only for them.
 */
function signInRequired(): bool
{
    $rule = siteSignInRule();
    $required = $rule->required();

    // An answer from the IAM, or the last one kept, is routine; these are not -
    // an IAM that does not know this site, or one that could not be asked.
    if (in_array($rule->reason(), ['unknown_application', 'stale', 'never_read', 'not_configured'], true)) {
        error_log('[iam] sign-in required: ' . ($required ? 'yes' : 'no') . ' (' . $rule->reason() . ')');
    }

    return $required;
}

/**
 * What the site itself is told, before anybody has signed in.
 *
 * Open by necessity: the page has to know whether to draw a maintenance notice
 * instead of itself, and it has to know before it can ask who is reading it.
 * Nothing here is a secret - it is the shape of the site as any visitor is
 * about to see it, and where its sign-in lives: the IAM's address and this
 * site's client id are exactly what the frontend's sign-in button needs, and
 * both are public by design (every token names them).
 */
function publicSiteSettings(): array
{
    $announcementOn = siteSettingBool('announcement_enabled', false);
    $announcement = siteSettingArray('announcement_message');
    $iam = siteIam();
    // Asked here first for its log line (an IAM that does not know this site,
    // or could not be asked); the answer below is the same, kept for the request.
    signInRequired();

    return [
        'maintenance' => maintenanceModeOn(),
        'maintenance_message' => siteSettingArray('maintenance_message'),
        // What the pages need to sign in, the anotoki library's boot
        // configuration (AuthRoutes::configBody()): the IAM, this site's id
        // there, the IAM's switch relayed - the page learns it here, from its
        // own server, and never asks the IAM itself - and sign_in_available,
        // false once the IAM has said it does not know this site (then no
        // sign-in is offered, and the sign-in hint sends nobody to the IAM).
        // Beside them this site's two links into the IAM.
        'auth' => AuthRoutes::configBody(siteSignInRule(), $iam) + [
            'account_url' => $iam->accountUrl(),
            'admin_url' => $iam->issuer . '/admin',
        ],
        // Null rather than a disabled announcement: the banner either has
        // something to say or is not there, and the front end should not have
        // to hold a message it must not draw.
        'announcement' =>
            $announcementOn && $announcement !== []
                ? [
                    'level' => (string) siteSettingValue('announcement_level', 'info'),
                    'message' => $announcement,
                ]
                : null,
        // Which pages exist and who they are drawn for. Here rather than in a
        // read of its own because the menu needs it at the same moment as
        // everything else above, and two requests to draw one page is one
        // request too many. See site_routes.php.
        'routes' => publicSiteRoutes(),
        // Playing without signing in (api/visitors.php): whether the server
        // can keep a visitor's games yet - not until users/045 is applied, so
        // an upload before "Apply pending" behaves as before - and for how
        // long, the server's own number, so the page's notice and the sweep
        // agree. Whether visitors are welcome at all is auth.login_required.
        'visitors' => [
            'available' => visitorsReady(),
            'keep_days' => visitorSetting('keep_days'),
        ],
    ];
}
