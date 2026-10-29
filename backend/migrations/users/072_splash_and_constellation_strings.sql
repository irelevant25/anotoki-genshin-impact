-----------------------------------------------------------
-- SPLASH AND CONSTELLATION: THEIR WORDS, GUIDES AND PAGES (2026-10-29)
--
-- The owner's request of 2026-10-29: two more "which character is this?"
-- quizzes, with three tries on every level (the owner's choice), both in
-- the daily draw:
--
--   Splash         the character's wish art as a black silhouette on every
--                  try - its colours would name them at once; Medium starts
--                  from its left half, Hard from its left quarter
--   Constellation  their constellation, a figure of stars on a sky in their
--                  element's colour: in grey first, which hides the element,
--                  and part of it; Easy ends in its own colours, Medium in
--                  grey, Hard in a misleading colour
--
-- (the frontend's quiz-levels.ts; genshin_impact/035 gives them their rows,
-- users/073 their levels in a saved row). These are what their pages say:
-- the quizzes' cards, the difficulty dialog's sentence for each built-in
-- level (written for its classes, which no number can follow - the Quiz
-- levels page warns when a level leaves them behind), the guides behind
-- their question marks (guide_contents, made here as users/050 made the
-- others: content of their own, edited on the Guides page), and a Page
-- access row for each of their four pages - /quizzes/... and /daily/... -
-- as every public page has one (users/066), so that an administrator can
-- switch them in Site settings.
--
-- users/051's shape: a key is its name and its description (the code's;
-- its placeholders named - these have none), each language's string is
-- inserted only where it has none, informal Slovak ("ty"). A guide, a page
-- row too: only where there is none, so a rewording made since stays.
-----------------------------------------------------------

