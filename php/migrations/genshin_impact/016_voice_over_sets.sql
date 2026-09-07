-- Voice-overs move from being owned by a character to being owned by a *set*
-- that characters point at. This lets the several rows that are really one
-- character (the Traveler: six Aether, six Lumine) share a single copy of the
-- voice lines, instead of duplicating them or using the never-used
-- character_id_2..7 columns (which were always null - checked before writing).
--
-- Nothing shares voice-overs today, so the backfill is a plain 1:1: one set per
-- character that has any voice-over, wiring the character and its rows to it.
-- Sharing (pointing several characters at one set) is done afterwards.

-- 1. The wrapper: an id and nothing else, on purpose.
CREATE TABLE IF NOT EXISTS voice_over_sets (
    id SERIAL PRIMARY KEY
);

-- 2. The set reference on both sides. Nullable for now, so the backfill can run.
ALTER TABLE characters
    ADD COLUMN IF NOT EXISTS voice_over_set_id INT REFERENCES voice_over_sets(id) ON DELETE SET NULL;
ALTER TABLE characters_voice_overs
    ADD COLUMN IF NOT EXISTS voice_over_set_id INT REFERENCES voice_over_sets(id) ON DELETE CASCADE;

-- 3. Backfill: a set per character that has voice-overs (including soft-deleted
--    rows, so the whole history moves together), pointing the character and all
--    its rows at it.
DO $$
DECLARE
    cid INT;
    new_set INT;
BEGIN
    FOR cid IN
        SELECT DISTINCT character_id FROM characters_voice_overs WHERE character_id IS NOT NULL
    LOOP
        INSERT INTO voice_over_sets DEFAULT VALUES RETURNING id INTO new_set;
        UPDATE characters SET voice_over_set_id = new_set WHERE id = cid;
        UPDATE characters_voice_overs SET voice_over_set_id = new_set WHERE character_id = cid;
    END LOOP;
END $$;

-- 4. Prove the move before dropping anything: every row has a set, and it is the
--    same set its character now points at.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM characters_voice_overs WHERE voice_over_set_id IS NULL) THEN
        RAISE EXCEPTION 'voice-over rows left without a set';
    END IF;
    IF EXISTS (
        SELECT 1 FROM characters_voice_overs vo
        JOIN characters c ON c.id = vo.character_id
        WHERE c.voice_over_set_id IS DISTINCT FROM vo.voice_over_set_id
    ) THEN
        RAISE EXCEPTION 'a voice-over and its character disagree on the set';
    END IF;
END $$;

-- 5. The old owner columns are now redundant. character_id_2..7 were always
--    null; character_id has been replaced by the set.
ALTER TABLE characters_voice_overs DROP COLUMN IF EXISTS character_id_2;
ALTER TABLE characters_voice_overs DROP COLUMN IF EXISTS character_id_3;
ALTER TABLE characters_voice_overs DROP COLUMN IF EXISTS character_id_4;
ALTER TABLE characters_voice_overs DROP COLUMN IF EXISTS character_id_5;
ALTER TABLE characters_voice_overs DROP COLUMN IF EXISTS character_id_6;
ALTER TABLE characters_voice_overs DROP COLUMN IF EXISTS character_id_7;
ALTER TABLE characters_voice_overs DROP COLUMN IF EXISTS character_id;

-- 6. Every row has a set now, so require it.
ALTER TABLE characters_voice_overs ALTER COLUMN voice_over_set_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS characters_voice_overs_set_idx ON characters_voice_overs (voice_over_set_id);
CREATE INDEX IF NOT EXISTS characters_voice_over_set_idx ON characters (voice_over_set_id);
