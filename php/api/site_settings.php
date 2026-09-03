<?php

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
              ORDER BY sort_order ASC, name ASC'
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
// The three questions the rest of the API asks
// ---------------------------------------------------------------------------

/** Whether the site is closed to everybody but its admins. */
function maintenanceModeOn(): bool
{
    return siteSettingBool('maintenance_mode', false);
}

/**
 * Whether anybody may start a session right now.
 *
 * This covers every way in rather than the password form alone. A switch that
 * only stopped `POST /api/auth/login` would leave the login code, the Google
 * button, a confirmation link and a password reset all still signing people
 * in - four doors left open beside the locked one.
 */
function loginEnabled(): bool
{
    return siteSettingBool('login_enabled', true);
}

/** Whether the Google button is offered and its token accepted. */
function googleLoginEnabled(): bool
{
    return siteSettingBool('google_login_enabled', true);
}

/**
 * Why this account may not sign in, or null when it may.
 *
 * Called from every path that mints a session, which is what makes "login is
 * off" mean what it says. Admins are exempt from both switches on purpose:
 * whoever turned the site off has to be able to get back in and turn it on,
 * and an admin locked out by their own maintenance mode has no way back that
 * does not involve the database.
 */
function signInRefusal(?array $user): ?array
{
    if (isAdminUser($user)) {
        return null;
    }

    if (maintenanceModeOn()) {
        return ['error' => 'The site is closed for maintenance', 'code' => 'maintenance'];
    }

    if (!loginEnabled()) {
        return ['error' => 'Signing in is switched off at the moment', 'code' => 'login_disabled'];
    }

    return null;
}

/**
 * What the site itself is told, before anybody has signed in.
 *
 * Open by necessity: the page has to know whether to draw a maintenance notice
 * instead of itself, and it has to know before it can ask who is reading it.
 * Nothing here is a secret - it is the shape of the site as any visitor is
 * about to see it.
 */
function publicSiteSettings(): array
{
    $announcementOn = siteSettingBool('announcement_enabled', false);
    $announcement = siteSettingArray('announcement_message');

    return [
        'maintenance' => maintenanceModeOn(),
        'maintenance_message' => siteSettingArray('maintenance_message'),
        'login_enabled' => loginEnabled(),
        'google_login_enabled' => googleLoginEnabled(),
        // Null rather than a disabled announcement: the banner either has
        // something to say or is not there, and the front end should not have
        // to hold a message it must not draw.
        'announcement' => $announcementOn && $announcement !== [] ? [
            'level' => (string) siteSettingValue('announcement_level', 'info'),
            'message' => $announcement,
        ] : null,
        'disabled_routes' => array_values(array_filter(
            siteSettingArray('disabled_routes'),
            static fn($section): bool => is_string($section),
        )),
    ];
}
