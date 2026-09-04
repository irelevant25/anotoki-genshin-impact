<?php

class CharacterTalent extends DbModel
{
    public function __construct(
        public readonly int $character_id,
        public readonly int $order,
        public readonly string $name,
        public readonly string $type,
        public readonly ?int $icon_file_id = null,
        public readonly ?string $description = null,
    ) {
    }
}
