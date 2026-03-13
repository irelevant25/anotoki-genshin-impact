<?php

class WeaponStat extends DbModel
{
    public function __construct(
        public readonly int $weapon_id,
        public readonly int $stat_id,
    ) {}
}
