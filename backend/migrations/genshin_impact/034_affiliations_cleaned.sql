-----------------------------------------------------------
-- THE CHARACTERS' AFFILIATIONS, EACH NAME MEANING THE SAME ON EVERY CHARACTER
--
-- characters.affiliations is a JSONB array of names, each perhaps with a note
-- in brackets after it: "Knights of Favonius (formerly)", "Yae Publishing
-- House (as Calx)". The character page shows each as it is, and since
-- 2026-10-29 the Mismatch quiz asks about them - "all but one of these are
-- Knights of Favonius" -, for which a name has to mean the same on every
-- character (the owner's decisions of 2026-10-29):
--
--   - "(on profile)" - where the game's profile of the character lists it -
--     was written on 80 of them (56 names), and left off others where the
--     profile lists them all the same: Jean, Kaeya and Lisa were "Knights of
--     Favonius (on profile)", Amber, Klee and Noelle "Knights of Favonius";
--     and the page showed it as part of the name. It
--     goes, everywhere: what is left is the name. A note that changes what
--     the name says - formerly, graduate, disciple, as Owl... - stays, and the
--     quiz never asks about somebody it is written on.
--   - "None (on profile)", Wanderer's: no affiliation is no affiliation.
--   - Two things the data says without writing them down: Xiao's "Liyue
--     Adeptus (on profile)" is one of the Adepti - Ganyu, Xianyun, Yanfei and
--     Zhongli are "Adepti" -, so it is "Adepti"; and a former Harbinger
--     (Columbina, Wanderer: "Eleven Fatui Harbingers (formerly)") was of the
--     Fatui, so "Fatui (formerly)" is added where no Fatui is said.
--
-- Every row is gone through by what it holds, deleted ones too - never by a
-- list of names and values written here, so an edit made on the host since
-- is kept. A name met twice once its note is off is kept once, where it first
-- stood. Only a list of names - an array of strings - is touched, and only a
-- row this changes is written, its updated_at moving with it; NULL, an empty
-- list and anything else stay as they are. A second run finds nothing to do.
-----------------------------------------------------------

-- 1. Whether a list is one this file reads: an array of strings and nothing
--    else. This file's own, in the session's temporary schema, like the next;
--    both dropped at its end.
CREATE OR REPLACE FUNCTION pg_temp.affiliations_named_034(stored JSONB) RETURNS BOOLEAN
LANGUAGE sql IMMUTABLE AS $$
    SELECT stored IS NOT NULL
       AND jsonb_typeof(stored) = 'array'
       AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(stored) AS item(value) WHERE jsonb_typeof(item.value) <> 'string')
$$;

-- 2. A list with its "(on profile)" notes off, each name once where it first
--    stood, blanks and "None" out; any other value as it is.
CREATE OR REPLACE FUNCTION pg_temp.affiliations_cleaned_034(stored JSONB) RETURNS JSONB
LANGUAGE sql IMMUTABLE AS $$
    SELECT CASE
        WHEN NOT pg_temp.affiliations_named_034(stored) THEN stored
        ELSE COALESCE((
            SELECT jsonb_agg(kept.entry ORDER BY kept.first_at)
              FROM (
                SELECT named.entry, min(named.at) AS first_at
                  FROM (
                    SELECT btrim(regexp_replace(item.value, '\s*\(on profile\)\s*$', '', 'i')) AS entry, item.at
                      FROM jsonb_array_elements_text(stored) WITH ORDINALITY AS item(value, at)
                  ) named
                 WHERE named.entry NOT IN ('', 'None')
                 GROUP BY named.entry
              ) kept
        ), '[]'::jsonb)
    END
$$;

-- 3. Every list as it stands, for the gate: gone with this file's transaction.
CREATE TEMPORARY TABLE affiliations_034_before ON COMMIT DROP AS
    SELECT id, name, affiliations FROM characters WHERE pg_temp.affiliations_named_034(affiliations);

-- 4. The notes off, in every list that has one - or a name twice, a blank, a "None".
UPDATE characters
   SET affiliations = pg_temp.affiliations_cleaned_034(affiliations)
 WHERE affiliations IS DISTINCT FROM pg_temp.affiliations_cleaned_034(affiliations);

-- 5. Xiao among the Adepti, where his list still names him by the profile's word for one.
UPDATE characters
   SET affiliations = (
       SELECT jsonb_agg(CASE WHEN item.value = 'Liyue Adeptus' THEN 'Adepti' ELSE item.value END ORDER BY item.at)
         FROM jsonb_array_elements_text(affiliations) WITH ORDINALITY AS item(value, at)
   )
 WHERE name = 'Xiao'
   AND pg_temp.affiliations_named_034(affiliations)
   AND affiliations @> '["Liyue Adeptus"]'
   AND NOT affiliations @> '["Adepti"]';

