<?php

class Material extends DbModel
{
    public function __construct(
        public readonly string $name,
        public readonly ?string $type = null,
        public readonly ?string $group = null,
        public readonly ?string $region = null,
        public readonly ?string $description = null,
        public readonly ?array $how_to_obtain = null,
        public readonly ?string $version = null,
        public readonly ?int $rarity = null,
        public readonly ?int $icon_file_id = null,
    ) {
    }

    protected static function jsonFields(): array
    {
        return ['how_to_obtain'];
    }
}
