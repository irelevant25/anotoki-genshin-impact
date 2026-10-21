-----------------------------------------------------------
-- THE DATABASE LISTS' NEW LOOK (2026-10-21)
--
-- The owner's choice among the mockups of 2026-10-21 ("E"): the character,
-- weapon and material lists put every filter in one card - the list's main
-- facet a wide track with names and counts, the rest under it - and show
-- their rows as tiles in sections by region, rarity or version; the banners
-- page takes the same head and card. These are the words those pages say
-- that the database had none for. users/051's shape: a key is its name and
-- its description (the code's, never edited in the admin panel; its
-- placeholders named), each language's string is inserted only where it has
-- none (ON CONFLICT DO NOTHING), informal Slovak ("ty").
--
-- A counted sentence is three keys under one prefix - `one`, `few`, `other`,
-- the names Intl.PluralRules gives them - and the page picks one by the
-- reader's language (users/062; frontend/src/app/shared/dynamic-keys.ts
-- declares the prefixes). English never asks for `few`; it holds the same
-- words as `other`.
-----------------------------------------------------------

INSERT INTO translation_keys (name, description) VALUES
    ('database.filters.search', 'Label above the search box in the characters, weapons and materials lists'' filter card (the banners page labels its two by what they search). No placeholders.'),
    ('database.filters.all', 'The first segment of a list''s main filter track, which clears the choice: every element, every weapon type, every rarity. Its count follows it. No placeholders.'),
    ('database.filters.type', 'Label above the weapons list''s main track: the weapon type (sword, bow, ...). No placeholders.'),
    ('database.filters.groupBy', 'Label above the control that chooses how a database list is sectioned - by region, version, rarity, or not at all. No placeholders.'),
    ('database.filters.group.region', 'A way of sectioning a database list: one section a region. No placeholders.'),
    ('database.filters.group.version', 'A way of sectioning a database list: one section a game version. No placeholders.'),
    ('database.filters.group.rarity', 'A way of sectioning a database list: one section a rarity (the weapons). No placeholders.'),
    ('database.filters.group.none', 'A way of sectioning a database list: no sections, one grid. No placeholders.'),
    ('database.list.other', 'Heading of the last section of a grouped database list: the rows that have no value to group by - a Traveler without a region, a row without a version. No placeholders.'),
    ('database.list.version', 'Heading of a section of a database list grouped by version. {version} is the version as the pages write it ("4.4", "6.2 (Luna III)").'),
    ('database.characters.count.one', 'How many characters: the characters list''s total and each section''s count, {n} being 1. The `one` form of a counted sentence (users/062).'),
    ('database.characters.count.few', 'How many characters, {n} of them, the `few` form - 2 to 4 in Slovak; English never asks for it.'),
    ('database.characters.count.other', 'How many characters, {n} of them, the `other` form - 5 and more in Slovak, 2 and more in English.'),
    ('database.weapons.count.one', 'How many weapons: the weapons list''s total and each section''s count, {n} being 1. The `one` form of a counted sentence (users/062).'),
    ('database.weapons.count.few', 'How many weapons, {n} of them, the `few` form - 2 to 4 in Slovak; English never asks for it.'),
    ('database.weapons.count.other', 'How many weapons, {n} of them, the `other` form - 5 and more in Slovak, 2 and more in English.'),
    ('database.materials.count.one', 'How many materials: the materials list''s total and each section''s count, {n} being 1. The `one` form of a counted sentence (users/062).'),
    ('database.materials.count.few', 'How many materials, {n} of them, the `few` form - 2 to 4 in Slovak; English never asks for it.'),
    ('database.materials.count.other', 'How many materials, {n} of them, the `other` form - 5 and more in Slovak, 2 and more in English.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'en', v.value FROM (VALUES
    ('database.filters.search', 'Search'),
    ('database.filters.all', 'All'),
    ('database.filters.type', 'Type'),
    ('database.filters.groupBy', 'Group by'),
    ('database.filters.group.region', 'Region'),
    ('database.filters.group.version', 'Version'),
    ('database.filters.group.rarity', 'Rarity'),
    ('database.filters.group.none', 'None'),
    ('database.list.other', 'Other'),
    ('database.list.version', 'Version {version}'),
    ('database.characters.count.one', '{n} character'),
    ('database.characters.count.few', '{n} characters'),
    ('database.characters.count.other', '{n} characters'),
    ('database.weapons.count.one', '{n} weapon'),
    ('database.weapons.count.few', '{n} weapons'),
    ('database.weapons.count.other', '{n} weapons'),
    ('database.materials.count.one', '{n} material'),
    ('database.materials.count.few', '{n} materials'),
    ('database.materials.count.other', '{n} materials')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'sk', v.value FROM (VALUES
    ('database.filters.search', 'Hľadať'),
    ('database.filters.all', 'Všetky'),
    ('database.filters.type', 'Typ'),
    ('database.filters.groupBy', 'Zoskupiť podľa'),
    ('database.filters.group.region', 'Región'),
    ('database.filters.group.version', 'Verzia'),
    ('database.filters.group.rarity', 'Vzácnosť'),
    ('database.filters.group.none', 'Bez zoskupenia'),
    ('database.list.other', 'Ostatné'),
    ('database.list.version', 'Verzia {version}'),
    ('database.characters.count.one', '{n} postava'),
    ('database.characters.count.few', '{n} postavy'),
    ('database.characters.count.other', '{n} postáv'),
    ('database.weapons.count.one', '{n} zbraň'),
    ('database.weapons.count.few', '{n} zbrane'),
    ('database.weapons.count.other', '{n} zbraní'),
    ('database.materials.count.one', '{n} materiál'),
    ('database.materials.count.few', '{n} materiály'),
    ('database.materials.count.other', '{n} materiálov')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

-- The search box's old label, "Name": the three lists were the only pages
-- that said it, and their box stands under "Search" now (users/062's rule:
-- a word nobody says any more goes, its strings with it - ON DELETE CASCADE).
DELETE FROM translation_keys WHERE name = 'database.filters.name';

-- Every key above exists with both languages' strings, whichever of them this
-- file inserted: a key that was there already with one language missing would
-- otherwise go unnoticed until a page showed its name.
DO $$
DECLARE
    missing TEXT;
BEGIN
    SELECT string_agg(k.name, ', ' ORDER BY k.name) INTO missing
      FROM (VALUES
          ('database.filters.search'),
          ('database.filters.all'),
          ('database.filters.type'),
          ('database.filters.groupBy'),
          ('database.filters.group.region'),
          ('database.filters.group.version'),
          ('database.filters.group.rarity'),
          ('database.filters.group.none'),
          ('database.list.other'),
          ('database.list.version'),
          ('database.characters.count.one'),
          ('database.characters.count.few'),
          ('database.characters.count.other'),
          ('database.weapons.count.one'),
          ('database.weapons.count.few'),
          ('database.weapons.count.other'),
          ('database.materials.count.one'),
          ('database.materials.count.few'),
          ('database.materials.count.other')
      ) AS k(name)
     WHERE NOT EXISTS (SELECT 1 FROM translation_keys tk WHERE tk.name = k.name)
        OR NOT EXISTS (SELECT 1 FROM translations t WHERE t.key_name = k.name AND t.language_code = 'en')
        OR NOT EXISTS (SELECT 1 FROM translations t WHERE t.key_name = k.name AND t.language_code = 'sk');
    IF missing IS NOT NULL THEN
        RAISE EXCEPTION 'keys without an English and a Slovak string: %', missing;
    END IF;
END $$;
