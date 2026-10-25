-----------------------------------------------------------
-- THE SITE SETTINGS MOVE INTO THE ANOTOKI LIBRARY'S TABLES (2026-10-25)
--
-- The owner's request of 2026-10-25: genshin's site settings - the switches its
-- administrators throw without a deploy - for every anotoki site, in the
-- library (anotoki-lib 0.11.0, Anotoki\Lib\SiteSettings, set up for this site
-- in api/site_state.php). genshin's own were the model the library's were made
-- from, and from this release the site reads and writes the library's tables:
-- anotoki_site_settings and anotoki_page_access, which the library's set
-- anotoki_admin makes in its 003 - that set runs before this site's folders
-- (api/migration_runner.php), so both are there when this file runs. The admin
-- panel's Site settings page is the library's; the gates are the library's
-- SiteGate (closed for maintenance, everybody but the site's ADMIN) and
-- PageAccessGate (423 page_locked); the pages read GET /api/site-settings.
--
-- What comes across, by the library's README ("Genshin's, mapped"):
--
--   site_settings              -> anotoki_site_settings, a row per switch, its
--                                 value as JSON:
--     maintenance_mode          boolean: true where it said 'true' (any case,
--     announcement_enabled      any spaces round it - as genshin read it),
--                               false otherwise
--     announcement_level        info, warning or danger as it said; anything
--                               else was drawn as information, and is 'info'
--     maintenance_message       a message per language: the object as it was
--     announcement_message      ({} where it was empty, blank or no object -
--                               what genshin read as no message)
--   site_routes                -> anotoki_page_access: path, visibility,
--                                 blocked and sort_order as they were
--   site_route_endpoints       -> anotoki_page_access.api_paths, each page's
--                                 prefixes in one list, sorted as the library
--                                 sorts them (byte by byte)
--   updated_at                 -> a TIMESTAMPTZ. It was written in the time
--                                 zone of the connection, which this site never
--                                 sets - the database server's own - and is
--                                 read in that same zone here, so each keeps
--                                 the moment it stood for (users/050,
--                                 genshin_impact/028); the README's example
--                                 reads it as UTC, which this site's never was
--   updated_by                 -> as it was: the IAM's id (users.id is the
--                                 IAM's sub since the IAM took the accounts
--                                 over with their ids); NULL stays NULL, and so
--                                 does a switch nobody ever threw
--
-- Only this site's rows: every row of either table is genshin_impact's (the
-- `site` column was for a Star Rail site in this database that never came,
-- config/site.php). A row of any other site, or a switch of genshin's with
-- another name, would be lost with the tables - the gate refuses to go on
-- rather than drop it, naming it. The five switches are the only ones there
-- are: 034 seeded eight, 035 took disabled_routes away and 040 the two sign-in
-- switches, and the admin page could only change a switch, never add one.
--
-- THE TABLES GO
--
-- The owner wants no leftover tables (2026-10-25): once the gate has proved
-- every switch and every page came through, site_settings, site_routes and
-- site_route_endpoints are dropped - no copy is kept. The backup Apply takes
-- first holds them as they were.
--
-- THE WORDS THAT GO WITH THEM
--
-- The closed sign, the announcement bar and the administrators' notice above
-- a page are the library's now, in its words (anotoki.maintenance.*,
-- anotoki.siteSettings.*, the library's anotoki_translations/015); the Privacy
-- page names the bar's mark by the library's preset. Nothing asks for these
-- any more - the key scan of `php translations.php --status` lists each as
-- unused, and none is named, whole or in part, anywhere in frontend/src or
-- backend/ but in the migrations:
--   site.maintenance.title, .text, .staffLead, .signIn   (034: the closed
--                                                          sign and /staff)
--   site.announcement.hide                                (034: the bar)
--   route.blockedTitle, .blockedText, .restrictedTitle,
--   .restrictedText, route.audience.PUBLIC|USER|EDITOR|ADMIN
--                                                         (035: the notice)
--   legal.storage.announcement.purpose, .kept             (055: the Privacy
--                                                          page's line for the
--                                                          old bar's storage)
-- Deleting a key takes its strings with it, in every language and whatever
-- the owner reworded them to - translations.key_name is ON DELETE CASCADE.
-- route.hiddenBadge stays: the public menu's mark on an item only an
-- administrator sees is the site's own.
--
-- NOT A WAY BACK
--
-- A build from before this file reads and writes the old tables; after it they
-- are gone, and such a build's admin page, gates and boot answer would fail.
-- Upload the new build first, then Apply; once this has run, an older build
-- never goes on the host again.
-----------------------------------------------------------

DO $$
DECLARE
    found TEXT;
BEGIN
    IF to_regclass('anotoki_site_settings') IS NULL OR to_regclass('anotoki_page_access') IS NULL THEN
        RAISE EXCEPTION 'users/066: the library''s tables anotoki_site_settings and anotoki_page_access are not there - its set anotoki_admin (003) runs first (api/migration_runner.php)';
    END IF;

    IF EXISTS (SELECT 1 FROM anotoki_site_settings) OR EXISTS (SELECT 1 FROM anotoki_page_access) THEN
        RAISE EXCEPTION 'users/066: the library''s site settings already hold rows - something wrote them before the move. Look at them before applying this.';
    END IF;

    SELECT string_agg(format('site_settings %s/%s', site, name), ', ' ORDER BY site, name) INTO found
      FROM site_settings
     WHERE site <> 'genshin_impact'
        OR name NOT IN ('maintenance_mode', 'maintenance_message', 'announcement_enabled', 'announcement_level', 'announcement_message');
    IF found IS NOT NULL THEN
        RAISE EXCEPTION 'users/066: switches the library has no place for, which dropping the table would lose: %. Look at them before applying this.', found;
    END IF;

    SELECT string_agg(format('site_routes %s %s', site, path), ', ' ORDER BY site, path) INTO found
      FROM site_routes
     WHERE site <> 'genshin_impact';
    IF found IS NOT NULL THEN
        RAISE EXCEPTION 'users/066: pages of another site, which dropping the table would lose: %. Look at them before applying this.', found;
    END IF;
END $$;

-----------------------------------------------------------
-- THE SWITCHES
-----------------------------------------------------------

INSERT INTO anotoki_site_settings (name, value, updated_at, updated_by)
SELECT s.name,
       CASE
           WHEN s.name IN ('maintenance_mode', 'announcement_enabled')
               THEN to_jsonb(lower(trim(COALESCE(s.value, ''))) = 'true')
           WHEN s.name = 'announcement_level'
               THEN to_jsonb(CASE WHEN s.value IN ('info', 'warning', 'danger') THEN s.value ELSE 'info' END)
           ELSE (SELECT CASE WHEN jsonb_typeof(m.v) = 'object' THEN m.v ELSE '{}'::jsonb END
                   FROM (SELECT NULLIF(trim(COALESCE(s.value, '')), '')::jsonb AS v) AS m)
       END,
       s.updated_at AT TIME ZONE current_setting('TimeZone'),
       s.updated_by
  FROM site_settings s
 WHERE s.site = 'genshin_impact'
   AND s.name IN ('maintenance_mode', 'maintenance_message', 'announcement_enabled', 'announcement_level', 'announcement_message')
 ORDER BY s.name;

-----------------------------------------------------------
-- THE PAGES
-----------------------------------------------------------

INSERT INTO anotoki_page_access (path, visibility, blocked, api_paths, sort_order, updated_at, updated_by)
SELECT r.path,
       r.visibility,
       r.blocked,
       COALESCE((SELECT array_agg(e.prefix::TEXT ORDER BY e.prefix COLLATE "C") FROM site_route_endpoints e WHERE e.route_id = r.id), '{}'::TEXT[]),
       r.sort_order,
       r.updated_at AT TIME ZONE current_setting('TimeZone'),
       r.updated_by
  FROM site_routes r
 WHERE r.site = 'genshin_impact'
 ORDER BY r.sort_order, r.id;

-----------------------------------------------------------
-- PROVE IT
--
-- Every switch genshin had in the library's table, its value as the rules
-- above make it, with when it changed and by whom; every page with its
-- visibility, its switch, its API paths, its place, its time and its writer;
-- as many pages as there were, and nothing else in either table.
-----------------------------------------------------------

DO $$
DECLARE
    found TEXT;
BEGIN
    SELECT string_agg(s.name, ', ' ORDER BY s.name) INTO found
      FROM site_settings s
     WHERE NOT EXISTS (
           SELECT 1 FROM anotoki_site_settings a
            WHERE a.name = s.name
              AND a.value = CASE
                      WHEN s.name IN ('maintenance_mode', 'announcement_enabled')
                          THEN to_jsonb(lower(trim(COALESCE(s.value, ''))) = 'true')
                      WHEN s.name = 'announcement_level'
                          THEN to_jsonb(CASE WHEN s.value IN ('info', 'warning', 'danger') THEN s.value ELSE 'info' END)
                      ELSE (SELECT CASE WHEN jsonb_typeof(m.v) = 'object' THEN m.v ELSE '{}'::jsonb END
                              FROM (SELECT NULLIF(trim(COALESCE(s.value, '')), '')::jsonb AS v) AS m)
                  END
              AND a.updated_at IS NOT DISTINCT FROM s.updated_at AT TIME ZONE current_setting('TimeZone')
              AND a.updated_by IS NOT DISTINCT FROM s.updated_by::BIGINT);
    IF found IS NOT NULL THEN
        RAISE EXCEPTION 'users/066: switches that did not come through as they were: %', found;
    END IF;

    IF (SELECT count(*) FROM anotoki_site_settings) <> (SELECT count(*) FROM site_settings) THEN
        RAISE EXCEPTION 'users/066: the library''s table holds % switches, where genshin''s held %',
            (SELECT count(*) FROM anotoki_site_settings), (SELECT count(*) FROM site_settings);
    END IF;

    SELECT string_agg(r.path, ', ' ORDER BY r.path) INTO found
      FROM site_routes r
     WHERE NOT EXISTS (
           SELECT 1 FROM anotoki_page_access a
            WHERE a.path = r.path
              AND a.visibility = r.visibility
              AND a.blocked = r.blocked
              AND a.api_paths = COALESCE((SELECT array_agg(e.prefix::TEXT ORDER BY e.prefix COLLATE "C") FROM site_route_endpoints e WHERE e.route_id = r.id), '{}'::TEXT[])
              AND a.sort_order = r.sort_order
              AND a.updated_at IS NOT DISTINCT FROM r.updated_at AT TIME ZONE current_setting('TimeZone')
              AND a.updated_by IS NOT DISTINCT FROM r.updated_by::BIGINT);
    IF found IS NOT NULL THEN
        RAISE EXCEPTION 'users/066: pages that did not come through as they were: %', found;
    END IF;

    IF (SELECT count(*) FROM anotoki_page_access) <> (SELECT count(*) FROM site_routes) THEN
        RAISE EXCEPTION 'users/066: the library''s table holds % pages, where genshin''s held %',
            (SELECT count(*) FROM anotoki_page_access), (SELECT count(*) FROM site_routes);
    END IF;

    IF (SELECT count(*) FROM anotoki_page_access a, unnest(a.api_paths)) <> (SELECT count(*) FROM site_route_endpoints) THEN
        RAISE EXCEPTION 'users/066: the pages refuse % API paths between them, where genshin''s refused %',
            (SELECT count(*) FROM anotoki_page_access a, unnest(a.api_paths)), (SELECT count(*) FROM site_route_endpoints);
    END IF;
END $$;

-----------------------------------------------------------
-- THE OLD TABLES GO
-----------------------------------------------------------

DROP TABLE site_route_endpoints;
DROP TABLE site_routes;
DROP TABLE site_settings;

-----------------------------------------------------------
-- THE WORDS GO
-----------------------------------------------------------

DELETE FROM translation_keys WHERE name IN (
    'legal.storage.announcement.kept',
    'legal.storage.announcement.purpose',
    'route.audience.ADMIN',
    'route.audience.EDITOR',
    'route.audience.PUBLIC',
    'route.audience.USER',
    'route.blockedText',
    'route.blockedTitle',
    'route.restrictedText',
    'route.restrictedTitle',
    'site.announcement.hide',
    'site.maintenance.signIn',
    'site.maintenance.staffLead',
    'site.maintenance.text',
    'site.maintenance.title'
);

-----------------------------------------------------------
-- AND PROVE THAT
--
-- The three tables are gone, none of the fifteen keys is left nor a string
-- under one - and the menu's mark is still here.
-----------------------------------------------------------

DO $$
DECLARE
    leftover TEXT;
BEGIN
    IF to_regclass('site_settings') IS NOT NULL OR to_regclass('site_routes') IS NOT NULL OR to_regclass('site_route_endpoints') IS NOT NULL THEN
        RAISE EXCEPTION 'users/066: genshin''s own site settings tables are still here';
    END IF;

    SELECT string_agg(name, ', ' ORDER BY name) INTO leftover
      FROM (
          SELECT name FROM translation_keys
           WHERE name IN (
               'legal.storage.announcement.kept', 'legal.storage.announcement.purpose', 'route.audience.ADMIN',
               'route.audience.EDITOR', 'route.audience.PUBLIC', 'route.audience.USER', 'route.blockedText',
               'route.blockedTitle', 'route.restrictedText', 'route.restrictedTitle', 'site.announcement.hide',
               'site.maintenance.signIn', 'site.maintenance.staffLead', 'site.maintenance.text', 'site.maintenance.title'
           )
          UNION
          SELECT key_name FROM translations
           WHERE key_name IN (
               'legal.storage.announcement.kept', 'legal.storage.announcement.purpose', 'route.audience.ADMIN',
               'route.audience.EDITOR', 'route.audience.PUBLIC', 'route.audience.USER', 'route.blockedText',
               'route.blockedTitle', 'route.restrictedText', 'route.restrictedTitle', 'site.announcement.hide',
               'site.maintenance.signIn', 'site.maintenance.staffLead', 'site.maintenance.text', 'site.maintenance.title'
           )
      ) AS left_behind;
    IF leftover IS NOT NULL THEN
        RAISE EXCEPTION 'users/066: the old closed sign''s, bar''s and notice''s strings are still here: %', leftover;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM translation_keys WHERE name = 'route.hiddenBadge') THEN
        RAISE EXCEPTION 'users/066: route.hiddenBadge, which the public menu still reads, is gone';
    END IF;
END $$;
