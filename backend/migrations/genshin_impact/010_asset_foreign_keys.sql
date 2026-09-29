-----------------------------------------------------------
-- EVERY ASSET COLUMN BECOMES A FOREIGN KEY
--
-- Thirty columns across thirteen tables stored a path and, for most of them,
-- a base name beside it - characters.icon held
-- '../assets/character/icon/BAIZHU.avif' and characters.icon_name held
-- 'BAIZHU'. Both become one column, {field}_file_id, a real reference into
-- the files catalogue built earlier.
--
-- Nothing downstream is supposed to notice. api/asset_columns.php resolves a
-- file id back into the same path and name a reader has always been sent,
-- and does the reverse on the way in - so this is a storage change, not a
-- contract change.
--
-- Two backfills, because the columns were never as uniform as they looked.
-- Most hold a path, and a path pins the extension exactly, so the first
-- pass joins on the companion name and that extension. But materials,
-- banners and backgrounds never stored a path at all - 1,040 rows carry a
-- name and nothing else, which is why the site resolves their art by
-- guessing at filenames (appMaterialIcon) instead of following a column.
-- The second pass picks those up by name alone, preferring the converted
-- avif twin the way the repoint did.
--
-- That pass also has to know both naming conventions the asset dump uses,
-- because some material names cannot be filenames at all: "Maintenance
-- Mek: Water Body Cleaner" has a colon in it and lives on disk as
-- MAINTENANCE_MEK_WATER_BODY_CLEANER.png. So a name that matches no file
-- directly is tried again in the upper-snake form the directive falls back
-- to - the same transformation, spelled in SQL.
--
-- The category codes come from the same manifest (api/asset_columns.php)
-- the runtime resolves against, rather than being parsed back out of the
-- path here, so the two can never disagree about which folder a column
-- means.
--
-- Every populated column backfills without a row left behind but one: the
-- twelve Traveler rows name AETHER.avif and LUMINE.avif across all seven of
-- characters' own image columns, and none of those files has ever existed -
-- found already, while repointing the database at the converted asset tree,
-- and unrelated to this migration. The check below expects exactly those and
-- no others. The columns that are entirely empty today - a second icon
-- nobody has uploaded, an enemy's full art - backfill to nothing, which is
-- exactly what an empty column should do.
-----------------------------------------------------------

-- ── Add every column ─────────────────────────────────────────────────────
--
-- Nullable and unconstrained until backfilled and verified below.
ALTER TABLE "characters" ADD COLUMN IF NOT EXISTS "icon_file_id" INTEGER REFERENCES files(id) ON DELETE SET NULL;
ALTER TABLE "characters" ADD COLUMN IF NOT EXISTS "card_icon_file_id" INTEGER REFERENCES files(id) ON DELETE SET NULL;
ALTER TABLE "characters" ADD COLUMN IF NOT EXISTS "card_icon_2_file_id" INTEGER REFERENCES files(id) ON DELETE SET NULL;
ALTER TABLE "characters" ADD COLUMN IF NOT EXISTS "wish_icon_file_id" INTEGER REFERENCES files(id) ON DELETE SET NULL;
ALTER TABLE "characters" ADD COLUMN IF NOT EXISTS "ingame_icon_file_id" INTEGER REFERENCES files(id) ON DELETE SET NULL;
ALTER TABLE "characters" ADD COLUMN IF NOT EXISTS "ingame_icon_2_file_id" INTEGER REFERENCES files(id) ON DELETE SET NULL;
ALTER TABLE "characters" ADD COLUMN IF NOT EXISTS "namecard_icon_file_id" INTEGER REFERENCES files(id) ON DELETE SET NULL;
ALTER TABLE "characters" ADD COLUMN IF NOT EXISTS "namecard_background_file_id" INTEGER REFERENCES files(id) ON DELETE SET NULL;
ALTER TABLE "characters" ADD COLUMN IF NOT EXISTS "namecard_banner_file_id" INTEGER REFERENCES files(id) ON DELETE SET NULL;
ALTER TABLE "characters_constellations" ADD COLUMN IF NOT EXISTS "icon_file_id" INTEGER REFERENCES files(id) ON DELETE SET NULL;
ALTER TABLE "characters_talents" ADD COLUMN IF NOT EXISTS "icon_file_id" INTEGER REFERENCES files(id) ON DELETE SET NULL;
ALTER TABLE "characters_voice_overs" ADD COLUMN IF NOT EXISTS "audio_english_file_id" INTEGER REFERENCES files(id) ON DELETE SET NULL;
ALTER TABLE "characters_voice_overs" ADD COLUMN IF NOT EXISTS "audio_japanese_file_id" INTEGER REFERENCES files(id) ON DELETE SET NULL;
ALTER TABLE "characters_voice_overs" ADD COLUMN IF NOT EXISTS "audio_chinese_file_id" INTEGER REFERENCES files(id) ON DELETE SET NULL;
ALTER TABLE "characters_voice_overs" ADD COLUMN IF NOT EXISTS "audio_korean_file_id" INTEGER REFERENCES files(id) ON DELETE SET NULL;
ALTER TABLE "enemies" ADD COLUMN IF NOT EXISTS "icon_file_id" INTEGER REFERENCES files(id) ON DELETE SET NULL;
ALTER TABLE "enemies_phases" ADD COLUMN IF NOT EXISTS "icon_file_id" INTEGER REFERENCES files(id) ON DELETE SET NULL;
ALTER TABLE "enemies_phases" ADD COLUMN IF NOT EXISTS "art_file_id" INTEGER REFERENCES files(id) ON DELETE SET NULL;
ALTER TABLE "artifacts" ADD COLUMN IF NOT EXISTS "icon_file_id" INTEGER REFERENCES files(id) ON DELETE SET NULL;
ALTER TABLE "artifacts_pieces" ADD COLUMN IF NOT EXISTS "icon_file_id" INTEGER REFERENCES files(id) ON DELETE SET NULL;
ALTER TABLE "weapons" ADD COLUMN IF NOT EXISTS "icon_file_id" INTEGER REFERENCES files(id) ON DELETE SET NULL;
ALTER TABLE "weapons" ADD COLUMN IF NOT EXISTS "icon_2_file_id" INTEGER REFERENCES files(id) ON DELETE SET NULL;
ALTER TABLE "weapons" ADD COLUMN IF NOT EXISTS "icon_ascension_file_id" INTEGER REFERENCES files(id) ON DELETE SET NULL;
ALTER TABLE "foods" ADD COLUMN IF NOT EXISTS "icon_normal_file_id" INTEGER REFERENCES files(id) ON DELETE SET NULL;
ALTER TABLE "foods" ADD COLUMN IF NOT EXISTS "icon_delicious_file_id" INTEGER REFERENCES files(id) ON DELETE SET NULL;
ALTER TABLE "foods" ADD COLUMN IF NOT EXISTS "icon_suspicious_file_id" INTEGER REFERENCES files(id) ON DELETE SET NULL;
ALTER TABLE "materials" ADD COLUMN IF NOT EXISTS "icon_file_id" INTEGER REFERENCES files(id) ON DELETE SET NULL;
ALTER TABLE "banners" ADD COLUMN IF NOT EXISTS "icon_file_id" INTEGER REFERENCES files(id) ON DELETE SET NULL;
ALTER TABLE "backgrounds" ADD COLUMN IF NOT EXISTS "image_file_id" INTEGER REFERENCES files(id) ON DELETE SET NULL;
ALTER TABLE "backgrounds" ADD COLUMN IF NOT EXISTS "preview_file_id" INTEGER REFERENCES files(id) ON DELETE SET NULL;

