-----------------------------------------------------------
-- QUIZ PROGRESS
--
-- The four quiz tables were written with the schema and then left alone. Three
-- things stop them holding anything.
--
-- First, `quizzes` is empty, and every other quiz table has a foreign key into
-- it, so nothing can be written at all until the six quizzes have rows. The
-- names match the ids the front end already uses for its saved games, which is
-- what lets a state be looked up by the name of the quiz it belongs to.
--
-- Second, `quizzes_states` has an `is_daily` flag that is not part of its
-- primary key, so one player could hold either a daily game or an ordinary one
-- for a quiz, never both - and starting one would overwrite the other. The key
-- takes the flag in.
--
-- Third, `user_quiz_history` records that a question was won or lost but not
-- how hard it was. On the old site every statistic was kept per difficulty,
-- because winning on hard is not the same result as winning on easy, and
-- without the column that distinction cannot be recovered afterwards.
-- `quiz_stats_history` is left as it is - lifetime totals per character, which
-- the per-question rows below can always be re-aggregated into.
--
-- `updated_at` is added alongside so a saved game says when it was last
-- touched, the same as every other table that is written more than once.
-----------------------------------------------------------

INSERT INTO quizzes (name) VALUES
    ('banners'),
    ('dish'),
    ('pixelate'),
    ('mismatch'),
    ('music'),
    ('voice')
ON CONFLICT DO NOTHING;

ALTER TABLE quizzes_states DROP CONSTRAINT IF EXISTS quizzes_states_pkey;

ALTER TABLE quizzes_states ADD PRIMARY KEY (user_id, quiz_id, is_daily);

ALTER TABLE quizzes_states ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;

CREATE OR REPLACE TRIGGER trg_quizzes_states_updated_at
    BEFORE UPDATE ON quizzes_states
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE user_quiz_history ADD COLUMN IF NOT EXISTS difficulty SMALLINT;
