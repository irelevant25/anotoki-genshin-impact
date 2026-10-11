<?php

/**
 * What /api/me answers with: the signed-in reader as this site knows them.
 *
 * Their account - password, two-factor, Google, sessions - is the IAM's and
 * is managed on the IAM's own account page, and so are the theme, the dates,
 * the clock and the language they read every anotoki site in (the IAM's
 * tokens carry them to the pages). What is here is this site's: the name to
 * show and the role the token grants here.
 */

class SiteUser extends ResponseShape
{
    public function __construct(
        /** The IAM user id, which this site keys everything of theirs on. */
        public readonly int $id,
        public readonly string $username,
        /** The address their token carries - this site keeps no copy of it. */
        public readonly ?string $email,
        /** The highest of this site's roles the token grants: ADMIN, EDITOR or USER. */
        public readonly string $role,
        /** @var string[] Every role the token grants here. */
        public readonly array $roles,
        public readonly ?string $background,
        public readonly ?string $version,
        /** When they first arrived on this site: ISO 8601 in UTC. */
        public readonly ?string $created_at,
    ) {
    }
}
