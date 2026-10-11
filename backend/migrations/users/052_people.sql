-----------------------------------------------------------
-- PEOPLE: THIS SITE'S RECORD OF THEM, THROUGH THE ANOTOKI LIBRARY
--
-- From this release the anotoki sites' shared library keeps this site's
-- record of the people who use it (anotoki-lib 0.4.1, its people module, set
-- up for this site in api/admin_tools.php): the rows of `users`, made and
-- named from each person's verified token, listed on the admin panel's People
-- page - and scrubbed when the IAM deletes an account, thirty days after its
-- owner asked: the name becomes deleted-{id}, everything else stays, nobody's
-- now. The library's own set anotoki_people (vendor/anotoki/lib/php/
-- migrations/people) runs after this site's folders and makes its two
-- tables; this file gets `users` ready for it. Three changes:
--
--   anonymized_at  when the IAM anonymized the person - a TIMESTAMPTZ, NULL
--                  for everybody now. The one column every site adds: the
--                  scrub looks for it and stays idle until it is there.
--   email          goes. No anotoki site keeps a copy of anybody's address
--                  (the owner's decision of 2026-10-07): the IAM holds it, and
--                  a page that shows people their own reads it from their
--                  token. Nothing reads the column from this release on, and
--                  what it held is nowhere in the database any more - but
--                  still in the backups made before this file ran (the old
--                  pg_dump folders under storage/backups/, and the library's
--                  backup this Apply makes first) until the owner deletes
--                  them (DEV.md, the 0.4.1 update's last step).
--   created_at     becomes a TIMESTAMPTZ. It was written in the time zone of
--                  the connection, which this site never sets - the database
--                  server's own - and is read in that same zone here, so each
--                  keeps the moment it stood for (users/050 did the same for
--                  the words' stamps). The library writes a first visit as
--                  the moment it is, and the People page reads it as one.
--
-- background and version stay as they are, and no row is added or removed:
-- the gate proves it, with every name and every first-seen moment as it was.
--
-- NOT A WAY BACK
--
-- A build from before this file writes users.email on every signed-in
-- request, and would fail there. Upload the new build first, then Apply;
-- once this has run, an older build never goes on the host again.
-----------------------------------------------------------

-- What the gate compares against: every row as it stands before anything
-- below runs. Gone with this file's transaction.
CREATE TEMPORARY TABLE users_before_052 ON COMMIT DROP AS
    SELECT id, username, created_at FROM users;

ALTER TABLE users ADD COLUMN IF NOT EXISTS anonymized_at TIMESTAMPTZ;

ALTER TABLE users DROP COLUMN IF EXISTS email;

-- Only while it is still a TIMESTAMP: run again over a TIMESTAMPTZ, the same
-- USING would move every moment by the zone's offset.
DO $$
BEGIN
    IF (SELECT data_type FROM information_schema.columns
         WHERE table_schema = current_schema() AND table_name = 'users' AND column_name = 'created_at')
       = 'timestamp without time zone' THEN
        ALTER TABLE users ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE current_setting('TimeZone');
    END IF;
END $$;

-----------------------------------------------------------
-- PROVE IT
--
-- The columns as the library reads them; every row still here, with its name
-- and its first-seen moment - read back in the zone it was written in, the
-- very value it held - and nobody anonymized yet.
-----------------------------------------------------------

DO $$
DECLARE
    found TEXT;
BEGIN
    IF (SELECT data_type FROM information_schema.columns
         WHERE table_schema = current_schema() AND table_name = 'users' AND column_name = 'anonymized_at')
       IS DISTINCT FROM 'timestamp with time zone'
       OR (SELECT data_type FROM information_schema.columns
            WHERE table_schema = current_schema() AND table_name = 'users' AND column_name = 'created_at')
       IS DISTINCT FROM 'timestamp with time zone'
       OR EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = current_schema() AND table_name = 'users' AND column_name = 'email') THEN
        RAISE EXCEPTION 'users/052: users is not as the people module reads it - anonymized_at and created_at TIMESTAMPTZ, no email';
    END IF;

    SELECT string_agg(b.id::TEXT, ', ' ORDER BY b.id) INTO found
      FROM (SELECT b.id
              FROM users_before_052 b
              LEFT JOIN users u ON u.id = b.id
             WHERE u.id IS NULL
                OR u.username IS DISTINCT FROM b.username
                OR (u.created_at AT TIME ZONE current_setting('TimeZone')) IS DISTINCT FROM b.created_at
             ORDER BY b.id
             LIMIT 20) AS b;
    IF found IS NOT NULL THEN
        RAISE EXCEPTION 'users/052: rows that did not come through with their name and first-seen moment: %', found;
    END IF;

    IF (SELECT count(*) FROM users) <> (SELECT count(*) FROM users_before_052)
       OR EXISTS (SELECT 1 FROM users WHERE anonymized_at IS NOT NULL) THEN
        RAISE EXCEPTION 'users/052: rows were added or anonymized on the way';
    END IF;
END $$;
