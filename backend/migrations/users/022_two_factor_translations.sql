-----------------------------------------------------------
-- TWO-FACTOR AUTHENTICATION STRINGS
--
-- The setup modal, the recovery codes, and the extra step the login form gains
-- once an account requires one.
--
-- account.twoFactor.on carries {count}, which is how many recovery codes are
-- left. It is on the account row rather than tucked away because running out
-- of them is how somebody ends up locked out, and the moment to notice is
-- while they still have some.
-----------------------------------------------------------

INSERT INTO translation_keys (name, description, site) VALUES
    ('account.twoFactor.title', 'The two-factor row in the list of ways in', 'genshin_impact'),
    ('account.twoFactor.on', 'Under it when two-factor is on - {count} is recovery codes left', 'genshin_impact'),
    ('account.twoFactor.off', 'Under it when two-factor is off', 'genshin_impact'),
    ('account.twoFactor.onTitle', 'Heading of the setup modal', 'genshin_impact'),
    ('account.twoFactor.offTitle', 'Heading of the same modal when it is turning two-factor off', 'genshin_impact'),
    ('account.twoFactor.scanLead', 'Above the QR code', 'genshin_impact'),
    ('account.twoFactor.openInApp', 'Link that hands the secret straight to an app on the same device', 'genshin_impact'),
    ('account.twoFactor.manualKey', 'Label above the typed-in form of the secret', 'genshin_impact'),
    ('account.twoFactor.confirmLead', 'Above the field for the first code', 'genshin_impact'),
    ('account.twoFactor.code', 'The code field, here and when turning it off', 'genshin_impact'),
    ('account.twoFactor.codePlaceholder', 'Placeholder in that field', 'genshin_impact'),
    ('account.twoFactor.badCode', 'Shown when the code was not right', 'genshin_impact'),
    ('account.twoFactor.turnOn', 'Button that switches two-factor on', 'genshin_impact'),
    ('account.twoFactor.turnedOn', 'Notification once it is on', 'genshin_impact'),
    ('account.twoFactor.codesTitle', 'Heading over the recovery codes', 'genshin_impact'),
    ('account.twoFactor.codesLead', 'Under it - they are shown once and cannot be shown again', 'genshin_impact'),
    ('account.twoFactor.copy', 'Button that copies all ten', 'genshin_impact'),
    ('account.twoFactor.copied', 'Notification after copying', 'genshin_impact'),
    ('account.twoFactor.codesSaved', 'The checkbox that has to be ticked before the modal can be closed', 'genshin_impact'),
    ('account.twoFactor.offLead', 'Above the code field when turning two-factor off', 'genshin_impact'),
    ('account.twoFactor.turnOff', 'Button that switches it off', 'genshin_impact'),
    ('account.twoFactor.turnedOff', 'Notification once it is off', 'genshin_impact'),

    ('login.totp', 'The authenticator code field on the login form', 'genshin_impact'),
    ('login.totpPlaceholder', 'Placeholder in that field', 'genshin_impact'),
    ('login.totpLead', 'Above it, once the account has asked for a second factor', 'genshin_impact'),
    ('login.totpRecovery', 'Under it, saying a recovery code works here too', 'genshin_impact'),
    ('login.badTotp', 'Shown when the authenticator code was not right', 'genshin_impact')
