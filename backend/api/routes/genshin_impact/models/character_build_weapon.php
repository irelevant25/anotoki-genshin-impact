<?php

class CharacterBuildWeapon extends DbModel
{
    public function __construct(
        public readonly int $character_build_id,
        public readonly int $weapon_id,
        public readonly int $order,
    ) {}
}
