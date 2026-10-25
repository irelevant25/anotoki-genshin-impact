import { parseJsonColumn } from '../../../../../api';
import type { SelectOption } from '@anotoki/lib/ui/forms';

/**
 * The era the Luna releases belong to. Nod-Krai shipped as "Luna" plus a Roman
 * numeral rather than 6.x, but the numbering resumes at 7.x for Snezhnaya, so
 * Luna I is 6.0, Luna II is 6.1, and so on.
 */
const LUNA_ERA = 6;
const LUNA_PREFIX = 'Luna ';

const ROMAN_DIGITS: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };

/** `IX` -> 9. Returns null for anything that is not a Roman numeral. */
function romanToNumber(roman: string): number | null {
  const letters = roman.trim().toUpperCase();
  if (!letters || !/^[IVXLCDM]+$/.test(letters)) {
    return null;
  }
  let total = 0;
  for (let i = 0; i < letters.length; i++) {
    const current = ROMAN_DIGITS[letters[i]];
    const next = ROMAN_DIGITS[letters[i + 1]];
    total += next && next > current ? -current : current;
  }
  return total;
}

/**
 * `Luna III` -> `6.2`, derived rather than looked up: a hand-written table is
 * one release behind the moment the next Luna ships, and an unmapped name used
 * to sort below 1.0 and show without its number.
 */
export function versionNumber(version: string): string | null {
  if (!version?.startsWith(LUNA_PREFIX)) {
    return null;
  }
  const luna = romanToNumber(version.slice(LUNA_PREFIX.length));
  return luna === null || luna < 1 ? null : `${LUNA_ERA}.${luna - 1}`;
}

/** `Luna III` reads as `6.2 (Luna III)`; a numbered version is left alone. */
export function versionLabel(version: string): string {
  const number = versionNumber(version);
  return number ? `${number} (${version})` : version;
}

/** Sorts version strings numerically ("1.10" after "1.9"), newest first. */
export function compareVersionsDesc(a: string, b: string): number {
  const left = (versionNumber(a) ?? a).split('.').map(Number);
  const right = (versionNumber(b) ?? b).split('.').map(Number);

  // Anything that is not a version number at all sorts to the end rather than
  // poisoning the comparison with NaN, which leaves the order undefined.
  const leftValid = left.every((part) => !Number.isNaN(part));
  const rightValid = right.every((part) => !Number.isNaN(part));
  if (!leftValid || !rightValid) {
    return leftValid ? -1 : rightValid ? 1 : a.localeCompare(b);
  }

  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    const diff = (right[i] ?? 0) - (left[i] ?? 0);
    if (diff) {
      return diff;
    }
  }
  return 0;
}

/** Every value a field takes across the rows, blanks dropped, as strings. */
export function distinctValues(rows: any[], field: string): string[] {
  const values = rows
    .map((row) => row?.[field])
    .filter((value) => value !== null && value !== undefined && value !== '')
    .map((value) => String(value));
  return [...new Set(values)];
}

/**
 * Options whose value is the raw value off the row, so a selection can be
 * compared straight against the data, and whose label is what a reader expects.
 */
export function buildVersionOptions(rows: any[], field: string = 'version'): SelectOption[] {
  return distinctValues(rows, field)
    .sort(compareVersionsDesc)
    .map((version) => ({ value: version, label: versionLabel(version) }));
}

/** Distinct values of a field as plain A-Z options. */
export function buildValueOptions(rows: any[], field: string): SelectOption[] {
  return distinctValues(rows, field)
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ value, label: value }));
}

/** Rarities present, highest first - the order the tiers are read in. */
export function rarityValues(rows: any[], field: string = 'rarity'): number[] {
  return distinctValues(rows, field)
    .map(Number)
    .filter((rarity) => !Number.isNaN(rarity))
    .sort((a, b) => b - a);
}

/** A dropdown selection that has actually been made. */
export function isChosen(value: unknown): boolean {
  return value !== undefined && value !== null && value !== '';
}

