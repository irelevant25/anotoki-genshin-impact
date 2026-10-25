import { Character, QuizActivityDay, QuizDifficultyRow, QuizRecentResult, QuizStatsRow } from '../../../../api';
import { QUIZ_CATALOG, QuizCard } from '../quizzes/shared/quiz-catalog';
import { QUIZ_DIFFICULTIES, QuizId } from '../quizzes/shared/quiz.types';
import { matchesSearch } from '@anotoki/lib/ui/search';

/**
 * Turning the four quiz reads into the numbers the profile page draws.
 *
 * All of it is arithmetic on rows the server has already grouped, kept out of
 * the component so it can be reasoned about - and checked - on its own. Nothing
 * here reaches for a service, a signal or a clock: today is passed in.
 *
 * Two shapes arrive, and they answer different questions. `QuizStatsRow` is the
 * lifetime table, one row per character per quiz, which is where the per-quiz
 * and per-character breakdowns come from. `QuizDifficultyRow` and
 * `QuizActivityDay` are aggregated from the per-question log, because neither
 * difficulty nor the date survives into the lifetime totals. The game's own list
 * of characters (`Character`, cached by GameListsService) is joined in by id for
 * what the tiles and the hero draw - the element, the rarity, the namecard -
 * and is optional: without it the page still has every number.
 */

/** Anything counted the same way, whether it covers one quiz or a whole account. */
export interface Totals {
  /** Questions finished - every one of them was either won or lost. */
  played: number;
  wins: number;
  losses: number;
  /** Tries spent across those questions, not questions attempted. */
  attempts: number;
  /** 0 to 100. Zero when nothing has been played, which the page reads as "-". */
  winRate: number;
  /** Tries per question. Zero when nothing has been played. */
  averageAttempts: number;
}

/** The three counted columns every row of every breakdown carries. */
interface Counted {
  wins: number;
  losses: number;
  attempts: number;
}

export interface QuizBreakdown {
  /** The quiz's name, as the server and the saved games both use it. */
  id: string;
  /** Absent for a quiz the catalog does not know - see `byQuiz`. */
  card?: QuizCard;
  totals: Totals;
}

export interface CharacterBreakdown {
  characterId: number;
  name: string;
  /** What the icon is filed under; the name is the fallback, as elsewhere. */
  icon: string;
  totals: Totals;
  /** From the game's list, where it still has the character; null where it does not (a deleted one keeps its numbers). */
  element: string | null;
  rarity: number | null;
  /** The namecard's stored path - the tile's backdrop, the hero's picture - or null for a character without one (the Traveler). */
  namecard: string | null;
  /** The splash art's name, for the hero. */
  splash: string | null;
}

/** One quiz with everything the Quizzes tab says of it. */
export interface QuizReport extends QuizBreakdown {
  /** Easy, medium, hard - always the three, zeroes where nothing was played - and after them "not recorded" where there is any. */
  difficulties: DifficultyBreakdown[];
  /** The best and the toughest character in this quiz alone, by `highlights()`' rule. */
  best?: CharacterBreakdown;
  toughest?: CharacterBreakdown;
}

/** How the Characters tab can be ordered. */
export type CharacterSort = 'played' | 'best' | 'toughest' | 'name';

/** The last results of one day, for the History tab. */
export interface RecentDay {
  /** YYYY-MM-DD, by the browser's calendar. */
  day: string;
  /** Said as a word rather than a date, where there is one. */
  relative: 'today' | 'yesterday' | null;
  results: QuizRecentResult[];
}

export interface DifficultyBreakdown {
  /** 1 easy, 2 medium, 3 hard, or null for questions answered before the column existed. */
  difficulty: number | null;
  totals: Totals;
}

/** The three characters worth calling out, when there is enough to call them out on. */
export interface CharacterHighlights {
  best?: CharacterBreakdown;
  toughest?: CharacterBreakdown;
  mostMet?: CharacterBreakdown;
}

