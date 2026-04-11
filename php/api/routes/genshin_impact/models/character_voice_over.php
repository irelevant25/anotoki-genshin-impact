<?php

class CharacterVoiceOver extends DbModel
{
    public function __construct(
        public readonly int $character_id,
        public readonly int $order,
        public readonly string $type,
        public readonly string $title_english,
        public readonly ?string $text_english = null,
        public readonly ?string $title_japanese = null,
        public readonly ?string $title_chinese = null,
        public readonly ?string $title_chinese_traditional = null,
        public readonly ?string $title_korean = null,
        public readonly ?string $text_japanese = null,
        public readonly ?string $text_chinese = null,
        public readonly ?string $text_chinese_traditional = null,
        public readonly ?string $text_korean = null,
        public readonly ?int $character_id_2 = null,
        public readonly ?int $character_id_3 = null,
        public readonly ?int $character_id_4 = null,
        public readonly ?int $character_id_5 = null,
        public readonly ?int $character_id_6 = null,
        public readonly ?int $character_id_7 = null,
        public readonly ?string $text_japanese_reading = null,
        public readonly ?string $text_chinese_reading = null,
        public readonly ?string $text_korean_reading = null,
        public readonly ?string $audio_english = null,
        public readonly ?string $audio_japanese = null,
        public readonly ?string $audio_chinese = null,
        public readonly ?string $audio_korean = null,
    ) {
    }
}
