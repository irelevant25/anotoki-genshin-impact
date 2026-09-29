-----------------------------------------------------------
-- WHICH SIGN-IN, NAMED THE IAM'S WAY
--
-- `session_id` said which sign-in a change came from, as the number of a row
-- in this site's own session table. Signing in is the anotoki IAM's now, and
-- the access token names its session by the IAM's `sid`: 32 random hex
-- characters rather than a sequential number, so a token never says how many
-- sessions there have been.
--
-- The column becomes text to hold it. The numbers already in it are kept as
-- they are - the IAM brought the old sessions over with their ids, so an old
-- entry can still be looked up there as session 123, and a new one by its sid.
-- Not a foreign key, as before: the sessions live in another database.
-----------------------------------------------------------

ALTER TABLE audit_logs ALTER COLUMN session_id TYPE VARCHAR(64) USING session_id::text;

DO $$
BEGIN
    IF (SELECT data_type FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'session_id') <> 'character varying' THEN
        RAISE EXCEPTION 'audit_logs.session_id is not text';
    END IF;
END $$;
