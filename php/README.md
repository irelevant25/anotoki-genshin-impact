# Version informations:

| Technology   | Version   |
| ------------ | --------- |
| `php`        | v`8.2.12` |
| `composer`   | v`2.9.5`  |
| `PostgreSQL` | v`18.3`   |

# Flyway

# PHP CRUD API Template

Minimal PHP REST API with Swagger/OpenAPI annotations.
Designed to work with openapi-generator-cli to auto-generate Angular services.

### Install PHP dependencies

Before, download and install it from: getcomposer.org/download

```bash
composer install
```

### Set up your database credentials

```bash
cp config/database.php config/database.local.php
# Edit config/database.local.php with your actual DB credentials
```

### Backups (optional)

The **Backups** page in the admin site shells out to `pg_dump` and `pg_restore`,
which it finds on `PATH` or in the usual PostgreSQL install directories. If they
are somewhere else, point at them:

```bash
# config/backup.local.php
<?php return ['pg_dump' => '/opt/pgsql/18/bin/pg_dump'];
```

Dumps are written to `storage/backups/`, one directory per backup holding a
`.dump` per database plus a `backup.json` manifest. `storage/` is gitignored —
a dump contains every row in the database, password hashes included.

Restoring is done per database from inside a backup. It replaces everything in
that database, so it asks for the admin's password and a typed confirmation,
keeps the button unavailable for 30 seconds, and takes a backup of the current
state first. It runs in a single transaction, so a failure leaves the database
untouched. Note that `pg_restore --clean` drops only the objects the dump
contains: a table created after the backup was taken survives the restore.

### Build the databases

```bash
php migration.php
```

Creates whichever databases in `config/database.local.php` are missing, then
applies every file in `migrations/<alias>/` that has not run yet, in order.
Run it on a fresh checkout and on an existing one; it is the same command
either way, and on an up-to-date database it does nothing.

A fresh `users` database also gets an admin account — `admin@localhost`, with a
randomly generated password that the command prints once. Copy it from the
terminal; the account is flagged so the site asks for a new password at the first
sign-in.

```bash
php migration.php --status     # what has run and what has not
php migration.php --dry-run    # what would run, without running it
php migration.php --db=users   # one database rather than all of them
```

### Start local PHP server (is single threaded)

```bash
php -S localhost:8000 router.php
```

Your API is now running at `http://localhost:8000/api/...`

The router script matters. Without it `php -S` decides whether a request is
for a file by looking for a dot in the last path segment, so any URL that ends
in one - `PUT /api/translation-keys/guide.banners.content`, and every other
translation key - is answered 404 without the API being reached. In a browser
that shows up as a CORS error, because the preflight is 404'd too. Apache has
no such rule, so this only ever bites in development. `router.php` also serves
`/uploads/...` from `public/`, which one document root cannot cover alongside
the API.

---

### Changing the schema

Write a migration by hand — the next number in `migrations/<alias>/`, named for
what it does — and run `php migration.php`.

There is no schema file to keep in step any more, and that is the point. There
used to be one per database beside the migrations folder, describing the same
thing twice, and they drifted: two columns existed only in the schema file, and
a table had two different names. The migrations are the description now, and a
database is what you get by applying them in order — including the rows they
insert, so a database built today has the same languages, sites and translated
strings as one built from the same folder a year from now.

A file already recorded in the `migrations` table is never run again. Editing
one that has been applied changes nothing on a database that has it, and
everything on a database that has not — write another file instead.

`generate-api-spec.php` reads the same folder, replaying it to work out what
each table looks like, so a new column reaches the generated client without
being written down anywhere else.

### Site settings

Admin panel → System → Site Settings. A card per group; each opens a modal.

| Switch | What it does |
| --- | --- |
| Maintenance mode | The site draws a closed sign instead of itself, and the API answers 503 to everything but signing in, the languages and the strings on the sign. Admins are exempt. |
| Signing in | Closes every way in — password, emailed code, Google, confirmation links and password resets — for everybody but admins, and takes the sign-in and register buttons off the site. |
| Google sign-in | Hides the Google button and refuses Google tokens, admins included. |
| Announcement | A dismissable bar above the header, one message per language, at one of three levels. |

**Getting back in after switching the site off**: `/staff`. It is the ordinary
sign-in form at an address the closed site still draws it on; the API refuses
everybody but an admin, so the path grants nothing on its own. That is the way
back from both maintenance mode and the sign-in switch.

The switches live in `site_settings`, one row each, scoped by site. Adding
another is a row in a migration — `name`, a `type` out of
`boolean | text | i18n | choice`, and a default — plus an entry in
`SETTING_WORDS` in `sites/admin/settings/settings-words.ts` if it deserves a
sentence. The form draws whatever it finds, so a new switch is editable before
anybody writes about it.

### Parts of the site

The third card. A row per page in `site_routes`, seeded from the router by a
migration, carrying two separate decisions:

