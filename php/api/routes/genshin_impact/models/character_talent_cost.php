<?php

class CharacterTalentCost extends DbModel
{
    public function __construct(
        public readonly int $character_talent_id,
        public readonly int $level,
        public readonly int $material_id,
        public readonly int $quantity,
    ) {}
}
