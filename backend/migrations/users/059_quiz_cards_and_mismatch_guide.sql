-----------------------------------------------------------
-- THE QUIZZES' CARDS AND MISMATCH'S GUIDE, TRUE AT EVERY LEVEL
--
-- Since users/058 the player chooses each quiz's difficulty, and Mismatch
-- shows three, four or five characters by it (frontend quiz-levels.ts). Its
-- card on the quizzes list (quiz.mismatch.info) and its guide (guide_contents,
-- 'mismatch') still said four, as users/005 and users/028 wrote them: they say
-- three to five now, in English and in Slovak. The owner's request of
-- 2026-10-19.
--
-- The six cards' Slovak said "vy" (users/005's "Overte si"), where the site's
-- other words - the guides beside them among them - say "ty": they say "ty"
-- now, so that Mismatch's, reworded, does not stand alone among them.
--
-- Each string only while it is still those migrations' word for word: a
-- rewording the owner made in the admin panel stands. No key is added or
-- taken away.
-----------------------------------------------------------

UPDATE translations t
   SET value = v.new_value,
       updated_at = CURRENT_TIMESTAMP
  FROM (VALUES
    ('quiz.mismatch.info', 'en',
     'Test your character knowledge by finding the "odd one out" among four character icons.',
     'Test your character knowledge by finding the "odd one out" among three to five character icons.'),
    ('quiz.mismatch.info', 'sk',
     'Overte si znalosti postáv a nájdite tú, ktorá medzi štyri ikony nepatrí.',
     'Over si znalosti postáv a nájdi tú, ktorá medzi tri až päť ikon nepatrí.'),
    ('quiz.banners.info', 'sk',
     'Overte si znalosti a spoznajte postavy podľa ich vizitiek/bannerov.',
     'Over si znalosti a spoznaj postavy podľa ich vizitiek/bannerov.'),
    ('quiz.pixelate.info', 'sk',
     'Skúste spoznať postavy podľa silno pixelizovaných portrétov.',
     'Skús spoznať postavy podľa silno pixelizovaných portrétov.'),
    ('quiz.music.info', 'sk',
     'Overte si hudobné znalosti a spoznajte postavy podľa ich ukážkovej hudby.',
     'Over si hudobné znalosti a spoznaj postavy podľa ich ukážkovej hudby.'),
    ('quiz.dish.info', 'sk',
     'Overte si znalosti a spoznajte postavy podľa ich jedla.',
     'Over si znalosti a spoznaj postavy podľa ich jedla.'),
    ('quiz.voice.info', 'sk',
     'Overte si znalosti a spoznajte postavy podľa ich hlasu.',
     'Over si znalosti a spoznaj postavy podľa ich hlasu.')
  ) AS v(key_name, language_code, old_value, new_value)
 WHERE t.key_name = v.key_name
   AND t.language_code = v.language_code
   AND t.value = v.old_value;

UPDATE translation_keys
   SET description = 'Quiz card description. How many characters Mismatch shows depends on the difficulty chosen - three, four or five - so the card names no single number. No placeholders.'
 WHERE name = 'quiz.mismatch.info';

-----------------------------------------------------------
-- MISMATCH'S GUIDE
--
-- In English and in Slovak, each only while it is still users/028's word for
-- word - compared without carriage returns: its text has line breaks, and a
-- file's line endings are those of the checkout it was applied from. Each
-- text is said once, below, for the change and for its proof.
-----------------------------------------------------------

DO $$
DECLARE
    old_en CONSTANT TEXT := '<h4>What is the Mismatch quiz?</h4>
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
<p>The category is never named, and the four are picked at random. Working out what the three have in common is the quiz.</p>';
    new_en CONSTANT TEXT := '<h4>What is the Mismatch quiz?</h4>
<p>Three to five characters, all but one of them with something in common. Find the one that does not belong.</p>
<h4>How to play</h4>
<ol>
<li>Three, four or five character icons are shown - more on a harder difficulty.</li>
<li>All but one of them share an element, a weapon type or a region.</li>
<li>Click the one that is different.</li>
<li>One attempt per question.</li>
</ol>
<h4>What they might share</h4>
<ul>
<li><span class="tag">Element</span> All but one share an element.</li>
<li><span class="tag">Weapon</span> All but one use the same kind of weapon.</li>
<li><span class="tag">Region</span> All but one come from the same place.</li>
</ul>
<p>The category is never named, and the characters are picked at random. Working out what the others have in common is the quiz.</p>';
    old_sk CONSTANT TEXT := '<h4>Čo je kvíz Votrelec?</h4>
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
<p>Kategória sa nikdy nepovie a štvorica je náhodná. Prísť na to, čo tie tri spája, je celý kvíz.</p>';
    new_sk CONSTANT TEXT := '<h4>Čo je kvíz Votrelec?</h4>
