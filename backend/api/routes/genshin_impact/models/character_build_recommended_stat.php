<?php

class CharacterBuildRecommendedStat extends DbModel
{
    public function __construct(
        public readonly int $character_build_id,
        public readonly string $stat_name,
        public readonly float $value_from,
        public readonly ?float $value_to,
    ) {
    }
}
