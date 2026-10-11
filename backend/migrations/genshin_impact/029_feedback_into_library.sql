-----------------------------------------------------------
-- FEEDBACK MOVES INTO THE ANOTOKI LIBRARY'S TABLE
--
-- From this release what visitors tell the site is kept by the anotoki sites'
-- shared library (anotoki-lib 0.4.1, its feedback module, set up for this
-- site in api/admin_tools.php): the library's form in the footer, and the
-- admin panel's Feedback page - for this site's ADMIN alone now (the owner's
-- decision: EDITORs see none of the admin tools). Its table anotoki_feedback
-- is made by the library's set anotoki_admin, before this site's folders run.
-- Every message of `feedback` moves into it, with its id, by these rules:
--
--   type Bug | Suggestion | Other  -> kind bug | idea | other
--   status, section, user_id, language -> as they are
--   title                          -> subject
--   the words                      -> message: the first of message, details,
--                                     steps_to_reproduce, actual_behavior,
--                                     expected_behavior, why_important,
--                                     additional_info, browser_device_info and
--                                     title that has any (the library's message
--                                     is never empty); every other of those
--                                     with words goes into details under its own
--                                     name - the names the new form uses for the
--                                     same fields (api/admin_tools.php)
--   email                          -> contact_email
--   page_url                       -> page: the path, never its query (the
--                                     library's rule), at most 300 characters -
--                                     and where that is not all of it, the
--                                     address as it was sent goes into details
--                                     as page_url, so nothing is lost
--   user_agent                     -> user_agent, at most 300 characters; a
--                                     longer one whole in details too
--   created_at, updated_at         -> TIMESTAMPTZ. They were written in the
--                                     time zone of the connection, which this
--                                     site never sets - the database server's
--                                     own - and are read in that same zone here,
--                                     so each keeps the moment it stood for.
--
-- What does not move, by the owner's decision: ip and submitter_hash - where a
-- message came from is kept with none of them any more (the library counts its
-- limits apart, a day at a time, outside the database), and is nowhere in the
-- database once this has run. Files made before it still hold it until the
-- owner deletes them (DEV.md, the 0.4.1 update's last step): the old pg_dump
-- folders under storage/backups/ and the library's backup this Apply makes
-- first (the column), and the site's old error log files,
-- storage/logs/errors-*.jsonl (every request's address, as it came).
--
-- Nor does the username: it was a copy of the sender's name, and the page
-- reads the name from `users` by user_id, so an account the IAM deleted shows
-- nobody.
--
-- NOTHING ELSE IS LOST
--
-- feedback itself stays, without ip and submitter_hash, renamed
-- feedback_before_library, unread, for one release; a later migration drops
-- it once the owner has looked. The gate proves that every message of it is in
-- the library's table, every word where these rules put it.
--
-- NOT A WAY BACK
--
-- A build from before this file reads and writes `feedback`, gone after it.
-- Upload the new build first, then Apply; once this has run, an older build
-- never goes on the host again.
-----------------------------------------------------------

DO $$
BEGIN
    IF to_regclass('anotoki_feedback') IS NULL THEN
        RAISE EXCEPTION 'genshin_impact/029: the library''s table anotoki_feedback is not there - its set anotoki_admin runs first (api/migration_runner.php)';
    END IF;
    IF EXISTS (SELECT 1 FROM anotoki_feedback n JOIN feedback o ON o.id = n.id) THEN
        RAISE EXCEPTION 'genshin_impact/029: anotoki_feedback already holds messages with the ids of feedback - something wrote it before the move. Look at them before applying this.';
    END IF;
END $$;

INSERT INTO anotoki_feedback (id, created_at, updated_at, kind, status, section, subject, message, details,
                              contact_email, user_id, page, language, user_agent, handled_by, handled_at)
SELECT f.id,
       COALESCE(f.created_at, f.updated_at, LOCALTIMESTAMP) AT TIME ZONE current_setting('TimeZone'),
       COALESCE(f.updated_at, f.created_at, LOCALTIMESTAMP) AT TIME ZONE current_setting('TimeZone'),
       CASE f.type WHEN 'Bug' THEN 'bug' WHEN 'Suggestion' THEN 'idea' ELSE 'other' END,
       f.status,
       f.section,
       f.title,
       COALESCE(words.text, '(no words)'),
       jsonb_strip_nulls(jsonb_build_object(
           'message',             CASE WHEN words.source IS DISTINCT FROM 'message' THEN NULLIF(f.message, '') END,
           'details',             CASE WHEN words.source IS DISTINCT FROM 'details' THEN NULLIF(f.details, '') END,
           'steps_to_reproduce',  CASE WHEN words.source IS DISTINCT FROM 'steps_to_reproduce' THEN NULLIF(f.steps_to_reproduce, '') END,
           'actual_behavior',     CASE WHEN words.source IS DISTINCT FROM 'actual_behavior' THEN NULLIF(f.actual_behavior, '') END,
           'expected_behavior',   CASE WHEN words.source IS DISTINCT FROM 'expected_behavior' THEN NULLIF(f.expected_behavior, '') END,
           'why_important',       CASE WHEN words.source IS DISTINCT FROM 'why_important' THEN NULLIF(f.why_important, '') END,
           'additional_info',     CASE WHEN words.source IS DISTINCT FROM 'additional_info' THEN NULLIF(f.additional_info, '') END,
           'browser_device_info', CASE WHEN words.source IS DISTINCT FROM 'browser_device_info' THEN NULLIF(f.browser_device_info, '') END,
           'page_url',            CASE WHEN f.page_url IS DISTINCT FROM place.page THEN f.page_url END,
           'user_agent',          CASE WHEN length(f.user_agent) > 300 THEN f.user_agent END,
           'email',               CASE WHEN length(f.email) > 254 THEN f.email END
       )),
       CASE WHEN length(f.email) <= 254 THEN NULLIF(f.email, '') END,
       f.user_id,
       place.page,
       f.language,
       left(f.user_agent, 300),
       NULL,
       NULL
  FROM feedback f
  LEFT JOIN LATERAL (
       SELECT c.source, c.text
         FROM (VALUES
                  (1, 'message', f.message),
                  (2, 'details', f.details),
                  (3, 'steps_to_reproduce', f.steps_to_reproduce),
                  (4, 'actual_behavior', f.actual_behavior),
                  (5, 'expected_behavior', f.expected_behavior),
                  (6, 'why_important', f.why_important),
                  (7, 'additional_info', f.additional_info),
                  (8, 'browser_device_info', f.browser_device_info),
                  (9, 'title', f.title)
              ) AS c (n, source, text)
        WHERE c.text ~ '\S'
        ORDER BY c.n
        LIMIT 1
  ) AS words ON TRUE
  CROSS JOIN LATERAL (
       SELECT CASE
                  WHEN split_part(split_part(f.page_url, '?', 1), '#', 1) LIKE '/%'
                   AND split_part(split_part(f.page_url, '?', 1), '#', 1) NOT LIKE '//%'
                  THEN left(split_part(split_part(f.page_url, '?', 1), '#', 1), 300)
              END AS page
  ) AS place
 ORDER BY f.id;

-- The next message comes after the last one moved.
SELECT setval(pg_get_serial_sequence('anotoki_feedback', 'id'),
              COALESCE((SELECT max(id) FROM anotoki_feedback), 1),
              (SELECT max(id) FROM anotoki_feedback) IS NOT NULL);

-- Where a message came from, by the owner's decision kept nowhere in the
-- database - not in the copy either.
ALTER TABLE feedback DROP COLUMN IF EXISTS ip;
ALTER TABLE feedback DROP COLUMN IF EXISTS submitter_hash;

ALTER TABLE feedback RENAME TO feedback_before_library;

COMMENT ON TABLE feedback_before_library IS
    'genshin_impact/029: feedback as it was before its messages moved into the anotoki library''s anotoki_feedback, without ip and submitter_hash. Unread; kept for one release, a later migration drops it.';

-----------------------------------------------------------
-- PROVE IT
--
-- Every message of the old table in the library's under its own id: its kind,
-- status, section, subject, sender, language and times; each of its texts,
-- word for word, as the message or under its name in details; its page, its
-- browser and its address as these rules keep them - and nothing of where it
-- came from, in either table. The next id past the last one.
-----------------------------------------------------------

DO $$
DECLARE
    found TEXT;
    next_id BIGINT;
BEGIN
    IF to_regclass('feedback') IS NOT NULL OR to_regclass('feedback_before_library') IS NULL THEN
        RAISE EXCEPTION 'genshin_impact/029: feedback is still there, or its copy is not';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema = current_schema()
                  AND table_name IN ('feedback_before_library', 'anotoki_feedback')
                  AND column_name IN ('ip', 'submitter_hash', 'client_hash')) THEN
        RAISE EXCEPTION 'genshin_impact/029: where a message came from is still kept';
    END IF;

    SELECT string_agg(missing.id::TEXT, ', ' ORDER BY missing.id) INTO found
      FROM (SELECT o.id
              FROM feedback_before_library o
              LEFT JOIN anotoki_feedback n ON n.id = o.id
             WHERE n.id IS NULL
                OR n.kind <> CASE o.type WHEN 'Bug' THEN 'bug' WHEN 'Suggestion' THEN 'idea' ELSE 'other' END
                OR n.status <> o.status
                OR n.section IS DISTINCT FROM o.section
                OR n.subject IS DISTINCT FROM o.title
                OR n.user_id IS DISTINCT FROM o.user_id
                OR n.language IS DISTINCT FROM o.language
                OR (COALESCE(o.created_at, o.updated_at) IS NOT NULL
                    AND n.created_at <> COALESCE(o.created_at, o.updated_at) AT TIME ZONE current_setting('TimeZone'))
                OR (COALESCE(o.updated_at, o.created_at) IS NOT NULL
                    AND n.updated_at <> COALESCE(o.updated_at, o.created_at) AT TIME ZONE current_setting('TimeZone'))
                -- every text, as the message or under its own name
                OR EXISTS (SELECT 1
                             FROM (VALUES ('message', o.message), ('details', o.details),
                                          ('steps_to_reproduce', o.steps_to_reproduce), ('actual_behavior', o.actual_behavior),
                                          ('expected_behavior', o.expected_behavior), ('why_important', o.why_important),
                                          ('additional_info', o.additional_info), ('browser_device_info', o.browser_device_info)
                                  ) AS t (name, text)
                            WHERE t.text IS NOT NULL AND t.text <> ''
                              AND n.message IS DISTINCT FROM t.text
                              AND (n.details ->> t.name) IS DISTINCT FROM t.text)
                -- the message is words of the row, or says there were none
                OR (n.message NOT IN (SELECT t.text
                                        FROM (VALUES (o.message), (o.details), (o.steps_to_reproduce), (o.actual_behavior),
                                                     (o.expected_behavior), (o.why_important), (o.additional_info),
                                                     (o.browser_device_info), (o.title)) AS t (text)
                                       WHERE t.text IS NOT NULL)
                    AND n.message <> '(no words)')
                -- the page, the browser and the address: as they were, or whole in details
                OR (o.page_url IS NULL AND (n.page IS NOT NULL OR (n.details ->> 'page_url') IS NOT NULL))
                OR (o.page_url IS NOT NULL AND n.page IS DISTINCT FROM o.page_url AND (n.details ->> 'page_url') IS DISTINCT FROM o.page_url)
                OR (o.user_agent IS NULL AND n.user_agent IS NOT NULL)
                OR (o.user_agent IS NOT NULL AND n.user_agent IS DISTINCT FROM o.user_agent AND (n.details ->> 'user_agent') IS DISTINCT FROM o.user_agent)
                OR (NULLIF(o.email, '') IS NULL AND n.contact_email IS NOT NULL)
                OR (NULLIF(o.email, '') IS NOT NULL AND n.contact_email IS DISTINCT FROM o.email AND (n.details ->> 'email') IS DISTINCT FROM o.email)
             ORDER BY o.id
             LIMIT 20) AS missing;
    IF found IS NOT NULL THEN
        RAISE EXCEPTION 'genshin_impact/029: messages that did not come through as they were: %', found;
    END IF;

    IF (SELECT count(*) FROM anotoki_feedback WHERE id IN (SELECT id FROM feedback_before_library))
       <> (SELECT count(*) FROM feedback_before_library) THEN
        RAISE EXCEPTION 'genshin_impact/029: the messages do not add up';
    END IF;

    EXECUTE format('SELECT CASE WHEN is_called THEN last_value + 1 ELSE last_value END FROM %s',
                   pg_get_serial_sequence('anotoki_feedback', 'id')) INTO next_id;
    IF next_id <= COALESCE((SELECT max(id) FROM anotoki_feedback), 0) THEN
        RAISE EXCEPTION 'genshin_impact/029: the next message would take id %, which a moved one has', next_id;
    END IF;
END $$;
