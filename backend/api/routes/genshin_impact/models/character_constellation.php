<?php

class CharacterConstellation extends DbModel
{
    public function __construct(
        /** The set this constellation belongs to; characters reach theirs through it. */
        public readonly int $constellation_set_id,
        public readonly string $name,
        public readonly int $level,
        public readonly ?int $icon_file_id = null,
        public readonly ?string $description = null,
    ) {}
}
