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
        public readonly string $namecard_icon,
        public readonly string $namecard_background,
        public readonly string $namecard_banner,
        public readonly string $card_icon,
        public readonly string $wish_icon,
        public readonly string $ingame_icon,
        public readonly string $icon,
        public readonly string $version,
        public readonly string $voice_actor_english,
        public readonly string $voice_actor_japanese,
        public readonly string $voice_actor_korean,
        public readonly string $voice_actor_chinese,
        public readonly bool $is_traveler = false,
        public readonly array|string|null $how_to_obtain = null,
        public readonly ?array $affiliations = null,
        public readonly ?string $card_icon_2 = null,
        public readonly ?string $ingame_icon_name = null,
        public readonly ?string $ingame_icon_2_name = null,
        public readonly ?string $ingame_icon_2 = null,
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
