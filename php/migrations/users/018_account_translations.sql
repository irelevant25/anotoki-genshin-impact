-----------------------------------------------------------
-- SIGNING UP, AND PROVING THE ADDRESS IS YOURS
--
-- The strings for the register modal, the forgotten-password modal, and the
-- two pages the emailed links land on - plus four additions to the login
-- modal, which has gained a way to reach both of the others and a state it
-- never had before: right password, address never confirmed.
--
-- The bodies of the messages themselves are not here. They live in
-- php/api/mail.php, translated the same two ways but kept in code, because a
-- mail body is a multi-line template with a link in the middle of it - awkward
-- in the translation grid, and easy to break in a way nobody notices until
-- somebody stops receiving their password reset.
-----------------------------------------------------------

INSERT INTO translation_keys (name, description, site) VALUES
    ('account.register.title', 'Heading of the register modal', 'genshin_impact'),
    ('account.register.username', 'Register form field', 'genshin_impact'),
    ('account.register.usernamePlaceholder', 'Placeholder in that field', 'genshin_impact'),
    ('account.register.passwordHint', 'Under the password field - {count} is the shortest it may be', 'genshin_impact'),
    ('account.register.passwordAgain', 'Register form field - the password typed a second time', 'genshin_impact'),
    ('account.register.passwordMismatch', 'Shown when the two passwords differ', 'genshin_impact'),
    ('account.register.passwordTooShort', 'Shown when the password is under the minimum', 'genshin_impact'),
    ('account.register.action', 'Button that creates the account', 'genshin_impact'),
    ('account.register.working', 'Loader text while the account is being created', 'genshin_impact'),
    ('account.register.failed', 'Fallback when the server refused for no reason worth showing', 'genshin_impact'),
    ('account.register.sent', 'After registering - {email} is where the confirmation went', 'genshin_impact'),
    ('account.register.sentNote', 'Under that, saying the account cannot be used until the link is opened', 'genshin_impact'),
    ('account.register.notSent', 'After registering, when the message could not be sent - {email} is the address', 'genshin_impact'),
    ('account.register.notSentNote', 'Under that, saying the account exists and the message can be asked for again', 'genshin_impact'),

    ('account.confirm.working', 'While the confirmation link is being checked', 'genshin_impact'),
    ('account.confirm.doneTitle', 'Heading once the address is confirmed', 'genshin_impact'),
    ('account.confirm.doneText', 'Under it - the account is now signed in', 'genshin_impact'),
    ('account.confirm.doneAction', 'Button back to the site from any of these pages', 'genshin_impact'),
    ('account.confirm.failedTitle', 'Heading when the link did not work', 'genshin_impact'),
    ('account.confirm.failedText', 'Under it - expired, already used, or never issued', 'genshin_impact'),
    ('account.confirm.failedNote', 'Under that, saying another can be asked for from the login form', 'genshin_impact'),
    ('account.confirm.missingTitle', 'Heading when the page was opened with no token at all', 'genshin_impact'),
    ('account.confirm.missingText', 'Under it', 'genshin_impact'),
    ('account.confirm.resendAction', 'Button that asks for the confirmation message again', 'genshin_impact'),
    ('account.confirm.resent', 'Notification once it has been asked for', 'genshin_impact'),
    ('account.confirm.resendFailed', 'Notification when that request itself failed', 'genshin_impact'),

    ('account.reset.title', 'Heading of the forgotten-password modal', 'genshin_impact'),
    ('account.reset.lead', 'Above the address field in it', 'genshin_impact'),
    ('account.reset.action', 'Button that asks for the reset link', 'genshin_impact'),
    ('account.reset.asked', 'After asking - deliberately says nothing about whether an account was found', 'genshin_impact'),
    ('account.reset.askedNote', 'Under that, on what to do if nothing arrives', 'genshin_impact'),
    ('account.reset.newTitle', 'Heading of the page the reset link lands on', 'genshin_impact'),
    ('account.reset.newText', 'Under it', 'genshin_impact'),
    ('account.reset.newPassword', 'The new password field on that page', 'genshin_impact'),
    ('account.reset.saveAction', 'Button that sets the new password', 'genshin_impact'),
    ('account.reset.linkDead', 'Shown when the reset link has expired or been used', 'genshin_impact'),
    ('account.reset.doneTitle', 'Heading once the new password is set', 'genshin_impact'),
    ('account.reset.doneText', 'Under it - the account is now signed in', 'genshin_impact'),
    ('account.reset.missingText', 'Shown when the reset page was opened with no token', 'genshin_impact'),

    ('login.forgotPassword', 'Link in the login modal to the forgotten-password modal', 'genshin_impact'),
    ('login.noAccount', 'Link in the login modal to the register modal', 'genshin_impact'),
    ('login.unconfirmed', 'Shown when the password was right but the address is not confirmed', 'genshin_impact'),
    ('login.success', 'Notification after signing in', 'genshin_impact'),
    ('login.failed', 'Shown under the login form when the credentials were refused', 'genshin_impact')
