-----------------------------------------------------------
-- 002 — Image file names on every entity that has an image
--
-- Until now an image was either a full path in the entity
-- (characters.icon = '../assets/character/icon/HU_TAO.png') or nothing at all,
-- with the file name derived from the entity's own name (materials, banners,
-- backgrounds). Deriving breaks the moment an entity is renamed, and it gave no
-- way to upload a file under a chosen name.
--
-- Every image column now has a companion "{column}_name" holding just the base
-- name, no folder and no extension: 'HU_TAO', 'PILE_EM_UP - normal'. The path
-- column stays and is written by the API, so nothing reading paths changes.
--
-- Two existing columns are repurposed, because neither held a name:
--   weapons.icon_name          held a full path, duplicating weapons.icon
--   characters.ingame_icon_name held a suffix ('In-Game'), which is now folded
--                               into the name itself ('HU_TAO - In-Game')
--
-- Materials, banners and backgrounds had no image columns at all and get both.
-----------------------------------------------------------

-- ── New name columns ────────────────────────────────────────────────────────

ALTER TABLE characters
    ADD COLUMN IF NOT EXISTS icon_name                VARCHAR(150),
    ADD COLUMN IF NOT EXISTS card_icon_name           VARCHAR(150),
    ADD COLUMN IF NOT EXISTS card_icon_2_name         VARCHAR(150),
    ADD COLUMN IF NOT EXISTS wish_icon_name           VARCHAR(150),
    ADD COLUMN IF NOT EXISTS namecard_icon_name       VARCHAR(150),
    ADD COLUMN IF NOT EXISTS namecard_background_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS namecard_banner_name     VARCHAR(150);

ALTER TABLE artifacts                 ADD COLUMN IF NOT EXISTS icon_name VARCHAR(150);
ALTER TABLE artifacts_pieces          ADD COLUMN IF NOT EXISTS icon_name VARCHAR(150);
ALTER TABLE characters_constellations ADD COLUMN IF NOT EXISTS icon_name VARCHAR(150);
ALTER TABLE characters_talents        ADD COLUMN IF NOT EXISTS icon_name VARCHAR(150);
ALTER TABLE enemies                   ADD COLUMN IF NOT EXISTS icon_name VARCHAR(150);

ALTER TABLE enemies_phases
    ADD COLUMN IF NOT EXISTS icon_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS art_name  VARCHAR(150);

ALTER TABLE foods
    ADD COLUMN IF NOT EXISTS icon_normal_name     VARCHAR(150),
    ADD COLUMN IF NOT EXISTS icon_delicious_name  VARCHAR(150),
    ADD COLUMN IF NOT EXISTS icon_suspicious_name VARCHAR(150);

ALTER TABLE weapons ADD COLUMN IF NOT EXISTS icon_ascension_name VARCHAR(150);

-- The existing weapons.icon_name / icon_2_name are VARCHAR(100) and held paths;
-- widen them so a long base name fits once they are repurposed below.
ALTER TABLE weapons ALTER COLUMN icon_name   TYPE VARCHAR(150);
ALTER TABLE weapons ALTER COLUMN icon_2_name TYPE VARCHAR(150);
ALTER TABLE characters ALTER COLUMN ingame_icon_name   TYPE VARCHAR(150);
ALTER TABLE characters ALTER COLUMN ingame_icon_2_name TYPE VARCHAR(150);

-- ── Entities that had no image columns at all ───────────────────────────────

ALTER TABLE materials
    ADD COLUMN IF NOT EXISTS icon      VARCHAR(200),
    ADD COLUMN IF NOT EXISTS icon_name VARCHAR(150);

ALTER TABLE banners
    ADD COLUMN IF NOT EXISTS icon      VARCHAR(200),
    ADD COLUMN IF NOT EXISTS icon_name VARCHAR(150);

ALTER TABLE backgrounds
    ADD COLUMN IF NOT EXISTS image        VARCHAR(200),
    ADD COLUMN IF NOT EXISTS image_name   VARCHAR(150),
    ADD COLUMN IF NOT EXISTS preview      VARCHAR(200),
    ADD COLUMN IF NOT EXISTS preview_name VARCHAR(150);

