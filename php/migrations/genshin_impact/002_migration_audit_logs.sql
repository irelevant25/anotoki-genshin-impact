-----------------------------------------------------------
-- AUDIT_LOGS
-- name: AuditLog
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id          BIGSERIAL       PRIMARY KEY,
    table_name  VARCHAR(100)    NOT NULL,
    record_id   VARCHAR(100)    NOT NULL,
    action      VARCHAR(10)     NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    changed_by  INTEGER,                          -- user id, no FK (users live in a separate DB)
    changed_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    changes     JSONB                             -- full payload for INSERT, field diff for UPDATE/DELETE
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs (table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_at   ON audit_logs (changed_at);
