/**
 * The quizzes' levels, as the admin Quiz levels page sends them to be checked
 * or saved.
 *
 * Hand-written: the levels are the frontend's own shape (quiz-levels.ts,
 * QUIZ_LEVELS), which a PHP constructor has no way to describe - and the page
 * sends whatever its editor holds, as JSON, for the server's rules to say
 * what is wrong with it (api/quiz_levels.php).
 */
export interface QuizLevelsSaveRequest {
  levels: unknown;
}
