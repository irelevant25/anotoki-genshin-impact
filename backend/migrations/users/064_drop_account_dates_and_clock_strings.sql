-----------------------------------------------------------
-- THE ACCOUNT PANEL'S DATES AND CLOCK GO (2026-10-22)
--
-- The owner's decision of 2026-10-22: the dates and the clock are chosen on
-- the IAM's account page alone. The account panel (the footer's Account
-- window) keeps the appearance, the language and the wallpaper; its Dates and
-- Clock rows went, and every word only they said with them - their labels,
-- the date orders' and the clocks' names, and the "Saved." a change of either
-- brought (all users/030's). The account's own order and clock still write
-- every date on the site (AppDatePipe): only the choosing moved.
--
-- Nothing asks for the ten: the key scan of `php translations.php --status`
-- (the library's KeyScanner over frontend/src/app, shared/dynamic-keys.ts
-- included) lists each as unused, and none is named, whole or in part,
-- anywhere in frontend/src or backend/ but in the migrations. Kept, because
-- the pages still read them: account.formats.failed (a theme or a language
-- the account would not take - the panel's, the admin panel's theme button's,
-- the public shell's) and account.preferencesNote (the panel's line under the
-- appearance and the language). Their descriptions named the date and clock
-- choosers; they follow, where they are still users/047's.
--
-- Deleting a key takes its strings with it, in every language and whatever
-- the owner reworded them to - translations.key_name is ON DELETE CASCADE.
-- No other key is touched. Apply it after the upload, as every file of this
-- release: a build from before would show these keys bare.
-----------------------------------------------------------

DELETE FROM translation_keys WHERE name IN (
    'account.dateFormat',
    'account.formats.auto',
    'account.formats.clock12',
    'account.formats.clock24',
    'account.formats.dmyDot',
    'account.formats.dmySlash',
    'account.formats.mdySlash',
    'account.formats.saved',
    'account.formats.ymdDash',
    'account.timeFormat'
);

UPDATE translation_keys
   SET description = 'Notification when a change to the appearance or the language could not be saved to the anotoki account'
 WHERE name = 'account.formats.failed'
   AND description = 'Notification when a change to the appearance, the dates, the clock or the language could not be saved to the anotoki account';

UPDATE translation_keys
   SET description = 'Line in the account panel, under the appearance and language choosers of somebody signed in, saying they are the anotoki account''s and every anotoki site follows them'
 WHERE name = 'account.preferencesNote'
   AND description = 'Line in the account panel, under the appearance, date, clock and language choosers of somebody signed in, saying they are the anotoki account''s and every anotoki site follows them';

-----------------------------------------------------------
-- PROVE IT
--
-- None of the ten is left, nor a string under one - and the two keys the
-- panel still reads are still here.
-----------------------------------------------------------

DO $$
DECLARE
    leftover TEXT;
    lost TEXT;
BEGIN
    SELECT string_agg(name, ', ' ORDER BY name) INTO leftover
      FROM (
          SELECT name FROM translation_keys
           WHERE name IN (
               'account.dateFormat', 'account.formats.auto', 'account.formats.clock12', 'account.formats.clock24',
               'account.formats.dmyDot', 'account.formats.dmySlash', 'account.formats.mdySlash', 'account.formats.saved',
               'account.formats.ymdDash', 'account.timeFormat'
           )
          UNION
          SELECT key_name FROM translations
           WHERE key_name IN (
               'account.dateFormat', 'account.formats.auto', 'account.formats.clock12', 'account.formats.clock24',
               'account.formats.dmyDot', 'account.formats.dmySlash', 'account.formats.mdySlash', 'account.formats.saved',
               'account.formats.ymdDash', 'account.timeFormat'
           )
      ) AS left_behind;
    IF leftover IS NOT NULL THEN
        RAISE EXCEPTION 'users/064: the account panel''s date and clock strings are still here: %', leftover;
    END IF;

    SELECT string_agg(k.name, ', ' ORDER BY k.name) INTO lost
      FROM (VALUES ('account.formats.failed'), ('account.preferencesNote')) AS k(name)
     WHERE NOT EXISTS (SELECT 1 FROM translation_keys tk WHERE tk.name = k.name);
    IF lost IS NOT NULL THEN
        RAISE EXCEPTION 'users/064: keys the pages still read are gone: %', lost;
    END IF;
END $$;