-- What every backfill below joins through.
CREATE INDEX IF NOT EXISTS files_category_name_ext_idx ON files (category_id, name, extension);

-- ── Backfill ─────────────────────────────────────────────────────────────

-- characters.icon  (category character.icon)
UPDATE "characters" t SET "icon_file_id" = f.id
FROM files f JOIN file_categories fc ON fc.id = f.category_id
WHERE fc.code = 'character.icon'
  AND t."icon" IS NOT NULL AND t."icon" <> ''
  AND f.name = t."icon_name"
  AND f.extension = lower(regexp_replace(t."icon", '^.*\.', ''));

-- characters.card_icon  (category character.card_icon)
UPDATE "characters" t SET "card_icon_file_id" = f.id
FROM files f JOIN file_categories fc ON fc.id = f.category_id
WHERE fc.code = 'character.card_icon'
  AND t."card_icon" IS NOT NULL AND t."card_icon" <> ''
  AND f.name = t."card_icon_name"
  AND f.extension = lower(regexp_replace(t."card_icon", '^.*\.', ''));

-- characters.card_icon_2  (category character.card_icon)
UPDATE "characters" t SET "card_icon_2_file_id" = f.id
FROM files f JOIN file_categories fc ON fc.id = f.category_id
WHERE fc.code = 'character.card_icon'
  AND t."card_icon_2" IS NOT NULL AND t."card_icon_2" <> ''
  AND f.name = t."card_icon_2_name"
  AND f.extension = lower(regexp_replace(t."card_icon_2", '^.*\.', ''));

-- characters.wish_icon  (category character.wish_icon)
UPDATE "characters" t SET "wish_icon_file_id" = f.id
FROM files f JOIN file_categories fc ON fc.id = f.category_id
WHERE fc.code = 'character.wish_icon'
  AND t."wish_icon" IS NOT NULL AND t."wish_icon" <> ''
  AND f.name = t."wish_icon_name"
  AND f.extension = lower(regexp_replace(t."wish_icon", '^.*\.', ''));

-- characters.ingame_icon  (category character.ingame_icon)
UPDATE "characters" t SET "ingame_icon_file_id" = f.id
FROM files f JOIN file_categories fc ON fc.id = f.category_id
WHERE fc.code = 'character.ingame_icon'
  AND t."ingame_icon" IS NOT NULL AND t."ingame_icon" <> ''
  AND f.name = t."ingame_icon_name"
  AND f.extension = lower(regexp_replace(t."ingame_icon", '^.*\.', ''));

-- characters.ingame_icon_2  (category character.ingame_icon)
UPDATE "characters" t SET "ingame_icon_2_file_id" = f.id
FROM files f JOIN file_categories fc ON fc.id = f.category_id
WHERE fc.code = 'character.ingame_icon'
  AND t."ingame_icon_2" IS NOT NULL AND t."ingame_icon_2" <> ''
  AND f.name = t."ingame_icon_2_name"
  AND f.extension = lower(regexp_replace(t."ingame_icon_2", '^.*\.', ''));

-- characters.namecard_icon  (category character.namecard_icon)
UPDATE "characters" t SET "namecard_icon_file_id" = f.id
FROM files f JOIN file_categories fc ON fc.id = f.category_id
WHERE fc.code = 'character.namecard_icon'
  AND t."namecard_icon" IS NOT NULL AND t."namecard_icon" <> ''
  AND f.name = t."namecard_icon_name"
  AND f.extension = lower(regexp_replace(t."namecard_icon", '^.*\.', ''));

-- characters.namecard_background  (category character.namecard_background)
UPDATE "characters" t SET "namecard_background_file_id" = f.id
FROM files f JOIN file_categories fc ON fc.id = f.category_id
WHERE fc.code = 'character.namecard_background'
  AND t."namecard_background" IS NOT NULL AND t."namecard_background" <> ''
  AND f.name = t."namecard_background_name"
  AND f.extension = lower(regexp_replace(t."namecard_background", '^.*\.', ''));

-- characters.namecard_banner  (category character.namecard_banner)
UPDATE "characters" t SET "namecard_banner_file_id" = f.id
FROM files f JOIN file_categories fc ON fc.id = f.category_id
WHERE fc.code = 'character.namecard_banner'
  AND t."namecard_banner" IS NOT NULL AND t."namecard_banner" <> ''
  AND f.name = t."namecard_banner_name"
  AND f.extension = lower(regexp_replace(t."namecard_banner", '^.*\.', ''));

-- characters_constellations.icon  (category character.constellations)
UPDATE "characters_constellations" t SET "icon_file_id" = f.id
FROM files f JOIN file_categories fc ON fc.id = f.category_id
WHERE fc.code = 'character.constellations'
  AND t."icon" IS NOT NULL AND t."icon" <> ''
  AND f.name = t."icon_name"
  AND f.extension = lower(regexp_replace(t."icon", '^.*\.', ''));

-- characters_talents.icon  (category character.talents)
UPDATE "characters_talents" t SET "icon_file_id" = f.id
FROM files f JOIN file_categories fc ON fc.id = f.category_id
WHERE fc.code = 'character.talents'
  AND t."icon" IS NOT NULL AND t."icon" <> ''
  AND f.name = t."icon_name"
  AND f.extension = lower(regexp_replace(t."icon", '^.*\.', ''));

-- characters_voice_overs.audio_english  (category character.voice_overs)
UPDATE "characters_voice_overs" t SET "audio_english_file_id" = f.id
FROM files f JOIN file_categories fc ON fc.id = f.category_id
WHERE fc.code = 'character.voice_overs'
  AND t."audio_english" IS NOT NULL AND t."audio_english" <> ''
  AND f.name = regexp_replace(t."audio_english", '^assets/character/voice_overs/(.*)\.[^.]+$', '\1')
  AND f.extension = lower(regexp_replace(t."audio_english", '^.*\.', ''));

-- characters_voice_overs.audio_japanese  (category character.voice_overs)
UPDATE "characters_voice_overs" t SET "audio_japanese_file_id" = f.id
FROM files f JOIN file_categories fc ON fc.id = f.category_id
WHERE fc.code = 'character.voice_overs'
  AND t."audio_japanese" IS NOT NULL AND t."audio_japanese" <> ''
  AND f.name = regexp_replace(t."audio_japanese", '^assets/character/voice_overs/(.*)\.[^.]+$', '\1')
  AND f.extension = lower(regexp_replace(t."audio_japanese", '^.*\.', ''));

-- characters_voice_overs.audio_chinese  (category character.voice_overs)
UPDATE "characters_voice_overs" t SET "audio_chinese_file_id" = f.id
FROM files f JOIN file_categories fc ON fc.id = f.category_id
WHERE fc.code = 'character.voice_overs'
  AND t."audio_chinese" IS NOT NULL AND t."audio_chinese" <> ''
  AND f.name = regexp_replace(t."audio_chinese", '^assets/character/voice_overs/(.*)\.[^.]+$', '\1')
  AND f.extension = lower(regexp_replace(t."audio_chinese", '^.*\.', ''));

-- characters_voice_overs.audio_korean  (category character.voice_overs)
UPDATE "characters_voice_overs" t SET "audio_korean_file_id" = f.id
FROM files f JOIN file_categories fc ON fc.id = f.category_id
WHERE fc.code = 'character.voice_overs'
  AND t."audio_korean" IS NOT NULL AND t."audio_korean" <> ''
  AND f.name = regexp_replace(t."audio_korean", '^assets/character/voice_overs/(.*)\.[^.]+$', '\1')
  AND f.extension = lower(regexp_replace(t."audio_korean", '^.*\.', ''));

