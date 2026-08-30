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
--
-- `name` stays the key so it reads in a dropdown, but `code` is what the
-- browser, the URL and the rest of the stack speak. `native_name` is the
-- language as its own speakers write it, which is what a chooser should show.
-- `enabled` retires a language without losing its translations.
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS languages (
    name        VARCHAR(50)  PRIMARY KEY,
    code        VARCHAR(10)  NOT NULL UNIQUE,
    native_name VARCHAR(50)  NOT NULL,
    enabled     BOOLEAN      NOT NULL DEFAULT TRUE,
    sort_order  INTEGER      NOT NULL DEFAULT 0
);
INSERT INTO languages (name, code, native_name, sort_order) VALUES
    ('English', 'en', 'English', 1),
    ('Slovak',  'sk', 'Slovenčina', 2)
ON CONFLICT DO NOTHING;

-----------------------------------------------------------
-- SITES
-- name: Site
--
-- The family of sites sharing this database. 'common' is a real row rather
-- than a null: a translation key scoped to it is loaded by every site.
-- Codes match the database aliases in config/database.php.
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS sites (
    code       VARCHAR(50)  PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    sort_order INTEGER      NOT NULL DEFAULT 0
);
INSERT INTO sites (code, name, sort_order) VALUES
    ('common',         'Shared by every site', 1),
    ('genshin_impact', 'Genshin Impact',       2),
    ('star_rail',      'Honkai Star Rail',     3)
ON CONFLICT DO NOTHING;

-----------------------------------------------------------
-- TRANSLATION KEYS
-- name: TranslationKey
--
-- A key exists on its own so it can be listed in the admin editor before
-- anyone has translated it, and so it can carry a note saying where it
-- appears. Without that a translator is guessing from the key alone.
--
-- `site` is what keeps one shared table usable by several sites. Most strings
-- are chrome and belong to 'common'; only what is genuinely about one game is
-- scoped to it. A name is globally unique, so a key belongs to exactly one
-- scope - a site wanting different wording gives it its own key rather than
-- shadowing a shared one.
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS translation_keys (
    name        VARCHAR(200)    PRIMARY KEY,
    description TEXT,
    site        VARCHAR(50)     NOT NULL DEFAULT 'common',
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP,

    CONSTRAINT fk_translation_keys_site FOREIGN KEY (site) REFERENCES sites(code) ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_translation_keys_site ON translation_keys (site);
CREATE OR REPLACE TRIGGER trg_translation_keys_updated_at
    BEFORE UPDATE ON translation_keys
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-----------------------------------------------------------
-- TRANSLATIONS
-- name: Translation
--
-- One row per key per language. Deleting a language takes its translations
-- with it and renaming a key carries them along, so neither leaves orphans.
-- Only the site's own text lives here - game content is not translated.
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS translations (
    key_name      VARCHAR(200)  NOT NULL,
    language_code VARCHAR(10)   NOT NULL,
    value         TEXT          NOT NULL,
    created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP,

    PRIMARY KEY (key_name, language_code),
    CONSTRAINT fk_translations_key FOREIGN KEY (key_name)
        REFERENCES translation_keys(name) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_translations_language FOREIGN KEY (language_code)
        REFERENCES languages(code) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_translations_language ON translations (language_code);
CREATE OR REPLACE TRIGGER trg_translations_updated_at
    BEFORE UPDATE ON translations
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

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
    language            VARCHAR(10)     NOT NULL DEFAULT 'en',
    deleted             BOOLEAN         NOT NULL DEFAULT FALSE,
    theme_main          VARCHAR(50)     NOT NULL DEFAULT 'light',
    theme_admin         VARCHAR(50)     NOT NULL DEFAULT 'dark',
    version             VARCHAR(10),
    token               VARCHAR(64)     UNIQUE,
    token_expires_at    TIMESTAMP,
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP,

    CONSTRAINT fk_users_role  FOREIGN KEY (role)  REFERENCES roles(name),
    CONSTRAINT fk_users_language FOREIGN KEY (language) REFERENCES languages(code) ON UPDATE CASCADE,
    CONSTRAINT fk_users_theme_main FOREIGN KEY (theme_main) REFERENCES themes(name),
    CONSTRAINT fk_users_theme_admin FOREIGN KEY (theme_admin) REFERENCES themes(name)
);
CREATE OR REPLACE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();