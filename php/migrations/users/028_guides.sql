-----------------------------------------------------------
-- THE GUIDES BEHIND THE QUESTION MARKS
--
-- The old site kept these in data files - quizzes.js, games.js and
-- top-menu-items.js - as English template literals under `modalContent`. That
-- put them beyond translation and beyond correction: a typo in one was a
-- deploy. They are translations now, one key per guide, and markup rather
-- than prose because a guide is a heading, a paragraph and a numbered list.
--
-- The body keys are flagged `is_html`, which is what tells the admin panel to
-- open them in the HTML editor rather than a one-line box. Rendering is not
-- decided by the flag: the guide modal asks for markup explicitly, and every
-- other string on the site is still written as text.
--
-- The markup was rewritten on the way across. The old text carried Bootstrap
-- classes - mb-4, fw-bold, badge bg-primary - and there is no Bootstrap here.
-- What it needs instead is semantic: headings are headings, and the one class
-- left is `.tag`, styled by rich-text.component.scss.
-----------------------------------------------------------

INSERT INTO translation_keys (name, description, site, is_html) VALUES
    ('guide.daily.title', 'Heading of the daily guide modal', 'genshin_impact', FALSE),
    ('guide.daily.content', 'Body of the daily guide modal - markup, edited in the HTML editor', 'genshin_impact', TRUE),
    ('guide.quizzes.title', 'Heading of the quizzes guide modal', 'genshin_impact', FALSE),
    ('guide.quizzes.content', 'Body of the quizzes guide modal - markup, edited in the HTML editor', 'genshin_impact', TRUE),
    ('guide.games.title', 'Heading of the games guide modal', 'genshin_impact', FALSE),
    ('guide.games.content', 'Body of the games guide modal - markup, edited in the HTML editor', 'genshin_impact', TRUE),
    ('guide.banners.title', 'Heading of the banners guide modal', 'genshin_impact', FALSE),
    ('guide.banners.content', 'Body of the banners guide modal - markup, edited in the HTML editor', 'genshin_impact', TRUE),
    ('guide.pixelate.title', 'Heading of the pixelate guide modal', 'genshin_impact', FALSE),
    ('guide.pixelate.content', 'Body of the pixelate guide modal - markup, edited in the HTML editor', 'genshin_impact', TRUE),
    ('guide.mismatch.title', 'Heading of the mismatch guide modal', 'genshin_impact', FALSE),
    ('guide.mismatch.content', 'Body of the mismatch guide modal - markup, edited in the HTML editor', 'genshin_impact', TRUE),
    ('guide.music.title', 'Heading of the music guide modal', 'genshin_impact', FALSE),
    ('guide.music.content', 'Body of the music guide modal - markup, edited in the HTML editor', 'genshin_impact', TRUE),
    ('guide.dish.title', 'Heading of the dish guide modal', 'genshin_impact', FALSE),
    ('guide.dish.content', 'Body of the dish guide modal - markup, edited in the HTML editor', 'genshin_impact', TRUE),
    ('guide.voice.title', 'Heading of the voice guide modal', 'genshin_impact', FALSE),
    ('guide.voice.content', 'Body of the voice guide modal - markup, edited in the HTML editor', 'genshin_impact', TRUE),
    ('guide.tournament.title', 'Heading of the tournament guide modal', 'genshin_impact', FALSE),
    ('guide.tournament.content', 'Body of the tournament guide modal - markup, edited in the HTML editor', 'genshin_impact', TRUE),
    ('guide.minesweeper.title', 'Heading of the minesweeper guide modal', 'genshin_impact', FALSE),
    ('guide.minesweeper.content', 'Body of the minesweeper guide modal - markup, edited in the HTML editor', 'genshin_impact', TRUE)
ON CONFLICT (name) DO NOTHING;

