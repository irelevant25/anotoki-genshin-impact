-- One naming for the demo music: the asset name every other character file
-- already goes by - HU_TAO, not "Hu Tao" (assetBaseName() in api/asset_naming.php).
--
-- The folder held two conventions. The first files were named after the
-- character as displayed ("Arataki Itto.opus"); a later batch, the clean tracks,
-- by asset name ("ARATAKI_ITTO.opus"). For a one-word name the two spellings
-- differ only in case, which Windows does not see, so the later file replaced the
-- earlier one in place and kept the old spelling ("Albedo.opus"). For a longer
-- name both files stayed side by side - twelve characters had two - and
-- migration 022 linked the display-name one.
--
-- The asset-name copy is the one kept: it is the clean track, as the one-word
-- characters already play. Eleven of the twelve pairs are the same recording
-- encoded twice; Arataki Itto's display-name copy is a 70-second cut of the
-- 148-second track.
--
-- This changes the catalogue only. The files are renamed on disk beside it; on a
-- server with no shell, upload assets/character/demo_music again and remove the
-- display-name files it held before.

DO $$
DECLARE
    linked_before INTEGER;
    linked_after  INTEGER;
    demo          RECORD;
    target        TEXT;
    kept_id       INTEGER;
BEGIN
    SELECT count(*) INTO linked_before FROM characters WHERE demo_music_file_id IS NOT NULL;

    -- Anything already in upper snake case is an asset name. Applying the rule
    -- to one would drop its underscores, so only the others are renamed.
    FOR demo IN
        SELECT f.id, f.name, f.extension, f.category_id
          FROM files f
          JOIN file_categories fc ON fc.id = f.category_id
         WHERE fc.code = 'character.demo_music'
           AND f.name !~ '^[A-Z0-9_]+$'
         ORDER BY f.id
    LOOP
        target := upper(btrim(regexp_replace(regexp_replace(demo.name, '[^A-Za-z0-9\s]', '', 'g'), '\s', '_', 'g'), '_'));

        SELECT id INTO kept_id
          FROM files
         WHERE category_id = demo.category_id AND name = target AND extension = demo.extension AND id <> demo.id;

        IF kept_id IS NOT NULL THEN
            -- 1. Both spellings are catalogued: move the characters onto the
            --    asset-name row, then drop the display-name one.
            UPDATE characters SET demo_music_file_id = kept_id WHERE demo_music_file_id = demo.id;
            DELETE FROM files WHERE id = demo.id;
        ELSE
            -- 2. Only the display name is: the row takes the asset name.
            UPDATE files SET name = target, updated_at = CURRENT_TIMESTAMP WHERE id = demo.id;
        END IF;
    END LOOP;

    -- 3. Prove it: nobody lost their track, nothing is left in the old
    --    convention, and every character's track is filed under its own name.
    SELECT count(*) INTO linked_after FROM characters WHERE demo_music_file_id IS NOT NULL;
    IF linked_after <> linked_before THEN
        RAISE EXCEPTION 'characters with demo music went from % to %', linked_before, linked_after;
    END IF;

    IF EXISTS (
        SELECT 1
          FROM files f
          JOIN file_categories fc ON fc.id = f.category_id
         WHERE fc.code = 'character.demo_music'
           AND f.name !~ '^[A-Z0-9_]+$'
    ) THEN
        RAISE EXCEPTION 'a demo music file is still named in the display-name convention';
    END IF;

    IF EXISTS (
        SELECT 1
          FROM characters c
          JOIN files f ON f.id = c.demo_music_file_id
         WHERE f.name <> upper(btrim(regexp_replace(regexp_replace(c.name, '[^A-Za-z0-9\s]', '', 'g'), '\s', '_', 'g'), '_'))
    ) THEN
        RAISE EXCEPTION 'a character points at demo music filed under another name';
    END IF;
END $$;
