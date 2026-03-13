<?php

class CharacterAscension extends DbModel
{
    public function __construct(
        public readonly int $character_id,
        public readonly ?int $character_id_2 = null,
        public readonly ?int $character_id_3 = null,
        public readonly ?int $character_id_4 = null,
        public readonly ?int $character_id_5 = null,
        public readonly ?int $character_id_6 = null,
        public readonly ?int $character_id_7 = null,
        public readonly int $phase,
        public readonly string $primary_stat,
        public readonly int $primary_stat_value,
        public readonly int $start_level_hp,
        public readonly int $start_level_atk,
        public readonly int $start_level_def,
        public readonly int $end_level_hp,
        public readonly int $end_level_atk,
        public readonly int $end_level_def,
    ) {
    }
}
