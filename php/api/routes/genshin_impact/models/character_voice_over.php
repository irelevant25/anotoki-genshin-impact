<?php

class CharacterVoiceOver extends DbModel
{
    public function __construct(
        /** The set this line belongs to; characters reach their lines through it. */
        public readonly int $voice_over_set_id,
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
        public readonly ?string $text_japanese_reading = null,
        public readonly ?string $text_chinese_reading = null,
        public readonly ?string $text_korean_reading = null,
        public readonly ?int $audio_english_file_id = null,
        public readonly ?int $audio_japanese_file_id = null,
        public readonly ?int $audio_chinese_file_id = null,
        public readonly ?int $audio_korean_file_id = null,
    ) {
    }
}
