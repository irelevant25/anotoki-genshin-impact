import { FoodFormData, FoodRecipeFormData } from '../../../../sites/admin/shared/admin-form.model';
import { createUid } from '../../shared/admin-full-resource.model';
import { PickedImage } from '../../shared/image-upload/image-upload.component';
import { assetSuffix, toAssetBaseName } from '../../shared/asset-name';

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
  /** Pictures picked but not uploaded yet, keyed by column. */
  pending: Partial<Record<FoodImageField, PickedImage>>;
}

/**
 * The three qualities share the dish's name and are told apart by a word:
 *   MOON_PIE - normal,  MOON_PIE - delicious,  MOON_PIE - suspicious
 */
export function foodImageName(foodName: string | null | undefined, quality: FoodQuality): string {
  return assetSuffix(toAssetBaseName(foodName), quality);
}

export interface RecipeWrapper {
  uid: number;
  data: FoodRecipeFormData;
}

export function emptyFood(): FoodWrapper {
  return { data: { name: '' } as IndexedFood, pending: {} };
}

export function emptyRecipe(): RecipeWrapper {
  return { uid: createUid(), data: { quantity: 1 } };
}