-- enemies.icon  (category enemies)
UPDATE "enemies" t SET "icon_file_id" = f.id
FROM files f JOIN file_categories fc ON fc.id = f.category_id
WHERE fc.code = 'enemies'
  AND t."icon" IS NOT NULL AND t."icon" <> ''
  AND f.name = t."icon_name"
  AND f.extension = lower(regexp_replace(t."icon", '^.*\.', ''));

-- enemies_phases.icon  (category enemies)
UPDATE "enemies_phases" t SET "icon_file_id" = f.id
FROM files f JOIN file_categories fc ON fc.id = f.category_id
WHERE fc.code = 'enemies'
  AND t."icon" IS NOT NULL AND t."icon" <> ''
  AND f.name = t."icon_name"
  AND f.extension = lower(regexp_replace(t."icon", '^.*\.', ''));

-- enemies_phases.art  (category enemies)
UPDATE "enemies_phases" t SET "art_file_id" = f.id
FROM files f JOIN file_categories fc ON fc.id = f.category_id
WHERE fc.code = 'enemies'
  AND t."art" IS NOT NULL AND t."art" <> ''
  AND f.name = t."art_name"
  AND f.extension = lower(regexp_replace(t."art", '^.*\.', ''));

-- artifacts.icon  (category artifacts)
UPDATE "artifacts" t SET "icon_file_id" = f.id
FROM files f JOIN file_categories fc ON fc.id = f.category_id
WHERE fc.code = 'artifacts'
  AND t."icon" IS NOT NULL AND t."icon" <> ''
  AND f.name = t."icon_name"
  AND f.extension = lower(regexp_replace(t."icon", '^.*\.', ''));

-- artifacts_pieces.icon  (category artifacts)
UPDATE "artifacts_pieces" t SET "icon_file_id" = f.id
FROM files f JOIN file_categories fc ON fc.id = f.category_id
WHERE fc.code = 'artifacts'
  AND t."icon" IS NOT NULL AND t."icon" <> ''
  AND f.name = t."icon_name"
  AND f.extension = lower(regexp_replace(t."icon", '^.*\.', ''));

-- weapons.icon  (category weapons)
UPDATE "weapons" t SET "icon_file_id" = f.id
FROM files f JOIN file_categories fc ON fc.id = f.category_id
WHERE fc.code = 'weapons'
  AND t."icon" IS NOT NULL AND t."icon" <> ''
  AND f.name = t."icon_name"
  AND f.extension = lower(regexp_replace(t."icon", '^.*\.', ''));

-- weapons.icon_2  (category weapons)
UPDATE "weapons" t SET "icon_2_file_id" = f.id
FROM files f JOIN file_categories fc ON fc.id = f.category_id
WHERE fc.code = 'weapons'
  AND t."icon_2" IS NOT NULL AND t."icon_2" <> ''
  AND f.name = t."icon_2_name"
  AND f.extension = lower(regexp_replace(t."icon_2", '^.*\.', ''));

-- weapons.icon_ascension  (category weapons)
UPDATE "weapons" t SET "icon_ascension_file_id" = f.id
FROM files f JOIN file_categories fc ON fc.id = f.category_id
WHERE fc.code = 'weapons'
  AND t."icon_ascension" IS NOT NULL AND t."icon_ascension" <> ''
  AND f.name = t."icon_ascension_name"
  AND f.extension = lower(regexp_replace(t."icon_ascension", '^.*\.', ''));

-- foods.icon_normal  (category foods)
UPDATE "foods" t SET "icon_normal_file_id" = f.id
FROM files f JOIN file_categories fc ON fc.id = f.category_id
WHERE fc.code = 'foods'
  AND t."icon_normal" IS NOT NULL AND t."icon_normal" <> ''
  AND f.name = t."icon_normal_name"
  AND f.extension = lower(regexp_replace(t."icon_normal", '^.*\.', ''));

-- foods.icon_delicious  (category foods)
UPDATE "foods" t SET "icon_delicious_file_id" = f.id
FROM files f JOIN file_categories fc ON fc.id = f.category_id
WHERE fc.code = 'foods'
  AND t."icon_delicious" IS NOT NULL AND t."icon_delicious" <> ''
  AND f.name = t."icon_delicious_name"
  AND f.extension = lower(regexp_replace(t."icon_delicious", '^.*\.', ''));

-- foods.icon_suspicious  (category foods)
UPDATE "foods" t SET "icon_suspicious_file_id" = f.id
FROM files f JOIN file_categories fc ON fc.id = f.category_id
WHERE fc.code = 'foods'
  AND t."icon_suspicious" IS NOT NULL AND t."icon_suspicious" <> ''
  AND f.name = t."icon_suspicious_name"
  AND f.extension = lower(regexp_replace(t."icon_suspicious", '^.*\.', ''));

-- materials.icon  (category materials)
UPDATE "materials" t SET "icon_file_id" = f.id
FROM files f JOIN file_categories fc ON fc.id = f.category_id
WHERE fc.code = 'materials'
  AND t."icon" IS NOT NULL AND t."icon" <> ''
  AND f.name = t."icon_name"
  AND f.extension = lower(regexp_replace(t."icon", '^.*\.', ''));

-- banners.icon  (category banners)
UPDATE "banners" t SET "icon_file_id" = f.id
FROM files f JOIN file_categories fc ON fc.id = f.category_id
WHERE fc.code = 'banners'
  AND t."icon" IS NOT NULL AND t."icon" <> ''
  AND f.name = t."icon_name"
  AND f.extension = lower(regexp_replace(t."icon", '^.*\.', ''));

-- backgrounds.image  (category backgrounds)
UPDATE "backgrounds" t SET "image_file_id" = f.id
FROM files f JOIN file_categories fc ON fc.id = f.category_id
WHERE fc.code = 'backgrounds'
  AND t."image" IS NOT NULL AND t."image" <> ''
  AND f.name = t."image_name"
  AND f.extension = lower(regexp_replace(t."image", '^.*\.', ''));

-- backgrounds.preview  (category backgrounds)
UPDATE "backgrounds" t SET "preview_file_id" = f.id
FROM files f JOIN file_categories fc ON fc.id = f.category_id
WHERE fc.code = 'backgrounds'
  AND t."preview" IS NOT NULL AND t."preview" <> ''
  AND f.name = t."preview_name"
  AND f.extension = lower(regexp_replace(t."preview", '^.*\.', ''));


-- ── Backfill again, by name alone ────────────────────────────────────────
--
-- Every row the pass above could not reach, because there was no path to
-- read an extension from. Exact filename first, then the upper-snake form,
-- and the converted avif ahead of the original either way.

-- characters.icon_name  (category character.icon)
UPDATE "characters" t SET "icon_file_id" = (
    SELECT f.id FROM files f JOIN file_categories fc ON fc.id = f.category_id
     WHERE fc.code = 'character.icon'
       AND (f.name = t."icon_name" OR f.name = regexp_replace(regexp_replace(upper(regexp_replace(t."icon_name", '[''’"-]', '', 'g')), '[^A-Z0-9]+', '_', 'g'), '^_+|_+$', '', 'g'))
     ORDER BY (f.name = t."icon_name") DESC, (f.extension = 'avif') DESC, f.id
     LIMIT 1)
WHERE "icon_file_id" IS NULL AND t."icon_name" IS NOT NULL AND t."icon_name" <> '';

-- characters.card_icon_name  (category character.card_icon)
UPDATE "characters" t SET "card_icon_file_id" = (
    SELECT f.id FROM files f JOIN file_categories fc ON fc.id = f.category_id
     WHERE fc.code = 'character.card_icon'
       AND (f.name = t."card_icon_name" OR f.name = regexp_replace(regexp_replace(upper(regexp_replace(t."card_icon_name", '[''’"-]', '', 'g')), '[^A-Z0-9]+', '_', 'g'), '^_+|_+$', '', 'g'))
     ORDER BY (f.name = t."card_icon_name") DESC, (f.extension = 'avif') DESC, f.id
     LIMIT 1)
