<?php

// ── /api/foods[/{id}]/full ────────────────────────────────────────────────────
//
// food
//   recipe[]   -- material + quantity

registerFullResource(
    $app,
    'foods',
    'foods',
    Food::class,
    'food',
    [
        [
            'key' => 'recipe',
            'table' => 'foods_recipe',
            'fk' => 'food_id',
            'model' => FoodRecipe::class,
        ],
    ],
    [
        '_parent' => ['icon_normal' => 'foods', 'icon_delicious' => 'foods', 'icon_suspicious' => 'foods'],
    ],
    full: FoodFull::class,
    fullRow: FoodFullRow::class,
);
