-----------------------------------------------------------
-- A RECORD OF WHAT IS ON DISK
--
-- Until now the asset tree was its own record. Eighty-eight thousand files,
-- and the only way to ask anything about them was to walk the folder: which
-- of them nothing references, which category a file belongs to, who put it
-- there. A walk answers the first, guesses at the second and cannot answer
-- the third at all.
--
-- Two tables. `file_categories` says which kinds of asset exist and where each
-- kind lives; `files` is a row per file, in a category, with the name and
-- extension kept apart so a format change is an update rather than a rewrite.
--
-- ── The path ────────────────────────────────────────────────────────────────
--
-- A file's path is its category's path, then its name, then its extension:
--
--   character/icon  +  BAIZHU        + avif  ->  character/icon/BAIZHU.avif
--   artifacts       +  ADVENTURER    + png   ->  artifacts/ADVENTURER.png
--
-- `name` is the path *within* the category, not just a base name, and that is
-- what lets one category cover the voice overs. Those live four levels deep,
-- per character, per kind, per language - 76,240 of the 88,426 files in the
-- tree - and a category per folder would mean several thousand categories
-- nobody would ever look at:
--
--   character/voice_overs + Aino/combat/en/Elemental Burst 01 + opus
--
-- ── Unfiled ─────────────────────────────────────────────────────────────────
--
-- One category is special and seeded here: `unfiled`. A file with no category
-- would need `category_id` to be nullable, and a nullable column in a unique
-- key means Postgres treats two nulls as different - so two rows could claim
-- the same missing category and the same name. A real row avoids that, and it
-- gives the loose files somewhere to actually be: `assets/unfiled/`.
--
-- It is marked `is_system` so the admin page will not let it be renamed or
-- removed, because everything else depends on it existing.
-----------------------------------------------------------

CREATE TABLE IF NOT EXISTS file_categories (
    id SERIAL PRIMARY KEY,
    -- Dotted, the way the front end already names asset folders in
    -- appAssetFolder: 'character.icon', 'materials', 'character.voice_overs'.
    code VARCHAR(100) NOT NULL,
    label VARCHAR(150) NOT NULL,
    -- Stored rather than derived from the code. They agree today, and keeping
    -- it separate is what lets a category be renamed without moving anything,
    -- or point somewhere the dotted code could not spell.
    path VARCHAR(255) NOT NULL,
    -- Soft, so a category that turns out to have been in use can come back and
    -- so the audit trail still has something to point at.
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    -- The one nothing may remove, because every uncategorised file needs it.
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order SMALLINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT file_categories_code_unique UNIQUE (code),
    CONSTRAINT file_categories_path_unique UNIQUE (path)
);

CREATE TABLE IF NOT EXISTS files (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES file_categories(id),
    -- Without the extension, and without the category's path in front of it.
    name VARCHAR(500) NOT NULL,
    -- Lower case, no dot. Kept apart from the name so that converting a file
    -- to AVIF is one column changing rather than every reference being rewritten.
    extension VARCHAR(20) NOT NULL,
    size BIGINT,
    modified_at TIMESTAMP,
    -- Null where the file was found on disk rather than uploaded - the check
    -- that adopts strays cannot know who put them there, and saying "system"
    -- is more honest than naming whoever happened to press the button.
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT files_unique UNIQUE (category_id, name, extension)
);

-- The two lookups every page does: everything in a category, and "is this
-- exact file already known" during a reconcile over eighty thousand files.
CREATE INDEX IF NOT EXISTS files_category_idx ON files (category_id);
CREATE INDEX IF NOT EXISTS files_extension_idx ON files (extension);

-- ── The categories the tree already has ─────────────────────────────────────
--
-- Seeded from the folders that hold files today. Anything else found on disk
-- is adopted into `unfiled` by the reconcile, rather than inventing a category
-- for a folder somebody may have made by accident.

INSERT INTO file_categories (code, label, path, is_system, sort_order) VALUES
    ('unfiled',                       'Unfiled',                    'unfiled',                       TRUE,   0),
    ('character.icon',                'Character icon',             'character/icon',                FALSE, 10),
    ('character.card',                'Character card',             'character/card',                FALSE, 11),
    ('character.card_icon',           'Character card icon',        'character/card_icon',           FALSE, 12),
    ('character.ingame',              'Character in-game art',      'character/ingame',              FALSE, 13),
    ('character.ingame_icon',         'Character in-game icon',     'character/ingame_icon',         FALSE, 14),
    ('character.wish_icon',           'Character wish icon',        'character/wish_icon',           FALSE, 15),
    ('character.constellations',      'Constellations',             'character/constellations',      FALSE, 16),
    ('character.talents',             'Talents',                    'character/talents',             FALSE, 17),
    ('character.namecard_background', 'Namecard background',        'character/namecard_background', FALSE, 18),
    ('character.namecard_banner',     'Namecard banner',            'character/namecard_banner',     FALSE, 19),
    ('character.namecard_icon',       'Namecard icon',              'character/namecard_icon',       FALSE, 20),
    ('character.demo_music',          'Demo music',                 'character/demo_music',          FALSE, 21),
    ('character.voice_overs',         'Voice overs',                'character/voice_overs',         FALSE, 22),
    ('artifacts',                     'Artifacts',                  'artifacts',                     FALSE, 30),
    ('weapons',                       'Weapons',                    'weapons',                       FALSE, 31),
    ('materials',                     'Materials',                  'materials',                     FALSE, 32),
    ('foods',                         'Foods',                      'foods',                         FALSE, 33),
    ('food_type',                     'Food types',                 'food_type',                     FALSE, 34),
    ('enemies',                       'Enemies',                    'enemies',                       FALSE, 35),
    ('banners',                       'Banners',                    'banners',                       FALSE, 36),
    ('backgrounds',                   'Backgrounds',                'backgrounds',                   FALSE, 37),
    ('elements',                      'Elements',                   'elements',                      FALSE, 40),
    ('regions',                       'Regions',                    'regions',                       FALSE, 41),
    ('roles',                         'Roles',                      'roles',                         FALSE, 42),
    ('weapon_types',                  'Weapon types',               'weapon_types',                  FALSE, 43)
ON CONFLICT (code) DO NOTHING;
