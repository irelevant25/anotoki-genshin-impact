<?php

class CharacterBuildTeamCharacter extends DbModel
{
    public function __construct(
        public readonly int $character_build_team_id,
        public readonly int $order,
        public readonly ?int $character_id = null,
        public readonly ?string $element = null,
        public readonly bool $flex = false,
    ) {
    }
}
