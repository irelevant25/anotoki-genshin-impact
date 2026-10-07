-----------------------------------------------------------
-- THE OLD "NOT SET UP" PAGE'S WORDS GO
--
-- Since the site's state is the anotoki sites' shared library's (anotoki-lib,
-- 2026-10-07), the page a site without its config shows is the library's own
-- (@anotoki/lib/migrations, set up in frontend/src/app/shared/site-status.ts),
-- in the library's built-in English and Slovak, the same on every anotoki
-- site. The site's own page, which 042 brought these four strings for, went
-- with that change (shared/not-set-up/), and nothing asks for them any more:
-- not the pages, not the API, not the library, which is handed the reader's
-- language and never a word of the site's. Each key was searched for in
-- frontend/src and backend/ first, as a whole and in parts; only 042 names it.
--
-- Deleting a key takes its strings with it, in every language and whatever an
-- admin reworded them to - translations.key_name is ON DELETE CASCADE. No
-- other key is touched: the maintenance page's, the sign-in card's and the
-- announcement's site.* strings are all still drawn.
--
-- Safe in either order with the upload: a build from before the library read
-- these strings only as a better word than its own built-in English, which it
-- falls back to without them.
-----------------------------------------------------------

DELETE FROM translation_keys WHERE name IN (
    'site.notSetUp.title',
    'site.notSetUp.text',
    'site.notSetUp.operator',
    'site.notSetUp.setup'
);

-----------------------------------------------------------
-- PROVE IT
--
-- None of the four keys is left, and no string under one.
-----------------------------------------------------------

DO $$
DECLARE
    leftover TEXT;
BEGIN
    SELECT string_agg(name, ', ' ORDER BY name) INTO leftover
      FROM (
          SELECT name FROM translation_keys
           WHERE name IN ('site.notSetUp.title', 'site.notSetUp.text', 'site.notSetUp.operator', 'site.notSetUp.setup')
          UNION
          SELECT key_name FROM translations
           WHERE key_name IN ('site.notSetUp.title', 'site.notSetUp.text', 'site.notSetUp.operator', 'site.notSetUp.setup')
      ) AS left_behind;
    IF leftover IS NOT NULL THEN
        RAISE EXCEPTION 'the old not-set-up page''s strings are still here: %', leftover;
    END IF;
END $$;
