<?php

class Enemy extends DbModel
{
    public function __construct(
        public readonly string  $name,
        public readonly string  $damage_type,
        public readonly string  $living_being_type,
        public readonly string  $living_being_family,
        public readonly ?string $other_elements         = null,
        public readonly ?bool   $has_weakpoint          = null,
        public readonly ?string $living_being_group     = null,
        public readonly ?string $interactive_map_link   = null,
        public readonly ?array  $abilities              = null,
        public readonly ?string $description            = null,
    ) {}

    protected static function jsonFields(): array
    {
        return ['abilities'];
    }
}
