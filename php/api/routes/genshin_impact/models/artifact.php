<?php

class Artifact extends DbModel
{
    public function __construct(
        public readonly string $name,
        public readonly int $rarity,
        public readonly string $icon,
        public readonly ?array $how_to_obtain = null,
        public readonly ?string $version = null,
        public readonly ?array $effects = null,
        public readonly ?string $two_piece = null,
        public readonly ?string $four_piece = null,
    ) {
    }

    protected static function jsonFields(): array
    {
        return ['how_to_obtain', 'effects'];
    }
}
