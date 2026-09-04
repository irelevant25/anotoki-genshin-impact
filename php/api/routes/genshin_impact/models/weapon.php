<?php

class Weapon extends DbModel
{
    public function __construct(
        public readonly string $name,
        public readonly string $type,
        public readonly int $rarity,
        public readonly ?int $icon_file_id = null,
        public readonly ?int $icon_2_file_id = null,
        public readonly ?int $icon_ascension_file_id = null,
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
