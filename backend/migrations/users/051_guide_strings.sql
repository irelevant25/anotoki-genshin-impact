-----------------------------------------------------------
-- WHEN A GUIDE CANNOT BE HAD
--
-- A guide's page is asked for when its question mark is pressed
-- (GET /api/guides/{guide}, users/050), and that can fail - the network, the
-- server. The window then says so, instead of standing there empty.
--
-- The first string since users/050 moved the words into the anotoki
-- library's shape, so the shape to copy for the next one: a key is its name
-- and its description - what it is for, where it shows, its placeholders;
-- the code's, never edited in the admin panel - and each language's string is
-- inserted only where it has none (ON CONFLICT DO NOTHING), so a rewording
-- the owner made in the admin panel is never undone. Informal Slovak ("ty").
-- No scope and no flag any more: every key is this site's.
-----------------------------------------------------------

INSERT INTO translation_keys (name, description) VALUES
    ('guide.loadFailed', 'In the window a question mark opens, in place of the guide, when its page could not be loaded (the network, the server). The reader closes the window and opens it again. No placeholders.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'en', v.value FROM (VALUES
    ('guide.loadFailed', 'This guide could not be loaded. Close it and try again.')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'sk', v.value FROM (VALUES
    ('guide.loadFailed', 'Tento návod sa nepodarilo načítať. Zavri ho a skús to znova.')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

-----------------------------------------------------------
-- PROVE IT
--
-- The key reads in both languages.
-----------------------------------------------------------

DO $$
DECLARE
    missing TEXT;
BEGIN
    SELECT string_agg(k.name, ', ' ORDER BY k.name) INTO missing
      FROM (VALUES
          ('guide.loadFailed')
      ) AS k(name)
     WHERE NOT EXISTS (SELECT 1 FROM translation_keys tk WHERE tk.name = k.name)
        OR NOT EXISTS (SELECT 1 FROM translations t WHERE t.key_name = k.name AND t.language_code = 'en')
        OR NOT EXISTS (SELECT 1 FROM translations t WHERE t.key_name = k.name AND t.language_code = 'sk');
    IF missing IS NOT NULL THEN
        RAISE EXCEPTION 'keys without an English and a Slovak string: %', missing;
    END IF;
END $$;
