-----------------------------------------------------------
-- TERMS, PRIVACY AND CONTACT: GENSHIN'S OWN FACTS, AND THE FAN LINE
--
-- The anotoki family's legal pages (anotoki-lib 0.6, the owner's decisions of
-- 2026-10-13): their structure and the family's shared wording are the
-- library's - its words, anotoki.legal.*, come with its own set
-- anotoki_translations (005 to 011), which runs after this folder in the same
-- Apply - and each site gives its own facts. These are genshin's, in its
-- words: its name and what it is (Terms), what it keeps, what for and how long
-- (Privacy: the record of a person, their games, who changed what, the
-- limits' counts, the old tables kept from the move into the library's, a
-- visitor's games, the feedback form's fields, the audit log on this site),
-- and each item it keeps in a browser. The frontend reads them in
-- sites/main/legal/legal-facts.ts, which says what each rests on in the code:
-- a change to what the site keeps, or for how long, changes these strings (by
-- a migration) and SITE_LEGAL_UPDATED there. Every address the pages link to
-- - the anotoki account's pages, the operator's, the processors' - is the
-- code's, never a string here: a rewording on the Translations page can never
-- change where a link goes.
--
-- And footer.fanDisclaimer, the fan clause under every page of the public
-- site beside Terms · Privacy · Contact (the owner's decision of 2026-10-13:
-- genshin and the build analyzer, each in its own footer; the Terms page says
-- it too, in the library's words, fanDisclaimer: 'hoyoverse').
--
-- users/051's shape: a key is its name and its description, the code's; each
-- language's string only where it has none (ON CONFLICT DO NOTHING), so a
-- rewording the owner made is never undone. Informal Slovak ("ty").
-- {days} is the server's keep_days, relayed. Nothing else is touched.
-----------------------------------------------------------

INSERT INTO translation_keys (name, description) VALUES
    ('legal.site', 'The site''s name as the legal pages say it - Terms, Privacy and Contact ("{site} is one of the anotoki sites, run by ..."). A name: the same in every language. Never the game''s name alone: the site is a fan project, not the game.'),
    ('legal.about', 'What the site is: the first thing the Terms page says, under "What {site} is". A sentence or two.'),
    ('legal.record.name', 'Privacy, what the site keeps: the heading of its record of a person who signs in (users: the account''s id, the name, when first seen), and its line under "How long it is kept".'),
    ('legal.record.what', 'Privacy, the record of a person: what it holds. True of users (the IAM''s id, username from the token - the library''s PeopleRecorder updates it -, created_at); no address.'),
    ('legal.record.why', 'Privacy, the record of a person: what it is for.'),
    ('legal.record.kept', 'Privacy, the record of a person: how long. True of the code: the row is never deleted (the People page''s Delete keeps it); the scrub of the IAM''s deleted accounts names it deleted-{id}.'),
    ('legal.games.name', 'Privacy, what the site keeps: the heading of a player''s games and statistics (quizzes_states, user_quiz_history, quiz_stats_history), and its line under "How long it is kept".'),
    ('legal.games.what', 'Privacy, a player''s games: what they hold.'),
    ('legal.games.why', 'Privacy, a player''s games: what they are for.'),
    ('legal.games.kept', 'Privacy, a player''s games: how long. True of the code: nothing deletes them by age; the People page''s Delete takes them; the scrub of the IAM''s deleted accounts leaves them, nameless.'),
    ('legal.staff.name', 'Privacy, what the site keeps: the heading of who changed what (created_by / updated_by on the content, files, guides, words and settings), and its line under "How long it is kept".'),
    ('legal.staff.what', 'Privacy, who changed what: what it holds.'),
    ('legal.staff.why', 'Privacy, who changed what: what it is for.'),
    ('legal.staff.kept', 'Privacy, who changed what: how long - as long as the row it is on; the name shown beside the id is the record''s, a placeholder once the account is deleted.'),
    ('legal.limits.name', 'Privacy, what the site keeps: the heading of the limits'' counts (visitor_starts: a keyed hash of the address an hour; the library''s feedback and error-report counts in storage/), and its line under "How long it is kept".'),
    ('legal.limits.what', 'Privacy, the limits'' counts: what they hold - never an address, a keyed hash of its bucket.'),
    ('legal.limits.why', 'Privacy, the limits'' counts: what they are for.'),
    ('legal.limits.kept', 'Privacy, the limits'' counts: how long. True of the code: visitor_starts an hour; the error reports'' senders an hour; feedback''s a day.'),
    ('legal.oldCopies.name', 'Privacy, what the site keeps: the heading of the old tables kept when the feedback, the audit log and the words moved into the library''s (feedback_before_library, audit_logs_before_library, translations_before_library, translation_keys_before_library), and its line under "How long it is kept". Goes once a migration drops them.'),
    ('legal.oldCopies.what', 'Privacy, the old tables: what they hold.'),
    ('legal.oldCopies.why', 'Privacy, the old tables: what they are for.'),
    ('legal.oldCopies.kept', 'Privacy, the old tables: how long. True of the code: no prune; the scrub of the IAM''s deleted accounts blanks feedback_before_library''s name, address and browser.'),
    ('legal.visitors.what', 'Privacy, "Using the site without an account": what is kept for a visitor (users with a negative id, the key''s SHA-256, created and last seen; their games under it).'),
    ('legal.visitors.kept', 'Privacy, a visitor''s games: how long - {days} is the server''s keep_days (config/visitors.php), relayed in /api/settings/public, never a number of the page''s own. The move after a silent sign-in comes only into an account with nothing here yet.'),
    ('legal.feedback.what', 'Privacy, Feedback: what comes with the footer''s form (the library''s, with this site''s kinds, sections and fields: shared/site-feedback.ts), in place of the library''s shorter sentence.'),
    ('legal.auditLog.what', 'Privacy, the audit log: what it holds on this site (the library''s anotoki_audit_log: content.*, catalogue.*, the words'', the tools'' own; the actor''s id and IAM session; no address), in place of the library''s shorter sentence.'),
    ('legal.storage.signInUnderWay.purpose', 'Privacy, cookies and storage: the auth module''s session items while a sign-in is under way (anotoki-auth:{client}:login:..., anotoki-auth:discovery:...): what they are for.'),
    ('legal.storage.signInUnderWay.kept', 'Privacy, cookies and storage: how long the sign-in''s session items stay (the discovery document an hour).'),
    ('legal.storage.silent.purpose', 'Privacy, cookies and storage: genshin-silent-sign-in (shared/silent-sign-in.ts) - what it is for.'),
    ('legal.storage.silent.kept', 'Privacy, cookies and storage: how long genshin-silent-sign-in stays (a sign-in the person makes clears it).'),
    ('legal.storage.tabLanguage.purpose', 'Privacy, cookies and storage: the language a ?lang= in the address asked for, kept for the tab (the translations module, sessionStorage under the language''s key).'),
    ('legal.storage.untilTabClosed', 'Privacy, cookies and storage: how long an item of this tab''s (sessionStorage) stays.'),
    ('legal.storage.visitorKey.kept', 'Privacy, cookies and storage: how long genshin-visitor (the visitor''s key) stays - forgotten after the move, or when the server answers visitor_unknown. {days} is the server''s keep_days.'),
    ('legal.storage.browserGames.purpose', 'Privacy, cookies and storage: app_data (shared/state-manager.service.ts) - the games the browser keeps by itself while the server keeps none for it, and the difficulty chosen.'),
    ('legal.storage.browserGames.kept', 'Privacy, cookies and storage: how long app_data stays - the games carried to the server once it keeps them.'),
    ('legal.storage.version.purpose', 'Privacy, cookies and storage: the newest version What''s new last showed (the footer''s version).'),
    ('legal.storage.background.purpose', 'Privacy, cookies and storage: the wallpaper chosen in the footer''s Backgrounds.'),
    ('legal.storage.announcement.purpose', 'Privacy, cookies and storage: the announcement closed (its text), so that it stays closed.'),
    ('legal.storage.announcement.kept', 'Privacy, cookies and storage: how long the closed announcement stays - a new one shows again.'),
    ('legal.storage.drafts.purpose', 'Privacy, cookies and storage: the admin Translations page''s unsaved words (the translations module, sessionStorage) - for the site''s editors.'),
    ('legal.storage.drafts.kept', 'Privacy, cookies and storage: how long the unsaved words stay.'),
    ('legal.storage.untilCleared', 'Privacy, cookies and storage: how long an item stays that only clearing the site''s data takes away.'),
    ('legal.storage.untilChosenAgain', 'Privacy, cookies and storage: how long a remembered choice stays.'),
    ('footer.fanDisclaimer', 'Under every page of the public site, beside Terms · Privacy · Contact: the fan clause (the owner''s decision of 2026-10-13; the Terms page says it too, in the library''s words).')
ON CONFLICT (name) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'en', v.value FROM (VALUES
    ('legal.site', 'anotoki · genshin'),
    ('legal.about', 'A fan site about Genshin Impact: a reference to the game''s characters, weapons, materials and banners, with daily quizzes and games - and, for whoever plays them, their progress and statistics.'),
    ('legal.record.name', 'Your record here'),
    ('legal.record.what', 'Your anotoki account''s id, the name your account gives (updated when it changes) and when you first came here.'),
    ('legal.record.why', 'To keep your games and statistics yours, to show your name on your profile - and, for the site''s editors, beside the changes they make.'),
    ('legal.record.kept', 'For as long as the site runs. When your anotoki account is deleted, the name is replaced with a placeholder; the id and the date stay, naming nobody.'),
    ('legal.games.name', 'Your games and statistics'),
    ('legal.games.what', 'Each quiz''s saved game (today''s daily too), every question you finish - the quiz, the character, the difficulty, whether the answer was right and in how many tries, and when - and your wins and losses by character and quiz.'),
    ('legal.games.why', 'So that each quiz goes on where you left it, and to show your history and statistics on your profile.'),
    ('legal.games.kept', 'With no set time limit - nothing is deleted because of its age; an administrator deletes it if you ask. When your anotoki account is deleted, it stays here without your name.'),
    ('legal.staff.name', 'If you edit the site'),
    ('legal.staff.what', 'For the site''s editors and administrators: with the game content, the guides, the words, the site''s settings and its files, the account id of whoever added or last changed each.'),
    ('legal.staff.why', 'So that each change can be traced to the person who made it.'),
    ('legal.staff.kept', 'As long as what was changed is kept. When the account is deleted, its name beside them becomes a placeholder.'),
    ('legal.limits.name', 'Limits against floods'),
    ('legal.limits.what', 'For a short while, the site counts who sent what - new players without an account, feedback, the pages'' error reports: someone signed in by their account, anybody else by a code made from their IP address with a secret key, never the address itself.'),
    ('legal.limits.why', 'To keep the site from being flooded or misused.'),
    ('legal.limits.kept', 'An hour for new players and the pages'' error reports; a day for feedback.'),
    ('legal.oldCopies.name', 'Older copies'),
    ('legal.oldCopies.what', 'When the site moved its feedback, its record of changes and its words into the anotoki sites'' shared tables, it kept the old tables as they were: the messages sent until then (without the address they came from), the old record of who changed what (by account id), and the words with who last saved them.'),
    ('legal.oldCopies.why', 'A way back, in case something did not come over whole.'),
    ('legal.oldCopies.kept', 'Until an update of the site removes them - with no set time limit until then. When a sender''s anotoki account is deleted, their name, reply address and browser go from the old messages too.'),
    ('legal.visitors.what', 'A random key this browser keeps, and on the server, under it, what you play - each quiz''s saved game, the questions you finish, your statistics - with when the key was made and last used. The server keeps only a code made from the key (a hash), never the key itself.'),
    ('legal.visitors.kept', '{days} days after your last visit, then deleted. When you sign in here it moves into your account - after a sign-in made without a click, only into an account that has nothing here yet.'),
    ('legal.feedback.what', 'What comes with the feedback form: its kind (a bug, an idea or something else), the part of the site it is about, a subject, the message and what else the form asks (for a bug: the steps to make it happen, what should have happened, your browser and device; for an idea: why it matters); the page it was sent from, the page''s language and the browser it was sent with; the sender''s account, unless it was sent without a name; and a reply address only if the sender leaves one - signed in, the form fills in the account''s, which can be cleared.'),
    ('legal.auditLog.what', 'What the site''s editors and administrators do on its admin pages - the game content, the guides, the words, the settings, the files, a person''s games or a message deleted: who did it (their account''s id, and which sign-in), what changed, and when.'),
    ('legal.storage.signInUnderWay.purpose', 'A sign-in on its way: what it needs to finish when the anotoki account sends you back, and the account''s public settings.'),
    ('legal.storage.signInUnderWay.kept', 'Until the sign-in finishes; the settings an hour at most. Gone when the tab is closed.'),
    ('legal.storage.silent.purpose', 'That your sign-in here was made without a click (by the anotoki account''s hint), and for which account: games played without an account then move only into an account that has nothing here yet.'),
    ('legal.storage.silent.kept', 'Until you sign in here by your own click.'),
    ('legal.storage.tabLanguage.purpose', 'A language asked for in the page''s address (?lang=), for this tab alone.'),
    ('legal.storage.untilTabClosed', 'Until the tab is closed.'),
    ('legal.storage.visitorKey.kept', 'Until you sign in here and what it holds moves into your account, the site no longer knows it ({days} days unseen), or you clear the site''s data in your browser.'),
    ('legal.storage.browserGames.purpose', 'The quizzes'' games this browser keeps by itself while the site keeps none for you (before your first answer, or while it takes no more players without an account), and the difficulty you chose.'),
    ('legal.storage.browserGames.kept', 'Until you clear the site''s data in your browser; the games move to the site once it keeps them for you.'),
    ('legal.storage.version.purpose', 'The newest version this browser has been shown, so that What''s new opens once for each new one.'),
    ('legal.storage.background.purpose', 'The wallpaper you chose.'),
    ('legal.storage.announcement.purpose', 'The announcement you closed, so that it stays closed.'),
    ('legal.storage.announcement.kept', 'Until a new announcement, or until you clear the site''s data in your browser.'),
    ('legal.storage.drafts.purpose', 'For the site''s editors: words typed on the admin Translations page and not saved yet.'),
    ('legal.storage.drafts.kept', 'Until they are saved or thrown away, or the tab is closed.'),
    ('legal.storage.untilCleared', 'Until you clear the site''s data in your browser.'),
    ('legal.storage.untilChosenAgain', 'Until you choose again, or clear the site''s data in your browser.'),
    ('footer.fanDisclaimer', 'This site is a fan-made project and is not affiliated with or endorsed by HoYoverse.')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'sk', v.value FROM (VALUES
    ('legal.site', 'anotoki · genshin'),
    ('legal.about', 'Fanúšikovská stránka o hre Genshin Impact: prehľad postáv, zbraní, materiálov a bannerov z hry, denné kvízy a hry - a pre toho, kto ich hrá, jeho postup a štatistiky.'),
    ('legal.record.name', 'Tvoj záznam na stránke'),
    ('legal.record.what', 'ID tvojho účtu anotoki, meno, ktoré uvádza tvoj účet (aktualizuje sa, keď sa zmení), a dátum tvojej prvej návštevy.'),
    ('legal.record.why', 'Aby tvoje hry a štatistiky zostali tvoje, aby sa na tvojom profile ukázalo tvoje meno - a pri redaktoroch stránky aj pri zmenách, ktoré urobia.'),
    ('legal.record.kept', 'Kým stránka beží. Keď sa tvoj účet anotoki zmaže, meno sa nahradí zástupným označením; ID a dátum zostanú, už bez mena.'),
    ('legal.games.name', 'Tvoje hry a štatistiky'),
    ('legal.games.what', 'Uložená hra každého kvízu (aj dnešného denného), každá otázka, ktorú dokončíš - kvíz, postava, obťažnosť, či bola odpoveď správna, na koľký pokus a kedy - a tvoje výhry a prehry podľa postavy a kvízu.'),
    ('legal.games.why', 'Aby každý kvíz pokračoval tam, kde ho necháš, a aby sa na tvojom profile ukázala tvoja história a štatistiky.'),
    ('legal.games.kept', 'Bez pevného časového limitu - nič sa nemaže preto, že je staré; ak požiadaš, zmaže to správca. Keď sa tvoj účet anotoki zmaže, zostane to tu bez tvojho mena.'),
    ('legal.staff.name', 'Ak stránku upravuješ'),
    ('legal.staff.what', 'Pri redaktoroch a správcoch stránky: pri obsahu z hry, návodoch, textoch, nastaveniach stránky a jej súboroch ID účtu toho, kto ich pridal alebo naposledy zmenil.'),
    ('legal.staff.why', 'Aby sa dalo dohľadať, kto čo zmenil.'),
    ('legal.staff.kept', 'Kým sa uchováva to, čo bolo zmenené. Keď sa účet zmaže, jeho meno pri nich nahradí zástupné označenie.'),
    ('legal.limits.name', 'Limity proti zahlteniu'),
    ('legal.limits.what', 'Stránka si krátko počíta, kto čo poslal - nových hráčov bez účtu, spätnú väzbu, hlásenia chýb zo stránok: prihláseného podľa jeho účtu, ostatných podľa kódu vytvoreného z ich IP adresy tajným kľúčom, nikdy nie podľa samotnej adresy.'),
    ('legal.limits.why', 'Aby stránku nikto nezahltil ani nezneužil.'),
    ('legal.limits.kept', 'Hodinu pri nových hráčoch a hláseniach chýb zo stránok, deň pri spätnej väzbe.'),
    ('legal.oldCopies.name', 'Staršie kópie'),
    ('legal.oldCopies.what', 'Keď stránka presunula spätnú väzbu, záznam zmien a texty do spoločných tabuliek stránok anotoki, ponechala staré tabuľky tak, ako boli: správy odoslané dovtedy (bez adresy, z ktorej prišli), starý záznam o tom, kto čo zmenil (podľa ID účtu), a texty s tým, kto ich naposledy uložil.'),
    ('legal.oldCopies.why', 'Cesta späť pre prípad, že by sa niečo nepresunulo celé.'),
    ('legal.oldCopies.kept', 'Kým ich neodstráni aktualizácia stránky - dovtedy bez pevného časového limitu. Keď sa účet anotoki odosielateľa zmaže, z jeho starých správ sa odstráni aj meno, adresa na odpoveď a údaj o prehliadači.'),
    ('legal.visitors.what', 'Náhodný kľúč, ktorý si uchováva tento prehliadač, a na serveri pod ním to, čo hráš - uložená hra každého kvízu, dokončené otázky, tvoje štatistiky - a kedy kľúč vznikol a kedy bol naposledy použitý. Server si z kľúča uchováva iba odvodený kód (hash), nikdy samotný kľúč.'),
    ('legal.visitors.kept', '{days} dní od tvojej poslednej návštevy, potom sa zmaže. Keď sa tu prihlásiš, presunie sa do tvojho účtu - po prihlásení bez kliknutia iba do účtu, ktorý tu ešte nič nemá.'),
    ('legal.feedback.what', 'Čo príde s formulárom spätnej väzby: jej druh (chyba, nápad alebo niečo iné), časť stránky, ktorej sa týka, predmet, správa a to, na čo sa formulár ešte pýta (pri chybe kroky, ako ju vyvolať, čo sa malo stať a tvoj prehliadač a zariadenie; pri nápade, prečo je dôležitý); stránka, z ktorej bola odoslaná, jej jazyk a prehliadač, z ktorého prišla; účet odosielateľa, ak nebola odoslaná bez mena; a adresa na odpoveď, iba ak ju odosielateľ nechá - prihlásenému ju formulár vyplní z účtu a dá sa vymazať.'),
    ('legal.auditLog.what', 'Čo robia redaktori a správcovia stránky na jej administrátorských stránkach - obsah z hry, návody, texty, nastavenia, súbory, zmazané hry človeka alebo správa: kto to urobil (ID jeho účtu a ktoré prihlásenie), čo sa zmenilo a kedy.'),
    ('legal.storage.signInUnderWay.purpose', 'Prihlásenie, ktoré práve prebieha: čo potrebuje na dokončenie, keď ťa účet anotoki pošle späť, a verejné nastavenia účtu anotoki.'),
    ('legal.storage.signInUnderWay.kept', 'Kým sa prihlásenie nedokončí; nastavenia najviac hodinu. Po zatvorení karty zmiznú.'),
    ('legal.storage.silent.purpose', 'Že tvoje prihlásenie tu prebehlo bez kliknutia (podľa signálu účtu anotoki) a pre ktorý účet: hry bez účtu sa potom presunú iba do účtu, ktorý tu ešte nič nemá.'),
    ('legal.storage.silent.kept', 'Kým sa tu neprihlásiš vlastným kliknutím.'),
    ('legal.storage.tabLanguage.purpose', 'Jazyk vyžiadaný v adrese stránky (?lang=), iba pre túto kartu.'),
    ('legal.storage.untilTabClosed', 'Kým kartu nezatvoríš.'),
    ('legal.storage.visitorKey.kept', 'Kým sa tu neprihlásiš a jeho obsah sa nepresunie do tvojho účtu, kým ho stránka nezabudne ({days} dní bez návštevy) alebo kým nevymažeš údaje stránky v prehliadači.'),
    ('legal.storage.browserGames.purpose', 'Hry z kvízov, ktoré si tento prehliadač uchováva sám, kým ich pre teba neuchováva stránka (pred tvojou prvou odpoveďou alebo keď už neprijíma ďalších hráčov bez účtu), a obťažnosť, ktorú si zvolíš.'),
    ('legal.storage.browserGames.kept', 'Kým nevymažeš údaje stránky v prehliadači; hry sa presunú na stránku, keď ich pre teba začne uchovávať.'),
    ('legal.storage.version.purpose', 'Najnovšia verzia, ktorú tento prehliadač už ukázal, aby sa Čo je nové otvorilo pri každej novej len raz.'),
    ('legal.storage.background.purpose', 'Pozadie, ktoré si vyberieš.'),
    ('legal.storage.announcement.purpose', 'Oznam, ktorý zavrieš, aby zostal zavretý.'),
    ('legal.storage.announcement.kept', 'Do ďalšieho oznamu alebo kým nevymažeš údaje stránky v prehliadači.'),
    ('legal.storage.drafts.purpose', 'Pre redaktorov stránky: texty napísané na administrátorskej stránke Translations, ktoré ešte nie sú uložené.'),
    ('legal.storage.drafts.kept', 'Kým sa neuložia alebo nezahodia, alebo kým kartu nezatvoríš.'),
    ('legal.storage.untilCleared', 'Kým nevymažeš údaje stránky v prehliadači.'),
    ('legal.storage.untilChosenAgain', 'Kým nezvolíš iné alebo nevymažeš údaje stránky v prehliadači.'),
    ('footer.fanDisclaimer', 'Táto stránka je fanúšikovský projekt a nie je prepojená so spoločnosťou HoYoverse ani ňou schválená.')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

-----------------------------------------------------------
-- PROVE IT
--
-- Every one of the 44 keys reads in both languages, and a
-- placeholder of the English is in the Slovak too.
-----------------------------------------------------------

DO $$
DECLARE
    missing TEXT;
    unplaced TEXT;
BEGIN
    SELECT string_agg(k.name, ', ' ORDER BY k.name) INTO missing
      FROM (VALUES
          ('legal.site'),
          ('legal.about'),
          ('legal.record.name'),
          ('legal.record.what'),
          ('legal.record.why'),
          ('legal.record.kept'),
          ('legal.games.name'),
          ('legal.games.what'),
          ('legal.games.why'),
          ('legal.games.kept'),
          ('legal.staff.name'),
          ('legal.staff.what'),
          ('legal.staff.why'),
          ('legal.staff.kept'),
          ('legal.limits.name'),
          ('legal.limits.what'),
          ('legal.limits.why'),
          ('legal.limits.kept'),
          ('legal.oldCopies.name'),
          ('legal.oldCopies.what'),
          ('legal.oldCopies.why'),
          ('legal.oldCopies.kept'),
          ('legal.visitors.what'),
          ('legal.visitors.kept'),
          ('legal.feedback.what'),
          ('legal.auditLog.what'),
          ('legal.storage.signInUnderWay.purpose'),
          ('legal.storage.signInUnderWay.kept'),
          ('legal.storage.silent.purpose'),
          ('legal.storage.silent.kept'),
          ('legal.storage.tabLanguage.purpose'),
          ('legal.storage.untilTabClosed'),
          ('legal.storage.visitorKey.kept'),
          ('legal.storage.browserGames.purpose'),
          ('legal.storage.browserGames.kept'),
          ('legal.storage.version.purpose'),
          ('legal.storage.background.purpose'),
          ('legal.storage.announcement.purpose'),
          ('legal.storage.announcement.kept'),
          ('legal.storage.drafts.purpose'),
          ('legal.storage.drafts.kept'),
          ('legal.storage.untilCleared'),
          ('legal.storage.untilChosenAgain'),
          ('footer.fanDisclaimer')
      ) AS k(name)
     WHERE NOT EXISTS (SELECT 1 FROM translation_keys tk WHERE tk.name = k.name)
        OR NOT EXISTS (SELECT 1 FROM translations t WHERE t.key_name = k.name AND t.language_code = 'en' AND btrim(t.value) <> '')
        OR NOT EXISTS (SELECT 1 FROM translations t WHERE t.key_name = k.name AND t.language_code = 'sk' AND btrim(t.value) <> '');
    IF missing IS NOT NULL THEN
        RAISE EXCEPTION 'users/055: keys without an English and a Slovak string: %', missing;
    END IF;

    SELECT string_agg(en.key_name, ', ' ORDER BY en.key_name) INTO unplaced
      FROM translations en
      JOIN translations sk ON sk.key_name = en.key_name AND sk.language_code = 'sk'
     WHERE en.language_code = 'en'
       AND en.key_name IN ('legal.visitors.kept', 'legal.storage.visitorKey.kept')
       AND (position('{days}' IN en.value) = 0 OR position('{days}' IN sk.value) = 0);
    IF unplaced IS NOT NULL THEN
        RAISE EXCEPTION 'users/055: {days} missing from a string of %', unplaced;
    END IF;
END $$;
