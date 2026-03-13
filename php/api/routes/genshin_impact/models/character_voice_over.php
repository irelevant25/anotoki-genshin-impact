<?php

class CharacterVoiceOver extends DbModel
{
    public function __construct(
        public readonly int     $character_id,
        public readonly ?int    $character_id_2 = null,
        public readonly ?int    $character_id_3 = null,
        public readonly ?int    $character_id_4 = null,
        public readonly ?int    $character_id_5 = null,
        public readonly ?int    $character_id_6 = null,
        public readonly ?int    $character_id_7 = null,
        public readonly ?int    $order          = null,
        public readonly ?string $type           = null,
        public readonly ?string $language       = null,
        public readonly ?string $title          = null,
        public readonly ?string $text           = null,
        public readonly ?string $reading        = null,
    ) {}
}