ON CONFLICT (name) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'en', v.value FROM (VALUES
    ('account.register.title', 'Create an account'),
    ('account.register.username', 'Username'),
    ('account.register.usernamePlaceholder', 'What you would like to be called'),
    ('account.register.passwordHint', 'At least {count} characters.'),
    ('account.register.passwordAgain', 'Password again'),
    ('account.register.passwordMismatch', 'The two passwords do not match.'),
    ('account.register.passwordTooShort', 'That password is too short.'),
    ('account.register.action', 'Create account'),
    ('account.register.working', 'Creating your account'),
    ('account.register.failed', 'The account could not be created.'),
    ('account.register.sent', 'Check {email} for a message from us.'),
    ('account.register.sentNote', 'Open the link in it to confirm the address. Until then the account cannot be signed in to.'),
    ('account.register.notSent', 'Your account was created, but the message to {email} could not be sent.'),
    ('account.register.notSentNote', 'Nothing is lost - ask for it again below, and check the address was right.'),

    ('account.confirm.working', 'Confirming your address'),
    ('account.confirm.doneTitle', 'That is confirmed'),
    ('account.confirm.doneText', 'Your account is ready and you are signed in.'),
    ('account.confirm.doneAction', 'Go to the site'),
    ('account.confirm.failedTitle', 'That link did not work'),
    ('account.confirm.failedText', 'It may have expired, or already been used.'),
    ('account.confirm.failedNote', 'Try signing in - if the address still needs confirming, you can ask for a new link there.'),
    ('account.confirm.missingTitle', 'Nothing to confirm'),
    ('account.confirm.missingText', 'This page is where a confirmation link lands, and there was no link in it.'),
    ('account.confirm.resendAction', 'Send it again'),
    ('account.confirm.resent', 'If that address needs confirming, another message is on its way.'),
    ('account.confirm.resendFailed', 'That could not be sent. Try again in a moment.'),

    ('account.reset.title', 'Forgotten password'),
    ('account.reset.lead', 'Tell us the address on the account and we will send a link to set a new password.'),
    ('account.reset.action', 'Send the link'),
    ('account.reset.asked', 'If that address has an account, a link is on its way.'),
    ('account.reset.askedNote', 'Nothing arrived? Check the address, and look in your spam folder.'),
    ('account.reset.newTitle', 'Set a new password'),
    ('account.reset.newText', 'Choose one and you will be signed in with it.'),
    ('account.reset.newPassword', 'New password'),
    ('account.reset.saveAction', 'Save password'),
    ('account.reset.linkDead', 'That link has expired or already been used. Ask for another from the login form.'),
    ('account.reset.doneTitle', 'Password changed'),
    ('account.reset.doneText', 'You are signed in with your new password.'),
    ('account.reset.missingText', 'This page is where a reset link lands, and there was no link in it.'),

    ('login.forgotPassword', 'Forgotten your password?'),
    ('login.noAccount', 'Create an account'),
    ('login.unconfirmed', 'Confirm your email address before signing in.'),
    ('login.success', 'You are signed in.'),
    ('login.failed', 'That email address and password do not match an account.')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'sk', v.value FROM (VALUES
    ('account.register.title', 'Vytvorenie účtu'),
    ('account.register.username', 'Používateľské meno'),
    ('account.register.usernamePlaceholder', 'Ako ťa máme volať'),
    ('account.register.passwordHint', 'Aspoň {count} znakov.'),
    ('account.register.passwordAgain', 'Heslo znova'),
    ('account.register.passwordMismatch', 'Heslá sa nezhodujú.'),
    ('account.register.passwordTooShort', 'Toto heslo je príliš krátke.'),
    ('account.register.action', 'Vytvoriť účet'),
    ('account.register.working', 'Vytvárame ti účet'),
    ('account.register.failed', 'Účet sa nepodarilo vytvoriť.'),
    ('account.register.sent', 'Pozri sa do schránky {email}, poslali sme ti správu.'),
    ('account.register.sentNote', 'Otvor v nej odkaz a potvrď adresu. Dovtedy sa do účtu nedá prihlásiť.'),
    ('account.register.notSent', 'Účet sme vytvorili, ale správu na {email} sa nepodarilo odoslať.'),
    ('account.register.notSentNote', 'Nič nie je stratené - požiadaj o ňu nižšie znova a skontroluj, či je adresa správna.'),

    ('account.confirm.working', 'Potvrdzujeme tvoju adresu'),
    ('account.confirm.doneTitle', 'Adresa je potvrdená'),
    ('account.confirm.doneText', 'Účet je pripravený a si prihlásený.'),
    ('account.confirm.doneAction', 'Prejsť na stránku'),
    ('account.confirm.failedTitle', 'Odkaz nefungoval'),
    ('account.confirm.failedText', 'Mohol vypršať alebo už bol použitý.'),
    ('account.confirm.failedNote', 'Skús sa prihlásiť - ak adresa ešte čaká na potvrdenie, tam si vyžiadaš nový odkaz.'),
    ('account.confirm.missingTitle', 'Niet čo potvrdiť'),
    ('account.confirm.missingText', 'Na túto stránku vedie potvrdzovací odkaz a žiadny v nej nebol.'),
    ('account.confirm.resendAction', 'Poslať znova'),
    ('account.confirm.resent', 'Ak tá adresa čaká na potvrdenie, správa je na ceste.'),
    ('account.confirm.resendFailed', 'Správu sa nepodarilo odoslať. Skús to o chvíľu znova.'),

    ('account.reset.title', 'Zabudnuté heslo'),
    ('account.reset.lead', 'Napíš adresu, na ktorú je účet vedený, a pošleme odkaz na nastavenie nového hesla.'),
    ('account.reset.action', 'Poslať odkaz'),
    ('account.reset.asked', 'Ak k tej adrese patrí účet, odkaz je na ceste.'),
    ('account.reset.askedNote', 'Nič neprišlo? Skontroluj adresu a pozri sa aj do spamu.'),
    ('account.reset.newTitle', 'Nastavenie nového hesla'),
    ('account.reset.newText', 'Zvoľ si ho a rovno ťa s ním prihlásime.'),
    ('account.reset.newPassword', 'Nové heslo'),
    ('account.reset.saveAction', 'Uložiť heslo'),
    ('account.reset.linkDead', 'Odkaz vypršal alebo už bol použitý. Vyžiadaj si nový z prihlasovacieho formulára.'),
    ('account.reset.doneTitle', 'Heslo je zmenené'),
    ('account.reset.doneText', 'Si prihlásený s novým heslom.'),
    ('account.reset.missingText', 'Na túto stránku vedie odkaz na zmenu hesla a žiadny v nej nebol.'),

    ('login.forgotPassword', 'Zabudol si heslo?'),
    ('login.noAccount', 'Vytvoriť účet'),
    ('login.unconfirmed', 'Pred prihlásením potvrď svoju emailovú adresu.'),
    ('login.success', 'Si prihlásený.'),
    ('login.failed', 'K tejto adrese a heslu nepatrí žiadny účet.')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;
