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

A fresh `users` database also gets an admin account — `admin@localhost`,
password `Admin1234!`, flagged so the site asks for a new password at the first
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

```bash
# 1. Build Angular app
cd ../your-angular-app
ng build --configuration production

# 2. Upload via SFTP:
#    dist/your-app/*     → public_html/
#    api/*               → public_html/api/
#    config/*            → public_html/config/   (NOT database.local.php!)
#    vendor/             → public_html/vendor/
#    swagger.json        → public_html/swagger.json  (optional)

# 3. Set your production DB credentials directly on the server
#    via hosting control panel or by uploading config/database.local.php manually
```

> ⚠️ Never upload `config/database.local.php` via git or automated scripts.
> Upload it manually once and leave it on the server.

---
