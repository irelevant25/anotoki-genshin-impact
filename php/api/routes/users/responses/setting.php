<?php

/**
 * What /api/settings answers with.
 *
 * Two shapes for two audiences. The public one is the site describing itself
 * to a visitor who has not signed in and may never - it is asked for before
 * anything else, because the answer decides whether there is a site to draw.
 * The admin one is the settings table as a table, with a type beside every
 * value so the form knows what control to put there.
 */

/** A message across the top of every page, and how loudly it is saying it. */
class SiteAnnouncement extends ResponseShape
{
    public function __construct(
        /** info, warning or danger - which decides the colour of the bar. */
        public readonly string $level,
        /** @var array<string, string> One message per language code. */
        public readonly array $message,
    ) {
    }
}

/**
 * The shape of the site, before anybody has signed in.
 *
 * Open on purpose. A page cannot ask whether it should draw a maintenance
 * notice instead of itself after it has drawn itself, and it cannot ask who is
 * reading it before it knows whether reading is allowed. Nothing here is a
 * secret: it is what any visitor is about to see anyway.
 */
class PublicSiteSettings extends ResponseShape
{
    public function __construct(
        /** Whether everything but the closed sign is switched off. */
        public readonly bool $maintenance,
        /** @var array<string, string> The closed sign, one message per language. */
        public readonly array $maintenance_message,
        /** Whether anybody who is not an admin may start a session. */
        public readonly bool $login_enabled,
        /** Whether the Google button is drawn and its tokens accepted. */
        public readonly bool $google_login_enabled,
        /** @var SiteAnnouncement|null Null when there is nothing to announce. */
        public readonly ?object $announcement,
        /** @var string[] Sections of the site that are switched off - see the admin form. */
        public readonly array $disabled_routes,
    ) {
    }
}

/**
 * One switch, as the admin form sees it.
 *
 * `type` is what makes the form generic: a new setting is a row in a migration
 * and two translation keys, not a new field on this class and a new control in
 * that template. `value` is text whatever the type says, because that is how
 * the column stores it - the form parses on the way in and the API validates
 * on the way back.
 */
class AdminSiteSetting extends ResponseShape
{
    public function __construct(
        public readonly string $name,
        /** Which panel of the form it belongs under. */
        public readonly string $group_name,
        /** boolean, text, i18n, choice or routes. */
        public readonly string $type,
        /** @var string[] For a 'choice', the values it may take. Empty otherwise. */
        public readonly array $options,
        public readonly ?string $value,
        public readonly ?string $updated_at,
        /** Who threw the switch last, or null if nobody has since it was seeded. */
        public readonly ?string $updated_by,
    ) {
    }
}

/** Every switch, in the order the form draws them. */
class SiteSettingList extends ResponseShape
{
    public function __construct(
        /** @var AdminSiteSetting[] */
        public readonly array $settings,
    ) {
    }
}
