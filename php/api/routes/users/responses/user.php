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
    ) {
    }
}
