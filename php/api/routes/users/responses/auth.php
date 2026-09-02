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
        public readonly bool $email_confirmed,
        public readonly ?string $version,
        public readonly string $created_at,
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
