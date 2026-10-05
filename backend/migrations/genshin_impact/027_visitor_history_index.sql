-----------------------------------------------------------
-- THE QUIZ HISTORY, BY PLAYER
--
-- Finished (2026-10-05): written whole, never edited after. The owner
-- applies it with users/045 (the visitors).
--
-- user_quiz_history - one row per question played - had no index on the
-- player: every read of one player's rows went through the whole log. The
-- Profile page reads a player's rows four ways, and since users/045 three
-- more things do too: the limit on how many answers a visitor keeps, the
-- sweep that deletes a visitor unseen for 30 days, and the move of a
-- visitor's statistics into an account at sign-in.
--
-- It lives in this folder because the table does: users/ runs first on a
-- fresh install, before this folder makes the quiz tables. Nothing needs it
-- to be correct - with it pending everything works, only slower.
-----------------------------------------------------------

CREATE INDEX IF NOT EXISTS user_quiz_history_by_user ON user_quiz_history (user_id, created_at);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_index i
                     JOIN pg_class c ON c.oid = i.indexrelid
                    WHERE i.indrelid = 'user_quiz_history'::regclass AND c.relname = 'user_quiz_history_by_user') THEN
        RAISE EXCEPTION 'user_quiz_history has no index user_quiz_history_by_user';
    END IF;
END $$;
