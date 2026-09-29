# anotoki · genshin_impact

A Genshin Impact fan site - **genshin.anotoki.eu** - and the admin panel that
keeps its data. One of the anotoki sites; like the others, it signs people in
through the shared **anotoki IAM** rather than holding accounts of its own.

- **Database**: characters (talents, ascensions, constellations, voice-overs,
  builds), weapons, materials, banners - browsable, searchable, cross-linked.
- **Quizzes**: a daily run and six quizzes - banners, dishes, the odd one out,
  music, pixelated art, voice lines - with progress and statistics per person.
- **Games**: an elemental minesweeper and a tournament.
- **Profile**: quiz history and statistics, and the reader's own preferences
  (theme, language, date formats). English and Slovak throughout.
- **Admin panel**: every piece of game content and its media, translations and
  languages, site switches (maintenance, announcements, which pages are open to
  whom), migrations, backups, the audit log, errors and feedback.
- **What's new**: the version at the bottom of the site opens the changelog
  (`frontend/public/changelog.json`).

Everything on the public site is open without an account. Signing in keeps quiz
progress and statistics with your anotoki account instead of in the browser, and
opens the admin panel to the people who hold a role here.

| Part | Folder | Stack |
| --- | --- | --- |
| Backend | [`backend/`](backend/) | PHP 8.2+, Slim 4, PostgreSQL - a JSON API under `/api` |
| Frontend | [`frontend/`](frontend/) | Angular 21, standalone + zoneless, signals - the site and the admin panel |
| Docs | [`docs/`](docs/) | Generated HTML reports: a reference of the whole app, API performance, a security review |

On a development machine the site runs at `http://localhost:4200`, its API at
`:8000`, and sign-in goes through the IAM at `http://localhost:4300`. In
production both parts are served from one web root on FTP-only PHP + PostgreSQL
hosting; the frontend calls its own `/api`.

## Running it on your computer

You need **PHP 8.2 or newer** with `pdo_pgsql`, **PostgreSQL**, **Node.js
22.15.0**, and the **anotoki IAM** (`../anotoki-iam`), which holds the accounts.
`backend/vendor/` is committed, so Composer is only needed to change PHP
dependencies.

1. Set up and start the IAM by its own DEVELOPING.md: its pages on `:4300`, its
   API on `:8100`.
2. Start the backend and run the setup page:
   ```bash
   cd backend
   php -S localhost:8000 router.php
   ```
   Open `http://localhost:8000/setup.php`, fill in the database password, press
   **Test connection** under the database and under the IAM, then **Save**. It
   creates the two databases, applies every migration, and writes the settings to
   `backend/config/*.local.php`. Until then the API answers `503 not_set_up` and
   the site shows a "not set up yet" page.
3. Start the frontend in a second terminal:
   ```bash
   cd frontend
   npm install
   npm start
   ```
   Open `http://localhost:4200`, and the admin panel at `/admin`. **Sign in**
   goes to the IAM and comes back signed in.

On your own computer the setup page stays in place: open it again whenever a
setting changes. The pictures and sounds (`assets/`, about 2.5 GB) are not in
git; without a copy of that tree the pages work but draw no pictures. Every
step, and the everyday commands: **[DEVELOPING.md](DEVELOPING.md)**.

## How it works

- **The content** lives in PostgreSQL, in the `genshin_impact` database, and is
  entered and changed in the admin panel. A character's talents, ascensions,
  constellations and voice-overs belong to shared sets, so the Traveler's forms
  share one copy.
- **Pictures and sounds** are files under `assets/`, catalogued in a `files`
  table that every picture and sound column points at. Uploads are converted to
  AVIF and Opus on the way in, and named after what they show ("Hu Tao" →
  `HU_TAO`).
- **Signing in** happens at the anotoki IAM (OpenID Connect); this site is its
  client `genshin`. The backend checks every access token itself - the IAM's
  signature, issuer, audience and expiry - and keeps a small record of each
  person: name, address and this site's preferences. Roles are granted in the
  IAM's admin console: **EDITOR** changes game content, **ADMIN** also the site's
  settings, migrations and backups. A role taken away stops working here within
  ten minutes.