ON CONFLICT (name) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'en', v.value FROM (VALUES
    ('account.twoFactor.title', 'Two-factor authentication'),
    ('account.twoFactor.on', 'On. {count} recovery codes left.'),
    ('account.twoFactor.off', 'Off. Your password alone gets you in.'),
    ('account.twoFactor.onTitle', 'Turn on two-factor authentication'),
    ('account.twoFactor.offTitle', 'Turn off two-factor authentication'),
    ('account.twoFactor.scanLead', 'Scan this with your authenticator app.'),
    ('account.twoFactor.openInApp', 'Or open it in an app on this device'),
    ('account.twoFactor.manualKey', 'No camera? Type this key instead:'),
    ('account.twoFactor.confirmLead', 'Now type the code your app is showing, so we know it worked.'),
    ('account.twoFactor.code', 'Code'),
    ('account.twoFactor.codePlaceholder', 'Six digits'),
    ('account.twoFactor.badCode', 'That code is not right. Codes change every thirty seconds - try the current one.'),
    ('account.twoFactor.turnOn', 'Turn on'),
    ('account.twoFactor.turnedOn', 'Two-factor authentication is on.'),
    ('account.twoFactor.codesTitle', 'Save your recovery codes'),
    ('account.twoFactor.codesLead', 'Each one works once, and only if you lose your phone. This is the only time they will be shown.'),
    ('account.twoFactor.copy', 'Copy all'),
    ('account.twoFactor.copied', 'Recovery codes copied.'),
    ('account.twoFactor.codesSaved', 'I have saved these somewhere safe'),
    ('account.twoFactor.offLead', 'Type a code from your app to turn two-factor off. A recovery code works too.'),
    ('account.twoFactor.turnOff', 'Turn off'),
    ('account.twoFactor.turnedOff', 'Two-factor authentication is off.'),

    ('login.totp', 'Authenticator code'),
    ('login.totpPlaceholder', 'Six digits'),
    ('login.totpLead', 'Type the code your authenticator app is showing.'),
    ('login.totpRecovery', 'Lost your phone? One of your recovery codes works here.'),
    ('login.badTotp', 'That code is not right. Codes change every thirty seconds - try the current one.')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'sk', v.value FROM (VALUES
    ('account.twoFactor.title', 'Dvojfaktorové overenie'),
    ('account.twoFactor.on', 'Zapnuté. Zostáva záložných kódov: {count}.'),
    ('account.twoFactor.off', 'Vypnuté. Stačí ti samotné heslo.'),
    ('account.twoFactor.onTitle', 'Zapnutie dvojfaktorového overenia'),
    ('account.twoFactor.offTitle', 'Vypnutie dvojfaktorového overenia'),
    ('account.twoFactor.scanLead', 'Naskenuj to svojou overovacou aplikáciou.'),
    ('account.twoFactor.openInApp', 'Alebo to otvor v aplikácii na tomto zariadení'),
    ('account.twoFactor.manualKey', 'Nemáš kameru? Zadaj tento kľúč:'),
    ('account.twoFactor.confirmLead', 'Teraz napíš kód, ktorý ti aplikácia ukazuje, nech vieme, že to funguje.'),
    ('account.twoFactor.code', 'Kód'),
    ('account.twoFactor.codePlaceholder', 'Šesť číslic'),
    ('account.twoFactor.badCode', 'Tento kód nie je správny. Kódy sa menia každých tridsať sekúnd - skús ten aktuálny.'),
    ('account.twoFactor.turnOn', 'Zapnúť'),
    ('account.twoFactor.turnedOn', 'Dvojfaktorové overenie je zapnuté.'),
    ('account.twoFactor.codesTitle', 'Ulož si záložné kódy'),
    ('account.twoFactor.codesLead', 'Každý funguje raz, a to len keď stratíš telefón. Ukazujeme ti ich jediný raz.'),
    ('account.twoFactor.copy', 'Kopírovať všetky'),
    ('account.twoFactor.copied', 'Záložné kódy sú skopírované.'),
    ('account.twoFactor.codesSaved', 'Uložil som si ich na bezpečné miesto'),
    ('account.twoFactor.offLead', 'Napíš kód z aplikácie a dvojfaktorové overenie vypneme. Funguje aj záložný kód.'),
    ('account.twoFactor.turnOff', 'Vypnúť'),
    ('account.twoFactor.turnedOff', 'Dvojfaktorové overenie je vypnuté.'),

    ('login.totp', 'Overovací kód'),
    ('login.totpPlaceholder', 'Šesť číslic'),
    ('login.totpLead', 'Napíš kód, ktorý ti ukazuje overovacia aplikácia.'),
    ('login.totpRecovery', 'Stratil si telefón? Funguje tu aj niektorý zo záložných kódov.'),
    ('login.badTotp', 'Tento kód nie je správny. Kódy sa menia každých tridsať sekúnd - skús ten aktuálny.')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;
