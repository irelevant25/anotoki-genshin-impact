-----------------------------------------------------------
-- THE ACCOUNTS MOVE TO THE IAM
--
-- Signing in is no longer this site's. Every anotoki site - this one, the
-- study apps, the build analyzer - signs people in through one identity
-- provider, the anotoki IAM at iam.anotoki.eu, which the site sends people to
-- and which hands back an access token the API checks against the IAM's
-- published keys. Passwords, two-factor, Google links, sessions, the sign-in
-- limiter and the mail those flows send all live there now.
--
-- The IAM took the accounts over with their ids (its import-legacy.php, or its
-- installer), so every created_by, updated_by and user_id in both of this
-- site's databases still names the same person. What is left here is this
-- site's own record of each of them: the name to show beside what they did,
-- the address a feedback reply goes to, and their preferences for reading this
-- site. The API keeps it in step with the token as people arrive.
--
-- So this removes:
--   the account tables - one-time tokens, identities, recovery codes,
--     remembered devices, sessions, sign-in attempts, the mail log;
--   the account columns of `users` - role (the IAM grants this site's roles
--     per token now), the password, its switch, the two-factor secret and
--     flag, the forced-change flag, email_confirmed and `deleted` (a disabled
--     account gets no token, which is the whole of what disabling means);
--   the uniqueness of username and email - the IAM decides those, and two
--     people swapping names there must not collide here before both visit;
--   the id default - ids are the IAM's, never handed out here;
--   the `roles` lookup, whose only use was the role column;
--   the two sign-in switches in site_settings, which are the IAM's now.
--
-- THE GATE
--
-- This drops the only copy of the passwords that exists until the IAM's import
-- has run, so it refuses to run until it has: the import leaves an
-- `iam_handover` table in this database when it commits. A database with no
-- password on any account - a fresh install - has nothing to lose and passes.
-----------------------------------------------------------

DO $$
BEGIN
    IF to_regclass('public.iam_handover') IS NULL
       AND EXISTS (SELECT 1 FROM users WHERE password IS NOT NULL OR totp_secret IS NOT NULL) THEN
        RAISE EXCEPTION 'The accounts here have not been brought over to the anotoki IAM yet, and this migration removes the only copy of their passwords. Run the IAM''s import first - php import-legacy.php --from=<this database> in the IAM repository, or its setup.php on the server - then apply this again.';
    END IF;
END $$;

DROP TABLE IF EXISTS user_tokens;
DROP TABLE IF EXISTS user_identities;
DROP TABLE IF EXISTS user_recovery_codes;
DROP TABLE IF EXISTS user_trusted_devices;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS user_login_attempts;
DROP TABLE IF EXISTS email_log;

ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_role;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_key;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;

ALTER TABLE users DROP COLUMN IF EXISTS role;
ALTER TABLE users DROP COLUMN IF EXISTS password;
ALTER TABLE users DROP COLUMN IF EXISTS password_login_enabled;
ALTER TABLE users DROP COLUMN IF EXISTS email_confirmed;
ALTER TABLE users DROP COLUMN IF EXISTS totp_secret;
ALTER TABLE users DROP COLUMN IF EXISTS totp_enabled;
ALTER TABLE users DROP COLUMN IF EXISTS force_password_change;
ALTER TABLE users DROP COLUMN IF EXISTS deleted;

-- Not every token carries an address (it needs the `email` scope), and a
-- missing one is not a reason to refuse somebody.
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- Ids come from the IAM. A local sequence would one day hand out an id the IAM
-- has given somebody else.
ALTER TABLE users ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS users_id_seq;

DROP TABLE IF EXISTS roles;

DELETE FROM site_settings WHERE name IN ('login_enabled', 'google_login_enabled');

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'users'
                  AND column_name IN ('password', 'totp_secret', 'role', 'deleted')) THEN
        RAISE EXCEPTION 'users still has account columns';
    END IF;
    IF to_regclass('public.user_sessions') IS NOT NULL OR to_regclass('public.user_identities') IS NOT NULL THEN
        RAISE EXCEPTION 'the account tables are still here';
    END IF;
    IF EXISTS (SELECT 1 FROM site_settings WHERE name IN ('login_enabled', 'google_login_enabled')) THEN
        RAISE EXCEPTION 'the sign-in switches are still here';
    END IF;
END $$;
