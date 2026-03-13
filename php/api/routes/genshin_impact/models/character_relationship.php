<?php

class CharacterRelationship extends DbModel
{
    public function __construct(
        public readonly int    $character_id,
        public readonly string $type,
        public readonly string $name,
        public readonly string $state,
    ) {}
}
