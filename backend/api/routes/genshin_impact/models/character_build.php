<?php

class CharacterBuild extends DbModel
{
    public function __construct(
        public readonly int $character_id,
        public readonly string $version,
        public readonly string $role,
        public readonly ?string $description,
    ) {
    }
}
