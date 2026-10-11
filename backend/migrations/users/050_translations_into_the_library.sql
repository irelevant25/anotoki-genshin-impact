-----------------------------------------------------------
-- THE WORDS MOVE INTO THE ANOTOKI LIBRARY'S TABLES
--
-- The site's words - its languages, its keys and their strings - are read
-- and written by the anotoki sites' shared library from this release on
-- (anotoki-lib 0.3.0, Anotoki\Lib\Translations, set up for this site in
-- api/translations.php): the bundle every page reads, the admin panel's
-- Translations and Languages pages and their API, the command line. Every
-- other anotoki site keeps its words in the one shape the library works
-- with; this site's tables were made before that shape existed. This file
-- moves them into it, in place. The library's own migrations run after it
-- (the set anotoki_translations, in vendor/anotoki/lib/php/migrations/
-- translations): its 001 proves the shape and refuses any other, naming
-- every difference, and its 002 adds the library's own words, under
-- anotoki.*.
--
-- The owner's decisions for this site, which the shape follows:
--   - keys come only from migrations: the admin panel no longer makes,
--     renames or deletes one, and an import no longer creates one;
--   - a key's description is the code's: the migration that adds a key says
--     what it is for, and the admin panel no longer edits it;
--   - the guides behind the question marks are content of their own, no
--     longer strings: each is a page of markup (the minesweeper's runs to
--     2,154 characters, over the 2,000 a string may hold), edited on the
--     admin panel's Guides page and read by the pages from
--     GET /api/guides/{guide}. Their titles stay strings;
--   - who may change the words stays as it was: ADMIN or EDITOR, the
--     languages too.
--
-- What changes, table by table:
--   languages         keyed by its code - the English name was the key,
--                     while everything pointed at the code; a code is two
--                     small letters, or two and two with a dash ("pt-br").
--   translation_keys  loses its scope (`site`: the 'common' / 'genshin_impact'
--                     split was for a Star Rail site in this database that
--                     never came, and the bundle served both), the HTML flag
--                     (it chose the editor, and only the guides had it), the
--                     updated stamp and its trigger, and who made and changed
--                     it; created_at becomes a TIMESTAMPTZ.
--   translations      loses created_at, created_by and its trigger;
--                     updated_at becomes a TIMESTAMPTZ that is always there;
--                     an empty string can no longer be stored - no string is
--                     what reads the English - and the blank ones the old
--                     command line could store go.
--   sites             goes, with the scope.
--   guide_contents    is new: the guides, one row per guide and language.
-- Whoever saved a string (translations.updated_by) stays, as it was.
--
-- The timestamps were written in the time zone of the connection, which this
-- site never sets - the database server's own - and they are read in that
-- same zone here, so each keeps the moment it stood for.
--
-- NOTHING IS LOST
--
-- Full copies of translation_keys and translations as they stand before
-- anything below runs - every scope, flag, stamp and blank - are kept as
-- translation_keys_before_library and translations_before_library for one
-- release; a later migration drops them, once the owner has looked. The gate
-- at the end proves that every string that was not blank is still here, word
-- for word, with its writer and its time: as a string, or as a guide.
--
-- NOT A WAY BACK
--
-- A build from before this file reads the scope, the flag and the stamps and
-- the old routes, and would fail on every page that has words. Upload the
-- new build first, then Apply (the site waits for it, as for every
-- migration); once this has run, an older build never goes on the host
-- again.
-----------------------------------------------------------

-----------------------------------------------------------
-- THE COPIES, BEFORE ANYTHING ELSE
--
-- Made, never reused: a copy that was somehow here already would be of
-- another moment, and the gate would be comparing against the wrong words.
-----------------------------------------------------------

CREATE TABLE translation_keys_before_library AS SELECT * FROM translation_keys;
CREATE TABLE translations_before_library AS SELECT * FROM translations;

COMMENT ON TABLE translation_keys_before_library IS
    'users/050: translation_keys as it was before the words moved into the anotoki library''s shape. Kept for one release; a later migration drops it.';
COMMENT ON TABLE translations_before_library IS
    'users/050: translations as it was before the words moved into the anotoki library''s shape - the guides'' markup among them. Kept for one release; a later migration drops it.';

