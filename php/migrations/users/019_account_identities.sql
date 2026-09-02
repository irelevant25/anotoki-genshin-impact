-----------------------------------------------------------
-- MORE THAN ONE WAY INTO AN ACCOUNT
--
-- An account has had exactly one door: an address and a password. This is the
-- schema for having several, and for closing one of them without closing the
-- account.
--
-- `user_identities` is who an account is at some other provider. A row is the
-- claim "this Google user is this account", and the two unique indexes are the
-- two halves of what that has to mean: one Google user cannot be two accounts
-- here, and one account cannot hold two Google identities. `subject` is the
-- provider's own id and never the address - people change addresses, and
-- Google's `sub` is the thing that does not move. The address is kept beside
-- it only so the account page can say which one is connected.
--
-- A table rather than columns on `users`, because a second provider later is
-- then a value rather than a migration - and because a partial answer, a
-- provider column filled in with no subject, is not representable at all.
--
-- `password_login_enabled` is the switch for an account that has a password
-- and would rather not be reachable through it. Distinct from having no
-- password: one is "there is nothing to check", the other is "there is, and it
-- is not to be accepted". Signing in needs both - a password on the row, and
-- this still true - and the endpoint that turns it off refuses unless some
-- other way in is already attached, so it cannot be used to lock an account.
--
-- `attempts` counts the wrong guesses at a token. It exists for the emailed
-- sign-in code, which is six digits because somebody has to type it, and six
-- digits is a million - worth guessing at if the guessing is free. Five wrong
-- and every live code for that account is put out, so it is not.
-----------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_identities (
    id          SERIAL          PRIMARY KEY,
    user_id     INT             NOT NULL,
    -- 'google' today. The column is what makes a second one cheap.
    provider    VARCHAR(32)     NOT NULL,
    -- The provider's own permanent id for the person, not their address.
    subject     VARCHAR(255)    NOT NULL,
    -- The address the provider gave, for the account page to show. Never used
    -- to decide anything.
    email       VARCHAR(255),
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_identities_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- One person at a provider is one account here. Without this, two accounts
-- could both claim the same Google user and signing in would pick whichever
-- the query happened to return first.
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_identities_provider_subject
    ON user_identities (provider, subject);

-- And one account holds at most one identity per provider, so "disconnect
-- Google" is unambiguous about what it disconnects.
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_identities_user_provider
    ON user_identities (user_id, provider);

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_login_enabled BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE user_tokens ADD COLUMN IF NOT EXISTS attempts INT NOT NULL DEFAULT 0;
