<?php

class Artifact extends DbModel
{
    public function __construct(
        public readonly string $name,
        public readonly ?int $icon_file_id = null,
        public readonly ?array  $how_to_obtain_quality_1 = null,
        public readonly ?array  $how_to_obtain_quality_2 = null,
        public readonly ?array  $how_to_obtain_quality_3 = null,
        public readonly ?array  $how_to_obtain_quality_4 = null,
        public readonly ?array  $how_to_obtain_quality_5 = null,
        public readonly ?string $version                 = null,
        public readonly ?array  $effects                 = null,
        public readonly ?string $two_piece               = null,
        public readonly ?string $four_piece              = null,
        public readonly bool    $has_rarity_1            = false,
        public readonly bool    $has_rarity_2            = false,
        public readonly bool    $has_rarity_3            = false,
        public readonly bool    $has_rarity_4            = false,
        public readonly bool    $has_rarity_5            = true,
    ) {
    }

    protected static function jsonFields(): array
    {
        return [
            'how_to_obtain_quality_1',
            'how_to_obtain_quality_2',
            'how_to_obtain_quality_3',
            'how_to_obtain_quality_4',
            'how_to_obtain_quality_5',
            'effects',
        ];
    }
}