WHERE "card_icon_file_id" IS NULL AND t."card_icon_name" IS NOT NULL AND t."card_icon_name" <> '';

-- characters.card_icon_2_name  (category character.card_icon)
UPDATE "characters" t SET "card_icon_2_file_id" = (
    SELECT f.id FROM files f JOIN file_categories fc ON fc.id = f.category_id
     WHERE fc.code = 'character.card_icon'
       AND (f.name = t."card_icon_2_name" OR f.name = regexp_replace(regexp_replace(upper(regexp_replace(t."card_icon_2_name", '[''’"-]', '', 'g')), '[^A-Z0-9]+', '_', 'g'), '^_+|_+$', '', 'g'))
     ORDER BY (f.name = t."card_icon_2_name") DESC, (f.extension = 'avif') DESC, f.id
     LIMIT 1)
WHERE "card_icon_2_file_id" IS NULL AND t."card_icon_2_name" IS NOT NULL AND t."card_icon_2_name" <> '';

-- characters.wish_icon_name  (category character.wish_icon)
UPDATE "characters" t SET "wish_icon_file_id" = (
    SELECT f.id FROM files f JOIN file_categories fc ON fc.id = f.category_id
     WHERE fc.code = 'character.wish_icon'
       AND (f.name = t."wish_icon_name" OR f.name = regexp_replace(regexp_replace(upper(regexp_replace(t."wish_icon_name", '[''’"-]', '', 'g')), '[^A-Z0-9]+', '_', 'g'), '^_+|_+$', '', 'g'))
     ORDER BY (f.name = t."wish_icon_name") DESC, (f.extension = 'avif') DESC, f.id
     LIMIT 1)
WHERE "wish_icon_file_id" IS NULL AND t."wish_icon_name" IS NOT NULL AND t."wish_icon_name" <> '';

-- characters.ingame_icon_name  (category character.ingame_icon)
UPDATE "characters" t SET "ingame_icon_file_id" = (
    SELECT f.id FROM files f JOIN file_categories fc ON fc.id = f.category_id
     WHERE fc.code = 'character.ingame_icon'
       AND (f.name = t."ingame_icon_name" OR f.name = regexp_replace(regexp_replace(upper(regexp_replace(t."ingame_icon_name", '[''’"-]', '', 'g')), '[^A-Z0-9]+', '_', 'g'), '^_+|_+$', '', 'g'))
     ORDER BY (f.name = t."ingame_icon_name") DESC, (f.extension = 'avif') DESC, f.id
     LIMIT 1)
WHERE "ingame_icon_file_id" IS NULL AND t."ingame_icon_name" IS NOT NULL AND t."ingame_icon_name" <> '';

-- characters.ingame_icon_2_name  (category character.ingame_icon)
UPDATE "characters" t SET "ingame_icon_2_file_id" = (
    SELECT f.id FROM files f JOIN file_categories fc ON fc.id = f.category_id
     WHERE fc.code = 'character.ingame_icon'
       AND (f.name = t."ingame_icon_2_name" OR f.name = regexp_replace(regexp_replace(upper(regexp_replace(t."ingame_icon_2_name", '[''’"-]', '', 'g')), '[^A-Z0-9]+', '_', 'g'), '^_+|_+$', '', 'g'))
     ORDER BY (f.name = t."ingame_icon_2_name") DESC, (f.extension = 'avif') DESC, f.id
     LIMIT 1)
WHERE "ingame_icon_2_file_id" IS NULL AND t."ingame_icon_2_name" IS NOT NULL AND t."ingame_icon_2_name" <> '';

-- characters.namecard_icon_name  (category character.namecard_icon)
UPDATE "characters" t SET "namecard_icon_file_id" = (
    SELECT f.id FROM files f JOIN file_categories fc ON fc.id = f.category_id
     WHERE fc.code = 'character.namecard_icon'
       AND (f.name = t."namecard_icon_name" OR f.name = regexp_replace(regexp_replace(upper(regexp_replace(t."namecard_icon_name", '[''’"-]', '', 'g')), '[^A-Z0-9]+', '_', 'g'), '^_+|_+$', '', 'g'))
     ORDER BY (f.name = t."namecard_icon_name") DESC, (f.extension = 'avif') DESC, f.id
     LIMIT 1)
WHERE "namecard_icon_file_id" IS NULL AND t."namecard_icon_name" IS NOT NULL AND t."namecard_icon_name" <> '';

-- characters.namecard_background_name  (category character.namecard_background)
UPDATE "characters" t SET "namecard_background_file_id" = (
    SELECT f.id FROM files f JOIN file_categories fc ON fc.id = f.category_id
     WHERE fc.code = 'character.namecard_background'
       AND (f.name = t."namecard_background_name" OR f.name = regexp_replace(regexp_replace(upper(regexp_replace(t."namecard_background_name", '[''’"-]', '', 'g')), '[^A-Z0-9]+', '_', 'g'), '^_+|_+$', '', 'g'))
     ORDER BY (f.name = t."namecard_background_name") DESC, (f.extension = 'avif') DESC, f.id
     LIMIT 1)
WHERE "namecard_background_file_id" IS NULL AND t."namecard_background_name" IS NOT NULL AND t."namecard_background_name" <> '';

-- characters.namecard_banner_name  (category character.namecard_banner)
UPDATE "characters" t SET "namecard_banner_file_id" = (
    SELECT f.id FROM files f JOIN file_categories fc ON fc.id = f.category_id
     WHERE fc.code = 'character.namecard_banner'
       AND (f.name = t."namecard_banner_name" OR f.name = regexp_replace(regexp_replace(upper(regexp_replace(t."namecard_banner_name", '[''’"-]', '', 'g')), '[^A-Z0-9]+', '_', 'g'), '^_+|_+$', '', 'g'))
     ORDER BY (f.name = t."namecard_banner_name") DESC, (f.extension = 'avif') DESC, f.id
     LIMIT 1)
WHERE "namecard_banner_file_id" IS NULL AND t."namecard_banner_name" IS NOT NULL AND t."namecard_banner_name" <> '';

-- characters_constellations.icon_name  (category character.constellations)
UPDATE "characters_constellations" t SET "icon_file_id" = (
    SELECT f.id FROM files f JOIN file_categories fc ON fc.id = f.category_id
     WHERE fc.code = 'character.constellations'
       AND (f.name = t."icon_name" OR f.name = regexp_replace(regexp_replace(upper(regexp_replace(t."icon_name", '[''’"-]', '', 'g')), '[^A-Z0-9]+', '_', 'g'), '^_+|_+$', '', 'g'))
     ORDER BY (f.name = t."icon_name") DESC, (f.extension = 'avif') DESC, f.id
     LIMIT 1)
WHERE "icon_file_id" IS NULL AND t."icon_name" IS NOT NULL AND t."icon_name" <> '';

-- characters_talents.icon_name  (category character.talents)
UPDATE "characters_talents" t SET "icon_file_id" = (
    SELECT f.id FROM files f JOIN file_categories fc ON fc.id = f.category_id
     WHERE fc.code = 'character.talents'
       AND (f.name = t."icon_name" OR f.name = regexp_replace(regexp_replace(upper(regexp_replace(t."icon_name", '[''’"-]', '', 'g')), '[^A-Z0-9]+', '_', 'g'), '^_+|_+$', '', 'g'))
     ORDER BY (f.name = t."icon_name") DESC, (f.extension = 'avif') DESC, f.id
     LIMIT 1)