-- 6. A former Harbinger, a former one of the Fatui - where no Fatui is said at all.
UPDATE characters
   SET affiliations = affiliations || '["Fatui (formerly)"]'::jsonb
 WHERE pg_temp.affiliations_named_034(affiliations)
   AND affiliations @> '["Eleven Fatui Harbingers (formerly)"]'
   AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements_text(affiliations) AS item(value) WHERE item.value ~ '^Fatui( \(.*\))?$');

-- 7. Prove it: no "(on profile)", blank or "None" is left, and no name twice;
--    every list holds the names it held, notes off - but Xiao's Liyue Adeptus,
--    now the Adepti - and nothing more but a former Harbinger's Fatui; Xiao
--    is among the Adepti; and every former Harbinger says a Fatui.
DO $$
DECLARE
    marked TEXT;
    twice TEXT;
    changed TEXT;
    adeptus TEXT;
    harbingers TEXT;
BEGIN
    SELECT string_agg(DISTINCT lists.name, ', ') INTO marked
      FROM (SELECT name, affiliations FROM characters WHERE pg_temp.affiliations_named_034(affiliations)) lists
     CROSS JOIN LATERAL jsonb_array_elements_text(lists.affiliations) AS item(value)
     WHERE item.value ~* '\(on profile\)\s*$' OR btrim(item.value) IN ('', 'None');
    IF marked IS NOT NULL THEN
        RAISE EXCEPTION 'genshin_impact/034: affiliations still marked "(on profile)", blank or "None": %', marked;
    END IF;

    SELECT string_agg(lists.name, ', ' ORDER BY lists.name) INTO twice
      FROM (SELECT name, affiliations FROM characters WHERE pg_temp.affiliations_named_034(affiliations)) lists
     WHERE (SELECT count(*) FROM jsonb_array_elements_text(lists.affiliations)) <> (SELECT count(DISTINCT value) FROM jsonb_array_elements_text(lists.affiliations));
    IF twice IS NOT NULL THEN
        RAISE EXCEPTION 'genshin_impact/034: an affiliation named twice in one list: %', twice;
    END IF;

    SELECT string_agg(DISTINCT was.name || ' #' || was.id, ', ') INTO changed
      FROM affiliations_034_before was
      JOIN characters now ON now.id = was.id
     WHERE NOT pg_temp.affiliations_named_034(now.affiliations)
        OR EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(pg_temp.affiliations_cleaned_034(was.affiliations)) AS held(value)
             WHERE NOT now.affiliations @> jsonb_build_array(held.value)
               AND NOT (was.name = 'Xiao' AND held.value = 'Liyue Adeptus'))
        OR EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(now.affiliations) AS held(value)
             WHERE NOT pg_temp.affiliations_cleaned_034(was.affiliations) @> jsonb_build_array(held.value)
               AND NOT (was.name = 'Xiao' AND held.value = 'Adepti')
               AND held.value <> 'Fatui (formerly)');
    IF changed IS NOT NULL THEN
        RAISE EXCEPTION 'genshin_impact/034: lists changed beyond their notes: %', changed;
    END IF;

    SELECT string_agg(name || ' #' || id, ', ' ORDER BY id) INTO adeptus
      FROM characters
     WHERE name = 'Xiao' AND pg_temp.affiliations_named_034(affiliations) AND affiliations @> '["Liyue Adeptus"]' AND NOT affiliations @> '["Adepti"]';
    IF adeptus IS NOT NULL THEN
        RAISE EXCEPTION 'genshin_impact/034: Xiao is not among the Adepti: %', adeptus;
    END IF;

    SELECT string_agg(name, ', ' ORDER BY name) INTO harbingers
      FROM characters
     WHERE pg_temp.affiliations_named_034(affiliations)
       AND affiliations @> '["Eleven Fatui Harbingers (formerly)"]'
       AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements_text(affiliations) AS item(value) WHERE item.value ~ '^Fatui( \(.*\))?$');
    IF harbingers IS NOT NULL THEN
        RAISE EXCEPTION 'genshin_impact/034: former Harbingers with no Fatui said: %', harbingers;
    END IF;
END $$;

DROP FUNCTION pg_temp.affiliations_cleaned_034(JSONB);
DROP FUNCTION pg_temp.affiliations_named_034(JSONB);
