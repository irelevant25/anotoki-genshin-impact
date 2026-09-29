# Developing anotoki · genshin_impact

How to run the site on your machine, work on it, check it, and ship it. What
the site *is* is in [README.md](README.md); the conventions for changing it are
in [CLAUDE.md](CLAUDE.md).

| Part      | Folder      | Stack                                            |
| --------- | ----------- | ------------------------------------------------ |
| Backend   | `backend/`  | PHP 8.2+, Slim 4, PostgreSQL                     |
| Frontend  | `frontend/` | Angular 21, standalone + zoneless, signals       |
| Docs      | `docs/`     | Generated HTML reports (reference, performance, security) |

The frontend and backend are two apps that talk over HTTP. In development they
run on two ports; in production they are served from one origin. Signing in is
not this site's: it goes through the **anotoki IAM** (`../anotoki-iam`), which
has to be running for anybody to sign in locally.

| Development | Frontend | Backend |
| --- | --- | --- |
| this site | `http://localhost:4200` | `http://localhost:8000` |
| the IAM | `http://localhost:4300` | `http://localhost:8100` |

The **frontend's API client is generated from the backend** - see
[The code-generation pipeline](#the-code-generation-pipeline) before changing an
endpoint.

> Ignore these root folders - they are not part of the app: `formats-converters`
> (the local AVIF/Opus conversion scripts, with the ffmpeg the backend's upload
> conversion also uses), `local` (gitignored: the wiki crawlers and the importer
> that loads their output through the API - `local/crawling-old/import_scripts/README.md`),
> `old` (the pre-rewrite Vue codebase).

---

## Prerequisites

| Tool         | Version      | Notes                                             |
| ------------ | ------------ | ------------------------------------------------- |
| PHP          | 8.2+         | with `pdo_pgsql`; `curl` or `allow_url_fopen` for the IAM's keys |
| PostgreSQL   | 14+          | one database, `genshin_impact` (the installer creates it) |
| Node.js      | **22.15.0**  | `npm start` checks this (via `nvm`) and refuses otherwise |
| Composer     | any recent   | `backend/vendor/` is committed, so only needed to change PHP dependencies |
| The anotoki IAM | -         | `../anotoki-iam`, set up by its own DEVELOPING.md |

Optional, for specific admin features:

- **`pg_dump` / `pg_restore`** - the admin **Backups** page and `db-dump.php`.
  Found on `PATH` or in the usual PostgreSQL install folders; point elsewhere
  with `backend/config/backup.local.php`.
- **ffmpeg** - audio conversion (PNG→AVIF works out of the box). See
  [The asset library](#the-asset-library).

---

## First-time setup

### 1. The anotoki IAM

Accounts, passwords, Google, two-factor and who is an ADMIN or EDITOR here all
live in the IAM. Set it up first, by `../anotoki-iam/DEVELOPING.md`: its API on
`:8100`, its pages on `:4300`. It registers this site's development address
(`http://localhost:4200/auth/callback`) by default; `php clients.php --dev` in its
`backend/` puts that back if it was changed. The accounts this site used to
hold were brought over by its `import-legacy.php`; sign in with one holding the
`genshin` ADMIN or EDITOR role (granted in the IAM's admin console).

### 2. The backend - run `setup.php`

```bash
cd backend
php -S localhost:8000 router.php
```

then open **<http://localhost:8000/setup.php>**. Until it has run, the API
answers every request `503 {"code": "not_set_up"}` and the site shows a "not set
up yet" page pointing here - nothing committed stands in for the configuration.

The installer starts from the development values - PostgreSQL on
`127.0.0.1:5432` as `postgres`, the database `genshin_impact`, the
IAM at `http://localhost:4300` with the client id `genshin`, this site at
`http://localhost:4200`. Fill in the database password, press **Test connection**
under the database and under the IAM to see that both answer, then **Save**. It
creates the database if it is missing, applies every migration - `migrations/users/`
then `migrations/genshin_impact/`, the site's half and the game content - and writes:

| File (in `backend/config/`, all gitignored) | What |
| --- | --- |
| `database.local.php` | the PostgreSQL connection and the database's name |
| `secret.local.php` | the site secret, generated once and never replaced (an old `jwt.local.php` is read in its place, and carried over) |
| `iam.local.php` | the IAM's address and this site's client id there |
| `app.local.php` | this site's own address, and any other origin allowed to call the API |

On this computer - the built-in server, a localhost address - `setup.php` needs no
token and stays put: open it again whenever a setting changes. It shows what is
saved, never shows a secret back, and a blank password keeps the saved one. On
the hosting it behaves differently; see [Deploying](#deploying-to-the-hosting).

### 3. The frontend

In a second terminal:

```bash
cd frontend
npm install
npm start          # http://localhost:4200
```

`npm start` checks your Node version, regenerates the API client from the
backend, then runs `ng serve`. The dev app reads `frontend/public/config.json`,
which points at `http://localhost:8000` - the two servers find each other with no
proxy, the API allowing the site's address from `app.local.php` (CORS).

Open `http://localhost:4200`, and the admin panel at `http://localhost:4200/admin`.
"Sign in" goes to the IAM on `:4300` and comes back signed in.

---

## Day to day

Two servers of this site, plus the IAM's two when you need to sign in:

| | Command (from its folder) | URL |
| --- | --- | --- |
| API | `php -S localhost:8000 router.php` (in `backend/`) | `http://localhost:8000` |
| App | `npm start` (in `frontend/`) | `http://localhost:4200` |

The router script matters. Without it `php -S` decides whether a request is for a
file by looking for a dot in the last path segment, so any URL that ends in one -
`PUT /api/translation-keys/guide.banners.content`, and every other translation
key - is answered 404 without the API being reached, and a browser reports that
as a CORS error because the preflight is 404'd too. Apache has no such rule, so
this only bites in development. `router.php` also serves `/uploads/...` from
`public/` and the installer at `/setup.php`.

```bash
# Backend (backend/)
php migration.php --status     # what has run and what is pending
php migration.php --dry-run    # what would apply, applying nothing
php migration.php              # apply what is pending (setup.php does this too)
php migration.php --folder=users  # one migrations folder only
php db-dump.php                # back the database up before risky data work
php assets.php --status        # the asset tree against the catalogue and the rows naming it

# Frontend (frontend/)
npm run api                    # regenerate the API client (see below)
npm run lint
```

To change a setting - another database, the IAM's address - open `setup.php`
again rather than editing the files by hand.

---

## The code-generation pipeline

**The typed API client under `frontend/src/app/api/` is generated, not written.**
The backend's own route table, response shapes and migrations are read into
`frontend/api-spec.json`, and the client is generated from that. Editing files
under `frontend/src/app/api/` by hand is almost always a mistake - they are
overwritten.

After changing a backend **route**, its `responds()` shape, a `DbModel`, or a
**migration**, regenerate:

```bash
cd frontend
npm run api        # = api:spec (reads PHP) + api:client (writes TS) + api:docs (backend/api/openapi.json)
```

`npm start` runs this for you on boot. None of it needs a database or the
`*.local.php` files - the spec is read from the route table and the migrations as
text. When the generator names something awkwardly, the fix is in
`frontend/api-config.mjs` (service groups, method names, query/response types),
then re-run `npm run api:client`.

---

## Database & migrations

**The migrations are the schema.** There is no separate schema file; a database
is what you get by replaying `backend/migrations/{genshin_impact,users}/NNN_name.sql`
in order - including the rows they insert, so a database built today has the same
languages, sites and translated strings as one built from the same folder a year
from now. A file already recorded in a database's `migrations` table is never run
again, so never edit an applied migration: write the next one.

- Locally: `php migration.php` (or `setup.php`) applies everything pending.
- On the hosting, with no shell: FTP the new `.sql` up, then the admin
  **Migrations** page → **Apply pending** (`POST /api/migrations/apply`).

The engine behind the CLI, that button, and `setup.php` is one file,
`backend/api/migration_runner.php`, so a database built any of the three ways is
the same database. `generate-api-spec.php` replays the same folder to work out
what each table looks like, so a new column reaches the generated client without
being written down anywhere else. Migrations that change data end with a
`DO $$ … $$` gate that fails loudly when the result is wrong; back up first
(`php db-dump.php`) when one rewrites or deletes rows.

---

## Checking your work

There is no automated test suite in this repository (the IAM, where the sign-in
logic lives, has one). What there is:

```bash
# Frontend (frontend/)
npx tsc --noEmit -p tsconfig.app.json          # types
npm run lint                                   # includes: no inline template/styles
npx ng build --configuration development --output-path <a scratch folder>   # templates are only fully checked by a build

# Backend (backend/)
php -l <file>                                  # every PHP file you touched
php migration.php --dry-run                    # a new migration is picked up

# The generated client is in step with the backend
cd frontend && npm run api && git diff --stat src/app/api api-spec.json
```

Then run both servers and use the thing: the page you changed, both themes, a
phone-width window, and the API's failure answers (401/403/404/409/422) with
`curl` as well as the happy path. Writes need an IAM token with the `genshin`
ADMIN or EDITOR role; a personal token from the IAM's account page ("Tokens for
scripts") is how a script gets one.

The generated reports under `docs/` - reference, performance, security - are
rebuilt by their own scripts; `docs/README.md` has the commands.

---

## How the admin features work

### Site settings

Admin panel → System → Site Settings. A card per group; each opens a modal.

| Switch | What it does |
| --- | --- |
| Maintenance mode | The site draws a closed sign instead of itself, and the API answers 503 to everything but who is signed in (`/api/me`), the public settings, the languages and the strings on the sign. Admins are exempt. |
| Announcement | A dismissable bar above the header, one message per language, at one of three levels. |

Whether anybody may sign in at all, and whether Google is offered, are the IAM's
switches - in its admin console, for every site at once.

**Getting back in after switching the site off**: `/staff`. It is a sign-in button
(to the IAM, as everywhere) at an address the closed site still draws; the API
lets nobody but an admin past, so the path grants nothing on its own.

The switches live in `site_settings`, one row each, scoped by site. Adding another
is a row in a migration - `name`, a `type` out of `boolean | text | i18n | choice`,
and a default - plus an entry in `SETTING_WORDS` in
`sites/admin/settings/settings-words.ts` if it deserves a sentence. The form draws
whatever it finds, so a new switch is editable before anybody writes about it.

### Parts of the site

The third card. A row per page in `site_routes`, seeded from the router by a
migration, carrying two separate decisions:

- **Visible to** - `PUBLIC`, `USER`, `EDITOR` or `ADMIN`: the lowest kind of reader
  the page is drawn for. Everything is seeded `PUBLIC`; `ADMIN` is the default for
  a row added by hand, because the safe default for a page nobody has thought
  about is that nobody sees it.
- **Off** - takes it away from everybody who is not an admin, whatever the first
  says. "Members only" and "off this week" are different things.

Either one takes the page out of the menu and stops it matching in the router, so
its address answers as not found. Admins keep every page, with a badge in the menu
and a bar on the page saying which of the two it is.

A page's **API paths** are optional and empty by default, so switching a page off
leaves its data being served - right for "that page is not finished", wrong for
"nobody may have this". Naming a path is what turns the sign into a lock:
`api/meddleware/route_gate.php` then answers 423 to anybody the page is not drawn
for. Paths are matched from the start, so `/api/quiz` covers `/api/quizzes` and
`/api/quiz/stats` alike. Where two pages claim the same path the more open one
wins, and a path covering `/api/me`, `/api/settings`, `/api/site-routes`,
`/api/languages` or `/api/translations` is refused on save.

**Add a page** takes a path the migration did not seed. The **×** on a row stops
governing that page rather than removing it from the site. `/auth/callback` and
`/staff` have no row and cannot be given one: the first is where the IAM sends
people back, the second the way back in when the site is closed.

Everything above is enforced twice on purpose: the site draws the closed sign and
hides the menu item, and the API means it.

### The asset library

Admin panel → Files, and a card on the Dashboard. Both read one survey: a walk over
every file under `assets/`, cached for a day because there are 65,000 of them.
**Re-scan** does it again.

- **By format** - how many files of each extension, and how much room they take.
- **Converted formats** - the site serves AVIF and Opus. Uploads are re-encoded on
  the way in; this is about what arrived before that, or was put on disk by the
  scripts in `formats-converters/`. `missing` is a job (a source with no converted
  file beside it; **Convert** works through them in batches, a request each, with
  the queue in `storage/cache/asset-convert-queue.json`); `converted only` is not.

Pairing is by normalised name, not exact stem - the tree holds both
`Adventurer's Bandana.avif` and `ADVENTURERS_BANDANA.png` for one picture.

AVIF needs the `imagick` or `gd` extension. Opus needs `ffmpeg`: an ffmpeg build
dropped in beside the converter scripts (`formats-converters/ffmpeg.exe`, or
`./ffmpeg` on Linux) or the one `cd formats-converters && npm install` unpacks, both
found ahead of anything on `PATH`, then `PATH` and the usual install folders. What
cannot be encoded is counted and said so on the page.

### Backups

The **Backups** page shells out to `pg_dump` and `pg_restore`, found on `PATH` or
in the usual PostgreSQL install folders, or named in `config/backup.local.php`:

```php
<?php return ['pg_dump' => 'C:/Program Files/PostgreSQL/18/bin/pg_dump.exe', 'pg_restore' => '...'];
```

Dumps go to `backend/storage/backups/`, one folder per backup with `genshin.dump` -
the whole database - and a `backup.json` manifest; `storage/` is gitignored.
Restoring asks for a sign-in from the last ten minutes and a typed confirmation,
takes a backup of the current state first, and runs in one transaction. Backups
from when the site had two databases are downloadable only (see
[A checkout with two databases](#a-checkout-with-two-databases)).
`pg_restore --clean` drops only what the dump contains: a table created after the
backup survives the restore. The hosting has no shell, so this page does not work
there - see [Copying local data up](#copying-local-data-up-to-production).

### Filling the profile page with something to look at (optional)

```bash
php seed_quiz_history.php --user=1 --questions=1800 --days=180   # from backend/
```

Invents quiz history for one account, from normal distributions rather than flat
ones. `--dry-run` prints the summary without writing.

---

## Building for production

The site ships to one web root, served same-origin. Two builds assemble it; neither
adds anything the running site would not have.

```bash
# Frontend  ->  frontend/dist/angular/browser/
cd frontend && npm run build:deploy
#   ng build (production) + scripts/prepare-deploy.mjs, which writes into the build:
#     config.json  { "url": "", "configuration": "prod" }   (same-origin API)
#     .htaccess    SPA fallback, with /api and /uploads passed through, and the
#                  AVIF/Opus types the hosting's Apache does not know
#   The 2.7 GB assets/ tree is NOT bundled.

# Backend   ->  backend/dist/
cd ../backend && php build-dist.php
#   The runtime-only slice: api/ (minus the generators and the API reference),
#   config/ (minus every *.local.php), vendor/, composer.*, migrations/, and
#   hardened public/uploads/ + storage/. Dev tooling and secrets stay behind.
```

---

## Deploying to the hosting

The hosting is **FTP-only - no shell, no cron**, which shapes everything below:
`vendor/` ships in the build, the first install runs from a web page, and schema
changes apply from the admin panel.

### The upload map

All into `public_html/`:

```
frontend/dist/angular/browser/*   →  public_html/              index.html, JS/CSS, config.json, .htaccess
backend/dist/*                    →  public_html/              api/, config/, vendor/, migrations/, public/, storage/, composer.*
assets/*                          →  public_html/assets/       separately - it is large and changes rarely
backend/setup.php                 →  public_html/setup.php     the first install only, by hand
```

The real config lives in `config/*.local.php`, which the build leaves out on
purpose and a deploy never touches; `setup.php` writes it on the server. Never
ship or commit a `*.local.php`.

When a migration renames files in the tree - `024` renamed the demo music to
`HU_TAO.opus`-style names - upload the renamed files and **delete the old names on
the server**: the host is Linux and case-sensitive. Upload new files before applying
the migration that points the catalogue at them.

### First install (an empty database)

The admin panel's "apply migrations" needs an admin to sign in, which needs the
database the migrations build - so the first time, the installer does it. **The
anotoki IAM comes first**: install it (with its import of this site's old
accounts), and grant yourself this site's ADMIN role there.

1. Create the database in the hosting panel - the app's user usually cannot - and
   note its name.
2. Upload the builds, and `backend/setup.php` to the web root beside them.
3. Open `https://your-site/setup.php`. On the hosting it first writes a random token
   to `config/setup.local.php`; **open that file over FTP/SFTP and copy the token** -
   only someone with server access can, which is how it knows it is you. The form
   and its **Test connection** buttons all need it.
4. Replace the development values with the hosting's: the database connection, the
   IAM (`https://iam.anotoki.eu`, client id `genshin`), and this site's address
   (`https://genshin.anotoki.eu`; no other origins - the site calls its own API).
   Addresses must be https there, and never `localhost`. Test both connections,
   then **Run install**: it applies every migration and writes the four config
   files (plus `config/backup.local.php` if you give a home directory with the
   PostgreSQL client tools unpacked under `~/pgclient` - see `PG-DUMP-INSTALL.md`).
5. It writes `storage/installed.lock` - which makes it refuse to run again even if
   the next part fails - then deletes `config/setup.local.php` and itself. If the
   host would not let it self-delete, remove `setup.php` by hand.

This site's address must be registered for the client `genshin` in the IAM's admin
console (Applications); the IAM test says whether it is.

### A checkout with two databases

Until 2026-09-29 the site kept two databases: the game content (`genshin_impact`)
and its own half (`users` - translations, languages, settings, page switches and
people's records). It keeps one now, like every anotoki project. A checkout whose
`config/database.local.php` still names two (`'databases'`) is refused - the API
answers `not_set_up`, and `setup.php` will not save over it, since that would
start the site's half empty. Move it over once:

```bash
cd backend
php merge-databases.php --check   # what it would do
php merge-databases.php           # do it
```

It copies the `users` database's tables and every row into `genshin_impact` in one
transaction (anything wrong rolls all of it back), then rewrites
`database.local.php`. The old `users` database is left as it was; drop it once the
site runs without it. It needs `pg_dump`, found as the Backups page finds it.

Backups made before the merge hold two dumps. The Backups page still downloads
them, but restores only one-database backups: either half alone would leave the
database disagreeing with itself about which migrations ran.

The site that ran at `anotoki.eu` until 2026-09-29 was the two-database build from
before the IAM. Its database user was already gone by then, so nothing was moved
from it: production was installed fresh with `setup.php` (into an empty database)
and seeded from the developer's merged database with `db-push.php`, and
`anotoki.eu` was emptied. Should another such installation turn up, there is no
upgrade in place: `pg_dump` both of its databases, restore them into scratch
databases on a development machine, merge them there, install the host fresh,
and push the result. Never point `setup.php` at its content database - it is
refused, since `users/` would run over the content's tables.

### Later schema changes

FTP the new `migrations/{folder}/*.sql` files up, then open the admin **Migrations**
page and press **Apply pending** - `POST /api/migrations/apply` runs them in order
(ADMIN only), `users/` then `genshin_impact/`, stopping at the first failure.

### Copying local data up to production

The database copy runs from your machine against the remote server, so the missing
shell on the host does not matter - only that you can reach its PostgreSQL port.

```bash
cd backend
php db-push.php     # one command: dumps local, replaces the target database
```

`db-push.php` asks for the target connection, dumps local, clears the target and
restores into it - on a managed host, whose `public` schema usually belongs to the
server's superuser, by dropping what the site's user owns there. It **erases** the
target database (it asks you to type the host to confirm), so it is for seeding a
fresh server. The dump carries schema, data and the migrations table, so no migration run is needed
after; the target keeps its own `config/*.local.php` and `assets/`. To dump to files
and restore yourself, `php db-dump.php` prints the `pg_restore` command. Both need
the PostgreSQL client tools locally.

---

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| The site shows "Not set up yet", or the API answers `503 not_set_up` | `backend/config/*.local.php` are missing or incomplete. Open `http://localhost:8000/setup.php` - it lists what is missing. |
| `npm start` refuses to run | Node is not `22.15.0` - switch with `nvm use 22.15.0`. |
| API cannot connect to the database | Postgres is not running, or the connection in `setup.php` is wrong - its **Test connection** says which. |
| A new/changed endpoint isn't callable from the frontend | The client is stale - run `npm run api`. |
| Translation-key routes 404 in dev, or CORS errors on them | The PHP server was started without `router.php`. Use `php -S localhost:8000 router.php`. |
| CORS errors on every call | The site is not at the address in `app.local.php` (`http://localhost:4200`), or the API is not running. |
| Admin pages redirect to sign-in | Not signed in at the IAM, or the account holds neither the `genshin` ADMIN nor EDITOR role (grant it in the IAM admin console). |
| Sign-in bounces back with an error | The IAM is not running on 4300/8100, or does not know `http://localhost:4200/auth/callback` - run `php clients.php --dev` in the IAM's `backend/`. `setup.php`'s IAM test checks both. |
| Every request answers 401 though signed in | The API cannot fetch the IAM's key set from `http://localhost:4300/.well-known/jwks.json` - the IAM's frontend dev server must be running, it serves the issuer's URLs. |
| Backups page: "pg_dump was not found" | The PostgreSQL client tools aren't on PATH. Point at them in `backend/config/backup.local.php`. |
| Locked out of an account (lost password) | Accounts are the IAM's: its dev mail goes to its own `backend/storage/mail/`, and its `reset-password.php` restores access. |

## Handy scripts (from `backend/`)

- `php db-dump.php [--dir=…]` - dump the database (custom format) to a file; prints the `pg_restore` command.
- `php merge-databases.php [--check]` - once, on a checkout still configured with two databases: moves the second into the first.
- `php db-push.php` - copy local data up to another server in one command. ⚠ erases the target (confirmed by typing the host); for seeding a fresh production server.
- `php assets.php --status` - the asset tree against the `files` catalogue and the rows that name it.
- `php translations.php --status` - the translation keys the frontend asks for against the ones the database has (`--add-missing`, `--export`, `--import`).
- `php build-dist.php` - the production backend slice (see above).
