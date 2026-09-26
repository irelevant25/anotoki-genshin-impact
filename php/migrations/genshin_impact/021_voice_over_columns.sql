-- Voice-overs are now crawled from the HoyoLab wiki, which has no Traditional
-- Chinese and no romanised readings. Those five columns can never be filled
-- again, so they go. In their place a language-independent `name` for the line
-- (the English label, e.g. "Elemental Skill: I"), which the crawler emits.
--
-- The dropped columns held data from the old fandom crawl. Nothing reads them any
-- more; take a backup first if that data is wanted.

-- 1. The new column, backfilled from the English title - what the crawler writes.
ALTER TABLE characters_voice_overs
    ADD COLUMN IF NOT EXISTS name VARCHAR(100);

UPDATE characters_voice_overs SET name = title_english WHERE name IS NULL;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM characters_voice_overs WHERE name IS NULL) THEN
        RAISE EXCEPTION 'voice-over rows left without a name';
    END IF;
END $$;

-- 2. The columns the new source cannot fill.
ALTER TABLE characters_voice_overs
    DROP COLUMN IF EXISTS title_chinese_traditional,
    DROP COLUMN IF EXISTS text_chinese_traditional,
    DROP COLUMN IF EXISTS text_japanese_reading,
    DROP COLUMN IF EXISTS text_chinese_reading,
    DROP COLUMN IF EXISTS text_korean_reading;
