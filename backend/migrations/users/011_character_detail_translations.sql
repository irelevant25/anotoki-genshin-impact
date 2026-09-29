-----------------------------------------------------------
-- CHARACTER DETAIL TAB STRINGS
--
-- The character page grew tabs (ascensions, talents, constellations, build,
-- voice-overs) modelled on the old site, and the material page grew a
-- "show all" for the handful of materials that hundreds of things spend.
--
-- database.detail.story and .combat are reached through a key built at
-- runtime ('database.detail.' + type), so both must exist for either to work.
-----------------------------------------------------------

INSERT INTO translation_keys (name, description, site) VALUES
    ('database.detail.model', 'Character fact label - the body type, e.g. Medium Female', 'genshin_impact'),
    ('database.detail.released', 'Character and weapon fact label, followed by date and version', 'genshin_impact'),
    ('database.detail.titles', 'Character fact label', 'genshin_impact'),
    ('database.detail.specialDish', 'Character fact label', 'genshin_impact'),
    ('database.detail.voiceActors', 'Heading above the per-language actor list', 'genshin_impact'),
    ('database.detail.demoMusic', 'Heading above the character theme player', 'genshin_impact'),
    ('database.detail.build', 'Character page tab', 'genshin_impact'),
    ('database.detail.voiceOvers', 'Character page tab', 'genshin_impact'),
    ('database.detail.noBuild', 'Shown in the build tab, which has no data yet', 'genshin_impact'),
    ('database.detail.materials', 'Ascension and talent table column', 'genshin_impact'),
    ('database.detail.totalAscensionMaterials', 'Heading over the summed ascension cost', 'genshin_impact'),
    ('database.detail.totalTalentMaterials', 'Heading over the summed talent cost', 'genshin_impact'),
    ('database.detail.talentLevelUpMaterials', 'Heading over the talent cost table', 'genshin_impact'),
    ('database.detail.talentNote', 'Note under the talent cost table about the three talents', 'genshin_impact'),
    ('database.detail.language', 'Voice-over filter group label', 'genshin_impact'),
    ('database.detail.type', 'Voice-over filter group label', 'genshin_impact'),
    ('database.detail.story', 'Voice-over kind, also used as a badge', 'genshin_impact'),
    ('database.detail.combat', 'Voice-over kind, also used as a badge', 'genshin_impact'),
    ('database.detail.noVoiceLines', 'Shown when a character has no lines in this language and kind', 'genshin_impact'),
    ('database.detail.showAll', 'Button revealing the rest of a usage list - {count} is how many more', 'genshin_impact'),
    ('database.detail.showLess', 'Button collapsing a usage list back to the first twenty', 'genshin_impact')
ON CONFLICT (name) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'en', v.value FROM (VALUES
    ('database.detail.model', 'Model'),
    ('database.detail.released', 'Released'),
    ('database.detail.titles', 'Titles'),
    ('database.detail.specialDish', 'Special dish'),
    ('database.detail.voiceActors', 'Voice Actors'),
    ('database.detail.demoMusic', 'Demo Music'),
    ('database.detail.build', 'Build'),
    ('database.detail.voiceOvers', 'Voice overs'),
    ('database.detail.noBuild', 'No build yet'),
    ('database.detail.materials', 'Materials'),
    ('database.detail.totalAscensionMaterials', 'Total Ascension Materials'),
    ('database.detail.totalTalentMaterials', 'Total Talent Level-Up Materials'),
    ('database.detail.talentLevelUpMaterials', 'Talent Level-Up Materials'),
    ('database.detail.talentNote', 'Note: These materials are for leveling up one talent. For all three talents, multiply by 3.'),
    ('database.detail.language', 'Language'),
    ('database.detail.type', 'Type'),
    ('database.detail.story', 'Story'),
    ('database.detail.combat', 'Combat'),
    ('database.detail.noVoiceLines', 'No voice lines for this language and type.'),
    ('database.detail.showAll', 'Show all ({count} more)'),
    ('database.detail.showLess', 'Show less')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'sk', v.value FROM (VALUES
    ('database.detail.model', 'Model'),
    ('database.detail.released', 'Vydané'),
    ('database.detail.titles', 'Tituly'),
    ('database.detail.specialDish', 'Špeciálne jedlo'),
    ('database.detail.voiceActors', 'Dabing'),
    ('database.detail.demoMusic', 'Ukážka hudby'),
    ('database.detail.build', 'Build'),
    ('database.detail.voiceOvers', 'Hlasové nahrávky'),
    ('database.detail.noBuild', 'Zatiaľ žiadny build'),
    ('database.detail.materials', 'Materiály'),
    ('database.detail.totalAscensionMaterials', 'Celkové materiály na povýšenie'),
    ('database.detail.totalTalentMaterials', 'Celkové materiály na talenty'),
    ('database.detail.talentLevelUpMaterials', 'Materiály na zvýšenie talentov'),
    ('database.detail.talentNote', 'Poznámka: Tieto materiály sú na zvýšenie jedného talentu. Pre všetky tri vynásobte tromi.'),
    ('database.detail.language', 'Jazyk'),
    ('database.detail.type', 'Typ'),
    ('database.detail.story', 'Príbeh'),
    ('database.detail.combat', 'Boj'),
    ('database.detail.noVoiceLines', 'Pre tento jazyk a typ nie sú žiadne nahrávky.'),
    ('database.detail.showAll', 'Zobraziť všetko (ďalších {count})'),
    ('database.detail.showLess', 'Zobraziť menej')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;
