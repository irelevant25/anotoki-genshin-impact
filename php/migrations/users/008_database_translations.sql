-----------------------------------------------------------
-- DATABASE SECTION STRINGS
--
-- The database section on the site pipes its card titles, blurbs and help
-- tooltips through the translate pipe, but the keys were never created: the
-- tooltips rendered the literal text "database.characters.about" and the
-- titles only looked right because a missing key falls back to itself.
--
-- Scoped to this game rather than shared. These name and describe this
-- game's database, and the equivalent Star Rail section would not agree with
-- them - it has light cones where this has weapons, and warps where this has
-- banners.
-----------------------------------------------------------

INSERT INTO translation_keys (name, description, site) VALUES
    ('database.characters.title', 'Database section name', 'genshin_impact'),
    ('database.characters.info', 'Database section card text', 'genshin_impact'),
    ('database.characters.about', 'Help tooltip on the section card', 'genshin_impact'),
    ('database.materials.title', 'Database section name', 'genshin_impact'),
    ('database.materials.info', 'Database section card text', 'genshin_impact'),
    ('database.materials.about', 'Help tooltip on the section card', 'genshin_impact'),
    ('database.weapons.title', 'Database section name', 'genshin_impact'),
    ('database.weapons.info', 'Database section card text', 'genshin_impact'),
    ('database.weapons.about', 'Help tooltip on the section card', 'genshin_impact'),
    ('database.banners.title', 'Database section name', 'genshin_impact'),
    ('database.banners.info', 'Database section card text', 'genshin_impact'),
    ('database.banners.about', 'Help tooltip on the section card', 'genshin_impact')
ON CONFLICT (name) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'en', v.value FROM (VALUES
    ('database.characters.title', 'Characters'),
    ('database.characters.info', 'Browse through the characters in the game and learn more about them.'),
    ('database.characters.about', 'About Characters'),
    ('database.materials.title', 'Materials'),
    ('database.materials.info', 'Browse through the materials in the game and learn more about them.'),
    ('database.materials.about', 'About Materials'),
    ('database.weapons.title', 'Weapons'),
    ('database.weapons.info', 'Browse through the weapons in the game and learn more about them.'),
    ('database.weapons.about', 'About Weapons'),
    ('database.banners.title', 'Banners'),
    ('database.banners.info', 'Browse through the wishes in the game and learn more about them.'),
    ('database.banners.about', 'About Banners')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'sk', v.value FROM (VALUES
    ('database.characters.title', 'Postavy'),
    ('database.characters.info', 'Prezerajte si postavy v hre a dozviete sa o nich viac.'),
    ('database.characters.about', 'O postavách'),
    ('database.materials.title', 'Materiály'),
    ('database.materials.info', 'Prezerajte si materiály v hre a dozviete sa o nich viac.'),
    ('database.materials.about', 'O materiáloch'),
    ('database.weapons.title', 'Zbrane'),
    ('database.weapons.info', 'Prezerajte si zbrane v hre a dozviete sa o nich viac.'),
    ('database.weapons.about', 'O zbraniach'),
    ('database.banners.title', 'Bannery'),
    ('database.banners.info', 'Prezerajte si priania v hre a dozviete sa o nich viac.'),
    ('database.banners.about', 'O banneroch')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;
