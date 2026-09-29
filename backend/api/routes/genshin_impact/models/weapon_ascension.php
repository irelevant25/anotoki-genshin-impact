<?php

class WeaponAscension extends DbModel
{
    public function __construct(
        public readonly int $weapon_id,
        public readonly int $phase,
        public readonly float $primary_stat_value,
        public readonly float $secondary_stat_value,
        public readonly ?int $start_level_from,
        public readonly ?int $start_level_to,
        public readonly ?int $end_level_from,
        public readonly ?int $end_level_to,
    ) {
    }
}
