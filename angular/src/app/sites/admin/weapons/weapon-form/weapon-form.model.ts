import { WeaponAscensionCostFormData, WeaponAscensionFormData, WeaponFormData, WeaponRefinementFormData } from '../../services/admin-api.service';
import { createUid, ImageSlot } from '../../shared/admin-full-resource.model';

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
  images: Partial<Record<WeaponImageField, ImageSlot>>;
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
  return { data: { name: '', type: '', rarity: 5, icon: '' }, images: {} };
}

export function emptyRefinement(): RefinementWrapper {
  return { uid: createUid(), data: { material_id: 0, quantity: 0, description: '' } };
}

export function emptyAscension(phase: number): AscensionWrapper {
  return {
    uid: createUid(),
    data: { phase, primary_stat_value: 0, secondary_stat_value: 0 },
    costs: [],
  };
}
