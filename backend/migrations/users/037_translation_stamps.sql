-----------------------------------------------------------
-- WHO WROTE A TRANSLATION, AND WHEN
--
-- Both translation tables already carried created_at and updated_at, and
-- neither carried the other half of the pair. Every other thing an editor can
-- change records who changed it - a character, a weapon, a file - and the
-- translation grid was the one screen that could not answer the question.
--
-- Two tables get the columns because two tables are written when somebody
-- saves the grid: the value lands in `translations`, and the key it belongs to
-- is stamped as well, so the row the editor is actually looking at knows when
-- it was last touched without gathering the languages up first.
--
-- Nullable, and null on everything that is already here: the rows predate
-- anything recording it, and a name invented now would be a guess.
-----------------------------------------------------------

ALTER TABLE translation_keys ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE translation_keys ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE translations ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE translations ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
