import type { Character } from '../../../../../api';

/**
 * What the Food pages work out of the rows, pure functions as
 * banners/banner-groups.ts is for the banners: the types in the game's order,
 * and whose special dish a food is.
 */

/** The types the main track shows, the dishes first - by what they do, the most made first - and alchemy's two after; a type not here goes after, by name. */
export const FOOD_TYPE_ORDER: readonly string[] = ['Recovery Dishes', 'ATK-Boosting Dishes', 'DEF-Boosting Dishes', "Adventurer's Dishes", 'Other Dishes', 'Potions', 'Essential Oils'];

/**
 * A type as the main track names it, without its "Dishes" - "Recovery",
 * "ATK-Boosting" - so that the seven fit one row (the owner's request of
 * 2026-10-29). Only the words: the track's value, the filter and the type's
 * picture keep the type's own name, as the tiles and a food's page write it.
 */
export function trackLabel(type: string): string {
  return type.replace(/ Dishes$/, '');
}

/** What a page reads of the character a special dish is: who, its picture, its rarity's colour. */
export type Cook = Pick<Character, 'id' | 'name' | 'icon_name' | 'rarity' | 'special_dish'>;

/**
 * Each special dish's character, by the food's id: `characters.special_dish`
 * names a food by its id, the food nothing back. A Traveler's rows (one an
 * element) and a deleted character are nobody's cook here - none holds a dish
 * today, and a dish shown under one of them would be a mistake of the data's.
 */
export function cooksByDish(characters: readonly (Cook & Pick<Character, 'is_traveler' | 'deleted'>)[]): Map<number, Cook> {
  const cooks = new Map<number, Cook>();
  for (const character of characters) {
    if (character.special_dish !== null && !character.is_traveler && !character.deleted && !cooks.has(character.special_dish)) {
      cooks.set(character.special_dish, character);
    }
  }
  return cooks;
}

/**
 * Names in their own order, the quotes some of them wear set aside - the
 * special dishes are named like a sentence ("Sweet Dream", in quotes), and
 * would otherwise all come before the A's.
 */
export function byName(a: { name: string }, b: { name: string }): number {
  return String(a.name).localeCompare(String(b.name), undefined, { ignorePunctuation: true });
}
