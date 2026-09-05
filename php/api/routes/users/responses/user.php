<?php

/**
 * What /api/users answers with.
 *
 * Every read here is `SELECT USER_COLUMNS`, which is the users table minus the
 * three columns that must never be published: the password hash, and the reset
 * token with its expiry.
 */

class AdminUser extends ResponseShape
{
    public function __construct(
        public readonly int $id,
        public readonly string $role,
        public readonly string $username,
        public readonly string $email,
        public readonly bool $email_confirmed,
        public readonly ?string $background,
        public readonly string $language,
        public readonly string $theme_main,
        public readonly string $theme_admin,
        /** How this person has their dates written, or null for "as their device does". */
        public readonly ?string $date_format,
        /** '24', '12', or null for the same reason. */
        public readonly ?string $time_format,
        /** Whether signing in demands a code from an authenticator app. */
        public readonly bool $totp_enabled,
        /** Whether the password on the account is still one an admin chose. */
        public readonly bool $force_password_change,
        /**
         * Whether a Google account is attached. Derived rather than stored -
         * it lives in user_identities. See USER_DERIVED.
         */
        public readonly bool $google_connected,
        /** The address Google gave, which is what there is to recognise. */
        public readonly ?string $google_email,
        /** Disabling an account sets this; nothing is destroyed. */
        public readonly bool $deleted,
        public readonly ?string $version,
        public readonly string $created_at,
        public readonly ?string $updated_at,
    ) {
    }
}

class UserFilters extends ResponseShape
{
    public function __construct(
        /** @var string[] */
        public readonly array $roles,
        /** @var array<string, int> */
        public readonly array $byRole,
        public readonly int $disabled,
        public readonly int $total,
        /** How many admins are left, so the UI can explain a refused change. */
        public readonly int $admins,
        public readonly int $passwordMinLength,
        /**
         * @var string[] The language codes somebody actually has.
         *
         * Not every language the site knows: a filter offering choices that
         * match nothing wastes a click to say so.
         */
        public readonly array $languages,
    ) {
    }
}

/**
 * One provider account attached to a site account.
 *
 * The provider's own permanent id for the person - `subject` - is deliberately
 * not here. It identifies them to Google and is what the sign-in path matches
 * on; an admin looking at who is connected has no use for it.
 */
class AdminUserIdentity extends ResponseShape
{
    public function __construct(
        public readonly int $id,
        /** 'google' today. */
        public readonly string $provider,
        /** The address the provider gave, which is what there is to recognise. */
        public readonly ?string $email,
        public readonly string $created_at,
    ) {
    }
}

/**
 * One try at signing in, successful or not.
 *
 * `email` is the address that was typed, which is not always the address on
 * the account: somebody mistyping their own is exactly the kind of thing this
 * table exists to make visible.
 */
class LoginAttemptEntry extends ResponseShape
{
    public function __construct(
        public readonly int $id,
        public readonly string $email,
        public readonly ?string $ip,
        /** password, login_code, google, or email_link. */
        public readonly string $method,
        /** 'ok', or why not: bad_password, unconfirmed, totp_required, ... */
        public readonly string $outcome,
        public readonly string $created_at,
    ) {
    }
}

/**
 * Everything about one account that is spread across five tables.
 *
 * What it deliberately does not carry is as much the point as what it does:
 * no password hash, no TOTP secret, no recovery codes, and no device tokens or
 * their hashes. That two-factor is on is administration; the secret behind it
 * is not, and an endpoint that hands it over turns every admin session into a
 * way of taking somebody's account.
 */
class AdminUserDetail extends ResponseShape
{
    public function __construct(
        /** @var AdminUser */
        public readonly object $account,
        /** @var AdminUserIdentity[] */
        public readonly array $identities,
        /** @var SessionEntry[] Newest first, capped - see sessionsFor(). */
        public readonly array $sessions,
        /** @var LoginAttemptEntry[] Newest first, the last fifty. */
        public readonly array $login_attempts,
        public readonly int $active_sessions,
        public readonly int $trusted_devices,
        /** Zero when two-factor is off, rather than a count of nothing. */
        public readonly int $recovery_codes_remaining,
        public readonly int $failed_since_last_login,
    ) {
    }
}

/**
 * A session in the system-wide history, which is a session plus whose it is.
 *
 * Separate from SessionEntry rather than an extension of it because the two
 * answer different questions. A person reading their own list wants to know
 * which row is the browser they are sitting at; an admin reading every row
 * ever wants to know whose it is, and `current` would be false on all of them.
 */
class AdminSessionEntry extends ResponseShape
{
    public function __construct(
        public readonly int $id,
        public readonly int $user_id,
        public readonly string $username,
        public readonly string $email,
        /** password, login_code, google, or email_link. */
        public readonly string $method,
        public readonly ?string $ip,
        public readonly ?string $user_agent,
        public readonly string $created_at,
        public readonly ?string $last_seen_at,
        public readonly string $expires_at,
        public readonly ?string $revoked_at,
        public readonly ?string $revoked_reason,
        /** Neither revoked nor expired, worked out against the server's clock. */
        public readonly bool $active,
    ) {
    }
}

/** The session history, and what a page of it was drawn from. */
class AdminSessionList extends ResponseShape
{
    public function __construct(
        /** @var AdminSessionEntry[] */
        public readonly array $sessions,
        /** Rows matching the filter, which is more than the page returns. */
        public readonly int $total,
        /** Live sessions across the whole installation, filter or no filter. */
        public readonly int $active,
        /** @var string[] The methods present in the table, for the filter. */
        public readonly array $methods,
    ) {
    }
}
