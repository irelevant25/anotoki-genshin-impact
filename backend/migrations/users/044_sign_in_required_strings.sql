-----------------------------------------------------------
-- SIGN-IN REQUIRED
--
-- The anotoki IAM can require everybody to sign in before they use a site -
-- its switch, per site, off here by default. While it is on, somebody who is
-- not signed in is sent to the IAM before anything is drawn, and the site
-- draws a card instead of itself for the moment before the IAM's page loads,
-- or for good when that cannot happen on its own. These are the card's words;
-- its buttons are the existing 'common.signIn' and 'account.createAccount'.
-- Shared by the family ('common'): a Star Rail deployment draws the same card.
-----------------------------------------------------------

INSERT INTO translation_keys (name, description, site) VALUES
    ('site.signInRequired.title', 'Heading of the card drawn instead of the site while the IAM requires signing in and the reader is not signed in', 'common'),
    ('site.signInRequired.text', 'What that card tells the reader, above the Sign in and Create account buttons', 'common')
ON CONFLICT (name) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'en', v.value FROM (VALUES
    ('site.signInRequired.title', 'Sign in to continue'),
    ('site.signInRequired.text', 'This site is for people with an anotoki account. Sign in, or create an account - it is free.')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'sk', v.value FROM (VALUES
    ('site.signInRequired.title', 'Prihlás sa a pokračuj'),
    ('site.signInRequired.text', 'Táto stránka je pre ľudí s účtom anotoki. Prihlás sa alebo si vytvor účet - je zadarmo.')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

-----------------------------------------------------------
-- PROVE IT
--
-- Both keys read in both languages, and belong to the whole family.
-----------------------------------------------------------

DO $$
DECLARE
    missing TEXT;
BEGIN
    SELECT string_agg(k.name, ', ' ORDER BY k.name) INTO missing
      FROM (VALUES
          ('site.signInRequired.title'), ('site.signInRequired.text')
      ) AS k(name)
     WHERE NOT EXISTS (SELECT 1 FROM translation_keys tk WHERE tk.name = k.name AND tk.site = 'common')
        OR NOT EXISTS (SELECT 1 FROM translations t WHERE t.key_name = k.name AND t.language_code = 'en')
        OR NOT EXISTS (SELECT 1 FROM translations t WHERE t.key_name = k.name AND t.language_code = 'sk');
    IF missing IS NOT NULL THEN
        RAISE EXCEPTION 'keys without an English and a Slovak string, or not common: %', missing;
    END IF;
END $$;
