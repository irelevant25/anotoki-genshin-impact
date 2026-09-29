-----------------------------------------------------------
-- WHAT'S NEW
--
-- The first visit after a release used to open the changelog itself, cut down
-- to the versions the browser had not seen: each one a card, every line in it
-- flagged new. It opens a short note on the newest version now - its changes
-- in one list, and a way through to the full changelog - and these are that
-- note's words.
--
-- The kinds of change (Added, Updated, Fixed) are the changelog's own strings,
-- reused, and the version and its date are not words at all. When more than
-- one version was missed, the note says only that there are earlier ones,
-- never how many: a count would need Slovak's plural forms for the sake of
-- one sentence. Shared by the family ('common'), like the changelog's strings.
-----------------------------------------------------------

INSERT INTO translation_keys (name, description, site) VALUES
    ('whatsNew.title', 'Title of the note that opens once after a release, on what the newest version changed', 'common'),
    ('whatsNew.allChanges', 'Button in that note that opens the full changelog, every version', 'common'),
    ('whatsNew.gotIt', 'Button that closes that note', 'common'),
    ('whatsNew.earlier', 'Line in that note when earlier versions were missed too - says no number, on purpose', 'common')
ON CONFLICT (name) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'en', v.value FROM (VALUES
    ('whatsNew.title', 'What''s new'),
    ('whatsNew.allChanges', 'See all changes'),
    ('whatsNew.gotIt', 'Got it'),
    ('whatsNew.earlier', 'There are earlier updates to catch up on too - they are in the full list.')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'sk', v.value FROM (VALUES
    ('whatsNew.title', 'Čo je nové'),
    ('whatsNew.allChanges', 'Zobraziť všetky zmeny'),
    ('whatsNew.gotIt', 'Rozumiem'),
    ('whatsNew.earlier', 'Čakajú vás aj staršie novinky - nájdete ich v úplnom zozname.')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

-- The kinds' words were headings only. The note uses them on their own too:
-- read out before each change ("Added: ...") and shown over its icon.
UPDATE translation_keys
   SET description = 'Kind of change: a section heading in the changelog, and in What''s new the word read out before each change and shown over its icon'
 WHERE name IN ('changelog.added', 'changelog.updated', 'changelog.fixed');

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
          ('whatsNew.title'), ('whatsNew.allChanges'), ('whatsNew.gotIt'), ('whatsNew.earlier')
      ) AS k(name)
     WHERE NOT EXISTS (SELECT 1 FROM translation_keys tk WHERE tk.name = k.name AND tk.site = 'common')
        OR NOT EXISTS (SELECT 1 FROM translations t WHERE t.key_name = k.name AND t.language_code = 'en')
        OR NOT EXISTS (SELECT 1 FROM translations t WHERE t.key_name = k.name AND t.language_code = 'sk');
    IF missing IS NOT NULL THEN
        RAISE EXCEPTION 'keys without an English and a Slovak string, or not common: %', missing;
    END IF;
END $$;