- **Visible to** — `PUBLIC`, `USER`, `EDITOR` or `ADMIN`. The lowest kind of
  reader the page is drawn for. Everything is seeded `PUBLIC`; `ADMIN` is the
  default for a row added by hand, because the safe default for a page nobody
  has thought about is that nobody sees it.
- **Off** — takes it away from everybody who is not an admin, whatever the
  first says. "Members only" and "off this week" are different things.

Either one takes the page out of the menu and stops it matching in the router,
so its address answers as not found — at the address that was typed. Admins
keep every page, with a badge in the menu and a bar on the page saying which of
the two it is; without that, an admin switching something off would see no
change at all.

A page's **API paths** are optional and empty by default, so switching a page
off leaves its data being served — right for "that page is not finished", wrong
for "nobody may have this". Naming a path is what turns the sign into a lock:
`api/meddleware/route_gate.php` then answers 423 to anybody the page is not
drawn for. Paths are matched from the start, so `/api/quiz` covers
`/api/quizzes` and `/api/quiz/stats` alike.

Two rules worth knowing:

- Where two pages claim the same path, **the more open one wins**. `/daily` and
  `/quizzes` both run on `/api/quiz`, and switching one off should not quietly
  take the endpoint away from the other.
- A path covering `/api/auth`, `/api/settings`, `/api/routes`, `/api/languages`
  or `/api/translations` is **refused on save**. Admins are exempt from the
  gate so nobody can lock themselves out, but those are the paths where locking
  out everybody else is worst.

**Add a page** takes a path the migration did not seed — one written since, or
one somebody wants governed before its route exists, which is the useful order
when the point is that it should not be reachable yet. Nothing checks the path
against the router: the API has no idea what the front end declares, and a
check it could only guess at would refuse pages that exist and admit pages that
do not. New rows are `ADMIN` until changed.

The **×** on a row stops governing that page rather than removing it from the
site — a page with no row is public and always drawn, which is what everything
was before this table existed.

`/confirm-email`, `/reset-password` and `/staff` have no row and cannot be
given one. Governing them would break links already sitting in people's
inboxes, or lock the door with the key inside.

Everything above is enforced twice on purpose: the site draws the closed sign
and hides the menu item, and the API means it. A closed sign drawn in a browser
stops the people who were going to read the page and nobody else.

### The asset library

Admin panel → Files, and a card on the Dashboard. Both read one survey: a walk
over every file under `assets/`, cached for a day because there are 65,000 of
them and the walk takes a couple of seconds. **Re-scan** does it again, for when
something changed on disk and waiting out the cache is the wrong answer.

It answers two different questions:

- **By format** — how many files of each extension and how much room they take.
  The interesting number is not the count, it is where the ten gigabytes went.
- **Converted formats** — the site serves AVIF and Opus. Uploads are re-encoded
  on the way in, so this is about what arrived before that was true or was put
  on disk by the scripts in `/formats-converters`.

`missing` is a job: a source with no converted file beside it, and **Convert**
works through them. `converted only` is not a job: those are files whose source
was deleted (the opus script has a `DELETE_ORIGINAL` switch), and a PNG decoded
back out of an AVIF is a bigger copy of the lossy one rather than the original.
It is reported and left alone.

**Pairing is by normalised name, not by exact stem.** The tree holds both the
display name and an upper-snake spelling of the same picture -
`Adventurer's Bandana.avif` sits beside `ADVENTURERS_BANDANA.png` - because the
front end resolves art by trying both in turn. Pairing on the raw stem reports
about 5,500 images as unconverted rather than 1,800, and then converts three
and a half thousand of them a second time under the other name.

**Converting runs in batches**, a request each, and the page draws the progress.
That is not decoration: seven thousand files is minutes of work, and any single
request long enough to do it is long enough to be killed by something. The queue
lives in `storage/cache/asset-convert-queue.json`, so stopping is a pause and a
closed tab leaves the rest waiting rather than lost.

Only what this server can encode is queued. AVIF needs the `imagick` or `gd`
extension. Opus needs `ffmpeg`, and there are two ways to give it one:

```bash
# Either: drop an ffmpeg build in beside the converter scripts
#   formats-converters/ffmpeg.exe          (or ./ffmpeg on Linux)

# Or: let the scripts' own dependency unpack one
cd formats-converters && npm install
```

Both live in `/formats-converters` and both are found automatically, ahead of
anything on `PATH` - a checkout carrying its own ffmpeg is saying which one it
means. They are gitignored: an ffmpeg build is a couple of hundred megabytes a
binary and belongs on disk rather than in history.

Failing that, `PATH` and the usual install directories are tried. What cannot be
encoded is counted and said so on the page, rather than queued to fail one file
at a time.

A note on speed. GD writes AVIF at roughly a third of a second for an icon and
several seconds for a full-size banner, so a few thousand images is half an hour
rather than seconds; Imagick with an AVIF delegate, or the sharp-based script in
`/formats-converters`, is considerably faster on a large backlog. ffmpeg is
quicker per file - a tenth of a second for a voice line - but there are far more
of them, so the audio backlog is the one measured in hours.

### Filling the profile page with something to look at (optional)

