-----------------------------------------------------------
-- MINESWEEPER OPTIONS AND SCORE
--
-- The board used to be one fixed size dealt the moment the page opened. It now
-- asks two questions first - how big, and how hard - and answers with a score
-- at the end, of a win or a loss alike.
--
-- game.minesweeper.difficulty.* and game.minesweeper.difficultyHint.* are both
-- reached through a key built at runtime ('game.minesweeper.difficulty.' +
-- easy|medium|hard), so all three of each have to exist for any of them to
-- work.
--
-- The board sizes are not translated. '9 x 9' is built from the number the
-- slider is on, and the multiplication sign reads the same in every language
-- the site offers.
-----------------------------------------------------------

INSERT INTO translation_keys (name, description, site) VALUES
    ('game.minesweeper.difficultyLabel', 'Setup slider - how hard to take the board', 'genshin_impact'),
    ('game.minesweeper.difficulty.easy', 'Difficulty - one reaction, no clock', 'genshin_impact'),
    ('game.minesweeper.difficulty.medium', 'Difficulty - one reaction, sixty seconds', 'genshin_impact'),
    ('game.minesweeper.difficulty.hard', 'Difficulty - the reaction changes every five seconds', 'genshin_impact'),
    ('game.minesweeper.difficultyHint.easy', 'Sentence under the difficulty slider on Easy', 'genshin_impact'),
    ('game.minesweeper.difficultyHint.medium', 'Sentence under the difficulty slider on Medium', 'genshin_impact'),
    ('game.minesweeper.difficultyHint.hard', 'Sentence under the difficulty slider on Hard', 'genshin_impact'),
    ('game.minesweeper.sizeLabel', 'Setup slider - how many cells a side, 8 to 15', 'genshin_impact'),
    ('game.minesweeper.maxScore', 'Label over the ceiling shown before the game starts', 'genshin_impact'),
    ('game.minesweeper.maxScoreNote', 'Why that ceiling cannot actually be reached', 'genshin_impact'),
    ('game.minesweeper.start', 'Setup button that deals the board', 'genshin_impact'),
    ('game.minesweeper.time', 'Clock counting up - {seconds} elapsed', 'genshin_impact'),
    ('game.minesweeper.timeLeft', 'Clock counting down on Medium - {seconds} remaining', 'genshin_impact'),
    ('game.minesweeper.rotation', 'On Hard - {seconds} until the reaction changes', 'genshin_impact'),
    ('game.minesweeper.outOfTime', 'Shown when the sixty seconds run out', 'genshin_impact'),
    ('game.minesweeper.score', 'Unit beside the final score', 'genshin_impact'),
    ('game.minesweeper.resultDetail', 'Under the score - {seconds} taken, {max} the ceiling', 'genshin_impact'),
    ('game.minesweeper.bonus', 'Under the score on a win - {percent} is the completion bonus', 'genshin_impact'),
    ('game.minesweeper.backToSetup', 'Button returning to the size and difficulty sliders', 'genshin_impact')
