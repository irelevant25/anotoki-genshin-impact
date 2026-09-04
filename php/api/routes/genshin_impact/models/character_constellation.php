<?php

class CharacterConstellation extends DbModel
{
    public function __construct(
        public readonly int $character_id,
        public readonly string $name,
        public readonly int $level,
        public readonly ?int $icon_file_id = null,
        public readonly ?string $description = null,
    ) {
    }
}
