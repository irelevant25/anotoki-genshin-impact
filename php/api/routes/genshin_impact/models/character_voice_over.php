<?php

class CharacterVoiceOver extends DbModel
{
    public function __construct(
        public readonly int     $character_id,
        public readonly int     $order,
        public readonly string  $type,
        public readonly string  $language,
        public readonly string  $title,
        public readonly string  $text,
        public readonly bool    $is_alternative  = false,
        public readonly ?int    $character_id_2  = null,
        public readonly ?int    $character_id_3  = null,
        public readonly ?int    $character_id_4  = null,
        public readonly ?int    $character_id_5  = null,
        public readonly ?int    $character_id_6  = null,
        public readonly ?int    $character_id_7  = null,
        public readonly ?string $title_reading   = null,
        public readonly ?string $text_reading    = null,
    ) {}
}
