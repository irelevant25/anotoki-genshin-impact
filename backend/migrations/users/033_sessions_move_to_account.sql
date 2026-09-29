-----------------------------------------------------------
-- WHERE YOU ARE SIGNED IN, MOVED OUT OF THE PROFILE
--
-- "Where you are signed in" was a section on the profile page, sitting above
-- the quiz statistics. Whether somebody has played has no bearing on where
-- their account is signed in, and of everything on that page it is the only
-- part with a consequence - so it has moved to the account panel, which shows
-- the one session being read from and opens the rest in a modal of its own.
--
-- The strings move with it. `profile.sessions.*` for text that no longer
-- appears on the profile is the sort of small lie that compounds: somebody
-- looking for it in the translation editor would search the wrong prefix, and
-- the next person to touch it would trust the name.
--
-- The rename is an UPDATE rather than an insert-and-delete because
-- translations.key_name is ON UPDATE CASCADE - the strings follow their key,
-- in every language, without being retyped. `started` and `lastSeen` become
-- column headings on the way, which is what they now are.
--
-- Renaming a key is safe in a way that renaming a table is not: nothing joins
-- on it but the translations themselves, and anything still asking for the old
-- name would already be broken by the code that no longer uses it.
-----------------------------------------------------------

UPDATE translation_keys
   SET name = 'account.sessions.' || substring(name from length('profile.sessions.') + 1)
 WHERE name LIKE 'profile.sessions.%';

-----------------------------------------------------------
-- WHAT THE MOVE NEEDED THAT DID NOT EXIST
--
-- A table has column headings; the list it replaced had labels inside each
-- row. `started` and `lastSeen` above already say the right words, so they are
-- reused under column.* names rather than duplicated - see below.
-----------------------------------------------------------

INSERT INTO translation_keys (name, description, site) VALUES
    ('account.sessions.thisOne', 'Heading of the current-session row in the account panel', 'genshin_impact'),
    ('account.sessions.viewAll', 'Button in the account panel that opens every session', 'genshin_impact'),
    ('account.sessions.liveCount', 'How many sessions are live right now - {count}', 'genshin_impact'),
    ('account.sessions.column.device', 'Session table column: which browser and machine', 'genshin_impact'),
    ('account.sessions.column.how', 'Session table column: how it was signed in', 'genshin_impact'),
    ('account.sessions.column.where', 'Session table column: the address it came from', 'genshin_impact'),
    ('account.sessions.column.started', 'Session table column: when it began', 'genshin_impact'),
    ('account.sessions.column.lastSeen', 'Session table column: when it was last used', 'genshin_impact'),
    ('account.sessions.column.state', 'Session table column: live, or how it ended', 'genshin_impact'),
    ('profile.lastPlayed', 'Label beside the date of the most recent finished question', 'genshin_impact'),
    ('common.yes', 'Confirming an action that is about to happen', 'genshin_impact'),
    ('common.no', 'Declining one', 'genshin_impact')
ON CONFLICT (name) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'en', v.value FROM (VALUES
    ('account.sessions.thisOne', 'This session'),
    ('account.sessions.viewAll', 'See all'),
    ('account.sessions.liveCount', '{count} signed in right now'),
    ('account.sessions.column.device', 'Device'),
    ('account.sessions.column.how', 'Signed in by'),
    ('account.sessions.column.where', 'From'),
    ('account.sessions.column.started', 'Started'),
    ('account.sessions.column.lastSeen', 'Last used'),
    ('account.sessions.column.state', 'State'),
    ('profile.lastPlayed', 'Last played'),
    ('common.yes', 'Yes'),
    ('common.no', 'No')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'sk', v.value FROM (VALUES
    ('account.sessions.thisOne', 'Toto prihlásenie'),
    ('account.sessions.viewAll', 'Zobraziť všetky'),
    ('account.sessions.liveCount', 'Práve prihlásených: {count}'),
    ('account.sessions.column.device', 'Zariadenie'),
    ('account.sessions.column.how', 'Prihlásené cez'),
    ('account.sessions.column.where', 'Odkiaľ'),
    ('account.sessions.column.started', 'Začalo'),
    ('account.sessions.column.lastSeen', 'Naposledy použité'),
    ('account.sessions.column.state', 'Stav'),
    ('profile.lastPlayed', 'Naposledy hral'),
    ('common.yes', 'Áno'),
    ('common.no', 'Nie')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

-----------------------------------------------------------
-- AND TWO THAT NOTHING ASKS FOR ANY MORE
--
-- The list showed "Started" and "Last used" as labels inside each row, and the
-- hardware address with the words "Hardware address" in front of it. The table
-- puts the first two in column headings - their own keys above - and the MAC
-- under the address it belongs to, where a label would be noise on the one row
-- in a hundred that has one.
-----------------------------------------------------------

DELETE FROM translation_keys WHERE name IN (
    'account.sessions.started',
    'account.sessions.lastSeen',
    'account.sessions.mac'
);
