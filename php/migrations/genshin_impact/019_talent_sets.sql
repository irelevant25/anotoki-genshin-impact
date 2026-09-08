-- Talents move from being owned by a character to being owned by a *set* that
-- characters point at - the same move voice-overs (016) and ascensions (018)
-- made, so the Traveler's six Aether / six Lumine variants share one copy. Both
-- the talents and their per-character costs move onto the set.
--
-- Backfill is 1:1: one set per character that has talents (or talent costs).

-- 1. The wrapper: an id and nothing else, on purpose.
CREATE TABLE IF NOT EXISTS characters_talents_sets (
    id SERIAL PRIMARY KEY
);

-- 2. The set reference on the character and on both talent tables. Nullable for
--    now, so the backfill can run.
ALTER TABLE characters
    ADD COLUMN IF NOT EXISTS talent_set_id INT REFERENCES characters_talents_sets(id) ON DELETE SET NULL;
ALTER TABLE characters_talents
    ADD COLUMN IF NOT EXISTS talent_set_id INT REFERENCES characters_talents_sets(id) ON DELETE CASCADE;
ALTER TABLE characters_talents_cost
    ADD COLUMN IF NOT EXISTS talent_set_id INT REFERENCES characters_talents_sets(id) ON DELETE CASCADE;

-- 3. Backfill: a set per character that has talents or talent costs (including
--    soft-deleted rows, so history moves together), pointing the character and
--    both its talent tables at it.
DO $$
DECLARE
    cid INT;
    new_set INT;
BEGIN
    FOR cid IN
        SELECT character_id FROM characters_talents WHERE character_id IS NOT NULL
        UNION
        SELECT character_id FROM characters_talents_cost WHERE character_id IS NOT NULL
    LOOP
        INSERT INTO characters_talents_sets DEFAULT VALUES RETURNING id INTO new_set;
        UPDATE characters SET talent_set_id = new_set WHERE id = cid;
        UPDATE characters_talents SET talent_set_id = new_set WHERE character_id = cid;
        UPDATE characters_talents_cost SET talent_set_id = new_set WHERE character_id = cid;
    END LOOP;
END $$;

-- 4. Prove the move before dropping anything.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM characters_talents WHERE talent_set_id IS NULL) THEN
        RAISE EXCEPTION 'talent rows left without a set';
    END IF;
    IF EXISTS (SELECT 1 FROM characters_talents_cost WHERE talent_set_id IS NULL) THEN
        RAISE EXCEPTION 'talent cost rows left without a set';
    END IF;
    IF EXISTS (
        SELECT 1 FROM characters_talents t
        JOIN characters c ON c.id = t.character_id
        WHERE c.talent_set_id IS DISTINCT FROM t.talent_set_id
    ) THEN
        RAISE EXCEPTION 'a talent and its character disagree on the set';
    END IF;
END $$;

-- 5. The character owner column is now redundant on both tables.
ALTER TABLE characters_talents DROP COLUMN IF EXISTS character_id;
ALTER TABLE characters_talents_cost DROP COLUMN IF EXISTS character_id;

-- 6. Every row has a set now, so require it.
ALTER TABLE characters_talents ALTER COLUMN talent_set_id SET NOT NULL;
ALTER TABLE characters_talents_cost ALTER COLUMN talent_set_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS characters_talents_set_idx ON characters_talents (talent_set_id);
CREATE INDEX IF NOT EXISTS characters_talents_cost_set_idx ON characters_talents_cost (talent_set_id);
CREATE INDEX IF NOT EXISTS characters_talent_set_idx ON characters (talent_set_id);
