-----------------------------------------------------------
-- SWITCHES AN ADMIN CAN THROW WITHOUT A DEPLOY
--
-- Four things that were previously decisions made in code, or not available at
-- all: whether the site is open, whether anybody may sign in, whether the
-- Google button is offered, and whether a given section of the site exists
-- this week. Plus a line of text across the top of every page, for the times
-- when the answer to "why is it doing that" has to reach everybody at once.
--
-- One row per switch rather than one column per switch. A column each would
-- make every new setting a migration, an ALTER, a model change, a response
-- field and a form control; a row each makes it a row, and the admin form
-- draws whatever it finds. The cost is that the value is text and the type is
-- declared beside it rather than enforced by the column - which is why `type`
-- is checked, why the API validates against it on the way in, and why every
-- read in api/site_settings.php falls back to a default rather than trusting
-- what it finds.
--
-- Scoped by site, like translation_keys: there will be a Star Rail site beside
-- this one and it will be up while this one is down.
-----------------------------------------------------------

CREATE TABLE IF NOT EXISTS site_settings (
    id          SERIAL PRIMARY KEY,
    site        VARCHAR(50)  NOT NULL,
    -- Which panel of the admin form it appears under.
    group_name  VARCHAR(50)  NOT NULL DEFAULT 'general',
    name        VARCHAR(100) NOT NULL,
    type        VARCHAR(20)  NOT NULL,
    -- For 'choice' only: the values it may take, comma separated.
    options     VARCHAR(255),
    value       TEXT,
    sort_order  SMALLINT     NOT NULL DEFAULT 0,
    updated_at  TIMESTAMP,
    -- Who threw the switch last. Kept through a deleted account rather than
    -- taking the row with it: the setting is still in force either way.
    updated_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT site_settings_unique UNIQUE (site, name),
    CONSTRAINT site_settings_type CHECK (type IN ('boolean', 'text', 'i18n', 'choice', 'routes'))
);

CREATE INDEX IF NOT EXISTS idx_site_settings_site ON site_settings (site);

-----------------------------------------------------------
-- THE SWITCHES THEMSELVES
--
-- Seeded off, open, and empty - the state the site is already in. A migration
-- that arrives and closes the site would be a strange thing to run.
--
-- The maintenance message has default text in both languages so that turning
-- maintenance on is one click rather than one click and a paragraph. The
-- announcement has none: a banner nobody has written is a banner with nothing
-- to say, and the API refuses to draw one.
-----------------------------------------------------------

INSERT INTO site_settings (site, group_name, name, type, options, value, sort_order) VALUES
    ('genshin_impact', 'access', 'maintenance_mode', 'boolean', NULL, 'false', 10),
    ('genshin_impact', 'access', 'maintenance_message', 'i18n', NULL,
        '{"en":"The site is closed for a few minutes while something is fixed. It will be back shortly.","sk":"Stránka je na pár minút zatvorená, opravujeme jednu vec. Čoskoro bude späť."}', 20),
    ('genshin_impact', 'access', 'login_enabled', 'boolean', NULL, 'true', 30),
    ('genshin_impact', 'access', 'google_login_enabled', 'boolean', NULL, 'true', 40),
    ('genshin_impact', 'notice', 'announcement_enabled', 'boolean', NULL, 'false', 50),
    ('genshin_impact', 'notice', 'announcement_level', 'choice', 'info,warning,danger', 'info', 60),
    ('genshin_impact', 'notice', 'announcement_message', 'i18n', NULL, '{}', 70),
    ('genshin_impact', 'routes', 'disabled_routes', 'routes', NULL, '[]', 80)
ON CONFLICT (site, name) DO NOTHING;

-----------------------------------------------------------
-- WHAT THE CLOSED SIGN SAYS
--
-- Only the site-facing half. The admin form that throws these switches is in
-- the admin panel, which is English only and carries its words in its own
-- template like every other page there - putting them in the translation
-- table would be thirty keys nothing ever reads in a second language.
--
-- 'common' rather than 'genshin_impact': none of this is about the game. The
-- next site gets the same closed sign.
-----------------------------------------------------------

INSERT INTO translation_keys (name, description, site) VALUES
    ('site.maintenance.title', 'Heading of the page shown while the site is closed', 'common'),
    ('site.maintenance.text', 'Fallback text on that page, when no message has been written', 'common'),
    ('site.maintenance.staffLead', 'Line above the sign-in button on the staff URL', 'common'),
    ('site.maintenance.signIn', 'Button on the staff URL that opens the sign-in form', 'common'),
    ('site.announcement.hide', 'Tooltip on the button that dismisses the announcement bar', 'common'),
    ('login.disabledRefusal', 'Told to somebody signing in while signing in is switched off', 'common'),
    ('login.maintenanceRefusal', 'Told to somebody signing in while the site is closed', 'common'),
    ('account.confirm.resendLead', 'Line above the address field on the failed-confirmation page', 'common')
ON CONFLICT (name) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'en', v.value FROM (VALUES
    ('site.maintenance.title', 'Back shortly'),
    ('site.maintenance.text', 'The site is closed for a few minutes while something is fixed.'),
    ('site.maintenance.staffLead', 'An admin account can sign in here and carry on using the site.'),
    ('site.maintenance.signIn', 'Sign in'),
    ('site.announcement.hide', 'Hide this'),
    ('login.disabledRefusal', 'Signing in is switched off at the moment.'),
    ('login.maintenanceRefusal', 'The site is closed for maintenance.'),
    ('account.confirm.resendLead', 'Type the address you signed up with and a new link will be sent to it.')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'sk', v.value FROM (VALUES
    ('site.maintenance.title', 'Hneď sme späť'),
    ('site.maintenance.text', 'Stránka je na pár minút zatvorená, opravujeme jednu vec.'),
    ('site.maintenance.staffLead', 'Administrátorský účet sa tu vie prihlásiť a pokračovať.'),
    ('site.maintenance.signIn', 'Prihlásiť sa'),
    ('site.announcement.hide', 'Skryť'),
    ('login.disabledRefusal', 'Prihlasovanie je momentálne vypnuté.'),
    ('login.maintenanceRefusal', 'Stránka je zatvorená pre údržbu.'),
    ('account.confirm.resendLead', 'Napíš adresu, s ktorou si sa registroval, a pošleme na ňu nový odkaz.')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

-----------------------------------------------------------
-- AND ONE THAT IS NO LONGER TRUE
--
-- account.confirm.failedNote sent somebody with a dead link to the sign-in
-- form, because that was the only place a new one could be asked for. There is
-- a field and a button on the page itself now, so the note pointed away from
-- the thing it was standing next to.
-----------------------------------------------------------

UPDATE translations SET value = 'A link is good for a few hours. Ask for a fresh one and it will arrive in a minute or two.'
 WHERE key_name = 'account.confirm.failedNote' AND language_code = 'en';

UPDATE translations SET value = 'Odkaz platí pár hodín. Vyžiadaj si nový a o chvíľu ti príde.'
 WHERE key_name = 'account.confirm.failedNote' AND language_code = 'sk';
