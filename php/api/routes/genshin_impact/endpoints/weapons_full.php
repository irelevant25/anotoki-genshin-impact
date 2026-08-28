<?php

// ── /api/weapons[/{id}]/full ──────────────────────────────────────────────────
//
// weapon
//   refinements[]           -- one per refinement level, in list order
//   ascensions[] -> costs[]

registerFullResource(
    $app,
    'weapons',
    'weapons',
    Weapon::class,
    'weapon',
    [
        [
            'key' => 'refinements',
            'table' => 'weapons_refinements',
            'fk' => 'weapon_id',
            'model' => WeaponRefinement::class,
        ],
        [
            'key' => 'ascensions',
            'table' => 'weapons_ascensions',
            'fk' => 'weapon_id',
            'model' => WeaponAscension::class,
            'children' => [
                [
                    'key' => 'costs',
                    'table' => 'weapons_ascensions_cost',
                    'fk' => 'weapon_ascension_id',
                    'model' => WeaponAscensionCost::class,
                ],
            ],
        ],
    ],
    [
        '_parent' => ['icon' => 'weapons', 'icon_2' => 'weapons', 'icon_ascension' => 'weapons'],
    ]
);
