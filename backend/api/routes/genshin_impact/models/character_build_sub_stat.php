<?php

class CharacterBuildSubStat extends DbModel
{
    public function __construct(
        public readonly int $character_build_id,
        public readonly string $stat_name,
        public readonly int $order,
        public readonly ?string $recommended_value,
    ) {
    }
}
