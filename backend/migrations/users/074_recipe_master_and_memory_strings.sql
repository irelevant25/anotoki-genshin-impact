-----------------------------------------------------------
-- RECIPE MASTER AND MEMORY: THEIR WORDS, GUIDES AND PAGES (2026-10-29)
--
-- The owner's games of 2026-10-29, on the Games page beside the Tournament
-- and Minesweeper - and, like them, keeping nothing:
--
--   Recipe Master  ten dishes; for each, its ingredients picked out from
--                  among three wrong ones, every pick marked at once and for
--                  good; a dish worth 3 points, less 2 a wrong pick (3, 1,
--                  -1, -3), and at the end a table of every dish, every
--                  option and the score out of 30
--   Memory         pexeso: every card shown for a moment, then turned over;
--   (Pexeso)       a group is a character and the cards of what it is - on
--                  Easy 16 cards in pairs (one kind, element, weapon type or
--                  region, drawn for the game), on Medium 36 in threes (two
--                  kinds), on Hard 36 in fours (all three); any card that
--                  fits counts
--
-- These are what their pages say, the guides behind their question marks
-- (guide_contents, as users/072 made Splash's and Constellation's), and a
-- Page access row for each page (users/066's), so that an administrator can
-- switch them in Site settings. The Games page's own guide named the two
-- games there were; it names the four, where its sentence is still users/028's
-- word for word - a rewording made since stays.
--
-- users/051's shape: a key is its name and its description (the code's; its
-- placeholders named), each language's string is inserted only where it has
-- none, informal Slovak ("ty"); a guide or a page row only where there is
-- none. A counted sentence is three keys under one prefix - `one`, `few`,
-- `other` (users/062; frontend/src/app/shared/dynamic-keys.ts declares the
-- prefixes, and the levels', hints' and kinds' too).
-----------------------------------------------------------

INSERT INTO translation_keys (name, description) VALUES
    ('game.recipes.title', 'Game name: Recipe Master, the game of what goes into a dish. No placeholders.'),
    ('game.recipes.info', 'Game card description. No placeholders.'),
    ('game.recipes.progress', 'Recipe Master''s status: which dish of the game this is. {n} the dish, {total} how many a game asks.'),
    ('game.recipes.score', 'Recipe Master''s status: the score so far. {points} signed, as +7 or −2.'),
    ('game.recipes.prompt', 'Recipe Master: the question under the dish''s name. No placeholders.'),
    ('game.recipes.found', 'Recipe Master: how many of the dish''s ingredients are picked. {found} the picked ones, {total} how many it has.'),
    ('game.recipes.right', 'Recipe Master: an option picked and in the recipe - a screen reader''s word beside its tick, and the table''s legend. No placeholders.'),
    ('game.recipes.wrong', 'Recipe Master: an option picked and not in the recipe - a screen reader''s word beside its cross, and the table''s legend. No placeholders.'),
    ('game.recipes.wrongLeft', 'Recipe Master''s table: a wrong option nobody picked - a screen reader''s word, and the legend. No placeholders.'),
    ('game.recipes.points.one', 'What a dish scored, once it is over: {n} signed (+1, −1). The `one` form of a counted sentence (users/062).'),
    ('game.recipes.points.few', 'What a dish scored, {n} signed (+3, −3), the `few` form - 2 to 4 in Slovak; English never asks for it.'),
    ('game.recipes.points.other', 'What a dish scored, {n} signed, the `other` form - 0, and 5 and more in Slovak; 0, and 2 and more in English.'),
    ('game.recipes.next', 'Recipe Master: the button to the next dish, once one is over. No placeholders.'),
    ('game.recipes.finish', 'Recipe Master: the button to the table, once the last dish is over. No placeholders.'),
    ('game.recipes.rule', 'Recipe Master: the scoring, under the options. No placeholders.'),
    ('game.recipes.resultsTitle', 'Recipe Master''s table: the label above the score out of 30. No placeholders.'),
    ('game.recipes.dish', 'Recipe Master''s table: the column of the dishes. No placeholders.'),
    ('game.recipes.ingredients', 'Recipe Master''s table: the column of every option a dish had, as it was left. No placeholders.'),
    ('game.recipes.pointsHeader', 'Recipe Master''s table: the column of each dish''s points. No placeholders.'),
    ('game.recipes.again', 'Recipe Master: the button that deals ten new dishes. No placeholders.'),
    ('game.recipes.none', 'Recipe Master, when the dishes, their recipes or the materials could not be loaded. No placeholders.'),
    ('guide.recipes.title', 'Heading of the Recipe Master guide modal'),
    ('game.pexeso.title', 'Game name: the memory game (pexeso) of characters and what they are. No placeholders.'),
    ('game.pexeso.info', 'Game card description. No placeholders.'),
    ('game.pexeso.difficultyLabel', 'Memory''s setup: the label of the difficulty slider. No placeholders.'),
    ('game.pexeso.difficulty.easy', 'Memory''s difficulty: 16 cards in pairs. No placeholders.'),
    ('game.pexeso.difficulty.medium', 'Memory''s difficulty: 36 cards in threes. No placeholders.'),
    ('game.pexeso.difficulty.hard', 'Memory''s difficulty: 36 cards in fours. No placeholders.'),
    ('game.pexeso.difficultyHint.easy', 'Memory''s setup: what Easy deals, under the slider. No placeholders.'),
    ('game.pexeso.difficultyHint.medium', 'Memory''s setup: what Medium deals, under the slider. No placeholders.'),
    ('game.pexeso.difficultyHint.hard', 'Memory''s setup: what Hard deals, under the slider. No placeholders.'),
    ('game.pexeso.start', 'Memory''s setup: the button that deals the board. No placeholders.'),
    ('game.pexeso.group', 'Memory: what makes a group on this board. {kinds} the kinds of card drawn for it - game.pexeso.kind.* - joined as the reader''s language joins a list ("element and region").'),
    ('game.pexeso.kind.element', 'Memory: a kind of card, inside game.pexeso.group - a character''s element. No placeholders.'),
    ('game.pexeso.kind.weapon', 'Memory: a kind of card, inside game.pexeso.group - a character''s weapon type. No placeholders.'),
    ('game.pexeso.kind.region', 'Memory: a kind of card, inside game.pexeso.group - a character''s region. No placeholders.'),
    ('game.pexeso.look', 'Memory: the countdown while every card is face up. {seconds} the seconds left.'),
    ('game.pexeso.found', 'Memory''s status: how many groups are found. {found} the found ones, {total} how many the board holds.'),
    ('game.pexeso.turns', 'Memory''s status: the turns taken - every selection finished, found or not. {turns} how many.'),
    ('game.pexeso.time', 'Memory''s status: the time since the cards turned over. {seconds} the seconds.'),
    ('game.pexeso.won', 'Memory, once every group is found. {turns} the turns it took, {seconds} the seconds.'),
    ('game.pexeso.again', 'Memory: the button that deals a new board at the same difficulty. No placeholders.'),
    ('game.pexeso.backToSetup', 'Memory: the button back to the setup, to choose another difficulty. No placeholders.'),
    ('game.pexeso.hidden', 'Memory: the name a face-down card is read by. No placeholders.'),
    ('game.pexeso.notEnough', 'Memory, when too few characters have every kind the board asks for. No placeholders.'),
    ('guide.pexeso.title', 'Heading of the Memory (pexeso) guide modal')
ON CONFLICT (name) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'en', v.value FROM (VALUES
    ('game.recipes.title', 'Recipe Master'),
    ('game.recipes.info', 'Pick out a dish''s ingredients from among three wrong ones - ten dishes, three points each.'),
    ('game.recipes.progress', 'Dish {n} of {total}'),
    ('game.recipes.score', 'Score: {points}'),
    ('game.recipes.prompt', 'Which ingredients go into it?'),
    ('game.recipes.found', 'Found {found} of {total}'),
    ('game.recipes.right', 'right'),
    ('game.recipes.wrong', 'wrong, picked'),
    ('game.recipes.wrongLeft', 'wrong, left alone'),
    ('game.recipes.points.one', '{n} point'),
    ('game.recipes.points.few', '{n} points'),
    ('game.recipes.points.other', '{n} points'),
    ('game.recipes.next', 'Next dish'),
    ('game.recipes.finish', 'See the results'),
    ('game.recipes.rule', 'Three points a dish, and every wrong pick costs two.'),
    ('game.recipes.resultsTitle', 'Your score'),
    ('game.recipes.dish', 'Dish'),
    ('game.recipes.ingredients', 'Ingredients'),
    ('game.recipes.pointsHeader', 'Points'),
    ('game.recipes.again', 'Play again'),
    ('game.recipes.none', 'No dishes with a recipe could be loaded.'),
    ('guide.recipes.title', 'About Recipe Master'),
    ('game.pexeso.title', 'Memory'),
    ('game.pexeso.info', 'Find each character''s group - the character and the cards of what they are - after one look at the board.'),
    ('game.pexeso.difficultyLabel', 'Difficulty'),
    ('game.pexeso.difficulty.easy', 'Easy'),
    ('game.pexeso.difficulty.medium', 'Medium'),
    ('game.pexeso.difficulty.hard', 'Hard'),
    ('game.pexeso.difficultyHint.easy', '16 cards in pairs: a character and one card of what they are - their element, weapon type or region, drawn for the game. 3 seconds to look.'),
    ('game.pexeso.difficultyHint.medium', '36 cards in threes: a character and two cards of what they are, drawn for the game. 5 seconds to look.'),
    ('game.pexeso.difficultyHint.hard', '36 cards in fours: a character with their element, weapon type and region. 5 seconds to look.'),
    ('game.pexeso.start', 'Start'),
    ('game.pexeso.group', 'A group: a character and their {kinds}.'),
    ('game.pexeso.kind.element', 'element'),
    ('game.pexeso.kind.weapon', 'weapon type'),
    ('game.pexeso.kind.region', 'region'),
    ('game.pexeso.look', 'Remember them: {seconds} s'),
    ('game.pexeso.found', 'Groups found: {found} of {total}'),
    ('game.pexeso.turns', 'Turns: {turns}'),
    ('game.pexeso.time', 'Time: {seconds} s'),
    ('game.pexeso.won', 'All groups found - {turns} turns, {seconds} s.'),
    ('game.pexeso.again', 'Play again'),
    ('game.pexeso.backToSetup', 'Change difficulty'),
    ('game.pexeso.hidden', 'Hidden card'),
    ('game.pexeso.notEnough', 'There are not enough characters to deal this board.'),
    ('guide.pexeso.title', 'About Memory')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'sk', v.value FROM (VALUES
    ('game.recipes.title', 'Majster receptov'),
    ('game.recipes.info', 'Vyber ingrediencie jedla spomedzi troch nesprávnych - desať jedál, za každé tri body.'),
    ('game.recipes.progress', 'Jedlo {n} z {total}'),
    ('game.recipes.score', 'Skóre: {points}'),
    ('game.recipes.prompt', 'Aké ingrediencie doň patria?'),
    ('game.recipes.found', 'Nájdené: {found} z {total}'),
    ('game.recipes.right', 'správna'),
    ('game.recipes.wrong', 'nesprávna, vybratá'),
    ('game.recipes.wrongLeft', 'nesprávna, nevybratá'),
    ('game.recipes.points.one', '{n} bod'),
    ('game.recipes.points.few', '{n} body'),
    ('game.recipes.points.other', '{n} bodov'),
    ('game.recipes.next', 'Ďalšie jedlo'),
    ('game.recipes.finish', 'Zobraziť výsledky'),
    ('game.recipes.rule', 'Tri body za jedlo a každý zlý výber stojí dva.'),
    ('game.recipes.resultsTitle', 'Tvoje skóre'),
    ('game.recipes.dish', 'Jedlo'),
    ('game.recipes.ingredients', 'Ingrediencie'),
    ('game.recipes.pointsHeader', 'Body'),
    ('game.recipes.again', 'Hrať znova'),
    ('game.recipes.none', 'Jedlá s receptom sa nepodarilo načítať.'),
    ('guide.recipes.title', 'O Majstrovi receptov'),
    ('game.pexeso.title', 'Pexeso'),
    ('game.pexeso.info', 'Nájdi skupinu každej postavy - postavu a karty toho, čím je - po jednom pohľade na pole.'),
    ('game.pexeso.difficultyLabel', 'Obtiažnosť'),
    ('game.pexeso.difficulty.easy', 'Ľahká'),
    ('game.pexeso.difficulty.medium', 'Stredná'),
    ('game.pexeso.difficulty.hard', 'Ťažká'),
    ('game.pexeso.difficultyHint.easy', '16 kariet v dvojiciach: postava a jedna karta toho, čím je - jej živel, typ zbrane alebo región, vylosované pre hru. 3 sekundy na pozretie.'),
    ('game.pexeso.difficultyHint.medium', '36 kariet v trojiciach: postava a dve karty toho, čím je, vylosované pre hru. 5 sekúnd na pozretie.'),
    ('game.pexeso.difficultyHint.hard', '36 kariet v štvoriciach: postava s jej živlom, typom zbrane a regiónom. 5 sekúnd na pozretie.'),
    ('game.pexeso.start', 'Začať'),
    ('game.pexeso.group', 'Skupina: postava a jej {kinds}.'),
    ('game.pexeso.kind.element', 'živel'),
    ('game.pexeso.kind.weapon', 'typ zbrane'),
    ('game.pexeso.kind.region', 'región'),
    ('game.pexeso.look', 'Zapamätaj si ich: {seconds} s'),
    ('game.pexeso.found', 'Nájdené skupiny: {found} z {total}'),
    ('game.pexeso.turns', 'Ťahy: {turns}'),
    ('game.pexeso.time', 'Čas: {seconds} s'),
    ('game.pexeso.won', 'Všetky skupiny nájdené - ťahy: {turns}, čas: {seconds} s.'),
    ('game.pexeso.again', 'Hrať znova'),
    ('game.pexeso.backToSetup', 'Zmeniť obtiažnosť'),
    ('game.pexeso.hidden', 'Skrytá karta'),
    ('game.pexeso.notEnough', 'Na toto pole nie je dosť postáv.'),
    ('guide.pexeso.title', 'O pexese')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

-----------------------------------------------------------
-- THE GUIDES
--
-- In the others' words and shape (users/051): what the game is, how to play
-- it a step a line, and that nothing is kept. Markup the allow-list keeps
-- (api/rich_text.php).
-----------------------------------------------------------

INSERT INTO guide_contents (guide, language_code, html) VALUES
    ('recipes', 'en', '<h4>What is Recipe Master?</h4>
<p>Ten dishes, one after another: pick out what goes into each.</p>
<h4>How to play</h4>
<ol>
<li>A dish is shown with its ingredients and three that do not belong.</li>
<li>Click an ingredient: green if it is in the recipe, red if it is not - and it stays so.</li>
<li>The dish is done once you have found all of its ingredients.</li>
<li>A dish is worth three points, and every wrong pick costs two: no mistake 3, one 1, two −1, all three −3.</li>
<li>After the tenth dish, a table shows every dish, what you picked and your score out of 30.</li>
</ol>
<p>Nothing is saved. Leave the page and the game is gone.</p>'),
    ('recipes', 'sk', '<h4>Čo je Majster receptov?</h4>
<p>Desať jedál, jedno po druhom: vyber, čo do každého patrí.</p>
<h4>Ako sa hrá</h4>
<ol>
<li>Zobrazí sa jedlo s jeho ingredienciami a troma, ktoré doň nepatria.</li>
<li>Klikni na ingredienciu: zelená, ak je v recepte, červená, ak nie - a tak už zostane.</li>
<li>Jedlo je hotové, keď nájdeš všetky jeho ingrediencie.</li>
<li>Jedlo má hodnotu troch bodov a každý zlý výber stojí dva: bez chyby 3, s jednou 1, s dvoma −1, so všetkými troma −3.</li>
<li>Po desiatom jedle uvidíš tabuľku so všetkými jedlami, svojimi výbermi a skóre z 30.</li>
</ol>
<p>Nič sa neukladá. Keď odídeš zo stránky, hra je preč.</p>'),
    ('pexeso', 'en', '<h4>What is Memory?</h4>
<p>Pexeso with the game''s characters: find each character''s group - the character and the cards of what they are.</p>
<h4>How to play</h4>
<ol>
<li>Choose a difficulty and press Start.</li>
<li>Every card is shown face up for a few seconds - remember where they are.</li>
<li>The cards turn over. Turn them up one at a time to make a group: a character and their element, weapon type or region, as the board says.</li>
<li>Any card that fits counts: any Pyro card goes with any Pyro character.</li>
<li>A group that does not fit turns back over. Find every group in as few turns as you can.</li>
</ol>
<h4>Difficulties</h4>
<ul>
<li><span class="tag">Easy</span> 16 cards in pairs: a character and one card of what they are. 3 seconds to look.</li>
<li><span class="tag">Medium</span> 36 cards in threes: a character and two cards. 5 seconds to look.</li>
<li><span class="tag">Hard</span> 36 cards in fours: a character with their element, weapon type and region. 5 seconds to look.</li>
</ul>
<p>Nothing is saved. Leave the page and the game is gone.</p>'),
    ('pexeso', 'sk', '<h4>Čo je Pexeso?</h4>
<p>Pexeso s postavami z hry: nájdi skupinu každej postavy - postavu a karty toho, čím je.</p>
<h4>Ako sa hrá</h4>
<ol>
<li>Vyber obtiažnosť a stlač Začať.</li>
<li>Všetky karty sú na pár sekúnd otočené lícom nahor - zapamätaj si, kde sú.</li>
<li>Karty sa otočia. Otáčaj ich po jednej a skladaj skupinu: postavu a jej živel, typ zbrane alebo región, ako hovorí pole.</li>
<li>Platí každá karta, ktorá sedí: ktorákoľvek karta Pyro patrí ku ktorejkoľvek postave Pyro.</li>
<li>Skupina, ktorá nesedí, sa otočí späť. Nájdi všetky skupiny na čo najmenej ťahov.</li>
</ol>
<h4>Obtiažnosti</h4>
<ul>
<li><span class="tag">Ľahká</span> 16 kariet v dvojiciach: postava a jedna karta toho, čím je. 3 sekundy na pozretie.</li>
<li><span class="tag">Stredná</span> 36 kariet v trojiciach: postava a dve karty. 5 sekúnd na pozretie.</li>
<li><span class="tag">Ťažká</span> 36 kariet v štvoriciach: postava s jej živlom, typom zbrane a regiónom. 5 sekúnd na pozretie.</li>
</ul>
<p>Nič sa neukladá. Keď odídeš zo stránky, hra je preč.</p>')
ON CONFLICT (guide, language_code) DO NOTHING;

-- The Games page's guide: the four games where its sentence still names the two in users/028's words.
UPDATE guide_contents
   SET html = replace(html, '<strong>Tournament</strong> and <strong>Minesweeper</strong>', '<strong>Tournament</strong>, <strong>Minesweeper</strong>, <strong>Recipe Master</strong> and <strong>Memory</strong>'),
       updated_at = CURRENT_TIMESTAMP
 WHERE guide = 'games'
   AND language_code = 'en'
   AND strpos(html, '<strong>Tournament</strong> and <strong>Minesweeper</strong>.') > 0;

UPDATE guide_contents
   SET html = replace(html, '<strong>Turnaj</strong> a <strong>Míny</strong>', '<strong>Turnaj</strong>, <strong>Míny</strong>, <strong>Majster receptov</strong> a <strong>Pexeso</strong>'),
       updated_at = CURRENT_TIMESTAMP
 WHERE guide = 'games'
   AND language_code = 'sk'
   AND strpos(html, '<strong>Turnaj</strong> a <strong>Míny</strong>.') > 0;

-----------------------------------------------------------
-- THEIR PAGES IN PAGE ACCESS
--
-- Anybody's, as the other games' are, after Minesweeper's (42).
-----------------------------------------------------------

INSERT INTO anotoki_page_access (path, visibility, blocked, api_paths, sort_order)
SELECT v.path, 'PUBLIC', FALSE, '{}'::TEXT[], v.sort_order
  FROM (VALUES
      ('/games/recipes', 43),
      ('/games/pexeso', 44)
  ) AS v(path, sort_order)
 WHERE NOT EXISTS (SELECT 1 FROM anotoki_page_access p WHERE p.path = v.path);

-- Every key above exists with both languages' strings, both guides in both
-- languages, each page with its row - whichever of them this file wrote - and
-- no Games guide still names only the two games in 028's words.
DO $$
DECLARE
    missing TEXT;
BEGIN
    SELECT string_agg(k.name, ', ' ORDER BY k.name) INTO missing
      FROM (VALUES
          ('game.recipes.title'), ('game.recipes.info'), ('game.recipes.progress'), ('game.recipes.score'),
          ('game.recipes.prompt'), ('game.recipes.found'), ('game.recipes.right'), ('game.recipes.wrong'),
          ('game.recipes.wrongLeft'), ('game.recipes.points.one'), ('game.recipes.points.few'),
          ('game.recipes.points.other'), ('game.recipes.next'), ('game.recipes.finish'), ('game.recipes.rule'),
          ('game.recipes.resultsTitle'), ('game.recipes.dish'), ('game.recipes.ingredients'),
          ('game.recipes.pointsHeader'), ('game.recipes.again'), ('game.recipes.none'), ('guide.recipes.title'),
          ('game.pexeso.title'), ('game.pexeso.info'), ('game.pexeso.difficultyLabel'),
          ('game.pexeso.difficulty.easy'), ('game.pexeso.difficulty.medium'), ('game.pexeso.difficulty.hard'),
          ('game.pexeso.difficultyHint.easy'), ('game.pexeso.difficultyHint.medium'),
          ('game.pexeso.difficultyHint.hard'), ('game.pexeso.start'), ('game.pexeso.group'),
          ('game.pexeso.kind.element'), ('game.pexeso.kind.weapon'), ('game.pexeso.kind.region'),
          ('game.pexeso.look'), ('game.pexeso.found'), ('game.pexeso.turns'), ('game.pexeso.time'),
          ('game.pexeso.won'), ('game.pexeso.again'), ('game.pexeso.backToSetup'), ('game.pexeso.hidden'),
          ('game.pexeso.notEnough'), ('guide.pexeso.title')
      ) AS k(name)
     WHERE NOT EXISTS (SELECT 1 FROM translation_keys tk WHERE tk.name = k.name)
        OR NOT EXISTS (SELECT 1 FROM translations t WHERE t.key_name = k.name AND t.language_code = 'en')
        OR NOT EXISTS (SELECT 1 FROM translations t WHERE t.key_name = k.name AND t.language_code = 'sk');
    IF missing IS NOT NULL THEN
        RAISE EXCEPTION 'users/074: keys without an English and a Slovak string: %', missing;
    END IF;

    SELECT string_agg(g.guide || '/' || g.language_code, ', ' ORDER BY g.guide, g.language_code) INTO missing
      FROM (VALUES ('recipes', 'en'), ('recipes', 'sk'), ('pexeso', 'en'), ('pexeso', 'sk')) AS g(guide, language_code)
     WHERE NOT EXISTS (SELECT 1 FROM guide_contents c WHERE c.guide = g.guide AND c.language_code = g.language_code);
    IF missing IS NOT NULL THEN
        RAISE EXCEPTION 'users/074: guides missing: %', missing;
    END IF;

    SELECT string_agg(c.language_code, ', ' ORDER BY c.language_code) INTO missing
      FROM guide_contents c
     WHERE c.guide = 'games'
       AND (strpos(c.html, '<strong>Tournament</strong> and <strong>Minesweeper</strong>.') > 0
            OR strpos(c.html, '<strong>Turnaj</strong> a <strong>Míny</strong>.') > 0);
    IF missing IS NOT NULL THEN
        RAISE EXCEPTION 'users/074: the Games guide still names two games in: %', missing;
    END IF;

    SELECT string_agg(p.path, ', ' ORDER BY p.path) INTO missing
      FROM (VALUES ('/games/recipes'), ('/games/pexeso')) AS p(path)
     WHERE NOT EXISTS (SELECT 1 FROM anotoki_page_access a WHERE a.path = p.path);
    IF missing IS NOT NULL THEN
        RAISE EXCEPTION 'users/074: pages without a Page access row: %', missing;
    END IF;
END $$;
