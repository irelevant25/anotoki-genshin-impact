-- More of what a character page shows: its constellation (the name, and the art as
-- the game draws it), its namecard's name, the demo video, the demo music as a
-- file, and the Arkhe it is aligned with.
--
-- The demo music's title moves from `demo_music` to `demo_music_name`. The file
-- now lives in `demo_music_file_id`, and the API sends a file column's path under
-- the column's bare name - `icon_file_id` goes out as `icon` (api/asset_columns.php)
-- - so `demo_music` is the file's path from here on, and the title needs a name
-- of its own.

-- 1. Where the constellation art is filed: one picture per character, beside the
--    per-level icons of `character.constellations`.
INSERT INTO file_categories (code, label, path, is_system, sort_order) VALUES
    ('character.constellation', 'Constellation', 'character/constellation', FALSE, 23)
ON CONFLICT (code) DO NOTHING;

-- 2. The new columns.
ALTER TABLE characters
    ADD COLUMN IF NOT EXISTS constellation_name    VARCHAR(100),
    ADD COLUMN IF NOT EXISTS constellation_file_id INTEGER REFERENCES files(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS namecard_name         VARCHAR(100),
    ADD COLUMN IF NOT EXISTS demo_video            VARCHAR(255),
    ADD COLUMN IF NOT EXISTS demo_music_file_id    INTEGER REFERENCES files(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS arkhe                 VARCHAR(20);

-- Pneuma, Ousia, or both - Furina is the one with both. The admin form offers
-- exactly these three.
ALTER TABLE characters DROP CONSTRAINT IF EXISTS chk_characters_arkhe;
ALTER TABLE characters ADD CONSTRAINT chk_characters_arkhe CHECK (arkhe IN ('Pneuma', 'Ousia', 'Pneuma & Ousia'));

-- 3. The title's new name.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'characters' AND column_name = 'demo_music')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'characters' AND column_name = 'demo_music_name') THEN
        ALTER TABLE characters RENAME COLUMN demo_music TO demo_music_name;
    END IF;
END $$;

-- 4. Link the demo music already on disk. The site used to find it by a naming
--    convention (`<icon name>.mp3`) that the files no longer follow: they are
--    Opus, and mostly named after the character as displayed ("Arataki Itto"),
--    a few after the asset name ("ARATAKI_ITTO"). The displayed name wins where
--    a character has both.
UPDATE characters c
   SET demo_music_file_id = COALESCE(
           (SELECT f.id
              FROM files f
              JOIN file_categories fc ON fc.id = f.category_id
             WHERE fc.code = 'character.demo_music' AND f.name = c.name
             ORDER BY f.id LIMIT 1),
           (SELECT f.id
              FROM files f
              JOIN file_categories fc ON fc.id = f.category_id
              JOIN files icon ON icon.id = c.icon_file_id
             WHERE fc.code = 'character.demo_music' AND f.name = icon.name
             ORDER BY f.id LIMIT 1))
 WHERE c.demo_music_file_id IS NULL;

-- 5. Prove it: every character a demo music file is named after points at one,
--    and every link is to a demo music file.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
          FROM characters c
          JOIN files f ON f.name = c.name
          JOIN file_categories fc ON fc.id = f.category_id AND fc.code = 'character.demo_music'
         WHERE c.demo_music_file_id IS NULL
    ) THEN
        RAISE EXCEPTION 'a character with demo music on disk was left without a link to it';
    END IF;
    IF EXISTS (
        SELECT 1
          FROM characters c
          JOIN files f ON f.id = c.demo_music_file_id
          JOIN file_categories fc ON fc.id = f.category_id
         WHERE fc.code <> 'character.demo_music'
    ) THEN
        RAISE EXCEPTION 'a demo music link points at a file outside the demo music folder';
    END IF;
END $$;
