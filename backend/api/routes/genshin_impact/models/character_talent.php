<?php

class CharacterTalent extends DbModel
{
    public function __construct(
        /** The set this talent belongs to; characters reach their talents through it. */
        public readonly int $talent_set_id,
        public readonly int $order,
        public readonly string $name,
        public readonly string $type,
        public readonly ?int $icon_file_id = null,
        public readonly ?string $description = null,
    ) {}
}
