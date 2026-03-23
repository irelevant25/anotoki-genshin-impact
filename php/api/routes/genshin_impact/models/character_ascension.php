<?php

class CharacterAscension extends DbModel
{
    public function __construct(
        public readonly int    $character_id,
        public readonly int    $phase,
        public readonly string $primary_stat,
        public readonly float  $primary_stat_value,
        public readonly float  $start_level_hp,
        public readonly float  $start_level_atk,
        public readonly float  $start_level_def,
        public readonly float  $end_level_hp,
        public readonly float  $end_level_atk,
        public readonly float  $end_level_def,
        public readonly ?int   $character_id_2 = null,
        public readonly ?int   $character_id_3 = null,
        public readonly ?int   $character_id_4 = null,
        public readonly ?int   $character_id_5 = null,
        public readonly ?int   $character_id_6 = null,
        public readonly ?int   $character_id_7 = null,
    ) {}
}
