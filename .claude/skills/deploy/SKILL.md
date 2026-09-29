---
name: deploy
description: >
  Build and ship the site to production. Use for "build for production", "deploy",
  "release", "prepare the upload", "how do I put this live", "run the installer",
  or applying a schema change on the live server. Covers the two builds, the
  installer (setup.php), and applying migrations on an FTP-only host.
---

# Deploy to production

Production is one web root (`public_html/`) served **same-origin**: the Angular
app at the root, the API under `api/`, images under `assets/`. The frontend calls
its own `/api`, so there is no second domain and no CORS. The host is
**FTP/SFTP-only — no shell**, which is why `vendor/` is shipped, migrations apply
over HTTP, and a first install runs from a web page.

The authoritative, step-by-step version lives in `DEVELOPING.md` (*Building for
production* and *Deploying to the hosting*). This skill is the operating summary.

## The two builds

Neither build invents anything the running app would not have; they assemble and
strip.

```
# Frontend  ->  frontend/dist/angular/browser/
cd frontend && npm run build:deploy
#   ng build --configuration production, then scripts/prepare-deploy.mjs writes,
#   into the build only:
#     config.json  { "url": "", "configuration": "prod" }   (same-origin API)
#     .htaccess    SPA fallback, /api and /uploads passed through
#   The 2.7 GB assets/ tree is NOT bundled (production drops the ../assets copy).

# Backend   ->  backend/dist/
cd ../backend && php build-dist.php
#   Runtime-only allowlist: api/ (minus openapi.json, docs.html, the dev vhost),
#   config/ (minus every *.local.php and the unused google.php), vendor/,
#   composer.*, migrations/, public/uploads/.htaccess, and an empty storage/.
#   Deny-.htaccess guards go on config/, migrations/, storage/, vendor/. Dev
#   tooling and secrets are left out.
```

## Upload map (all into `public_html/`)

```
frontend/dist/angular/browser/*   →  public_html/          index.html, JS/CSS, config.json, .htaccess
backend/dist/*                    →  public_html/          api/, config/, vendor/, migrations/, public/, storage/, composer.*
assets/*                          →  public_html/assets/   uploaded separately — large, changes rarely
backend/setup.php                 →  public_html/setup.php first install only, by hand (not in the dist)
```

When a migration renames files in the tree - `024` renamed the demo music to
`HU_TAO.opus`-style names - upload the renamed files **and delete the old names
on the server**. The host is Linux and case-sensitive: `Albedo.opus` and
`ALBEDO.opus` are two files there, where Windows saw one. Upload new files before
applying the migration that points the catalogue at them.

## Configuration

Every per-installation value is in `config/*.local.php` - `database`, `secret`,
`iam`, `app` - written by `setup.php`, left out of the builds, never committed.
There are no defaults: without them the API answers every request
`503 not_set_up` and the site shows "not set up yet". A deploy never touches them.

## First install (empty database)

The admin "apply migrations" button needs an admin to sign in, which needs the
database the migrations build — a chicken-and-egg only `setup.php` can break.

**The anotoki IAM comes first.** Accounts and sign-in are the IAM's
(iam.anotoki.eu, repository `../anotoki-iam`, its own deploy notes): install it,
with its import of this site's old accounts, before this site's migration
`users/040_accounts_move_to_iam` runs - that migration removes the old account
tables and waits for the import's marker. This site's address must be registered
for the client `genshin` in the IAM (migration 002 there registers
`https://genshin.anotoki.eu`).

1. Create the databases in the hosting panel (the app user usually cannot) and
   note their names.
2. Upload the build (above) plus `backend/setup.php`.
3. Open `https://the-site/setup.php`. Off localhost it first writes a random token
   to `config/setup.local.php`; **read that token over SFTP** (proof of server
   access — it is never shown in the browser). The form and its **Test
   connection** buttons both need it.
4. Replace the development values the form starts from: the DB host / port /
   username / password / the two database names; the IAM address
   (`https://iam.anotoki.eu`) and client id (`genshin`); this site's address
   (`https://genshin.anotoki.eu`, no other origins). Off localhost, addresses must
   be https and never localhost. Test the database and the IAM (the IAM test also
   says whether the IAM accepts `<site>/auth/callback` for `genshin`), then run the
   install: every migration, then `config/database.local.php`,
   `secret.local.php`, `iam.local.php` and `app.local.php`. No admin is created:
   sign in through the IAM with an account holding the `genshin` ADMIN role.
