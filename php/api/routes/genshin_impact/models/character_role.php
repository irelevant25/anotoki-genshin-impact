<?php

class CharacterRole extends DbModel
{
    public function __construct(
        public readonly int $character_id,
        public readonly string $role_name,
    ) {
    }
}
