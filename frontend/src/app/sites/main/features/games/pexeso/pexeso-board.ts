import { HELPER } from '../../../../../shared/helper';

/**
 * Pexeso's board: how a level is dealt, and where a turn's cards stand - a
 * group, still on their way to one, or never going to be one.
 *
 * Pure - no Angular, no signals - so that the two rules the game stands on
 * can be read, and checked, on their own, as mismatch-sets.ts is for Mismatch.
 *
 * A group is a character's card and one card for each kind of what that
 * character is - their element, weapon type or region -, every group of a
 * board showing the same kinds, drawn for each game. Any card that fits
 * counts: a Pyro card goes with any Pyro character, not only with the one it
 * was dealt beside, so the cards of one value are interchangeable.
 */

export type PexesoLevel = 'easy' | 'medium' | 'hard';

/** A level's board: the cards a side (a square of them), how many cards make a group, and how long every card is shown first. */
export interface PexesoLevelRule {
  readonly side: number;
  readonly groupSize: number;
  readonly lookSeconds: number;
}

/** Easiest first, as the setup's slider has them. */
export const PEXESO_LEVEL_ORDER: readonly PexesoLevel[] = ['easy', 'medium', 'hard'];

/**
 * The owner's levels: 16 cards in pairs, 36 in threes, 36 in fours. A group is
 * a character and one card a kind, so its size is how many of the three kinds
 * a board shows - one, two or all of them -, and a board holds side² /
 * groupSize groups: 8, 12 and 9.
 */
export const PEXESO_LEVELS: Readonly<Record<PexesoLevel, PexesoLevelRule>> = {
  easy: { side: 4, groupSize: 2, lookSeconds: 3 },
  medium: { side: 6, groupSize: 3, lookSeconds: 5 },
  hard: { side: 6, groupSize: 4, lookSeconds: 5 },
};

/** What a card that is not a character's own shows of them. */
export type PexesoKind = 'element' | 'weapon' | 'region';

/** In the order a board names them: "their element, weapon type and region". */
export const PEXESO_KINDS: readonly PexesoKind[] = ['element', 'weapon', 'region'];

/**
 * Each kind's pictures - assets/<folder>/<Value>.avif - and the values that
 * have one. A value without a picture would be a blank card, so whoever holds
 * one never plays while its kind is on the board: the two Adaptive Manekins
 * where the element is, the five from no region where the region is.
 */
export const PEXESO_PICTURES: Readonly<Record<PexesoKind, { readonly folder: string; readonly values: readonly string[] }>> = {
  element: { folder: 'elements', values: ['Pyro', 'Hydro', 'Anemo', 'Electro', 'Dendro', 'Cryo', 'Geo'] },
  weapon: { folder: 'weapon_types', values: ['Sword', 'Claymore', 'Polearm', 'Bow', 'Catalyst'] },
  region: { folder: 'regions', values: ['Mondstadt', 'Liyue', 'Inazuma', 'Sumeru', 'Fontaine', 'Natlan', 'Nod-Krai', 'Snezhnaya'] },
};

/** Where a character's own card finds its picture: their icon (`icon_name`), else their name, as the tournament draws them. */
const CHARACTER_FOLDER = 'character.icon';

/** What the deal reads of a character: a row of GameListsService.charactersMinimal(). */
export interface PexesoCharacter {
  readonly id: number;
  readonly name: string;
  readonly icon_name?: string | null;
  readonly element?: string | null;
  readonly weapon_type?: string | null;
  readonly region?: string | null;
  readonly is_traveler?: boolean | null;
  readonly deleted?: boolean | null;
}

interface CardBase {
  /** Unique on its board. */
  readonly id: number;
  /** What it shows, as stored - a character's name, "Pyro", "Sword", "Liyue" -: its caption, and its name once it is face up. */
  readonly value: string;
  /** Its picture, as the picture directive takes one: a name it looks for in `folder`. */
  readonly picture: string;
  readonly folder: string;
}

/** A character's own card: the character, whose values the rest of the group must show. */
export interface PexesoCharacterCard extends CardBase {
  readonly kind: 'character';
  readonly character: PexesoCharacter;
}

/** A card of one kind of what a character is - their element, weapon type or region. */
export interface PexesoValueCard extends CardBase {
  readonly kind: PexesoKind;
  readonly character: null;
}

export type PexesoCard = PexesoCharacterCard | PexesoValueCard;

export interface PexesoDeal {
  readonly level: PexesoLevel;
  /** What every group shows beside its character, in PEXESO_KINDS' order. */
  readonly kinds: readonly PexesoKind[];
  readonly groupSize: number;
  /** How many groups the board holds. */
  readonly groups: number;
  /** As they lie, row by row. */
  readonly cards: readonly PexesoCard[];
}

/** Where a turn's cards stand: still able to become a group, one, or never going to be one. */
export type PexesoSelection = 'open' | 'found' | 'failed';

