-----------------------------------------------------------
-- WORDS MADE TRUE, BEFORE THE OWNER'S USABILITY TEST
--
-- The owner's answers of 2026-10-19 and 2026-10-20, English and informal
-- Slovak ("ty"):
--
--   - The Quizzes and Daily guides said every quiz and every question is
--     timed. Nothing is: the dailies are one go a day, the day turning at
--     00:00 UTC as the Daily guide already said, and the timer idea is
--     dropped. Since users/058 the player chooses a quiz's difficulty, and the
--     daily's is the same for everybody: the guides say so.
--   - The Slovak guides named Pixelate "Pixely" and Mismatch "Votrelec" -
--     their titles, their headings and the Quizzes and Daily guides' lists -
--     where the cards say Pixelácia and Nesúlad: the cards' names now.
--   - The Tournament's guides list the setup in the page's order - the
--     format, how many characters, Start; the Slovak one names the button
--     Začať and the formats as the dropdown does.
--   - The Database page's cards have no help any more: the tooltip's
--     database.*.about go. Their Slovak says "ty" (users/008's said "vy").
--   - The wallpapers' window told people to click a Background menu item that
--     is gone: one sentence now (backgrounds.whatText), its how-to, notes and
--     headings gone.
--   - The account panel's Slovak says "ty": five of the site's own keys. The
--     anotoki library's words in it are the library's.
--   - So does every other string of the site's own that still said "vy" - the
--     404 page, What's new's line on the releases missed, the sign-in service
--     out of reach, the admin panel's no-access page: the whole site says
--     "ty", as the owner decided.
--
-- Each string and each guide only while it is still the earlier migration's
-- word for word, so a rewording the owner made in the admin panel stands; a
-- guide compared without carriage returns, as users/059 does. Deleting a key
-- takes its strings with it, in every language and whatever the owner
-- reworded them to - translations.key_name is ON DELETE CASCADE.
-----------------------------------------------------------

UPDATE translations t
   SET value = v.new_value,
       updated_at = CURRENT_TIMESTAMP
  FROM (VALUES
    ('guide.pixelate.title', 'sk', 'O pixeloch', 'O pixelácii'),
    ('guide.mismatch.title', 'sk', 'O votrelcovi', 'O nesúlade'),
    ('database.characters.info', 'sk',
     'Prezerajte si postavy v hre a dozviete sa o nich viac.',
     'Prezri si postavy v hre a dozvieš sa o nich viac.'),
    ('database.materials.info', 'sk',
     'Prezerajte si materiály v hre a dozviete sa o nich viac.',
     'Prezri si materiály v hre a dozvieš sa o nich viac.'),
    ('database.weapons.info', 'sk',
     'Prezerajte si zbrane v hre a dozviete sa o nich viac.',
     'Prezri si zbrane v hre a dozvieš sa o nich viac.'),
    ('database.banners.info', 'sk',
     'Prezerajte si priania v hre a dozviete sa o nich viac.',
     'Prezri si priania v hre a dozvieš sa o nich viac.'),
    ('backgrounds.whatText', 'en',
     'Customize your quiz experience by choosing different character-themed wallpapers as the app background.',
     'Choose the wallpaper behind the site: it changes at once, and this browser keeps your choice.'),
    ('backgrounds.whatText', 'sk',
     'Prispôsobte si kvízy výberom tapiet s postavami ako pozadie aplikácie.',
     'Vyber si tapetu za stránkou: zmení sa hneď a tento prehliadač si tvoju voľbu zapamätá.'),
    ('account.signedOutNote', 'sk',
     'Nie ste prihlásený. Vaše nastavenia sú uložené v tomto zariadení.',
     'Nie si prihlásený. Tvoje nastavenia sú uložené v tomto zariadení.'),
    ('account.iamLead', 'sk',
     'Prihlasujete sa účtom anotoki - tým istým pre všetky stránky anotoki.',
     'Prihlasuješ sa účtom anotoki - tým istým pre všetky stránky anotoki.'),
    ('account.manageNote', 'sk',
     'Heslo, dvojfaktorové overenie, Google a kde všade ste prihlásený',
     'Heslo, dvojfaktorové overenie, Google a kde všade si prihlásený'),
    ('account.signOutNote', 'sk',
     'Odhlásenie vás odhlási zo všetkých stránok anotoki naraz.',
     'Odhlásenie ťa odhlási zo všetkých stránok anotoki naraz.'),
    ('account.formats.failed', 'sk',
     'Nepodarilo sa to uložiť. Skúste to o chvíľu znova.',
     'Nepodarilo sa to uložiť. Skús to o chvíľu znova.'),
    ('notFound.text', 'sk',
     'Je nám ľúto, ale nemohli sme nájsť stránku, ktorú hľadáte. Skontrolujte, či ste zadali správnu adresu URL.',
     'Je nám ľúto, ale nemohli sme nájsť stránku, ktorú hľadáš. Skontroluj, či je adresa správna.'),
    ('whatsNew.earlier', 'sk',
     'Čakajú vás aj staršie novinky - nájdete ich v úplnom zozname.',
     'Čakajú ťa aj staršie novinky - nájdeš ich v úplnom zozname.'),
    ('auth.unavailable', 'sk',
     'Stránka sa teraz nevie spojiť so službou prihlásenia. Skúste to o chvíľu znova.',
     'Stránka sa teraz nevie spojiť so službou prihlásenia. Skús to o chvíľu znova.'),
    ('admin.noAccess.text', 'sk',
     'Ste prihlásený ako {username} a tento účet nemá na tejto stránke žiadnu rolu. Administrácia je určená jej editorom a administrátorom.',
     'Si prihlásený ako {username} a tento účet nemá na tejto stránke žiadnu rolu. Administrácia je určená jej editorom a administrátorom.')
  ) AS v(key_name, language_code, old_value, new_value)
 WHERE t.key_name = v.key_name
   AND t.language_code = v.language_code
   AND t.value = v.old_value;

UPDATE translation_keys
   SET description = 'The wallpapers'' window (opened from the account panel''s Background row): its one sentence, above the wallpapers - what choosing one does, and that this browser keeps it. No placeholders.'
 WHERE name = 'backgrounds.whatText';

DELETE FROM translation_keys WHERE name IN (
    'database.characters.about',
    'database.materials.about',
    'database.weapons.about',
    'database.banners.about',
    'backgrounds.whatTitle',
    'backgrounds.howTitle',
    'backgrounds.step1',
    'backgrounds.step2',
    'backgrounds.step3',
    'backgrounds.step4',
    'backgrounds.availableTitle',
    'backgrounds.availableText',
    'backgrounds.note'
);

-----------------------------------------------------------
-- THE GUIDES
--
-- Each text said once, for the change and for its proof: the Daily's
-- English and Slovak, the Quizzes' English and Slovak, the Tournament's
-- English and Slovak (users/028's), Pixelate's Slovak (users/028's) and
-- Mismatch's Slovak (users/059's).
-----------------------------------------------------------

DO $$
DECLARE
    daily_en_old CONSTANT TEXT := '<h4>What is the Daily?</h4>
<p>Two quizzes are drawn at random each day, one question each. Any of the quizzes can come up: <strong>banners</strong>, <strong>pixelate</strong>, <strong>mismatch</strong>, <strong>music</strong>, <strong>dish</strong> or <strong>voice</strong>.</p>
<h4>How it works</h4>
<ol>
<li>Two quizzes are drawn each day.</li>
<li>Every question is timed.</li>
<li>Every question has a difficulty.</li>
<li>Each daily quiz can be attempted once a day.</li>
<li>The day rolls over at 00:00 UTC.</li>
<li>Once the daily is done you can still play any quiz on its own.</li>
</ol>';
    daily_en_new CONSTANT TEXT := '<h4>What is the Daily?</h4>
<p>Two quizzes are drawn at random each day, one question each. Any of the quizzes can come up: <strong>banners</strong>, <strong>pixelate</strong>, <strong>mismatch</strong>, <strong>music</strong>, <strong>dish</strong> or <strong>voice</strong>.</p>
<h4>How it works</h4>
<ol>
<li>Two quizzes are drawn each day, the same two for everybody.</li>
<li>Everybody plays them at the same difficulty.</li>
<li>Each daily quiz can be attempted once a day.</li>
<li>The day rolls over at 00:00 UTC.</li>
<li>Once the daily is done you can still play any quiz on its own.</li>
</ol>';
    daily_sk_old CONSTANT TEXT := '<h4>Čo je denná výzva?</h4>
<p>Každý deň sa náhodne vyberú dva kvízy, každý s jednou otázkou. Prísť môže ktorýkoľvek: <strong>bannery</strong>, <strong>pixely</strong>, <strong>votrelec</strong>, <strong>hudba</strong>, <strong>jedlo</strong> alebo <strong>hlas</strong>.</p>
<h4>Ako to funguje</h4>
<ol>
<li>Každý deň sa vyberú dva kvízy.</li>
<li>Každá otázka je na čas.</li>
<li>Každá otázka má obtiažnosť.</li>
<li>Denný kvíz sa dá skúsiť raz za deň.</li>
<li>Deň sa prepína o 00:00 UTC.</li>
<li>Po dohratí dennej výzvy sa dá každý kvíz hrať aj samostatne.</li>
</ol>';
    daily_sk_new CONSTANT TEXT := '<h4>Čo je denná výzva?</h4>
<p>Každý deň sa náhodne vyberú dva kvízy, každý s jednou otázkou. Prísť môže ktorýkoľvek: <strong>bannery</strong>, <strong>pixelácia</strong>, <strong>nesúlad</strong>, <strong>hudba</strong>, <strong>jedlo</strong> alebo <strong>hlas</strong>.</p>
<h4>Ako to funguje</h4>
<ol>
<li>Každý deň sa vyberú dva kvízy, pre všetkých tie isté.</li>
<li>Všetci ich hrajú na rovnakej obtiažnosti.</li>
<li>Denný kvíz sa dá skúsiť raz za deň.</li>
<li>Deň sa prepína o 00:00 UTC.</li>
<li>Po dohratí dennej výzvy sa dá každý kvíz hrať aj samostatne.</li>
</ol>';
    quizzes_en_old CONSTANT TEXT := '<h4>What are the Quizzes?</h4>
<p>A set of questions about the game. Each quiz asks about something different: <strong>banners</strong>, <strong>pixelate</strong>, <strong>mismatch</strong>, <strong>music</strong>, <strong>dish</strong> and <strong>voice</strong>.</p>
<h4>How to play</h4>
<ol>
<li>Every quiz is timed.</li>
<li>Every quiz has a difficulty.</li>
<li>Played from here, a quiz can be played as often as you like.</li>
<li>The daily version of a quiz is the one limited to a single attempt a day.</li>
</ol>
<p>Your results are kept, so the profile page can show what you have played and how it went.</p>';
    quizzes_en_new CONSTANT TEXT := '<h4>What are the Quizzes?</h4>
<p>A set of questions about the game. Each quiz asks about something different: <strong>banners</strong>, <strong>pixelate</strong>, <strong>mismatch</strong>, <strong>music</strong>, <strong>dish</strong> and <strong>voice</strong>.</p>
<h4>How to play</h4>
<ol>
<li>Every quiz has a difficulty - choose it with the button above the question.</li>
<li>Played from here, a quiz can be played as often as you like.</li>
<li>The daily version of a quiz is the one limited to a single attempt a day.</li>
</ol>
<p>Your results are kept, so the profile page can show what you have played and how it went.</p>';
    quizzes_sk_old CONSTANT TEXT := '<h4>Čo sú kvízy?</h4>
<p>Sada otázok o hre. Každý kvíz sa pýta na niečo iné: <strong>bannery</strong>, <strong>pixely</strong>, <strong>votrelec</strong>, <strong>hudba</strong>, <strong>jedlo</strong> a <strong>hlas</strong>.</p>
<h4>Ako sa hrá</h4>
<ol>
<li>Každý kvíz je na čas.</li>
<li>Každý kvíz má obtiažnosť.</li>
<li>Odtiaľto sa dá kvíz hrať koľkokrát chceš.</li>
<li>Na jeden pokus denne je obmedzená len denná verzia kvízu.</li>
</ol>
<p>Výsledky sa ukladajú, takže na profile vidíš, čo si hral a ako ti to šlo.</p>';
    quizzes_sk_new CONSTANT TEXT := '<h4>Čo sú kvízy?</h4>
<p>Sada otázok o hre. Každý kvíz sa pýta na niečo iné: <strong>bannery</strong>, <strong>pixelácia</strong>, <strong>nesúlad</strong>, <strong>hudba</strong>, <strong>jedlo</strong> a <strong>hlas</strong>.</p>
<h4>Ako sa hrá</h4>
<ol>
<li>Každý kvíz má obtiažnosť - zvolíš ju tlačidlom nad otázkou.</li>
<li>Odtiaľto sa dá kvíz hrať koľkokrát chceš.</li>
<li>Na jeden pokus denne je obmedzená len denná verzia kvízu.</li>
</ol>
<p>Výsledky sa ukladajú, takže na profile vidíš, čo si hral a ako ti to šlo.</p>';
    pixelate_sk_old CONSTANT TEXT := '<h4>Čo je kvíz Pixely?</h4>
<p>Pomenuj postavu podľa silno spixelovaného portrétu. Čím menej pokusov, tým lepšie ju poznáš.</p>
<h4>Ako sa hrá</h4>
<ol>
<li>Zobrazí sa portrét, spixelovaný takmer na nepoznanie.</li>
<li>Napíš meno postavy alebo ho vyber zo zoznamu.</li>
<li>Máš päť pokusov.</li>
<li>Po každom zlom tipe sa obrázok trochu zaostrí.</li>
</ol>';
    pixelate_sk_new CONSTANT TEXT := '<h4>Čo je kvíz Pixelácia?</h4>
<p>Pomenuj postavu podľa silno spixelovaného portrétu. Čím menej pokusov, tým lepšie ju poznáš.</p>
<h4>Ako sa hrá</h4>
<ol>
<li>Zobrazí sa portrét, spixelovaný takmer na nepoznanie.</li>
<li>Napíš meno postavy alebo ho vyber zo zoznamu.</li>
<li>Máš päť pokusov.</li>
<li>Po každom zlom tipe sa obrázok trochu zaostrí.</li>
</ol>';
    mismatch_sk_old CONSTANT TEXT := '<h4>Čo je kvíz Votrelec?</h4>
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
    mismatch_sk_new CONSTANT TEXT := '<h4>Čo je kvíz Nesúlad?</h4>
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
    tournament_en_old CONSTANT TEXT := '<h4>What is the Character Tournament?</h4>
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
<p>Nothing is saved. Leave the page and the tournament is gone.</p>';
    tournament_en_new CONSTANT TEXT := '<h4>What is the Character Tournament?</h4>
<p>Put your favourite characters against each other. They are drawn at random and shown two at a time, and you decide who goes through.</p>
<h4>How to play</h4>
<ol>
<li>Choose the format.</li>
<li>Choose how many characters take part.</li>
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
<p>Nothing is saved. Leave the page and the tournament is gone.</p>';
    tournament_sk_old CONSTANT TEXT := '<h4>Čo je turnaj postáv?</h4>
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
<p>Nič sa neukladá. Keď odídeš zo stránky, turnaj je preč.</p>';
    tournament_sk_new CONSTANT TEXT := '<h4>Čo je turnaj postáv?</h4>
<p>Postav svoje obľúbené postavy proti sebe. Vyberajú sa náhodne a ukazujú po dvoch - ty rozhoduješ, kto postúpi.</p>
<h4>Ako sa hrá</h4>
<ol>
<li>Vyber formát.</li>
<li>Vyber, koľko postáv sa zúčastní.</li>
<li>Stlač tlačidlo Začať.</li>
<li>Pri každej dvojici vyber tú, ktorú máš radšej.</li>
<li>Pokračuj, kým sa turnaj nerozhodne.</li>
</ol>
<h4>Formáty</h4>
<ul>
<li><span class="tag">Jednoduché vyraďovanie</span> Jedna prehra a končíš. Na konci sa ukáže len víťaz.</li>
<li><span class="tag">Dvojité vyraďovanie</span> Prvá prehra ešte nie je koniec. Na konci sa ukáže najlepšia trojica.</li>
<li><span class="tag">Každý s každým</span> Všetci hrajú so všetkými raz a zoradia sa podľa výhier.</li>
</ul>
<p>Nič sa neukladá. Keď odídeš zo stránky, turnaj je preč.</p>';

    guides CONSTANT TEXT[] := ARRAY['daily', 'daily', 'quizzes', 'quizzes', 'pixelate', 'mismatch', 'tournament', 'tournament'];
    langs CONSTANT TEXT[] := ARRAY['en', 'sk', 'en', 'sk', 'sk', 'sk', 'en', 'sk'];
    olds TEXT[];
    news TEXT[];
    stale TEXT;
BEGIN
    olds := ARRAY[daily_en_old, daily_sk_old, quizzes_en_old, quizzes_sk_old, pixelate_sk_old, mismatch_sk_old, tournament_en_old, tournament_sk_old];
    news := ARRAY[daily_en_new, daily_sk_new, quizzes_en_new, quizzes_sk_new, pixelate_sk_new, mismatch_sk_new, tournament_en_new, tournament_sk_new];

    FOR i IN 1 .. array_length(guides, 1) LOOP
        UPDATE guide_contents
           SET html = news[i],
               updated_at = CURRENT_TIMESTAMP
         WHERE guide = guides[i]
           AND language_code = langs[i]
           AND replace(html, chr(13), '') = replace(olds[i], chr(13), '');
    END LOOP;

    SELECT string_agg(g.guide || '|' || g.language_code, ', ' ORDER BY g.guide, g.language_code) INTO stale
      FROM guide_contents g
      JOIN generate_subscripts(guides, 1) AS i ON g.guide = guides[i] AND g.language_code = langs[i]
     WHERE replace(g.html, chr(13), '') = replace(olds[i], chr(13), '');
    IF stale IS NOT NULL THEN
        RAISE EXCEPTION 'users/060: guides still in their earlier words: %', stale;
    END IF;
END $$;

-----------------------------------------------------------
-- PROVE IT
--
-- No string still says what its earlier migration said in it; the keys taken
-- away are gone with every string under them; and the keys the guides, the
-- account panel, the wallpapers' window, the Database page, the 404 page,
-- What's new, the sign-in and the admin panel's no-access page still read are
-- here.
-----------------------------------------------------------

DO $$
DECLARE
    stale TEXT;
    leftover TEXT;
    lost TEXT;
BEGIN
    SELECT string_agg(t.key_name || '|' || t.language_code, ', ' ORDER BY t.key_name, t.language_code) INTO stale
      FROM translations t
     WHERE (t.key_name, t.language_code, t.value) IN (
          ('guide.pixelate.title', 'sk', 'O pixeloch'),
          ('guide.mismatch.title', 'sk', 'O votrelcovi'),
          ('database.characters.info', 'sk', 'Prezerajte si postavy v hre a dozviete sa o nich viac.'),
          ('database.materials.info', 'sk', 'Prezerajte si materiály v hre a dozviete sa o nich viac.'),
          ('database.weapons.info', 'sk', 'Prezerajte si zbrane v hre a dozviete sa o nich viac.'),
          ('database.banners.info', 'sk', 'Prezerajte si priania v hre a dozviete sa o nich viac.'),
          ('backgrounds.whatText', 'en', 'Customize your quiz experience by choosing different character-themed wallpapers as the app background.'),
          ('backgrounds.whatText', 'sk', 'Prispôsobte si kvízy výberom tapiet s postavami ako pozadie aplikácie.'),
          ('account.signedOutNote', 'sk', 'Nie ste prihlásený. Vaše nastavenia sú uložené v tomto zariadení.'),
          ('account.iamLead', 'sk', 'Prihlasujete sa účtom anotoki - tým istým pre všetky stránky anotoki.'),
          ('account.manageNote', 'sk', 'Heslo, dvojfaktorové overenie, Google a kde všade ste prihlásený'),
          ('account.signOutNote', 'sk', 'Odhlásenie vás odhlási zo všetkých stránok anotoki naraz.'),
          ('account.formats.failed', 'sk', 'Nepodarilo sa to uložiť. Skúste to o chvíľu znova.'),
          ('notFound.text', 'sk', 'Je nám ľúto, ale nemohli sme nájsť stránku, ktorú hľadáte. Skontrolujte, či ste zadali správnu adresu URL.'),
          ('whatsNew.earlier', 'sk', 'Čakajú vás aj staršie novinky - nájdete ich v úplnom zozname.'),
          ('auth.unavailable', 'sk', 'Stránka sa teraz nevie spojiť so službou prihlásenia. Skúste to o chvíľu znova.'),
          ('admin.noAccess.text', 'sk', 'Ste prihlásený ako {username} a tento účet nemá na tejto stránke žiadnu rolu. Administrácia je určená jej editorom a administrátorom.')
     );
    IF stale IS NOT NULL THEN
        RAISE EXCEPTION 'users/060: strings still in their earlier words: %', stale;
    END IF;

    SELECT string_agg(name, ', ' ORDER BY name) INTO leftover
      FROM (
          SELECT name FROM translation_keys WHERE name LIKE 'database.%.about' OR name IN (
              'backgrounds.whatTitle', 'backgrounds.howTitle', 'backgrounds.step1', 'backgrounds.step2', 'backgrounds.step3',
              'backgrounds.step4', 'backgrounds.availableTitle', 'backgrounds.availableText', 'backgrounds.note')
          UNION
          SELECT key_name FROM translations WHERE key_name LIKE 'database.%.about' OR key_name IN (
              'backgrounds.whatTitle', 'backgrounds.howTitle', 'backgrounds.step1', 'backgrounds.step2', 'backgrounds.step3',
              'backgrounds.step4', 'backgrounds.availableTitle', 'backgrounds.availableText', 'backgrounds.note')
      ) AS left_behind;
    IF leftover IS NOT NULL THEN
        RAISE EXCEPTION 'users/060: the Database help''s and the wallpapers'' window''s old keys are still here: %', leftover;
    END IF;

    SELECT string_agg(k.name, ', ' ORDER BY k.name) INTO lost
      FROM (VALUES
          ('guide.pixelate.title'), ('guide.mismatch.title'), ('guide.daily.title'), ('guide.quizzes.title'), ('guide.tournament.title'),
          ('database.characters.info'), ('database.materials.info'), ('database.weapons.info'), ('database.banners.info'),
          ('backgrounds.title'), ('backgrounds.whatText'), ('account.background'),
          ('account.signedOutNote'), ('account.iamLead'), ('account.manageNote'), ('account.signOutNote'), ('account.formats.failed'),
          ('notFound.text'), ('whatsNew.earlier'), ('auth.unavailable'), ('admin.noAccess.text')
      ) AS k(name)
     WHERE NOT EXISTS (SELECT 1 FROM translation_keys tk WHERE tk.name = k.name);
    IF lost IS NOT NULL THEN
        RAISE EXCEPTION 'users/060: keys the pages still read are gone: %', lost;
    END IF;
END $$;
