-----------------------------------------------------------
-- DATABASE LIST PAGE STRINGS
--
-- The four database list pages (characters, materials, weapons, banners) all
-- share one filter bar vocabulary, so the keys sit under database.filters.*
-- rather than being repeated per page: "Version" is the same word on all four
-- and a translator should only have to answer for it once.
--
-- Scoped to this game for the same reason as 008 - Star Rail filters light
-- cones by path, not weapons by type, so it would not reuse these.
-----------------------------------------------------------

INSERT INTO translation_keys (name, description, site) VALUES
    ('database.filters.element', 'Filter group label on the characters list', 'genshin_impact'),
    ('database.filters.weaponType', 'Filter group label for weapon type', 'genshin_impact'),
    ('database.filters.rarity', 'Filter group label for the star rating', 'genshin_impact'),
    ('database.filters.region', 'Filter dropdown label', 'genshin_impact'),
    ('database.filters.version', 'Filter dropdown label', 'genshin_impact'),
    ('database.filters.category', 'Filter dropdown label on the materials list', 'genshin_impact'),
    ('database.filters.name', 'Filter text box label', 'genshin_impact'),
    ('database.filters.characterName', 'Filter text box label on the banners list', 'genshin_impact'),
    ('database.filters.weaponName', 'Filter text box label on the banners list', 'genshin_impact'),
    ('database.filters.contains', 'Placeholder in a name filter, saying the match is partial', 'genshin_impact'),
    ('database.filters.reset', 'Button that clears every filter', 'genshin_impact'),
    ('database.filters.anyRegion', 'Empty option in the region dropdown', 'genshin_impact'),
    ('database.filters.anyVersion', 'Empty option in the version dropdown', 'genshin_impact'),
    ('database.filters.anyCategory', 'Empty option in the category dropdown', 'genshin_impact'),
    ('database.results.count', 'How many rows survived the filters - {shown} and {total} are counts', 'genshin_impact'),
    ('database.results.none', 'Shown in place of the grid when nothing matches', 'genshin_impact')
ON CONFLICT (name) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'en', v.value FROM (VALUES
    ('database.filters.element', 'Element'),
    ('database.filters.weaponType', 'Weapon'),
    ('database.filters.rarity', 'Rarity'),
    ('database.filters.region', 'Region'),
    ('database.filters.version', 'Version'),
    ('database.filters.category', 'Category'),
    ('database.filters.name', 'Name'),
    ('database.filters.characterName', 'Character name'),
    ('database.filters.weaponName', 'Weapon name'),
    ('database.filters.contains', 'contains'),
    ('database.filters.reset', 'Reset'),
    ('database.filters.anyRegion', 'Any region'),
    ('database.filters.anyVersion', 'Any version'),
    ('database.filters.anyCategory', 'Any category'),
    ('database.results.count', 'Showing {shown} of {total}'),
    ('database.results.none', 'Nothing matches these filters.')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'sk', v.value FROM (VALUES
    ('database.filters.element', 'Živel'),
    ('database.filters.weaponType', 'Zbraň'),
    ('database.filters.rarity', 'Vzácnosť'),
    ('database.filters.region', 'Región'),
    ('database.filters.version', 'Verzia'),
    ('database.filters.category', 'Kategória'),
    ('database.filters.name', 'Názov'),
    ('database.filters.characterName', 'Meno postavy'),
    ('database.filters.weaponName', 'Názov zbrane'),
    ('database.filters.contains', 'obsahuje'),
    ('database.filters.reset', 'Zrušiť filtre'),
    ('database.filters.anyRegion', 'Ľubovoľný región'),
    ('database.filters.anyVersion', 'Ľubovoľná verzia'),
    ('database.filters.anyCategory', 'Ľubovoľná kategória'),
    ('database.results.count', 'Zobrazených {shown} z {total}'),
    ('database.results.none', 'Filtrom nezodpovedá nič.')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;
