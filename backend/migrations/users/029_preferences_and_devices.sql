-----------------------------------------------------------
-- HOW A DATE READS, AND A DEVICE THAT NEED NOT ASK AGAIN
--
-- Two unrelated settings that happen to live on the same row.
--
-- DATES
--
-- 1.3.2026 and 03/01/2026 are the same day written by two people who would
-- both misread the other. The site had one answer for everybody - a pipe
-- called SlovakDatePipe with the Slovak order baked into it - which is right
-- here and wrong in most places the site can be read from.
--
-- The default is now the device's own setting, which is the only answer that
-- is right without being asked. These columns are for the reader whose device
-- disagrees with them: someone in Slovakia on a laptop bought in the States,
-- or anyone who simply prefers a 24-hour clock. NULL means "whatever this
-- device says", and that is what an account starts with.
--
-- Deliberately a short list rather than a format string. A free-typed pattern
-- is a way to produce a date nobody can read, and the four here cover the
-- orders actually in use.
--
-- TRUSTED DEVICES
--
-- Two-factor on a site like this is a nuisance if it asks on every sign-in
-- from the same laptop, and nuisance is what makes people turn it off. A
-- device that has already proved a code once can be remembered, and then the
-- password alone is enough from it until the token expires.
--
-- What is stored is a hash, like every other token here: the browser holds the
-- secret, and a copy of this table is no use to anybody. Thirty days, because
-- "remember me" that lasts forever is not a second factor at all.
--
-- Turning two-factor off or on, or changing the password, clears them. Those
-- are the moments somebody is shutting somebody else out, and a remembered
-- device is exactly what they would be trying to shut out.
-----------------------------------------------------------

-- 'auto' is not stored; the absence of a choice is what means "ask the device".
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_format VARCHAR(16);
ALTER TABLE users ADD COLUMN IF NOT EXISTS time_format VARCHAR(8);

ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_date_format;
ALTER TABLE users ADD CONSTRAINT chk_users_date_format
    CHECK (date_format IS NULL OR date_format IN ('dmy_dot', 'dmy_slash', 'mdy_slash', 'ymd_dash'));

ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_time_format;
ALTER TABLE users ADD CONSTRAINT chk_users_time_format
    CHECK (time_format IS NULL OR time_format IN ('24', '12'));

CREATE TABLE IF NOT EXISTS user_trusted_devices (
    id           SERIAL         PRIMARY KEY,
    user_id      INT            NOT NULL,
    -- sha256 of the secret the browser keeps. Never the secret itself.
    token_hash   CHAR(64)       NOT NULL,
    -- Enough to recognise a row on the account page and no more.
    user_agent   VARCHAR(255),
    ip           VARCHAR(45),
    created_at   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    expires_at   TIMESTAMP      NOT NULL,
    revoked_at   TIMESTAMP,

    CONSTRAINT fk_user_trusted_devices_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Every sign-in that presents one looks it up by hash.
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_trusted_devices_token ON user_trusted_devices (token_hash);
CREATE INDEX IF NOT EXISTS idx_user_trusted_devices_user ON user_trusted_devices (user_id, created_at DESC);
