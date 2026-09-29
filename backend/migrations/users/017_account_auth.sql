-----------------------------------------------------------
-- SELF-SERVICE ACCOUNTS
--
-- Until now an account could only be made from the admin site, and the API's
-- register endpoint signed the new account straight in without ever checking
-- that the address existed. This is the schema behind doing it properly:
-- confirm the address before the account can be used, and be able to prove
-- ownership of it again later for a forgotten password.
--
-- Three changes, and the first one matters most.
--
-- Every account that exists today is marked confirmed. Logging in is about to
-- require a confirmed address, and the only account here was made by an admin
-- at a mailbox - admin@localhost - that cannot receive anything. Without this
-- line the first deploy of the new rule locks the owner out of their own site.
-- The rule is for addresses somebody typed into a public form; an account that
-- predates the form was never in doubt.
--
-- `password` becomes nullable. Not needed yet, but signing in with Google is
-- next, and such an account has no password to store - NOT NULL would have to
-- be met with an empty string or a hash of nothing, either of which is a
-- password that something could one day be checked against. Absent says it
-- better and cannot be verified against by accident.
--
-- `user_tokens` holds the one-time secrets: the confirmation link, the
-- password reset, and later the emailed sign-in code. Only the SHA-256 of a
-- token is stored, never the token, so the table is worth nothing to anyone
-- who reads it - the same reasoning as the password column beside it. They
-- expire, and they are marked consumed rather than deleted so a link that is
-- clicked twice can say "already used" instead of "never existed".
--
-- The unused `users.token` and `users.token_expires_at` go at the same time.
-- They have been NULL on every row since the schema was written, nothing in
-- the API reads or writes them, and leaving a second, vaguer idea of "the
-- user's token" next to the table above would only invite the two to be
-- confused.
-----------------------------------------------------------

UPDATE users SET email_confirmed = TRUE WHERE deleted = FALSE;

ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

ALTER TABLE users DROP COLUMN IF EXISTS token;
ALTER TABLE users DROP COLUMN IF EXISTS token_expires_at;

CREATE TABLE IF NOT EXISTS user_tokens (
    id              SERIAL          PRIMARY KEY,
    user_id         INT             NOT NULL,
    -- What the token is for: 'email_confirm', 'password_reset', and from the
    -- next stage 'login_code'. A token is only ever accepted for the purpose
    -- it was issued for, so a confirmation link cannot reset a password.
    purpose         VARCHAR(32)     NOT NULL,
    -- SHA-256 of the token, hex. The token itself only ever exists in the
    -- message that carried it.
    token_hash      CHAR(64)        NOT NULL,
    expires_at      TIMESTAMP       NOT NULL,
    consumed_at     TIMESTAMP,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_tokens_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Verifying a token looks it up by its hash and nothing else, so this is the
-- index that matters. Unique: two live tokens hashing the same would mean the
-- generator has stopped being random, and the constraint says so loudly
-- instead of quietly letting one of them through.
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_tokens_hash ON user_tokens (token_hash);

-- Issuing one counts what is already outstanding for that user and purpose,
-- which is what keeps a resend button from becoming a way to post mail to
-- somebody else all afternoon.
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_purpose ON user_tokens (user_id, purpose);
