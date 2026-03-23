<?php

class CharacterBuildTalent extends DbModel
{
    public function __construct(
        public readonly int     $character_build_id,
        public readonly int     $talent_id,
        public readonly int     $order,
        public readonly ?string $description = null,
    ) {}
}
