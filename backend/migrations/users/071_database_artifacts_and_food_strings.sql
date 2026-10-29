-----------------------------------------------------------
-- THE ARTIFACTS AND FOOD DATABASES (2026-10-29)
--
-- The owner's request of 2026-10-29: the public Database gets two more parts,
-- Artifacts and Food, each a list and a page of its own for every row, built
-- as the Weapons and Materials pages are (the lists' system "E" and the
-- pages' "Showcase" of 2026-10-21, whose words users/062 and users/063
-- brought). The content was here all along - the admin panel edits both, the
-- dish quiz reads the foods -, and these are the words its pages say that the
-- database had none for: the Database page's two cards, the lists' counted
-- totals, the artifacts list's two filters of its own (a set's highest
-- quality, an effect it is tagged with), and the two pages' cards. users/051's
-- shape: a key is its name and its description (the code's, never edited in
-- the admin panel; its placeholders named), each language's string is
-- inserted only where it has none (ON CONFLICT DO NOTHING), informal Slovak
-- ("ty").
--
-- A counted sentence is three keys under one prefix - `one`, `few`, `other`,
-- the names Intl.PluralRules gives them - and the page picks one by the
-- reader's language (users/062; frontend/src/app/shared/dynamic-keys.ts
-- declares the prefixes). English never asks for `few`; it holds the same
-- words as `other`.
-----------------------------------------------------------

