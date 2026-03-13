<?php

class CharacterBuildArtifact extends DbModel
{
    public function __construct(
        public readonly int $character_build_id,
        public readonly int $artifact_id,
        public readonly int $order,
        public readonly bool $pc_2 = false,
        public readonly bool $pc_4 = true,
    ) {
    }
}
