-----------------------------------------------------------
-- WHICH PAGES EXIST, AND WHO THEY EXIST FOR
--
-- 034 put "switched-off sections" in the settings table as a JSON array of
-- five names, enforced by the router and nothing else. Two things were wrong
-- with that. A list of names cannot carry anything about a name - and each
-- page needs to say who it is drawn for as well as whether it is drawn at all.
-- And a switch the front end honours and the API ignores is a sign on a door
-- that is not locked: it stops the people who were going to read the page and
-- nobody else.
--
-- So: a row per page. `visibility` is the lowest kind of reader it is drawn
-- for, and `blocked` takes it away from everybody who is not an admin. The two
-- are separate questions - "members only" is not "off this week" - and a page
-- can be either, both, or neither.
--
-- PUBLIC is a visibility rather than a role: there is no `PUBLIC` in the roles
-- table and there should not be, because it describes a reader with no account
-- rather than an account with no powers. Everything is seeded PUBLIC, which is
-- what the site already is. ADMIN is the default for a row somebody adds by
-- hand, because the safe default for a page nobody has thought about is that
-- nobody sees it.
--
-- THE ENDPOINTS
--
-- A page is not its data. Blocking /quizzes stops the page being drawn and
-- leaves /api/quizzes answering, which is the right default: most of what this
-- governs is "that page is not finished", not "nobody may have this".
--
-- Where it is meant to be a lock, the row says which API paths belong to it,
-- and the gate refuses those too. Optional, one row per prefix, and empty for
-- every page here to begin with. See api/meddleware/route_gate.php for what
-- happens when two pages claim the same prefix.
-----------------------------------------------------------

CREATE TABLE IF NOT EXISTS site_routes (
    id          SERIAL PRIMARY KEY,
    site        VARCHAR(50)  NOT NULL,
    -- As the router declares it, leading slash and all. A ':id' segment
    -- matches any one segment - see routeMatchesPath().
    path        VARCHAR(255) NOT NULL,
    visibility  VARCHAR(10)  NOT NULL DEFAULT 'ADMIN',
    blocked     BOOLEAN      NOT NULL DEFAULT FALSE,
    sort_order  SMALLINT     NOT NULL DEFAULT 0,
    updated_at  TIMESTAMP,
    updated_by  INTEGER      REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT site_routes_unique UNIQUE (site, path),
    CONSTRAINT site_routes_visibility CHECK (visibility IN ('PUBLIC', 'USER', 'EDITOR', 'ADMIN'))
);

CREATE INDEX IF NOT EXISTS idx_site_routes_site ON site_routes (site);

CREATE TABLE IF NOT EXISTS site_route_endpoints (
    id       SERIAL PRIMARY KEY,
    route_id INTEGER      NOT NULL REFERENCES site_routes(id) ON DELETE CASCADE,
    -- Matched with str_starts_with against the request path, so '/api/quiz'
    -- covers /api/quizzes and /api/quiz/stats alike.
    prefix   VARCHAR(255) NOT NULL,
    CONSTRAINT site_route_endpoints_unique UNIQUE (route_id, prefix)
);

CREATE INDEX IF NOT EXISTS idx_site_route_endpoints_route ON site_route_endpoints (route_id);

-----------------------------------------------------------
-- EVERY PAGE THE ROUTER DECLARES, BAR THREE
--
-- /confirm-email and /reset-password are where emailed links land. Governing
-- them would break messages that were sent before anybody touched the switch,
-- and the person holding one has no account yet to be the right kind of
-- reader. /staff is the way back in when the site is closed; a blocked /staff
-- is a locked door with the key inside.
--
-- A page with no row is ungoverned, which is public and always drawn. So
-- leaving those three out is not an omission - it is the statement that they
-- are not the sort of thing this table decides.
-----------------------------------------------------------

