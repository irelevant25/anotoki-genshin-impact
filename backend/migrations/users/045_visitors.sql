-----------------------------------------------------------
-- VISITORS: PLAYING WITHOUT SIGNING IN
--
-- Finished (2026-10-05): written whole, never edited after - a change is a
-- new migration. The owner applies it (php db-dump.php first, then
-- php migration.php; on the host the admin panel's Migrations page), after
-- the IAM's migration 010 and its public answer about this site are live.
-- Until it is applied the site behaves as before: the visitor paths answer
-- 503 visitors_unavailable and the pages keep a visitor's games in the
-- browser.
--
-- WHO A VISITOR IS
--
-- The IAM says, per site, whether signing in is required ("Sign-in
-- required", off for genshin). When it is not, somebody who plays without
-- signing in keeps their games and statistics on the server as a visitor:
-- a users row of this site's own, made by their first save that holds a
-- play (a guess, a pick) - never by a page view. Its id is negative, from
-- the sequence visitor_ids, so it can never be an IAM user id (always 1 or
-- more); its name is 'visitor' (username is NOT NULL, and not unique). It
-- holds the SHA-256 of a long random key the server made and handed to that
-- browser once; the browser sends the key back with its requests, and it
-- opens that visitor's own games and statistics and nothing else. A visitor
-- unseen for 30 days (config/visitors.php, keep_days) is deleted with
-- everything of theirs, by a sweep after somebody's answer; signing in
-- moves a visitor's games and statistics into the person's account. The
-- code is api/visitors.php.
--
-- visitor_starts counts the visitors made in the last hour by address (an
-- IPv6 address by its /64), for the limits on new visitors - each row is
-- kept for one hour only.
--
-- THE PEOPLE'S HALF ONLY
--
-- A users/ migration never names a genshin_impact/ table: on a fresh
-- install every users/ file runs before genshin_impact/001 makes the quiz
-- tables. The index the sweep, the move and the visitors' limit read on the
-- quiz history is genshin_impact/027.
--
-- Additive: one sequence, two columns (null for everybody there now), a
-- check that tells a visitor from a person (every row there passes it), two
-- indexes and one table. No row of anybody's changes. The words a visitor
-- reads arrive in a migration of their own (users/046), with the pages
-- that show them.
-----------------------------------------------------------

-- Visitor ids are the negative ones. A users row at 0 or below from
-- anywhere else would be taken for a visitor - or, with the check below,
-- would stop this migration with a less helpful message. On the first run
-- every id there must be 1 or more; on a run over a database that already
-- has visitors, only 0 is refused here (the check says the rest).
DO $$
DECLARE
    odd TEXT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                    WHERE table_schema = current_schema() AND table_name = 'users' AND column_name = 'visitor_key_hash') THEN
        SELECT string_agg(id::text, ', ' ORDER BY id) INTO odd FROM (SELECT id FROM users WHERE id <= 0 LIMIT 10) AS u;
    ELSE
        SELECT string_agg(id::text, ', ' ORDER BY id) INTO odd FROM (SELECT id FROM users WHERE id = 0 LIMIT 10) AS u;
    END IF;
    IF odd IS NOT NULL THEN
        RAISE EXCEPTION 'users rows with an id of 0 or below exist (%): visitor ids are the negative ones - give those rows their IAM ids, or delete them, before applying this', odd;
    END IF;
END $$;

-- users.id is an integer, so the sequence is one too: -1, -2, ...
CREATE SEQUENCE IF NOT EXISTS visitor_ids AS INTEGER INCREMENT BY -1 MAXVALUE -1 START WITH -1;

ALTER TABLE users ADD COLUMN IF NOT EXISTS visitor_key_hash CHAR(64);

ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

-- A negative id has a key's hash and a time it was last seen (so the sweep
-- can always find it), a positive one never has a hash, and 0 is nobody's.
-- Dropped and added again, so a second run is the same as the first.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_kind_check;

