<?php

class Food extends DbModel
{
    public function __construct(
        public readonly string $name,
        public readonly ?int $icon_normal_file_id = null,
        public readonly ?int $icon_delicious_file_id = null,
        public readonly ?int $icon_suspicious_file_id = null,
        public readonly ?int $rarity = null,
        public readonly ?int $proficiency = null,
        public readonly ?string $description_normal = null,
        public readonly ?string $description_delicious = null,
        public readonly ?string $description_suspicious = null,
        public readonly ?string $effect = null,
        public readonly ?string $effect_normal = null,
        public readonly ?string $effect_delicious = null,
        public readonly ?string $effect_suspicious = null,
        public readonly ?string $type = null,
        public readonly ?int $base_dish_id = null,
        public readonly ?array $events = null,
        public readonly ?string $region = null,
        public readonly ?array $how_to_obtain = null,
        public readonly ?array $effects = null,
        public readonly ?string $version = null,
    ) {
    }

    protected static function jsonFields(): array
    {
        return ['events', 'how_to_obtain', 'effects'];
    }
}
