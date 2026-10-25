-----------------------------------------------------------
-- THE LISTS SAVED IN ONE LAYER OF JSON TOO MANY, UNWRAPPED
--
-- A list column - characters.affiliations, how_to_obtain, namecard_sources;
-- weapons.how_to_obtain, effects; foods.events, how_to_obtain, effects;
-- materials.how_to_obtain; artifacts.how_to_obtain_quality_1-5, effects -
-- is a JSONB array of strings, and the API sends each as its raw JSON text,
-- for the page to decode (frontend api/json-columns.ts). From 2026-09-01,
-- when the admin panel moved onto the generated client, which decodes
-- nothing, to 2026-10-25, the character form took that text for the list's
-- one item: each save of a character sent every list it had not touched back
-- as a list of one item, its own JSON, and the API stored it so -
-- ["Wangsheng Funeral Parlor"] became ["[\"Wangsheng Funeral Parlor\"]"], a
-- second save wrapped that again, and an empty list became ["[]"]. The other
-- forms decoded their lists. Since 2026-10-25 every form decodes a list once
-- and sends one it has not touched back as it came.
--
-- This takes the wrapping off where a value is certainly wrapped: a one-item
-- array whose item is the text of a JSON array - repeated while that holds,
-- so a list saved three times comes back as it was before the first. Nothing
-- else changes: NULL, a plain list, a list of several items one of them
-- JSON's text (a line typed beside a wrapped one), an item that is no JSON or
-- JSON of anything but an array, a lone string, an object - each stays as it
-- is, and the form shows it as its lines, to be put right by hand. Every list
-- column is gone through, the characters' (the only ones the bug reached) and
-- the others' with them, deleted rows too; only a row it unwraps is written,
-- its updated_at moving with it. A second run finds nothing to do.
-----------------------------------------------------------

-- 1. A list with the wrapping taken off: while it is a one-item array whose
--    item is a JSON array's text, that array. An item that is no JSON, or
--    JSON of something else, ends it. This file's own, in the session's
--    temporary schema; dropped at its end.
CREATE OR REPLACE FUNCTION pg_temp.list_unwrapped_032(stored JSONB) RETURNS JSONB
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
    inner_list JSONB;
BEGIN
    LOOP
        IF stored IS NULL OR jsonb_typeof(stored) <> 'array' THEN
            RETURN stored;
        END IF;
        IF jsonb_array_length(stored) <> 1 OR jsonb_typeof(stored -> 0) <> 'string' THEN
            RETURN stored;
        END IF;
        BEGIN
            inner_list := (stored ->> 0)::jsonb;
        EXCEPTION WHEN OTHERS THEN
            RETURN stored;
        END;
        IF jsonb_typeof(inner_list) <> 'array' THEN
            RETURN stored;
        END IF;
        stored := inner_list;
    END LOOP;
END
$$;

-- 2. Every list as it stands, for the gate: gone with this file's transaction.
CREATE TEMPORARY TABLE lists_032_before ON COMMIT DROP AS
    SELECT 'characters'::text AS entity, id, 'affiliations'::text AS field, affiliations AS value FROM characters
    UNION ALL
    SELECT 'characters', id, 'how_to_obtain', how_to_obtain FROM characters
    UNION ALL
    SELECT 'characters', id, 'namecard_sources', namecard_sources FROM characters
    UNION ALL
    SELECT 'weapons', id, 'how_to_obtain', how_to_obtain FROM weapons
    UNION ALL
    SELECT 'weapons', id, 'effects', effects FROM weapons
    UNION ALL
    SELECT 'foods', id, 'events', events FROM foods
    UNION ALL
    SELECT 'foods', id, 'how_to_obtain', how_to_obtain FROM foods
    UNION ALL
    SELECT 'foods', id, 'effects', effects FROM foods
    UNION ALL
    SELECT 'materials', id, 'how_to_obtain', how_to_obtain FROM materials
    UNION ALL
    SELECT 'artifacts', id, 'how_to_obtain_quality_1', how_to_obtain_quality_1 FROM artifacts
    UNION ALL
    SELECT 'artifacts', id, 'how_to_obtain_quality_2', how_to_obtain_quality_2 FROM artifacts
    UNION ALL
    SELECT 'artifacts', id, 'how_to_obtain_quality_3', how_to_obtain_quality_3 FROM artifacts
    UNION ALL
    SELECT 'artifacts', id, 'how_to_obtain_quality_4', how_to_obtain_quality_4 FROM artifacts
    UNION ALL
    SELECT 'artifacts', id, 'how_to_obtain_quality_5', how_to_obtain_quality_5 FROM artifacts
    UNION ALL
    SELECT 'artifacts', id, 'effects', effects FROM artifacts;

-- 3. Each table's lists, in the rows where one is wrapped.
UPDATE characters
   SET affiliations = pg_temp.list_unwrapped_032(affiliations),
       how_to_obtain = pg_temp.list_unwrapped_032(how_to_obtain),
       namecard_sources = pg_temp.list_unwrapped_032(namecard_sources)
 WHERE affiliations IS DISTINCT FROM pg_temp.list_unwrapped_032(affiliations)
    OR how_to_obtain IS DISTINCT FROM pg_temp.list_unwrapped_032(how_to_obtain)
    OR namecard_sources IS DISTINCT FROM pg_temp.list_unwrapped_032(namecard_sources);

