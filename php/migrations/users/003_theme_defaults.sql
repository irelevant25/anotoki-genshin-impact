-----------------------------------------------------------
-- PER-AREA THEME DEFAULTS
--
-- The site reads better light and the admin panel is worked in for hours, so
-- they start from different places rather than both from 'auto'.
--
-- Rows still holding 'auto' are moved across: until now it was the only value
-- the column could have been given, so it means "never chosen" rather than a
-- deliberate "follow the system". Anyone who wants that can still pick it.
-----------------------------------------------------------

ALTER TABLE users ALTER COLUMN theme_main  SET DEFAULT 'light';
ALTER TABLE users ALTER COLUMN theme_admin SET DEFAULT 'dark';

UPDATE users SET theme_main  = 'light' WHERE theme_main  = 'auto';
UPDATE users SET theme_admin = 'dark'  WHERE theme_admin = 'auto';
