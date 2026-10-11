-----------------------------------------------------------
-- THE AUDIT LOG MOVES INTO THE ANOTOKI LIBRARY'S TABLE
--
-- From this release the record of what was done on the site is the anotoki
-- sites' shared one (anotoki-lib 0.4.1, its audit log, set up for this site
-- in api/audit_log.php): the library's table anotoki_audit_log, which its set
-- anotoki_admin makes before this site's folders run, read by the admin
-- panel's Audit page - for this site's ADMIN alone now (the owner's decision:
-- EDITORs see none of the admin tools). Every entry of audit_logs moves into
-- it, with its id, by these rules:
--
--   changed_at                  -> created_at: a TIMESTAMPTZ. It was written in
--                                  the time zone of the connection, which this
--                                  site never sets - the database server's own -
--                                  and is read in that same zone here, so each
--                                  keeps the moment it stood for (users/050).
--   changed_by                  -> actor_id
--   session_id                  -> actor_session (the IAM's sid)
--   action                      -> content.insert|update|delete; on the files
--                                  catalogue (table_name 'files') catalogue.insert|
--                                  update|move|delete|reconcile, so the catalogue's
--                                  history never mixes with the file explorer's
--                                  own file.* entries
--   table_name, record_id       -> target_type, target_id
--   entity_table, entity_id     -> scope_type, scope_id (what a row belongs to:
--                                  a character's talents under the character)
--   changes                     -> details, as they are ({field: {old, new}} for
--                                  an update, the row for an insert)
-- and no address (this site never kept one). The writers write the library's
-- table from this release on, with the same names (DbQuery, the catalogue, the
-- words); until this file has run they hold their entries back in
-- storage/logs/audit-pending.jsonl, which the Apply that runs it flushes - so
-- nothing takes an id one of these rows needs.
--
-- NOTHING IS LOST
--
-- audit_logs itself stays, renamed audit_logs_before_library, unread, for one
-- release; a later migration drops it once the owner has looked. The gate
-- proves that every row of it is in the library's table, field for field.
--
-- NOT A WAY BACK
--
-- A build from before this file writes audit_logs; after it, that table is
-- gone and such a build's entries are lost (silently: its writer swallowed
-- every error). Upload the new build first, then Apply; once this has run, an
-- older build never goes on the host again.
-----------------------------------------------------------

DO $$
BEGIN
    IF to_regclass('anotoki_audit_log') IS NULL THEN
        RAISE EXCEPTION 'genshin_impact/028: the library''s table anotoki_audit_log is not there - its set anotoki_admin runs first (api/migration_runner.php)';
    END IF;
    IF EXISTS (SELECT 1 FROM anotoki_audit_log a JOIN audit_logs o ON o.id = a.id) THEN
        RAISE EXCEPTION 'genshin_impact/028: anotoki_audit_log already holds entries with the ids of audit_logs - something wrote it before the move. Look at them before applying this.';
    END IF;
END $$;

INSERT INTO anotoki_audit_log (id, created_at, actor_id, actor_session, action, target_type, target_id, scope_type, scope_id, details, ip)
SELECT o.id,
       o.changed_at AT TIME ZONE current_setting('TimeZone'),
       o.changed_by,
       o.session_id,
       CASE WHEN o.table_name = 'files' THEN 'catalogue.' ELSE 'content.' END || lower(o.action),
       o.table_name,
       o.record_id,
       o.entity_table,
       o.entity_id,
       o.changes,
       NULL
  FROM audit_logs o
 ORDER BY o.id;

-- The next entry comes after the last one moved.
SELECT setval(pg_get_serial_sequence('anotoki_audit_log', 'id'),
              COALESCE((SELECT max(id) FROM anotoki_audit_log), 1),
              (SELECT max(id) FROM anotoki_audit_log) IS NOT NULL);

ALTER TABLE audit_logs RENAME TO audit_logs_before_library;

COMMENT ON TABLE audit_logs_before_library IS
    'genshin_impact/028: audit_logs as it was before its rows moved into the anotoki library''s anotoki_audit_log. Unread; kept for one release, a later migration drops it.';

-----------------------------------------------------------
-- PROVE IT
--
-- Every row of the old log in the library's table under its own id, field for
-- field by the rules above; as many of each action as there were; the old
-- table only under its new name; and the next id past the last one.
-----------------------------------------------------------

DO $$
DECLARE
    found TEXT;
    next_id BIGINT;
BEGIN
    IF to_regclass('audit_logs') IS NOT NULL OR to_regclass('audit_logs_before_library') IS NULL THEN
        RAISE EXCEPTION 'genshin_impact/028: audit_logs is still there, or its copy is not';
    END IF;

    SELECT string_agg(missing.id::TEXT, ', ' ORDER BY missing.id) INTO found
      FROM (SELECT o.id
              FROM audit_logs_before_library o
             WHERE NOT EXISTS (
                   SELECT 1 FROM anotoki_audit_log a
                    WHERE a.id = o.id
                      AND a.created_at = o.changed_at AT TIME ZONE current_setting('TimeZone')
                      AND a.actor_id IS NOT DISTINCT FROM o.changed_by
                      AND a.actor_session IS NOT DISTINCT FROM o.session_id
                      AND a.action = CASE WHEN o.table_name = 'files' THEN 'catalogue.' ELSE 'content.' END || lower(o.action)
                      AND a.target_type = o.table_name
                      AND a.target_id = o.record_id
                      AND a.scope_type IS NOT DISTINCT FROM o.entity_table
                      AND a.scope_id IS NOT DISTINCT FROM o.entity_id
                      AND a.details IS NOT DISTINCT FROM o.changes
                      AND a.ip IS NULL)
             ORDER BY o.id
             LIMIT 20) AS missing;
    IF found IS NOT NULL THEN
        RAISE EXCEPTION 'genshin_impact/028: entries that did not come through field for field: %', found;
    END IF;

    SELECT string_agg(o.action || ': ' || o.n || ' before, ' || COALESCE(a.n, 0) || ' after', '; ') INTO found
      FROM (SELECT CASE WHEN table_name = 'files' THEN 'catalogue.' ELSE 'content.' END || lower(action) AS action, count(*) AS n
              FROM audit_logs_before_library GROUP BY 1) AS o
      LEFT JOIN (SELECT action, count(*) AS n
                   FROM anotoki_audit_log
                  WHERE id IN (SELECT id FROM audit_logs_before_library)
                  GROUP BY action) AS a ON a.action = o.action
     WHERE a.n IS DISTINCT FROM o.n;
    IF found IS NOT NULL THEN
        RAISE EXCEPTION 'genshin_impact/028: the actions do not add up - %', found;
    END IF;

    EXECUTE format('SELECT CASE WHEN is_called THEN last_value + 1 ELSE last_value END FROM %s',
                   pg_get_serial_sequence('anotoki_audit_log', 'id')) INTO next_id;
    IF next_id <= COALESCE((SELECT max(id) FROM anotoki_audit_log), 0) THEN
        RAISE EXCEPTION 'genshin_impact/028: the next entry would take id %, which a moved one has', next_id;
    END IF;
END $$;
