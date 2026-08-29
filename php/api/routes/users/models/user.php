<?php

class User extends DbModel
{
    public function __construct(
        public readonly string  $username,
        public readonly string  $email,
        public readonly string  $password,
        public readonly ?string $role       = null,
        public readonly ?string $background = null,
        public readonly ?string $theme_main  = null,
        public readonly ?string $theme_admin = null,
        public readonly ?string $version    = null,
    ) {}
}
