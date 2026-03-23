<?php

class Weapon extends DbModel
{
    public function __construct(
        public readonly string $name,
        public readonly string $type,
        public readonly int $rarity,
        public readonly ?string $icon_name,
        public readonly string $icon,
        public readonly ?string $icon_2_name,
        public readonly ?string $icon_2,
        public readonly ?string $icon_ascension,
        public readonly ?string $primary_stat = null,
        public readonly ?string $secondary_stat = null,
        public readonly ?array $how_to_obtain = null,
        public readonly ?array $effects = null,
        public readonly ?string $release_date = null,
        public readonly ?string $version = null,
        public readonly ?string $description = null,
    ) {
    }

    protected static function jsonFields(): array
    {
        return ['how_to_obtain', 'effects'];
    }
}
