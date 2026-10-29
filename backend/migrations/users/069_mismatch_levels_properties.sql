-----------------------------------------------------------
-- MISMATCH'S LEVELS SAY WHAT A QUESTION IS ABOUT, AND HOW ALIKE (2026-10-29)
--
-- A Mismatch level was {choicesAmount}: how many characters a question
-- shows. More of them alone make a set no harder - each one more shows what
-- the rest share -, so from this release a level says two things more, and
-- the rules (api/quiz_levels.php) want both on every level, as they want
-- every key of every level:
--
--   properties  what a question can be about: one or more of element,
--               weapon, region, era and affiliation, each once, kept in that
--               order
--   blend       how many sets are drawn for a question, the one whose odd
--               one out looks most like the others kept: 1 to 30, 1 the
--               first set drawn
--
-- The levels saved on the Quiz levels page before this release (quiz_levels,
-- users/061) have neither - the rules took nothing but choicesAmount then -,
-- and the rules would read them as none: every quiz back on the built-in
-- levels, whatever else was saved. So each Mismatch level of the saved row is
-- given the built-in level's (the frontend's QUIZ_LEVELS, quiz-levels.ts):
--
--   "1" (Easy)    element, weapon and region        blend 1
--   "2" (Medium)  element, weapon, region and era   blend 8
--   "3" (Hard)    region, era and affiliation       blend 20
--
-- each only where the level has no such key, never over one it has, and
-- nothing else in the row changes: the other quizzes, each level's
-- choicesAmount, the time it was saved (nobody saved this). With nothing
-- saved, as on a new installation, there is nothing to do. A row the rules
-- did not take before this file either - a quiz or a level missing, a level
-- that is no object - is not mended: a level that is an object is given
-- what it lacks as in any row, anything else is left as it is, and the row
-- is read as none as it was.
--
-- Apply it after the upload, as every file of this release: until it runs,
-- the new build reads the saved levels as none, and the site is closed to
-- everybody but its ADMIN meanwhile. A build from before this file takes no
-- Mismatch level with these keys (its rules wanted choicesAmount alone):
-- once this has run it would play its built-in levels, so an older build
-- never goes on the host again.
-----------------------------------------------------------

-- The row as it stands, for the gate: gone with this file's transaction.
CREATE TEMPORARY TABLE quiz_levels_069_before ON COMMIT DROP AS
    SELECT id, levels, updated_at FROM quiz_levels;

-----------------------------------------------------------
-- EACH LEVEL GIVEN WHAT IT LACKS
--
-- The built-in level's two keys under the level's own: of jsonb's ||, the
-- right-hand object's keys win, so a key the level has stays as it is. Only
-- a level that is an object, of a Mismatch that is one: on a list, a path's
-- "1" would be its second item.
-----------------------------------------------------------

