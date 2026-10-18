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

`backend/migrations/genshin_impact/NNN_name.sql` for game content, or
`backend/migrations/users/NNN_name.sql` for translations, settings, page switches and this site's record of each person (the accounts themselves are the anotoki IAM's).
Both folders build the one database (`users/` first) and share its namespace: a
new table, index, sequence or function must not take a name the other folder
uses - check both. (History: `users/` once had an account table called `roles`,
which 040 dropped; `genshin_impact/` has its own `roles`.)
A `users/` migration never names a `genshin_impact/` table - not even in an
index or a gate: on a fresh install every `users/` file runs before
`genshin_impact/001` makes the content and quiz tables, so it would fail there.
A change that touches both halves is two files, one per folder (the visitors:
`users/045_visitors.sql` adds the people's side, `genshin_impact/027` the quiz
history's index).
Use the next free number (zero-padded, matching the existing width) and a short
snake_case name. Read the two or three most recent migrations in that folder
first and match their structure exactly.

Around both folders the engine runs the anotoki library's own sets
(`vendor/anotoki/lib/backend/migrations/`, never edited here): `anotoki_admin` FIRST
(the admin tools' tables `anotoki_audit_log` and `anotoki_feedback` - a
`genshin_impact/` migration may build on them, as 028 and 029 moved the old
rows in), and after the folders `anotoki_translations` - its 001 proves the
words' tables are in the shape the library works with (users/050 moved them
into it), its 002-009 and 012 add the library's words under `anotoki.*` and
010-011 reword a few where nobody saved them - and
`anotoki_people` (the scrub's tables; users/052 added `users.anonymized_at`
for it). So a `users/` migration never depends on a library file - on
a fresh install it runs before them - and writes only the words' base columns
(`translation_keys (name, description)`, `translations (key_name,
language_code, value)`, `languages (code, name, native_name, enabled,
sort_order)`); `anotoki.` is the library's namespace, never a key of this
site's; and a gate never counts keys outside this site's own namespaces (the
library's arrive after it, and an owner may blank a Slovak string). To word a
library string this site's own way: insert it first (`ON CONFLICT DO NOTHING`),
then `UPDATE ... WHERE value = '<the library's words>'` for a database that has
the library's already.

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
  also register it in `backend/api/asset_columns.php`.
- **A closed set of values is a CHECK on the column**, not a lookup table and
  not a Postgres ENUM: `ALTER TABLE t ADD CONSTRAINT chk_t_col CHECK (col IN
  ('a', 'b'))` - see `022` (`characters.arkhe`) and `025`
  (`characters_voice_overs.type`, which replaced the `voice_over_types` table).
  The spec generator reads that CHECK into an `'a' | 'b'` union in the client; it
  does not read `CREATE TYPE … AS ENUM`. A lookup table is for values the admin
  maintains.
- **New translation keys** go in a `users` migration - and only there: no admin
  page, import or command makes a key (users/050) - each with its description
  (where it shows, what it is for, its `{placeholders}`: the code's, the admin
  panel never edits it), an English and an informal Slovak ("ty") string, `ON
  CONFLICT DO NOTHING`, and a gate naming exactly its keys and proving both
  strings exist - copy `051_guide_strings.sql`. No scope, no HTML flag: every key
  is this site's, and a string is text (a guide's body is `guide_contents`, a
  guide a migration adds with its English there). A key put together at run
  time also gets its prefix and tail in `frontend/src/app/shared/dynamic-keys.ts`.
  Rewording a string a migration wrote is `UPDATE translations SET value = ...
  WHERE ... AND value = '<the earlier words>'`, so an owner's rewording stands;
  removing one is `DELETE FROM translation_keys` (its strings cascade).
- **Idempotent where reasonable** (`IF NOT EXISTS` / `IF EXISTS`) so a partial
  application can be re-run.
- **A verification gate.** Anything that moves or backfills data ends with a
  `DO $$ BEGIN … IF (…) THEN RAISE EXCEPTION …; END IF; END $$;` block that
  checks the result and fails the migration loudly if it is wrong. A data
  migration that "probably worked" is not acceptable — the gate is what proves
  it. Look at `010_asset_foreign_keys.sql` for a thorough example.

## Apply

From `backend/`:

```
php migration.php --status      # see what is pending first
php migration.php --dry-run     # confirm what would apply
php migration.php               # a backup, then create missing + apply pending (every set in order)
php migration.php --folder=users  # scope to one set (users, genshin_impact, anotoki_admin, anotoki_translations, anotoki_people)
```

The engine is the anotoki sites' shared one - anotoki/lib's `Migrator`
(`backend/vendor/anotoki/lib`, never edited here) - set up for this site in
`backend/api/migration_runner.php` (`siteMigrator()`); the same code backs the
installer `backend/setup.php`, `merge-databases.php` and the admin **Migrations**
page's *Apply pending* (`POST /api/admin/migrations/apply`, ADMIN). That button is
how a migration reaches **production**, which is FTP-only with no shell — FTP the
new `.sql` up, then apply it from the admin panel. The **deploy** skill has the
flow. Mind that a file on disk the database has not run closes the site to
everybody but its ADMIN until it is applied (`503 update_pending`; DEV.md, *While
an update waits*) - on your own checkout too, until `php migration.php` runs.

## Before touching data, back it up

`php migration.php` and the admin panel's Apply back the database up before
they run anything (the library's backup, `storage/backups/*.anotoki-backup`,
once for each list of pending files; a backup that cannot be made stops the
run). Take one of your own as well when the migration rewrites or deletes rows
(the admin Backups page, or `php db-dump.php` - a pg_dump into
`storage/backups/manual/<timestamp>/`), so a bad gate is recoverable. Rehearse a
data move on a throwaway database shaped like an installed one, with rows in
every table it touches (`tests/db_lib.php`'s `testMigrate()`; the
`library-tools-migration` test is the pattern) - never on the maintainer's: the
real data lives in the dev database - treat it as production.

## After

- If the migration changes a table that an endpoint returns via
  `responds('table', ...)`, the response shape is now different — regenerate the
  client with the **sync-api-client** skill (`cd frontend && npm run api`). The
  generator replays the migrations itself and understands CREATE TABLE, ALTER
  TABLE (add / drop / rename / retype a column, add a CHECK) and DROP TABLE; a
  statement outside that (a table RENAME, CREATE TYPE, …) changes the database
  without changing the client, so teach `generate-api-spec.php` first.
- Verify with `php migration.php --status` (your migration shows as applied) and
  a quick query that the schema/data is as intended.
- Stage the new `.sql` file (and any `asset_columns.php` / model / endpoint
  changes) by path. Never `git add -A`. Commit only when asked.
