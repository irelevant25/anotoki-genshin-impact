-- Constellations move from being owned by a character to being owned by a *set*
-- that characters point at - the same move voice-overs (016), ascensions (018)
-- and talents (019) made, so the Traveler's six Aether / six Lumine variants
-- share one copy.
--
-- Backfill is 1:1: one set per character that has constellations.

-- 1. The wrapper: an id and nothing else, on purpose.
CREATE TABLE IF NOT EXISTS characters_constellations_sets (
    id SERIAL PRIMARY KEY
);

-- 2. The set reference on both sides. Nullable for now, so the backfill can run.
ALTER TABLE characters
    ADD COLUMN IF NOT EXISTS constellation_set_id INT REFERENCES characters_constellations_sets(id) ON DELETE SET NULL;
ALTER TABLE characters_constellations
    ADD COLUMN IF NOT EXISTS constellation_set_id INT REFERENCES characters_constellations_sets(id) ON DELETE CASCADE;

-- 3. Backfill: a set per character that has constellations (including soft-deleted
--    rows, so history moves together), pointing the character and its rows at it.
DO $$
DECLARE
    cid INT;
    new_set INT;
BEGIN
    FOR cid IN
        SELECT DISTINCT character_id FROM characters_constellations WHERE character_id IS NOT NULL
    LOOP
        INSERT INTO characters_constellations_sets DEFAULT VALUES RETURNING id INTO new_set;
        UPDATE characters SET constellation_set_id = new_set WHERE id = cid;
        UPDATE characters_constellations SET constellation_set_id = new_set WHERE character_id = cid;
    END LOOP;
END $$;

-- 4. Prove the move before dropping anything.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM characters_constellations WHERE constellation_set_id IS NULL) THEN
        RAISE EXCEPTION 'constellation rows left without a set';
    END IF;
    IF EXISTS (
        SELECT 1 FROM characters_constellations con
        JOIN characters c ON c.id = con.character_id
        WHERE c.constellation_set_id IS DISTINCT FROM con.constellation_set_id
    ) THEN
        RAISE EXCEPTION 'a constellation and its character disagree on the set';
    END IF;
END $$;

-- 5. The character owner column is now redundant.
ALTER TABLE characters_constellations DROP COLUMN IF EXISTS character_id;

-- 6. Every row has a set now, so require it.
ALTER TABLE characters_constellations ALTER COLUMN constellation_set_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS characters_constellations_set_idx ON characters_constellations (constellation_set_id);
CREATE INDEX IF NOT EXISTS characters_constellation_set_idx ON characters (constellation_set_id);
