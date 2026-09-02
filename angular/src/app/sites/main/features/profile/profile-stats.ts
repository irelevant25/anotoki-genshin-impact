import { QuizActivityDay, QuizDifficultyRow, QuizStatsRow } from '../../../../api';
import { QUIZ_CATALOG, QuizCard } from '../quizzes/shared/quiz-catalog';
import { QuizId } from '../quizzes/shared/quiz.types';

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
 * difficulty nor the date survives into the lifetime totals.
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
  const unknown = [...buckets.entries()]
    .filter(([id]) => !catalogued.has(id))
    .map(([id, counted]) => ({ id, totals: complete(counted) }));

  return [...known, ...unknown];
}

/** One entry per character met, busiest first, then alphabetically. */
export function byCharacter(rows: readonly QuizStatsRow[]): CharacterBreakdown[] {
  const buckets = new Map<number, Counted>();
  const names = new Map<number, QuizStatsRow>();

  rows.forEach((row) => {
    accumulate(buckets, row.character_id, row);
    names.set(row.character_id, row);
  });

  return [...buckets.entries()]
    .map(([characterId, counted]) => {
      const row = names.get(characterId)!;
      return {
        characterId,
        name: row.character_name,
        // Same fallback the rest of the site uses: some rows have no icon
        // filed, and the name is what the asset is named after anyway.
        icon: row.icon_name ?? row.character_name,
        totals: complete(counted),
      };
    })
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
