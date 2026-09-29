-----------------------------------------------------------
-- MIGRATIONS
-- name: Migration
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS migrations (
    id         SERIAL          PRIMARY KEY,
    filename   VARCHAR(255)    NOT NULL UNIQUE,
    applied_at TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

-----------------------------------------------------------
-- TRIGGER FUNCTION: auto-update updated_at on row change
-- Requires PostgreSQL 14+ for CREATE OR REPLACE TRIGGER.
-----------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-----------------------------------------------------------
-- ROLES
-- name: Role
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    name VARCHAR(50) PRIMARY KEY
);
INSERT INTO roles (name) VALUES ('ADMIN'), ('EDITOR'), ('USER')
ON CONFLICT DO NOTHING;

-----------------------------------------------------------
-- THEMES
-- name: Theme
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS themes (
    name VARCHAR(50) PRIMARY KEY
);
INSERT INTO themes (name) VALUES ('light'), ('dark'), ('auto')
ON CONFLICT DO NOTHING;

-----------------------------------------------------------
-- LANGUAGES
-- name: Language
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS languages (
    name VARCHAR(50) PRIMARY KEY
);
INSERT INTO languages (name) VALUES
    ('English'), ('Slovak')
ON CONFLICT DO NOTHING;

-----------------------------------------------------------
-- USERS
-- name: User
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id                  SERIAL          PRIMARY KEY,
    role                VARCHAR(50)     NOT NULL DEFAULT 'USER',
    username            VARCHAR(100)    NOT NULL UNIQUE,
    email               VARCHAR(255)    NOT NULL UNIQUE,
    email_confirmed     BOOLEAN         NOT NULL DEFAULT FALSE,
    password            VARCHAR(255)    NOT NULL,
    background          VARCHAR(100)    NULL,
    language            VARCHAR(50)     NOT NULL DEFAULT 'English',
    deleted             BOOLEAN         NOT NULL DEFAULT FALSE,
    theme               VARCHAR(50)     NOT NULL DEFAULT 'auto',
    version             VARCHAR(10),
    token               VARCHAR(64)     UNIQUE,
    token_expires_at    TIMESTAMP,
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP,

    CONSTRAINT fk_users_role  FOREIGN KEY (role)  REFERENCES roles(name),
    CONSTRAINT fk_users_language FOREIGN KEY (language) REFERENCES languages(name),
    CONSTRAINT fk_users_theme FOREIGN KEY (theme) REFERENCES themes(name)
);
CREATE OR REPLACE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();