<p>Tri až päť postáv a všetky okrem jednej niečo spája. Nájdi tú, ktorá tam nepatrí.</p>
<h4>Ako sa hrá</h4>
<ol>
<li>Zobrazia sa ikony troch, štyroch alebo piatich postáv - na ťažšej obtiažnosti viac.</li>
<li>Všetky okrem jednej zdieľajú živel, typ zbrane alebo región.</li>
<li>Klikni na tú, ktorá je iná.</li>
<li>Jeden pokus na otázku.</li>
</ol>
<h4>Čo ich môže spájať</h4>
<ul>
<li><span class="tag">Živel</span> Všetky okrem jednej majú rovnaký živel.</li>
<li><span class="tag">Zbraň</span> Všetky okrem jednej používajú rovnaký druh zbrane.</li>
<li><span class="tag">Región</span> Všetky okrem jednej pochádzajú z rovnakého miesta.</li>
</ul>
<p>Kategória sa nikdy nepovie a postavy sú náhodné. Prísť na to, čo ostatné spája, je celý kvíz.</p>';
BEGIN
    UPDATE guide_contents
       SET html = CASE language_code WHEN 'en' THEN new_en ELSE new_sk END,
           updated_at = CURRENT_TIMESTAMP
     WHERE guide = 'mismatch'
       AND ((language_code = 'en' AND replace(html, chr(13), '') = replace(old_en, chr(13), ''))
         OR (language_code = 'sk' AND replace(html, chr(13), '') = replace(old_sk, chr(13), '')));

    IF EXISTS (
        SELECT 1
          FROM guide_contents
         WHERE guide = 'mismatch'
           AND ((language_code = 'en' AND replace(html, chr(13), '') = replace(old_en, chr(13), ''))
             OR (language_code = 'sk' AND replace(html, chr(13), '') = replace(old_sk, chr(13), '')))
    ) THEN
        RAISE EXCEPTION 'users/059: Mismatch''s guide still says users/028''s four characters';
    END IF;
END $$;

-----------------------------------------------------------
-- PROVE IT
--
-- No card still says what users/005 said in it, in either language; the keys
-- the cards and the guide's dialog read are still here.
-----------------------------------------------------------

DO $$
DECLARE
    stale TEXT;
    lost TEXT;
BEGIN
    SELECT string_agg(t.key_name || '|' || t.language_code, ', ' ORDER BY t.key_name, t.language_code) INTO stale
      FROM translations t
     WHERE (t.key_name, t.language_code, t.value) IN (
          ('quiz.mismatch.info', 'en', 'Test your character knowledge by finding the "odd one out" among four character icons.'),
          ('quiz.mismatch.info', 'sk', 'Overte si znalosti postáv a nájdite tú, ktorá medzi štyri ikony nepatrí.'),
          ('quiz.banners.info', 'sk', 'Overte si znalosti a spoznajte postavy podľa ich vizitiek/bannerov.'),
          ('quiz.pixelate.info', 'sk', 'Skúste spoznať postavy podľa silno pixelizovaných portrétov.'),
          ('quiz.music.info', 'sk', 'Overte si hudobné znalosti a spoznajte postavy podľa ich ukážkovej hudby.'),
          ('quiz.dish.info', 'sk', 'Overte si znalosti a spoznajte postavy podľa ich jedla.'),
          ('quiz.voice.info', 'sk', 'Overte si znalosti a spoznajte postavy podľa ich hlasu.')
     );
    IF stale IS NOT NULL THEN
        RAISE EXCEPTION 'users/059: cards still in users/005''s words: %', stale;
    END IF;

    SELECT string_agg(k.name, ', ' ORDER BY k.name) INTO lost
      FROM (VALUES
          ('quiz.banners.info'), ('quiz.pixelate.info'), ('quiz.mismatch.info'), ('quiz.music.info'), ('quiz.dish.info'), ('quiz.voice.info'),
          ('guide.mismatch.title')
      ) AS k(name)
     WHERE NOT EXISTS (SELECT 1 FROM translation_keys tk WHERE tk.name = k.name);
    IF lost IS NOT NULL THEN
        RAISE EXCEPTION 'users/059: keys the cards and the guide read are gone: %', lost;
    END IF;
END $$;
