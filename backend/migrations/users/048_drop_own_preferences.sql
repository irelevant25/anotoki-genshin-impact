-----------------------------------------------------------
-- THIS SITE'S OWN COPY OF THE PREFERENCES GOES
--
-- The appearance, the dates, the clock and the language are the anotoki
-- account's (the IAM's migration 015, the owner's decision of 2026-10-06), and
-- since the build that brought 047 nothing here reads or writes the copy this
-- site kept of them. The owner's word, the same day: drop it. So this removes,
-- from `users`:
--   theme_main and theme_admin (002, 003) - one theme for the whole site now,
--     the account's - and the `themes` lookup, whose only use they were;
--   language (001, 004) - a reader's language is their account's `locale`; its
--     foreign key goes with it, so deleting a language has nobody to move to
--     English first any more;
--   date_format and time_format (029) - the account's date order and clock.
-- Nothing anybody can miss is lost: the account keeps its own choices, and
-- whoever is signed in sees those on every site.
--
-- NOT A WAY BACK
--
-- A build from before 047 reads these columns, and would fail on every page
-- that asks who is signed in. Upload the new build first, then Apply; once
-- this has run, an older build never goes on the host again.
-----------------------------------------------------------

ALTER TABLE users DROP COLUMN IF EXISTS theme_main;
ALTER TABLE users DROP COLUMN IF EXISTS theme_admin;
ALTER TABLE users DROP COLUMN IF EXISTS language;
ALTER TABLE users DROP COLUMN IF EXISTS date_format;
ALTER TABLE users DROP COLUMN IF EXISTS time_format;

DROP TABLE IF EXISTS themes;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users'
          AND column_name IN ('theme_main', 'theme_admin', 'language', 'date_format', 'time_format')
    ) OR to_regclass('public.themes') IS NOT NULL THEN
        RAISE EXCEPTION 'This site''s own copy of the preferences is still there after 048';
    END IF;
END $$;
