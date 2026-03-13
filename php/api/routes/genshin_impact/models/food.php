<?php

class Food extends DbModel
{
    public function __construct(
        public readonly string  $name,
        public readonly string  $icon,
        public readonly int     $rarity,
        public readonly int     $proficiency,
        public readonly ?string $description    = null,
        public readonly ?string $effect         = null,
        public readonly ?string $type           = null,
        public readonly ?int    $base_dish_id   = null,
        public readonly ?string $variant        = null,
        public readonly ?string $event          = null,
        public readonly ?string $region         = null,
        public readonly ?array  $how_to_obtain  = null,
        public readonly ?array  $effects        = null,
        public readonly ?string $version        = null,
    ) {}

    protected static function jsonFields(): array
    {
        return ['how_to_obtain', 'effects'];
    }
}
