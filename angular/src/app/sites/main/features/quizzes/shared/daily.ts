import { QuizId, QuizState } from './quiz.types';

/** Every quiz the daily draw can pick from. */
export const ALL_QUIZZES: QuizId[] = ['banners', 'dish', 'pixelate', 'mismatch', 'music', 'voice'];

/** How many are set each day. Two, as on the old site. */
export const DAILY_COUNT = 2;

/** Today in UTC, which is where the day turns - the header has always said 00:00 UTC. */
export function todayString(): string {
  return new Date().toJSON().slice(0, 10);
}

/**
 * The quizzes set for a given day.
 *
 * Worked out from the date rather than drawn once and remembered. The old site
 * shuffled on the first visit of the day and stored the result, which meant the
 * two quizzes were yours alone - and now that progress lives on the account,
 * that would show as one machine offering banners and music while another
 * offered dish and voice, sharing the answers between them.
 *
 * Deriving it from the date fixes that, and it is what a daily challenge wants
 * anyway: everyone has the same two, there is nothing to store, and clearing
 * the browser cannot reroll a bad draw.
 */
export function dailyQuizzes(date: string = todayString()): QuizId[] {
  const random = seededRandom(date);
  const pool = [...ALL_QUIZZES];

  // Fisher-Yates, but only as far as the entries actually taken.
  for (let i = 0; i < DAILY_COUNT; i++) {
    const pick = i + Math.floor(random() * (pool.length - i));
    [pool[i], pool[pick]] = [pool[pick], pool[i]];
  }

  return pool.slice(0, DAILY_COUNT);
}

/**
 * A small deterministic generator, seeded from a string.
 *
 * Math.random cannot be seeded, and this needs the same answer on every machine
 * for a given day. mulberry32 over a cheap string hash is plenty for choosing
 * two of six - it is picking a quiz, not protecting anything.
 */
function seededRandom(seed: string): () => number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  let state = hash >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** How a daily quiz stands today: untouched, part-played, won or lost. */
export type DailyStatus = 'new' | 'started' | 'won' | 'lost';

/**
 * Reads the status off a saved game.
 *
 * A game from another day counts as untouched: the slot is reused each day, so
 * yesterday's win would otherwise still be showing this morning.
 */
export function dailyStatus(state: QuizState | undefined, date: string = todayString()): DailyStatus {
  if (!state || state.date !== date) {
    return 'new';
  }

  if (state.isQuestionComplete) {
    return state.isSuccess ? 'won' : 'lost';
  }

  // Mismatch is one click, so it is only ever untouched or finished; the others
  // are under way from the first guess.
  return state.tries?.length ? 'started' : 'new';
}
