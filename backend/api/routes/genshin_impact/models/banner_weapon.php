<?php

class BannerWeapon extends DbModel
{
    public function __construct(
        public readonly int $banner_id,
        public readonly int $weapon_id,
        public readonly int $order,
    ) {}
}
