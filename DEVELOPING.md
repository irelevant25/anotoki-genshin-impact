# Developing anotoki · genshin_impact

A Genshin Impact fan site: a public reference-and-quiz site, plus an admin panel
that maintains its data. This guide is how to run it, work on it, and ship it.

| Part      | Folder     | Stack                                            |
| --------- | ---------- | ------------------------------------------------ |
| Frontend  | `angular/` | Angular 21, standalone + zoneless, signals       |
| Backend   | `php/`     | PHP 8.2, Slim 4, PostgreSQL                      |
| Docs      | `docs/`    | Generated HTML reports (reference, perf, security)|

The frontend and backend are two apps that talk over HTTP. In development they
run on two ports (`4200` and `8000`); in production they are served from one
origin. The **Angular API client is generated from the backend** — see
[The code-generation pipeline](#the-code-generation-pipeline), which is the one
thing to internalise before changing an endpoint.

> Ignore these root folders — they are not part of the app: `formats-converters`
> (the local AVIF/Opus conversion scripts, with the ffmpeg the backend's upload
> conversion also uses), `local` (gitignored: the wiki crawlers and the importer
> that loads their output through the API — `local/crawling-old/import_scripts/README.md`),
> `old` (the pre-rewrite Vue codebase).

---

## Prerequisites

| Tool         | Version           | Notes                                             |
| ------------ | ----------------- | ------------------------------------------------- |
| PHP          | 8.2+              | with the `pdo_pgsql` extension                    |
| PostgreSQL   | 14+               | two databases: `genshin_impact` and `users`       |
| Node.js      | **22.15.0**       | `npm start` checks this (via `nvm`) and refuses otherwise |
| Composer     | any recent        | `vendor/` is committed, so only needed if you change PHP deps |

Optional, for specific admin features:

- **`pg_dump` / `pg_restore`** — the admin **Backups** page. Found on `PATH` or
  the usual PostgreSQL install dirs; point elsewhere with `config/backup.local.php`.
- **ffmpeg** — audio conversion (PNG→AVIF works out of the box via `sharp`). See
  `formats-converters/`.

---

## First-time local setup

Do the backend first (the frontend generates its API client from it).

### 1. Backend (`php/`)

```bash
cd php

# Only if you changed composer.json — vendor/ is committed.
composer install

# Database credentials. Copy the template and edit it for your local Postgres.
cp config/database.php config/database.local.php
#   set driver 'pgsql', host, port 5432, and the database names/user/password.

# The JWT signing secret. The API refuses to start without one.
#   Create config/jwt.local.php returning a random string of at least 32 chars:
#   <?php return 'change-me-to-a-long-random-string-min-32-chars';

# Build both databases: creates missing ones, applies every pending migration,
# and seeds the reference data the migrations carry.
php migration.php

# Run the dev server (mimics the production Apache — the router matters).
php -S localhost:8000 router.php
```

A fresh `users` database is given a starter admin, **`admin@localhost`**, with a
randomly generated password that `php migration.php` prints once - copy it from
the terminal. The account is flagged so the site asks for a new password at first
sign-in. There is no fixed default password.

The API is now at `http://localhost:8000/api/...`.

### 2. Frontend (`angular/`)

In a second terminal:

```bash
cd angular
npm install
npm start          # http://localhost:4200
```

`npm start` checks your Node version, regenerates the API client from the
backend, then runs `ng serve`. The dev app reads `angular/public/config.json`,
which points at `http://localhost:8000` — so the two servers find each other
with no proxy.

Open `http://localhost:4200`, and the admin panel at `http://localhost:4200/admin`.
Sign in with the starter admin above.

---

## Day-to-day

Two servers run side by side:

| | Command (from its folder) | URL |
| --- | --- | --- |
| API | `php -S localhost:8000 router.php` | `http://localhost:8000` |
| App | `npm start` | `http://localhost:4200` |

Common commands:

```bash
# Backend (php/)
php migration.php --status     # what has run and what is pending
php migration.php --dry-run    # what would apply, applying nothing
php migration.php --db=users   # one database only

# Frontend (angular/)
npm run api                    # regenerate the API client (see below)
npm run lint
```

---

## The code-generation pipeline

**The typed API client under `angular/src/app/api/` is generated, not written.**
The backend's own route table, response shapes and migrations are read into
`angular/api-spec.json`, and the client is generated from that. Editing files
under `angular/src/app/api/` by hand is almost always a mistake — they are
overwritten.

After changing a backend **route**, its `responds()` shape, a `DbModel`, or a
**migration**, regenerate:

```bash
cd angular
npm run api        # = api:spec (reads PHP) + api:client (writes TS) + api:docs
```

`npm start` runs this for you on boot. When the generator names something
awkwardly, the fix is in `angular/api-config.mjs` (service groups, method names,
query/response types), then re-run `npm run api:client`.

---

## Database & migrations

**The migrations are the schema.** There is no separate schema file; a database
is what you get by replaying `php/migrations/{genshin_impact,users}/NNN_name.sql`
in order. Never edit an applied migration — add a new one.

- Locally: `php migration.php` applies everything pending.
- On a server with no shell: FTP the new `.sql` up, then use the admin
  **Migrations** page → **Apply pending** (`POST /api/migrations/apply`).

The engine behind the CLI, that button, and the first-run installer is one file,
`php/api/migration_runner.php`, so a database built any way is the same database.

---

## Building for production

The site ships to one web root, served same-origin. Two builds assemble it:

```bash
# Frontend  ->  angular/dist/angular/browser/
cd angular && npm run build:deploy

# Backend   ->  php/dist/  (runtime-only slice: no dev tooling, no secrets)
cd ../php && php build-dist.php
```

Upload both into the web root, plus the `assets/` image tree separately. The
**first** deploy bootstraps an empty database with `setup.php` (there is no admin
to log in with yet); after that, schema changes go through the admin Migrations
page.

The full, step-by-step deployment — the upload map, the secrets to place by hand,
the first-run installer, and the FTP-only constraints — is in
[`php/README.md`](php/README.md) under **Deploying to Hosting**. Read it before
your first deploy.

---

## Where to learn more

- **[`php/README.md`](php/README.md)** — the backend in depth: conventions,
  backups, the asset library, and deployment.
- **`docs/reference/reference-*.html`** — a generated map of the whole app: every
  frontend page, backend endpoint and database table, cross-linked. Regenerate
  with `node docs/reference/build-docs.mjs`.
- **[`CLAUDE.md`](CLAUDE.md)** — the project's conventions in one place (layout,
  naming, the DbQuery/DbModel/responds patterns, theming, i18n).

