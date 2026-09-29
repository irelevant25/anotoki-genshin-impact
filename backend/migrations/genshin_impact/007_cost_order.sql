-----------------------------------------------------------
-- THE ORDER MATERIALS ARE LISTED IN, WHICH THE MIGRATIONS NEVER HAD
--
-- Both cost tables carry an `order` on the live database and neither carries
-- it here. The column was added to schema_pgsql_genshin_impact.sql and applied
-- from there, and no migration was ever written for it - so a database built
-- from this folder came out two columns short of the one the site runs on.
--
-- That gap is exactly why the schema files are gone. Two descriptions of one
-- database, and only one of them was kept up to date; nothing noticed, because
-- nothing ever built a database from the other and compared them.
--
-- This is the catch-up. On the live database every statement below is a
-- no-op - the column is there, the values are in it, the constraint is on it -
-- and on an empty one it is the definition it should have had all along.
--
-- Deliberately matching the live database rather than the schema file it came
-- from. The file also declared CHECK ("order" >= 1) on both, and the live
-- database has no such constraint: the file was ahead of what was ever
-- applied. What is running is what is true, and a migration that quietly added
-- a constraint nobody has been keeping to is a migration that fails on
-- somebody else's data.
--
-- `order` is a reserved word, so it is quoted everywhere it appears.
-----------------------------------------------------------

-- Nullable first. The column is NOT NULL in the end, and a NOT NULL column
-- cannot be added to a table with rows in it without a default - and a default
-- of 1 on a position column would silently give every material the same place.
ALTER TABLE characters_ascensions_cost ADD COLUMN IF NOT EXISTS "order" SMALLINT;
ALTER TABLE characters_talents_cost    ADD COLUMN IF NOT EXISTS "order" SMALLINT;

-- The position within the group, in the order the rows were entered - which is
-- the order they were read off the game in. Only rows with nothing in the
-- column are touched, so this cannot renumber a live table.
UPDATE characters_ascensions_cost c
   SET "order" = numbered.position
  FROM (
    SELECT id, row_number() OVER (PARTITION BY character_ascension_id ORDER BY id) AS position
      FROM characters_ascensions_cost
  ) numbered
 WHERE numbered.id = c.id
   AND c."order" IS NULL;

UPDATE characters_talents_cost c
   SET "order" = numbered.position
  FROM (
    SELECT id, row_number() OVER (PARTITION BY character_id ORDER BY id) AS position
      FROM characters_talents_cost
  ) numbered
 WHERE numbered.id = c.id
   AND c."order" IS NULL;

ALTER TABLE characters_ascensions_cost ALTER COLUMN "order" SET NOT NULL;
ALTER TABLE characters_talents_cost    ALTER COLUMN "order" SET NOT NULL;