WHERE "icon_file_id" IS NULL AND t."icon_name" IS NOT NULL AND t."icon_name" <> '';

-- enemies.icon_name  (category enemies)
UPDATE "enemies" t SET "icon_file_id" = (
    SELECT f.id FROM files f JOIN file_categories fc ON fc.id = f.category_id
     WHERE fc.code = 'enemies'
       AND (f.name = t."icon_name" OR f.name = regexp_replace(regexp_replace(upper(regexp_replace(t."icon_name", '[''’"-]', '', 'g')), '[^A-Z0-9]+', '_', 'g'), '^_+|_+$', '', 'g'))
     ORDER BY (f.name = t."icon_name") DESC, (f.extension = 'avif') DESC, f.id
     LIMIT 1)
WHERE "icon_file_id" IS NULL AND t."icon_name" IS NOT NULL AND t."icon_name" <> '';

-- enemies_phases.icon_name  (category enemies)
UPDATE "enemies_phases" t SET "icon_file_id" = (
    SELECT f.id FROM files f JOIN file_categories fc ON fc.id = f.category_id
     WHERE fc.code = 'enemies'
       AND (f.name = t."icon_name" OR f.name = regexp_replace(regexp_replace(upper(regexp_replace(t."icon_name", '[''’"-]', '', 'g')), '[^A-Z0-9]+', '_', 'g'), '^_+|_+$', '', 'g'))
     ORDER BY (f.name = t."icon_name") DESC, (f.extension = 'avif') DESC, f.id
     LIMIT 1)
WHERE "icon_file_id" IS NULL AND t."icon_name" IS NOT NULL AND t."icon_name" <> '';

-- enemies_phases.art_name  (category enemies)
UPDATE "enemies_phases" t SET "art_file_id" = (
    SELECT f.id FROM files f JOIN file_categories fc ON fc.id = f.category_id
     WHERE fc.code = 'enemies'
       AND (f.name = t."art_name" OR f.name = regexp_replace(regexp_replace(upper(regexp_replace(t."art_name", '[''’"-]', '', 'g')), '[^A-Z0-9]+', '_', 'g'), '^_+|_+$', '', 'g'))
     ORDER BY (f.name = t."art_name") DESC, (f.extension = 'avif') DESC, f.id
     LIMIT 1)
WHERE "art_file_id" IS NULL AND t."art_name" IS NOT NULL AND t."art_name" <> '';

-- artifacts.icon_name  (category artifacts)
UPDATE "artifacts" t SET "icon_file_id" = (
    SELECT f.id FROM files f JOIN file_categories fc ON fc.id = f.category_id
     WHERE fc.code = 'artifacts'
       AND (f.name = t."icon_name" OR f.name = regexp_replace(regexp_replace(upper(regexp_replace(t."icon_name", '[''’"-]', '', 'g')), '[^A-Z0-9]+', '_', 'g'), '^_+|_+$', '', 'g'))
     ORDER BY (f.name = t."icon_name") DESC, (f.extension = 'avif') DESC, f.id
     LIMIT 1)
WHERE "icon_file_id" IS NULL AND t."icon_name" IS NOT NULL AND t."icon_name" <> '';

-- artifacts_pieces.icon_name  (category artifacts)
UPDATE "artifacts_pieces" t SET "icon_file_id" = (
    SELECT f.id FROM files f JOIN file_categories fc ON fc.id = f.category_id
     WHERE fc.code = 'artifacts'
       AND (f.name = t."icon_name" OR f.name = regexp_replace(regexp_replace(upper(regexp_replace(t."icon_name", '[''’"-]', '', 'g')), '[^A-Z0-9]+', '_', 'g'), '^_+|_+$', '', 'g'))
     ORDER BY (f.name = t."icon_name") DESC, (f.extension = 'avif') DESC, f.id
     LIMIT 1)
WHERE "icon_file_id" IS NULL AND t."icon_name" IS NOT NULL AND t."icon_name" <> '';

-- weapons.icon_name  (category weapons)
UPDATE "weapons" t SET "icon_file_id" = (
    SELECT f.id FROM files f JOIN file_categories fc ON fc.id = f.category_id
     WHERE fc.code = 'weapons'
       AND (f.name = t."icon_name" OR f.name = regexp_replace(regexp_replace(upper(regexp_replace(t."icon_name", '[''’"-]', '', 'g')), '[^A-Z0-9]+', '_', 'g'), '^_+|_+$', '', 'g'))
     ORDER BY (f.name = t."icon_name") DESC, (f.extension = 'avif') DESC, f.id
     LIMIT 1)
WHERE "icon_file_id" IS NULL AND t."icon_name" IS NOT NULL AND t."icon_name" <> '';

-- weapons.icon_2_name  (category weapons)
UPDATE "weapons" t SET "icon_2_file_id" = (
    SELECT f.id FROM files f JOIN file_categories fc ON fc.id = f.category_id
     WHERE fc.code = 'weapons'
       AND (f.name = t."icon_2_name" OR f.name = regexp_replace(regexp_replace(upper(regexp_replace(t."icon_2_name", '[''’"-]', '', 'g')), '[^A-Z0-9]+', '_', 'g'), '^_+|_+$', '', 'g'))
     ORDER BY (f.name = t."icon_2_name") DESC, (f.extension = 'avif') DESC, f.id
     LIMIT 1)
WHERE "icon_2_file_id" IS NULL AND t."icon_2_name" IS NOT NULL AND t."icon_2_name" <> '';

-- weapons.icon_ascension_name  (category weapons)
UPDATE "weapons" t SET "icon_ascension_file_id" = (
    SELECT f.id FROM files f JOIN file_categories fc ON fc.id = f.category_id
     WHERE fc.code = 'weapons'
       AND (f.name = t."icon_ascension_name" OR f.name = regexp_replace(regexp_replace(upper(regexp_replace(t."icon_ascension_name", '[''’"-]', '', 'g')), '[^A-Z0-9]+', '_', 'g'), '^_+|_+$', '', 'g'))
     ORDER BY (f.name = t."icon_ascension_name") DESC, (f.extension = 'avif') DESC, f.id
     LIMIT 1)
WHERE "icon_ascension_file_id" IS NULL AND t."icon_ascension_name" IS NOT NULL AND t."icon_ascension_name" <> '';

-- foods.icon_normal_name  (category foods)
UPDATE "foods" t SET "icon_normal_file_id" = (
    SELECT f.id FROM files f JOIN file_categories fc ON fc.id = f.category_id
     WHERE fc.code = 'foods'
       AND (f.name = t."icon_normal_name" OR f.name = regexp_replace(regexp_replace(upper(regexp_replace(t."icon_normal_name", '[''’"-]', '', 'g')), '[^A-Z0-9]+', '_', 'g'), '^_+|_+$', '', 'g'))
     ORDER BY (f.name = t."icon_normal_name") DESC, (f.extension = 'avif') DESC, f.id
     LIMIT 1)
WHERE "icon_normal_file_id" IS NULL AND t."icon_normal_name" IS NOT NULL AND t."icon_normal_name" <> '';

-- foods.icon_delicious_name  (category foods)
UPDATE "foods" t SET "icon_delicious_file_id" = (
    SELECT f.id FROM files f JOIN file_categories fc ON fc.id = f.category_id
     WHERE fc.code = 'foods'
       AND (f.name = t."icon_delicious_name" OR f.name = regexp_replace(regexp_replace(upper(regexp_replace(t."icon_delicious_name", '[''’"-]', '', 'g')), '[^A-Z0-9]+', '_', 'g'), '^_+|_+$', '', 'g'))
     ORDER BY (f.name = t."icon_delicious_name") DESC, (f.extension = 'avif') DESC, f.id
     LIMIT 1)
