---
name: db-migration
description: >
  Write and apply a PostgreSQL migration in this project's house style. Use for
  "add a table/column", "new migration", "change the schema", "backfill data".
  Migrations ARE the schema here — there is no separate schema file — so this is
  the only correct way to change the database.
---

# Write a migration

The database is defined entirely by its migrations, replayed in order. There is
no schema dump to edit. `php migration.php` creates what is missing and applies
what is pending; the backend even introspects response shapes from the replayed
migrations. So a schema change is always a new migration file — never an edit to
an applied one, and never a manual `ALTER` outside this flow.

## Where

`php/migrations/genshin_impact/NNN_name.sql` for game content, or
`php/migrations/users/NNN_name.sql` for accounts/sessions/translations/settings.
Use the next free number (zero-padded, matching the existing width) and a short
snake_case name. Read the two or three most recent migrations in that folder
first and match their structure exactly.

## House style

- **Soft delete**: entity tables carry `deleted BOOLEAN NOT NULL DEFAULT FALSE`
  rather than hard-deleting rows.
- **Stamps**: `created_at`, `created_by`, `updated_at`, `updated_by` where the
  entity is edited through the admin.
- **Uniqueness with soft delete**: partial unique indexes, e.g.
  `CREATE UNIQUE INDEX ... ON t (name) WHERE deleted = FALSE`, so a soft-deleted
  row does not block reusing its name.
- **Asset columns are foreign keys** into `files` (`..._file_id INT REFERENCES
  files(id) ON DELETE SET NULL`), never a bare path/name string. If you add one,
  also register it in `php/api/asset_columns.php`.
- **A closed set of values is a CHECK on the column**, not a lookup table and
  not a Postgres ENUM: `ALTER TABLE t ADD CONSTRAINT chk_t_col CHECK (col IN
  ('a', 'b'))` - see `022` (`characters.arkhe`) and `025`
  (`characters_voice_overs.type`, which replaced the `voice_over_types` table).
  The spec generator reads that CHECK into an `'a' | 'b'` union in the client; it
  does not read `CREATE TYPE … AS ENUM`. A lookup table is for values the admin
  maintains.
- **Idempotent where reasonable** (`IF NOT EXISTS` / `IF EXISTS`) so a partial
  application can be re-run.
- **A verification gate.** Anything that moves or backfills data ends with a
  `DO $$ BEGIN … IF (…) THEN RAISE EXCEPTION …; END IF; END $$;` block that
  checks the result and fails the migration loudly if it is wrong. A data
  migration that "probably worked" is not acceptable — the gate is what proves
  it. Look at `010_asset_foreign_keys.sql` for a thorough example.

## Apply

From `php/`:

```
php migration.php --status      # see what is pending first
php migration.php --dry-run     # confirm what would apply
php migration.php               # create missing + apply pending (all databases)
php migration.php --db=users    # scope to one database
```

The engine lives in `php/api/migration_runner.php` and is shared: the same code
backs the first-run installer `php/setup.php` and the admin **Migrations** page's
*Apply pending* button (`POST /api/migrations/apply`, ADMIN). That button is how
a migration reaches **production**, which is FTP-only with no shell — FTP the new
`.sql` up, then apply it from the admin panel. The **deploy** skill has the flow.

## Before touching data, back it up

If the migration rewrites or deletes existing rows, take a backup first
(`php db-dump.php` from `php/` - it writes both databases to
`storage/backups/manual/<timestamp>/` - or the admin Backups page) so a bad gate
is recoverable. The maintainer's real data lives in the dev database — treat it
as production.

## After

- If the migration changes a table that an endpoint returns via
  `responds('table', ...)`, the response shape is now different — regenerate the
  client with the **sync-api-client** skill (`cd angular && npm run api`). The
  generator replays the migrations itself and understands CREATE TABLE, ALTER
  TABLE (add / drop / rename / retype a column, add a CHECK) and DROP TABLE; a
  statement outside that (a table RENAME, CREATE TYPE, …) changes the database
  without changing the client, so teach `generate-api-spec.php` first.
- Verify with `php migration.php --status` (your migration shows as applied) and
  a quick query that the schema/data is as intended.
- Stage the new `.sql` file (and any `asset_columns.php` / model / endpoint
  changes) by path. Never `git add -A`. Commit only when asked.
