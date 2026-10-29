/**
 * The shape the six quizzes share.
 *
 * Five of them ask the same question - "which character is this?" - and differ
 * only in what they show you: a namecard, a special dish, a pixelated portrait,
 * a demo track, a voice line. Mismatch is the odd one, asking you to pick the
 * character that does not belong.
 *
 * Their levels, one per difficulty, are in quiz-levels.ts.
 */

export type QuizId = 'banners' | 'dish' | 'pixelate' | 'mismatch' | 'music' | 'voice';

/**
 * What the question looks like after a given number of tries.
 *
 * The two payloads are alternatives, not a pair: an image quiz hides its answer
 * behind CSS (`class`), while pixelate and the two audio quizzes need a number
 * (`data`) - a pixel size, or how many seconds of the clip may be heard. An
 * entry with neither is a try where nothing is hidden any more.
 */
export interface QuizEffect {
  readonly try: number;
  readonly class?: string;
  readonly data?: number;
}

/**
 * What a Mismatch question can be about: all but one of its characters share
 * an element, a weapon type, a region, an era (the version they came out in -
 * 1.x, 2.x, Luna...) or an affiliation (mismatch-sets.ts).
 */
export type MismatchProperty = 'element' | 'weapon' | 'region' | 'era' | 'affiliation';

/** Every Mismatch property, in the order the levels list them (and the server's rules, backend api/quiz_levels.php). */
export const MISMATCH_PROPERTIES: readonly MismatchProperty[] = ['element', 'weapon', 'region', 'era', 'affiliation'];

/** One difficulty of one quiz. */
export interface QuizLevel {
  readonly triesMax?: number;
  readonly triesEffects?: QuizEffect[];
  /** Mismatch only: how many characters are on offer. */
  readonly choicesAmount?: number;
  /** Mismatch only: what a question can be about. */
  readonly properties?: readonly MismatchProperty[];
  /**
   * Mismatch only: how many sets are drawn for a question, the one whose odd
   * one out looks most like the others kept - 1 is the first set drawn.
   */
  readonly blend?: number;
}

/**
 * What is kept so a reload does not throw the question away.
 *
 * The character is stored by name rather than as a row: the rows come from the
 * API and can change under a saved game, whereas a name either still resolves
 * or does not.
 */
export interface QuizState {
  questionEntity?: string;
  tries: string[];
  triesMax: number;
  triesEffects: QuizEffect[];
  isQuestionComplete: boolean;
  difficulty: number;
  /**
   * Whether it was won, recorded rather than worked out again later.
   *
   * The Daily page needs to say won or lost without loading each quiz, and
   * mismatch could not answer that anyway - it keeps the set and the answer,
   * not which face was clicked.
   */
  isSuccess?: boolean;
  /**
   * The day a daily game belongs to, as YYYY-MM-DD in UTC.
   *
   * A daily game is stored in the same slot every day, so without this
   * yesterday's finished question would come back as today's. Absent on an
   * ordinary game, which has no expiry.
   */
  date?: string;
  /** Mismatch keeps its whole set, since it cannot be redrawn from one name. */
  choicesAmount?: number;
  options?: string[];
  answer?: string;
  quizProperty?: string;
  commonValue?: string;
  /** Voice keeps the line it drew, which is not derivable from the character. */
  voiceOverId?: number;
}

/** 1 easy, 2 medium, 3 hard - the numbers the levels are keyed by (quiz-levels.ts). */
export const QUIZ_DIFFICULTIES = [1, 2, 3] as const;

export function difficultyName(difficulty: number): string {
  return difficulty === 3 ? 'hard' : difficulty === 2 ? 'medium' : 'easy';
}
