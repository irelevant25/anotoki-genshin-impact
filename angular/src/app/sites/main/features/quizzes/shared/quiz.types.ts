/**
 * The shape the six quizzes share.
 *
 * Five of them ask the same question - "which character is this?" - and differ
 * only in what they show you: a namecard, a special dish, a pixelated portrait,
 * a demo track, a voice line. Mismatch is the odd one, asking you to pick the
 * character that does not belong.
 *
 * Ported from the old site's data/config.js, where the same numbers lived.
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

/** One difficulty of one quiz. */
export interface QuizLevel {
  readonly triesMax?: number;
  readonly triesEffects?: QuizEffect[];
  /** Mismatch only: how many characters are on offer. */
  readonly choicesAmount?: number;
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
  /** Mismatch keeps its whole set, since it cannot be redrawn from one name. */
  choicesAmount?: number;
  options?: string[];
  answer?: string;
  quizProperty?: string;
  commonValue?: string;
  /** Voice keeps the line it drew, which is not derivable from the character. */
  voiceOverId?: number;
}

/** 1 easy, 2 medium, 3 hard - the numbers the config is keyed by. */
export const QUIZ_DIFFICULTIES = [1, 2, 3] as const;

export function difficultyName(difficulty: number): string {
  return difficulty === 3 ? 'hard' : difficulty === 2 ? 'medium' : 'easy';
}
