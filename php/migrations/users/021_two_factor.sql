-----------------------------------------------------------
-- TWO-FACTOR AUTHENTICATION
--
-- Off for everybody, and off for every account made afterwards. This is a
-- reference site for a game; the cost of being locked out of one is higher
-- than the cost of somebody getting into one, so it is offered rather than
-- imposed.
--
-- `totp_secret` and `totp_enabled` are two columns rather than one because
-- setting 2FA up has a middle: a secret is issued and shown as a QR code
-- before anybody has proved they scanned it, and until they have, the account
-- must not start demanding codes. So the secret arrives first and the flag
-- flips only once a code computed from it has come back.
--
-- The secret is stored as it is, and cannot be otherwise: verifying a code
-- means computing the same code, which needs the secret. It is worth being
-- plain about what that means - anybody who can read this table can generate
-- codes for it. 2FA here is protection against a stolen password, not against
-- a stolen database, and the password hashes in the same table are the reason
-- the database is worth protecting either way.
--
-- `user_recovery_codes` is the way back in when the phone is gone. These are
-- as powerful as the password, so they are hashed like one and spent on use.
-- A separate table rather than a column: they are ten rows with a used_at
-- each, and single-use is a property of a row.
-----------------------------------------------------------

ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret  VARCHAR(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS user_recovery_codes (
    id          SERIAL      PRIMARY KEY,
    user_id     INT         NOT NULL,
    -- SHA-256 of the code with its hyphen and case stripped. The code itself
    -- is shown once, when it is generated, and never again.
    code_hash   CHAR(64)    NOT NULL,
    used_at     TIMESTAMP,
    created_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_recovery_codes_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Spending one looks it up by owner and hash together, so a code can only ever
-- be spent against the account it was issued for.
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_recovery_codes_user_hash
    ON user_recovery_codes (user_id, code_hash);
