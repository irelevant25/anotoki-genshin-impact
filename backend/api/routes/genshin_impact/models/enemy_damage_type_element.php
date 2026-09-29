<?php

class EnemyDamageTypeElement extends DbModel
{
    public function __construct(
        public readonly int    $enemy_phase_id,
        public readonly string $damage_type_element,
        public readonly int    $order,
    ) {}
}
