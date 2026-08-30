-----------------------------------------------------------
-- FEEDBACK AND CONTACT
-- name: Feedback
--
-- The form on the site has been collecting nothing: it logged to the console
-- and closed. This is where it lands.
--
-- Every field the form can show gets its own column rather than one JSON blob,
-- so the list can be filtered and read without unpacking. Which fields are
-- filled depends on the type: a bug carries steps and behaviour, a suggestion
-- carries details, anything else carries a message.
--
-- Who sent it is optional and separate from whether they were signed in.
-- Someone signed in may still send anonymously, and then nothing identifying
-- is written - not the id, not the name, not the address. `username` is a
-- snapshot rather than a join so a report stays readable after an account is
-- gone, and because the users live in another database.
--
-- `submitter_hash` is a salted hash of the sender's address, not the address.
-- It is only there to rate limit a public endpoint, and a hash does that job
-- without the table becoming a log of who visited from where.
-----------------------------------------------------------

CREATE TABLE IF NOT EXISTS feedback (
    id                  SERIAL          PRIMARY KEY,
    type                VARCHAR(20)     NOT NULL,
    status              VARCHAR(20)     NOT NULL DEFAULT 'new',
    section             VARCHAR(100),
    title               VARCHAR(200),

    user_id             INTEGER,
    username            VARCHAR(100),
    email               VARCHAR(255),

    message             TEXT,
    steps_to_reproduce  TEXT,
    expected_behavior   TEXT,
    actual_behavior     TEXT,
    browser_device_info TEXT,
    details             TEXT,
    why_important       TEXT,
    additional_info     TEXT,

    page_url            VARCHAR(500),
    user_agent          VARCHAR(500),
    language            VARCHAR(10),
    submitter_hash      VARCHAR(64),

    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP,

    CONSTRAINT chk_feedback_type   CHECK (type IN ('Bug', 'Suggestion', 'Other')),
    CONSTRAINT chk_feedback_status CHECK (status IN ('new', 'read', 'resolved', 'spam'))
);

CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_status     ON feedback (status);
CREATE INDEX IF NOT EXISTS idx_feedback_type       ON feedback (type);

-- Rate limiting counts recent rows for one sender, so that pair is the lookup.
CREATE INDEX IF NOT EXISTS idx_feedback_submitter  ON feedback (submitter_hash, created_at DESC);

CREATE OR REPLACE TRIGGER trg_feedback_updated_at
    BEFORE UPDATE ON feedback
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