-----------------------------------------------------------
-- LANGUAGES, KEYED BY THEIR CODE
--
-- Only the strings point at a language (users.language went with 048, and
-- its foreign key with it). Anything else that does would stop the key from
-- moving, so it is named here rather than guessed at.
-----------------------------------------------------------

DO $$
DECLARE
    others TEXT;
BEGIN
    SELECT string_agg(conrelid::regclass::TEXT || ' (' || conname || ')', ', ' ORDER BY conrelid::regclass::TEXT, conname) INTO others
      FROM pg_constraint
     WHERE contype = 'f'
       AND confrelid = 'languages'::regclass
       AND conrelid <> 'translations'::regclass;
    IF others IS NOT NULL THEN
        RAISE EXCEPTION 'users/050: besides the strings, % refer to languages. Point them at languages (code) first, or drop them, then apply again.', others;
    END IF;
END $$;

-- The strings' foreign key, the primary key on the name and the unique code
-- go first - each found by what it is, not by a name it may not have on a
-- database that was merged or restored - and come back keyed by the code.
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    FOR constraint_name IN
        SELECT conname FROM pg_constraint
         WHERE contype = 'f' AND conrelid = 'translations'::regclass AND confrelid = 'languages'::regclass
    LOOP
        EXECUTE format('ALTER TABLE translations DROP CONSTRAINT %I', constraint_name);
    END LOOP;

    FOR constraint_name IN
        SELECT conname FROM pg_constraint
         WHERE conrelid = 'languages'::regclass
           AND (contype = 'p'
                OR (contype = 'u' AND conkey = ARRAY[(SELECT attnum FROM pg_attribute
                                                      WHERE attrelid = 'languages'::regclass AND attname = 'code')]))
    LOOP
        EXECUTE format('ALTER TABLE languages DROP CONSTRAINT %I', constraint_name);
    END LOOP;
END $$;

-- The name was the key, and NOT NULL with it. It stays a name every
-- language has; two languages may now share one, as on every other site.
ALTER TABLE languages ALTER COLUMN name SET NOT NULL;

-- A code the library could not take - the old API checked a code's shape,
-- but 004 made one up for any row it did not know - is named, not mangled.
DO $$
DECLARE
    odd TEXT;
BEGIN
    SELECT string_agg(quote_literal(code), ', ' ORDER BY code) INTO odd
      FROM languages
     WHERE code !~ '^[a-z]{2}(-[a-z]{2})?$';
    IF odd IS NOT NULL THEN
        RAISE EXCEPTION 'users/050: language codes that are no codes (two small letters, or two and two with a dash): %. Correct them first, then apply again.', odd;
    END IF;
END $$;

ALTER TABLE languages ADD CONSTRAINT languages_pkey PRIMARY KEY (code);
ALTER TABLE languages ADD CONSTRAINT languages_code_check CHECK (code ~ '^[a-z]{2}(-[a-z]{2})?$');

ALTER TABLE translations ADD CONSTRAINT fk_translations_language
    FOREIGN KEY (language_code) REFERENCES languages (code) ON UPDATE CASCADE ON DELETE CASCADE;

-----------------------------------------------------------
-- GUIDE CONTENTS
-- name: GuideContent
--
-- What a question mark opens: one guide's page of markup, in one language.
-- Rendered by <app-rich-text>, which keeps only what its allow-list lets
-- through (shared/local-lib/rich-html.ts) - stored as the editor wrote it.
-- A guide reads in English where its language has no row; deleting a
-- language takes its guides with it, as it takes its strings.
-----------------------------------------------------------

