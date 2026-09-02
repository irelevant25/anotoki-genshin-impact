-----------------------------------------------------------
-- SESSION LIST STRINGS
--
-- The section on the profile page that says where the account is signed in,
-- and where it has been.
--
-- Two families of key are built at runtime and so are invisible to
-- `php translations.php --status`, which only sees keys written out as whole
-- quoted strings. Both have to be complete or a row renders as its own key:
--
--   profile.sessions.method.*  one per value the sessions table stores in its
--                              `method` column - see migration 023
--   profile.sessions.ended.*   one per `revoked_reason`, plus .expired for a
--                              session that simply ran out
-----------------------------------------------------------

INSERT INTO translation_keys (name, description, site) VALUES
    ('profile.sessions.title', 'Heading of the session list on the profile page', 'genshin_impact'),
    ('profile.sessions.none', 'Shown when there are no sessions to list at all', 'genshin_impact'),
    ('profile.sessions.failed', 'Shown when the list itself could not be loaded', 'genshin_impact'),
    ('profile.sessions.failedAttempts', 'Above the list - {count} failed sign-ins since the last successful one', 'genshin_impact'),
    ('profile.sessions.started', 'Label before the time a session began', 'genshin_impact'),
    ('profile.sessions.lastSeen', 'Label before the time a live session was last used', 'genshin_impact'),
    ('profile.sessions.thisDevice', 'Marks the session reading the page', 'genshin_impact'),
    ('profile.sessions.active', 'Marks a session that is still live but is not this one', 'genshin_impact'),
    ('profile.sessions.expired', 'Marks a session that ran out on its own', 'genshin_impact'),
    ('profile.sessions.unknownBrowser', 'Stands in when the request carried no user agent', 'genshin_impact'),
    ('profile.sessions.end', 'Button that ends one other session', 'genshin_impact'),
    ('profile.sessions.endedOne', 'Notification after ending one', 'genshin_impact'),
    ('profile.sessions.endOthers', 'Button that ends every session but this one', 'genshin_impact'),
    ('profile.sessions.endedOthers', 'Notification after that', 'genshin_impact'),

    ('profile.sessions.method.password', 'How a session was signed in - built at runtime from the method column', 'genshin_impact'),
    ('profile.sessions.method.login_code', 'How a session was signed in - an emailed code', 'genshin_impact'),
    ('profile.sessions.method.google', 'How a session was signed in - Google', 'genshin_impact'),
    ('profile.sessions.method.email_link', 'How a session was signed in - a confirmation or reset link', 'genshin_impact'),

    ('profile.sessions.ended.signed_out', 'Why a session ended - built at runtime from revoked_reason', 'genshin_impact'),
    ('profile.sessions.ended.signed_out_elsewhere', 'Why a session ended - ended from another device', 'genshin_impact'),
    ('profile.sessions.ended.password_changed', 'Why a session ended - the password was changed', 'genshin_impact'),
    ('profile.sessions.ended.security_change', 'Why a session ended - two-factor was turned on or off', 'genshin_impact')
ON CONFLICT (name) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'en', v.value FROM (VALUES
    ('profile.sessions.title', 'Where you are signed in'),
    ('profile.sessions.none', 'Nothing to show yet.'),
    ('profile.sessions.failed', 'Your sessions could not be loaded.'),
    ('profile.sessions.failedAttempts', '{count} failed sign-in attempts since you last signed in. If none of them were you, change your password.'),
    ('profile.sessions.started', 'Started'),
    ('profile.sessions.lastSeen', 'Last used'),
    ('profile.sessions.thisDevice', 'This device'),
    ('profile.sessions.active', 'Signed in'),
    ('profile.sessions.expired', 'Expired'),
    ('profile.sessions.unknownBrowser', 'Unknown browser'),
    ('profile.sessions.end', 'End'),
    ('profile.sessions.endedOne', 'That session has been ended.'),
    ('profile.sessions.endOthers', 'Sign out everywhere else'),
    ('profile.sessions.endedOthers', 'Every other session has been ended.'),

    ('profile.sessions.method.password', 'Password'),
    ('profile.sessions.method.login_code', 'Emailed code'),
    ('profile.sessions.method.google', 'Google'),
    ('profile.sessions.method.email_link', 'Emailed link'),

    ('profile.sessions.ended.signed_out', 'Signed out'),
    ('profile.sessions.ended.signed_out_elsewhere', 'Ended from another device'),
    ('profile.sessions.ended.password_changed', 'Ended by a password change'),
    ('profile.sessions.ended.security_change', 'Ended by a security change')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'sk', v.value FROM (VALUES
    ('profile.sessions.title', 'Kde si prihlásený'),
    ('profile.sessions.none', 'Zatiaľ nie je čo ukázať.'),
    ('profile.sessions.failed', 'Tvoje prihlásenia sa nepodarilo načítať.'),
    ('profile.sessions.failedAttempts', 'Od tvojho posledného prihlásenia bolo {count} neúspešných pokusov. Ak to nikdy nebol ty, zmeň si heslo.'),
    ('profile.sessions.started', 'Začalo'),
    ('profile.sessions.lastSeen', 'Naposledy použité'),
    ('profile.sessions.thisDevice', 'Toto zariadenie'),
    ('profile.sessions.active', 'Prihlásené'),
    ('profile.sessions.expired', 'Vypršalo'),
    ('profile.sessions.unknownBrowser', 'Neznámy prehliadač'),
    ('profile.sessions.end', 'Ukončiť'),
    ('profile.sessions.endedOne', 'Toto prihlásenie bolo ukončené.'),
    ('profile.sessions.endOthers', 'Odhlásiť všade inde'),
    ('profile.sessions.endedOthers', 'Všetky ostatné prihlásenia boli ukončené.'),

    ('profile.sessions.method.password', 'Heslo'),
    ('profile.sessions.method.login_code', 'Kód z emailu'),
    ('profile.sessions.method.google', 'Google'),
    ('profile.sessions.method.email_link', 'Odkaz z emailu'),

    ('profile.sessions.ended.signed_out', 'Odhlásené'),
    ('profile.sessions.ended.signed_out_elsewhere', 'Ukončené z iného zariadenia'),
    ('profile.sessions.ended.password_changed', 'Ukončené zmenou hesla'),
    ('profile.sessions.ended.security_change', 'Ukončené zmenou zabezpečenia')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;