UPDATE weapons
   SET how_to_obtain = pg_temp.list_unwrapped_032(how_to_obtain),
       effects = pg_temp.list_unwrapped_032(effects)
 WHERE how_to_obtain IS DISTINCT FROM pg_temp.list_unwrapped_032(how_to_obtain)
    OR effects IS DISTINCT FROM pg_temp.list_unwrapped_032(effects);

UPDATE foods
   SET events = pg_temp.list_unwrapped_032(events),
       how_to_obtain = pg_temp.list_unwrapped_032(how_to_obtain),
       effects = pg_temp.list_unwrapped_032(effects)
 WHERE events IS DISTINCT FROM pg_temp.list_unwrapped_032(events)
    OR how_to_obtain IS DISTINCT FROM pg_temp.list_unwrapped_032(how_to_obtain)
    OR effects IS DISTINCT FROM pg_temp.list_unwrapped_032(effects);

UPDATE materials
   SET how_to_obtain = pg_temp.list_unwrapped_032(how_to_obtain)
 WHERE how_to_obtain IS DISTINCT FROM pg_temp.list_unwrapped_032(how_to_obtain);

UPDATE artifacts
   SET how_to_obtain_quality_1 = pg_temp.list_unwrapped_032(how_to_obtain_quality_1),
       how_to_obtain_quality_2 = pg_temp.list_unwrapped_032(how_to_obtain_quality_2),
       how_to_obtain_quality_3 = pg_temp.list_unwrapped_032(how_to_obtain_quality_3),
       how_to_obtain_quality_4 = pg_temp.list_unwrapped_032(how_to_obtain_quality_4),
       how_to_obtain_quality_5 = pg_temp.list_unwrapped_032(how_to_obtain_quality_5),
       effects = pg_temp.list_unwrapped_032(effects)
 WHERE how_to_obtain_quality_1 IS DISTINCT FROM pg_temp.list_unwrapped_032(how_to_obtain_quality_1)
    OR how_to_obtain_quality_2 IS DISTINCT FROM pg_temp.list_unwrapped_032(how_to_obtain_quality_2)
    OR how_to_obtain_quality_3 IS DISTINCT FROM pg_temp.list_unwrapped_032(how_to_obtain_quality_3)
    OR how_to_obtain_quality_4 IS DISTINCT FROM pg_temp.list_unwrapped_032(how_to_obtain_quality_4)
    OR how_to_obtain_quality_5 IS DISTINCT FROM pg_temp.list_unwrapped_032(how_to_obtain_quality_5)
    OR effects IS DISTINCT FROM pg_temp.list_unwrapped_032(effects);

-- 4. Prove it: no list is wrapped any more - judged here on its own, not by
--    step 1's function: a one-item array whose item is a JSON array's text -
--    and no list changed but by taking the wrapping off what it held.
DO $$
DECLARE
    pair RECORD;
    item RECORD;
    inner_list JSONB;
    found TEXT;
    still_wrapped TEXT[] := '{}';
    changed TEXT[] := '{}';
BEGIN
    FOR pair IN SELECT DISTINCT entity, field FROM lists_032_before ORDER BY entity, field LOOP
        FOR item IN EXECUTE format('SELECT id, %1$I AS value FROM %2$I WHERE jsonb_typeof(%1$I) = ''array'' ORDER BY id', pair.field, pair.entity) LOOP
            IF jsonb_array_length(item.value) = 1 AND jsonb_typeof(item.value -> 0) = 'string' THEN
                BEGIN
                    inner_list := (item.value ->> 0)::jsonb;
                EXCEPTION WHEN OTHERS THEN
                    inner_list := NULL;
                END;
                IF jsonb_typeof(inner_list) = 'array' THEN
                    still_wrapped := still_wrapped || (pair.entity || '.' || pair.field || ' #' || item.id);
                END IF;
            END IF;
        END LOOP;

        EXECUTE format(
            'SELECT string_agg(%3$L || ''.'' || %4$L || '' #'' || b.id, '', '' ORDER BY b.id)
               FROM lists_032_before AS b
               JOIN %2$I AS t ON t.id = b.id
              WHERE b.entity = %3$L
                AND b.field = %4$L
                AND t.%1$I IS DISTINCT FROM pg_temp.list_unwrapped_032(b.value)',
            pair.field, pair.entity, pair.entity, pair.field
        ) INTO found;
        IF found IS NOT NULL THEN
            changed := changed || found;
        END IF;
    END LOOP;

    IF cardinality(still_wrapped) > 0 THEN
        RAISE EXCEPTION '032: lists still wrapped in a layer of JSON: %', array_to_string(still_wrapped, ', ');
    END IF;
    IF cardinality(changed) > 0 THEN
        RAISE EXCEPTION '032: lists changed other than by taking the wrapping off: %', array_to_string(changed, ', ');
    END IF;
END $$;

DROP FUNCTION pg_temp.list_unwrapped_032(JSONB);
