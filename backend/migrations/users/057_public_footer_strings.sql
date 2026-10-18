-----------------------------------------------------------
-- THE PUBLIC FOOTER'S WORDS, AS ITS ITEMS ARE NOW
--
-- The owner's decisions of 2026-10-18 for the public site's footer
-- (frontend sites/main/common/footer): its items are the version, What's new,
-- Feedback and the account, then Terms · Privacy · Contact - links to the
-- legal pages, in the anotoki library's words (anotoki.legalLinks.*) - and the
-- fan clause stands alone on its left. The GitHub link goes, and Backgrounds
-- moves into the account panel. So:
--
--   - footer.whatsNew, new: the footer's What's new, which opens the note on
--     the newest version whenever somebody wants it;
--   - account.background, new: the account panel's row that opens the
--     wallpapers' window - this browser's choice, never the account's;
--   - footer.feedback says Feedback alone, Contact being a link of its own
--     now: in English and in Slovak, each only while it is still users/004's
--     word for word - a rewording the owner made in the admin panel stands -
--     and its description says so, for whoever rewords it next;
--   - footer.github and footer.backgrounds go: nothing asks for them any more
--     (the key scan of `php translations.php --status` - the library's
--     KeyScanner over frontend/src/app - lists both as unused, and neither is
--     named anywhere in frontend/src or backend/ but in the migrations).
--
-- A new string only where it has none (ON CONFLICT DO NOTHING), informal
-- Slovak ("ty"), as users/051 does. Deleting a key takes its strings with it,
-- in every language and whatever the owner reworded them to -
-- translations.key_name is ON DELETE CASCADE. No other key is touched. Apply
-- it with the upload, as every file of a release: until it runs, the new
-- build shows its two new keys bare; once it has, a build from before would
-- show footer.backgrounds bare.
-----------------------------------------------------------

INSERT INTO translation_keys (name, description) VALUES
    ('footer.whatsNew', 'The public footer''s item, after the version number and before Feedback, that opens What''s new - the note on the newest version (whatsNew.title) - whenever somebody wants it. No placeholders.'),
    ('account.background', 'Label of the row in the account panel whose button names the wallpaper behind the site and opens the wallpapers'' window (backgrounds.title). This browser''s choice, never the anotoki account''s. No placeholders.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'en', v.value FROM (VALUES
    ('footer.whatsNew', 'What''s new'),
    ('account.background', 'Background')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'sk', v.value FROM (VALUES
    ('footer.whatsNew', 'Čo je nové'),
    ('account.background', 'Pozadie')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

UPDATE translations t
   SET value = v.new_value,
       updated_at = CURRENT_TIMESTAMP
  FROM (VALUES
    ('footer.feedback', 'en', 'Feedback/Contact', 'Feedback'),
    ('footer.feedback', 'sk', 'Spätná väzba/Kontakt', 'Spätná väzba')
  ) AS v(key_name, language_code, old_value, new_value)
 WHERE t.key_name = v.key_name
   AND t.language_code = v.language_code
   AND t.value = v.old_value;

UPDATE translation_keys
   SET description = 'The public footer''s item that opens the feedback form (the anotoki library''s). Feedback alone: Contact is a link of its own, beside Terms and Privacy. No placeholders.'
 WHERE name = 'footer.feedback';

DELETE FROM translation_keys WHERE name IN (
    'footer.backgrounds',
    'footer.github'
);

-----------------------------------------------------------
-- PROVE IT
--
-- The two new keys read in both languages; footer.feedback is no longer
-- users/004's "Feedback/Contact" in either; the two old items' keys are gone
-- with every string under them; and every key the footer and the account
-- panel still read is still here.
-----------------------------------------------------------

DO $$
DECLARE
    missing TEXT;
    stale TEXT;
    leftover TEXT;
    lost TEXT;
BEGIN
    SELECT string_agg(k.name, ', ' ORDER BY k.name) INTO missing
      FROM (VALUES
          ('footer.whatsNew'), ('account.background')
      ) AS k(name)
     WHERE NOT EXISTS (SELECT 1 FROM translation_keys tk WHERE tk.name = k.name)
        OR NOT EXISTS (SELECT 1 FROM translations t WHERE t.key_name = k.name AND t.language_code = 'en')
        OR NOT EXISTS (SELECT 1 FROM translations t WHERE t.key_name = k.name AND t.language_code = 'sk');
    IF missing IS NOT NULL THEN
        RAISE EXCEPTION 'users/057: keys without an English and a Slovak string: %', missing;
    END IF;

    SELECT string_agg(t.language_code, ', ' ORDER BY t.language_code) INTO stale
      FROM translations t
     WHERE t.key_name = 'footer.feedback'
       AND ((t.language_code = 'en' AND t.value = 'Feedback/Contact') OR (t.language_code = 'sk' AND t.value = 'Spätná väzba/Kontakt'));
    IF stale IS NOT NULL THEN
        RAISE EXCEPTION 'users/057: footer.feedback still names Contact in: %', stale;
    END IF;

    SELECT string_agg(name, ', ' ORDER BY name) INTO leftover
      FROM (
          SELECT name FROM translation_keys WHERE name IN ('footer.backgrounds', 'footer.github')
          UNION
          SELECT key_name FROM translations WHERE key_name IN ('footer.backgrounds', 'footer.github')
      ) AS left_behind;
    IF leftover IS NOT NULL THEN
        RAISE EXCEPTION 'users/057: the footer''s old items are still here: %', leftover;
    END IF;

    SELECT string_agg(k.name, ', ' ORDER BY k.name) INTO lost
      FROM (VALUES
          ('footer.versions'), ('footer.feedback'), ('footer.account'), ('footer.fanDisclaimer'), ('whatsNew.title'), ('backgrounds.title')
      ) AS k(name)
     WHERE NOT EXISTS (SELECT 1 FROM translation_keys tk WHERE tk.name = k.name);
    IF lost IS NOT NULL THEN
        RAISE EXCEPTION 'users/057: keys the pages still read are gone: %', lost;
    END IF;
END $$;
