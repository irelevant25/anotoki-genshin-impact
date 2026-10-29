import { HELPER } from '../../../../../shared/helper';
import { asList } from '../../database/shared/database-helpers';
import { MismatchProperty, QuizLevel } from '../shared/quiz.types';

/**
 * How a Mismatch set is drawn: all but one of its characters share a value of
 * one property - an element, a weapon type, a region, an era or an
 * affiliation - and the one that does not is the answer.
 *
 * Pure, so that what makes a set fair and what makes it hard can be read in
 * one place. Both were measured on the roster before they were written
 * (2026-10-29): more characters alone made no level harder - every one more is
 * one more that shows what the rest share, so a player who knows half the
 * facts did better on five than on three -, so a harder level asks what fewer
 * players know (its `properties`) and picks, of `blend` sets drawn, the one
 * whose odd one out looks most like the rest.
 */

/** A character as the lists answer it (GameListsService.charactersMinimal()). */
type Character = any;

export interface MismatchSet {
  /** The characters on offer, in the order they are shown. */
  readonly options: Character[];
  readonly answer: Character;
  readonly property: MismatchProperty;
  /** What the others share, as it is stored: "Pyro", "Liyue", "1.x", "Knights of Favonius". */
  readonly value: string;
}

/**
 * What every player sees in a set whatever a level asks: none of these may
 * single out a character the way the answer's property does, or the set would
 * have two answers. A level's own properties are checked beside them.
 */
const ALWAYS_CHECKED: readonly MismatchProperty[] = ['element', 'weapon', 'region'];

/** How many values a set is tried with before the draw gives up, and how many sets each value is tried with, a blend. */
const ROUNDS = 40;
const ATTEMPTS = 40;

/**
 * The version a character came out in, as an era: "1.x" to "5.x" and "7.x",
 * and "Luna" for Luna I to VIII - the game named the versions after 5.8
 * rather than numbering them 6.0 to 6.7.
 */
export function eraOf(version: unknown): string | null {
  const text = typeof version === 'string' ? version.trim() : '';
  const numbered = /^(\d+)\./.exec(text);
  if (numbered) {
    return `${numbered[1]}.x`;
  }
  return /^[A-Za-z]+/.exec(text)?.[0] ?? (text || null);
}

/** One affiliation of a character: its name, and what the brackets after it say - "formerly", "as Owl" -, if anything. */
function affiliationOf(entry: string): { name: string; qualifier: string | null } {
  const found = /^(.*?)\s*\(([^()]*)\)\s*$/.exec(entry);
  return found ? { name: found[1].trim(), qualifier: found[2].trim().toLowerCase() } : { name: entry.trim(), qualifier: null };
}

/**
 * A character's values, property by property: `shares` what a question can
 * say they share, `near` what they are tied to without belonging - a former
 * Knight, a disciple of the Adepti, an alias. Somebody near a value is neither
 * one of the others nor the odd one out of a set about it: either could be
 * argued.
 */
interface Traits {
  readonly character: Character;
  readonly shares: Readonly<Record<MismatchProperty, readonly string[]>>;
  readonly near: Readonly<Record<MismatchProperty, readonly string[]>>;
}

/**
 * Every character's traits. An affiliation named like a region ("Mondstadt",
 * Venti's in-game profile) is the region again and never a question of its
 * own; nor is "None". A character from no region holds the region '' - two of
 * them would look like a pair of outsiders, so the check counts it -, though
 * no set is ever about it.
 */
function traitsOf(characters: readonly Character[]): Traits[] {
  const regions = new Set(characters.map((character) => character.region).filter(Boolean));
  return characters.map((character) => {
    const shares: string[] = [];
    const near: string[] = [];
    for (const { name, qualifier } of asList(character.affiliations).map(affiliationOf)) {
      if (name === '' || name === 'None' || regions.has(name)) {
        continue;
      }
      // "On profile" says where the game lists it, not anything less than belonging.
      (qualifier === null || qualifier === 'on profile' ? shares : near).push(name);
    }
    const era = eraOf(character.version);
    return {
      character,
      shares: {
        element: character.element ? [character.element] : [],
        weapon: character.weapon_type ? [character.weapon_type] : [],
        region: [character.region ?? ''],
        era: era ? [era] : [],
        affiliation: [...new Set(shares)],
      },
      near: { element: [], weapon: [], region: [], era: [], affiliation: [...new Set(near)].filter((name) => !shares.includes(name)) },
    };
  });
}

/** Whether a character holds a value of a property, or is near it. */
const holds = (traits: Traits, property: MismatchProperty, value: string): boolean => traits.shares[property].includes(value) || traits.near[property].includes(value);

/**
 * Whether a set has its one answer: no value of a checked property, the
 * answer's own aside, held by all but one of them. All of them sharing one is
 * fine - it singles nobody out, and it makes the best hard questions ("five
 * from Mondstadt, four of them Knights"). Somebody near a value counts as
 * holding it here, so that no set leans on a point that could be argued.
 */
