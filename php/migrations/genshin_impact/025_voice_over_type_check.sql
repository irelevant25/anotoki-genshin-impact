-- A voice-over line is a story line or a combat line - a fact about the game
-- rather than data anybody maintains. `voice_over_types` has held the same two
-- rows since the first migration, its admin page is read-only, and a table plus
-- a foreign key is more than two fixed words need. So the column keeps its
-- values itself, with a CHECK, the way characters.arkhe does (022): the API
-- generator reads it into the 'story' | 'combat' type the client is built on,
-- where a Postgres ENUM would be a type it does not read.
--
-- The column is untouched - same name, same text, NOT NULL as before - so no
-- row, query or API field changes; only what vouches for its values does.

-- 1. Every line already says one of the two, soft-deleted ones included (the
--    CHECK holds for every row). Named here, rather than left to trip the
--    constraint below with no word of which value it was.
DO $$
DECLARE
    stray TEXT;
BEGIN
    SELECT string_agg(DISTINCT type, ', ') INTO stray
      FROM characters_voice_overs
     WHERE type NOT IN ('story', 'combat');
    IF stray IS NOT NULL THEN
        RAISE EXCEPTION 'characters_voice_overs.type holds values the CHECK would refuse: %', stray;
    END IF;
END $$;

-- 2. The CHECK in place of the foreign key.
ALTER TABLE characters_voice_overs DROP CONSTRAINT IF EXISTS fk_characters_voice_overs_type;
ALTER TABLE characters_voice_overs DROP CONSTRAINT IF EXISTS chk_characters_voice_overs_type;
ALTER TABLE characters_voice_overs ADD CONSTRAINT chk_characters_voice_overs_type CHECK (type IN ('story', 'combat'));

-- 3. Nothing points at the table any more.
DROP TABLE IF EXISTS voice_over_types;

-- 4. Prove it.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = 'voice_over_types') THEN
        RAISE EXCEPTION 'voice_over_types is still there';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
         WHERE conrelid = 'characters_voice_overs'::regclass
           AND conname = 'chk_characters_voice_overs_type'
           AND contype = 'c'
    ) THEN
        RAISE EXCEPTION 'the CHECK on characters_voice_overs.type is missing';
    END IF;
END $$;
