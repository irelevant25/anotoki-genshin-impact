-----------------------------------------------------------
-- MISMATCH'S NEW SETS, THE KEYBOARD, AND VOICE'S FOUR LANGUAGES
--
-- The owner's requests of 2026-10-29:
--
--   - Mismatch's levels say what their sets can share (users/069: each
--     level's `properties` - Easy an element, a weapon type or a region,
--     Medium the version too, Hard a region, a version or an affiliation) and
--     how much the odd one out looks like the rest (`blend`): more characters
--     alone made no level harder. New: the five properties' names
--     (quiz.mismatch.property.*), the difficulty dialog's sentence that names
--     a level's (quiz.levelInfo.mismatchShared), a version said as one in the
--     sentence after a pick (quiz.mismatch.eraValue), and the line saying
--     which keys play it (quiz.mismatch.keys) - the arrows or A and D, Enter.
--     The dialog's introduction and the guide say what changes now.
--   - Voice plays its line in English, Japanese, Chinese or Korean, the
--     player's choice (quiz.voice.language, .languages.*), and says so when a
--     line has no recording in the one chosen (quiz.voice.languageMissing).
--     The choice is kept in this browser beside the difficulty (app_data), so
--     the Privacy page's line for app_data says it too
--     (legal.storage.browserGames.purpose; SITE_LEGAL_UPDATED, the frontend's
--     legal-facts.ts, moves with it).
--
-- A new string only where it has none (ON CONFLICT DO NOTHING), informal
-- Slovak ("ty"), as users/051 does; a string and the guide reworded only while
-- they are still users/058's and users/059's word for word, so a rewording the
-- owner made in the admin panel stands.
-----------------------------------------------------------

INSERT INTO translation_keys (name, description) VALUES
    ('quiz.mismatch.property.element', 'What a Mismatch set can share, as the difficulty dialog names it in a list (quiz.levelInfo.mismatchShared): the characters'' element. Lower case, a word in a sentence. No placeholders.'),
    ('quiz.mismatch.property.weapon', 'What a Mismatch set can share, as the difficulty dialog names it in a list (quiz.levelInfo.mismatchShared): the kind of weapon the characters use. Lower case, a word in a sentence. No placeholders.'),
    ('quiz.mismatch.property.region', 'What a Mismatch set can share, as the difficulty dialog names it in a list (quiz.levelInfo.mismatchShared): the region the characters come from. Lower case, a word in a sentence. No placeholders.'),
    ('quiz.mismatch.property.era', 'What a Mismatch set can share, as the difficulty dialog names it in a list (quiz.levelInfo.mismatchShared): the version the characters came out in, by its first number (1.x, 2.x...; Luna for Luna I to VIII). Lower case, a word in a sentence. No placeholders.'),
    ('quiz.mismatch.property.affiliation', 'What a Mismatch set can share, as the difficulty dialog names it in a list (quiz.levelInfo.mismatchShared): a group the characters belong to (the Knights of Favonius, the Fatui...). Lower case, a word in a sentence. No placeholders.'),
    ('quiz.levelInfo.mismatchShared', 'The difficulty dialog of Mismatch, after quiz.levelInfo.mismatch: what all but one of a level''s characters can share. {properties} is the level''s list of quiz.mismatch.property.* joined as the reader''s language joins a list of choices ("element, weapon type or region").'),
    ('quiz.mismatch.eraValue', 'After a Mismatch pick, what the others shared when it is a version, following quiz.mismatch.right or quiz.mismatch.wrong ("...The others all shared"): {era} is the version''s first number and .x ("1.x"), or Luna for Luna I to VIII.'),
    ('quiz.mismatch.keys', 'Under the characters of a Mismatch question, on a computer: which keys play it - the arrow keys or A and D move between the characters, Enter picks the one chosen (and Enter again moves on). No placeholders.'),
    ('quiz.voice.language', 'The Voice quiz, beside its player: the name of the choice of the recording''s language. No placeholders.'),
    ('quiz.voice.languages.english', 'The Voice quiz''s choice of the recording''s language: English. No placeholders.'),
    ('quiz.voice.languages.japanese', 'The Voice quiz''s choice of the recording''s language: Japanese. No placeholders.'),
    ('quiz.voice.languages.chinese', 'The Voice quiz''s choice of the recording''s language: Chinese. No placeholders.'),
    ('quiz.voice.languages.korean', 'The Voice quiz''s choice of the recording''s language: Korean. No placeholders.'),
    ('quiz.voice.languageMissing', 'The Voice quiz, under the choice of the recording''s language, when the line has no recording in the one chosen and plays the English one. {language} is the chosen language''s name (quiz.voice.languages.*).')
