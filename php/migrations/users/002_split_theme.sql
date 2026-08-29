-----------------------------------------------------------
-- SPLIT THE THEME PREFERENCE PER AREA
--
-- The site and the admin panel look nothing alike, so one column could not
-- hold a sensible answer for both: someone reading the site in light can still
-- want the admin dark. `theme` becomes `theme_main` and `theme_admin`, each
-- carrying the old value forward so nobody's existing choice is lost.
-----------------------------------------------------------

ALTER TABLE users ADD COLUMN IF NOT EXISTS theme_main  VARCHAR(50) NOT NULL DEFAULT 'auto';
ALTER TABLE users ADD COLUMN IF NOT EXISTS theme_admin VARCHAR(50) NOT NULL DEFAULT 'auto';

UPDATE users SET theme_main = theme, theme_admin = theme WHERE theme IS NOT NULL;

ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_theme;
ALTER TABLE users DROP COLUMN IF EXISTS theme;

ALTER TABLE users ADD CONSTRAINT fk_users_theme_main
    FOREIGN KEY (theme_main) REFERENCES themes(name);
ALTER TABLE users ADD CONSTRAINT fk_users_theme_admin
    FOREIGN KEY (theme_admin) REFERENCES themes(name);