CREATE TABLE guide_contents (
    guide          VARCHAR(100)  NOT NULL,
    language_code  VARCHAR(10)   NOT NULL,
    html           TEXT          NOT NULL,
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by     INTEGER       REFERENCES users (id) ON DELETE SET NULL,

    CONSTRAINT guide_contents_pkey PRIMARY KEY (guide, language_code),
    CONSTRAINT guide_contents_guide_check CHECK (guide ~ '^[A-Za-z0-9][A-Za-z0-9_-]*$'),
    CONSTRAINT guide_contents_html_check CHECK (html <> ''),
    CONSTRAINT guide_contents_language_foreign FOREIGN KEY (language_code)
        REFERENCES languages (code) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Every guide's body, by its key's name - guide.<guide>.content, what the
-- guide modal asked for - whatever the HTML flag said of it. A blank one is
-- left behind: no row reads the English, as a blank string meant to.
INSERT INTO guide_contents (guide, language_code, html, updated_at, updated_by)
SELECT substring(t.key_name FROM '^guide\.([^.]+)\.content$'),
       t.language_code,
       t.value,
       COALESCE(t.updated_at, t.created_at, LOCALTIMESTAMP),
       t.updated_by
  FROM translations t
 WHERE t.key_name ~ '^guide\.[^.]+\.content$'
   AND t.value ~ '\S';

-- Their keys go, and their strings with them (ON DELETE CASCADE); the copy
-- above keeps them. The titles (guide.<guide>.title) stay strings.
DELETE FROM translation_keys WHERE name ~ '^guide\.[^.]+\.content$';

-----------------------------------------------------------
-- THE KEYS: NO SCOPE, NO FLAG, NO STAMPS
--
-- The trigger first: it would stamp every row the statements below touch.
-- The scope's foreign key and index go with its column, and then the table
-- of scopes, which nothing else refers to (site_settings and site_routes
-- keep the site's code as a plain value, from config/site.php).
-----------------------------------------------------------

DROP TRIGGER IF EXISTS trg_translation_keys_updated_at ON translation_keys;

ALTER TABLE translation_keys DROP COLUMN IF EXISTS site;
ALTER TABLE translation_keys DROP COLUMN IF EXISTS is_html;
ALTER TABLE translation_keys DROP COLUMN IF EXISTS updated_at;
ALTER TABLE translation_keys DROP COLUMN IF EXISTS created_by;
ALTER TABLE translation_keys DROP COLUMN IF EXISTS updated_by;

ALTER TABLE translation_keys ALTER COLUMN created_at TYPE TIMESTAMPTZ;
UPDATE translation_keys SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
ALTER TABLE translation_keys ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE translation_keys ALTER COLUMN created_at SET NOT NULL;

DROP TABLE IF EXISTS sites;

-----------------------------------------------------------
-- THE STRINGS: WHO AND WHEN, AND NEVER EMPTY
--
-- updated_at is when a string last changed; one never changed since it was
-- written takes the time it was written. Who wrote it stays (updated_by:
-- whoever saved it in the admin panel, NULL for a migration or the command
-- line).
-----------------------------------------------------------

DROP TRIGGER IF EXISTS trg_translations_updated_at ON translations;

DELETE FROM translations WHERE value !~ '\S';

ALTER TABLE translations ALTER COLUMN created_at TYPE TIMESTAMPTZ;
ALTER TABLE translations ALTER COLUMN updated_at TYPE TIMESTAMPTZ;
UPDATE translations SET updated_at = COALESCE(created_at, CURRENT_TIMESTAMP) WHERE updated_at IS NULL;
ALTER TABLE translations ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE translations ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE translations DROP COLUMN IF EXISTS created_at;
ALTER TABLE translations DROP COLUMN IF EXISTS created_by;

ALTER TABLE translations ADD CONSTRAINT translations_value_check CHECK (value <> '');

-----------------------------------------------------------
-- PROVE IT
--
-- The shape the library relies on (its 001 checks it again, and refuses any
-- other); every string of the copy that was not blank still here, word for
-- word, with its writer and its time - a guide's body in guide_contents, the
-- rest in translations - and nothing beside them; every key but the guides'
-- bodies still a key, with its description; no blank string, no trigger and
-- no scope left.
-----------------------------------------------------------

DO $$
DECLARE
    found TEXT;
BEGIN
    -- The columns: exactly these.
    SELECT string_agg(have.table_name || '.' || have.column_name, ', ' ORDER BY have.table_name, have.column_name) INTO found
      FROM (
          SELECT c.table_name::TEXT AS table_name, c.column_name::TEXT AS column_name
            FROM information_schema.columns c
           WHERE c.table_schema = current_schema()
             AND c.table_name IN ('languages', 'translation_keys', 'translations')
      ) AS have
      FULL JOIN (VALUES
          ('languages', 'code'), ('languages', 'name'), ('languages', 'native_name'),
          ('languages', 'enabled'), ('languages', 'sort_order'),
          ('translation_keys', 'name'), ('translation_keys', 'description'), ('translation_keys', 'created_at'),
          ('translations', 'key_name'), ('translations', 'language_code'), ('translations', 'value'),
          ('translations', 'updated_at'), ('translations', 'updated_by')
      ) AS want (table_name, column_name)
        ON want.table_name = have.table_name AND want.column_name = have.column_name
     WHERE want.table_name IS NULL OR have.table_name IS NULL;
    IF found IS NOT NULL THEN
        RAISE EXCEPTION 'users/050: the columns of the three tables are not the library''s - left over or missing: %', found;
    END IF;

    -- Keyed by the code, and only codes in it.
    IF NOT EXISTS (
        SELECT 1
          FROM pg_index i
          JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY (i.indkey)
         WHERE i.indrelid = 'languages'::regclass AND i.indisprimary AND i.indnatts = 1 AND a.attname = 'code'
    ) OR NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conrelid = 'languages'::regclass AND conname = 'languages_code_check'
    ) THEN
        RAISE EXCEPTION 'users/050: languages is not keyed by its code, or its codes are not checked';
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_trigger
         WHERE NOT tgisinternal
           AND tgrelid IN ('languages'::regclass, 'translation_keys'::regclass, 'translations'::regclass)
    ) OR to_regclass('sites') IS NOT NULL THEN
        RAISE EXCEPTION 'users/050: a trigger on the words, or the table of scopes, is still there';
    END IF;

    -- Every string that was not blank, where it belongs, as it was.
    SELECT string_agg(b.key_name || ' (' || b.language_code || ')', ', ' ORDER BY b.key_name, b.language_code) INTO found
      FROM translations_before_library b
     WHERE b.value ~ '\S'
       AND CASE
           WHEN b.key_name ~ '^guide\.[^.]+\.content$' THEN NOT EXISTS (
               SELECT 1 FROM guide_contents g
                WHERE g.guide = substring(b.key_name FROM '^guide\.([^.]+)\.content$')
                  AND g.language_code = b.language_code
                  AND g.html = b.value
                  AND g.updated_by IS NOT DISTINCT FROM b.updated_by
                  AND g.updated_at = COALESCE(b.updated_at, b.created_at, LOCALTIMESTAMP))
           ELSE NOT EXISTS (
               SELECT 1 FROM translations t
                WHERE t.key_name = b.key_name
                  AND t.language_code = b.language_code
                  AND t.value = b.value
                  AND t.updated_by IS NOT DISTINCT FROM b.updated_by
                  AND t.updated_at = COALESCE(b.updated_at, b.created_at, CURRENT_TIMESTAMP))
           END;
    IF found IS NOT NULL THEN
        RAISE EXCEPTION 'users/050: strings that did not come through word for word, with their writer and time: %', found;
    END IF;

    -- And nothing beside them.
    IF (SELECT count(*) FROM translations)
           <> (SELECT count(*) FROM translations_before_library
                WHERE value ~ '\S' AND key_name !~ '^guide\.[^.]+\.content$')
       OR (SELECT count(*) FROM guide_contents)
           <> (SELECT count(*) FROM translations_before_library
                WHERE value ~ '\S' AND key_name ~ '^guide\.[^.]+\.content$') THEN
        RAISE EXCEPTION 'users/050: there are more strings or guides than there were words to move';
    END IF;

    -- Every key but the guides' bodies, still a key, with its description and the time it was made.
    SELECT string_agg(b.name, ', ' ORDER BY b.name) INTO found
      FROM translation_keys_before_library b
     WHERE b.name !~ '^guide\.[^.]+\.content$'
       AND NOT EXISTS (
           SELECT 1 FROM translation_keys k
            WHERE k.name = b.name
              AND k.description IS NOT DISTINCT FROM b.description
              AND k.created_at = COALESCE(b.created_at, CURRENT_TIMESTAMP));
    IF found IS NOT NULL THEN
        RAISE EXCEPTION 'users/050: keys that did not come through as they were: %', found;
    END IF;

    IF EXISTS (SELECT 1 FROM translation_keys WHERE name ~ '^guide\.[^.]+\.content$')
       OR EXISTS (SELECT 1 FROM translations WHERE value !~ '\S') THEN
        RAISE EXCEPTION 'users/050: a guide''s body is still a key, or a blank string is still stored';
    END IF;
END $$;
