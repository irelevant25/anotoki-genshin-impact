-----------------------------------------------------------
-- GAME STRINGS
--
-- The two games ported from the old site: a character tournament and a
-- minesweeper played with elemental reactions.
--
-- game.tournament.format.* is reached through a key built at runtime
-- ('game.tournament.format.' + single|double|roundRobin), so all three have to
-- exist for any of them to work.
--
-- The element names on the minesweeper board are not translated. They are the
-- game's own words - Pyro is Pyro in every language the site offers - and they
-- come from the data rather than from here.
-----------------------------------------------------------

INSERT INTO translation_keys (name, description, site) VALUES
    ('game.tournament.title', 'Card title on the Games page', 'genshin_impact'),
    ('game.tournament.info', 'Card description on the Games page', 'genshin_impact'),
    ('game.tournament.about', 'Longer description, shown on the card help icon', 'genshin_impact'),
    ('game.tournament.formatLabel', 'Setup field - which tournament format to play', 'genshin_impact'),
    ('game.tournament.sizeLabel', 'Setup field - how many characters take part', 'genshin_impact'),
    ('game.tournament.start', 'Setup button that begins the tournament', 'genshin_impact'),
    ('game.tournament.format.single', 'Tournament format - one loss and you are out', 'genshin_impact'),
    ('game.tournament.format.double', 'Tournament format - two losses and you are out', 'genshin_impact'),
    ('game.tournament.format.roundRobin', 'Tournament format - everybody plays everybody', 'genshin_impact'),
    ('game.tournament.matches', 'Progress line - {played} of {total} matches', 'genshin_impact'),
    ('game.tournament.wins', 'Under a podium place in round robin - {wins} is the count', 'genshin_impact'),
    ('game.tournament.back', 'Button returning to the setup form mid-tournament', 'genshin_impact'),
    ('game.tournament.again', 'Button returning to the setup form once it is over', 'genshin_impact'),
    ('game.minesweeper.title', 'Card title on the Games page', 'genshin_impact'),
    ('game.minesweeper.info', 'Card description on the Games page', 'genshin_impact'),
    ('game.minesweeper.about', 'Longer description, shown on the card help icon', 'genshin_impact'),
    ('game.minesweeper.win', 'Shown when the board is cleared', 'genshin_impact'),
    ('game.minesweeper.lose', 'Shown when a bomb is turned over', 'genshin_impact'),
    ('game.minesweeper.revealed', 'Progress line - {revealed} of {total} cells', 'genshin_impact'),
    ('game.minesweeper.newGame', 'Button that deals a new board', 'genshin_impact')
ON CONFLICT (name) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'en', v.value FROM (VALUES
    ('game.tournament.title', 'Tournament'),
    ('game.tournament.info', 'Put your favourite characters against each other and decide who goes through.'),
    ('game.tournament.about', 'Characters are drawn at random and shown two at a time. Pick the one you prefer, and keep picking until a winner is left.'),
    ('game.tournament.formatLabel', 'Format'),
    ('game.tournament.sizeLabel', 'Characters'),
    ('game.tournament.start', 'Start'),
    ('game.tournament.format.single', 'Single elimination'),
    ('game.tournament.format.double', 'Double elimination'),
    ('game.tournament.format.roundRobin', 'Round robin'),
    ('game.tournament.matches', 'Match {played} of {total}'),
    ('game.tournament.wins', '{wins} wins'),
    ('game.tournament.back', 'Back to setup'),
    ('game.tournament.again', 'Play again'),
    ('game.minesweeper.title', 'Minesweeper'),
    ('game.minesweeper.info', 'Minesweeper played with elemental reactions instead of numbers.'),
    ('game.minesweeper.about', 'One reaction is dangerous each round. A hidden cell becomes a bomb when the revealed cells around it hold both of its elements. Clear the board without turning one over.'),
    ('game.minesweeper.win', 'Cleared - every safe cell turned over.'),
    ('game.minesweeper.lose', 'That one was a bomb.'),
    ('game.minesweeper.revealed', '{revealed} of {total} cells revealed'),
    ('game.minesweeper.newGame', 'New game')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'sk', v.value FROM (VALUES
    ('game.tournament.title', 'Turnaj'),
    ('game.tournament.info', 'Postav svoje obľúbené postavy proti sebe a rozhodni, kto postúpi.'),
    ('game.tournament.about', 'Postavy sa vyžrebujú náhodne a zobrazujú sa po dvoch. Vyber tú, ktorú máš radšej, a pokračuj, kým nezostane víťaz.'),
    ('game.tournament.formatLabel', 'Formát'),
    ('game.tournament.sizeLabel', 'Počet postáv'),
    ('game.tournament.start', 'Začať'),
    ('game.tournament.format.single', 'Jednoduché vyraďovanie'),
    ('game.tournament.format.double', 'Dvojité vyraďovanie'),
    ('game.tournament.format.roundRobin', 'Každý s každým'),
    ('game.tournament.matches', 'Zápas {played} z {total}'),
    ('game.tournament.wins', 'výhry: {wins}'),
    ('game.tournament.back', 'Späť na nastavenie'),
    ('game.tournament.again', 'Hrať znova'),
    ('game.minesweeper.title', 'Míny'),
    ('game.minesweeper.info', 'Míny hrané s elementálnymi reakciami namiesto čísel.'),
    ('game.minesweeper.about', 'Každé kolo je nebezpečná jedna reakcia. Skryté políčko sa stane bombou, keď odkryté políčka okolo neho obsahujú oba jej elementy. Vyčisti pole bez toho, aby si niektorú odkryl.'),
    ('game.minesweeper.win', 'Vyčistené - všetky bezpečné políčka sú odkryté.'),
    ('game.minesweeper.lose', 'To bola bomba.'),
    ('game.minesweeper.revealed', 'Odkryté {revealed} z {total} políčok'),
    ('game.minesweeper.newGame', 'Nová hra')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;
