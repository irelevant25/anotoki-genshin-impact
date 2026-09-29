-----------------------------------------------------------
-- THE LOOKUP TABLES POINT AT THEIR ICONS TOO
--
-- Every entity that has a picture names it with a foreign key into `files`.
-- The lookup tables did not: an element, a region and a weapon type each have
-- an icon in the asset tree, and the only thing joining the two was that the
-- file happened to be called the same as the row. Which meant the site found
-- them by guessing at filenames, nothing counted them as referenced, and a
-- rename in one place quietly broke the other.
--
-- Only these three. `roles` and `food_types` have folders as well, but their
-- names are descriptive phrases - "Anemo enabler / Support", "Climbing Stamina
-- Dishes" - and one file in nineteen matches one. A column that is null for
-- every row is not a link, it is a suggestion, so they are left alone until
-- there are icons to point at.
--
-- These tables are keyed by name rather than by an id, which is the convention
-- the whole schema uses for lookups - characters.region is already a foreign
-- key to regions.name. That is unchanged here; this only adds the picture.
-----------------------------------------------------------

ALTER TABLE elements ADD COLUMN IF NOT EXISTS icon_file_id INTEGER REFERENCES files(id) ON DELETE SET NULL;
ALTER TABLE regions ADD COLUMN IF NOT EXISTS icon_file_id INTEGER REFERENCES files(id) ON DELETE SET NULL;
ALTER TABLE weapon_types ADD COLUMN IF NOT EXISTS icon_file_id INTEGER REFERENCES files(id) ON DELETE SET NULL;

-- ── Backfill by the name the row already has ─────────────────────────────
--
-- The converted copy where there is one, which for all three of these is every
-- row: the originals were removed once the site began serving AVIF.

UPDATE elements t SET icon_file_id = (
    SELECT f.id FROM files f JOIN file_categories c ON c.id = f.category_id
     WHERE c.code = 'elements' AND f.name = t.name
     ORDER BY CASE f.extension WHEN 'avif' THEN 0 ELSE 1 END, f.id
     LIMIT 1)
WHERE icon_file_id IS NULL;

UPDATE regions t SET icon_file_id = (
    SELECT f.id FROM files f JOIN file_categories c ON c.id = f.category_id
     WHERE c.code = 'regions' AND f.name = t.name
     ORDER BY CASE f.extension WHEN 'avif' THEN 0 ELSE 1 END, f.id
     LIMIT 1)
WHERE icon_file_id IS NULL;

UPDATE weapon_types t SET icon_file_id = (
    SELECT f.id FROM files f JOIN file_categories c ON c.id = f.category_id
     WHERE c.code = 'weapon_types' AND f.name = t.name
     ORDER BY CASE f.extension WHEN 'avif' THEN 0 ELSE 1 END, f.id
     LIMIT 1)
WHERE icon_file_id IS NULL;

-- ── Say so if any of them found nothing ──────────────────────────────────
--
-- Unlike the entity tables, every row here is expected to have a picture. One
-- that does not means a file is named something other than its row, which is
-- the drift this column exists to stop.
DO $$
DECLARE
    missing INTEGER;
BEGIN
    SELECT (SELECT count(*) FROM elements WHERE icon_file_id IS NULL)
         + (SELECT count(*) FROM regions WHERE icon_file_id IS NULL)
         + (SELECT count(*) FROM weapon_types WHERE icon_file_id IS NULL)
      INTO missing;

    IF missing > 0 THEN
        RAISE NOTICE '% lookup row(s) have no icon - their file is named something other than the row', missing;
    END IF;
END $$;