export interface ActivitySummary {
  /** Days with at least one finished question on them. */
  days: number;
  /** Consecutive days up to now - see `activitySummary` for what counts as now. */
  current: number;
  longest: number;
}

/** One square of the activity grid. */
export interface ActivityCell {
  day: string;
  played: number;
  wins: number;
  /** 0 for a day with nothing on it, then 1 to 4 against the busiest day drawn. */
  level: number;
  /** A day after today: part of this week, but not yet happened. */
  future: boolean;
}

/**
 * How many questions a character has to have been the answer to before they can
 * be called anyone's best or worst.
 *
 * One lucky guess is not a record. Below this the character still appears in
 * the table with their real numbers - they are only kept out of the headline.
 */
export const HIGHLIGHT_MIN_PLAYED = 3;

// ─────────────────────────────────────────────────────────────────────────────
// Totals
// ─────────────────────────────────────────────────────────────────────────────

function complete(counted: Counted): Totals {
  const played = counted.wins + counted.losses;

  return {
    ...counted,
    played,
    winRate: played ? (counted.wins / played) * 100 : 0,
    averageAttempts: played ? counted.attempts / played : 0,
  };
}

/** Everything added together, for the headline figures. */
export function sumTotals(rows: readonly Counted[]): Totals {
  return complete(
    rows.reduce<Counted>((sum, row) => ({ wins: sum.wins + row.wins, losses: sum.losses + row.losses, attempts: sum.attempts + row.attempts }), {
      wins: 0,
      losses: 0,
      attempts: 0,
    }),
  );
}