function isClean(set: readonly Traits[], property: MismatchProperty, value: string, checked: readonly MismatchProperty[]): boolean {
  for (const other of checked) {
    const counts = new Map<string, number>();
    for (const traits of set) {
      for (const held of new Set([...traits.shares[other], ...traits.near[other]])) {
        counts.set(held, (counts.get(held) ?? 0) + 1);
      }
    }
    for (const [held, count] of counts) {
      if (count === set.length - 1 && !(other === property && held === value)) {
        return false;
      }
    }
  }
  return true;
}

/**
 * How much the odd one out looks like the rest: for each checked property but
 * the question's, the share of the others it has a value in common with. A
 * look-alike is harder to pick out than a stranger.
 */
function blendOf(others: readonly Traits[], odd: Traits, property: MismatchProperty, checked: readonly MismatchProperty[]): number {
  let score = 0;
  for (const other of checked) {
    if (other === property) {
      continue;
    }
    const own = odd.shares[other].filter(Boolean);
    score += others.filter((traits) => traits.shares[other].some((held) => own.includes(held))).length / others.length;
  }
  return score;
}

/** A value a set can be about: who holds it, and who may be the odd one out. */
interface Choice {
  readonly property: MismatchProperty;
  readonly value: string;
  readonly members: readonly Traits[];
  readonly outsiders: readonly Traits[];
}

/** Every value of the asked properties that can carry a set of `count`: all but one of them holding it, somebody else outside it. */
function choicesOf(pool: readonly Traits[], properties: readonly MismatchProperty[], count: number): Choice[] {
  const choices: Choice[] = [];
  for (const property of properties) {
    const values = new Set(pool.flatMap((traits) => traits.shares[property]).filter(Boolean));
    for (const value of values) {
      const members = pool.filter((traits) => traits.shares[property].includes(value));
      const outsiders = pool.filter((traits) => !holds(traits, property, value));
      if (members.length >= count - 1 && outsiders.length > 0) {
        choices.push({ property, value, members, outsiders });
      }
    }
  }
  return choices;
}

/**
 * The next value to try: a property at random among those asked, then one of
 * its values by how many hold it. By size, so that the members of a small
 * group are not met in every other set: a group of exactly all-but-one would
 * show the same faces each time it came up.
 */
function pickChoice(choices: readonly Choice[]): Choice {
  const properties = [...new Set(choices.map((choice) => choice.property))];
  const property = properties[HELPER.getRandomInt(0, properties.length - 1)];
  const ofProperty = choices.filter((choice) => choice.property === property);
  let left = Math.random() * ofProperty.reduce((sum, choice) => sum + choice.members.length, 0);
  for (const choice of ofProperty) {
    left -= choice.members.length;
    if (left < 0) {
      return choice;
    }
  }
  return ofProperty[ofProperty.length - 1];
}

/** Of `blend` clean sets about one value, the one whose odd one out looks most like the rest - the first with a blend of 1; null when none came out clean. */
function bestSet(choice: Choice, checked: readonly MismatchProperty[], count: number, blend: number): MismatchSet | null {
  let best: { set: Traits[]; odd: Traits; score: number } | null = null;
  let found = 0;
  for (let attempt = 0; attempt < ATTEMPTS * blend && found < blend; attempt++) {
    const others = HELPER.shuffleArray(choice.members).slice(0, count - 1);
    const odd = choice.outsiders[HELPER.getRandomInt(0, choice.outsiders.length - 1)];
    const set = [...others, odd];
    if (!isClean(set, choice.property, choice.value, checked)) {
      continue;
    }
    found++;
    // A hair of chance so that equally good sets are taken at random, not the first of them.
    const score = blendOf(others, odd, choice.property, checked) + Math.random() * 1e-6;
    if (!best || score > best.score) {
      best = { set, odd, score };
    }
  }
  return best && { options: HELPER.shuffleArray(best.set).map((traits) => traits.character), answer: best.odd.character, property: choice.property, value: choice.value };
}

/**
 * A set at a level - its count, what it asks and how much its odd one out
 * blends in - or null when none could be drawn (too few characters for what
 * it asks).
 */
export function drawMismatchSet(characters: readonly Character[], level: QuizLevel): MismatchSet | null {
  const count = level.choicesAmount ?? 4;
  const properties = level.properties?.length ? level.properties : ALWAYS_CHECKED;
  const checked = [...new Set([...ALWAYS_CHECKED, ...properties])];
  const blend = Math.max(1, level.blend ?? 1);

  let choices = choicesOf(traitsOf(characters), properties, count);
  for (let round = 0; round < ROUNDS && choices.length; round++) {
    const choice = pickChoice(choices);
    const set = bestSet(choice, checked, count, blend);
    if (set) {
      return set;
    }
    // A value no clean set came out of is not tried again in this draw.
    choices = choices.filter((other) => other !== choice);
  }
  return null;
}
