<?php

class MaterialGroupJoin extends DbModel
{
    public function __construct(
        public readonly int     $material_id,
        public readonly ?string $group = null,
    ) {}
}
