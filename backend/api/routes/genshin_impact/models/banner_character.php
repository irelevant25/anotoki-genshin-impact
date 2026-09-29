<?php

class BannerCharacter extends DbModel
{
    public function __construct(
        public readonly int $banner_id,
        public readonly int $character_id,
        public readonly int $order,
    ) {}
}