-- ── Backfill: the base name of whatever the path already points at ──────────
--
-- '../assets/character/icon/HU_TAO.png' -> 'HU_TAO'
-- Strip everything up to the last slash, then the extension.

UPDATE characters SET
    icon_name                = regexp_replace(regexp_replace(icon,                '^.*/', ''), '\.[^.]*$', ''),
    card_icon_name           = regexp_replace(regexp_replace(card_icon,           '^.*/', ''), '\.[^.]*$', ''),
    card_icon_2_name         = regexp_replace(regexp_replace(card_icon_2,         '^.*/', ''), '\.[^.]*$', ''),
    wish_icon_name           = regexp_replace(regexp_replace(wish_icon,           '^.*/', ''), '\.[^.]*$', ''),
    namecard_icon_name       = regexp_replace(regexp_replace(namecard_icon,       '^.*/', ''), '\.[^.]*$', ''),
    namecard_background_name = regexp_replace(regexp_replace(namecard_background, '^.*/', ''), '\.[^.]*$', ''),
    namecard_banner_name     = regexp_replace(regexp_replace(namecard_banner,     '^.*/', ''), '\.[^.]*$', '');

-- Repurposed: these held a suffix, not a name.
UPDATE characters SET
    ingame_icon_name   = regexp_replace(regexp_replace(ingame_icon,   '^.*/', ''), '\.[^.]*$', ''),
    ingame_icon_2_name = regexp_replace(regexp_replace(ingame_icon_2, '^.*/', ''), '\.[^.]*$', '');

UPDATE artifacts                 SET icon_name = regexp_replace(regexp_replace(icon, '^.*/', ''), '\.[^.]*$', '');
UPDATE artifacts_pieces          SET icon_name = regexp_replace(regexp_replace(icon, '^.*/', ''), '\.[^.]*$', '');
UPDATE characters_constellations SET icon_name = regexp_replace(regexp_replace(icon, '^.*/', ''), '\.[^.]*$', '');
UPDATE characters_talents        SET icon_name = regexp_replace(regexp_replace(icon, '^.*/', ''), '\.[^.]*$', '');
UPDATE enemies                   SET icon_name = regexp_replace(regexp_replace(icon, '^.*/', ''), '\.[^.]*$', '');

UPDATE enemies_phases SET
    icon_name = regexp_replace(regexp_replace(icon, '^.*/', ''), '\.[^.]*$', ''),
    art_name  = regexp_replace(regexp_replace(art,  '^.*/', ''), '\.[^.]*$', '');

UPDATE foods SET
    icon_normal_name     = regexp_replace(regexp_replace(icon_normal,     '^.*/', ''), '\.[^.]*$', ''),
    icon_delicious_name  = regexp_replace(regexp_replace(icon_delicious,  '^.*/', ''), '\.[^.]*$', ''),
    icon_suspicious_name = regexp_replace(regexp_replace(icon_suspicious, '^.*/', ''), '\.[^.]*$', '');

-- Repurposed: weapons.icon_name held a copy of the path.
UPDATE weapons SET
    icon_name           = regexp_replace(regexp_replace(icon,           '^.*/', ''), '\.[^.]*$', ''),
    icon_2_name         = regexp_replace(regexp_replace(icon_2,         '^.*/', ''), '\.[^.]*$', ''),
    icon_ascension_name = regexp_replace(regexp_replace(icon_ascension, '^.*/', ''), '\.[^.]*$', '');

-- ── Backfill the name-derived entities from the convention they used ────────
-- The path stays NULL until something is uploaded; the client resolves these
-- by name, trying .avif then .png.

UPDATE materials   SET icon_name = name                     WHERE icon_name IS NULL;
UPDATE banners     SET icon_name = version || ' - ' || name WHERE icon_name IS NULL;
UPDATE backgrounds SET image_name = name, preview_name = name || ' - preview' WHERE image_name IS NULL;
