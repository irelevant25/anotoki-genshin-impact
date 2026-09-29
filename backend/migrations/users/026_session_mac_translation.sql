-----------------------------------------------------------
-- THE LABEL IN FRONT OF A HARDWARE ADDRESS
--
-- Only ever rendered for a session opened from the same network as the server,
-- so most accounts will never see it - see migration 025.
-----------------------------------------------------------

INSERT INTO translation_keys (name, description, site) VALUES
    ('profile.sessions.mac', 'Label before the hardware address of a session signed in from this network', 'genshin_impact')
ON CONFLICT (name) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'en', v.value FROM (VALUES
    ('profile.sessions.mac', 'Hardware address')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'sk', v.value FROM (VALUES
    ('profile.sessions.mac', 'Hardvérová adresa')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;