UPDATE quiz_levels
   SET levels = jsonb_set(levels, '{mismatch,1}', '{"properties": ["element", "weapon", "region"], "blend": 1}'::jsonb || (levels #> '{mismatch,1}'))
 WHERE jsonb_typeof(levels -> 'mismatch') = 'object'
   AND jsonb_typeof(levels #> '{mismatch,1}') = 'object'
   AND ((levels #> '{mismatch,1,properties}') IS NULL OR (levels #> '{mismatch,1,blend}') IS NULL);

UPDATE quiz_levels
   SET levels = jsonb_set(levels, '{mismatch,2}', '{"properties": ["element", "weapon", "region", "era"], "blend": 8}'::jsonb || (levels #> '{mismatch,2}'))
 WHERE jsonb_typeof(levels -> 'mismatch') = 'object'
   AND jsonb_typeof(levels #> '{mismatch,2}') = 'object'
   AND ((levels #> '{mismatch,2,properties}') IS NULL OR (levels #> '{mismatch,2,blend}') IS NULL);

UPDATE quiz_levels
   SET levels = jsonb_set(levels, '{mismatch,3}', '{"properties": ["region", "era", "affiliation"], "blend": 20}'::jsonb || (levels #> '{mismatch,3}'))
 WHERE jsonb_typeof(levels -> 'mismatch') = 'object'
   AND jsonb_typeof(levels #> '{mismatch,3}') = 'object'
   AND ((levels #> '{mismatch,3,properties}') IS NULL OR (levels #> '{mismatch,3,blend}') IS NULL);

-----------------------------------------------------------
-- PROVE IT
--
-- Judged here on its own, not by the statements above: no Mismatch level of
-- a saved row is without properties or blend; no row was made or lost; and
-- the row changed only by them - each level's own where it had one, the
-- built-in level's where it had none, everything else as it was, the time it
-- was saved too.
-----------------------------------------------------------

DO $$
DECLARE
    lacking TEXT;
    saved RECORD;
    builtin RECORD;
    expected JSONB;
    changed TEXT;
BEGIN
    SELECT string_agg(d.level, ', ' ORDER BY d.level) INTO lacking
      FROM quiz_levels q
     CROSS JOIN (VALUES ('1'), ('2'), ('3')) AS d(level)
     WHERE jsonb_typeof(q.levels -> 'mismatch') = 'object'
       AND jsonb_typeof(q.levels -> 'mismatch' -> d.level) = 'object'
       AND ((q.levels -> 'mismatch' -> d.level -> 'properties') IS NULL
            OR (q.levels -> 'mismatch' -> d.level -> 'blend') IS NULL);
    IF lacking IS NOT NULL THEN
        RAISE EXCEPTION 'users/069: saved Mismatch levels still without properties or blend: %', lacking;
    END IF;

    IF (SELECT count(*) FROM quiz_levels) <> (SELECT count(*) FROM quiz_levels_069_before) THEN
        RAISE EXCEPTION 'users/069: quiz_levels holds % rows, where it held %',
            (SELECT count(*) FROM quiz_levels), (SELECT count(*) FROM quiz_levels_069_before);
    END IF;

    FOR saved IN
        SELECT b.levels AS before_levels, q.levels AS after_levels, q.updated_at IS DISTINCT FROM b.updated_at AS time_moved
          FROM quiz_levels_069_before b
          JOIN quiz_levels q ON q.id = b.id
    LOOP
        -- What the row should hold now: what it held, each Mismatch level that is an object with its own properties
        -- and blend, or the built-in level's.
        expected := saved.before_levels;
        IF jsonb_typeof(expected -> 'mismatch') = 'object' THEN
            FOR builtin IN
                SELECT *
                  FROM (VALUES
                      ('1', '["element", "weapon", "region"]'::jsonb, '1'::jsonb),
                      ('2', '["element", "weapon", "region", "era"]'::jsonb, '8'::jsonb),
                      ('3', '["region", "era", "affiliation"]'::jsonb, '20'::jsonb)
                  ) AS d(level, properties, blend)
            LOOP
                IF jsonb_typeof(expected -> 'mismatch' -> builtin.level) = 'object' THEN
                    expected := jsonb_set(
                        expected,
                        ARRAY['mismatch', builtin.level],
                        (expected -> 'mismatch' -> builtin.level) || jsonb_build_object(
                            'properties', COALESCE(expected -> 'mismatch' -> builtin.level -> 'properties', builtin.properties),
                            'blend', COALESCE(expected -> 'mismatch' -> builtin.level -> 'blend', builtin.blend)));
                END IF;
            END LOOP;
        END IF;

        SELECT string_agg(COALESCE(e.key, n.key), ', ' ORDER BY COALESCE(e.key, n.key)) INTO changed
          FROM jsonb_each(expected) AS e
          FULL JOIN jsonb_each(saved.after_levels) AS n ON n.key = e.key
         WHERE e.value IS DISTINCT FROM n.value;
        IF changed IS NOT NULL THEN
            RAISE EXCEPTION 'users/069: the saved levels changed other than by what their Mismatch levels lacked: %', changed;
        END IF;

        IF saved.time_moved THEN
            RAISE EXCEPTION 'users/069: the time the levels were saved moved, though nobody saved them';
        END IF;
    END LOOP;
END $$;
