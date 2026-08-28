import { FoodFormData, FoodRecipeFormData } from '../../services/admin-api.service';
import { createUid, ImageSlot } from '../../shared/admin-full-resource.model';

/** A dish exists in three qualities, each with its own icon, text and effect. */
export type FoodQuality = 'normal' | 'delicious' | 'suspicious';

export const FOOD_QUALITIES: { quality: FoodQuality; label: string }[] = [
  { quality: 'normal', label: 'Normal' },
  { quality: 'delicious', label: 'Delicious' },
  { quality: 'suspicious', label: 'Suspicious' },
];

export type FoodImageField = `icon_${FoodQuality}`;

/** Indexed access to the per-quality columns, so the template can loop. */
export type IndexedFood = FoodFormData & Record<string, unknown>;

export interface FoodWrapper {
  data: IndexedFood;
  images: Partial<Record<FoodImageField, ImageSlot>>;
}

export interface RecipeWrapper {
  uid: number;
  data: FoodRecipeFormData;
}

export function emptyFood(): FoodWrapper {
  return { data: { name: '' } as IndexedFood, images: {} };
}

export function emptyRecipe(): RecipeWrapper {
  return { uid: createUid(), data: { quantity: 1 } };
}