WHERE "icon_delicious_file_id" IS NULL AND t."icon_delicious_name" IS NOT NULL AND t."icon_delicious_name" <> '';

-- foods.icon_suspicious_name  (category foods)
UPDATE "foods" t SET "icon_suspicious_file_id" = (
    SELECT f.id FROM files f JOIN file_categories fc ON fc.id = f.category_id
     WHERE fc.code = 'foods'
       AND (f.name = t."icon_suspicious_name" OR f.name = regexp_replace(regexp_replace(upper(regexp_replace(t."icon_suspicious_name", '[''’"-]', '', 'g')), '[^A-Z0-9]+', '_', 'g'), '^_+|_+$', '', 'g'))
     ORDER BY (f.name = t."icon_suspicious_name") DESC, (f.extension = 'avif') DESC, f.id
     LIMIT 1)
WHERE "icon_suspicious_file_id" IS NULL AND t."icon_suspicious_name" IS NOT NULL AND t."icon_suspicious_name" <> '';

-- materials.icon_name  (category materials)
UPDATE "materials" t SET "icon_file_id" = (
    SELECT f.id FROM files f JOIN file_categories fc ON fc.id = f.category_id
     WHERE fc.code = 'materials'
       AND (f.name = t."icon_name" OR f.name = regexp_replace(regexp_replace(upper(regexp_replace(t."icon_name", '[''’"-]', '', 'g')), '[^A-Z0-9]+', '_', 'g'), '^_+|_+$', '', 'g'))
     ORDER BY (f.name = t."icon_name") DESC, (f.extension = 'avif') DESC, f.id
     LIMIT 1)
WHERE "icon_file_id" IS NULL AND t."icon_name" IS NOT NULL AND t."icon_name" <> '';

-- banners.icon_name  (category banners)
UPDATE "banners" t SET "icon_file_id" = (
    SELECT f.id FROM files f JOIN file_categories fc ON fc.id = f.category_id
     WHERE fc.code = 'banners'
       AND (f.name = t."icon_name" OR f.name = regexp_replace(regexp_replace(upper(regexp_replace(t."icon_name", '[''’"-]', '', 'g')), '[^A-Z0-9]+', '_', 'g'), '^_+|_+$', '', 'g'))
     ORDER BY (f.name = t."icon_name") DESC, (f.extension = 'avif') DESC, f.id
     LIMIT 1)
WHERE "icon_file_id" IS NULL AND t."icon_name" IS NOT NULL AND t."icon_name" <> '';

-- backgrounds.image_name  (category backgrounds)
UPDATE "backgrounds" t SET "image_file_id" = (
    SELECT f.id FROM files f JOIN file_categories fc ON fc.id = f.category_id
     WHERE fc.code = 'backgrounds'
       AND (f.name = t."image_name" OR f.name = regexp_replace(regexp_replace(upper(regexp_replace(t."image_name", '[''’"-]', '', 'g')), '[^A-Z0-9]+', '_', 'g'), '^_+|_+$', '', 'g'))
     ORDER BY (f.name = t."image_name") DESC, (f.extension = 'avif') DESC, f.id
     LIMIT 1)
WHERE "image_file_id" IS NULL AND t."image_name" IS NOT NULL AND t."image_name" <> '';

-- backgrounds.preview_name  (category backgrounds)
UPDATE "backgrounds" t SET "preview_file_id" = (
    SELECT f.id FROM files f JOIN file_categories fc ON fc.id = f.category_id
     WHERE fc.code = 'backgrounds'
       AND (f.name = t."preview_name" OR f.name = regexp_replace(regexp_replace(upper(regexp_replace(t."preview_name", '[''’"-]', '', 'g')), '[^A-Z0-9]+', '_', 'g'), '^_+|_+$', '', 'g'))
     ORDER BY (f.name = t."preview_name") DESC, (f.extension = 'avif') DESC, f.id
     LIMIT 1)
WHERE "preview_file_id" IS NULL AND t."preview_name" IS NOT NULL AND t."preview_name" <> '';
-- ── Verify before anything is dropped ────────────────────────────────────
--
-- A row whose old column is populated and whose new one did not backfill
-- aborts the whole migration - migration.php runs each file in one
-- transaction, so a RAISE here rolls every ALTER and UPDATE above back
-- rather than leaving the schema half converted. The twelve Traveler rows
-- are the one expected exception on characters' own seven image columns -
-- see above - so those seven counts exclude is_traveler rows and every
-- other column is checked in full.
DO $$
DECLARE
    missed INTEGER;
    total_missed INTEGER := 0;
