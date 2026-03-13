<?php

class EnemyDrop extends DbModel
{
    public function __construct(
        public readonly int  $level_from,
        public readonly int  $enemy_id,
        public readonly int  $material_id,
        public readonly ?int $level_to  = null,
        public readonly ?int $quantity  = null,
    ) {}
}