/** Adds `row` into the bucket at `key`, starting the bucket if it is the first. */
function accumulate<K>(buckets: Map<K, Counted>, key: K, row: Counted): void {
  const bucket = buckets.get(key);

  if (bucket) {
    bucket.wins += row.wins;
    bucket.losses += row.losses;
    bucket.attempts += row.attempts;
  } else {
    buckets.set(key, { wins: row.wins, losses: row.losses, attempts: row.attempts });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Breakdowns
// ─────────────────────────────────────────────────────────────────────────────

/**
 * One entry per quiz, in the order the Quizzes page lists them.
 *
 * Every quiz in the catalog appears whether or not it has been played: a row of
 * zeroes is the answer to "how am I doing at this one", and leaving it out
 * would quietly say the quiz does not exist. A quiz in the data that the
 * catalog has never heard of is kept too, after the six, rather than dropped -
 * the numbers are the player's either way.
 */
export function byQuiz(rows: readonly QuizStatsRow[]): QuizBreakdown[] {
  const buckets = new Map<string, Counted>();
  rows.forEach((row) => accumulate(buckets, row.quiz, row));

  const known = QUIZ_CATALOG.map((card) => ({
    id: card.id as string,
    card,
    totals: complete(buckets.get(card.id) ?? { wins: 0, losses: 0, attempts: 0 }),
  }));

  const catalogued = new Set<string>(QUIZ_CATALOG.map((card) => card.id));
  const unknown = [...buckets.entries()].filter(([id]) => !catalogued.has(id)).map(([id, counted]) => ({ id, totals: complete(counted) }));

  return [...known, ...unknown];
}

function breakdownOf(characterId: number, row: QuizStatsRow, totals: Totals, character: CharacterDetails | undefined): CharacterBreakdown {
  return {
    characterId,
    name: row.character_name,
    // Same fallback the rest of the site uses: some rows have no icon
    // filed, and the name is what the asset is named after anyway.
    icon: row.icon_name ?? row.character_name,
    totals,
    element: character?.element ?? null,
    rarity: character ? Number(character.rarity) || null : null,
    namecard: character?.namecard_background ?? null,
    splash: character?.wish_icon_name ?? null,
  };
}

/**
 * One entry per character met, busiest first, then alphabetically - with what
 * the game's list knows of each (`details`), for the tiles and the hero.
 */
export function byCharacter(rows: readonly QuizStatsRow[], details: ReadonlyMap<number, CharacterDetails> = new Map()): CharacterBreakdown[] {
  const buckets = new Map<number, Counted>();
  const names = new Map<number, QuizStatsRow>();

  rows.forEach((row) => {
    accumulate(buckets, row.character_id, row);
    names.set(row.character_id, row);
  });

  return [...buckets.entries()]
    .map(([characterId, counted]) => breakdownOf(characterId, names.get(characterId)!, complete(counted), details.get(characterId)))
    .sort((a, b) => b.totals.played - a.totals.played || a.name.localeCompare(b.name));
}

/** Easy, medium, hard, and then whatever was recorded before difficulty was. */
export function byDifficulty(rows: readonly QuizDifficultyRow[]): DifficultyBreakdown[] {
  const buckets = new Map<number | null, Counted>();
  rows.forEach((row) => accumulate(buckets, row.difficulty, row));

  return [...buckets.entries()]
    .map(([difficulty, counted]) => ({ difficulty, totals: complete(counted) }))
    .sort((a, b) => (a.difficulty ?? Number.MAX_SAFE_INTEGER) - (b.difficulty ?? Number.MAX_SAFE_INTEGER));
}

/**
 * The best, the worst and the most often met.
 *
 * Best and worst are drawn only from characters seen `HIGHLIGHT_MIN_PLAYED`
 * times or more, and a tie on win rate goes to whoever has been met more often.
 * When one character is both - which happens as soon as only one qualifies -
 * only the best is given, since naming them twice says nothing.
 */
export function highlights(characters: readonly CharacterBreakdown[]): CharacterHighlights {
  const eligible = characters.filter((character) => character.totals.played >= HIGHLIGHT_MIN_PLAYED);

  const best = [...eligible].sort((a, b) => b.totals.winRate - a.totals.winRate || b.totals.played - a.totals.played)[0];
  const toughest = [...eligible].sort((a, b) => a.totals.winRate - b.totals.winRate || b.totals.played - a.totals.played)[0];

  return {
    best,
    toughest: toughest && toughest.characterId !== best?.characterId ? toughest : undefined,
    // No threshold on this one: it is a count, not a judgement.
    mostMet: characters[0],
  };
}

/** What the join reads of a character: the game's list in full or without the editors' columns, either will do. */
export type CharacterDetails = Pick<Character, 'id' | 'element' | 'rarity' | 'namecard_background' | 'wish_icon_name'>;

/** The game's characters by id, as `byCharacter` and `quizReports` want them. */
export function characterDetails(list: readonly CharacterDetails[]): Map<number, CharacterDetails> {
  return new Map(list.map((character) => [character.id, character]));
}

/**
 * Every quiz with its own difficulties and its own best and toughest
 * character, in `byQuiz`'s order. The difficulty rows arrive per quiz and
 * are summed across them for the Overview; here each quiz keeps its own, the
 * three numbered ones always present so the three bars line up card to card.
 */
export function quizReports(rows: readonly QuizStatsRow[], difficultyRows: readonly QuizDifficultyRow[], details: ReadonlyMap<number, CharacterDetails> = new Map()): QuizReport[] {
  const perQuiz = new Map<string, Map<number, { row: QuizStatsRow; counted: Counted }>>();
  rows.forEach((row) => {
    let characters = perQuiz.get(row.quiz);
    if (!characters) {
      characters = new Map();
      perQuiz.set(row.quiz, characters);
    }
    const entry = characters.get(row.character_id);
    if (entry) {
      entry.counted.wins += row.wins;
      entry.counted.losses += row.losses;
      entry.counted.attempts += row.attempts;
    } else {
      characters.set(row.character_id, { row, counted: { wins: row.wins, losses: row.losses, attempts: row.attempts } });
    }
  });

  return byQuiz(rows).map((quiz) => {
    const characters = [...(perQuiz.get(quiz.id)?.entries() ?? [])]
      .map(([characterId, { row, counted }]) => breakdownOf(characterId, row, complete(counted), details.get(characterId)))
      .sort((a, b) => b.totals.played - a.totals.played || a.name.localeCompare(b.name));
    const picks = highlights(characters);

    const recorded = byDifficulty(difficultyRows.filter((row) => row.quiz === quiz.id));
    const numbered: DifficultyBreakdown[] = QUIZ_DIFFICULTIES.map(
      (difficulty) => recorded.find((entry) => entry.difficulty === difficulty) ?? { difficulty, totals: complete({ wins: 0, losses: 0, attempts: 0 }) },
    );
    const unknown = recorded.find((entry) => entry.difficulty === null);

    return { ...quiz, difficulties: unknown ? [...numbered, unknown] : numbered, best: picks.best, toughest: picks.toughest };
  });
}

/**
 * The character the hero is drawn with: the one met most often that has a
 * namecard to put behind the name - the Traveler, often the most met, has
 * none - or, failing any namecard, simply the one met most.
 */
export function heroCharacter(characters: readonly CharacterBreakdown[]): CharacterBreakdown | undefined {
  return characters.find((character) => character.namecard) ?? characters[0];
}

/** How many of the characters met are of each element, in the order the rows came. */
export function elementCounts(characters: readonly CharacterBreakdown[]): Map<string, number> {
  const counts = new Map<string, number>();
  characters.forEach((character) => {
    if (character.element) {
      counts.set(character.element, (counts.get(character.element) ?? 0) + 1);
    }
  });
  return counts;
}

/** The characters of one element whose name holds every word of the term, accents and case aside (@anotoki/lib/ui/search) - either filter empty for all. */
export function filterCharacters(characters: readonly CharacterBreakdown[], element: string | null, term: string): CharacterBreakdown[] {
  return characters.filter((character) => (!element || character.element === element) && matchesSearch(character.name, term));
}

/**
 * The characters in the chosen order. Best and toughest put the characters
 * met `HIGHLIGHT_MIN_PLAYED` times or more first, for the same reason the
 * headline does: one lucky guess is a 100 % that would otherwise top the list.
 */
export function sortCharacters(characters: readonly CharacterBreakdown[], sort: CharacterSort): CharacterBreakdown[] {
  const byName = (a: CharacterBreakdown, b: CharacterBreakdown): number => a.name.localeCompare(b.name);
  const eligibleFirst = (a: CharacterBreakdown, b: CharacterBreakdown): number => Number(b.totals.played >= HIGHLIGHT_MIN_PLAYED) - Number(a.totals.played >= HIGHLIGHT_MIN_PLAYED);

  return [...characters].sort((a, b) => {
    switch (sort) {
      case 'name':
        return byName(a, b);
      case 'best':
        return eligibleFirst(a, b) || b.totals.winRate - a.totals.winRate || b.totals.played - a.totals.played || byName(a, b);
      case 'toughest':
        return eligibleFirst(a, b) || a.totals.winRate - b.totals.winRate || b.totals.played - a.totals.played || byName(a, b);
      default:
        return b.totals.played - a.totals.played || byName(a, b);
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Activity
// ─────────────────────────────────────────────────────────────────────────────

const MS_PER_DAY = 86_400_000;

/** Today as YYYY-MM-DD, by the machine's own calendar - see `activitySummary`. */
export function localToday(now: Date = new Date()): string {
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

/** A YYYY-MM-DD day as a count of days, so runs can be found by subtraction. */
function dayNumber(day: string): number {
  return Math.floor(Date.parse(`${day}T00:00:00Z`) / MS_PER_DAY);
}

function dayString(dayNumber: number): string {
  return new Date(dayNumber * MS_PER_DAY).toISOString().slice(0, 10);
}

/**
 * How many days have been played on, the longest run of them, and the run still
 * going.
 *
 * The current run is allowed to end yesterday as well as today. Partly because
 * a streak is not lost until a day has been missed - today is not over yet -
 * and partly because the two sides do not agree on where the day turns: the
 * server groups by its own date, and `today` here comes from the browser. A day
 * of slack absorbs that without either side having to know the other's clock.
 */
export function activitySummary(days: readonly QuizActivityDay[], today: string): ActivitySummary {
  const numbers = [...new Set(days.map((day) => dayNumber(day.day)))].sort((a, b) => a - b);

  if (!numbers.length) {
    return { days: 0, current: 0, longest: 0 };
  }

  let longest = 1;
  let run = 1;
  for (let i = 1; i < numbers.length; i++) {
    run = numbers[i] === numbers[i - 1] + 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  const last = numbers[numbers.length - 1];
  const current = last >= dayNumber(today) - 1 ? run : 0;

  return { days: numbers.length, current, longest };
}

/**
 * The last `weeks` weeks as squares, oldest first, seven to a column.
 *
 * The span is trimmed to whole weeks ending on the Sunday of the week `today`
 * falls in, so every column is one Monday-to-Sunday week and the rows line up
 * as weekdays. Days after today are still there, marked `future`, because
 * leaving them out would pull the last column out of alignment.
 *
 * Shading is relative to the busiest day drawn rather than to a fixed count:
 * ten questions in a day is a lot for one player and a quiet morning for
 * another, and neither should see a grid all one colour.
 */
export function activityGrid(days: readonly QuizActivityDay[], weeks: number, today: string): ActivityCell[] {
  const byDay = new Map(days.map((day) => [day.day, day]));
  const todayNumber = dayNumber(today);

  // getUTCDay counts from Sunday; the grid reads Monday to Sunday.
  const weekdayIndex = (new Date(todayNumber * MS_PER_DAY).getUTCDay() + 6) % 7;
  const end = todayNumber + (6 - weekdayIndex);
  const start = end - weeks * 7 + 1;

  const busiest = Math.max(1, ...days.filter((day) => dayNumber(day.day) >= start).map((day) => day.played));

  const cells: ActivityCell[] = [];
  for (let number = start; number <= end; number++) {
    const day = dayString(number);
    const entry = byDay.get(day);
    const played = entry?.played ?? 0;

    cells.push({
      day,
      played,
      wins: entry?.wins ?? 0,
      level: played ? Math.min(4, Math.ceil((played / busiest) * 4)) : 0,
      future: number > todayNumber,
    });
  }

  return cells;
}

/**
 * The last results in groups of a day each, newest first as the server hands
 * them over, each day by the browser's own calendar - a question finished at
 * one in the morning belongs to the night it was played, not to the server's
 * date - and today and yesterday named as such.
 */
export function recentByDay(results: readonly QuizRecentResult[], today: string): RecentDay[] {
  const yesterday = dayString(dayNumber(today) - 1);
  const days: RecentDay[] = [];

  for (const result of results) {
    const day = localToday(new Date(result.created_at));
    const last = days[days.length - 1];
    if (last && last.day === day) {
      last.results.push(result);
    } else {
      days.push({ day, relative: day === today ? 'today' : day === yesterday ? 'yesterday' : null, results: [result] });
    }
  }

  return days;
}

// ─────────────────────────────────────────────────────────────────────────────
// Quiz names
// ─────────────────────────────────────────────────────────────────────────────

const CARDS_BY_ID = new Map<string, QuizCard>(QUIZ_CATALOG.map((card) => [card.id as string, card]));

/** The card a quiz name belongs to, for the reads that only carry the name. */
export function cardFor(quiz: string): QuizCard | undefined {
  return CARDS_BY_ID.get(quiz);
}

/** Narrows a name from the server to a quiz the site can link to. */
export function isQuizId(quiz: string): quiz is QuizId {
  return CARDS_BY_ID.has(quiz);
}
