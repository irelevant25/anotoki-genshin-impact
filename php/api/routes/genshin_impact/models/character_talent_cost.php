<?php

class CharacterTalentCost extends DbModel
{
    public function __construct(
        /** The talent set this cost belongs to; shared with the set's talents. */
        public readonly int $talent_set_id,
        public readonly int $order,
        public readonly int $level,
        public readonly int $material_id,
        public readonly int $quantity,
    ) {
    }
}
