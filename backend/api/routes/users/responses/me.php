<?php

/**
 * What /api/me answers with: the signed-in reader as this site knows them.
 *
 * Their account - password, two-factor, Google, sessions - is the IAM's and
 * is managed on the IAM's own account page. What is here is this site's: the
 * name to show, the role the token grants here, and the preferences for
 * reading this site.
 */

class SiteUser extends ResponseShape
{
    public function __construct(
        /** The IAM user id, which this site keys everything of theirs on. */
        public readonly int $id,
        public readonly string $username,
        public readonly ?string $email,
        /** The highest of this site's roles the token grants: ADMIN, EDITOR or USER. */
        public readonly string $role,
        /** @var string[] Every role the token grants here. */
        public readonly array $roles,
        public readonly ?string $background,
        /** The site's own light/dark choice. */
        public readonly string $theme_main,
        /** The admin panel's, remembered separately. */
        public readonly string $theme_admin,
        public readonly string $language,
        /**
         * How this reader wants dates written, or null for "as this device
         * does". One of dmy_dot, dmy_slash, mdy_slash, ymd_dash.
         */
        public readonly ?string $date_format,
        /** '24', '12', or null for whatever the device says. */
        public readonly ?string $time_format,
        public readonly ?string $version,
        /** When they first arrived on this site. */
        public readonly ?string $created_at,
    ) {
    }
}

class ThemeChanged extends ResponseShape
{
    public function __construct(
        /** 'main' or 'admin'. */
        public readonly string $area,
        /** 'light', 'dark' or 'auto'. */
        public readonly string $theme,
    ) {
    }
}

class LanguageChanged extends ResponseShape
{
    public function __construct(
        public readonly string $language,
    ) {
    }
}
