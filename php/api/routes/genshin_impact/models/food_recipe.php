<?php

class FoodRecipe extends DbModel
{
    public function __construct(
        public readonly int $food_id,
        public readonly int $material_id,
        public readonly int $quantity,
    ) {}
}
