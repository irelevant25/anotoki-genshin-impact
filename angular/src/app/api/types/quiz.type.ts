/**
 * Playing a quiz: the saved game, the result of a question, the running totals.
 *
 * Hand-written. A saved game's `state` is deliberately opaque here - it is the
 * front end's own shape, stored as it arrives. What is in it is the browser's
 * business; only who it belongs to is the server's.
 */

/** One saved game, as `GET /api/quiz/progress` lists them. */
export interface QuizProgress<TState = unknown> {
  /** The quiz's name, which is what the URL uses. */
  quiz: string;
  state: TState;
  is_daily: boolean;
}

export interface QuizProgressRequest<TState = unknown> {
  state: TState;
  is_daily?: boolean;
}

export interface QuizProgressSaved {
  quiz: string;
  is_daily: boolean;
}

export interface QuizProgressDeleted {
  deleted: number;
}

/**
 * One finished question.
 *
 * Two tables are written and they have to agree: the log of what happened and
 * the running total. Both are written or neither is.
 */
export interface QuizResultRequest {
  quiz: string;
  character_id: number;
  win?: boolean;
  attempts?: number;
  difficulty?: number | null;
}

export interface QuizResultAck {
  recorded: boolean;
}

/** A player's totals for one character in one quiz. */
export interface QuizStatsRow {
  quiz: string;
  character_id: number;
  character_name: string;
  icon_name: string | null;
  wins: number;
  losses: number;
  attempts: number;
}

export type QuizStats = QuizStatsRow[];

/**
 * A voice over drawn at random, with the character it belongs to.
 *
 * Only lines with both English audio and English text are drawn, and the
 * Travellers are left out - one character across twelve rows would meet
 * themselves.
 */
export interface QuizVoiceOverRound {
  id: number;
  type: string;
  title_english: string;
  text_english: string;
  audio_english: string;
  character_id: number;
  character_name: string;
  icon_name: string | null;
  wish_icon_name: string | null;
  rarity: number;
  element: string;
}