BEGIN
    SELECT count(*) INTO missed FROM "characters"
     WHERE ("icon" IS NOT NULL AND "icon" <> '' OR "icon_name" IS NOT NULL AND "icon_name" <> '') AND "icon_file_id" IS NULL AND is_traveler = FALSE;
    IF missed > 0 THEN
        RAISE NOTICE '% row(s) of characters.icon did not backfill', missed;
        total_missed := total_missed + missed;
    END IF;

    SELECT count(*) INTO missed FROM "characters"
     WHERE ("card_icon" IS NOT NULL AND "card_icon" <> '' OR "card_icon_name" IS NOT NULL AND "card_icon_name" <> '') AND "card_icon_file_id" IS NULL AND is_traveler = FALSE;
    IF missed > 0 THEN
        RAISE NOTICE '% row(s) of characters.card_icon did not backfill', missed;
        total_missed := total_missed + missed;
    END IF;

    SELECT count(*) INTO missed FROM "characters"
     WHERE ("card_icon_2" IS NOT NULL AND "card_icon_2" <> '' OR "card_icon_2_name" IS NOT NULL AND "card_icon_2_name" <> '') AND "card_icon_2_file_id" IS NULL AND is_traveler = FALSE;
    IF missed > 0 THEN
        RAISE NOTICE '% row(s) of characters.card_icon_2 did not backfill', missed;
        total_missed := total_missed + missed;
    END IF;

    SELECT count(*) INTO missed FROM "characters"
     WHERE ("wish_icon" IS NOT NULL AND "wish_icon" <> '' OR "wish_icon_name" IS NOT NULL AND "wish_icon_name" <> '') AND "wish_icon_file_id" IS NULL AND is_traveler = FALSE;
    IF missed > 0 THEN
        RAISE NOTICE '% row(s) of characters.wish_icon did not backfill', missed;
        total_missed := total_missed + missed;
    END IF;

    SELECT count(*) INTO missed FROM "characters"
     WHERE ("ingame_icon" IS NOT NULL AND "ingame_icon" <> '' OR "ingame_icon_name" IS NOT NULL AND "ingame_icon_name" <> '') AND "ingame_icon_file_id" IS NULL AND is_traveler = FALSE;
    IF missed > 0 THEN
        RAISE NOTICE '% row(s) of characters.ingame_icon did not backfill', missed;
        total_missed := total_missed + missed;
    END IF;

    SELECT count(*) INTO missed FROM "characters"
     WHERE ("ingame_icon_2" IS NOT NULL AND "ingame_icon_2" <> '' OR "ingame_icon_2_name" IS NOT NULL AND "ingame_icon_2_name" <> '') AND "ingame_icon_2_file_id" IS NULL AND is_traveler = FALSE;
    IF missed > 0 THEN
        RAISE NOTICE '% row(s) of characters.ingame_icon_2 did not backfill', missed;
        total_missed := total_missed + missed;
    END IF;

    SELECT count(*) INTO missed FROM "characters"
     WHERE ("namecard_icon" IS NOT NULL AND "namecard_icon" <> '' OR "namecard_icon_name" IS NOT NULL AND "namecard_icon_name" <> '') AND "namecard_icon_file_id" IS NULL AND is_traveler = FALSE;
    IF missed > 0 THEN
        RAISE NOTICE '% row(s) of characters.namecard_icon did not backfill', missed;
        total_missed := total_missed + missed;
    END IF;

    SELECT count(*) INTO missed FROM "characters"
     WHERE ("namecard_background" IS NOT NULL AND "namecard_background" <> '' OR "namecard_background_name" IS NOT NULL AND "namecard_background_name" <> '') AND "namecard_background_file_id" IS NULL AND is_traveler = FALSE;
    IF missed > 0 THEN
        RAISE NOTICE '% row(s) of characters.namecard_background did not backfill', missed;
        total_missed := total_missed + missed;
    END IF;

    SELECT count(*) INTO missed FROM "characters"
     WHERE ("namecard_banner" IS NOT NULL AND "namecard_banner" <> '' OR "namecard_banner_name" IS NOT NULL AND "namecard_banner_name" <> '') AND "namecard_banner_file_id" IS NULL AND is_traveler = FALSE;
    IF missed > 0 THEN
        RAISE NOTICE '% row(s) of characters.namecard_banner did not backfill', missed;
        total_missed := total_missed + missed;
    END IF;

    SELECT count(*) INTO missed FROM "characters_constellations"
     WHERE ("icon" IS NOT NULL AND "icon" <> '' OR "icon_name" IS NOT NULL AND "icon_name" <> '') AND "icon_file_id" IS NULL;
    IF missed > 0 THEN
        RAISE NOTICE '% row(s) of characters_constellations.icon did not backfill', missed;
        total_missed := total_missed + missed;
    END IF;

    SELECT count(*) INTO missed FROM "characters_talents"
     WHERE ("icon" IS NOT NULL AND "icon" <> '' OR "icon_name" IS NOT NULL AND "icon_name" <> '') AND "icon_file_id" IS NULL;
    IF missed > 0 THEN
        RAISE NOTICE '% row(s) of characters_talents.icon did not backfill', missed;
        total_missed := total_missed + missed;
    END IF;

    SELECT count(*) INTO missed FROM "characters_voice_overs"
     WHERE "audio_english" IS NOT NULL AND "audio_english" <> '' AND "audio_english_file_id" IS NULL;
    IF missed > 0 THEN
        RAISE NOTICE '% row(s) of characters_voice_overs.audio_english did not backfill', missed;
        total_missed := total_missed + missed;
    END IF;

    SELECT count(*) INTO missed FROM "characters_voice_overs"
     WHERE "audio_japanese" IS NOT NULL AND "audio_japanese" <> '' AND "audio_japanese_file_id" IS NULL;
    IF missed > 0 THEN
        RAISE NOTICE '% row(s) of characters_voice_overs.audio_japanese did not backfill', missed;
        total_missed := total_missed + missed;
    END IF;

    SELECT count(*) INTO missed FROM "characters_voice_overs"
     WHERE "audio_chinese" IS NOT NULL AND "audio_chinese" <> '' AND "audio_chinese_file_id" IS NULL;
    IF missed > 0 THEN
        RAISE NOTICE '% row(s) of characters_voice_overs.audio_chinese did not backfill', missed;
        total_missed := total_missed + missed;
    END IF;

    SELECT count(*) INTO missed FROM "characters_voice_overs"
     WHERE "audio_korean" IS NOT NULL AND "audio_korean" <> '' AND "audio_korean_file_id" IS NULL;
    IF missed > 0 THEN
        RAISE NOTICE '% row(s) of characters_voice_overs.audio_korean did not backfill', missed;
        total_missed := total_missed + missed;
    END IF;

    SELECT count(*) INTO missed FROM "enemies"
     WHERE ("icon" IS NOT NULL AND "icon" <> '' OR "icon_name" IS NOT NULL AND "icon_name" <> '') AND "icon_file_id" IS NULL;
    IF missed > 0 THEN
        RAISE NOTICE '% row(s) of enemies.icon did not backfill', missed;
        total_missed := total_missed + missed;
    END IF;

    SELECT count(*) INTO missed FROM "enemies_phases"
     WHERE ("icon" IS NOT NULL AND "icon" <> '' OR "icon_name" IS NOT NULL AND "icon_name" <> '') AND "icon_file_id" IS NULL;
    IF missed > 0 THEN
        RAISE NOTICE '% row(s) of enemies_phases.icon did not backfill', missed;
        total_missed := total_missed + missed;
    END IF;

    SELECT count(*) INTO missed FROM "enemies_phases"
     WHERE ("art" IS NOT NULL AND "art" <> '' OR "art_name" IS NOT NULL AND "art_name" <> '') AND "art_file_id" IS NULL;
    IF missed > 0 THEN
        RAISE NOTICE '% row(s) of enemies_phases.art did not backfill', missed;
        total_missed := total_missed + missed;
    END IF;

    SELECT count(*) INTO missed FROM "artifacts"
     WHERE ("icon" IS NOT NULL AND "icon" <> '' OR "icon_name" IS NOT NULL AND "icon_name" <> '') AND "icon_file_id" IS NULL;
    IF missed > 0 THEN
        RAISE NOTICE '% row(s) of artifacts.icon did not backfill', missed;
        total_missed := total_missed + missed;
    END IF;

    SELECT count(*) INTO missed FROM "artifacts_pieces"
     WHERE ("icon" IS NOT NULL AND "icon" <> '' OR "icon_name" IS NOT NULL AND "icon_name" <> '') AND "icon_file_id" IS NULL;
    IF missed > 0 THEN
        RAISE NOTICE '% row(s) of artifacts_pieces.icon did not backfill', missed;
        total_missed := total_missed + missed;
    END IF;

    SELECT count(*) INTO missed FROM "weapons"
     WHERE ("icon" IS NOT NULL AND "icon" <> '' OR "icon_name" IS NOT NULL AND "icon_name" <> '') AND "icon_file_id" IS NULL;
    IF missed > 0 THEN
        RAISE NOTICE '% row(s) of weapons.icon did not backfill', missed;
        total_missed := total_missed + missed;
    END IF;

    SELECT count(*) INTO missed FROM "weapons"
     WHERE ("icon_2" IS NOT NULL AND "icon_2" <> '' OR "icon_2_name" IS NOT NULL AND "icon_2_name" <> '') AND "icon_2_file_id" IS NULL;
    IF missed > 0 THEN
        RAISE NOTICE '% row(s) of weapons.icon_2 did not backfill', missed;
        total_missed := total_missed + missed;
    END IF;

    SELECT count(*) INTO missed FROM "weapons"
     WHERE ("icon_ascension" IS NOT NULL AND "icon_ascension" <> '' OR "icon_ascension_name" IS NOT NULL AND "icon_ascension_name" <> '') AND "icon_ascension_file_id" IS NULL;
    IF missed > 0 THEN
        RAISE NOTICE '% row(s) of weapons.icon_ascension did not backfill', missed;
        total_missed := total_missed + missed;
    END IF;

    SELECT count(*) INTO missed FROM "foods"
     WHERE ("icon_normal" IS NOT NULL AND "icon_normal" <> '' OR "icon_normal_name" IS NOT NULL AND "icon_normal_name" <> '') AND "icon_normal_file_id" IS NULL;
    IF missed > 0 THEN
        RAISE NOTICE '% row(s) of foods.icon_normal did not backfill', missed;
        total_missed := total_missed + missed;
    END IF;

    SELECT count(*) INTO missed FROM "foods"
     WHERE ("icon_delicious" IS NOT NULL AND "icon_delicious" <> '' OR "icon_delicious_name" IS NOT NULL AND "icon_delicious_name" <> '') AND "icon_delicious_file_id" IS NULL;
    IF missed > 0 THEN
        RAISE NOTICE '% row(s) of foods.icon_delicious did not backfill', missed;
        total_missed := total_missed + missed;
    END IF;

    SELECT count(*) INTO missed FROM "foods"
     WHERE ("icon_suspicious" IS NOT NULL AND "icon_suspicious" <> '' OR "icon_suspicious_name" IS NOT NULL AND "icon_suspicious_name" <> '') AND "icon_suspicious_file_id" IS NULL;
    IF missed > 0 THEN
        RAISE NOTICE '% row(s) of foods.icon_suspicious did not backfill', missed;
        total_missed := total_missed + missed;
    END IF;

    SELECT count(*) INTO missed FROM "materials"
     WHERE ("icon" IS NOT NULL AND "icon" <> '' OR "icon_name" IS NOT NULL AND "icon_name" <> '') AND "icon_file_id" IS NULL;
    IF missed > 0 THEN
        RAISE NOTICE '% row(s) of materials.icon did not backfill', missed;
        total_missed := total_missed + missed;
    END IF;

    SELECT count(*) INTO missed FROM "banners"
     WHERE ("icon" IS NOT NULL AND "icon" <> '' OR "icon_name" IS NOT NULL AND "icon_name" <> '') AND "icon_file_id" IS NULL;
    IF missed > 0 THEN
        RAISE NOTICE '% row(s) of banners.icon did not backfill', missed;
        total_missed := total_missed + missed;
    END IF;

    SELECT count(*) INTO missed FROM "backgrounds"
     WHERE ("image" IS NOT NULL AND "image" <> '' OR "image_name" IS NOT NULL AND "image_name" <> '') AND "image_file_id" IS NULL;
    IF missed > 0 THEN
        RAISE NOTICE '% row(s) of backgrounds.image did not backfill', missed;
        total_missed := total_missed + missed;
    END IF;

    SELECT count(*) INTO missed FROM "backgrounds"
     WHERE ("preview" IS NOT NULL AND "preview" <> '' OR "preview_name" IS NOT NULL AND "preview_name" <> '') AND "preview_file_id" IS NULL;
    IF missed > 0 THEN
        RAISE NOTICE '% row(s) of backgrounds.preview did not backfill', missed;
        total_missed := total_missed + missed;
    END IF;

    IF total_missed > 0 THEN
        RAISE EXCEPTION '% row(s) across the asset columns did not backfill - see the notices above', total_missed;
    END IF;