ON CONFLICT (name) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'en', v.value FROM (VALUES
    ('quiz.mismatch.property.element', 'element'),
    ('quiz.mismatch.property.weapon', 'weapon type'),
    ('quiz.mismatch.property.region', 'region'),
    ('quiz.mismatch.property.era', 'version'),
    ('quiz.mismatch.property.affiliation', 'affiliation'),
    ('quiz.levelInfo.mismatchShared', 'The others share their {properties}.'),
    ('quiz.mismatch.eraValue', 'version {era}'),
    ('quiz.mismatch.keys', 'Choose with the arrow keys or A and D, pick with Enter.'),
    ('quiz.voice.language', 'Language of the recording'),
    ('quiz.voice.languages.english', 'English'),
    ('quiz.voice.languages.japanese', 'Japanese'),
    ('quiz.voice.languages.chinese', 'Chinese'),
    ('quiz.voice.languages.korean', 'Korean'),
    ('quiz.voice.languageMissing', 'This line has no {language} recording, so it plays in English.')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'sk', v.value FROM (VALUES
    ('quiz.mismatch.property.element', 'živel'),
    ('quiz.mismatch.property.weapon', 'typ zbrane'),
    ('quiz.mismatch.property.region', 'región'),
    ('quiz.mismatch.property.era', 'verzia'),
    ('quiz.mismatch.property.affiliation', 'príslušnosť'),
    ('quiz.levelInfo.mismatchShared', 'Ostatných spája {properties}.'),
    ('quiz.mismatch.eraValue', 'verziu {era}'),
    ('quiz.mismatch.keys', 'Vyberaj šípkami alebo klávesmi A a D, potvrď klávesom Enter.'),
    ('quiz.voice.language', 'Jazyk nahrávky'),
    ('quiz.voice.languages.english', 'Angličtina'),
    ('quiz.voice.languages.japanese', 'Japončina'),
    ('quiz.voice.languages.chinese', 'Čínština'),
    ('quiz.voice.languages.korean', 'Kórejčina'),
    ('quiz.voice.languageMissing', 'Táto replika nemá nahrávku ({language}), hrá sa anglická.')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

-----------------------------------------------------------
-- THE DIFFICULTY DIALOG'S INTRODUCTION, AND THE PRIVACY PAGE'S APP_DATA
--
-- The introduction said that only the count changes from one level to the
-- next; the Privacy page's line for app_data named the games and the
-- difficulty, and this browser keeps Voice's language there now too.
-----------------------------------------------------------

UPDATE translations t
   SET value = v.new_value,
       updated_at = CURRENT_TIMESTAMP
  FROM (VALUES
    ('quiz.difficulty.introMismatch', 'en',
     'One pick a question on every level - what changes is how many characters you choose from.',
     'One pick a question on every level - what changes is how many characters you choose from, what they can share, and how much the odd one out looks like the rest.'),
    ('quiz.difficulty.introMismatch', 'sk',
     'Na každej úrovni máš na otázku jeden tip - mení sa, z koľkých postáv vyberáš.',
     'Na každej úrovni máš na otázku jeden tip - mení sa, z koľkých postáv vyberáš, čo ich môže spájať a ako veľmi sa tá nepatriaca podobá na ostatné.'),
    ('legal.storage.browserGames.purpose', 'en',
     'The quizzes'' games this browser keeps by itself while the site keeps none for you (before your first answer, or while it takes no more players without an account), and the difficulty you chose.',
     'The quizzes'' games this browser keeps by itself while the site keeps none for you (before your first answer, or while it takes no more players without an account), the difficulty you chose, and the language you chose for the Voice quiz''s recordings.'),
    ('legal.storage.browserGames.purpose', 'sk',
     'Hry z kvízov, ktoré si tento prehliadač uchováva sám, kým ich pre teba neuchováva stránka (pred tvojou prvou odpoveďou alebo keď už neprijíma ďalších hráčov bez účtu), a obťažnosť, ktorú si zvolíš.',
     'Hry z kvízov, ktoré si tento prehliadač uchováva sám, kým ich pre teba neuchováva stránka (pred tvojou prvou odpoveďou alebo keď už neprijíma ďalších hráčov bez účtu), obťažnosť, ktorú si zvolíš, a jazyk nahrávok, ktorý si zvolíš v kvíze Hlas.')
  ) AS v(key_name, language_code, old_value, new_value)
 WHERE t.key_name = v.key_name
   AND t.language_code = v.language_code
   AND t.value = v.old_value;

UPDATE translation_keys
   SET description = 'Mismatch''s difficulty dialog, above the levels: what changes from one level to the next - how many characters, what they can share, how much the odd one out looks like the rest; Mismatch has no tries, one pick ends a question. No placeholders.'
 WHERE name = 'quiz.difficulty.introMismatch';

UPDATE translation_keys
   SET description = 'Privacy, cookies and storage: app_data (shared/state-manager.service.ts) - the games the browser keeps by itself while the server keeps none for it, the difficulty chosen, and the language the Voice quiz''s recordings play in.'
 WHERE name = 'legal.storage.browserGames.purpose';

-----------------------------------------------------------
-- MISMATCH'S GUIDE
--
-- In English and in Slovak, each only while it is still users/059's word for
-- word - compared without carriage returns, as users/059 compared users/028's.
-- Each text is said once, below, for the change and for its proof.
-----------------------------------------------------------

DO $$
DECLARE
    old_en CONSTANT TEXT := '<h4>What is the Mismatch quiz?</h4>
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
    new_en CONSTANT TEXT := '<h4>What is the Mismatch quiz?</h4>
<p>Three to five characters, all but one of them with something in common. Find the one that does not belong.</p>
<h4>How to play</h4>
<ol>
<li>Three, four or five character icons are shown - more on a harder difficulty.</li>
<li>All but one of them share something: on Easy an element, a weapon type or a region; on Medium the version they came out in as well; on Hard a region, a version or an affiliation.</li>
<li>Click the one that is different - or move between them with the arrow keys (or A and D) and press Enter.</li>
<li>One attempt per question.</li>
</ol>
<h4>What they might share</h4>
<ul>
<li><span class="tag">Element</span> All but one share an element.</li>
<li><span class="tag">Weapon</span> All but one use the same kind of weapon.</li>
<li><span class="tag">Region</span> All but one come from the same place.</li>
<li><span class="tag">Version</span> All but one came out in the same version, by its first number: 1.x, 2.x and so on - Luna for Luna I to VIII.</li>
<li><span class="tag">Affiliation</span> All but one belong to the same group: the Knights of Favonius, the Fatui, the Adepti... Somebody who used to belong, or is tied to it some other way, is never one of them, nor the odd one out.</li>
</ul>
<p>The category is never named, and the characters are picked at random - though on the harder levels the odd one out is picked to look like the rest. Working out what the others have in common is the quiz.</p>';
    old_sk CONSTANT TEXT := '<h4>Čo je kvíz Votrelec?</h4>
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
    new_sk CONSTANT TEXT := '<h4>Čo je kvíz Votrelec?</h4>
<p>Tri až päť postáv a všetky okrem jednej niečo spája. Nájdi tú, ktorá tam nepatrí.</p>
<h4>Ako sa hrá</h4>
<ol>
<li>Zobrazia sa ikony troch, štyroch alebo piatich postáv - na ťažšej obtiažnosti viac.</li>
<li>Všetky okrem jednej niečo spája: na ľahkej živel, typ zbrane alebo región; na strednej aj verzia, v ktorej vyšli; na ťažkej región, verzia alebo príslušnosť.</li>
<li>Klikni na tú, ktorá je iná - alebo sa medzi nimi pohybuj šípkami (či klávesmi A a D) a stlač Enter.</li>
<li>Jeden pokus na otázku.</li>
</ol>
<h4>Čo ich môže spájať</h4>
<ul>
<li><span class="tag">Živel</span> Všetky okrem jednej majú rovnaký živel.</li>
<li><span class="tag">Zbraň</span> Všetky okrem jednej používajú rovnaký druh zbrane.</li>
<li><span class="tag">Región</span> Všetky okrem jednej pochádzajú z rovnakého miesta.</li>
<li><span class="tag">Verzia</span> Všetky okrem jednej vyšli v rovnakej verzii, podľa jej prvého čísla: 1.x, 2.x a tak ďalej - Luna pre Luna I až VIII.</li>
<li><span class="tag">Príslušnosť</span> Všetky okrem jednej patria do rovnakej skupiny: Knights of Favonius, Fatui, Adepti... Kto do nej kedysi patril alebo je s ňou spätý inak, nikdy nie je medzi nimi ani votrelcom.</li>
</ul>
<p>Kategória sa nikdy nepovie a postavy sú náhodné - na ťažších úrovniach sa však votrelec vyberá tak, aby sa podobal na ostatné. Prísť na to, čo ostatné spája, je celý kvíz.</p>';
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
        RAISE EXCEPTION 'users/070: Mismatch''s guide still says users/059''s element, weapon type or region alone';
    END IF;
END $$;

-----------------------------------------------------------
-- PROVE IT
--
-- Every new key reads in both languages, and the introduction no longer says
-- users/058's words.
-----------------------------------------------------------

DO $$
DECLARE
    missing TEXT;
BEGIN
    SELECT string_agg(k.name, ', ' ORDER BY k.name) INTO missing
      FROM (VALUES
          ('quiz.mismatch.property.element'), ('quiz.mismatch.property.weapon'), ('quiz.mismatch.property.region'),
          ('quiz.mismatch.property.era'), ('quiz.mismatch.property.affiliation'), ('quiz.levelInfo.mismatchShared'),
          ('quiz.mismatch.eraValue'), ('quiz.mismatch.keys'), ('quiz.voice.language'), ('quiz.voice.languages.english'),
          ('quiz.voice.languages.japanese'), ('quiz.voice.languages.chinese'), ('quiz.voice.languages.korean'),
          ('quiz.voice.languageMissing')
      ) AS k(name)
     WHERE NOT EXISTS (SELECT 1 FROM translation_keys tk WHERE tk.name = k.name)
        OR NOT EXISTS (SELECT 1 FROM translations t WHERE t.key_name = k.name AND t.language_code = 'en')
        OR NOT EXISTS (SELECT 1 FROM translations t WHERE t.key_name = k.name AND t.language_code = 'sk');
    IF missing IS NOT NULL THEN
        RAISE EXCEPTION 'users/070: keys without an English and a Slovak string: %', missing;
    END IF;

    IF EXISTS (
        SELECT 1 FROM translations
         WHERE key_name = 'quiz.difficulty.introMismatch'
           AND value IN ('One pick a question on every level - what changes is how many characters you choose from.',
                         'Na každej úrovni máš na otázku jeden tip - mení sa, z koľkých postáv vyberáš.')
    ) THEN
        RAISE EXCEPTION 'users/070: Mismatch''s difficulty dialog still says only the count changes';
    END IF;

    IF EXISTS (
        SELECT 1 FROM translations
         WHERE key_name = 'legal.storage.browserGames.purpose'
           AND value IN ('The quizzes'' games this browser keeps by itself while the site keeps none for you (before your first answer, or while it takes no more players without an account), and the difficulty you chose.',
                         'Hry z kvízov, ktoré si tento prehliadač uchováva sám, kým ich pre teba neuchováva stránka (pred tvojou prvou odpoveďou alebo keď už neprijíma ďalších hráčov bez účtu), a obťažnosť, ktorú si zvolíš.')
    ) THEN
        RAISE EXCEPTION 'users/070: the Privacy page''s line for app_data still leaves out Voice''s language';
    END IF;
END $$;
