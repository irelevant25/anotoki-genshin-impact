<?php

class CharacterTalent extends DbModel
{
    public function __construct(
        public readonly int $character_id,
        public readonly string $name,
        public readonly string $type,
        public readonly string $icon,
        public readonly ?string $description = null,
    ) {
    }
}