5. It writes `storage/installed.lock` (the durable "don't run twice" guard), then
   deletes `config/setup.local.php` and itself. If the host blocks the
   self-delete, remove `setup.php` by hand — the lock still protects it.

## Moving the live site to the IAM (once)

The running site keeps its accounts until this build's migrations drop them, and
`setup.php` never runs again on it - so this switch-over has its own order
(`DEVELOPING.md`, *Moving the live site to the IAM*):

1. Install the IAM and run its import of this site's `users` database (it leaves
   the `iam_handover` marker migration 040 waits for).
2. Place two files in `config/` by hand - the old build reads neither:
   `iam.local.php`: `<?php return ['issuer' => 'https://iam.anotoki.eu', 'client_id' => 'genshin'];`
   and `app.local.php`: `<?php return ['url' => 'https://genshin.anotoki.eu', 'cors_origins' => []];`.
   The live `database.local.php` stays, and its `jwt.local.php` is read as the site
   secret. Without the two new files the new build answers `503 not_set_up`.
3. Maintenance on (admin Settings), still on the old build.
4. Upload this build.
5. Sign in at `/staff` through the IAM, as a `genshin` ADMIN.
6. Migrations → Apply pending, before anything is edited: `genshin_impact` 026,
   then `users` 040, 041 and 042. Until 026 has run, an IAM session id does not fit
   the audit log's old integer column and every save that audits fails.
7. Maintenance off.

## Later schema changes (no shell)

FTP the new `migrations/{alias}/*.sql` up, then in the admin **Migrations** page
press **Apply pending** (`POST /api/migrations/apply`, ADMIN). It runs every
pending file in order, stopping a database at its first failure. The engine
(`backend/api/migration_runner.php`) is the same one the CLI and `setup.php` use.

## Copying local data up to production

Production has no shell, but the copy runs from the developer's machine against
the remote database, so no shell is needed there either.

- `php db-push.php` (from `backend/`) is the one-command path: it asks for the target
  connection, then for each database dumps local, wipes the target's schema and
  restores into it. It works whether or not `setup.php` already built the target,
  passes the password through the environment (no `PGPASSWORD` to set by hand),
  and **erases** the target (typed host confirmation). The dumps carry schema,
  data and the migrations table, so no migration run is needed after; the target
  keeps its own `config/*.local.php` and `assets/`.
- `php db-dump.php` is the manual alternative: it dumps to files and prints the
  `pg_restore` commands to run yourself (into databases created empty in the
  panel, or add `--clean --if-exists` for ones setup.php has already built).
- The dumps carry no passwords any more: accounts are the IAM's, and move
  with the IAM (its installer imports them), not with this site's databases.

Both need the PostgreSQL client tools locally; if `pg_dump`/`pg_restore` are not
on PATH, point `config/backup.local.php` at them (same file the Backups page
uses). Production itself cannot run them - the admin **Backups** page therefore
does not work on the live host; back production up with a local `pg_dump` against
the remote database, or the host's own DB export.

## Constraints to respect

- **No shell / no `proc_open`** in production. The backup feature (`pg_dump` /
  `pg_restore`) will not run there — a prod snapshot has to come from the host's
  own DB export. Do not add production features that depend on a shell.
- **`.local.php` = this installation's real values**, dev and prod each their own,
  all written by `setup.php`. Nothing committed stands in for them. Never ship or
  commit a `*.local.php`, and never print one.
- **Never overwrite the server's secrets on a redeploy.** The two builds exclude
  `*.local.php`, and `setup.php` will not clobber an existing `secret.local.php`.

## Verify before handing it over

- `backend/dist/` has no `*.local.php`, no `openapi.json`/`docs.html`, and has the
  deny `.htaccess` in config/, migrations/, storage/, vendor/.
- `frontend/dist/angular/browser/config.json` is `{ "url": "", ... "prod" }` and a
  `.htaccess` sits beside `index.html`.
- These are build outputs (gitignored) — do not commit `backend/dist/` or
  `frontend/dist/`. Commit only source changes, and only when asked.
