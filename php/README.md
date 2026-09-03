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

### Run init script (it will create database and apply schema.sql and create first migration schema)

```bash
php init.php
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

### When doing changes to schema.sql call to create a migration (and apply it at the end)

```bash
php migration.php
# it has bugs and not always its correct so I recommend manual check of the migrations scripts
```

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
