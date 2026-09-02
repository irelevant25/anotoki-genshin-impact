import { WeaponAscensionCostFormData, WeaponAscensionFormData, WeaponFormData, WeaponRefinementFormData } from '../../../../sites/admin/shared/admin-form.model';
import { createUid } from '../../shared/admin-full-resource.model';
import { PickedImage } from '../../shared/image-upload/image-upload.component';
import { assetSuffix, assetVariant, toAssetBaseName } from '../../shared/asset-name';

export type WeaponImageField = 'icon' | 'icon_2' | 'icon_ascension';

export const WEAPON_IMAGE_FIELDS: { field: WeaponImageField; label: string; required: boolean }[] = [
  { field: 'icon', label: 'Icon', required: true },
  { field: 'icon_2', label: 'Icon 2', required: false },
  { field: 'icon_ascension', label: 'Ascension Icon', required: false },
];

/** Phases 0 (base stats) through 6. */
export const MAX_WEAPON_ASCENSIONS = 7;

export interface WeaponWrapper {
  data: WeaponFormData;
  /** Pictures picked but not uploaded yet, keyed by column. */
  pending: Partial<Record<WeaponImageField, PickedImage>>;
}

/**
 * A weapon's pictures are all named after the weapon: the second look at the
 * same weapon gets a `2`, the ascension art its own word.
 *   FAVONIUS_SWORD,  FAVONIUS_SWORD2,  FAVONIUS_SWORD - ascension
 */
export function weaponImageName(weaponName: string | null | undefined, field: WeaponImageField): string {
  const base = toAssetBaseName(weaponName);
  if (field === 'icon_2') {
    return assetVariant(base, '2');
  }
  return field === 'icon_ascension' ? assetSuffix(base, 'ascension') : base;
}

/**
 * Refinements have no level column - the row's position in the list is the
 * refinement level, so the form keeps them in an explicit order.
 */
export interface RefinementWrapper {
  uid: number;
  data: WeaponRefinementFormData;
}

export interface AscensionWrapper {
  uid: number;
  data: WeaponAscensionFormData;
  costs: WeaponAscensionCostFormData[];
}

export function emptyWeapon(): WeaponWrapper {
  return { data: { name: '', type: '', rarity: 5, icon: '' }, pending: {} };
}

export function emptyRefinement(): RefinementWrapper {
  return { uid: createUid(), data: { material_id: 0, quantity: 0, description: '' } };
}

export function emptyAscension(phase: number): AscensionWrapper {
  return {
    uid: createUid(),
    data: { phase, primary_stat_value: 0, secondary_stat_value: 0, costs: [] },
    costs: [],
  };
}
