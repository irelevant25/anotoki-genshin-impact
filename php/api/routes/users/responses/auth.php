<?php

/**
 * What /api/auth answers with.
 *
 * Hand-built objects rather than rows, and deliberately so: `password` never
 * leaves the server, for anybody, so none of these has one.
 */

/** An account as the auth endpoints describe it. Never carries the password. */
class AuthUser extends ResponseShape
{
    public function __construct(
        public readonly string $username,
        public readonly string $email,
        public readonly string $role,
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
        public readonly bool $email_confirmed,
        public readonly ?string $version,
        public readonly string $created_at,
        /** Whether there is a password on the account at all. */
        public readonly bool $has_password,
        /**
         * Whether it is still accepted. Distinct from having one: an account
         * can keep its password and ask for it not to be a way in.
         */
        public readonly bool $password_login_enabled,
        public readonly bool $google_connected,
        /** The Google address that is connected, for the account page to show. */
        public readonly ?string $google_email,
        /** Whether a code from an authenticator app is required to sign in. */
        public readonly bool $totp_enabled,
        /** Unused recovery codes left. Zero when two-factor is off. */
        public readonly int $recovery_codes_remaining,
        /** Browsers that will not be asked for a code again. */
        public readonly int $trusted_devices,
    ) {
    }
}

/** What a successful register or login hands back. */
class AuthSession extends ResponseShape
{
    public function __construct(
        /** The bearer token. Every later request carries it. */
        public readonly string $token,
        /** @var AuthUser */
        public readonly object $user,
        /**
         * A secret for the browser to keep, when it asked to be remembered.
         *
         * Present only where there was something to remember: an account with
         * two-factor on, signing in with `remember_device`. Sent back on later
         * sign-ins to skip the six digits - and nothing else, since the
         * password still has to be right. Null every other time.
         */
        public readonly ?string $device_token,
    ) {
    }
}

/** Echoed back so the caller can confirm what was stored. */
class ThemeChanged extends ResponseShape
{
    public function __construct(
        /** `main` or `admin`. */
        public readonly string $area,
        public readonly string $theme,
    ) {
    }
}

class LanguageChanged extends ResponseShape
{
    public function __construct(public readonly string $language)
    {
    }
}

/**
 * What registration hands back: no session, because there is not one yet.
 *
 * The account exists and cannot be used until the address on it is confirmed,
 * so the only useful things to say are which address the message went to and
 * whether it actually went. `sent` false is not an error - the account is made
 * either way - but it lets the page offer to try again instead of telling
 * somebody to go and look for a message that was never posted.
 */
class AuthPending extends ResponseShape
{
    public function __construct(
        public readonly string $email,
        public readonly bool $sent,
    ) {
    }
}

/**
 * The answer from the two endpoints that take an address and may send to it.
 *
 * Always the same, and says nothing about what was found. Whether there is an
 * account behind an address, whether it still needs confirming, whether it has
 * a password to reset - none of that is anything an endpoint open to the whole
 * internet should be willing to tell apart.
 */
class AuthMailRequested extends ResponseShape
{
    public function __construct(public readonly bool $requested)
    {
    }
}

/**
 * Which ways in this deployment offers, asked before anybody has signed in.
 *
 * The client id is public by design - it travels in the page and identifies
 * the site to Google - so there is nothing here that the rendered button would
 * not give away anyway. Null, and `google_enabled` false, while no client id
 * is configured, which is how the site ships.
 */
class AuthProviders extends ResponseShape
{
    public function __construct(
        public readonly bool $google_enabled,
        public readonly ?string $google_client_id,
    ) {
    }
}

/**
 * A freshly issued two-factor secret, on its way to an authenticator app.
 *
 * Both forms of the same thing: the URI is what a QR code encodes, and the
 * secret is what somebody types when there is no camera to hand. Nothing is
 * required of the account until a code computed from it has been handed back.
 */
class TotpSetup extends ResponseShape
{
    public function __construct(
        /** Base32, as an authenticator expects it typed. */
        public readonly string $secret,
        /** The otpauth:// URI a QR code carries. */
        public readonly string $uri,
    ) {
    }
}

/**
 * The way back in when the phone is gone.
 *
 * Returned exactly once, when they are generated, because only their hashes
 * are kept. There is no endpoint that can show them again - asking for another
 * set replaces them.
 */
class TotpRecoveryCodes extends ResponseShape
{
    public function __construct(
        /** @var string[] */
        public readonly array $recovery_codes,
    ) {
    }
}

/**
 * One session: where the account was signed in, how, and whether it still is.
 *
 * `ip` and `user_agent` are what the request carried, unexamined. They are
 * shown so a person can recognise their own devices, not relied on for
 * anything - a user agent is a string the caller chooses.
 */
class SessionEntry extends ResponseShape
{
    public function __construct(
        public readonly int $id,
        /** password, login_code, google, or email_link. */
        public readonly string $method,
        public readonly ?string $ip,
        /**
         * The caller's hardware address, and null nearly always.
         *
         * Only knowable when the caller shares a network with the server, and
         * so is still in its neighbour table - a MAC address does not survive
         * a router. See requestMac().
         */
        public readonly ?string $mac,
        public readonly ?string $user_agent,
        public readonly string $created_at,
        public readonly ?string $last_seen_at,
        public readonly string $expires_at,
        public readonly ?string $revoked_at,
        /** Why it ended, where anything but its own expiry ended it. */
        public readonly ?string $revoked_reason,
        /** Neither revoked nor expired - worked out here, against our own clock. */
        public readonly bool $active,
        /** The session asking. The page will not offer to end this one by surprise. */
        public readonly bool $current,
    ) {
    }
}

/**
 * Every session this account has had, and how many attempts have failed since
 * it last succeeded.
 *
 * The count is deliberately "since the last good sign-in" rather than a
 * lifetime total: a number that only grows says nothing, and the question
 * worth answering is whether somebody has been trying lately.
 */
class SessionList extends ResponseShape
{
    public function __construct(
        /** @var SessionEntry[] */
        public readonly array $sessions,
        public readonly int $failed_since_last_login,
    ) {
    }
}

/** How many sessions "sign out everywhere else" actually ended. */
class SessionsEnded extends ResponseShape
{
    public function __construct(public readonly int $ended)
    {
    }
}
