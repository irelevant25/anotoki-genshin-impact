-- Ascensions move from being owned by a character to being owned by a *set* that
-- characters point at - the same move voice-overs made (see 016). The Traveler's
-- six Aether and six Lumine rows are really one character each and share the same
-- ascension stats, so a set lets them share one copy instead of duplicating it -
-- and retires the never-used character_id_2..7 columns (always null, checked).
--
-- Nothing shares ascensions today, so the backfill is a plain 1:1: one set per
-- character that has any ascension. Sharing is pointed afterwards from the UI.

-- 1. The wrapper: an id and nothing else, on purpose.
CREATE TABLE IF NOT EXISTS characters_ascensions_sets (
    id SERIAL PRIMARY KEY
);

-- 2. The set reference on both sides. Nullable for now, so the backfill can run.
ALTER TABLE characters
    ADD COLUMN IF NOT EXISTS ascension_set_id INT REFERENCES characters_ascensions_sets(id) ON DELETE SET NULL;
ALTER TABLE characters_ascensions
    ADD COLUMN IF NOT EXISTS ascension_set_id INT REFERENCES characters_ascensions_sets(id) ON DELETE CASCADE;

-- 3. Backfill: a set per character that has ascensions (including soft-deleted
--    rows, so the whole history moves together), pointing the character and all
--    its rows at it.
DO $$
DECLARE
    cid INT;
    new_set INT;
BEGIN
    FOR cid IN
        SELECT DISTINCT character_id FROM characters_ascensions WHERE character_id IS NOT NULL
    LOOP
        INSERT INTO characters_ascensions_sets DEFAULT VALUES RETURNING id INTO new_set;
        UPDATE characters SET ascension_set_id = new_set WHERE id = cid;
        UPDATE characters_ascensions SET ascension_set_id = new_set WHERE character_id = cid;
    END LOOP;
END $$;

-- 4. Prove the move before dropping anything: every row has a set, and it is the
--    same set its character now points at.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM characters_ascensions WHERE ascension_set_id IS NULL) THEN
        RAISE EXCEPTION 'ascension rows left without a set';
    END IF;
    IF EXISTS (
        SELECT 1 FROM characters_ascensions a
        JOIN characters c ON c.id = a.character_id
        WHERE c.ascension_set_id IS DISTINCT FROM a.ascension_set_id
    ) THEN
        RAISE EXCEPTION 'an ascension and its character disagree on the set';
    END IF;
END $$;

-- 5. The old owner columns are now redundant. character_id_2..7 were always
--    null; character_id has been replaced by the set.
ALTER TABLE characters_ascensions DROP COLUMN IF EXISTS character_id_2;
ALTER TABLE characters_ascensions DROP COLUMN IF EXISTS character_id_3;
ALTER TABLE characters_ascensions DROP COLUMN IF EXISTS character_id_4;
ALTER TABLE characters_ascensions DROP COLUMN IF EXISTS character_id_5;
ALTER TABLE characters_ascensions DROP COLUMN IF EXISTS character_id_6;
ALTER TABLE characters_ascensions DROP COLUMN IF EXISTS character_id_7;
ALTER TABLE characters_ascensions DROP COLUMN IF EXISTS character_id;

-- 6. Every row has a set now, so require it.
ALTER TABLE characters_ascensions ALTER COLUMN ascension_set_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS characters_ascensions_set_idx ON characters_ascensions (ascension_set_id);
CREATE INDEX IF NOT EXISTS characters_ascension_set_idx ON characters (ascension_set_id);
