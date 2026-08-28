<?php

// ── /api/materials[/{id}]/full ────────────────────────────────────────────────
//
// material
//   groups[]   -- extra groups beyond the primary `group` column
//
// Materials have no icon column; the site resolves art by name convention.

registerFullResource(
    $app,
    'materials',
    'materials',
    Material::class,
    'material',
    [
        [
            'key' => 'groups',
            'table' => 'materials_groups_join',
            'fk' => 'material_id',
            'model' => MaterialGroupJoin::class,
        ],
    ]
);
