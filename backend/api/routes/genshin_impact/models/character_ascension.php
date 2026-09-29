<?php

class CharacterAscension extends DbModel
{
    public function __construct(
        /** The set this ascension belongs to; characters reach their ascensions through it. */
        public readonly int    $ascension_set_id,
        public readonly int    $phase,
        public readonly string $primary_stat,
        public readonly float  $primary_stat_value,
        public readonly float  $start_level_hp,
        public readonly float  $start_level_atk,
        public readonly float  $start_level_def,
        public readonly float  $end_level_hp,
        public readonly float  $end_level_atk,
        public readonly float  $end_level_def,
    ) {}
}