ALTER TABLE users ADD CONSTRAINT users_kind_check CHECK (
    id <> 0
    AND (id < 0) = (visitor_key_hash IS NOT NULL)
    AND (id > 0 OR last_seen_at IS NOT NULL)
    AND (visitor_key_hash IS NULL OR visitor_key_hash ~ '^[0-9a-f]{64}$')
);

-- A key is found by its hash; two visitors never share one (NULLs, the
-- people's, never clash).
CREATE UNIQUE INDEX IF NOT EXISTS users_visitor_key_hash ON users (visitor_key_hash);

-- The sweep takes the visitors unseen the longest first.
CREATE INDEX IF NOT EXISTS users_visitors_last_seen ON users (last_seen_at) WHERE id < 0;

CREATE TABLE IF NOT EXISTS visitor_starts (
    id         BIGSERIAL   PRIMARY KEY,
    address    TEXT        NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS visitor_starts_by_address ON visitor_starts (address, started_at);

CREATE INDEX IF NOT EXISTS visitor_starts_by_time ON visitor_starts (started_at);

-----------------------------------------------------------
-- PROVE IT
--
-- What this adds, in the shape the code reads it - and nothing here asks
-- for an empty table, so it holds just the same when the file runs again
-- over a database that already has visitors: the sequence counting down
-- from -1, the two columns, the check (validated: every row passes it), the
-- indexes, and the table of new visitors' addresses.
-----------------------------------------------------------

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_sequences
                    WHERE schemaname = current_schema() AND sequencename = 'visitor_ids'
                      AND data_type = 'integer'::regtype AND increment_by = -1 AND max_value = -1) THEN
        RAISE EXCEPTION 'the sequence visitor_ids is not an integer counting down from -1';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                    WHERE table_schema = current_schema() AND table_name = 'users' AND column_name = 'visitor_key_hash'
                      AND data_type = 'character' AND character_maximum_length = 64 AND is_nullable = 'YES') THEN
        RAISE EXCEPTION 'users.visitor_key_hash is not a char(64) that may be null';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                    WHERE table_schema = current_schema() AND table_name = 'users' AND column_name = 'last_seen_at'
                      AND data_type = 'timestamp with time zone' AND is_nullable = 'YES') THEN
        RAISE EXCEPTION 'users.last_seen_at is not a timestamptz that may be null';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint
                    WHERE conrelid = 'users'::regclass AND conname = 'users_kind_check' AND contype = 'c' AND convalidated) THEN
        RAISE EXCEPTION 'users has no validated users_kind_check';
    END IF;
    IF EXISTS (SELECT 1 FROM users
                WHERE id = 0 OR (id < 0) <> (visitor_key_hash IS NOT NULL) OR (id < 0 AND last_seen_at IS NULL)) THEN
        RAISE EXCEPTION 'a users row is neither a person (id above 0, no key) nor a visitor (id below 0, a key, last seen)';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_index i JOIN pg_class c ON c.oid = i.indexrelid
                    WHERE i.indrelid = 'users'::regclass AND c.relname = 'users_visitor_key_hash' AND i.indisunique) THEN
        RAISE EXCEPTION 'users has no unique index users_visitor_key_hash';
    END IF;
    IF to_regclass('users_visitors_last_seen') IS NULL THEN
        RAISE EXCEPTION 'users has no index users_visitors_last_seen';
    END IF;
    IF (SELECT count(*) FROM information_schema.columns
         WHERE table_schema = current_schema() AND table_name = 'visitor_starts'
           AND column_name IN ('id', 'address', 'started_at')) <> 3 THEN
        RAISE EXCEPTION 'the table visitor_starts (id, address, started_at) is not there';
    END IF;
    IF to_regclass('visitor_starts_by_address') IS NULL OR to_regclass('visitor_starts_by_time') IS NULL THEN
        RAISE EXCEPTION 'visitor_starts is missing an index';
    END IF;
END $$;
