<?php

class CharacterBuildMainStat extends DbModel
{
    public function __construct(
        public readonly int    $character_build_id,
        public readonly string $stat_name,
        public readonly string $artifact_type,
    ) {}
}
