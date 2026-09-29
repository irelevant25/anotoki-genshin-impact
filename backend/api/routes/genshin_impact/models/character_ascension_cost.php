<?php

class CharacterAscensionCost extends DbModel
{
    public function __construct(
        public readonly int $character_ascension_id,
        public readonly int $material_id,
        public readonly int $order,
        public readonly int $quantity,
    ) {
    }
}
