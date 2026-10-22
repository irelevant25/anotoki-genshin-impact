-----------------------------------------------------------
-- THE PROFILE'S NEW LOOK (2026-10-22)
--
-- The owner's choice among the mockups of 2026-10-22 ("D"): the Profile wears
-- the character pages' hero - the namecard of the character the player meets
-- most behind their name, their figures as the strip of facts - and splits
-- into four tabs: Overview, Quizzes (each quiz by difficulty, and who the
-- player does best and worst against in it), Characters (everyone met, as the
-- database list's tiles, filtered, sorted, two dozen at a time) and History.
-- Before the first played question it offers the six quizzes. These are the
-- words the new page says that the database had none for, in users/051's
-- shape: a key is its name and its description (the code's, never edited in
-- the admin panel; its placeholders named), each language's string is
-- inserted only where it has none (ON CONFLICT DO NOTHING), informal Slovak
-- ("ty"). A counted sentence is three keys under one prefix - `one`, `few`,
-- `other` (users/062; frontend/src/app/shared/dynamic-keys.ts declares the
-- prefixes). The table of characters and the sentence over the activity grid
-- are gone, and their words with them (the DELETE at the end).
-----------------------------------------------------------

INSERT INTO translation_keys (name, description) VALUES
    ('profile.tabs.overview', 'The Profile''s first tab: the three highlights, each quiz and each difficulty as a meter, the year''s activity. No placeholders.'),
    ('profile.tabs.quizzes', 'The Profile''s second tab: each quiz by difficulty, and who the player does best and worst against in it. No placeholders.'),
    ('profile.tabs.characters', 'The Profile''s third tab: everyone who has come up in the player''s questions, as tiles. No placeholders.'),
    ('profile.tabs.history', 'The Profile''s fourth tab: the year''s activity and the last twenty questions. No placeholders.'),
    ('profile.overview.wonHint', 'After the win rate in the Profile''s hero, and on a character''s tile: how many questions were won. {count} is the number, written the reader''s way.'),
    ('profile.overview.longestHint', 'After the day streak in the Profile''s hero: the longest unbroken run of days ever. {count} is the number of days.'),
    ('profile.characters.lead', 'Under the Overview''s Characters heading: what its three cards are, and where the whole list is. No placeholders.'),
    ('profile.quizzes.lead', 'Under the Quizzes tab''s heading: what each quiz''s card shows. No placeholders.'),
    ('profile.characters.listLead', 'Under the Characters tab''s heading: who the tiles are. No placeholders.'),
    ('profile.quizzes.notPlayed', 'On a quiz''s card, for a quiz the player has never played. No placeholders.'),
    ('profile.quizzes.play', 'The button under that, and on the empty profile''s quiz cards: into the quiz. No placeholders.'),
    ('profile.quizzes.playedCount', 'How many questions were played - a quiz''s, a difficulty''s, a character''s. {count} is the number.'),
    ('profile.quizzes.tries', 'How many tries a question took on average - a quiz''s, a character''s. {tries} is the number with one decimal, written the reader''s way.'),
    ('profile.characters.sort', 'Label above the Characters tab''s order control, and the control''s name. No placeholders.'),
    ('profile.sort.played', 'An order of the Characters tab: the characters met most often first. No placeholders.'),
    ('profile.sort.best', 'An order of the Characters tab: the highest win rate first, the characters met fewer than three times after the rest. No placeholders.'),
    ('profile.sort.toughest', 'An order of the Characters tab: the lowest win rate first, by the same rule. No placeholders.'),
    ('profile.sort.name', 'An order of the Characters tab: alphabetical. No placeholders.'),
    ('profile.characters.search', 'The Characters tab''s search box: its name and its placeholder. No placeholders.'),
    ('profile.characters.count.one', 'How many characters the Characters tab''s filters left, {n} being 1. The `one` form of a counted sentence (users/062).'),
    ('profile.characters.count.few', 'How many characters, {n} of them, the `few` form - 2 to 4 in Slovak; English never asks for it.'),
    ('profile.characters.count.other', 'How many characters, {n} of them, the `other` form - 5 and more in Slovak, 2 and more in English.'),
    ('profile.characters.showMore', 'The button under the Characters tab''s tiles, which draws the next ones: {count} is how many it will add, {left} how many are not drawn yet.'),
    ('profile.characters.none', 'Under the Characters tab''s filters when no character matches them. No placeholders.'),
    ('profile.history.today', 'The heading of today''s results on the History tab. No placeholders.'),
    ('profile.history.yesterday', 'The heading of yesterday''s results on the History tab. No placeholders.'),
    ('profile.activity.days', 'Under the first figure over the activity grid: days with at least one finished question in the last year. No placeholders.'),
    ('profile.activity.longest', 'Under the second figure over the activity grid: the longest unbroken run of days, in days. No placeholders.'),
    ('profile.empty.start', 'Heading of the empty profile''s card of the six quizzes - the way in, before anything was played. No placeholders.'),
    ('profile.empty.startLead', 'Under that heading. No placeholders.'),
    ('profile.empty.preview', 'Heading of the empty profile''s card of the figures that will fill, each shown as a dash. No placeholders.'),
    ('profile.empty.previewLead', 'Under that heading: what the profile will show. No placeholders.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'en', v.value FROM (VALUES
    ('profile.tabs.overview', 'Overview'),
    ('profile.tabs.quizzes', 'Quizzes'),
    ('profile.tabs.characters', 'Characters'),
    ('profile.tabs.history', 'History'),
    ('profile.overview.wonHint', '{count} won'),
    ('profile.overview.longestHint', 'longest {count}'),
    ('profile.characters.lead', 'The character you meet most, the one you do best against and the one you do worst against — everyone else is under the Characters tab.'),
    ('profile.quizzes.lead', 'Each quiz by difficulty, and who you do best and worst against in it.'),
    ('profile.characters.listLead', 'Everyone who has come up in your questions.'),
    ('profile.quizzes.notPlayed', 'Not played yet'),
    ('profile.quizzes.play', 'Play'),
    ('profile.quizzes.playedCount', '{count} played'),
    ('profile.quizzes.tries', '{tries} tries a question'),
    ('profile.characters.sort', 'Sort'),
    ('profile.sort.played', 'Most played'),
    ('profile.sort.best', 'Best'),
    ('profile.sort.toughest', 'Toughest'),
    ('profile.sort.name', 'A–Z'),
    ('profile.characters.search', 'Search characters'),
    ('profile.characters.count.one', '{n} character'),
    ('profile.characters.count.few', '{n} characters'),
    ('profile.characters.count.other', '{n} characters'),
    ('profile.characters.showMore', 'Show {count} more ({left} left)'),
    ('profile.characters.none', 'No character matches.'),
    ('profile.history.today', 'Today'),
    ('profile.history.yesterday', 'Yesterday'),
    ('profile.activity.days', 'days played this year'),
    ('profile.activity.longest', 'longest run, days'),
    ('profile.empty.start', 'Start with a quiz'),
    ('profile.empty.startLead', 'Six ways to be asked about the characters — every finished question counts here.'),
    ('profile.empty.preview', 'What will appear here'),
    ('profile.empty.previewLead', 'Your figures, each quiz and difficulty, the days you played, and every character you have met.')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'sk', v.value FROM (VALUES
    ('profile.tabs.overview', 'Prehľad'),
    ('profile.tabs.quizzes', 'Kvízy'),
    ('profile.tabs.characters', 'Postavy'),
    ('profile.tabs.history', 'História'),
    ('profile.overview.wonHint', 'výhier: {count}'),
    ('profile.overview.longestHint', 'najdlhšia séria {count}'),
    ('profile.characters.lead', 'Postava, ktorú stretávaš najčastejšie, tá, proti ktorej ti ide najlepšie, a tá, proti ktorej najhoršie — všetky ostatné nájdeš v záložke Postavy.'),
    ('profile.quizzes.lead', 'Každý kvíz podľa obtiažnosti a to, proti komu ti v ňom ide najlepšie a najhoršie.'),
    ('profile.characters.listLead', 'Všetci, ktorí sa objavili v tvojich otázkach.'),
    ('profile.quizzes.notPlayed', 'Zatiaľ nehrané'),
    ('profile.quizzes.play', 'Hrať'),
    ('profile.quizzes.playedCount', 'odohraných: {count}'),
    ('profile.quizzes.tries', 'pokusov na otázku: {tries}'),
    ('profile.characters.sort', 'Zoradiť'),
    ('profile.sort.played', 'Najčastejšie'),
    ('profile.sort.best', 'Najlepšie'),
    ('profile.sort.toughest', 'Najťažšie'),
    ('profile.sort.name', 'A–Z'),
    ('profile.characters.search', 'Hľadať postavu'),
    ('profile.characters.count.one', '{n} postava'),
    ('profile.characters.count.few', '{n} postavy'),
    ('profile.characters.count.other', '{n} postáv'),
    ('profile.characters.showMore', 'Zobraziť ďalších {count} (zostáva {left})'),
    ('profile.characters.none', 'Žiadna postava nezodpovedá filtru.'),
    ('profile.history.today', 'Dnes'),
    ('profile.history.yesterday', 'Včera'),
    ('profile.activity.days', 'odohraných dní za rok'),
    ('profile.activity.longest', 'najdlhšia séria, dní'),
    ('profile.empty.start', 'Začni kvízom'),
    ('profile.empty.startLead', 'Šesť spôsobov, ako sa ťa opýtať na postavy — každá dohraná otázka sa tu počíta.'),
    ('profile.empty.preview', 'Čo sa tu objaví'),
    ('profile.empty.previewLead', 'Tvoje čísla, každý kvíz a obtiažnosť, dni, keď si hral, a každá postava, ktorú si stretol.')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

-- The table of characters, the sentence over the activity grid and the empty
-- page's link are gone from the page: their words go too (users/062's rule -
-- a word nobody says any more goes, its strings with it, ON DELETE CASCADE).
DELETE FROM translation_keys WHERE name IN (
    'profile.characters.column.character',
    'profile.characters.column.played',
    'profile.characters.column.won',
    'profile.characters.column.lost',
    'profile.characters.column.winRate',
    'profile.characters.column.attempts',
    'profile.activity.summary',
    'profile.empty.action'
);

-- Every key above exists with both languages' strings, whichever of them this
-- file inserted: a key that was there already with one language missing would
-- otherwise go unnoticed until a page showed its name.
DO $$
DECLARE
    missing TEXT;
BEGIN
    SELECT string_agg(k.name, ', ' ORDER BY k.name) INTO missing
      FROM (VALUES
          ('profile.tabs.overview'),
          ('profile.tabs.quizzes'),
          ('profile.tabs.characters'),
          ('profile.tabs.history'),
          ('profile.overview.wonHint'),
          ('profile.overview.longestHint'),
          ('profile.characters.lead'),
          ('profile.quizzes.lead'),
          ('profile.characters.listLead'),
          ('profile.quizzes.notPlayed'),
          ('profile.quizzes.play'),
          ('profile.quizzes.playedCount'),
          ('profile.quizzes.tries'),
          ('profile.characters.sort'),
          ('profile.sort.played'),
          ('profile.sort.best'),
          ('profile.sort.toughest'),
          ('profile.sort.name'),
          ('profile.characters.search'),
          ('profile.characters.count.one'),
          ('profile.characters.count.few'),
          ('profile.characters.count.other'),
          ('profile.characters.showMore'),
          ('profile.characters.none'),
          ('profile.history.today'),
          ('profile.history.yesterday'),
          ('profile.activity.days'),
          ('profile.activity.longest'),
          ('profile.empty.start'),
          ('profile.empty.startLead'),
          ('profile.empty.preview'),
          ('profile.empty.previewLead')
      ) AS k(name)
     WHERE NOT EXISTS (SELECT 1 FROM translation_keys tk WHERE tk.name = k.name)
        OR NOT EXISTS (SELECT 1 FROM translations t WHERE t.key_name = k.name AND t.language_code = 'en')
        OR NOT EXISTS (SELECT 1 FROM translations t WHERE t.key_name = k.name AND t.language_code = 'sk');
    IF missing IS NOT NULL THEN
        RAISE EXCEPTION 'keys without an English and a Slovak string: %', missing;
    END IF;
END $$;
