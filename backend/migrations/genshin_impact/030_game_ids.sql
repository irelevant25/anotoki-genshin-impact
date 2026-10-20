-----------------------------------------------------------
-- THE GAME'S OWN IDS
--
-- Written 2026-10-20, at the owner's word, for another of the owner's sites,
-- the build analyzer (builder.anotoki.eu): it takes its game catalog - characters,
-- weapons, artifact sets - from this site's public GET /api/catalog/...
-- (api/catalog.php) instead of a third party's lists. What a player imports
-- there names things by the game's own ids, so each row here carries the
-- game's id beside its name: `game_id`, NULL until somebody knows it - 031
-- fills what the names tell, the admin forms' "Game ID" and the owner's
-- importer the rest.
--
-- One id, one live row - but for the Traveler. The game has two of them
-- (Aether 10000005, Lumine 10000007) and this site a row per element for
-- each, every Aether row carrying 10000005. So a character that is not a
-- Traveler is unique on (game_id), a Traveler on (game_id, element). A
-- deleted row holds no claim, as with 013's indexes: one deleted and made
-- again takes its id back. NULL is no claim either - a unique index lets as
-- many through as there are rows without an id.
--
-- The schema alone: no row changes, and nothing a reader of the site sees.
-----------------------------------------------------------

-- 1. The columns. A plain INTEGER: the game's ids run to eight digits.
ALTER TABLE characters ADD COLUMN IF NOT EXISTS game_id INTEGER;
ALTER TABLE weapons ADD COLUMN IF NOT EXISTS game_id INTEGER;
ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS game_id INTEGER;

-- 2. An id is a positive number. (A CHECK of a condition, not of a list of
--    values: the spec generator reads no enum into it.)
ALTER TABLE characters DROP CONSTRAINT IF EXISTS chk_characters_game_id;
ALTER TABLE characters ADD CONSTRAINT chk_characters_game_id CHECK (game_id > 0);
ALTER TABLE weapons DROP CONSTRAINT IF EXISTS chk_weapons_game_id;
ALTER TABLE weapons ADD CONSTRAINT chk_weapons_game_id CHECK (game_id > 0);
ALTER TABLE artifacts DROP CONSTRAINT IF EXISTS chk_artifacts_game_id;
ALTER TABLE artifacts ADD CONSTRAINT chk_artifacts_game_id CHECK (game_id > 0);

-- 3. One live row an id - the Travelers one per element.
CREATE UNIQUE INDEX IF NOT EXISTS uq_characters_game_id ON characters (game_id) WHERE deleted = FALSE AND is_traveler = FALSE;
CREATE UNIQUE INDEX IF NOT EXISTS uq_characters_traveler_game_id ON characters (game_id, element) WHERE deleted = FALSE AND is_traveler;
CREATE UNIQUE INDEX IF NOT EXISTS uq_weapons_game_id ON weapons (game_id) WHERE deleted = FALSE;
CREATE UNIQUE INDEX IF NOT EXISTS uq_artifacts_game_id ON artifacts (game_id) WHERE deleted = FALSE;

-- 4. Prove it: each column a nullable INTEGER, each CHECK there and validated,
--    each index unique, on its columns, over the live rows it is meant for.
--    The definitions are compared with spaces and brackets taken out, so a
--    server that prints them a little differently still passes.
DO $$
DECLARE
    want RECORD;
    got RECORD;
BEGIN
    FOR want IN SELECT * FROM (VALUES ('characters'), ('weapons'), ('artifacts')) AS t (tbl) LOOP
        IF NOT EXISTS (
            SELECT 1
              FROM information_schema.columns
             WHERE table_schema = current_schema()
               AND table_name = want.tbl
               AND column_name = 'game_id'
               AND data_type = 'integer'
               AND is_nullable = 'YES'
        ) THEN
            RAISE EXCEPTION '%.game_id is missing, or is not a nullable INTEGER', want.tbl;
        END IF;
        IF NOT EXISTS (
            SELECT 1
              FROM pg_constraint
             WHERE conrelid = want.tbl::regclass
               AND conname = 'chk_' || want.tbl || '_game_id'
               AND contype = 'c'
               AND convalidated
               AND regexp_replace(lower(pg_get_constraintdef(oid)), '[[:space:]()]', '', 'g') = 'checkgame_id>0'
        ) THEN
            RAISE EXCEPTION 'the CHECK (game_id > 0) on %.game_id is missing', want.tbl;
        END IF;
    END LOOP;

    FOR want IN
        SELECT *
          FROM (VALUES
                ('characters', 'uq_characters_game_id', 'game_id', 'deleted=falseandis_traveler=false'),
                ('characters', 'uq_characters_traveler_game_id', 'game_id,element', 'deleted=falseandis_traveler'),
                ('weapons', 'uq_weapons_game_id', 'game_id', 'deleted=false'),
                ('artifacts', 'uq_artifacts_game_id', 'game_id', 'deleted=false')
          ) AS t (tbl, idx, cols, pred)
    LOOP
        SELECT i.indisunique AS is_unique,
               i.indisvalid AS is_valid,
               (SELECT string_agg(a.attname::text, ',' ORDER BY k.ord)
                  FROM unnest(i.indkey::int2[]) WITH ORDINALITY AS k (attnum, ord)
                  JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = k.attnum) AS cols,
               regexp_replace(lower(coalesce(pg_get_expr(i.indpred, i.indrelid), '')), '[[:space:]()]', '', 'g') AS pred
          INTO got
          FROM pg_index i
          JOIN pg_class c ON c.oid = i.indexrelid
         WHERE i.indrelid = want.tbl::regclass
           AND c.relname = want.idx;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'the index % on % is missing', want.idx, want.tbl;
        END IF;
        IF NOT got.is_unique OR NOT got.is_valid OR got.cols IS DISTINCT FROM want.cols OR got.pred IS DISTINCT FROM want.pred THEN
            RAISE EXCEPTION 'the index % should be UNIQUE on (%) where %, and is % on (%) where %',
                want.idx, want.cols, want.pred, CASE WHEN got.is_unique THEN 'unique' ELSE 'not unique' END, got.cols, got.pred;
        END IF;
    END LOOP;
END $$;
