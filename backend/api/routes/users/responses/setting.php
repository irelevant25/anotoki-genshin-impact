<?php

/**
 * What /api/settings/public answers with: the site describing itself to a
 * visitor who has not signed in and may never - asked for before anything
 * else, because where its sign-in lives decides how the page starts.
 *
 * The switches an admin throws without a deploy (maintenance, the
 * announcement, the pages) are the anotoki library's site settings since
 * 0.11.0, told at GET /api/site-settings in the library's own shape.
 */

/**
 * The shape of the site, before anybody has signed in.
 *
 * Open on purpose. A page cannot ask who is reading it before it knows where
 * reading is signed in. Nothing here is a secret: it is what any visitor's
 * sign-in button is about to use anyway.
 */
class PublicSiteSettings extends ResponseShape
{
    public function __construct(
        /** @var SiteAuthConfig Where the site's sign-in lives. */
        public readonly object $auth,
        /** @var PublicVisitorSettings Playing without signing in: whether it can, and for how long a browser's games are kept. */
        public readonly object $visitors,
    ) {}
}

/**
 * Playing without signing in (api/visitors.php), as the page needs to know it.
 *
 * Whether it is welcome at all is `auth.login_required` - the IAM's switch;
 * this says only whether the server can keep a visitor's games yet, and for
 * how long, so the notice on the page never disagrees with the sweep.
 */
class PublicVisitorSettings extends ResponseShape
{
    public function __construct(
        /**
         * Whether the server keeps a visitor's games and statistics: false
         * until the database update that makes visitors (users/045) is
         * applied - the browser keeps them then, as it always did.
         */
        public readonly bool $available,
        /** Days a visitor's games are kept after their last visit (config/visitors.php's keep_days). */
        public readonly int $keep_days,
    ) {}
}

/**
 * Where the site's sign-in lives: the anotoki IAM, and this site's name there.
 *
 * Public by design - every token the IAM signs names both - and served from
 * here rather than baked into the build, so moving the IAM is a config change
 * on the server and not a rebuild of the frontend.
 */
class SiteAuthConfig extends ResponseShape
{
    public function __construct(
        /** The IAM's address, the OIDC issuer: https://iam.anotoki.eu */
        public readonly string $issuer,
        /** This site's client id at the IAM. */
        public readonly string $client_id,
        /** The IAM's page for managing one's own account. */
        public readonly string $account_url,
        /** The IAM's admin console - accounts, roles, sessions. */
        public readonly string $admin_url,
        /**
         * Whether the IAM requires everybody to sign in before using this site.
         * Read from the IAM by the server, fresh within a minute; while it is
         * true the API answers 401 sign_in_required to anybody not signed in.
         */
        public readonly bool $login_required,
        /**
         * Whether signing in is on offer at all: false once the IAM has said it
         * does not know this site (or switched it off) - then the pages offer
         * no sign-in, and the IAM's sign-in hint sends nobody there
         * (the anotoki library's AuthRoutes::configBody()).
         */
        public readonly bool $sign_in_available,
    ) {}
}