INSERT INTO site_routes (site, path, visibility, blocked, sort_order) VALUES
    ('genshin_impact', '/',                          'PUBLIC', FALSE, 10),

    ('genshin_impact', '/daily',                     'PUBLIC', FALSE, 20),
    ('genshin_impact', '/daily/banners',             'PUBLIC', FALSE, 21),
    ('genshin_impact', '/daily/dish',                'PUBLIC', FALSE, 22),
    ('genshin_impact', '/daily/mismatch',            'PUBLIC', FALSE, 23),
    ('genshin_impact', '/daily/music',               'PUBLIC', FALSE, 24),
    ('genshin_impact', '/daily/pixelate',            'PUBLIC', FALSE, 25),
    ('genshin_impact', '/daily/voice',               'PUBLIC', FALSE, 26),

    ('genshin_impact', '/quizzes',                   'PUBLIC', FALSE, 30),
    ('genshin_impact', '/quizzes/banners',           'PUBLIC', FALSE, 31),
    ('genshin_impact', '/quizzes/dish',              'PUBLIC', FALSE, 32),
    ('genshin_impact', '/quizzes/mismatch',          'PUBLIC', FALSE, 33),
    ('genshin_impact', '/quizzes/music',             'PUBLIC', FALSE, 34),
    ('genshin_impact', '/quizzes/pixelate',          'PUBLIC', FALSE, 35),
    ('genshin_impact', '/quizzes/voice',             'PUBLIC', FALSE, 36),

    ('genshin_impact', '/games',                     'PUBLIC', FALSE, 40),
    ('genshin_impact', '/games/tournament',          'PUBLIC', FALSE, 41),
    ('genshin_impact', '/games/minesweeper',         'PUBLIC', FALSE, 42),

    ('genshin_impact', '/database',                  'PUBLIC', FALSE, 50),
    ('genshin_impact', '/database/banners',          'PUBLIC', FALSE, 51),
    ('genshin_impact', '/database/characters',       'PUBLIC', FALSE, 52),
    ('genshin_impact', '/database/characters/:id',   'PUBLIC', FALSE, 53),
    ('genshin_impact', '/database/materials',        'PUBLIC', FALSE, 54),
    ('genshin_impact', '/database/materials/:id',    'PUBLIC', FALSE, 55),
    ('genshin_impact', '/database/weapons',          'PUBLIC', FALSE, 56),
    ('genshin_impact', '/database/weapons/:id',      'PUBLIC', FALSE, 57),

    ('genshin_impact', '/profile',                   'PUBLIC', FALSE, 60)
ON CONFLICT (site, path) DO NOTHING;

-----------------------------------------------------------
-- AND THE SETTING THIS REPLACES
--
-- disabled_routes held the same idea in the shape that could not grow. Dropped
-- rather than left behind: a switch nothing reads is a switch somebody will
-- throw one day and wonder why nothing happened.
-----------------------------------------------------------

DELETE FROM site_settings WHERE name = 'disabled_routes';

-----------------------------------------------------------
-- WHAT AN ADMIN SEES THAT NOBODY ELSE DOES
--
-- An admin is exempt from both switches, which is what makes them usable - but
-- being exempt means the site looks normal, and a page that is off looks
-- exactly like a page that is on. So the menu marks them and the page says so.
-- Those words are the site's, so they are translated.
-----------------------------------------------------------

INSERT INTO translation_keys (name, description, site) VALUES
    ('route.hiddenBadge', 'Marker on a menu item only an admin can see - short, it sits in the menu', 'common'),
    ('route.blockedTitle', 'Banner heading on a page that is switched off, shown to admins only', 'common'),
    ('route.blockedText', 'What being switched off means, and who else can see the page', 'common'),
    ('route.restrictedTitle', 'Banner heading on a page limited to some kinds of reader', 'common'),
    ('route.restrictedText', 'Which kind of reader the page is limited to - {audience}', 'common'),
    ('route.audience.PUBLIC', 'Route visibility: anybody, signed in or not', 'common'),
    ('route.audience.USER', 'Route visibility: anybody with an account', 'common'),
    ('route.audience.EDITOR', 'Route visibility: editors and admins', 'common'),
    ('route.audience.ADMIN', 'Route visibility: admins only', 'common')
ON CONFLICT (name) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'en', v.value FROM (VALUES
    ('route.hiddenBadge', 'hidden'),
    ('route.blockedTitle', 'This page is switched off'),
    ('route.blockedText', 'You are seeing it because you are an admin. Everybody else gets a page that is not there.'),
    ('route.restrictedTitle', 'This page is not for everybody'),
    ('route.restrictedText', 'It is drawn for {audience}. You are seeing it because you are an admin.'),
    ('route.audience.PUBLIC', 'anybody'),
    ('route.audience.USER', 'anybody with an account'),
    ('route.audience.EDITOR', 'editors and admins'),
    ('route.audience.ADMIN', 'admins only')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;

INSERT INTO translations (key_name, language_code, value)
SELECT v.key_name, 'sk', v.value FROM (VALUES
    ('route.hiddenBadge', 'skryté'),
    ('route.blockedTitle', 'Táto stránka je vypnutá'),
    ('route.blockedText', 'Vidíš ju preto, že si administrátor. Všetci ostatní dostanú stránku, ktorá neexistuje.'),
    ('route.restrictedTitle', 'Táto stránka nie je pre každého'),
    ('route.restrictedText', 'Je určená pre: {audience}. Vidíš ju preto, že si administrátor.'),
    ('route.audience.PUBLIC', 'kohokoľvek'),
    ('route.audience.USER', 'kohokoľvek s účtom'),
    ('route.audience.EDITOR', 'editorov a administrátorov'),
    ('route.audience.ADMIN', 'len administrátorov')
) AS v(key_name, value)
ON CONFLICT (key_name, language_code) DO NOTHING;