ON CONFLICT (name) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'en', v.value FROM (VALUES
    ('game.minesweeper.difficultyLabel', 'Difficulty'),
    ('game.minesweeper.difficulty.easy', 'Easy'),
    ('game.minesweeper.difficulty.medium', 'Medium'),
    ('game.minesweeper.difficulty.hard', 'Hard'),
    ('game.minesweeper.difficultyHint.easy', 'One reaction for the whole board, and all the time you need.'),
    ('game.minesweeper.difficultyHint.medium', 'One reaction for the whole board, and sixty seconds to read it.'),
    ('game.minesweeper.difficultyHint.hard', 'The dangerous reaction changes every five seconds, and the board is worked out again each time.'),
    ('game.minesweeper.sizeLabel', 'Board'),
    ('game.minesweeper.maxScore', 'Most this board can pay'),
    ('game.minesweeper.maxScoreNote', 'Only for clearing it the instant it opens, so read it as a ceiling. Every second costs you some of it.'),
    ('game.minesweeper.start', 'Start'),
    ('game.minesweeper.time', 'Time {seconds}s'),
    ('game.minesweeper.timeLeft', '{seconds}s left'),
    ('game.minesweeper.rotation', 'Reaction changes in {seconds}s'),
    ('game.minesweeper.outOfTime', 'Out of time.'),
    ('game.minesweeper.score', 'points'),
    ('game.minesweeper.resultDetail', 'In {seconds}s, out of a possible {max}'),
    ('game.minesweeper.bonus', 'Includes a {percent}% bonus for finishing without a bomb.'),
    ('game.minesweeper.backToSetup', 'Change options')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'sk', v.value FROM (VALUES
    ('game.minesweeper.difficultyLabel', 'Obtiažnosť'),
    ('game.minesweeper.difficulty.easy', 'Ľahká'),
    ('game.minesweeper.difficulty.medium', 'Stredná'),
    ('game.minesweeper.difficulty.hard', 'Ťažká'),
    ('game.minesweeper.difficultyHint.easy', 'Jedna reakcia na celé pole a času koľko potrebuješ.'),
    ('game.minesweeper.difficultyHint.medium', 'Jedna reakcia na celé pole a šesťdesiat sekúnd na jeho prečítanie.'),
    ('game.minesweeper.difficultyHint.hard', 'Nebezpečná reakcia sa mení každých päť sekúnd a pole sa zakaždým prepočíta nanovo.'),
    ('game.minesweeper.sizeLabel', 'Hracia plocha'),
    ('game.minesweeper.maxScore', 'Najviac, čo môže toto pole vyniesť'),
    ('game.minesweeper.maxScoreNote', 'Len za vyčistenie v okamihu otvorenia, takže to ber ako strop. Každá sekunda ti z neho ubere.'),
    ('game.minesweeper.start', 'Začať'),
    ('game.minesweeper.time', 'Čas {seconds} s'),
    ('game.minesweeper.timeLeft', 'Zostáva {seconds} s'),
    ('game.minesweeper.rotation', 'Reakcia sa zmení o {seconds} s'),
    ('game.minesweeper.outOfTime', 'Čas vypršal.'),
    ('game.minesweeper.score', 'bodov'),
    ('game.minesweeper.resultDetail', 'Za {seconds} s, z možných {max}'),
    ('game.minesweeper.bonus', 'Vrátane bonusu {percent} % za dokončenie bez bomby.'),
    ('game.minesweeper.backToSetup', 'Zmeniť nastavenia')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

-- The guide modal described a board that dealt itself, had one difficulty and
-- kept no result. All three of those are now wrong, so the two sections that
-- are new to the game are written into it and the opening step is corrected.
UPDATE translations SET value = '<h4>What is Elemental Minesweeper?</h4>
<p>Minesweeper played with elemental reactions instead of numbers. One reaction is dangerous each round, and any two cells that would cause it become a bomb.</p>
<h4>How to play</h4>
<ol>
<li>Choose how big the board is and how hard to take it, then press Start.</li>
<li>Click any cell to begin - the opening area is always safe, and the clock starts there.</li>
<li>The dangerous reaction for this round is shown above the board.</li>
<li>Two adjacent elements that would cause it form a bomb.</li>
<li>Turn cells over, working out where the bombs must be.</li>
<li>Clear every safe cell to win.</li>
<li>Turn over a bomb and the game is lost.</li>
</ol>
<h4>Difficulty</h4>
<ul>
<li><span class="tag">Easy</span> One reaction for the whole board, and all the time you need.</li>
<li><span class="tag">Medium</span> One reaction, and sixty seconds. Running out loses the game.</li>
<li><span class="tag">Hard</span> The dangerous reaction changes every five seconds and the board is worked out again each time, so a cell that was safe a moment ago may not be.</li>
</ul>
<h4>Score</h4>
<p>Every game scores, won or lost. A bigger board and a harder round are worth more per cell; a lost game pays for as much of the board as you turned over; a cleared one pays for all of it and adds a quarter again on top.</p>
<p>Time takes from it the whole way through, which is why the number shown before you start is a ceiling rather than a target - it is what the board would pay if it were cleared the instant it opened.</p>
<h4>What is on the board</h4>
<ul>
<li><span class="tag">Elements</span> Every cell holds one of Pyro, Hydro, Anemo, Electro, Dendro, Cryo or Geo.</li>
<li><span class="tag">Bombs</span> Formed wherever the dangerous pair ends up side by side.</li>
<li><span class="tag">Safe area</span> Where you first clicked, always safe.</li>
</ul>
<h4>The dangerous reaction</h4>
<p>One is drawn each round - Vaporise (Pyro and Hydro), Melt (Pyro and Cryo), Overload (Pyro and Electro), Freeze (Hydro and Cryo), and the rest. Check which one it is before you start clicking.</p>'
WHERE key_name = 'guide.minesweeper.content' AND language_code = 'en';

UPDATE translations SET value = '<h4>Čo sú živelné míny?</h4>
<p>Míny hrané so živelnými reakciami namiesto čísel. Každé kolo je nebezpečná jedna reakcia a každé dve políčka, ktoré by ju spôsobili, sa stanú bombou.</p>
<h4>Ako sa hrá</h4>
<ol>
<li>Vyber si veľkosť hracej plochy a obtiažnosť a stlač Začať.</li>
<li>Klikni na ktorékoľvek políčko - úvodná oblasť je vždy bezpečná a vtedy sa spúšťa čas.</li>
<li>Nebezpečná reakcia tohto kola je nad hracou plochou.</li>
<li>Dva susedné živly, ktoré by ju spôsobili, tvoria bombu.</li>
<li>Odkrývaj políčka a odvoď, kde musia byť bomby.</li>
<li>Vyhráš odkrytím všetkých bezpečných políčok.</li>
<li>Odkrytím bomby prehrávaš.</li>
</ol>
<h4>Obtiažnosť</h4>
<ul>
<li><span class="tag">Ľahká</span> Jedna reakcia na celé pole a času koľko potrebuješ.</li>
<li><span class="tag">Stredná</span> Jedna reakcia a šesťdesiat sekúnd. Keď čas vyprší, prehrávaš.</li>
<li><span class="tag">Ťažká</span> Nebezpečná reakcia sa mení každých päť sekúnd a pole sa zakaždým prepočíta nanovo, takže políčko, ktoré bolo pred chvíľou bezpečné, už bezpečné byť nemusí.</li>
</ul>
<h4>Skóre</h4>
<p>Body dostaneš za každú hru, vyhranú aj prehranú. Väčšia plocha a ťažšie kolo znamenajú viac bodov za políčko; za prehranú hru dostaneš toľko, koľko si stihol odkryť; za vyčistenú dostaneš za celú plochu a k tomu štvrtinu navyše.</p>
<p>Čas ti z toho celý čas uberá, a preto je číslo pred začiatkom hry strop, nie cieľ - je to toľko, koľko by plocha vyniesla, keby si ju vyčistil v okamihu otvorenia.</p>
<h4>Čo je na ploche</h4>
<ul>
<li><span class="tag">Živly</span> Každé políčko má jeden zo živlov Pyro, Hydro, Anemo, Electro, Dendro, Cryo alebo Geo.</li>
<li><span class="tag">Bomby</span> Vzniknú všade, kde sa nebezpečná dvojica ocitne vedľa seba.</li>
<li><span class="tag">Bezpečná oblasť</span> Miesto prvého kliknutia, vždy bezpečné.</li>
</ul>
<h4>Nebezpečná reakcia</h4>
<p>Každé kolo sa vyberie jedna - Vaporize (Pyro a Hydro), Melt (Pyro a Cryo), Overload (Pyro a Electro), Freeze (Hydro a Cryo) a ďalšie. Pozri sa, ktorá to je, skôr než začneš klikať.</p>'
WHERE key_name = 'guide.minesweeper.content' AND language_code = 'sk';
