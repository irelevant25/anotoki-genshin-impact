-----------------------------------------------------------
-- DATABASE DETAIL PAGE STRINGS
--
-- Labels on the character, weapon and material detail pages. Shared across the
-- three wherever the word is the same - "Cost", "Phase", "Description" mean the
-- same thing on all of them, so they are named once under database.detail.*.
--
-- Stat names (HP, ATK, DEF) and the values coming out of the game data are left
-- untranslated on purpose: they are printed as the game prints them.
-----------------------------------------------------------

INSERT INTO translation_keys (name, description, site) VALUES
    ('database.detail.back', 'Button returning to the list', 'genshin_impact'),
    ('database.detail.notFound', 'Shown when the id in the URL matches nothing', 'genshin_impact'),
    ('database.detail.description', 'Section heading', 'genshin_impact'),
    ('database.detail.howToObtain', 'Section heading', 'genshin_impact'),
    ('database.detail.releaseDate', 'Fact label', 'genshin_impact'),
    ('database.detail.primaryStat', 'Fact label and weapon ascension column', 'genshin_impact'),
    ('database.detail.secondaryStat', 'Fact label and weapon ascension column', 'genshin_impact'),
    ('database.detail.effects', 'Section heading on the weapon page', 'genshin_impact'),
    ('database.detail.refinements', 'Section heading on the weapon page', 'genshin_impact'),
    ('database.detail.ascensions', 'Section heading on the weapon and character pages', 'genshin_impact'),
    ('database.detail.phase', 'Ascension table column', 'genshin_impact'),
    ('database.detail.level', 'Ascension and talent cost table column', 'genshin_impact'),
    ('database.detail.cost', 'Ascension and talent cost table column', 'genshin_impact'),
    ('database.detail.group', 'Fact label on the material page', 'genshin_impact'),
    ('database.detail.usedFor', 'Section heading listing what spends this material', 'genshin_impact'),
    ('database.detail.usedNowhere', 'Shown when nothing spends this material', 'genshin_impact'),
    ('database.detail.charactersAscension', 'Sub-heading in the material usage list - {count} is how many', 'genshin_impact'),
    ('database.detail.charactersTalent', 'Sub-heading in the material usage list - {count} is how many', 'genshin_impact'),
    ('database.detail.weaponsAscension', 'Sub-heading in the material usage list - {count} is how many', 'genshin_impact'),
    ('database.detail.weaponsRefinement', 'Sub-heading in the material usage list - {count} is how many', 'genshin_impact'),
    ('database.detail.birthday', 'Fact label on the character page', 'genshin_impact'),
    ('database.detail.affiliations', 'Fact label on the character page', 'genshin_impact'),
    ('database.detail.roles', 'Fact label on the character page', 'genshin_impact'),
    ('database.detail.talents', 'Section heading on the character page', 'genshin_impact'),
    ('database.detail.constellations', 'Section heading on the character page', 'genshin_impact'),
    ('database.detail.talentCost', 'Section heading on the character page', 'genshin_impact')
ON CONFLICT (name) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'en', v.value FROM (VALUES
    ('database.detail.back', 'Back'),
    ('database.detail.notFound', 'Not found.'),
    ('database.detail.description', 'Description'),
    ('database.detail.howToObtain', 'How to obtain'),
    ('database.detail.releaseDate', 'Release date'),
    ('database.detail.primaryStat', 'Primary stat'),
    ('database.detail.secondaryStat', 'Secondary stat'),
    ('database.detail.effects', 'Effects'),
    ('database.detail.refinements', 'Refinements'),
    ('database.detail.ascensions', 'Ascensions'),
    ('database.detail.phase', 'Phase'),
    ('database.detail.level', 'Level'),
    ('database.detail.cost', 'Cost'),
    ('database.detail.group', 'Group'),
    ('database.detail.usedFor', 'Used for'),
    ('database.detail.usedNowhere', 'Nothing uses this material.'),
    ('database.detail.charactersAscension', 'Character ascension ({count})'),
    ('database.detail.charactersTalent', 'Character talents ({count})'),
    ('database.detail.weaponsAscension', 'Weapon ascension ({count})'),
    ('database.detail.weaponsRefinement', 'Weapon refinement ({count})'),
    ('database.detail.birthday', 'Birthday'),
    ('database.detail.affiliations', 'Affiliations'),
    ('database.detail.roles', 'Roles'),
    ('database.detail.talents', 'Talents'),
    ('database.detail.constellations', 'Constellations'),
    ('database.detail.talentCost', 'Talent cost')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'sk', v.value FROM (VALUES
    ('database.detail.back', 'Späť'),
    ('database.detail.notFound', 'Nenájdené.'),
    ('database.detail.description', 'Popis'),
    ('database.detail.howToObtain', 'Ako získať'),
    ('database.detail.releaseDate', 'Dátum vydania'),
    ('database.detail.primaryStat', 'Hlavná vlastnosť'),
    ('database.detail.secondaryStat', 'Vedľajšia vlastnosť'),
    ('database.detail.effects', 'Efekty'),
    ('database.detail.refinements', 'Rafinácie'),
    ('database.detail.ascensions', 'Povýšenia'),
    ('database.detail.phase', 'Fáza'),
    ('database.detail.level', 'Úroveň'),
    ('database.detail.cost', 'Cena'),
    ('database.detail.group', 'Skupina'),
    ('database.detail.usedFor', 'Použitie'),
    ('database.detail.usedNowhere', 'Tento materiál sa nikde nepoužíva.'),
    ('database.detail.charactersAscension', 'Povýšenie postáv ({count})'),
    ('database.detail.charactersTalent', 'Talenty postáv ({count})'),
    ('database.detail.weaponsAscension', 'Povýšenie zbraní ({count})'),
    ('database.detail.weaponsRefinement', 'Rafinácia zbraní ({count})'),
    ('database.detail.birthday', 'Narodeniny'),
    ('database.detail.affiliations', 'Príslušnosť'),
    ('database.detail.roles', 'Role'),
    ('database.detail.talents', 'Talenty'),
    ('database.detail.constellations', 'Konštelácie'),
    ('database.detail.talentCost', 'Cena talentov')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;
