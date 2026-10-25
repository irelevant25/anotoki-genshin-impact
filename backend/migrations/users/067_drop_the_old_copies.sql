-----------------------------------------------------------
-- THE OLD COPIES OF THE WORDS GO (2026-10-25)
--
-- The owner's request of 2026-10-25: no leftover tables. users/050 kept full
-- copies of translation_keys and translations as they stood before the words
-- moved into the anotoki library's shape - translation_keys_before_library
-- and translations_before_library, unread, "for one release", a way back in
-- case something did not come over whole. Every release since has read the
-- words in the library's shape alone; the copies go, with nothing kept of
-- them. The backup Apply takes first holds them as they were.
--
-- The other two copies - audit_logs_before_library and feedback_before_library,
-- kept by genshin_impact/028 and 029 when the audit log and feedback moved
-- into the library's tables - are the content half's, made after every
-- users/ file runs on a new installation: genshin_impact/033 drops them, as a
-- users/ file never names a table of that half.
--
-- WHAT THE PRIVACY PAGE SAID OF THEM
--
-- users/055 gave the Privacy page a line for the four copies, "Older copies"
-- (legal.oldCopies.name, .what, .why, .kept): what they held, what for, and
-- that they were kept until an update removed them. That update is this one
-- and genshin_impact/033, applied together: the page no longer names them
-- (sites/main/legal/legal-facts.ts), and nothing asks for the four keys - the
-- key scan of `php translations.php --status` lists each as unused, and none
-- is named, whole or in part, anywhere in frontend/src or backend/ but in the
-- migrations. Deleting a key takes its strings with it, in every language and
-- whatever the owner reworded them to - translations.key_name is ON DELETE
-- CASCADE. No other key is touched.
--
-- Apply it after the upload, as every file of this release: a build from
-- before would show the four keys bare on the Privacy page.
-----------------------------------------------------------

DROP TABLE IF EXISTS translations_before_library;
DROP TABLE IF EXISTS translation_keys_before_library;

DELETE FROM translation_keys WHERE name IN (
    'legal.oldCopies.kept',
    'legal.oldCopies.name',
    'legal.oldCopies.what',
    'legal.oldCopies.why'
);

-----------------------------------------------------------
-- PROVE IT
--
-- Neither copy is left, and none of the four keys nor a string under one.
-----------------------------------------------------------

DO $$
DECLARE
    leftover TEXT;
BEGIN
    IF to_regclass('translations_before_library') IS NOT NULL OR to_regclass('translation_keys_before_library') IS NOT NULL THEN
        RAISE EXCEPTION 'users/067: the old copies of the words are still here';
    END IF;

    SELECT string_agg(name, ', ' ORDER BY name) INTO leftover
      FROM (
          SELECT name FROM translation_keys
           WHERE name IN ('legal.oldCopies.kept', 'legal.oldCopies.name', 'legal.oldCopies.what', 'legal.oldCopies.why')
          UNION
          SELECT key_name FROM translations
           WHERE key_name IN ('legal.oldCopies.kept', 'legal.oldCopies.name', 'legal.oldCopies.what', 'legal.oldCopies.why')
      ) AS left_behind;
    IF leftover IS NOT NULL THEN
        RAISE EXCEPTION 'users/067: the Privacy page''s words for the old copies are still here: %', leftover;
    END IF;
END $$;
