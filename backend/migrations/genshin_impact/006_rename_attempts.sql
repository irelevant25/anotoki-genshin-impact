-----------------------------------------------------------
-- ATTEMPTS, SPELLED THAT WAY
--
-- Both quiz history tables were written with `attemps`. Nothing read it until
-- the quizzes started recording results, and a column that is wrong in only one
-- place is one the next person will misspell again when they write a query
-- against it.
--
-- A rename rather than a drop and an add: the column is NOT NULL and holds
-- however many attempts have been recorded already, which dropping it would
-- throw away.
--
-- Unguarded on purpose. A fresh database replays every migration in order, so
-- 001 always creates the column under the old name before this runs, and the
-- runner splits a file on semicolons without noticing what they are inside -
-- which rules out wrapping these in a DO block that tests for the column first.
-----------------------------------------------------------

ALTER TABLE user_quiz_history RENAME COLUMN attemps TO attempts;

ALTER TABLE quiz_stats_history RENAME COLUMN attemps TO attempts;
