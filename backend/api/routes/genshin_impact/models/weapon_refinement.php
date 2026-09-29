<?php

class WeaponRefinement extends DbModel
{
    public function __construct(
        public readonly int    $weapon_id,
        public readonly int    $material_id,
        public readonly string $description,
        public readonly int    $quantity,
    ) {}
}