INSERT INTO translation_keys (name, description) VALUES
    ('quiz.splash.title', 'Quiz name: the quiz of the characters'' wish art, shown as a silhouette. No placeholders.'),
    ('quiz.splash.info', 'Quiz card description. No placeholders.'),
    ('quiz.constellation.title', 'Quiz name: the quiz of the characters'' constellations. No placeholders.'),
    ('quiz.constellation.info', 'Quiz card description. No placeholders.'),
    ('guide.splash.title', 'Heading of the splash guide modal'),
    ('guide.constellation.title', 'Heading of the constellation guide modal'),
    ('quiz.levelInfo.splashEasy', 'The difficulty dialog of Splash: what Easy shows, guess by guess - the built-in level''s classes in words, which no number can follow: the admin panel''s Quiz levels page warns when Easy''s steps differ from them. No placeholders.'),
    ('quiz.levelInfo.splashMedium', 'The difficulty dialog of Splash: what Medium shows, guess by guess - the built-in level''s classes in words, which no number can follow: the admin panel''s Quiz levels page warns when Medium''s steps differ from them. No placeholders.'),
    ('quiz.levelInfo.splashHard', 'The difficulty dialog of Splash: what Hard shows, guess by guess - the built-in level''s classes in words, which no number can follow: the admin panel''s Quiz levels page warns when Hard''s steps differ from them. No placeholders.'),
    ('quiz.levelInfo.constellationEasy', 'The difficulty dialog of Constellation: what Easy shows, guess by guess - the built-in level''s classes in words, which no number can follow: the admin panel''s Quiz levels page warns when Easy''s steps differ from them. No placeholders.'),
    ('quiz.levelInfo.constellationMedium', 'The difficulty dialog of Constellation: what Medium shows, guess by guess - the built-in level''s classes in words, which no number can follow: the admin panel''s Quiz levels page warns when Medium''s steps differ from them. No placeholders.'),
    ('quiz.levelInfo.constellationHard', 'The difficulty dialog of Constellation: what Hard shows, guess by guess - the built-in level''s classes in words, which no number can follow: the admin panel''s Quiz levels page warns when Hard''s steps differ from them. No placeholders.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'en', v.value FROM (VALUES
    ('quiz.splash.title', 'Splash'),
    ('quiz.splash.info', 'Test your knowledge by identifying characters from the silhouette of their wish art.'),
    ('quiz.constellation.title', 'Constellation'),
    ('quiz.constellation.info', 'Test your knowledge by identifying characters from their constellation.'),
    ('guide.splash.title', 'About Splash'),
    ('guide.constellation.title', 'About Constellation'),
    ('quiz.levelInfo.splashEasy', 'The whole silhouette on every guess - its colours come only with the answer.'),
    ('quiz.levelInfo.splashMedium', 'Half the silhouette to start, all of it after your first wrong guess.'),
    ('quiz.levelInfo.splashHard', 'A quarter of the silhouette to start, then half, then all of it.'),
    ('quiz.levelInfo.constellationEasy', 'Half the picture in grey to start, then all of it in grey, then in its own colours.'),
    ('quiz.levelInfo.constellationMedium', 'A quarter of the picture in grey to start, then half, then all of it - in grey until the answer.'),
    ('quiz.levelInfo.constellationHard', 'A quarter of the picture in grey to start, then half, then all of it in a misleading colour - another element''s.')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'sk', v.value FROM (VALUES
    ('quiz.splash.title', 'Splash'),
    ('quiz.splash.info', 'Over si znalosti a spoznaj postavy podľa siluety ich splash artu.'),
    ('quiz.constellation.title', 'Konštelácia'),
    ('quiz.constellation.info', 'Over si znalosti a spoznaj postavy podľa ich konštelácie.'),
    ('guide.splash.title', 'O kvíze Splash'),
    ('guide.constellation.title', 'O konštelácii'),
    ('quiz.levelInfo.splashEasy', 'Pri každom tipe celá silueta - farby prídu až s odpoveďou.'),
    ('quiz.levelInfo.splashMedium', 'Na začiatok polovica siluety, po prvom zlom tipe celá.'),
    ('quiz.levelInfo.splashHard', 'Na začiatok štvrtina siluety, potom polovica a potom celá.'),
    ('quiz.levelInfo.constellationEasy', 'Na začiatok polovica obrázka v sivej, potom celý v sivej a potom vo vlastných farbách.'),
    ('quiz.levelInfo.constellationMedium', 'Na začiatok štvrtina obrázka v sivej, potom polovica a potom celý - sivý až do odpovede.'),
    ('quiz.levelInfo.constellationHard', 'Na začiatok štvrtina obrázka v sivej, potom polovica a potom celý v zavádzajúcej farbe - inej, než má jej živel.')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

-----------------------------------------------------------
-- THE GUIDES
--
-- In the others' words and shape (users/051): what the quiz is, then how to
-- play it, a step a line. Markup the allow-list keeps (api/rich_text.php).
-----------------------------------------------------------

INSERT INTO guide_contents (guide, language_code, html) VALUES
    ('splash', 'en', '<h4>What is the Splash quiz?</h4>
<p>Name the character from the silhouette of their wish art - the splash you see when you pull them.</p>
<h4>How to play</h4>
<ol>
<li>The wish art is shown as a silhouette: its outline, without a single colour.</li>
<li>Type a character name or pick one from the list.</li>
<li>You get up to three guesses.</li>
<li>On Medium and Hard only part of the silhouette shows at first, and every wrong guess shows more. The colours come only with the answer.</li>
</ol>'),
    ('splash', 'sk', '<h4>Čo je kvíz Splash?</h4>
<p>Pomenuj postavu podľa siluety jej splash artu - obrázka, ktorý uvidíš, keď ju získaš v priani.</p>
<h4>Ako sa hrá</h4>
<ol>
<li>Splash art sa zobrazí ako silueta: len jeho obrys, bez jedinej farby.</li>
<li>Napíš meno postavy alebo ho vyber zo zoznamu.</li>
<li>Máš tri pokusy.</li>
<li>Na strednej a ťažkej úrovni je najprv vidieť len časť siluety a po každom zlom tipe viac. Farby prídu až s odpoveďou.</li>
</ol>'),
    ('constellation', 'en', '<h4>What is the Constellation quiz?</h4>
<p>Name the character from their constellation - the figure of stars on a sky in the colour of their element.</p>
<h4>How to play</h4>
<ol>
<li>Part of a constellation is shown, in grey.</li>
<li>Type a character name or pick one from the list.</li>
<li>You get up to three guesses.</li>
<li>Every wrong guess shows more of it. Mind its colour: on Hard your last look is in another element''s.</li>
</ol>'),
    ('constellation', 'sk', '<h4>Čo je kvíz Konštelácia?</h4>
<p>Pomenuj postavu podľa jej konštelácie - obrazca z hviezd na oblohe vo farbe jej živlu.</p>
<h4>Ako sa hrá</h4>
<ol>
<li>Zobrazí sa časť konštelácie, v sivej.</li>
<li>Napíš meno postavy alebo ho vyber zo zoznamu.</li>
<li>Máš tri pokusy.</li>
<li>Po každom zlom tipe uvidíš viac. Pozor na farbu: na ťažkej úrovni je tvoj posledný pohľad vo farbe iného živlu.</li>
</ol>')
ON CONFLICT (guide, language_code) DO NOTHING;

-----------------------------------------------------------
-- THEIR PAGES IN PAGE ACCESS
--
-- Anybody's, as the other quizzes' are, each beside its kind: the daily's
-- after /daily/voice (26), the quizzes' after /quizzes/voice (36).
-----------------------------------------------------------

INSERT INTO anotoki_page_access (path, visibility, blocked, api_paths, sort_order)
SELECT v.path, 'PUBLIC', FALSE, '{}'::TEXT[], v.sort_order
  FROM (VALUES
      ('/daily/splash', 27),
      ('/daily/constellation', 28),
      ('/quizzes/splash', 37),
      ('/quizzes/constellation', 38)
  ) AS v(path, sort_order)
 WHERE NOT EXISTS (SELECT 1 FROM anotoki_page_access p WHERE p.path = v.path);

-- Every key above exists with both languages' strings, both guides in both
-- languages, and each page with its row - whichever of them this file wrote:
-- one there already without a language, or never written, would otherwise go
-- unnoticed until a page showed a key's name or an empty guide.
DO $$
DECLARE
    missing TEXT;
BEGIN
    SELECT string_agg(k.name, ', ' ORDER BY k.name) INTO missing
      FROM (VALUES
          ('quiz.splash.title'),
          ('quiz.splash.info'),
          ('quiz.constellation.title'),
          ('quiz.constellation.info'),
          ('guide.splash.title'),
          ('guide.constellation.title'),
          ('quiz.levelInfo.splashEasy'),
          ('quiz.levelInfo.splashMedium'),
          ('quiz.levelInfo.splashHard'),
          ('quiz.levelInfo.constellationEasy'),
          ('quiz.levelInfo.constellationMedium'),
          ('quiz.levelInfo.constellationHard')
      ) AS k(name)
     WHERE NOT EXISTS (SELECT 1 FROM translation_keys tk WHERE tk.name = k.name)
        OR NOT EXISTS (SELECT 1 FROM translations t WHERE t.key_name = k.name AND t.language_code = 'en')
        OR NOT EXISTS (SELECT 1 FROM translations t WHERE t.key_name = k.name AND t.language_code = 'sk');
    IF missing IS NOT NULL THEN
        RAISE EXCEPTION 'users/072: keys without an English and a Slovak string: %', missing;
    END IF;

    SELECT string_agg(g.guide || '/' || g.language_code, ', ' ORDER BY g.guide, g.language_code) INTO missing
      FROM (VALUES ('splash', 'en'), ('splash', 'sk'), ('constellation', 'en'), ('constellation', 'sk')) AS g(guide, language_code)
     WHERE NOT EXISTS (SELECT 1 FROM guide_contents c WHERE c.guide = g.guide AND c.language_code = g.language_code);
    IF missing IS NOT NULL THEN
        RAISE EXCEPTION 'users/072: guides missing: %', missing;
    END IF;

    SELECT string_agg(p.path, ', ' ORDER BY p.path) INTO missing
      FROM (VALUES ('/daily/splash'), ('/daily/constellation'), ('/quizzes/splash'), ('/quizzes/constellation')) AS p(path)
     WHERE NOT EXISTS (SELECT 1 FROM anotoki_page_access a WHERE a.path = p.path);
    IF missing IS NOT NULL THEN
        RAISE EXCEPTION 'users/072: pages without a Page access row: %', missing;
    END IF;
END $$;