```bash
php seed_quiz_history.php --user=1 --questions=1800 --days=180
```

Invents quiz history for one account, drawn from normal distributions rather
than flat ones — a couple of favourite quizzes, characters they always get and
characters they never do, busy weeks and quiet ones. `--dry-run` prints the
summary without writing. It adds to what is there and recomputes the lifetime
totals from the whole log, so the two tables agree afterwards.

## Deploying to Hosting

The site is served from one web root (`public_html/`): the built Angular app at
the root, the API under `api/`, and the images under `assets/`. The frontend
talks to its own origin, so `/api/...` is a relative call - no CORS, no second
domain.

Two builds assemble what to upload; neither invents anything the running site
would not have.

```bash
# 1. Frontend  ->  angular/dist/angular/browser/
cd angular
npm run build:deploy
#   ng build (production) + a step that writes, into the build only:
#     config.json  { "url": "", "configuration": "prod" }  (same-origin API)
#     .htaccess    SPA fallback, with /api and /uploads passed through
#   The 2.7 GB assets/ tree is NOT bundled (see step 3).

# 2. Backend   ->  php/dist/
cd ../php
php build-dist.php
#   The runtime-only slice: api/ (minus the generators and API reference),
#   config/ (minus secrets), vendor/, composer.*, migrations/, and hardened
#   public/uploads/ + storage/. Dev tooling and secrets are left behind.
```

Upload, all into `public_html/`:

```
angular/dist/angular/browser/*   →  public_html/            (index.html, JS/CSS, config.json, .htaccess)
php/dist/*                        →  public_html/            (api/, config/, vendor/, migrations/, public/, storage/, composer.*)
assets/*                          →  public_html/assets/     (separately - it is large and changes rarely)
```

The real config lives in `*.local.php` files, which the build leaves out on
purpose. `setup.php` (below) writes all of them for you on the first install -
`config/database.local.php`, `config/jwt.local.php`, `config/mail.local.php`, and
`config/google.local.php` if you enter a Google client ID (blank skips Google
sign-in). Nothing needs placing by hand.

> ⚠️ Never commit or ship a `*.local.php` file or `config/google.php`. The
> `.local.php` suffix means "this deployment's real values", as opposed to the
> committed `database.php`/`jwt.php` templates; `getDb()` and the JWT loader
> prefer the `.local` file and fall back to the template.

### First install (empty database)

The admin's "apply migrations" button needs an admin to sign in, which needs the
database the migrations build - so the very first time, use the installer. It
asks for everything and writes every config file itself; nothing is pre-made.

1. Create the databases in your hosting panel (PostgreSQL) - the app's user
   usually cannot - and note their names.
2. Upload `php/setup.php` to the web root, beside the build. (It is not part of
   `build-dist.php`; upload it by hand, just this once.)
3. Open `https://your-site/setup.php`. On first view it writes a random token to
   `config/setup.local.php`; **open that file over SFTP and copy the token** -
   only someone with server access can, which is how it knows it is you.
4. Fill the form: the token, the admin account, the database connection (host,
   port, username, password, the two database names), email — the two sender
   mailboxes (`noreply@` for automated mail, `support@` for the welcome, both
   real mailboxes on your domain) and the site URL for links — and, optionally, a
   Google sign-in client ID (blank to skip). It runs every migration, creates the
   admin, and writes `config/database.local.php`, `config/jwt.local.php`,
   `config/mail.local.php`, and `config/google.local.php` if you gave an ID.
5. It writes `storage/installed.lock` (which makes it refuse to run again even
   if the next part fails), then deletes `config/setup.local.php` and itself.
   If the host would not let it self-delete, remove `setup.php` by hand.

### Later schema changes

Once there is an admin, no shell is needed: FTP the new `migrations/{alias}/*.sql`
files up, then open the admin **Migrations** page and press **Apply pending** -
`POST /api/migrations/apply` runs them in order (ADMIN only). The same engine
(`api/migration_runner.php`) backs that button, `setup.php`, and
`php migration.php`, so a database built any of the three ways is the same
database.

### Copying local data up to production

The database migration runs from your machine against the remote server, so the
lack of a shell on the host does not matter - only that you can reach its
PostgreSQL host and port.

```bash
cd php
php reset-password.php <admin-email>   # so prod inherits a password you know
php db-push.php                         # one command: dumps local, replaces the target DBs
```

`db-push.php` asks for the target connection, then for each database dumps local,
wipes the target's schema and restores into it - so it works whether or not the
target has already been built by `setup.php`, and it never needs `pg_restore`
syntax or a `PGPASSWORD` set by hand. It **erases** the target databases (it asks
you to type the host to confirm), so it is for seeding a fresh server. The dumps
carry schema, data and the migrations table, so no migration run is needed after;
`setup.php` (or hand-uploaded `*.local.php`) supplies only the config, and
`assets/` still goes up separately.

To dump to files instead and run the restore yourself, use `php db-dump.php` - it
prints the `pg_restore` commands. Either way needs the PostgreSQL client tools
locally; if they are not on PATH, point `config/backup.local.php` at them.

---
