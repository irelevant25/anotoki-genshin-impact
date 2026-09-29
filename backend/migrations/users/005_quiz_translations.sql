-----------------------------------------------------------
-- QUIZ AND FOOTER STRINGS
--
-- The rest of what the site says out loud. The quiz names are translated
-- rather than left as they are: they are descriptions of a game, not titles
-- of one, and a Slovak reader has no reason to meet six English words on the
-- way in.
--
-- `php translations.php --status` is what found these. It reads the Angular
-- sources for keys and reports any the database does not have, which is the
-- check that stops a new string shipping as a raw key.
-----------------------------------------------------------

INSERT INTO translation_keys (name, description) VALUES
    ('footer.github', 'Bottom bar item. A proper noun, so every language spells it the same'),
    ('quiz.banners.title', 'Quiz name'),
    ('quiz.banners.about', 'Help tooltip on the quiz card'),
    ('quiz.banners.info', 'Quiz card description'),
    ('quiz.pixelate.title', 'Quiz name'),
    ('quiz.pixelate.about', 'Help tooltip on the quiz card'),
    ('quiz.pixelate.info', 'Quiz card description'),
    ('quiz.mismatch.title', 'Quiz name'),
    ('quiz.mismatch.about', 'Help tooltip on the quiz card'),
    ('quiz.mismatch.info', 'Quiz card description'),
    ('quiz.music.title', 'Quiz name'),
    ('quiz.music.about', 'Help tooltip on the quiz card'),
    ('quiz.music.info', 'Quiz card description'),
    ('quiz.dish.title', 'Quiz name'),
    ('quiz.dish.about', 'Help tooltip on the quiz card'),
    ('quiz.dish.info', 'Quiz card description'),
    ('quiz.voice.title', 'Quiz name'),
    ('quiz.voice.about', 'Help tooltip on the quiz card'),
    ('quiz.voice.info', 'Quiz card description'),
    ('quiz.searchCharacter', 'Placeholder of the answer box'),
    ('quiz.tries', 'Label before the used/allowed try count'),
    ('quiz.next', 'Button that moves to the next question')
ON CONFLICT (name) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'en', v.value FROM (VALUES
    ('footer.github', 'GitHub'),
    ('quiz.banners.title', 'Banners'),
    ('quiz.banners.about', 'About Banners'),
    ('quiz.banners.info', 'Test your knowledge by identifying characters from their namecards/banners.'),
    ('quiz.pixelate.title', 'Pixelate'),
    ('quiz.pixelate.about', 'About Characters Pixelate'),
    ('quiz.pixelate.info', 'Challenge yourself to identify characters from their heavily pixelated portraits.'),
    ('quiz.mismatch.title', 'Mismatch'),
    ('quiz.mismatch.about', 'About Characters Mismatch'),
    ('quiz.mismatch.info', 'Test your character knowledge by finding the "odd one out" among four character icons.'),
    ('quiz.music.title', 'Music'),
    ('quiz.music.about', 'About Music Quiz'),
    ('quiz.music.info', 'Test your music knowledge by identifying characters from their demo music.'),
    ('quiz.dish.title', 'Dish'),
    ('quiz.dish.about', 'About Dish'),
    ('quiz.dish.info', 'Test your knowledge by identifying characters from their dish.'),
    ('quiz.voice.title', 'Voice'),
    ('quiz.voice.about', 'About Voice Quiz'),
    ('quiz.voice.info', 'Test your voice knowledge by identifying characters from their voice.'),
    ('quiz.searchCharacter', 'Search character...'),
    ('quiz.tries', 'Tries:'),
    ('quiz.next', 'Next')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'sk', v.value FROM (VALUES
    ('footer.github', 'GitHub'),
    ('quiz.banners.title', 'Bannery'),
    ('quiz.banners.about', 'O kvíze Bannery'),
    ('quiz.banners.info', 'Overte si znalosti a spoznajte postavy podľa ich vizitiek/bannerov.'),
    ('quiz.pixelate.title', 'Pixelácia'),
    ('quiz.pixelate.about', 'O kvíze Pixelácia'),
    ('quiz.pixelate.info', 'Skúste spoznať postavy podľa silno pixelizovaných portrétov.'),
    ('quiz.mismatch.title', 'Nesúlad'),
    ('quiz.mismatch.about', 'O kvíze Nesúlad'),
    ('quiz.mismatch.info', 'Overte si znalosti postáv a nájdite tú, ktorá medzi štyri ikony nepatrí.'),
    ('quiz.music.title', 'Hudba'),
    ('quiz.music.about', 'O kvíze Hudba'),
    ('quiz.music.info', 'Overte si hudobné znalosti a spoznajte postavy podľa ich ukážkovej hudby.'),
    ('quiz.dish.title', 'Jedlo'),
    ('quiz.dish.about', 'O kvíze Jedlo'),
    ('quiz.dish.info', 'Overte si znalosti a spoznajte postavy podľa ich jedla.'),
    ('quiz.voice.title', 'Hlas'),
    ('quiz.voice.about', 'O kvíze Hlas'),
    ('quiz.voice.info', 'Overte si znalosti a spoznajte postavy podľa ich hlasu.'),
    ('quiz.searchCharacter', 'Hľadať postavu...'),
    ('quiz.tries', 'Pokusy:'),
    ('quiz.next', 'Ďalej')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;
