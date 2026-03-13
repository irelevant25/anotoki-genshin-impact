<?php

class Material extends DbModel
{
    public function __construct(
        public readonly string  $name,
        public readonly string  $category,
        public readonly ?string $region         = null,
        public readonly ?array  $how_to_obtain  = null,
        public readonly ?string $version        = null,
    ) {}

    protected static function jsonFields(): array
    {
        return ['how_to_obtain'];
    }
}
