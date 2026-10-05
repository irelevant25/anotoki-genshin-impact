-----------------------------------------------------------
-- PLAYING WITHOUT SIGNING IN
--
-- While the IAM does not require signing in here, somebody who plays without
-- signing in is a visitor (users/045, api/visitors.php): the server keeps their
-- games and statistics for this browser, deletes them after `keep_days`
-- without a visit, and moves them into the account at their next sign-in.
-- These are the words they meet about it: the notice on the Profile, the Daily
-- page and the quizzes hub ({days} is the server's keep_days), the toasts the
-- public site's shell shows once, and a line on the sign-in card. Its button is
-- the existing 'common.signIn'.
-- Shared by the family ('common'): a Star Rail deployment keeps visitors the
-- same way. The Slovak addresses the reader as "ty", never gendered.
-----------------------------------------------------------

INSERT INTO translation_keys (name, description, site) VALUES
    ('visitor.notice', 'Notice on the Profile, the Daily page and the quizzes hub for somebody playing without signing in, beside a Sign in button - {days} is how many days their games are kept after their last visit', 'common'),
    ('visitor.moved', 'Toast after a sign-in that brought what was played without signing in into the account', 'common'),
    ('visitor.kept', 'Added to that toast when the account already had its own game of a quiz, which was kept instead', 'common'),
    ('visitor.lost', 'Toast when the server no longer keeps this browser''s games played without signing in - {days} is how many days unseen ended them', 'common'),
    ('visitor.full', 'Toast when somebody playing without signing in has recorded as many results as a visitor may', 'common'),
    ('visitor.busy', 'Toast when too many people play without signing in and this browser''s games stay in the browser only', 'common'),
    ('visitor.comesWith', 'Line on the sign-in card when this browser played without signing in before signing in became required', 'common')
ON CONFLICT (name) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'en', v.value FROM (VALUES
    ('visitor.notice', 'You are playing without signing in. Your games and statistics are kept for this browser for {days} days after your last visit - sign in to keep them in your account for good.'),
    ('visitor.moved', 'Your games and statistics from playing without signing in are now in your account.'),
    ('visitor.kept', 'Where your account already had a game of the same quiz, that one stayed.'),
    ('visitor.lost', 'The games this browser played without signing in are no longer kept: {days} days went by without a visit, or they were moved into an account.'),
    ('visitor.full', 'This browser has recorded as many results as it can without signing in. Your games are still kept - sign in and your statistics keep growing.'),
    ('visitor.busy', 'Too many people are playing without signing in just now, so your games stay in this browser only. Sign in, or come back later.'),
    ('visitor.comesWith', 'Your games and statistics from playing without signing in come with you when you sign in.')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'sk', v.value FROM (VALUES
    ('visitor.notice', 'Hráš bez prihlásenia. Tvoje hry a štatistiky sa pre tento prehliadač uchovávajú {days} dní od tvojej poslednej návštevy - prihlás sa a zostanú ti natrvalo v účte.'),
    ('visitor.moved', 'Tvoje hry a štatistiky bez prihlásenia sú teraz v tvojom účte.'),
    ('visitor.kept', 'Kde už mal tvoj účet rozohranú hru toho istého kvízu, zostala tá z účtu.'),
    ('visitor.lost', 'Hry z tohto prehliadača bez prihlásenia sa už neuchovávajú: uplynulo {days} dní bez návštevy, alebo sa presunuli do účtu.'),
    ('visitor.full', 'Tento prehliadač už bez prihlásenia uložil toľko výsledkov, koľko sa dá. Hry sa ukladajú ďalej - prihlás sa a tvoje štatistiky budú rásť.'),
    ('visitor.busy', 'Práve teraz hrá bez prihlásenia priveľa ľudí, preto tvoje hry zostávajú len v tomto prehliadači. Prihlás sa alebo sa vráť neskôr.'),
    ('visitor.comesWith', 'Hry a štatistiky bez prihlásenia si po prihlásení vezmeš so sebou.')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

-----------------------------------------------------------
-- PROVE IT
--
-- Every key reads in both languages, and belongs to the whole family.
-----------------------------------------------------------

DO $$
DECLARE
    missing TEXT;
BEGIN
    SELECT string_agg(k.name, ', ' ORDER BY k.name) INTO missing
      FROM (VALUES
          ('visitor.notice'), ('visitor.moved'), ('visitor.kept'), ('visitor.lost'),
          ('visitor.full'), ('visitor.busy'), ('visitor.comesWith')
      ) AS k(name)
     WHERE NOT EXISTS (SELECT 1 FROM translation_keys tk WHERE tk.name = k.name AND tk.site = 'common')
        OR NOT EXISTS (SELECT 1 FROM translations t WHERE t.key_name = k.name AND t.language_code = 'en')
        OR NOT EXISTS (SELECT 1 FROM translations t WHERE t.key_name = k.name AND t.language_code = 'sk');
    IF missing IS NOT NULL THEN
        RAISE EXCEPTION 'keys without an English and a Slovak string, or not common: %', missing;
    END IF;
END $$;