/**
 * A jsonb column read as a list of lines. The dumps are not consistent - some
 * columns hold an array, some a single string, some an object keyed by anything
 * - so everything is flattened to strings and the blanks dropped.
 *
 * The value is decoded first. JSONB comes back from the API as a raw JSON
 * string, so without this a list of two affiliations rendered as one line
 * reading `["Wangsheng Funeral Parlor","Hu Family"]`.
 */
export function asList(input: unknown): string[] {
  const value = parseJsonColumn(input);
  if (value === null || value === undefined || value === '') {
    return [];
  }
  const raw = Array.isArray(value) ? value : typeof value === 'object' ? Object.values(value as object) : [value];
  return raw
    .map((entry) => (typeof entry === 'object' && entry !== null ? JSON.stringify(entry) : String(entry)))
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

/** The rarity as stars - "★★★★★" - or nothing for none. */
export function rarityStars(rarity: unknown): string {
  const count = Number(rarity ?? 0);
  return Number.isFinite(count) && count > 0 ? '★'.repeat(count) : '';
}

const RARITY_WORDS: Record<number, string> = { 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five' };

/** The rarity's colour as the site names it (`var(--five-star)`); a 1★'s for anything else. */
export function rarityColour(rarity: unknown): string {
  return `var(--${RARITY_WORDS[Number(rarity)] ?? 'one'}-star)`;
}

/**
 * Gives a cost row (`material_id`, `quantity`) its material from the list, by
 * id - null for one the list lacks, which the tiles then leave out.
 */
export function withMaterialFrom(materials: readonly { id: number }[]): (row: any) => any {
  const byId = new Map(materials.map((material) => [material.id, material]));
  return (row: any): any => ({ ...row, material: byId.get(row.material_id) ?? null });
}

/**
 * Which of a counted sentence's three forms a number takes in a language:
 * `one`, `few` or `other`, as Intl.PluralRules names them (Slovak: 1 deň,
 * 2-4 dni, 5 dní; English has no `few`). The site's key scan knows no plural
 * forms, so a counted key is three keys under one prefix (users/062,
 * shared/dynamic-keys.ts); anything else the rules might say ("many", for a
 * fraction) falls to `other`.
 */
export function pluralTail(count: number, language: string): 'one' | 'few' | 'other' {
  let category = 'other';
  try {
    category = new Intl.PluralRules(language).select(count);
  } catch {
    category = 'other';
  }
  return category === 'one' || category === 'few' ? category : 'other';
}

export interface MaterialTotal {
  material: any;
  quantity: number;
}

/**
 * Cost rows folded into one line per material, quantities added up. The same
 * material turns up in several ascension phases and several talent levels, and
 * what a reader wants is the one number they have to farm.
 */
export function sumMaterials(costs: any[]): MaterialTotal[] {
  const totals = new Map<number, MaterialTotal>();
  for (const cost of costs) {
    if (!cost?.material) {
      continue;
    }
    const existing = totals.get(cost.material.id);
    totals.set(cost.material.id, {
      material: cost.material,
      quantity: (existing?.quantity ?? 0) + Number(cost.quantity ?? 0),
    });
  }
  return [...totals.values()].sort((a, b) => b.quantity - a.quantity);
}

/**
 * A character's birthday as a reader writes one: its day and month in the
 * reader's language ("15 July", "15. júla") - never the stored DATE, whose year
 * means nothing (characters.birthday is kept in year 4, the admin form's
 * calendar writes it so - shared/local-lib/stored-dates.ts). Null for no
 * birthday, or one that is no date.
 */
export function birthdayLabel(stored: unknown, locale: string): string | null {
  const match = /^\d{4}-(\d{2})-(\d{2})/.exec(String(stored ?? '').trim());
  if (!match) {
    return null;
  }
  const month = Number(match[1]) - 1;
  const day = Number(match[2]);
  // A leap year, so the 29th of February is a birthday like any other, and in
  // UTC, so no time zone moves it to another day.
  const date = new Date(Date.UTC(2000, month, day));
  if (date.getUTCMonth() !== month || date.getUTCDate() !== day) {
    return null;
  }
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(date);
}

/** Adds `value` to the set, or removes it when it is already there. */
export function toggleIn<T>(current: Set<T>, value: T): Set<T> {
  const next = new Set(current);
  if (!next.delete(value)) {
    next.add(value);
  }
  return next;
}
