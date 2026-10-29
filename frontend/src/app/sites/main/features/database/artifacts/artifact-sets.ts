import type { Artifact } from '../../../../../api';
import { asList } from '../shared/database-helpers';

/**
 * What the Artifacts pages work out of a set's row, pure functions as
 * banners/banner-groups.ts is for the banners: the qualities it drops in, and
 * how a reader is told them.
 */

/** A set's five switches, one a quality (has_rarity_1..5) - as the list's rows and the `/full` set carry them. */
export type ArtifactQualities = Partial<Pick<Artifact, 'has_rarity_1' | 'has_rarity_2' | 'has_rarity_3' | 'has_rarity_4' | 'has_rarity_5'>>;

/** A set's ways to obtain it, one list a quality - the `/full` set's own column names. */
export type ArtifactSources = Partial<Record<'how_to_obtain_quality_1' | 'how_to_obtain_quality_2' | 'how_to_obtain_quality_3' | 'how_to_obtain_quality_4' | 'how_to_obtain_quality_5', unknown>>;

const QUALITIES = [
  { rarity: 1, flag: 'has_rarity_1', sources: 'how_to_obtain_quality_1' },
  { rarity: 2, flag: 'has_rarity_2', sources: 'how_to_obtain_quality_2' },
  { rarity: 3, flag: 'has_rarity_3', sources: 'how_to_obtain_quality_3' },
  { rarity: 4, flag: 'has_rarity_4', sources: 'how_to_obtain_quality_4' },
  { rarity: 5, flag: 'has_rarity_5', sources: 'how_to_obtain_quality_5' },
] as const;

/** The qualities a set drops in, the lowest first: "Adventurer" is [1, 2, 3], "Gladiator's Finale" [4, 5]. */
export function artifactRarities(set: ArtifactQualities): number[] {
  return QUALITIES.filter((quality) => set[quality.flag] === true).map((quality) => quality.rarity);
}

/**
 * Qualities as a reader writes them: "4–5★", one alone "5★", and - were a set
 * ever to skip one - each of them, "3, 5★". Numbers and a star, the same in
 * every language. Null for a set with none.
 */
export function rarityRange(rarities: readonly number[]): string | null {
  if (!rarities.length) {
    return null;
  }
  const lowest = rarities[0];
  const highest = rarities[rarities.length - 1];
  if (lowest === highest) {
    return `${highest}★`;
  }
  const unbroken = rarities.every((rarity, index) => rarity === lowest + index);
  return unbroken ? `${lowest}–${highest}★` : `${rarities.join(', ')}★`;
}

/** One line of a set's How to obtain: the qualities that share a list of ways, and the list. */
export interface SourceGroup {
  /** "4–5★", as rarityRange() writes the qualities. */
  label: string;
  sources: string[];
}

/**
 * A set's ways to obtain it, the highest quality first, the qualities whose
 * lists are the same in one line - so a set that drops the same way at 4★ and
 * 5★ says it once, under "4–5★", and one whose 5★ also comes from a strongbox
 * says each. Only the qualities the set has, each list decoded (asList).
 */
export function sourceGroups(set: ArtifactQualities & ArtifactSources): SourceGroup[] {
  const groups: { rarities: number[]; sources: string[]; same: string }[] = [];
  for (const quality of [...QUALITIES].reverse()) {
    if (set[quality.flag] !== true) {
      continue;
    }
    const sources = asList(set[quality.sources]);
    if (!sources.length) {
      continue;
    }
    const same = JSON.stringify(sources);
    const last = groups[groups.length - 1];
    if (last && last.same === same) {
      last.rarities.unshift(quality.rarity);
    } else {
      groups.push({ rarities: [quality.rarity], sources, same });
    }
  }
  return groups.map((group) => ({ label: rarityRange(group.rarities) ?? '', sources: group.sources }));
}
