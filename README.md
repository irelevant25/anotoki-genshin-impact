# anotoki · genshin_impact

A Genshin Impact fan site - **genshin.anotoki.eu** - and the admin panel that
keeps its data. One of the anotoki sites; like the others, it signs people in
through the shared **anotoki IAM** rather than holding accounts of its own.

- **Database**: characters (talents, ascensions, constellations, voice-overs,
  builds), weapons, materials, banners - browsable, searchable, cross-linked.
- **Quizzes**: a daily run and six quizzes - banners, dishes, the odd one out,
  music, pixelated art, voice lines - with progress and statistics per person.
- **Games**: an elemental minesweeper and a tournament.
- **Profile**: quiz history and statistics. English and Slovak throughout.
- **Appearance, dates, clock and language** are the reader's anotoki account's:
  chosen in the account panel (or the admin panel's theme button), they apply on
  every anotoki site. Without signing in, the theme and the language are this
  device's and dates are written the device's way.
- **Admin panel**: every piece of game content and its media, translations and
  languages, site switches (maintenance, announcements, which pages are open to
  whom), migrations, backups, the audit log, errors and feedback.
- **What's new**: the version at the bottom of the site opens the changelog
  (`frontend/public/changelog.json`).

Everything on the public site is open without an account - unless the IAM's
"Sign-in required" switch is on for this site (it is off by default); then the site
sends you to sign in before it shows anything. Playing without signing in, your
games and statistics are kept on the server for your browser, for 30 days after
your last visit (the Profile, the quizzes and the Daily page say so); signing in
brings them into your anotoki account, where they stay. Signing in also opens
the admin panel to the people who hold a role here.

| Part | Folder | Stack |
| --- | --- | --- |
| Backend | [`backend/`](backend/) | PHP 8.2+, Slim 4, PostgreSQL - a JSON API under `/api` |
| Frontend | [`frontend/`](frontend/) | Angular 21, standalone + zoneless, signals - the site and the admin panel |
| Docs | [`docs/`](docs/) | Generated HTML reports (a reference of the whole app, API performance, a security review), the pg_dump guide for the hosting, the logos |

On a development machine the site runs at `http://localhost:4200`, its API at
`:8000`, and sign-in goes through the IAM at `http://localhost:4300`. In
production both parts are served from one web root on FTP-only PHP + PostgreSQL
hosting; the frontend calls its own `/api`.

## Running it on your computer

You need **PHP 8.2 or newer** with `pdo_pgsql`, **PostgreSQL**, **Node.js 22**
and **Bun** (the frontend installs its packages with `bun ci`), and the **anotoki
IAM** (`../anotoki-iam`), which holds the accounts.
`backend/vendor/` is committed, so Composer is only needed to change PHP
dependencies - among them `anotoki/lib`, the library every anotoki site shares
(*How it works*, below).

1. Set up and start the IAM by its own DEV.md: its pages on `:4300`, its
   API on `:8100`.
2. Start the backend and run the setup page:
   ```bash
   cd backend
   composer start                   # php -S localhost:8000 router.php
   ```
   Open `http://localhost:8000/setup.php` (it starts from PostgreSQL on port 5432
   and the database `anotoki_genshin`), fill in the database password, press
   **Test connection** under the database and under the IAM, then **Save**. It
   creates the database, applies every migration, and writes the settings to
   `backend/config/*.local.php`. Until then the API answers `503 not_set_up` and
   the site shows "This site is not set up yet", with a link to this page.
3. Start the frontend in a second terminal:
   ```bash
   cd frontend
   npm start                        # bun ci, then ng serve on :4200 with the proxy
   ```
   Open `http://localhost:4200`, and the admin panel at `/admin`. `ng serve`'s
   proxy hands `/api` to the backend, so the site calls its own origin, as in
   production. **Sign in** goes to the IAM and comes back signed in.

On your own computer the setup page stays in place: open it again whenever a
setting changes. The pictures and sounds (`assets/`, about 2.5 GB) are not in
git; without a copy of that tree the pages work but draw no pictures. Every
step, and the everyday commands: **[DEV.md](DEV.md)**.

## How it works

- **One database** holds everything, in two halves with their own migration
  folders: the game content (`genshin_impact`) and the site's own half (`users` -
  translations, languages, settings, page switches, people's records).
- **The content** is entered and changed in the admin panel. A character's talents, ascensions,
  constellations and voice-overs belong to shared sets, so the Traveler's forms
  share one copy.
- **Pictures and sounds** are files under `assets/`, catalogued in a `files`
  table that every picture and sound column points at. Uploads are converted to
  AVIF and Opus on the way in, and named after what they show ("Hu Tao" →
  `HU_TAO`).
- **Signing in** happens at the anotoki IAM (OpenID Connect); this site is its
  client `genshin`. The backend checks every access token itself - the IAM's
  signature, issuer, audience and expiry - and keeps a small record of each
  person: name and address. How they like the sites to look is their anotoki
  account's, which the pages read and save through the IAM. Roles are granted in the
  IAM's admin console: **EDITOR** changes game content, **ADMIN** also the site's
  settings, migrations and backups. A role taken away stops working here within
  ten minutes.
- **Languages**: the site's own words go through translation keys; names from
  the game stay as they are. The English and Slovak strings live in the site's
  half of the database and are edited in the admin panel.
- **Site switches**: an admin can close the site for maintenance, show an
  announcement, and decide per page who sees it (everyone, signed in, editors,
  admins) or switch it off. The site hides what is closed, and the API refuses
  it too - everything during maintenance, and a page's data once its API paths
  are named. `/staff` is the way back in while the site is closed.
- **Migrations are the schema**: SQL files in `backend/migrations/`, applied in
  order - by `php migration.php` here, and from the admin panel's Migrations page
  on the hosting.
- **While the site is not ready** it behaves as every anotoki site does, through
  the library they share, `anotoki-lib` (`anotoki/lib` in `backend/vendor/`,
  `@anotoki/lib` in the frontend): while a database update waits, visitors and
  signed-in readers see "The site is being updated" - in their language, no error,
  only a quiet Sign in - and the API answers them `503 update_pending`; the
  site's ADMIN reads "A database update is waiting" and reaches the Migrations
  page, which still works. Never set up: "This site is not set up yet", with the
  setup page; set up once and not answering: "not available right now", never
  the setup page. The engine that applies the migrations is the library's too.
- **The API client is generated**: the frontend's typed client under
  `frontend/src/app/api/` is written by `npm run api` from the backend's own
  routes, response shapes and migrations, never by hand.

## Deploying

The hosting has FTP and nothing else - no shell, no cron. Two builds make the
upload: `npm run build:deploy` in `frontend/` and `php build-dist.php` in
`backend/`, neither carrying any configuration or secret; `assets/` is uploaded
on its own. The first install runs through `setup.php` in the browser, proved by
a token only FTP can read; it writes the settings, then locks and deletes
itself. Later schema changes are applied from the admin panel's Migrations page -
until they are, the site tells everybody but its ADMIN that it is being updated.
The IAM has to be installed first. The upload map and every step:
[DEV.md](DEV.md) ("Deploying to the hosting").

## Project layout

```text
backend/
  api/                  index.php (the Slim app); routes/genshin_impact/ and routes/users/, each with
                        endpoints/, models/ and responses/; meddleware/ (sign-in and roles, maintenance,
                        page gates, validation); the query builder, the asset code, the IAM's token
                        verifier (vendored); migration_runner.php and site_state.php (the migrations and
                        where the site stands, on the shared library)
  config/               one module per concern; *.local.php per installation (written by setup.php)
  migrations/           users/ and genshin_impact/ - the one database's schema, as SQL files applied in order
  vendor/               committed: the hosting has no Composer (anotoki/lib, the anotoki sites' library, too)
  setup.php, router.php, migration.php, build-dist.php, db-dump.php, db-push.php, assets.php,
  merge-databases.php   (once, for a checkout from when the site had two databases)
frontend/
  src/app/sites/main/   the public site: database, quizzes, daily, games, profile
  src/app/sites/admin/  the admin panel
  src/app/shared/       local-lib (the UI kit, abstract bases, the IAM's browser SDK), site-status.ts
                        (the shared library's gate and Migrations page, set up for this site)
  src/app/api/          the API client, generated from the backend (npm run api)
  public/               config.json (where the API is), changelog.json
docs/                   generated reports: reference/, performance/, security/; PG-DUMP-INSTALL.md (pg_dump
                        on the hosting, for backups); images/ (the anotoki logos)
.claude/                project skills and agents for AI-assisted work
.gitignore, CLAUDE.md, README.md, DEV.md - and nothing else committed at the root
                        (in development the untracked assets/ tree sits there too)
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

- Version 1.1.0 (the changelog has what each version brought). Since 1.1.0 a
  version has three numbers, MAJOR.MINOR.PATCH - big changes, new features, bug
  fixes - and `frontend/package.json` carries the same one.
- Public database pages for characters, weapons, materials and banners. The admin
  panel also keeps artifacts, foods and enemies; they have no public pages yet.
- Since 2026-09-27 signing in is the anotoki IAM's; since 2026-09-29 the code is
  `backend/` + `frontend/`, every installation is configured by `setup.php`, and
  the site keeps one database where it used to keep two.
- Since 2026-10-01 setup.php asks only for the database and the IAM (and on a
  host the setup token), like every anotoki setup page: this site's address is
  read from the request and `pg_dump` is found on the hosting by itself. It starts
  from the database `anotoki_genshin` on port 5432, and its **Test connection**
  answers in the words every anotoki setup page uses. The root is clean like the
  other anotoki projects': the Vue codebase is gone (git keeps it), the logos and
  the pg_dump guide live in `docs/`.
- Since 2026-10-02 the API has no CORS: in development `npm start` (`bun ci`, then
  `ng serve` with `proxy.conf.json`) puts the pages and the API on one origin, as
  production does. Audio is converted with the `ffmpeg` on PATH.
- Since 2026-10-05 whether the site requires signing in is the IAM's switch, per
  site (off here). The API reads it from the IAM - kept a minute, and "required"
  whenever the IAM cannot say - tells the pages in `/api/settings/public`, and
  while it is on answers 401 to everybody signed out but for what the sign-in
  card and the asset previews need. Every account holds the role MEMBER here, an ordinary reader. The
  pages send everybody signed out to the IAM before the first page, and draw a
  "Sign in to continue" card instead of the site where that cannot happen by
  itself (its words arrive with migration `users/044`). Visitor accounts are
  built (migrations `users/045`, `users/046` and `genshin_impact/027`): a
  signed-out player's first played question makes their visitor - the API
  keeps its games and statistics behind a key it makes, for 30 days after the
  last visit, and never lets it near anybody else's data or the admin panel;
  the browser's own saved games are carried in once; signing in moves the
  visitor's games and statistics into the account. A notice on the Profile,
  the quizzes and the Daily page says how long they are kept, a message after
  a sign-in says what came along, and the admin dashboard counts the visitors.
  With 045 pending the pages keep a signed-out player's games in the browser
  as before. The final review of this work is still to come.
- Since 2026-10-06 the theme, the date order, the clock and the language are the
  anotoki account's (the IAM's migration 015), one choice for every anotoki
  site: the account panel's choosers and the admin panel's theme button save to
  the account through the IAM's browser SDK 1.2.0, and the site follows the
  account's choices - one theme for the whole site, the admin panel's own
  theme gone. Signed out, the device's. The API keeps no copy any more:
  migration `users/048` drops the old columns, and `users/047` brings the
  account panel's line saying so.
- Since 2026-10-07 the migrations, and what the site does while it is not ready,
  are the anotoki sites' shared library's - `anotoki-lib` 0.1.0 (the Composer
  package `anotoki/lib`, the npm package `@anotoki/lib`) - at the owner's
  request: *"When there is a new migration, some sites behave differently than
  others. Japanese won't let me go to the admin or anywhere if I am not logged
  in, but I cannot log in because a migration is waiting. Genshin gives me no
  warning. Piano and survey show me a setup error with buttons to the setup page
  or the migrations page. This needs to be consistent. I do not want logged-in
  users or visitors to see the error about what is going on. The admin should
  see it. If the setup was already done it should never offer that button again,
  especially as setup.php is no longer there."* So, as on every anotoki site:
  while a database update waits, the API answers `503 update_pending` to
  everything but signing in, the pages' words and the admin Migrations page, and
  the pages show visitors and signed-in readers "The site is being updated" and
  the ADMIN the way to the Migrations page (`/admin/migrations`, the library's;
  its API is `/api/admin/migrations`, for ADMIN only - editors no longer see the
  list); the setup page is offered only until the site was installed. The
  engine is the library's `Migrator`, which builds exactly the database the old
  one did (both folders, the same record table, the same order guard); the site's
  own not-set-up page and Migrations pages are gone, and migration `users/049`
  drops the old page's strings.

## More

- Setting it up, running, checking, building and deploying:
  [DEV.md](DEV.md).
- The rules for changing the code: [CLAUDE.md](CLAUDE.md).
- Signing in through the anotoki IAM: the IAM repository (`../anotoki-iam`), its
  `docs/integrating-an-app.md`.
