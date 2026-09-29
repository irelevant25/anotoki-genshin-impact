<?php

// ── /api/enemies[/{id}]/full ──────────────────────────────────────────────────
//
// enemy
//   phases[]              -> damage_type_elements[]
//   drops[]

registerFullResource(
    $app,
    'enemies',
    'enemies',
    Enemy::class,
    'enemy',
    [
        [
            'key' => 'phases',
            'table' => 'enemies_phases',
            'fk' => 'enemy_id',
            'model' => EnemyPhase::class,
            'children' => [
                [
                    'key' => 'damage_type_elements',
                    'table' => 'enemies_damage_types_elements',
                    'fk' => 'enemy_phase_id',
                    'model' => EnemyDamageTypeElement::class,
                ],
            ],
        ],
        [
            'key' => 'drops',
            'table' => 'enemies_drops',
            'fk' => 'enemy_id',
            'model' => EnemyDrop::class,
        ],
    ],
    [
        '_parent' => ['icon' => 'enemies'],
        'phases' => ['icon' => 'enemies', 'art' => 'enemies'],
    ],
    full: EnemyFull::class,
    fullRow: EnemyFullRow::class,
);
