-----------------------------------------------------------
-- SPLASH AND CONSTELLATION IN THE SAVED LEVELS (2026-10-29)
--
-- Two quizzes come with this release (users/072, genshin_impact/035), and the
-- rules (api/quiz_levels.php) want every quiz's three levels in a saved row,
-- as they want every key of every level. The levels saved on the Quiz levels
-- page before this release (quiz_levels, users/061) have neither quiz, and
-- the rules would read them as none: every quiz back on the built-in levels,
-- whatever else was saved. So a saved row is given the two quizzes' built-in
-- levels (the frontend's QUIZ_LEVELS, quiz-levels.ts), three tries each, the
-- owner's choice of 2026-10-29:
--
--   splash         "1" the whole silhouette on every try
--                  "2" its left half, then all of it
--                  "3" its left quarter, then half, then all of it
--   constellation  "1" half in grey, then all of it in grey, then in colour
--                  "2" a quarter in grey, then half, then all of it in grey
--                  "3" a quarter in grey, then half, then all of it in a
--                      misleading colour
--
-- each only where the row has no such quiz, never over one it has, and
-- nothing else in the row changes: the other quizzes, the time it was saved
-- (nobody saved this). With nothing saved, as on a new installation, there
-- is nothing to do. (A row's levels are always an object: users/061's CHECK.)
--
-- Apply it after the upload, as every file of this release: until it runs,
-- the new build reads the saved levels as none, and the site is closed to
-- everybody but its ADMIN meanwhile. A build from before this file takes no
-- level of a quiz it does not know (its rules want exactly six): once this
-- has run it would play its built-in levels, so an older build never goes on
-- the host again.
-----------------------------------------------------------

-- The row as it stands, and the two quizzes' built-in levels, for the
-- updates and the gate: gone with this file's transaction.
CREATE TEMPORARY TABLE quiz_levels_073_before ON COMMIT DROP AS
    SELECT id, levels, updated_at FROM quiz_levels;

CREATE TEMPORARY TABLE quiz_levels_073_builtin (quiz TEXT PRIMARY KEY, levels JSONB NOT NULL) ON COMMIT DROP;

INSERT INTO quiz_levels_073_builtin (quiz, levels) VALUES
    ('splash', '{
        "1": {"triesMax": 3, "triesEffects": [{"try": 0, "class": "shown-silhouette"}, {"try": 1, "class": "shown-silhouette"}, {"try": 2, "class": "shown-silhouette"}]},
        "2": {"triesMax": 3, "triesEffects": [{"try": 0, "class": "shown-half shown-silhouette"}, {"try": 1, "class": "shown-silhouette"}, {"try": 2, "class": "shown-silhouette"}]},
        "3": {"triesMax": 3, "triesEffects": [{"try": 0, "class": "shown-quarter shown-silhouette"}, {"try": 1, "class": "shown-half shown-silhouette"}, {"try": 2, "class": "shown-silhouette"}]}
    }'),
    ('constellation', '{
        "1": {"triesMax": 3, "triesEffects": [{"try": 0, "class": "shown-half shown-grey"}, {"try": 1, "class": "shown-grey"}, {"try": 2}]},
        "2": {"triesMax": 3, "triesEffects": [{"try": 0, "class": "shown-quarter shown-grey"}, {"try": 1, "class": "shown-half shown-grey"}, {"try": 2, "class": "shown-grey"}]},
        "3": {"triesMax": 3, "triesEffects": [{"try": 0, "class": "shown-quarter shown-grey"}, {"try": 1, "class": "shown-half shown-grey"}, {"try": 2, "class": "shown-misleading"}]}
    }');

-----------------------------------------------------------
-- EACH QUIZ WHERE THE ROW HAS NONE
--
-- Of jsonb's ||, the right-hand object's keys win: the quiz is added under
-- its name, and only to a row without it.
-----------------------------------------------------------

UPDATE quiz_levels q
   SET levels = q.levels || jsonb_build_object('splash', b.levels)
  FROM quiz_levels_073_builtin b
 WHERE b.quiz = 'splash'
   AND (q.levels -> 'splash') IS NULL;

UPDATE quiz_levels q
   SET levels = q.levels || jsonb_build_object('constellation', b.levels)
  FROM quiz_levels_073_builtin b
 WHERE b.quiz = 'constellation'
   AND (q.levels -> 'constellation') IS NULL;

-----------------------------------------------------------
-- PROVE IT
--
-- Judged here on its own, not by the statements above: no saved row of
-- levels is without either quiz; no row was made or lost; and the row
-- changed only by them - a quiz it had as it was, one it lacked the built-in
-- one, everything else as it was, the time it was saved too.
-----------------------------------------------------------

DO $$
DECLARE
    lacking TEXT;
    saved RECORD;
    expected JSONB;
    changed TEXT;
BEGIN
    SELECT string_agg(b.quiz, ', ' ORDER BY b.quiz) INTO lacking
      FROM quiz_levels q
     CROSS JOIN quiz_levels_073_builtin b
     WHERE (q.levels -> b.quiz) IS NULL;
    IF lacking IS NOT NULL THEN
        RAISE EXCEPTION 'users/073: saved levels still without: %', lacking;
    END IF;

    IF (SELECT count(*) FROM quiz_levels) <> (SELECT count(*) FROM quiz_levels_073_before) THEN
        RAISE EXCEPTION 'users/073: quiz_levels holds % rows, where it held %',
            (SELECT count(*) FROM quiz_levels), (SELECT count(*) FROM quiz_levels_073_before);
    END IF;

    FOR saved IN
        SELECT b.levels AS before_levels, q.levels AS after_levels, q.updated_at IS DISTINCT FROM b.updated_at AS time_moved
          FROM quiz_levels_073_before b
          JOIN quiz_levels q ON q.id = b.id
    LOOP
        -- What the row should hold now: what it held, and each quiz it had none of, the built-in one.
        SELECT saved.before_levels || COALESCE(jsonb_object_agg(b.quiz, b.levels), '{}'::jsonb) INTO expected
          FROM quiz_levels_073_builtin b
         WHERE (saved.before_levels -> b.quiz) IS NULL;

        SELECT string_agg(COALESCE(e.key, n.key), ', ' ORDER BY COALESCE(e.key, n.key)) INTO changed
          FROM jsonb_each(expected) AS e
          FULL JOIN jsonb_each(saved.after_levels) AS n ON n.key = e.key
         WHERE e.value IS DISTINCT FROM n.value;
        IF changed IS NOT NULL THEN
            RAISE EXCEPTION 'users/073: the saved levels changed other than by the quizzes they lacked: %', changed;
        END IF;

        IF saved.time_moved THEN
            RAISE EXCEPTION 'users/073: the time the levels were saved moved, though nobody saved them';
        END IF;
    END LOOP;
END $$;
