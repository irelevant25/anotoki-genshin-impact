-----------------------------------------------------------
-- SESSIONS, AND THE ATTEMPTS THAT DID NOT BECOME ONE
--
-- The tokens this API issues have been stateless: signed, good for 48 hours,
-- and answerable to nothing once issued. That is cheap, and it costs three
-- things worth having.
--
-- Signing out did not sign anything out. It cleared the browser and told the
-- server as a courtesy; the token stayed valid until it expired, so anybody
-- who had copied it kept the account for up to two days. With a row per
-- session and an id inside the token, signing out revokes - and so does
-- signing out a device that is not the one being used.
--
-- Nothing limited how often a password could be guessed. TOTP codes and
-- emailed codes were rate-limited from the moment they existed; the password
-- itself, which is the thing actually worth guessing, was not. The attempts
-- table is what the limit counts.
--
-- And an account with several ways in - a password, Google, emailed codes -
-- had no way to show what had been used, or from where. An account page that
-- offers to disconnect Google should also be able to say when Google last
-- signed you in.
--
-- Both tables keep their rows. One row per sign-in is not a volume worth
-- managing on a site this size, and the question "when did I last sign in from
-- somewhere new" is only answerable if the old rows are still there.
-----------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_sessions (
    id              SERIAL          PRIMARY KEY,
    user_id         INT             NOT NULL,
    -- The id carried in the token, and the only thing linking the two. Random
    -- rather than the serial above, so a token never carries a number that
    -- says how many sessions this deployment has issued.
    token_id        CHAR(32)        NOT NULL,
    -- How this session was signed in: password, login_code or google. What
    -- makes the history worth reading rather than a list of timestamps.
    method          VARCHAR(16)     NOT NULL,
    ip              VARCHAR(45),
    user_agent      VARCHAR(255),
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    -- Touched at most once a minute rather than on every request: this is for
    -- telling a live session from a forgotten one, not for timing anybody.
    last_seen_at    TIMESTAMP,
    expires_at      TIMESTAMP       NOT NULL,
    revoked_at      TIMESTAMP,
    -- Why it ended, so the history can distinguish signing out from being
    -- signed out by a password change.
    revoked_reason  VARCHAR(32),

    CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Every authenticated request looks a session up by the id in its token, so
-- this is the index that matters. Unique because two sessions sharing an id
-- would mean the generator has stopped being random.
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions (token_id);

-- And the account page lists them newest first.
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS user_login_attempts (
    id          SERIAL          PRIMARY KEY,
    -- The address that was tried, whether or not it turned out to exist. The
    -- whole point is to count attempts on addresses that do not.
    email       VARCHAR(255)    NOT NULL,
    -- Filled in when there was an account behind it, so a person can be shown
    -- the failures against their own account without matching on a string.
    user_id     INT,
    ip          VARCHAR(45),
    method      VARCHAR(16)     NOT NULL,
    -- 'ok', or why not: bad_password, unconfirmed, totp_required, and so on.
    outcome     VARCHAR(24)     NOT NULL,
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_login_attempts_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- The limiter counts failures in a recent window, by address-and-source and by
-- source alone, so both need to be quick to count.
CREATE INDEX IF NOT EXISTS idx_user_login_attempts_email_ip ON user_login_attempts (email, ip, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_login_attempts_ip ON user_login_attempts (ip, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_login_attempts_user ON user_login_attempts (user_id, created_at DESC);