INSERT INTO translation_keys (name, description) VALUES
    ('database.artifacts.title', 'The Database page''s card for the artifact sets, and the heading of their list. No placeholders.'),
    ('database.artifacts.info', 'The line under the Artifacts card on the Database page. No placeholders.'),
    ('database.artifacts.count.one', 'How many artifact sets: the artifacts list''s total and each section''s count, {n} being 1. The `one` form of a counted sentence (users/062).'),
    ('database.artifacts.count.few', 'How many artifact sets, {n} of them, the `few` form - 2 to 4 in Slovak; English never asks for it.'),
    ('database.artifacts.count.other', 'How many artifact sets, {n} of them, the `other` form - 5 and more in Slovak, 2 and more in English.'),
    ('database.foods.title', 'The Database page''s card for the food - the dishes, the potions and the essential oils -, and the heading of its list. No placeholders.'),
    ('database.foods.info', 'The line under the Food card on the Database page. No placeholders.'),
    ('database.foods.count.one', 'How many foods: the food list''s total and each section''s count, {n} being 1. The `one` form of a counted sentence (users/062).'),
    ('database.foods.count.few', 'How many foods, {n} of them, the `few` form - 2 to 4 in Slovak; English never asks for it.'),
    ('database.foods.count.other', 'How many foods, {n} of them, the `other` form - 5 and more in Slovak, 2 and more in English.'),
    ('database.filters.maxRarity', 'Label above the artifacts list''s main track: the highest quality a set drops in (5★, 4★...), each set counted under its highest alone. No placeholders.'),
    ('database.filters.effect', 'Label above the artifacts list''s select of the effects a set is tagged with (CRIT Rate, Healing Bonus...). No placeholders.'),
    ('database.filters.anyEffect', 'The empty choice of the artifacts list''s effect select: no effect chosen, every set. No placeholders.'),
    ('database.detail.setBonuses', 'An artifact set''s page: the heading of the card of what wearing its pieces together gives. No placeholders.'),
    ('database.detail.twoPiece', 'In an artifact set''s Set bonuses card, the label above what two of its pieces worn together give. No placeholders.'),
    ('database.detail.fourPiece', 'In an artifact set''s Set bonuses card, the label above what four of its pieces worn together give. No placeholders.'),
    ('database.detail.pieces', 'An artifact set''s page: the heading of the card of its pieces (its flower, plume, sands, goblet and circlet), and in the strip under its name the label of how many it has. No placeholders.'),
    ('database.detail.qualities', 'A food''s page: the heading of the card of the dish in each quality cooking it can turn out - suspicious, normal, delicious -, each with its picture, its effect and its description. No placeholders.'),
    ('database.detail.quality.suspicious', 'In a food''s Quality card, a quality''s name: the worst a dish can turn out. No placeholders.'),
    ('database.detail.quality.normal', 'In a food''s Quality card, a quality''s name: the dish as it usually turns out. No placeholders.'),
    ('database.detail.quality.delicious', 'In a food''s Quality card, a quality''s name: the best a dish can turn out. No placeholders.'),
    ('database.detail.recipe', 'A food''s page: the heading of the card of the materials its recipe takes, each with how many. No placeholders.'),
    ('database.detail.proficiency', 'A food''s page, in the strip under its name: the label of its proficiency - how many times it is cooked by hand before it can be cooked automatically. No placeholders.'),
    ('database.detail.baseDish', 'A food''s page: in its Special dish card, the label above the dish a special dish is made in place of; for another variant (a festival''s), the heading of the card of that dish. No placeholders.'),
    ('database.detail.character', 'A food''s page: in its Special dish card, the label above the character whose special dish it is. No placeholders.'),
    ('database.detail.variants', 'A food''s page: the heading of the card of the dishes made from it - characters'' special dishes, a festival''s variants -, each with the character whose it is. No placeholders.'),
    ('database.detail.events', 'A food''s page: the heading of the card of the game''s events it came with. No placeholders.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'en', v.value FROM (VALUES
    ('database.artifacts.title', 'Artifacts'),
    ('database.artifacts.info', 'Browse through the artifact sets in the game and learn more about them.'),
    ('database.artifacts.count.one', '{n} artifact set'),
    ('database.artifacts.count.few', '{n} artifact sets'),
    ('database.artifacts.count.other', '{n} artifact sets'),
    ('database.foods.title', 'Food'),
    ('database.foods.info', 'Browse through the food in the game and learn more about it.'),
    ('database.foods.count.one', '{n} food'),
    ('database.foods.count.few', '{n} foods'),
    ('database.foods.count.other', '{n} foods'),
    ('database.filters.maxRarity', 'Highest rarity'),
    ('database.filters.effect', 'Effect'),
    ('database.filters.anyEffect', 'Any effect'),
    ('database.detail.setBonuses', 'Set bonuses'),
    ('database.detail.twoPiece', '2-piece bonus'),
    ('database.detail.fourPiece', '4-piece bonus'),
    ('database.detail.pieces', 'Pieces'),
    ('database.detail.qualities', 'Quality'),
    ('database.detail.quality.suspicious', 'Suspicious'),
    ('database.detail.quality.normal', 'Normal'),
    ('database.detail.quality.delicious', 'Delicious'),
    ('database.detail.recipe', 'Recipe'),
    ('database.detail.proficiency', 'Proficiency'),
    ('database.detail.baseDish', 'Base dish'),
    ('database.detail.character', 'Character'),
    ('database.detail.variants', 'Variants'),
    ('database.detail.events', 'Events')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'sk', v.value FROM (VALUES
    ('database.artifacts.title', 'Artefakty'),
    ('database.artifacts.info', 'Prezri si sety artefaktov v hre a dozvieš sa o nich viac.'),
    ('database.artifacts.count.one', '{n} set artefaktov'),
    ('database.artifacts.count.few', '{n} sety artefaktov'),
    ('database.artifacts.count.other', '{n} setov artefaktov'),
    ('database.foods.title', 'Jedlá'),
    ('database.foods.info', 'Prezri si jedlá v hre a dozvieš sa o nich viac.'),
    ('database.foods.count.one', '{n} jedlo'),
    ('database.foods.count.few', '{n} jedlá'),
    ('database.foods.count.other', '{n} jedál'),
    ('database.filters.maxRarity', 'Najvyššia vzácnosť'),
    ('database.filters.effect', 'Efekt'),
    ('database.filters.anyEffect', 'Ľubovoľný efekt'),
    ('database.detail.setBonuses', 'Bonusy setu'),
    ('database.detail.twoPiece', 'Bonus za 2 kusy'),
    ('database.detail.fourPiece', 'Bonus za 4 kusy'),
    ('database.detail.pieces', 'Kusy'),
    ('database.detail.qualities', 'Kvalita'),
    ('database.detail.quality.suspicious', 'Podozrivé'),
    ('database.detail.quality.normal', 'Normálne'),
    ('database.detail.quality.delicious', 'Lahodné'),
    ('database.detail.recipe', 'Recept'),
    ('database.detail.proficiency', 'Zručnosť'),
    ('database.detail.baseDish', 'Základné jedlo'),
    ('database.detail.character', 'Postava'),
    ('database.detail.variants', 'Varianty'),
    ('database.detail.events', 'Udalosti')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

-----------------------------------------------------------
-- THEIR PAGES IN PAGE ACCESS
--
-- Every public page has its row in the library's anotoki_page_access, so an
-- administrator can switch it in Site settings: the four new ones anybody's,
-- as the other database pages are, after the weapons' (56, 57). /profile,
-- which stood at 60 after them, moves to 70 to make room - only where it
-- still stands there, so a place an administrator gave it stays; its time
-- and writer are left as they were, the move being nobody's change.
-----------------------------------------------------------

UPDATE anotoki_page_access SET sort_order = 70 WHERE path = '/profile' AND sort_order = 60;

INSERT INTO anotoki_page_access (path, visibility, blocked, api_paths, sort_order)
SELECT v.path, 'PUBLIC', FALSE, '{}'::TEXT[], v.sort_order
  FROM (VALUES
      ('/database/artifacts', 58),
      ('/database/artifacts/:id', 59),
      ('/database/foods', 60),
      ('/database/foods/:id', 61)
  ) AS v(path, sort_order)
 WHERE NOT EXISTS (SELECT 1 FROM anotoki_page_access p WHERE p.path = v.path);

-- Every key above exists with both languages' strings, and each page with its
-- row - whichever of them this file wrote: a key there already with one
-- language missing, or a page never written, would otherwise go unnoticed
-- until a page showed a key's name or an administrator looked for the switch.
-- And /profile shares its place with no new page.
DO $$
DECLARE
    missing TEXT;
BEGIN
    SELECT string_agg(k.name, ', ' ORDER BY k.name) INTO missing
      FROM (VALUES
          ('database.artifacts.title'),
          ('database.artifacts.info'),
          ('database.artifacts.count.one'),
          ('database.artifacts.count.few'),
          ('database.artifacts.count.other'),
          ('database.foods.title'),
          ('database.foods.info'),
          ('database.foods.count.one'),
          ('database.foods.count.few'),
          ('database.foods.count.other'),
          ('database.filters.maxRarity'),
          ('database.filters.effect'),
          ('database.filters.anyEffect'),
          ('database.detail.setBonuses'),
          ('database.detail.twoPiece'),
          ('database.detail.fourPiece'),
          ('database.detail.pieces'),
          ('database.detail.qualities'),
          ('database.detail.quality.suspicious'),
          ('database.detail.quality.normal'),
          ('database.detail.quality.delicious'),
          ('database.detail.recipe'),
          ('database.detail.proficiency'),
          ('database.detail.baseDish'),
          ('database.detail.character'),
          ('database.detail.variants'),
          ('database.detail.events')
      ) AS k(name)
     WHERE NOT EXISTS (SELECT 1 FROM translation_keys tk WHERE tk.name = k.name)
        OR NOT EXISTS (SELECT 1 FROM translations t WHERE t.key_name = k.name AND t.language_code = 'en')
        OR NOT EXISTS (SELECT 1 FROM translations t WHERE t.key_name = k.name AND t.language_code = 'sk');
    IF missing IS NOT NULL THEN
        RAISE EXCEPTION 'users/071: keys without an English and a Slovak string: %', missing;
    END IF;

    SELECT string_agg(p.path, ', ' ORDER BY p.path) INTO missing
      FROM (VALUES ('/database/artifacts'), ('/database/artifacts/:id'), ('/database/foods'), ('/database/foods/:id')) AS p(path)
     WHERE NOT EXISTS (SELECT 1 FROM anotoki_page_access a WHERE a.path = p.path);
    IF missing IS NOT NULL THEN
        RAISE EXCEPTION 'users/071: pages without a Page access row: %', missing;
    END IF;

    IF EXISTS (SELECT 1 FROM anotoki_page_access WHERE path = '/profile' AND sort_order = 60) THEN
        RAISE EXCEPTION 'users/071: /profile still stands at 60, the place /database/foods takes';
    END IF;
END $$;
