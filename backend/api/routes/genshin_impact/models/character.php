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
        /** The voice-over set this character's lines come from; shared by the Traveler's variants. */
        public readonly ?int $voice_over_set_id = null,
        /** The ascension set this character's ascensions come from; shared by the Traveler's variants. */
        public readonly ?int $ascension_set_id = null,
        /** The talent set this character's talents (and their costs) come from; shared by the Traveler's variants. */
        public readonly ?int $talent_set_id = null,
        /** The constellation set this character's constellations come from; shared by the Traveler's variants. */
        public readonly ?int $constellation_set_id = null,
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
        /** The demo music's title; the file itself is demo_music_file_id, sent back as `demo_music`. */
        public readonly ?string $demo_music_name = null,
        public readonly ?int $demo_music_file_id = null,
        /** A link to the character demo video. */
        public readonly ?string $demo_video = null,
        public readonly ?string $constellation_name = null,
        public readonly ?int $constellation_file_id = null,
        public readonly ?string $namecard_name = null,
        /** Pneuma, Ousia, or Pneuma & Ousia. */
        public readonly ?string $arkhe = null,
        /**
         * The game's own id (genshin_impact/030): one live row each, but every row of one
         * Traveler shares it - Aether 10000005, Lumine 10000007, a row per element.
         */
        public readonly ?int $game_id = null,
    ) {}

    protected static function jsonFields(): array
    {
        return ['affiliations', 'how_to_obtain', 'namecard_sources'];
    }
}