/** A character's value of a kind, as stored ("Pyro", "Sword", "Liyue"), or null. */
export function valueOf(character: PexesoCharacter, kind: PexesoKind): string | null {
  switch (kind) {
    case 'element':
      return character.element ?? null;
    case 'weapon':
      return character.weapon_type ?? null;
    case 'region':
      return character.region ?? null;
  }
}

export function isCharacterCard(card: PexesoCard): card is PexesoCharacterCard {
  return card.kind === 'character';
}

function isValueCard(card: PexesoCard): card is PexesoValueCard {
  return card.kind !== 'character';
}

/**
 * Who a board of these kinds can deal: none of the Travelers (one character
 * across a dozen rows, of every element), nobody deleted, and only those with
 * a pictured value of every kind on the board. One row a name: two rows of one
 * name would be two cards that look alike and are not.
 */
export function playableCharacters(characters: readonly PexesoCharacter[], kinds: readonly PexesoKind[]): PexesoCharacter[] {
  const names = new Set<string>();
  return characters.filter((character) => {
    if (character.is_traveler || character.deleted || !character.name || names.has(character.name)) {
      return false;
    }
    if (!kinds.every((kind) => PEXESO_PICTURES[kind].values.includes(valueOf(character, kind) ?? ''))) {
      return false;
    }
    names.add(character.name);
    return true;
  });
}

/** A game's kinds at a level: as many as a group has cards beside the character's, drawn at random, in PEXESO_KINDS' order. */
export function drawKinds(level: PexesoLevel): PexesoKind[] {
  const drawn = new Set(HELPER.shuffleArray(PEXESO_KINDS).slice(0, PEXESO_LEVELS[level].groupSize - 1));
  return PEXESO_KINDS.filter((kind) => drawn.has(kind));
}

/**
 * A board at a level, or null when too few characters can play its kinds.
 *
 * The kinds are drawn first, then as many characters as the board has groups,
 * distinct and at random from those who can play them; each brings their own
 * card and one card a kind with their own value, and every card is shuffled
 * (Fisher-Yates, HELPER.shuffleArray). The cards are dealt in groups only so
 * that the board can be finished: once dealt, a card belongs to no character.
 */
export function dealPexeso(characters: readonly PexesoCharacter[], level: PexesoLevel): PexesoDeal | null {
  const { side, groupSize } = PEXESO_LEVELS[level];
  const kinds = drawKinds(level);
  const groups = (side * side) / groupSize;
  const pool = playableCharacters(characters, kinds);
  if (pool.length < groups) {
    return null;
  }

  const cards: PexesoCard[] = [];
  for (const character of HELPER.shuffleArray(pool).slice(0, groups)) {
    cards.push({ id: cards.length, kind: 'character', value: character.name, picture: character.icon_name ?? character.name, folder: CHARACTER_FOLDER, character });
    for (const kind of kinds) {
      // Never empty: playableCharacters() took only those with a pictured value of every kind.
      const value = valueOf(character, kind) ?? '';
      cards.push({ id: cards.length, kind, value, picture: value, folder: PEXESO_PICTURES[kind].folder, character: null });
    }
  }
  return { level, kinds, groupSize, groups, cards: HELPER.shuffleArray(cards) };
}

/**
 * Where a turn stands once another card is turned: `selected` the cards
 * turned this turn, the last one with them; `unmatched` every card of the
 * board not in a group already found (the selected ones among them).
 *
 * It fails as soon as it can no longer become a group - a second character, a
 * kind twice, a card that does not show the character's value, or, with no
 * character turned yet, cards that no character still face down shows all
 * of -, and never earlier. That is exact because what is left of a board can
 * always be dealt out into groups again: it could when it was dealt, and a
 * group found that is not one of the dealt - Bennett with the Pyro card dealt
 * beside Diluc - only swaps cards of one value between two groups (Diluc takes
 * the Pyro card dealt beside Bennett, as good a Pyro card as his own), as
 * every group shows the same kinds. So every character not yet found still
 * has, face down, a card of each kind with their values: a turn holding them
 * and only cards that fit them, or no character and cards that one of them
 * fits, can still be finished - and any group found leaves a board that can.
 *
 * Full and not failed, a turn is one character and one card a kind, all
 * fitting: a group.
 */
export function judgeSelection(selected: readonly PexesoCard[], unmatched: readonly PexesoCard[], groupSize: number): PexesoSelection {
  const characters = selected.filter(isCharacterCard);
  const values = selected.filter(isValueCard);
  if (characters.length > 1 || new Set(values.map((card) => card.kind)).size < values.length) {
    return 'failed';
  }

  const shows = (character: PexesoCharacter): boolean => values.every((card) => valueOf(character, card.kind) === card.value);
  const fits = characters.length === 1 ? shows(characters[0].character) : unmatched.some((card) => isCharacterCard(card) && shows(card.character));
  if (!fits) {
    return 'failed';
  }
  return selected.length === groupSize ? 'found' : 'open';
}
