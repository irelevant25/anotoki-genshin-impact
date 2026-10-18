-----------------------------------------------------------
-- THE MULTISELECT'S OLD SUMMARY WORDS GO
--
-- users/015 gave the admin lists' multiselect four summaries of what was
-- chosen - multiselect.selected.none, .one, .few and .other ("No values
-- selected", "{count} values selected") - and the field has long said what is
-- chosen by the choices' own names instead, with multiselect.more.* for the
-- rest ("Hu Tao, Furina, Nahida +2 more"). Nothing asks for the four: the key
-- scan of `php translations.php --status` (the library's KeyScanner over
-- frontend/src/app, shared/dynamic-keys.ts included) lists each as unused, and
-- none is named, whole or in part, anywhere in frontend/src or backend/ but in
-- the migrations. The owner's word (round 3, step 6): they go.
--
-- Deleting a key takes its strings with it, in every language and whatever
-- the owner reworded them to - translations.key_name is ON DELETE CASCADE.
-- No other key is touched: multiselect.more.* stays.
-----------------------------------------------------------

DELETE FROM translation_keys WHERE name IN (
    'multiselect.selected.few',
    'multiselect.selected.none',
    'multiselect.selected.one',
    'multiselect.selected.other'
);

-----------------------------------------------------------
-- PROVE IT
--
-- None of the four is left, nor a string under one.
-----------------------------------------------------------

DO $$
DECLARE
    leftover TEXT;
BEGIN
    SELECT string_agg(name, ', ' ORDER BY name) INTO leftover
      FROM (
          SELECT name FROM translation_keys
           WHERE name IN ('multiselect.selected.few', 'multiselect.selected.none', 'multiselect.selected.one', 'multiselect.selected.other')
          UNION
          SELECT key_name FROM translations
           WHERE key_name IN ('multiselect.selected.few', 'multiselect.selected.none', 'multiselect.selected.one', 'multiselect.selected.other')
      ) AS left_behind;
    IF leftover IS NOT NULL THEN
        RAISE EXCEPTION 'users/056: the multiselect''s old summary strings are still here: %', leftover;
    END IF;
END $$;
