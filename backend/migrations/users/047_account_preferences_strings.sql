-----------------------------------------------------------
-- THE ACCOUNT'S PREFERENCES
--
-- The appearance, the dates, the clock and the language are the anotoki
-- account's now, not this site's (the IAM's migration 015, the owner's
-- decision of 2026-10-06): one choice every anotoki site follows, the admin
-- panel included. The account panel's choosers save to the account, so a
-- change made here changes every anotoki site - which the panel says, under
-- them, while they are the account's. Shared by the family ('common'), like
-- the rest of the panel's words. The Slovak names nobody, so it reads right
-- beside the panel's older lines and its newer ones alike.
--
-- 'account.formats.failed' is now also what the panel says when a theme or a
-- language could not be saved to the account; its description follows,
-- unless it was reworded in the admin panel meanwhile.
--
-- The columns this site kept its own copy in - users.theme_main,
-- theme_admin, language, date_format and time_format - stay as they are:
-- nothing reads or writes them any more (but deleting a language, which
-- still moves `language` to English for its foreign key). Dropping them is
-- the owner's call, in a migration of its own.
-----------------------------------------------------------

INSERT INTO translation_keys (name, description, site) VALUES
    ('account.preferencesNote', 'Line in the account panel, under the appearance, date, clock and language choosers of somebody signed in, saying they are the anotoki account''s and every anotoki site follows them', 'common')
ON CONFLICT (name) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'en', v.value FROM (VALUES
    ('account.preferencesNote', 'These settings belong to your anotoki account and apply on every anotoki site.')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'sk', v.value FROM (VALUES
    ('account.preferencesNote', 'Tieto nastavenia patria k účtu anotoki a platia na všetkých stránkach anotoki.')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

UPDATE translation_keys
   SET description = 'Notification when a change to the appearance, the dates, the clock or the language could not be saved to the anotoki account'
 WHERE name = 'account.formats.failed'
   AND description = 'Notification when a date or time format could not be saved';

-----------------------------------------------------------
-- PROVE IT
--
-- The new key reads in both languages, and belongs to the whole family.
-----------------------------------------------------------

DO $$
DECLARE
    missing TEXT;
BEGIN
    SELECT string_agg(k.name, ', ' ORDER BY k.name) INTO missing
      FROM (VALUES
          ('account.preferencesNote')
      ) AS k(name)
     WHERE NOT EXISTS (SELECT 1 FROM translation_keys tk WHERE tk.name = k.name AND tk.site = 'common')
        OR NOT EXISTS (SELECT 1 FROM translations t WHERE t.key_name = k.name AND t.language_code = 'en')
        OR NOT EXISTS (SELECT 1 FROM translations t WHERE t.key_name = k.name AND t.language_code = 'sk');
    IF missing IS NOT NULL THEN
        RAISE EXCEPTION 'keys without an English and a Slovak string, or not common: %', missing;
    END IF;
END $$;