- **Languages**: the site's own words go through translation keys; names from
  the game stay as they are. The English and Slovak strings live in the `users`
  database and are edited in the admin panel.
- **Site switches**: an admin can close the site for maintenance, show an
  announcement, and decide per page who sees it (everyone, signed in, editors,
  admins) or switch it off. The site hides what is closed, and the API refuses
  it too - everything during maintenance, and a page's data once its API paths
  are named. `/staff` is the way back in while the site is closed.
- **Migrations are the schema**: SQL files in `backend/migrations/`, applied in
  order - by `php migration.php` here, and from the admin panel's Migrations page
  on the hosting.
- **The API client is generated**: the frontend's typed client under
  `frontend/src/app/api/` is written by `npm run api` from the backend's own
  routes, response shapes and migrations, never by hand.

## Deploying

The hosting has FTP and nothing else - no shell, no cron. Two builds make the
upload: `npm run build:deploy` in `frontend/` and `php build-dist.php` in
`backend/`, neither carrying any configuration or secret; `assets/` is uploaded
on its own. The first install runs through `setup.php` in the browser, proved by
a token only FTP can read; it writes the settings, then locks and deletes
itself. Later schema changes are applied from the admin panel's Migrations page.
The IAM has to be installed first. The upload map and every step:
[DEVELOPING.md](DEVELOPING.md) ("Deploying to the hosting").

## Project layout

```text
backend/
  api/                  index.php (the Slim app); routes/genshin_impact/ and routes/users/, each with
                        endpoints/, models/ and responses/; meddleware/ (sign-in and roles, maintenance,
                        page gates, validation); the query builder, the asset code, the IAM's token
                        verifier (vendored)
  config/               one module per concern; *.local.php per installation (written by setup.php)
  migrations/           genshin_impact/ and users/ - the schema, as SQL files applied in order
  vendor/               committed: the hosting has no Composer
  setup.php, router.php, migration.php, build-dist.php, db-dump.php, db-push.php, assets.php
frontend/
  src/app/sites/main/   the public site: database, quizzes, daily, games, profile
  src/app/sites/admin/  the admin panel
  src/app/shared/       local-lib (the UI kit, abstract bases, the IAM's browser SDK), the not-set-up page
  src/app/api/          the API client, generated from the backend (npm run api)
  public/               config.json (where the API is), changelog.json
docs/                   generated reports: reference/, performance/, security/
old/                    the Vue codebase from before the rewrite, kept for reference
.claude/                project skills and agents for AI-assisted work
```

## Docs

Each report is a self-contained HTML file, generated from the code so it does
not drift; [docs/README.md](docs/README.md) lists them.

- **`docs/reference/`** - every frontend page, backend endpoint and database
  table, cross-linked. The quickest way into the code.
- **`docs/performance/`** - every GET endpoint timed, each report compared with
  the one before.
- **`docs/security/`** - a security review with each finding's severity, cause
  and fix.

## Working on the project with AI

- [CLAUDE.md](CLAUDE.md) is loaded by Claude Code and holds the conventions: the
  generated API client, the backend's DbQuery / DbModel / `responds()` patterns,
  migrations, configuration, the frontend's signals and local-lib, i18n and
  theming.
- Project skills (`.claude/skills/`): `sync-api-client`, `scaffold-entity`,
  `db-migration`, `deploy`, `refresh-docs`. Project agents (`.claude/agents/`):
  `backend-engineer`, `frontend-engineer`, `code-reviewer`.

## Current state

- Version 0.9 (the changelog has what each version brought).
- Public database pages for characters, weapons, materials and banners. The admin
  panel also keeps artifacts, foods and enemies; they have no public pages yet.
- Since 2026-09-27 signing in is the anotoki IAM's; since 2026-09-29 the code is
  `backend/` + `frontend/`, and every installation is configured by `setup.php`.

## More

- Setting it up, running, checking, building and deploying:
  [DEVELOPING.md](DEVELOPING.md).
- The rules for changing the code: [CLAUDE.md](CLAUDE.md).
- Signing in through the anotoki IAM: the IAM repository (`../anotoki-iam`), its
  `docs/integrating-an-app.md`.
