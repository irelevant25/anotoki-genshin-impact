-----------------------------------------------------------
-- SIGNING IN WITH GOOGLE, AND THE WAYS INTO AN ACCOUNT
--
-- Strings for the three things the second stage added: the Google button on
-- the login and register forms, the emailed sign-in code that stands in when
-- the password is not the way in, and the list on the account modal where a
-- provider is connected or disconnected and password sign-in is switched off.
--
-- Nothing here names Google's own button. That is rendered by their script
-- and carries their own wording in the visitor's own language, which is both
-- required by their branding terms and one less thing to translate.
-----------------------------------------------------------

INSERT INTO translation_keys (name, description, site) VALUES
    ('login.useCode', 'Link in the login modal - sign in with an emailed code instead', 'genshin_impact'),
    ('login.usePassword', 'Link back from the code form to the password form', 'genshin_impact'),
    ('login.codeLead', 'Above the address field, before a code has been asked for', 'genshin_impact'),
    ('login.sendCode', 'Button that asks for the code', 'genshin_impact'),
    ('login.codeSent', 'Shown once a code has been asked for - says nothing about whether an account was found', 'genshin_impact'),
    ('login.code', 'The six-digit code field', 'genshin_impact'),
    ('login.codePlaceholder', 'Placeholder in that field', 'genshin_impact'),
    ('login.codeAction', 'Button that signs in with the typed code', 'genshin_impact'),
    ('login.badCode', 'Shown when the code was wrong, expired or already used', 'genshin_impact'),
    ('login.emailFirst', 'Shown when the code is asked for with no address filled in', 'genshin_impact'),
    ('login.otherWayIn', 'Shown when the password is right but this account signs in another way', 'genshin_impact'),
    ('login.googleFailed', 'Shown when a Google sign-in could not be verified', 'genshin_impact'),

    ('account.methods.title', 'Heading of the list of ways into the account', 'genshin_impact'),
    ('account.methods.password', 'The password row in that list', 'genshin_impact'),
    ('account.methods.passwordOn', 'Under it, when a password is set and accepted', 'genshin_impact'),
    ('account.methods.passwordOff', 'Under it, when a password is set but not accepted', 'genshin_impact'),
    ('account.methods.noPassword', 'Under it, when the account has no password at all', 'genshin_impact'),
    ('account.methods.setPassword', 'Button that opens the set-a-first-password form', 'genshin_impact'),
    ('account.methods.setPasswordTitle', 'Heading of that form', 'genshin_impact'),
    ('account.methods.setPasswordLead', 'Above the fields in it', 'genshin_impact'),
    ('account.methods.passwordSet', 'Notification once the first password is set', 'genshin_impact'),
    ('account.methods.disable', 'Button that stops the password being accepted', 'genshin_impact'),
    ('account.methods.enable', 'Button that starts accepting it again', 'genshin_impact'),
    ('account.methods.passwordDisabled', 'Notification after turning it off', 'genshin_impact'),
    ('account.methods.passwordEnabled', 'Notification after turning it back on', 'genshin_impact'),
    ('account.methods.google', 'The Google row in that list', 'genshin_impact'),
    ('account.methods.googleOn', 'Under it when connected but the address is not known', 'genshin_impact'),
    ('account.methods.googleOff', 'Under it when nothing is connected', 'genshin_impact'),
    ('account.methods.disconnect', 'Button that detaches Google', 'genshin_impact'),
    ('account.methods.googleConnected', 'Notification after connecting', 'genshin_impact'),
    ('account.methods.googleDisconnected', 'Notification after disconnecting', 'genshin_impact'),
    ('account.methods.keepOne', 'Under the list, saying why one way in cannot be removed', 'genshin_impact'),
    ('account.methods.failed', 'Fallback when one of those actions failed for no reason worth showing', 'genshin_impact')