---

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| `npm start` refuses to run | Node is not `22.15.0` — switch with `nvm use 22.15.0`. |
| API 500s on boot, "No JWT signing secret" | `config/jwt.local.php` is missing. Create it (see setup). |
| API cannot connect to the database | Postgres is not running, or `config/database.local.php` is wrong. |
| A new/changed endpoint isn't callable from Angular | The client is stale — run `npm run api`. |
| Translation-key routes 404 in dev, or CORS errors on them | The PHP server was started without `router.php`. Use `php -S localhost:8000 router.php`. |
| Admin pages redirect to sign-in | Not signed in, or the JWT secret changed and invalidated sessions. |
| Backups page: "pg_dump was not found" | The PostgreSQL client tools aren't on PATH. Point at them in `config/backup.local.php`: `<?php return ['pg_dump' => 'C:/Program Files/PostgreSQL/18/bin/pg_dump.exe', 'pg_restore' => '…/pg_restore.exe'];`. |
| Locked out of an account (lost password) | Dev writes the reset email to `php/storage/mail/` — open the newest `.eml` and use the link. Or run `php reset-password.php <email> [new-password] [--clear-2fa]`. |

## Handy scripts (from `php/`)

- `php reset-password.php <email> [password] [--clear-2fa]` — restore access to an account: sets the password (or generates one), re-enables password sign-in, confirms the address, clears lockout.
- `php db-dump.php [--dir=…]` — dump both databases (custom format) to files; prints the `pg_restore` commands.
- `php db-push.php` — copy local data up to another server in one command: it asks for the target connection, then dumps local and replaces the target's two databases with it. ⚠ erases the target (confirmed by typing the host); for seeding a fresh production server.
