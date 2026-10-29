-----------------------------------------------------------
-- SPLASH AND CONSTELLATION, TWO NEW QUIZZES (2026-10-29)
--
-- The owner's request of 2026-10-29: two more "which character is this?"
-- quizzes - Splash, from the silhouette of the character's wish art
-- (character/wish_icon), and Constellation, from their constellation
-- (character/constellation). A player's saved games, results and statistics
-- name a quiz by its row here (quizzes_states, user_quiz_history and
-- quiz_stats_history have a foreign key into it; the routes look a quiz up by
-- name - api/routes/genshin_impact/endpoints/quiz_progress.php), so until the
-- two have rows nothing of theirs can be saved: a guess answers 404 "Unknown
-- quiz". The names are the ids the frontend uses (quiz.types.ts' QuizId).
--
-- `name` has no unique constraint (genshin_impact/001), so each row goes in
-- only where no row of that name is: applied over a database that has them,
-- this does nothing.
-----------------------------------------------------------

INSERT INTO quizzes (name)
SELECT v.name
  FROM (VALUES ('splash'), ('constellation')) AS v(name)
 WHERE NOT EXISTS (SELECT 1 FROM quizzes q WHERE q.name = v.name);

-- Each of the two once, and live: a quiz soft-deleted, or twice, is one the
-- routes would not find, or would find twice.
DO $$
DECLARE
    wrong TEXT;
BEGIN
    SELECT string_agg(format('%s (%s live of %s)', v.name, coalesce(c.live, 0), coalesce(c.total, 0)), ', ' ORDER BY v.name) INTO wrong
      FROM (VALUES ('splash'), ('constellation')) AS v(name)
      LEFT JOIN (
          SELECT name, count(*) FILTER (WHERE NOT deleted) AS live, count(*) AS total
            FROM quizzes
           GROUP BY name
      ) c ON c.name = v.name
     WHERE coalesce(c.live, 0) <> 1 OR coalesce(c.total, 0) <> 1;
    IF wrong IS NOT NULL THEN
        RAISE EXCEPTION 'genshin_impact/035: each new quiz is one live row of quizzes: %', wrong;
    END IF;
END $$;
