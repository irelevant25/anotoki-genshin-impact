-----------------------------------------------------------
-- THE MULTISELECT'S LAST WORDS GO (2026-10-25)
--
-- users/015 gave the admin lists' multiselect its words, and users/056 took
-- away the four summaries nothing read any more. The three that stayed -
-- multiselect.more.one, .few and .other, "(+{count} more)" after the first
-- few names chosen - were genshin's own multiselect's, and that field is gone:
-- the admin lists' filters and the material form's groups are the anotoki
-- library's <anotoki-multiselect> since anotoki-lib 0.11.0 (the owner's
-- request of 2026-10-25), which says the same in its own words
-- (anotoki.multiselect.more, the library's translations set, 014). Nothing
-- asks for the three: the key scan of `php translations.php --status` (the
-- library's KeyScanner over frontend/src/app, shared/dynamic-keys.ts
-- included) lists each as unused, and none is named, whole or in part,
-- anywhere in frontend/src or backend/ but in the migrations.
--
-- Deleting a key takes its strings with it, in every language and whatever
-- the owner reworded them to - translations.key_name is ON DELETE CASCADE.
-- No other key is touched.
--
-- Apply it after the upload, as every file of this release: a build from
-- before would show its multiselect's "+2 more" as a bare key.
-----------------------------------------------------------

DELETE FROM translation_keys WHERE name IN (
    'multiselect.more.few',
    'multiselect.more.one',
    'multiselect.more.other'
);

-----------------------------------------------------------
-- PROVE IT
--
-- None of the three is left, nor a string under one.
-----------------------------------------------------------

DO $$
DECLARE
    leftover TEXT;
BEGIN
    SELECT string_agg(name, ', ' ORDER BY name) INTO leftover
      FROM (
          SELECT name FROM translation_keys
           WHERE name IN ('multiselect.more.few', 'multiselect.more.one', 'multiselect.more.other')
          UNION
          SELECT key_name FROM translations
           WHERE key_name IN ('multiselect.more.few', 'multiselect.more.one', 'multiselect.more.other')
      ) AS left_behind;
    IF leftover IS NOT NULL THEN
        RAISE EXCEPTION 'users/068: the old multiselect''s words are still here: %', leftover;
    END IF;
END $$;
