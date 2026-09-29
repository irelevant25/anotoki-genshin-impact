-- A record of every message the API sends, so what went out and when can be
-- checked from the admin panel. Written at the one choke point, sendMail().
--
-- Deliberately metadata only. The bodies carry live secrets - a password-reset
-- link, a confirmation token - and the sign-in-code email carries the code in
-- its subject, so no body is stored and a subject is kept only for the kinds
-- whose subject holds nothing secret (see MAIL_SUBJECT_SAFE_KINDS). A log of
-- what was sent must not become a store of live keys to accounts.

CREATE TABLE IF NOT EXISTS email_log (
    id          SERIAL          PRIMARY KEY,
    recipient   VARCHAR(320)    NOT NULL,
    -- Why it was sent: confirmation | password_reset | login_code (and any
    -- future kind). This is the "what", filterable, and never sensitive.
    kind        VARCHAR(64)     NOT NULL,
    -- Only stored for subject-safe kinds; NULL otherwise, so a sign-in code is
    -- never persisted.
    subject     VARCHAR(255),
    -- sent | failed, from what the mail driver reported.
    status      VARCHAR(16)     NOT NULL,
    error       TEXT,
    -- The account it went to, when there is one. Kept if the row is a hard
    -- delete elsewhere, so the trail is not rewritten by an account removal.
    user_id     INT             REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Newest-first paging, and the two filters the page offers.
CREATE INDEX IF NOT EXISTS email_log_created_at_idx ON email_log (created_at DESC);
CREATE INDEX IF NOT EXISTS email_log_kind_idx ON email_log (kind);
CREATE INDEX IF NOT EXISTS email_log_status_idx ON email_log (status);
