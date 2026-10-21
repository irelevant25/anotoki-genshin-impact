-----------------------------------------------------------
-- THE DATABASE PAGES' NEW LOOK (2026-10-21)
--
-- The owner's choice among the mockups of 2026-10-21: the character, weapon
-- and material pages open with a hero - the namecard's picture or the
-- rarity's colour behind the name, the art beside it, a strip of facts under
-- it - and keep their sections in cards; the banners are grouped by version
-- and phase, each phase saying its dates and its state once instead of every
-- banner repeating them. These are the words those pages say that the
-- database had none for. users/051's shape: a key is its name and its
-- description (the code's, never edited in the admin panel; its placeholders
-- named), each language's string is inserted only where it has none (ON
-- CONFLICT DO NOTHING), informal Slovak ("ty").
--
-- Slovak counts three ways (1 deň, 2-4 dni, 5 dní) and this site's key scan
-- has no plural forms of its own, so a counted sentence is three keys under
-- one prefix - `one`, `few`, `other`, the names Intl.PluralRules gives them -
-- and the page picks one by the reader's language
-- (frontend/src/app/shared/dynamic-keys.ts declares the prefixes). English
-- never asks for `few`; it holds the same words as `other`.
-----------------------------------------------------------

INSERT INTO translation_keys (name, description) VALUES
    ('database.detail.about', 'Heading of the card under a character''s hero holding the facts the strip of tiles does not: titles, affiliations, model, constellation, arkhe, special dish. No placeholders.'),
    ('database.detail.voiceAndMusic', 'Heading of the character page''s card with the voice actors and the demo track. No placeholders.'),
    ('database.detail.constellation', 'Fact label on the character page: the name of the character''s constellation (characters.constellation_name). No placeholders.'),
    ('database.detail.arkhe', 'Fact label on the character page: a Fontaine character''s arkhe, Pneuma or Ousia (characters.arkhe). No placeholders.'),
    ('database.detail.baseAtk', 'Tile label in the weapon page''s hero: the weapon''s base ATK, read from its first ascension row (level 1). No placeholders.'),
    ('database.detail.atLevel', 'Quiet note after a weapon''s base stat in the hero: at which level it holds. {level} is the level number.'),
    ('database.detail.obtained', 'Tile label in the weapon page''s hero: how the weapon is obtained, the first line of its how_to_obtain. No placeholders.'),
    ('database.detail.refinement', 'Label of the weapon page''s refinement chooser, the segmented control with the levels 1 to 5 whose text shows under it. No placeholders.'),
    ('database.detail.showMore', 'Button under a talent''s or a constellation''s description where it is clamped to a few lines; pressed, the whole text shows and the button reads showLess. No placeholders.'),
    ('database.detail.untickHint', 'Quiet hint in the header of the ascension and talent cost cards: unticking a row leaves it out of the totals under the table. No placeholders.'),
    ('database.banners.version', 'Heading of a version''s group on the Banners page. {version} is the version as the pages write it ("7.1", "6.2 (Luna III)").'),
    ('database.banners.phase', 'Label of a phase inside a version''s group on the Banners page: the banners that ran together. {n} is its number within the version, first phase first.'),
    ('database.banners.to', 'The small word between a phase''s first and last day on the Banners page ("23 Sep 2026 to 13 Oct 2026"). No placeholders.'),
    ('database.banners.noEnd', 'In place of a phase''s last day on the Banners page when its banners have none (banners.duration_to null). No placeholders.'),
    ('database.banners.kind.character', 'Badge on a banner card: a banner that features characters. Inferred - the banner table keeps no kind - from what the banner features. No placeholders.'),
    ('database.banners.kind.weapon', 'Badge on a banner card: a banner that features weapons (the kind is inferred from what it features). No placeholders.'),
    ('database.banners.state.ended', 'A phase''s state badge on the Banners page: its last day is past. No placeholders.'),
    ('database.banners.state.running', 'A phase''s state badge on the Banners page: it has begun and has no last day. No placeholders.'),
    ('database.banners.state.endsToday', 'A phase''s state badge on the Banners page: its last day is today. No placeholders.'),
    ('database.banners.state.endsIn.one', 'A phase''s state badge on the Banners page: it ends in one day. {days} is 1. The `one` form of a counted sentence (users/062).'),
    ('database.banners.state.endsIn.few', 'A phase''s state badge on the Banners page: it ends in {days} days, the `few` form - 2 to 4 in Slovak; English never asks for it.'),
    ('database.banners.state.endsIn.other', 'A phase''s state badge on the Banners page: it ends in {days} days, the `other` form - 5 and more in Slovak, 2 and more in English.'),
    ('database.banners.state.startsIn.one', 'A phase''s state badge on the Banners page: it starts in one day. {days} is 1. The `one` form of a counted sentence (users/062).'),
    ('database.banners.state.startsIn.few', 'A phase''s state badge on the Banners page: it starts in {days} days, the `few` form - 2 to 4 in Slovak; English never asks for it.'),
    ('database.banners.state.startsIn.other', 'A phase''s state badge on the Banners page: it starts in {days} days, the `other` form - 5 and more in Slovak, 2 and more in English.'),
    ('database.banners.count.one', 'Beside a version''s heading on the Banners page: how many banners it holds, {n} being 1. The `one` form of a counted sentence (users/062).'),
    ('database.banners.count.few', 'Beside a version''s heading on the Banners page: how many banners it holds, {n} of them, the `few` form - 2 to 4 in Slovak; English never asks for it.'),
    ('database.banners.count.other', 'Beside a version''s heading on the Banners page: how many banners it holds, {n} of them, the `other` form - 5 and more in Slovak, 2 and more in English.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'en', v.value FROM (VALUES
    ('database.detail.about', 'About'),
    ('database.detail.voiceAndMusic', 'Voice & music'),
    ('database.detail.constellation', 'Constellation'),
    ('database.detail.arkhe', 'Arkhe'),
    ('database.detail.baseAtk', 'Base ATK'),
    ('database.detail.atLevel', 'at level {level}'),
    ('database.detail.obtained', 'Obtained'),
    ('database.detail.refinement', 'Refinement'),
    ('database.detail.showMore', 'Show more'),
    ('database.detail.untickHint', 'Untick a row to leave it out of the totals'),
    ('database.banners.version', 'Version {version}'),
    ('database.banners.phase', 'Phase {n}'),
    ('database.banners.to', 'to'),
    ('database.banners.noEnd', 'open-ended'),
    ('database.banners.kind.character', 'Character Event Wish'),
    ('database.banners.kind.weapon', 'Weapon Event Wish'),
    ('database.banners.state.ended', 'Ended'),
    ('database.banners.state.running', 'Running'),
    ('database.banners.state.endsToday', 'Ends today'),
    ('database.banners.state.endsIn.one', 'Ends tomorrow'),
    ('database.banners.state.endsIn.few', 'Ends in {days} days'),
    ('database.banners.state.endsIn.other', 'Ends in {days} days'),
    ('database.banners.state.startsIn.one', 'Starts tomorrow'),
    ('database.banners.state.startsIn.few', 'Starts in {days} days'),
    ('database.banners.state.startsIn.other', 'Starts in {days} days'),
    ('database.banners.count.one', '{n} banner'),
    ('database.banners.count.few', '{n} banners'),
    ('database.banners.count.other', '{n} banners')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'sk', v.value FROM (VALUES
    ('database.detail.about', 'Podrobnosti'),
    ('database.detail.voiceAndMusic', 'Hlas a hudba'),
    ('database.detail.constellation', 'Konštelácia'),
    ('database.detail.arkhe', 'Arkhe'),
    ('database.detail.baseAtk', 'Základný ATK'),
    ('database.detail.atLevel', 'na úrovni {level}'),
    ('database.detail.obtained', 'Získanie'),
    ('database.detail.refinement', 'Zdokonalenie'),
    ('database.detail.showMore', 'Zobraziť viac'),
    ('database.detail.untickHint', 'Odškrtni riadok, aby sa nerátal do súčtu'),
    ('database.banners.version', 'Verzia {version}'),
    ('database.banners.phase', 'Fáza {n}'),
    ('database.banners.to', 'do'),
    ('database.banners.noEnd', 'bez konca'),
    ('database.banners.kind.character', 'Wish na postavu'),
    ('database.banners.kind.weapon', 'Wish na zbraň'),
    ('database.banners.state.ended', 'Skončil'),
    ('database.banners.state.running', 'Prebieha'),
    ('database.banners.state.endsToday', 'Končí dnes'),
    ('database.banners.state.endsIn.one', 'Končí zajtra'),
    ('database.banners.state.endsIn.few', 'Končí o {days} dni'),
    ('database.banners.state.endsIn.other', 'Končí o {days} dní'),
    ('database.banners.state.startsIn.one', 'Začína zajtra'),
    ('database.banners.state.startsIn.few', 'Začína o {days} dni'),
    ('database.banners.state.startsIn.other', 'Začína o {days} dní'),
    ('database.banners.count.one', '{n} banner'),
    ('database.banners.count.few', '{n} bannery'),
    ('database.banners.count.other', '{n} bannerov')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

-----------------------------------------------------------
-- WORDS THE NEW PAGES NO LONGER SAY
--
-- The voice actors and the demo track share one card now (voiceAndMusic),
-- and a weapon's release date is a tile of its hero (released, the version
-- beside it), so these three labels have no place left. Their strings go
-- with the keys.
-----------------------------------------------------------

DELETE FROM translation_keys WHERE name IN (
    'database.detail.voiceActors',
    'database.detail.demoMusic',
    'database.detail.releaseDate'
);

-----------------------------------------------------------
-- PROVE IT
--
-- Every key reads in both languages.
-----------------------------------------------------------

DO $$
DECLARE
    missing TEXT;
BEGIN
    SELECT string_agg(k.name, ', ' ORDER BY k.name) INTO missing
      FROM (VALUES
          ('database.detail.about'),
          ('database.detail.voiceAndMusic'),
          ('database.detail.constellation'),
          ('database.detail.arkhe'),
          ('database.detail.baseAtk'),
          ('database.detail.atLevel'),
          ('database.detail.obtained'),
          ('database.detail.refinement'),
          ('database.detail.showMore'),
          ('database.detail.untickHint'),
          ('database.banners.version'),
          ('database.banners.phase'),
          ('database.banners.to'),
          ('database.banners.noEnd'),
          ('database.banners.kind.character'),
          ('database.banners.kind.weapon'),
          ('database.banners.state.ended'),
          ('database.banners.state.running'),
          ('database.banners.state.endsToday'),
          ('database.banners.state.endsIn.one'),
          ('database.banners.state.endsIn.few'),
          ('database.banners.state.endsIn.other'),
          ('database.banners.state.startsIn.one'),
          ('database.banners.state.startsIn.few'),
          ('database.banners.state.startsIn.other'),
          ('database.banners.count.one'),
          ('database.banners.count.few'),
          ('database.banners.count.other')
      ) AS k(name)
     WHERE NOT EXISTS (SELECT 1 FROM translation_keys tk WHERE tk.name = k.name)
        OR NOT EXISTS (SELECT 1 FROM translations t WHERE t.key_name = k.name AND t.language_code = 'en')
        OR NOT EXISTS (SELECT 1 FROM translations t WHERE t.key_name = k.name AND t.language_code = 'sk');
    IF missing IS NOT NULL THEN
        RAISE EXCEPTION 'keys without an English and a Slovak string: %', missing;
    END IF;
END $$;
