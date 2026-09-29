-----------------------------------------------------------
-- THE PAGE A SITE WITHOUT ITS CONFIG SHOWS
--
-- Everything that differs between one installation and the next now lives in
-- config/*.local.php, written by setup.php, with nothing committed standing in
-- for it. Until those files are there the API answers every request 503
-- not_set_up, and the site draws a page saying so - on a fresh checkout, a
-- fresh hosting account, or a deploy that lost its config - instead of itself.
--
-- These are that page's words. The page cannot fetch them in that state: with
-- no database config there is no database to read them from. It shows them to
-- a reader whose browser kept the strings from an earlier visit, in the
-- language they read in, and its own built-in English to everybody else - the
-- English below is the same text. Shared by the family ('common'), like the
-- maintenance page's.
-----------------------------------------------------------

INSERT INTO translation_keys (name, description, site) VALUES
    ('site.notSetUp.title', 'Heading of the page shown while the site has no configuration yet', 'common'),
    ('site.notSetUp.text', 'What that page tells a visitor', 'common'),
    ('site.notSetUp.operator', 'Line for whoever runs the site, above the link to its setup page', 'common'),
    ('site.notSetUp.setup', 'Link to the setup page (setup.php) that writes the configuration', 'common')
ON CONFLICT (name) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'en', v.value FROM (VALUES
    ('site.notSetUp.title', 'Not set up yet'),
    ('site.notSetUp.text', 'This site is installed but has not been set up, so there is nothing to show here yet.'),
    ('site.notSetUp.operator', 'Running this site? Its setup page connects it to its database and to the anotoki sign-in.'),
    ('site.notSetUp.setup', 'Open the setup page')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'sk', v.value FROM (VALUES
    ('site.notSetUp.title', 'Zatiaľ nenastavené'),
    ('site.notSetUp.text', 'Táto stránka je nainštalovaná, ale ešte nie je nastavená, a tak tu zatiaľ nie je čo ukázať.'),
    ('site.notSetUp.operator', 'Spravujete túto stránku? Jej nastavenie ju prepojí s databázou a s prihlásením anotoki.'),
    ('site.notSetUp.setup', 'Otvoriť nastavenie')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

-----------------------------------------------------------
-- PROVE IT
--
-- Every key reads in both languages, and belongs to the whole family.
-----------------------------------------------------------

DO $$
DECLARE
    missing TEXT;
BEGIN
    SELECT string_agg(k.name, ', ' ORDER BY k.name) INTO missing
      FROM (VALUES
          ('site.notSetUp.title'), ('site.notSetUp.text'), ('site.notSetUp.operator'), ('site.notSetUp.setup')
      ) AS k(name)
     WHERE NOT EXISTS (SELECT 1 FROM translation_keys tk WHERE tk.name = k.name AND tk.site = 'common')
        OR NOT EXISTS (SELECT 1 FROM translations t WHERE t.key_name = k.name AND t.language_code = 'en')
        OR NOT EXISTS (SELECT 1 FROM translations t WHERE t.key_name = k.name AND t.language_code = 'sk');
    IF missing IS NOT NULL THEN
        RAISE EXCEPTION 'keys without an English and a Slovak string, or not common: %', missing;
    END IF;
END $$;
