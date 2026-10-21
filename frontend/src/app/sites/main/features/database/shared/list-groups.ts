import { compareVersionsDesc, rarityStars, versionLabel } from './database-helpers';

/**
 * The list pages' sections (the owner's choice "E" of 2026-10-21 among the
 * mockups): the rows that survived the filters, grouped by one of their
 * fields - the region, the version, the rarity - each group a heading with
 * an emblem and a count, or no grouping at all. Pure functions over the rows
 * the page already has, as banner-groups.ts is for the banners.
 */

/** The game's regions in the order its map reads them; a region not here goes after, by name. */
export const REGION_ORDER: readonly string[] = ['Mondstadt', 'Liyue', 'Inazuma', 'Sumeru', 'Fontaine', 'Natlan', 'Nod-Krai', 'Snezhnaya'];

/** The elements in the game's own order - the characters page's main track. 'Adaptive' is no element of a track (the Traveler's placeholder). */
export const ELEMENT_ORDER: readonly string[] = ['Pyro', 'Hydro', 'Anemo', 'Electro', 'Dendro', 'Cryo', 'Geo'];

/** The weapon types in the game's own order - the weapons page's main track. */
export const WEAPON_TYPE_ORDER: readonly string[] = ['Sword', 'Claymore', 'Polearm', 'Bow', 'Catalyst'];

/** What a list can be grouped by; each page offers its own subset (`none` is one flat grid). */
export type GroupKey = 'region' | 'version' | 'rarity' | 'none';

/** The block before a group's title: a region's emblem, a version's number, a rarity's "5★", or a mark for the rows without the value. */
export type GroupEmblem = { kind: 'picture'; name: string; folder: string } | { kind: 'text'; text: string } | { kind: 'rarity'; rarity: number };

export interface ListGroup<T> {
  key: string;
  /** The heading; null for the rows that have no value to group by (the page says "Other"). */
  title: string | null;
  emblem: GroupEmblem;
  items: T[];
}

/** What a row needs to carry to be grouped; every field optional, a list without it simply never offers that grouping. */
export interface GroupableRow {
  region?: string | null;
  version?: string | null;
  rarity?: number | string | null;
}

/** The mark of the group of rows without the value. */
const OTHER_EMBLEM: GroupEmblem = { kind: 'text', text: '✦' };

/**
 * The known values first, in their given order, then the rest by name - so a
 * region the game adds shows up at once, after the ones the order knows.
 */
export function inGameOrder(values: readonly string[], order: readonly string[]): string[] {
  const present = new Set(values);
  const known = order.filter((value) => present.has(value));
  const rest = values.filter((value) => !order.includes(value)).sort((a, b) => a.localeCompare(b));
  return [...known, ...rest];
}

/** The rows by a field's value, in the order the rows came, blanks under null. */
function buckets<T>(rows: readonly T[], read: (row: T) => string | null): Map<string | null, T[]> {
  const map = new Map<string | null, T[]>();
  for (const row of rows) {
    const value = read(row);
    const key = value === undefined || value === null || value === '' ? null : value;
    const list = map.get(key);
    if (list) {
      list.push(row);
    } else {
      map.set(key, [row]);
    }
  }
  return map;
}

/** The groups with, after them, the rows that had no value to group by. */
function withOther<T>(groups: ListGroup<T>[], rest: T[] | undefined): ListGroup<T>[] {
  return rest?.length ? [...groups, { key: 'other', title: null, emblem: OTHER_EMBLEM, items: rest }] : groups;
}

/**
 * The rows in groups, the rows of each in the order they came (the page sorts
 * them first). Rows without the value go last, under a group with no title.
 */
export function groupRows<T extends GroupableRow>(rows: readonly T[], key: GroupKey): ListGroup<T>[] {
  if (key === 'none') {
    return rows.length ? [{ key: 'all', title: null, emblem: OTHER_EMBLEM, items: [...rows] }] : [];
  }

  if (key === 'region') {
    const byRegion = buckets(rows, (row) => row.region ?? null);
    const regions = inGameOrder(
      [...byRegion.keys()].filter((region): region is string => region !== null),
      REGION_ORDER,
    );
    const groups: ListGroup<T>[] = regions.map((region) => ({
      key: `region:${region}`,
      title: region,
      emblem: { kind: 'picture', name: region, folder: 'regions' },
      items: byRegion.get(region) ?? [],
    }));
    return withOther(groups, byRegion.get(null));
  }

  if (key === 'version') {
    const byVersion = buckets(rows, (row) => row.version ?? null);
    const versions = [...byVersion.keys()].filter((version): version is string => version !== null).sort(compareVersionsDesc);
    const groups: ListGroup<T>[] = versions.map((version) => ({
      key: `version:${version}`,
      title: versionLabel(version),
      emblem: { kind: 'text', text: version },
      items: byVersion.get(version) ?? [],
    }));
    return withOther(groups, byVersion.get(null));
  }

  // By rarity, the highest first; a rarity that is no number counts as none.
  const byRarity = buckets(rows, (row) => {
    const rarity = Number(row.rarity);
    return row.rarity === null || row.rarity === undefined || row.rarity === '' || Number.isNaN(rarity) ? null : String(rarity);
  });
  const rarities = [...byRarity.keys()]
    .filter((rarity): rarity is string => rarity !== null)
    .map(Number)
    .sort((a, b) => b - a);
  const groups: ListGroup<T>[] = rarities.map((rarity) => ({
    key: `rarity:${rarity}`,
    title: rarityStars(rarity),
    emblem: { kind: 'rarity', rarity },
    items: byRarity.get(String(rarity)) ?? [],
  }));
  return withOther(groups, byRarity.get(null));
}
