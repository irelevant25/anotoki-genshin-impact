import { PickedImage } from '../../shared/image-upload/image-upload.component';
import { assetVariant, toAssetBaseName } from '../../shared/asset-name';

export { revokePicked } from '../../shared/admin-full-resource.model';
import { AscensionCostFormData, AscensionFormData, CharacterFormData, ConstellationFormData, TalentFormData, VoiceOverFormData } from '../../../../sites/admin/shared/admin-form.model';

// ── Image / audio upload contract ─────────────────────────────────────────────

export type CharacterImageField =
  | 'icon'
  | 'card_icon'
  | 'card_icon_2'
  | 'wish_icon'
  | 'ingame_icon'
  | 'ingame_icon_2'
  | 'namecard_icon'
  | 'namecard_background'
  | 'namecard_banner';

/** Fields holding a second take on the same picture; stored as `NAME2`. */
const CHARACTER_IMAGE_VARIANTS: Partial<Record<CharacterImageField, string>> = {
  card_icon_2: '2',
  ingame_icon_2: '2',
};

/**
 * What a character's picture is stored as: the character's own name, upper
 * snake cased, with `2` appended for the second of a pair. Derived rather than
 * typed, so renaming the character renames what its next upload lands as.
 */
export function characterImageName(characterName: string | null | undefined, field: CharacterImageField): string {
  const base = toAssetBaseName(characterName);
  const variant = CHARACTER_IMAGE_VARIANTS[field];
  return variant ? assetVariant(base, variant) : base;
}

export type VoiceOverLanguage = 'english' | 'japanese' | 'chinese' | 'korean';

export const VOICE_OVER_LANGUAGES: VoiceOverLanguage[] = ['english', 'japanese', 'chinese', 'korean'];

export const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.avif', '.webp'];
export const AUDIO_EXTENSIONS = ['.mp3', '.ogg', '.wav', '.opus'];

// ── Form wrappers ─────────────────────────────────────────────────────────────

/**
 * Every wrapper pairs the JSON payload sent to the API (`data`) with the files
 * picked in the browser, which travel as separate FormData parts.
 */
export interface CharacterWrapper {
  data: CharacterFormData;
  /** Images picked but not uploaded yet, keyed by column. */
  pending: Partial<Record<CharacterImageField, PickedImage>>;
}

export interface VoiceOverWrapper {
  uid: number;
  data: VoiceOverFormData;
  audio: Partial<Record<VoiceOverLanguage, File>>;
}

export interface ConstellationWrapper {
  uid: number;
  data: ConstellationFormData;
  pending?: PickedImage;
}

export interface TalentWrapper {
  uid: number;
  data: TalentFormData;
  pending?: PickedImage;
}

export interface AscensionWrapper {
  uid: number;
  ascension: AscensionFormData;
  cost: AscensionCostFormData[];
}

// ── Factories ─────────────────────────────────────────────────────────────────

let nextUid = 0;

/** Stable identity for `@for` tracking and audio playback keys. */
export function createUid(): number {
  return ++nextUid;
}

export function emptyCharacter(): CharacterWrapper {
  return { data: { is_traveler: false } as CharacterFormData, pending: {} };
}

export function emptyVoiceOver(type: string, order: number): VoiceOverWrapper {
  return { uid: createUid(), data: { order, type, title_english: '' }, audio: {} };
}

export function emptyConstellation(level: number): ConstellationWrapper {
  return { uid: createUid(), data: { name: '', icon: '', description: '', level } };
}

export function emptyTalent(order: number, type: string): TalentWrapper {
  return { uid: createUid(), data: { name: '', type, icon: '', description: '', order } };
}

export function emptyAscension(phase: number): AscensionWrapper {
  return {
    uid: createUid(),
    ascension: {
      phase,
      primary_stat: '',
      primary_stat_value: 0,
      start_level_hp: 0,
      start_level_atk: 0,
      start_level_def: 0,
      end_level_hp: 0,
      end_level_atk: 0,
      end_level_def: 0,
    },
    cost: [],
  };
}

// ── Value coercion ────────────────────────────────────────────────────────────

/**
 * Inputs hand back strings (and `NaN` when cleared), while the API is strict
 * about numeric columns - normalize before anything leaves the form.
 */
export function toNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function toOptionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** PostgreSQL hands booleans back as `'t'` / `'f'`, both of which are truthy in JS. */
export function toBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === 't' || value === 'true' || value === '1';
}

export function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter((item) => item.trim().length > 0);
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    return [value];
  }
  return [];
}

// ── Ordering ──────────────────────────────────────────────────────────────────

/**
 * Moves `item` to `newOrder` inside `items` and shifts everything in between,
 * so the sequence stays gap-free. Returns `true` when something changed.
 */
export function reorder<T>(items: T[], item: T, newOrder: unknown, getOrder: (item: T) => number, setOrder: (item: T, order: number) => void): boolean {
  const order = toNumber(newOrder, NaN);
  if (!Number.isFinite(order) || order < 1) {
    return false;
  }
  const oldOrder = getOrder(item);
  if (order === oldOrder) {
    return false;
  }

  for (const current of items) {
    const currentOrder = getOrder(current);
    if (current === item) {
      setOrder(current, order);
    } else if (oldOrder < order && currentOrder > oldOrder && currentOrder <= order) {
      setOrder(current, currentOrder - 1);
    } else if (oldOrder > order && currentOrder >= order && currentOrder < oldOrder) {
      setOrder(current, currentOrder + 1);
    }
  }
  return true;
}

/** Renumbers `items` to a gap-free 1..n sequence, keeping their current relative order. */
export function resequence<T>(items: T[], getOrder: (item: T) => number, setOrder: (item: T, order: number) => void): void {
  [...items]
    .sort((a, b) => getOrder(a) - getOrder(b))
    .forEach((item, index) => setOrder(item, index + 1));
}
