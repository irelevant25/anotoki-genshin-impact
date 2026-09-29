-----------------------------------------------------------
-- THE STRINGS AFTER THE ACCOUNTS MOVED TO THE IAM
--
-- Signing in is the anotoki IAM's now (migration 040). The site sends people
-- there and back; the sign-in and registration forms, the reset and
-- confirmation pages, two-factor, Google, remembered devices and the sessions
-- list are all on the IAM's own pages, in its own words. Their strings here
-- have nothing left to be drawn on.
--
-- What the site says now is short: a way to the IAM ("Sign in", "Create
-- account"), a link to the IAM's account page for everything about the
-- account itself, a note that signing out is everywhere at once, the page a
-- sign-in lands on when it did not work, and the page the admin panel is for
-- somebody who is not one of its editors or admins.
--
-- Every key removed below was checked against the frontend first: none of
-- them is asked for by anything in angular/src any more. Deleting a key takes
-- its translations with it - translations.key_name is ON DELETE CASCADE.
-----------------------------------------------------------

-----------------------------------------------------------
-- ONE THAT OUTLIVED ITS FAMILY
--
-- The feedback form borrowed the sign-in form's address placeholder. The form
-- it was named for is gone, so it takes the name of the one it is on - an
-- UPDATE, so the strings follow it in every language (ON UPDATE CASCADE).
-- Guarded, so a second run finds nothing to rename rather than a collision.
-----------------------------------------------------------

UPDATE translation_keys
   SET name = 'feedback.emailPlaceholder',
       description = 'Placeholder of the email field on the feedback form'
 WHERE name = 'login.emailPlaceholder'
   AND NOT EXISTS (SELECT 1 FROM translation_keys WHERE name = 'feedback.emailPlaceholder');

-----------------------------------------------------------
-- WHAT NOTHING ASKS FOR ANY MORE
--
-- Whole families first - the sign-in form, registration, the reset and
-- confirmation pages, the ways into an account, two-factor, remembered
-- devices and the sessions list - then the stragglers: the email-confirmed
-- badge, whose answer is the IAM's now; "Login"/"Logout"/"Sign up", replaced
-- by keys that say what the buttons do now; and "Yes"/"No", which only the
-- sessions list asked with.
-----------------------------------------------------------

DELETE FROM translation_keys
 WHERE name LIKE 'login.%'
    OR name LIKE 'account.register.%'
    OR name LIKE 'account.reset.%'
    OR name LIKE 'account.confirm.%'
    OR name LIKE 'account.methods.%'
    OR name LIKE 'account.twoFactor.%'
    OR name LIKE 'account.devices.%'
    OR name LIKE 'account.sessions.%';

DELETE FROM translation_keys WHERE name IN (
    'account.confirmed',
    'account.unconfirmed',
    'common.login',
    'common.logout',
    'common.signUp',
    'common.yes',
    'common.no'
);

-- "Opens the login dialog" is no longer what it does.
UPDATE translation_keys
   SET description = 'Button that sends the reader to the anotoki IAM to sign in'
 WHERE name = 'common.signIn';

-----------------------------------------------------------
-- WHAT THE SITE SAYS NOW
--
-- Shared by every site in the family ('common') except the one about date
-- formats, which sits with the rest of its family on this site. The role
-- names are the three this site's API hands back - ADMIN, EDITOR, or USER for
-- somebody with no role here - as words rather than as codes.
-----------------------------------------------------------

INSERT INTO translation_keys (name, description, site) VALUES
    ('account.createAccount', 'Button in the account panel that opens the IAM on its registration form', 'common'),
    ('account.signOut', 'Button in the account panel that signs out at the IAM', 'common'),
    ('account.signOutNote', 'Line in the account panel saying that signing out is on every anotoki site at once', 'common'),
    ('account.manage', 'Link in the account panel to the IAM''s account page', 'common'),
    ('account.manageNote', 'Line under that link saying what is managed there', 'common'),
    ('account.iamLead', 'Shown to somebody signed out: what they will sign in with', 'common'),
    ('account.roleName.admin', 'The ADMIN role, as the account panel names it', 'common'),
    ('account.roleName.editor', 'The EDITOR role, as the account panel names it', 'common'),
    ('account.roleName.user', 'Somebody with no role on the site, as the account panel names them', 'common'),
    ('account.formats.failed', 'Notification when a date or time format could not be saved', 'genshin_impact'),
    ('auth.startFailed', 'Notification when the browser would not let a sign-in start', 'common'),
    ('auth.unavailable', 'Shown when the site could not learn where to sign people in', 'common'),
    ('auth.callback.title', 'Title of the page a sign-in lands on when it did not work', 'common'),
    ('auth.callback.cancelled', 'Why: the person cancelled the sign-in at the IAM', 'common'),
    ('auth.callback.expired', 'Why: the sign-in did not start in this tab, or took too long', 'common'),
    ('auth.callback.failed', 'Why: anything else - the code could not be exchanged, the IAM refused', 'common'),
    ('auth.callback.code', 'The error code, for whoever gets asked about it - {code}', 'common'),
    ('auth.callback.retry', 'Button that starts the sign-in again', 'common'),
    ('auth.callback.back', 'Button that goes back to the page the sign-in started from', 'common'),
    ('admin.noAccess.title', 'Title of the admin panel for somebody signed in without a role there', 'common'),
    ('admin.noAccess.text', 'What that page says - {username} is who they are signed in as', 'common'),
    ('admin.noAccess.switch', 'Button that signs in again, as a different account', 'common'),
    ('admin.noAccess.signInTitle', 'Title of the admin panel for somebody not signed in', 'common'),
    ('admin.noAccess.signInText', 'What that page says', 'common'),
    ('admin.noAccess.back', 'Link from the admin panel back to the site', 'common')
ON CONFLICT (name) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'en', v.value FROM (VALUES
    ('account.createAccount', 'Create account'),
    ('account.signOut', 'Sign out'),
    ('account.signOutNote', 'Signing out signs you out of every anotoki site at once.'),
    ('account.manage', 'Manage your anotoki account'),
    ('account.manageNote', 'Password, two-factor authentication, Google and where you are signed in'),
    ('account.iamLead', 'You sign in with an anotoki account - the same one for every anotoki site.'),
    ('account.roleName.admin', 'Administrator'),
    ('account.roleName.editor', 'Editor'),
    ('account.roleName.user', 'Player'),
    ('account.formats.failed', 'That could not be saved. Try again in a moment.'),
    ('auth.startFailed', 'Signing in could not start in this browser - it may be blocking the site from storing data.'),
    ('auth.unavailable', 'The site cannot reach its sign-in service right now. Try again in a moment.'),
    ('auth.callback.title', 'Signing in did not work'),
    ('auth.callback.cancelled', 'The sign-in was cancelled before it finished. Nothing has changed.'),
    ('auth.callback.expired', 'That sign-in did not start in this browser tab, or took too long. Nothing has changed - just try again.'),
    ('auth.callback.failed', 'Something went wrong between this site and the anotoki sign-in. Nothing has changed - just try again.'),
    ('auth.callback.code', 'Error code: {code}'),
    ('auth.callback.retry', 'Try again'),
    ('auth.callback.back', 'Go back'),
    ('admin.noAccess.title', 'No access to the admin panel'),
    ('admin.noAccess.text', 'You are signed in as {username}, and that account has no role on this site. The admin panel is for its editors and administrators.'),
    ('admin.noAccess.switch', 'Sign in as someone else'),
    ('admin.noAccess.signInTitle', 'Sign in to the admin panel'),
    ('admin.noAccess.signInText', 'The admin panel is for this site''s editors and administrators. Sign in with your anotoki account to continue.'),
    ('admin.noAccess.back', 'Back to the site')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'sk', v.value FROM (VALUES
    ('account.createAccount', 'Vytvoriť účet'),
    ('account.signOut', 'Odhlásiť sa'),
    ('account.signOutNote', 'Odhlásenie vás odhlási zo všetkých stránok anotoki naraz.'),
    ('account.manage', 'Spravovať účet anotoki'),
    ('account.manageNote', 'Heslo, dvojfaktorové overenie, Google a kde všade ste prihlásený'),
    ('account.iamLead', 'Prihlasujete sa účtom anotoki - tým istým pre všetky stránky anotoki.'),
    ('account.roleName.admin', 'Administrátor'),
    ('account.roleName.editor', 'Editor'),
    ('account.roleName.user', 'Hráč'),
    ('account.formats.failed', 'Nepodarilo sa to uložiť. Skúste to o chvíľu znova.'),
    ('auth.startFailed', 'Prihlásenie sa v tomto prehliadači nepodarilo spustiť - možno stránke nedovoľuje ukladať údaje.'),
    ('auth.unavailable', 'Stránka sa teraz nevie spojiť so službou prihlásenia. Skúste to o chvíľu znova.'),
    ('auth.callback.title', 'Prihlásenie sa nepodarilo'),
    ('auth.callback.cancelled', 'Prihlásenie bolo zrušené skôr, ako sa dokončilo. Nič sa nezmenilo.'),
    ('auth.callback.expired', 'Toto prihlásenie nezačalo v tejto karte prehliadača alebo trvalo príliš dlho. Nič sa nezmenilo - stačí to skúsiť znova.'),
    ('auth.callback.failed', 'Medzi touto stránkou a prihlásením anotoki sa niečo pokazilo. Nič sa nezmenilo - stačí to skúsiť znova.'),
    ('auth.callback.code', 'Kód chyby: {code}'),
    ('auth.callback.retry', 'Skúsiť znova'),
    ('auth.callback.back', 'Späť'),
    ('admin.noAccess.title', 'Bez prístupu do administrácie'),
    ('admin.noAccess.text', 'Ste prihlásený ako {username} a tento účet nemá na tejto stránke žiadnu rolu. Administrácia je určená jej editorom a administrátorom.'),
    ('admin.noAccess.switch', 'Prihlásiť sa iným účtom'),
    ('admin.noAccess.signInTitle', 'Prihlásenie do administrácie'),
    ('admin.noAccess.signInText', 'Administrácia je určená editorom a administrátorom tejto stránky. Pokračujte prihlásením účtom anotoki.'),
    ('admin.noAccess.back', 'Späť na stránku')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

-----------------------------------------------------------
-- PROVE IT
--
-- Nothing of the removed families is left, every new key reads in both
-- languages, and the renamed placeholder brought its English with it.
-----------------------------------------------------------

DO $$
DECLARE
    leftover TEXT;
    missing  TEXT;
BEGIN
    SELECT string_agg(name, ', ' ORDER BY name) INTO leftover
      FROM translation_keys
     WHERE name LIKE 'login.%'
        OR name LIKE 'account.register.%'
        OR name LIKE 'account.reset.%'
        OR name LIKE 'account.confirm.%'
        OR name LIKE 'account.methods.%'
        OR name LIKE 'account.twoFactor.%'
        OR name LIKE 'account.devices.%'
        OR name LIKE 'account.sessions.%'
        OR name IN ('account.confirmed', 'account.unconfirmed', 'common.login', 'common.logout',
                    'common.signUp', 'common.yes', 'common.no');
    IF leftover IS NOT NULL THEN
        RAISE EXCEPTION 'keys nothing asks for are still here: %', leftover;
    END IF;

    SELECT string_agg(k.name, ', ' ORDER BY k.name) INTO missing
      FROM (VALUES
          ('account.createAccount'), ('account.signOut'), ('account.signOutNote'), ('account.manage'),
          ('account.manageNote'), ('account.iamLead'), ('account.roleName.admin'), ('account.roleName.editor'),
          ('account.roleName.user'), ('account.formats.failed'), ('auth.startFailed'), ('auth.unavailable'),
          ('auth.callback.title'), ('auth.callback.cancelled'), ('auth.callback.expired'), ('auth.callback.failed'),
          ('auth.callback.code'), ('auth.callback.retry'), ('auth.callback.back'), ('admin.noAccess.title'),
          ('admin.noAccess.text'), ('admin.noAccess.switch'), ('admin.noAccess.signInTitle'),
          ('admin.noAccess.signInText'), ('admin.noAccess.back'), ('feedback.emailPlaceholder')
      ) AS k(name)
     WHERE NOT EXISTS (SELECT 1 FROM translations t WHERE t.key_name = k.name AND t.language_code = 'en')
        OR NOT EXISTS (SELECT 1 FROM translations t WHERE t.key_name = k.name AND t.language_code = 'sk');
    IF missing IS NOT NULL THEN
        RAISE EXCEPTION 'keys without an English and a Slovak string: %', missing;
    END IF;
END $$;
