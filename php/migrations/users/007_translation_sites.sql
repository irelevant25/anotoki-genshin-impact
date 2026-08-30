-----------------------------------------------------------
-- TRANSLATIONS BELONG TO A SITE
--
-- There will be a Star Rail site beside this one, and possibly more. Without
-- a scope, every key in this table was implicitly "the Genshin site's", which
-- was only true by accident.
--
-- The alternative was moving translations into each game's own database. That
-- is worse, and the seeded data says why: of 110 keys, only 18 are about
-- Genshin at all. The rest - Cancel, Close, Account, Appearance, the 404 page,
-- the whole feedback form - is site chrome that reads identically on any site
-- in the family. Splitting by database would mean translating "Cancel" into
-- Slovak once per site and fixing every typo N times.
--
-- So the scope is a column, and 'common' is a real value rather than a null:
-- a site loads the shared keys plus its own. `languages` stays shared for the
-- same reason it always was - a language is a language, and users.language
-- points at it.
--
-- A key name is still globally unique, so a key belongs to exactly one scope.
-- A site that needs different wording for something shared gives it its own
-- key rather than shadowing the shared one, which keeps "where does this
-- string come from" a question with one answer.
-----------------------------------------------------------

-----------------------------------------------------------
-- SITES
-- name: Site
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS sites (
    code       VARCHAR(50)  PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    sort_order INTEGER      NOT NULL DEFAULT 0
);

-- The codes match the database aliases in config/database.php, so there is one
-- spelling of "which site" across the whole stack.
INSERT INTO sites (code, name, sort_order) VALUES
    ('common',         'Shared by every site', 1),
    ('genshin_impact', 'Genshin Impact',       2),
    ('star_rail',      'Honkai Star Rail',     3)
ON CONFLICT DO NOTHING;

-----------------------------------------------------------
-- TRANSLATION KEYS GAIN A SCOPE
-----------------------------------------------------------

ALTER TABLE translation_keys ADD COLUMN IF NOT EXISTS site VARCHAR(50) NOT NULL DEFAULT 'common';

-- Everything defaults to shared, which is right for almost all of it. Only the
-- six quiz names are about this game specifically: Star Rail will have its own
-- quizzes, with its own names. The generic quiz chrome (Next, Tries, Search
-- character) stays shared, because it is the same game-agnostic wording.
UPDATE translation_keys SET site = 'genshin_impact'
WHERE name LIKE 'quiz.banners.%'
   OR name LIKE 'quiz.pixelate.%'
   OR name LIKE 'quiz.mismatch.%'
   OR name LIKE 'quiz.music.%'
   OR name LIKE 'quiz.dish.%'
   OR name LIKE 'quiz.voice.%';

ALTER TABLE translation_keys ADD CONSTRAINT fk_translation_keys_site
    FOREIGN KEY (site) REFERENCES sites(code) ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS idx_translation_keys_site ON translation_keys (site);
