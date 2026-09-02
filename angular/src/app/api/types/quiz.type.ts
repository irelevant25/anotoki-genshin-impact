/**
 * Playing a quiz: the saved game, the result of a question, the running totals.
 *
 * Hand-written. A saved game's `state` is deliberately opaque here - it is the
 * front end's own shape, stored as it arrives. What is in it is the browser's
 * business; only who it belongs to is the server's.
 */

export interface QuizProgressRequest<TState = unknown> {
  state: TState;
  is_daily?: boolean;
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

