-----------------------------------------------------------
-- WHICH SIGN-IN A CHANGE WAS MADE FROM
--
-- `changed_by` says who. It does not say from where, and "where" was about to
-- be answered with an IP address - which stops meaning anything the moment
-- there is a CDN in front of the site, since every request then arrives from
-- the same handful of edge addresses.
--
-- The session is the better handle and the one this already has: it is created
-- at sign-in, it records the address and the browser as they were then, and it
-- can be revoked. One id here joins to all of that, and keeps answering after
-- the address has changed underneath it. It is not a foreign key because the
-- sessions live in the other database.
--
-- Null for anything with no session behind it: a migration, a sweep, a file
-- found on disk by the reconcile.
--
-- The `mac` column goes at the same time, from the two tables that had one -
-- see 038_drop_session_mac.sql for why it never held anything.
-----------------------------------------------------------

ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS session_id INTEGER;

CREATE INDEX IF NOT EXISTS idx_audit_logs_session ON audit_logs (session_id);

ALTER TABLE feedback DROP COLUMN IF EXISTS mac;
