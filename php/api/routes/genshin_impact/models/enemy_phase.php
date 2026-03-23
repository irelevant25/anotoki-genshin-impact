<?php

class EnemyPhase extends DbModel
{
    public function __construct(
        public readonly int $enemy_id,
        public readonly string $title,
        public readonly string $icon,
        public readonly ?string $living_being_type   = null,
        public readonly ?string $living_being_family = null,
        public readonly ?string $living_being_group  = null,
        public readonly ?string $secondary_title     = null,
        public readonly ?string $art = null,
        public readonly ?bool $has_weakpoint = null,
    ) {
    }
}