END $$;

-- ── Drop the old columns ─────────────────────────────────────────────────
--
-- Only reached if every row above backfilled.
ALTER TABLE "characters" DROP COLUMN IF EXISTS "icon";
ALTER TABLE "characters" DROP COLUMN IF EXISTS "icon_name";
ALTER TABLE "characters" DROP COLUMN IF EXISTS "card_icon";
ALTER TABLE "characters" DROP COLUMN IF EXISTS "card_icon_name";
ALTER TABLE "characters" DROP COLUMN IF EXISTS "card_icon_2";
ALTER TABLE "characters" DROP COLUMN IF EXISTS "card_icon_2_name";
ALTER TABLE "characters" DROP COLUMN IF EXISTS "wish_icon";
ALTER TABLE "characters" DROP COLUMN IF EXISTS "wish_icon_name";
ALTER TABLE "characters" DROP COLUMN IF EXISTS "ingame_icon";
ALTER TABLE "characters" DROP COLUMN IF EXISTS "ingame_icon_name";
ALTER TABLE "characters" DROP COLUMN IF EXISTS "ingame_icon_2";
ALTER TABLE "characters" DROP COLUMN IF EXISTS "ingame_icon_2_name";
ALTER TABLE "characters" DROP COLUMN IF EXISTS "namecard_icon";
ALTER TABLE "characters" DROP COLUMN IF EXISTS "namecard_icon_name";
ALTER TABLE "characters" DROP COLUMN IF EXISTS "namecard_background";
ALTER TABLE "characters" DROP COLUMN IF EXISTS "namecard_background_name";
ALTER TABLE "characters" DROP COLUMN IF EXISTS "namecard_banner";
ALTER TABLE "characters" DROP COLUMN IF EXISTS "namecard_banner_name";
ALTER TABLE "characters_constellations" DROP COLUMN IF EXISTS "icon";
ALTER TABLE "characters_constellations" DROP COLUMN IF EXISTS "icon_name";
ALTER TABLE "characters_talents" DROP COLUMN IF EXISTS "icon";
ALTER TABLE "characters_talents" DROP COLUMN IF EXISTS "icon_name";
ALTER TABLE "characters_voice_overs" DROP COLUMN IF EXISTS "audio_english";
ALTER TABLE "characters_voice_overs" DROP COLUMN IF EXISTS "audio_japanese";
ALTER TABLE "characters_voice_overs" DROP COLUMN IF EXISTS "audio_chinese";
ALTER TABLE "characters_voice_overs" DROP COLUMN IF EXISTS "audio_korean";
ALTER TABLE "enemies" DROP COLUMN IF EXISTS "icon";
ALTER TABLE "enemies" DROP COLUMN IF EXISTS "icon_name";
ALTER TABLE "enemies_phases" DROP COLUMN IF EXISTS "icon";
ALTER TABLE "enemies_phases" DROP COLUMN IF EXISTS "icon_name";
ALTER TABLE "enemies_phases" DROP COLUMN IF EXISTS "art";
ALTER TABLE "enemies_phases" DROP COLUMN IF EXISTS "art_name";
ALTER TABLE "artifacts" DROP COLUMN IF EXISTS "icon";
ALTER TABLE "artifacts" DROP COLUMN IF EXISTS "icon_name";
ALTER TABLE "artifacts_pieces" DROP COLUMN IF EXISTS "icon";
ALTER TABLE "artifacts_pieces" DROP COLUMN IF EXISTS "icon_name";
ALTER TABLE "weapons" DROP COLUMN IF EXISTS "icon";
ALTER TABLE "weapons" DROP COLUMN IF EXISTS "icon_name";
ALTER TABLE "weapons" DROP COLUMN IF EXISTS "icon_2";
ALTER TABLE "weapons" DROP COLUMN IF EXISTS "icon_2_name";
ALTER TABLE "weapons" DROP COLUMN IF EXISTS "icon_ascension";
ALTER TABLE "weapons" DROP COLUMN IF EXISTS "icon_ascension_name";
ALTER TABLE "foods" DROP COLUMN IF EXISTS "icon_normal";
ALTER TABLE "foods" DROP COLUMN IF EXISTS "icon_normal_name";
ALTER TABLE "foods" DROP COLUMN IF EXISTS "icon_delicious";
ALTER TABLE "foods" DROP COLUMN IF EXISTS "icon_delicious_name";
ALTER TABLE "foods" DROP COLUMN IF EXISTS "icon_suspicious";
ALTER TABLE "foods" DROP COLUMN IF EXISTS "icon_suspicious_name";
ALTER TABLE "materials" DROP COLUMN IF EXISTS "icon";
ALTER TABLE "materials" DROP COLUMN IF EXISTS "icon_name";
ALTER TABLE "banners" DROP COLUMN IF EXISTS "icon";
ALTER TABLE "banners" DROP COLUMN IF EXISTS "icon_name";
ALTER TABLE "backgrounds" DROP COLUMN IF EXISTS "image";
ALTER TABLE "backgrounds" DROP COLUMN IF EXISTS "image_name";
ALTER TABLE "backgrounds" DROP COLUMN IF EXISTS "preview";
ALTER TABLE "backgrounds" DROP COLUMN IF EXISTS "preview_name";
