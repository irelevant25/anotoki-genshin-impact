-----------------------------------------------------------
-- STRINGS FOR CHANGING A PASSWORD
--
-- The account panel could set a first password and could turn password
-- sign-in off, but had nothing at all for the ordinary case of changing one
-- that exists. These are that form, and the notice it carries: changing a
-- password signs every other session out, which is worth saying before it
-- happens rather than after somebody's other laptop stops working.
--
-- The `mustChange` pair is the same form with no way out of it, for an account
-- still on the password an admin typed into a box. See migration 031.
-----------------------------------------------------------

INSERT INTO translation_keys (name, description, site) VALUES
    ('account.methods.changePassword', 'Button in the account panel that opens the change-password form', 'genshin_impact'),
    ('account.methods.changePasswordTitle', 'Title of that form', 'genshin_impact'),
    ('account.methods.changePasswordLead', 'Line under the title explaining what is being asked for', 'genshin_impact'),
    ('account.methods.changePasswordNote', 'Warns that every other session will be signed out', 'genshin_impact'),
    ('account.methods.currentPassword', 'Label of the current-password field', 'genshin_impact'),
    ('account.methods.currentRequired', 'Refusal when the current password was left empty', 'genshin_impact'),
    ('account.methods.passwordUnchanged', 'Refusal when the new password is the same as the old one', 'genshin_impact'),
    ('account.methods.passwordChanged', 'Notification after the password has changed', 'genshin_impact'),
    ('account.methods.mustChange', 'Status line in the account panel for a password an admin chose', 'genshin_impact'),
    ('account.methods.mustChangeTitle', 'Title of the forced change form', 'genshin_impact'),
    ('account.methods.mustChangeLead', 'Explains why the site is asking before it will go any further', 'genshin_impact')
ON CONFLICT (name) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'en', v.value FROM (VALUES
    ('account.methods.changePassword', 'Change'),
    ('account.methods.changePasswordTitle', 'Change your password'),
    ('account.methods.changePasswordLead', 'Your current password first, so that a session left open somewhere is not a way to take the account.'),
    ('account.methods.changePasswordNote', 'Everywhere else you are signed in will be signed out. This window stays.'),
    ('account.methods.currentPassword', 'Current password'),
    ('account.methods.currentRequired', 'Your current password is needed.'),
    ('account.methods.passwordUnchanged', 'That is the password you already have.'),
    ('account.methods.passwordChanged', 'Password changed.'),
    ('account.methods.mustChange', 'Set by an administrator - please choose your own'),
    ('account.methods.mustChangeTitle', 'Choose a password'),
    ('account.methods.mustChangeLead', 'This account was made for you, and the password on it was chosen by somebody else. Pick your own before going on.')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'sk', v.value FROM (VALUES
    ('account.methods.changePassword', 'Zmeniť'),
    ('account.methods.changePasswordTitle', 'Zmena hesla'),
    ('account.methods.changePasswordLead', 'Najprv súčasné heslo, aby otvorená relácia niekde inde nebola spôsobom, ako prísť o účet.'),
    ('account.methods.changePasswordNote', 'Všade inde budete odhlásený. Toto okno zostáva prihlásené.'),
    ('account.methods.currentPassword', 'Súčasné heslo'),
    ('account.methods.currentRequired', 'Je potrebné zadať súčasné heslo.'),
    ('account.methods.passwordUnchanged', 'To je heslo, ktoré už máte.'),
    ('account.methods.passwordChanged', 'Heslo bolo zmenené.'),
    ('account.methods.mustChange', 'Nastavené správcom - zvoľte si vlastné'),
    ('account.methods.mustChangeTitle', 'Zvoľte si heslo'),
    ('account.methods.mustChangeLead', 'Tento účet bol vytvorený pre vás a heslo naň zvolil niekto iný. Skôr než budete pokračovať, zvoľte si vlastné.')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;