UPDATE translation_keys SET is_html = TRUE WHERE name LIKE 'guide.%.content';

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'en', v.value FROM (VALUES
    ('guide.daily.title', 'About the Daily'),
    ('guide.daily.content', '<h4>What is the Daily?</h4>
<p>Two quizzes are drawn at random each day, one question each. Any of the quizzes can come up: <strong>banners</strong>, <strong>pixelate</strong>, <strong>mismatch</strong>, <strong>music</strong>, <strong>dish</strong> or <strong>voice</strong>.</p>
<h4>How it works</h4>
<ol>
<li>Two quizzes are drawn each day.</li>
<li>Every question is timed.</li>
<li>Every question has a difficulty.</li>
<li>Each daily quiz can be attempted once a day.</li>
<li>The day rolls over at 00:00 UTC.</li>
<li>Once the daily is done you can still play any quiz on its own.</li>
</ol>'),
    ('guide.quizzes.title', 'About the Quizzes'),
    ('guide.quizzes.content', '<h4>What are the Quizzes?</h4>
<p>A set of questions about the game. Each quiz asks about something different: <strong>banners</strong>, <strong>pixelate</strong>, <strong>mismatch</strong>, <strong>music</strong>, <strong>dish</strong> and <strong>voice</strong>.</p>
<h4>How to play</h4>
<ol>
<li>Every quiz is timed.</li>
<li>Every quiz has a difficulty.</li>
<li>Played from here, a quiz can be played as often as you like.</li>
<li>The daily version of a quiz is the one limited to a single attempt a day.</li>
</ol>
<p>Your results are kept, so the profile page can show what you have played and how it went.</p>'),
    ('guide.games.title', 'About the Games'),
    ('guide.games.content', '<h4>What are the Games?</h4>
<p>Made for fun rather than for scoring: <strong>Tournament</strong> and <strong>Minesweeper</strong>.</p>
<h4>How to play</h4>
<ol>
<li>Each game has its own rules.</li>
<li>The question mark on a game''s card explains that game.</li>
</ol>
<p>Unlike a quiz, a game keeps nothing. There is no saved position and no result - you play it, and when you leave it is gone.</p>'),
    ('guide.banners.title', 'About Banners'),
    ('guide.banners.content', '<h4>What is the Banners quiz?</h4>
<p>Name the character from their namecard - the decorative banner you are given at Friendship Level 10.</p>
<h4>How to play</h4>
<ol>
<li>A namecard is shown, distorted.</li>
<li>Type a character name or pick one from the list.</li>
<li>You get up to five guesses.</li>
<li>Every wrong guess makes the banner a little clearer.</li>
</ol>'),
    ('guide.pixelate.title', 'About Pixelate'),
    ('guide.pixelate.content', '<h4>What is the Pixelate quiz?</h4>
<p>Name the character from a heavily pixelated portrait. The fewer guesses it takes, the better you know them.</p>
<h4>How to play</h4>
<ol>
<li>A portrait is shown, pixelated almost beyond recognition.</li>
<li>Type a character name or pick one from the list.</li>
<li>You get up to five guesses.</li>
<li>Every wrong guess sharpens the picture a little.</li>
</ol>'),
    ('guide.mismatch.title', 'About Mismatch'),
    ('guide.mismatch.content', '<h4>What is the Mismatch quiz?</h4>
<p>Four characters, three of which have something in common. Find the one that does not belong.</p>
<h4>How to play</h4>
<ol>
<li>Four character icons are shown.</li>
<li>Three of them share an element, a weapon type or a region.</li>
<li>Click the one that is different.</li>
<li>One attempt per question.</li>
</ol>
<h4>What they might share</h4>
<ul>
<li><span class="tag">Element</span> Three share an element, one does not.</li>
<li><span class="tag">Weapon</span> Three use the same kind of weapon.</li>
<li><span class="tag">Region</span> Three come from the same place.</li>
</ul>
<p>The category is never named, and the four are picked at random. Working out what the three have in common is the quiz.</p>'),
    ('guide.music.title', 'About Music'),
    ('guide.music.content', '<h4>What is the Music quiz?</h4>
<p>Name the character from the music written for them.</p>
<h4>How to play</h4>
<ol>
<li>A player appears - press play to listen.</li>
<li>Type a character name or pick one from the list.</li>
<li>You get up to five guesses.</li>
<li>Every wrong guess gives you a longer piece of the track.</li>
</ol>'),
    ('guide.dish.title', 'About Dish'),
    ('guide.dish.content', '<h4>What is the Dish quiz?</h4>
<p>Name the character from their speciality dish.</p>
<h4>How to play</h4>
<ol>
<li>A dish is shown, distorted.</li>
<li>Type a character name or pick one from the list.</li>
<li>You get up to five guesses.</li>
<li>Every wrong guess makes the dish a little clearer.</li>
</ol>'),
    ('guide.voice.title', 'About Voice'),
    ('guide.voice.content', '<h4>What is the Voice quiz?</h4>
<p>Name the character from a line they say.</p>
<h4>How to play</h4>
<ol>
<li>A voice line is shown, with a player for the recording.</li>
<li>Press play to listen.</li>
<li>Type a character name or pick one from the list.</li>
<li>You get up to five guesses.</li>
<li>Every wrong guess gives you more of the line and more of the recording.</li>
</ol>'),
    ('guide.tournament.title', 'About the Character Tournament'),
    ('guide.tournament.content', '<h4>What is the Character Tournament?</h4>
<p>Put your favourite characters against each other. They are drawn at random and shown two at a time, and you decide who goes through.</p>
<h4>How to play</h4>
<ol>
<li>Choose how many characters take part.</li>
<li>Choose the format.</li>
<li>Press Start.</li>
<li>For each pair, pick the one you prefer.</li>
<li>Keep going until the tournament is decided.</li>
</ol>
<h4>Formats</h4>
<ul>
<li><span class="tag">Single elimination</span> Lose once and you are out. Only the winner is shown at the end.</li>
<li><span class="tag">Double elimination</span> A first loss is not the end. The top three are shown at the end.</li>
<li><span class="tag">Round robin</span> Everybody plays everybody once, and all of them are ranked by wins.</li>
</ul>
<p>Nothing is saved. Leave the page and the tournament is gone.</p>'),
    ('guide.minesweeper.title', 'About Elemental Minesweeper'),
    ('guide.minesweeper.content', '<h4>What is Elemental Minesweeper?</h4>
<p>Minesweeper played with elemental reactions instead of numbers. One reaction is dangerous each round, and any two cells that would cause it become a bomb.</p>
<h4>How to play</h4>
<ol>
<li>Click any cell to begin - the opening area is always safe.</li>
<li>The dangerous reaction for this round is shown above the board.</li>
<li>Two adjacent elements that would cause it form a bomb.</li>
<li>Turn cells over, working out where the bombs must be.</li>
<li>Clear every safe cell to win.</li>
<li>Turn over a bomb and the game is lost.</li>
</ol>
<h4>What is on the board</h4>
<ul>
<li><span class="tag">Elements</span> Every cell holds one of Pyro, Hydro, Anemo, Electro, Dendro, Cryo or Geo.</li>
<li><span class="tag">Bombs</span> Formed wherever the dangerous pair ends up side by side.</li>
<li><span class="tag">Safe area</span> Where you first clicked, always safe.</li>
</ul>
<h4>The dangerous reaction</h4>
<p>One is drawn each round - Vaporise (Pyro and Hydro), Melt (Pyro and Cryo), Overload (Pyro and Electro), Freeze (Hydro and Cryo), and the rest. Check which one it is before you start clicking.</p>')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'sk', v.value FROM (VALUES
    ('guide.daily.title', 'O dennej výzve'),
    ('guide.daily.content', '<h4>Čo je denná výzva?</h4>
<p>Každý deň sa náhodne vyberú dva kvízy, každý s jednou otázkou. Prísť môže ktorýkoľvek: <strong>bannery</strong>, <strong>pixely</strong>, <strong>votrelec</strong>, <strong>hudba</strong>, <strong>jedlo</strong> alebo <strong>hlas</strong>.</p>
<h4>Ako to funguje</h4>
<ol>
<li>Každý deň sa vyberú dva kvízy.</li>
<li>Každá otázka je na čas.</li>
<li>Každá otázka má obtiažnosť.</li>
<li>Denný kvíz sa dá skúsiť raz za deň.</li>
<li>Deň sa prepína o 00:00 UTC.</li>
<li>Po dohratí dennej výzvy sa dá každý kvíz hrať aj samostatne.</li>
</ol>'),
    ('guide.quizzes.title', 'O kvízoch'),
    ('guide.quizzes.content', '<h4>Čo sú kvízy?</h4>
<p>Sada otázok o hre. Každý kvíz sa pýta na niečo iné: <strong>bannery</strong>, <strong>pixely</strong>, <strong>votrelec</strong>, <strong>hudba</strong>, <strong>jedlo</strong> a <strong>hlas</strong>.</p>
<h4>Ako sa hrá</h4>
<ol>
<li>Každý kvíz je na čas.</li>
<li>Každý kvíz má obtiažnosť.</li>
<li>Odtiaľto sa dá kvíz hrať koľkokrát chceš.</li>
<li>Na jeden pokus denne je obmedzená len denná verzia kvízu.</li>
</ol>
<p>Výsledky sa ukladajú, takže na profile vidíš, čo si hral a ako ti to šlo.</p>'),
    ('guide.games.title', 'O hrách'),
    ('guide.games.content', '<h4>Čo sú hry?</h4>
<p>Sú pre zábavu, nie pre body: <strong>Turnaj</strong> a <strong>Míny</strong>.</p>
<h4>Ako sa hrá</h4>
<ol>
<li>Každá hra má vlastné pravidlá.</li>
<li>Otáznik na karte hry vysvetlí práve tú hru.</li>
</ol>
<p>Na rozdiel od kvízu si hra nič nepamätá. Neukladá sa rozohraná partia ani výsledok - zahráš si, a keď odídeš, je preč.</p>'),
    ('guide.banners.title', 'O banneroch'),
    ('guide.banners.content', '<h4>Čo je kvíz Bannery?</h4>
<p>Pomenuj postavu podľa jej vizitky - ozdobného banneru, ktorý dostaneš na 10. úrovni priateľstva.</p>
<h4>Ako sa hrá</h4>
<ol>
<li>Zobrazí sa vizitka, skreslená.</li>
<li>Napíš meno postavy alebo ho vyber zo zoznamu.</li>
<li>Máš päť pokusov.</li>
<li>Po každom zlom tipe sa banner trochu vyjasní.</li>
</ol>'),
    ('guide.pixelate.title', 'O pixeloch'),
    ('guide.pixelate.content', '<h4>Čo je kvíz Pixely?</h4>
<p>Pomenuj postavu podľa silno spixelovaného portrétu. Čím menej pokusov, tým lepšie ju poznáš.</p>
<h4>Ako sa hrá</h4>
<ol>
<li>Zobrazí sa portrét, spixelovaný takmer na nepoznanie.</li>
<li>Napíš meno postavy alebo ho vyber zo zoznamu.</li>
<li>Máš päť pokusov.</li>
<li>Po každom zlom tipe sa obrázok trochu zaostrí.</li>
</ol>'),
    ('guide.mismatch.title', 'O votrelcovi'),
    ('guide.mismatch.content', '<h4>Čo je kvíz Votrelec?</h4>
<p>Štyri postavy, tri z nich niečo spája. Nájdi tú, ktorá tam nepatrí.</p>
<h4>Ako sa hrá</h4>
<ol>
<li>Zobrazia sa ikony štyroch postáv.</li>
<li>Tri z nich zdieľajú živel, typ zbrane alebo región.</li>
<li>Klikni na tú, ktorá je iná.</li>
<li>Jeden pokus na otázku.</li>
</ol>
<h4>Čo ich môže spájať</h4>
<ul>
<li><span class="tag">Živel</span> Tri majú rovnaký živel, jedna nie.</li>
<li><span class="tag">Zbraň</span> Tri používajú rovnaký druh zbrane.</li>
<li><span class="tag">Región</span> Tri pochádzajú z rovnakého miesta.</li>
</ul>
<p>Kategória sa nikdy nepovie a štvorica je náhodná. Prísť na to, čo tie tri spája, je celý kvíz.</p>'),
    ('guide.music.title', 'O hudbe'),
    ('guide.music.content', '<h4>Čo je kvíz Hudba?</h4>
<p>Pomenuj postavu podľa hudby, ktorá bola pre ňu napísaná.</p>
<h4>Ako sa hrá</h4>
<ol>
<li>Objaví sa prehrávač - stlač play a počúvaj.</li>
<li>Napíš meno postavy alebo ho vyber zo zoznamu.</li>
<li>Máš päť pokusov.</li>
<li>Po každom zlom tipe dostaneš dlhší úsek skladby.</li>
</ol>'),
    ('guide.dish.title', 'O jedle'),
    ('guide.dish.content', '<h4>Čo je kvíz Jedlo?</h4>
<p>Pomenuj postavu podľa jej špeciality.</p>
<h4>Ako sa hrá</h4>
<ol>
<li>Zobrazí sa jedlo, skreslené.</li>
<li>Napíš meno postavy alebo ho vyber zo zoznamu.</li>
<li>Máš päť pokusov.</li>
<li>Po každom zlom tipe sa jedlo trochu vyjasní.</li>
</ol>'),
    ('guide.voice.title', 'O hlase'),
    ('guide.voice.content', '<h4>Čo je kvíz Hlas?</h4>
<p>Pomenuj postavu podľa hlášky, ktorú hovorí.</p>
<h4>Ako sa hrá</h4>
<ol>
<li>Zobrazí sa hláška a prehrávač s nahrávkou.</li>
<li>Stlač play a počúvaj.</li>
<li>Napíš meno postavy alebo ho vyber zo zoznamu.</li>
<li>Máš päť pokusov.</li>
<li>Po každom zlom tipe dostaneš viac z hlášky aj z nahrávky.</li>
</ol>'),
    ('guide.tournament.title', 'O turnaji postáv'),
    ('guide.tournament.content', '<h4>Čo je turnaj postáv?</h4>
<p>Postav svoje obľúbené postavy proti sebe. Vyberajú sa náhodne a ukazujú po dvoch - ty rozhoduješ, kto postúpi.</p>
<h4>Ako sa hrá</h4>
<ol>
<li>Vyber, koľko postáv sa zúčastní.</li>
<li>Vyber formát.</li>
<li>Stlač Štart.</li>
<li>Pri každej dvojici vyber tú, ktorú máš radšej.</li>
<li>Pokračuj, kým sa turnaj nerozhodne.</li>
</ol>
<h4>Formáty</h4>
<ul>
<li><span class="tag">Vyraďovací</span> Jedna prehra a končíš. Na konci sa ukáže len víťaz.</li>
<li><span class="tag">Dvojitý vyraďovací</span> Prvá prehra ešte nie je koniec. Na konci sa ukáže najlepšia trojica.</li>
<li><span class="tag">Každý s každým</span> Všetci hrajú so všetkými raz a zoradia sa podľa výhier.</li>
</ul>
<p>Nič sa neukladá. Keď odídeš zo stránky, turnaj je preč.</p>'),
    ('guide.minesweeper.title', 'O živelných mínach'),
    ('guide.minesweeper.content', '<h4>Čo sú živelné míny?</h4>
<p>Míny hrané so živelnými reakciami namiesto čísel. Každé kolo je nebezpečná jedna reakcia a každé dve políčka, ktoré by ju spôsobili, sa stanú bombou.</p>
<h4>Ako sa hrá</h4>
<ol>
<li>Klikni na ktorékoľvek políčko - úvodná oblasť je vždy bezpečná.</li>
<li>Nebezpečná reakcia tohto kola je nad hracou plochou.</li>
<li>Dva susedné živly, ktoré by ju spôsobili, tvoria bombu.</li>
<li>Odkrývaj políčka a odvoď, kde musia byť bomby.</li>
<li>Vyhráš odkrytím všetkých bezpečných políčok.</li>
<li>Odkrytím bomby prehrávaš.</li>
</ol>
<h4>Čo je na ploche</h4>
<ul>
<li><span class="tag">Živly</span> Každé políčko má jeden zo živlov Pyro, Hydro, Anemo, Electro, Dendro, Cryo alebo Geo.</li>
<li><span class="tag">Bomby</span> Vzniknú všade, kde sa nebezpečná dvojica ocitne vedľa seba.</li>
<li><span class="tag">Bezpečná oblasť</span> Miesto prvého kliknutia, vždy bezpečné.</li>
</ul>
<h4>Nebezpečná reakcia</h4>
<p>Každé kolo sa vyberie jedna - Vaporize (Pyro a Hydro), Melt (Pyro a Cryo), Overload (Pyro a Electro), Freeze (Hydro a Cryo) a ďalšie. Pozri sa, ktorá to je, skôr než začneš klikať.</p>')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

-----------------------------------------------------------
-- AND THE KEYS THE GUIDES REPLACE
--
-- These were the tooltip on the question mark before it opened anything.
-- `quiz.*.about` was the modal's title, which is now guide.*.title;
-- `game.*.about` was its opening paragraph, which is now the first thing in
-- guide.*.content. Nothing reads them any more, so they are removed rather
-- than left for somebody to translate twice.
-----------------------------------------------------------

DELETE FROM translation_keys WHERE name IN (
    'quiz.banners.about',
    'quiz.pixelate.about',
    'quiz.mismatch.about',
    'quiz.music.about',
    'quiz.dish.about',
    'quiz.voice.about',
    'game.tournament.about',
    'game.minesweeper.about'
);