ON CONFLICT (name) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'en', v.value FROM (VALUES
    ('login.useCode', 'Email me a code instead'),
    ('login.usePassword', 'Use my password'),
    ('login.codeLead', 'We will send a code to your address. No password needed.'),
    ('login.sendCode', 'Send the code'),
    ('login.codeSent', 'If that address has an account, a code is on its way. It is good for ten minutes.'),
    ('login.code', 'Code'),
    ('login.codePlaceholder', 'The six digits from the email'),
    ('login.codeAction', 'Sign in'),
    ('login.badCode', 'That code is not right, or it has expired.'),
    ('login.emailFirst', 'Fill in your email address first.'),
    ('login.otherWayIn', 'This account signs in with Google or with an emailed code.'),
    ('login.googleFailed', 'That Google sign-in could not be completed.'),

    ('account.methods.title', 'How you sign in'),
    ('account.methods.password', 'Password'),
    ('account.methods.passwordOn', 'You can sign in with your email and password.'),
    ('account.methods.passwordOff', 'Set, but not accepted. Sign in with Google instead.'),
    ('account.methods.noPassword', 'No password on this account.'),
    ('account.methods.setPassword', 'Set a password'),
    ('account.methods.setPasswordTitle', 'Set a password'),
    ('account.methods.setPasswordLead', 'This account has no password yet. Choose one and you will be able to sign in with it as well as with Google.'),
    ('account.methods.passwordSet', 'Your password is set.'),
    ('account.methods.disable', 'Turn off'),
    ('account.methods.enable', 'Turn on'),
    ('account.methods.passwordDisabled', 'Password sign-in is off. Use Google from now on.'),
    ('account.methods.passwordEnabled', 'Password sign-in is on again.'),
    ('account.methods.google', 'Google'),
    ('account.methods.googleOn', 'Connected'),
    ('account.methods.googleOff', 'Not connected'),
    ('account.methods.disconnect', 'Disconnect'),
    ('account.methods.googleConnected', 'Google is connected to your account.'),
    ('account.methods.googleDisconnected', 'Google is no longer connected.'),
    ('account.methods.keepOne', 'You always keep at least one way to sign in, so the last one cannot be removed.'),
    ('account.methods.failed', 'That could not be done.')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'sk', v.value FROM (VALUES
    ('login.useCode', 'Radšej mi pošlite kód'),
    ('login.usePassword', 'Použiť heslo'),
    ('login.codeLead', 'Pošleme ti kód na tvoju adresu. Heslo netreba.'),
    ('login.sendCode', 'Poslať kód'),
    ('login.codeSent', 'Ak k tej adrese patrí účet, kód je na ceste. Platí desať minút.'),
    ('login.code', 'Kód'),
    ('login.codePlaceholder', 'Šesť číslic z emailu'),
    ('login.codeAction', 'Prihlásiť sa'),
    ('login.badCode', 'Tento kód nie je správny alebo už vypršal.'),
    ('login.emailFirst', 'Najprv vyplň emailovú adresu.'),
    ('login.otherWayIn', 'Do tohto účtu sa prihlasuje cez Google alebo kódom z emailu.'),
    ('login.googleFailed', 'Prihlásenie cez Google sa nepodarilo dokončiť.'),

    ('account.methods.title', 'Ako sa prihlasuješ'),
    ('account.methods.password', 'Heslo'),
    ('account.methods.passwordOn', 'Môžeš sa prihlásiť emailom a heslom.'),
    ('account.methods.passwordOff', 'Nastavené, ale neprijíma sa. Prihlás sa cez Google.'),
    ('account.methods.noPassword', 'Tento účet nemá heslo.'),
    ('account.methods.setPassword', 'Nastaviť heslo'),
    ('account.methods.setPasswordTitle', 'Nastavenie hesla'),
    ('account.methods.setPasswordLead', 'Tento účet ešte nemá heslo. Zvoľ si ho a budeš sa môcť prihlásiť ním aj cez Google.'),
    ('account.methods.passwordSet', 'Heslo je nastavené.'),
    ('account.methods.disable', 'Vypnúť'),
    ('account.methods.enable', 'Zapnúť'),
    ('account.methods.passwordDisabled', 'Prihlasovanie heslom je vypnuté. Odteraz používaj Google.'),
    ('account.methods.passwordEnabled', 'Prihlasovanie heslom je opäť zapnuté.'),
    ('account.methods.google', 'Google'),
    ('account.methods.googleOn', 'Pripojené'),
    ('account.methods.googleOff', 'Nepripojené'),
    ('account.methods.disconnect', 'Odpojiť'),
    ('account.methods.googleConnected', 'Google je pripojený k tvojmu účtu.'),
    ('account.methods.googleDisconnected', 'Google už nie je pripojený.'),
    ('account.methods.keepOne', 'Vždy ti zostane aspoň jeden spôsob prihlásenia, takže posledný sa nedá odobrať.'),
    ('account.methods.failed', 'Toto sa nepodarilo vykonať.')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;
