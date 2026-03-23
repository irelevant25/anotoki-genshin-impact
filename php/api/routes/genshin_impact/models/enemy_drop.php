<?php

class EnemyDrop extends DbModel
{
    public function __construct(
        public readonly int  $enemy_id,
        public readonly ?int $material_id    = null,
        public readonly ?int $artifact_id    = null,
        public readonly ?int $level_from     = null,
        public readonly ?int $level_to       = null,
        public readonly ?string $domain_level  = null,
        public readonly ?int    $world_level   = null,
        public readonly ?int    $quantity_from = null,
        public readonly ?int    $quantity_to   = null,
        public readonly ?float  $drop_rate     = null,
        public readonly ?float  $average       = null,
        public readonly ?int $rarity         = null,
    ) {}
}
