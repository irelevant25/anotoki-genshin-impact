<?php

class CharacterTalentCost extends DbModel
{
    public function __construct(
        public readonly int $character_id,
        public readonly int $order,
        public readonly int $level,
        public readonly int $material_id,
        public readonly int $quantity,
    ) {
    }
}
