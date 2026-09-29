<?php

class WeaponAscensionCost extends DbModel
{
    public function __construct(
        public readonly int $weapon_ascension_id,
        public readonly int $material_id,
        public readonly int $quantity,
    ) {}
}
