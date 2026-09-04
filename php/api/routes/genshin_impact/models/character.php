<?php

class Character extends DbModel
{
    public function __construct(
        public readonly string $name,
        public readonly string $element,
        public readonly string $weapon_type,
        public readonly int $rarity,
        public readonly string $model,
        public readonly string $namecard_description,
        public readonly string $version,
        public readonly string $voice_actor_english,
        public readonly string $voice_actor_japanese,
        public readonly string $voice_actor_korean,
        public readonly string $voice_actor_chinese,
        public readonly bool $is_traveler = false,
        public readonly array|string|null $how_to_obtain = null,
        public readonly ?array $affiliations = null,
        public readonly ?int $namecard_icon_file_id = null,
        public readonly ?int $namecard_background_file_id = null,
        public readonly ?int $namecard_banner_file_id = null,
        public readonly ?int $card_icon_file_id = null,
        public readonly ?int $wish_icon_file_id = null,
        public readonly ?int $ingame_icon_file_id = null,
        public readonly ?int $icon_file_id = null,
        public readonly ?int $card_icon_2_file_id = null,
        public readonly ?int $ingame_icon_2_file_id = null,
        public readonly ?string $title = null,
        public readonly ?string $secondary_title = null,
        public readonly ?string $region = null,
        public readonly ?string $birthday = null,
        public readonly ?int $special_dish = null,
        public readonly ?array $namecard_sources = null,
        public readonly ?string $release_date = null,
        public readonly ?string $introduced = null,
        public readonly ?string $demo_music = null,
    ) {
    }

    protected static function jsonFields(): array
    {
        return ['affiliations', 'how_to_obtain', 'namecard_sources'];
    }
}
