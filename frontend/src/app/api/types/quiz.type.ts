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
 * The games this browser kept for itself, carried into whoever the request is
 * (`POST /api/quiz/progress/carry`) - at most twelve: six quizzes, each a free
 * game and a daily one. Per game the account's own stays where it has one; a
 * daily of another day never moves; a game nobody has played yet is skipped.
 */
export interface QuizCarryRequest<TState = unknown> {
  games: { quiz: string; is_daily: boolean; state: TState }[];
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

