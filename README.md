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
- **Appearance, dates, clock and language** are the reader's anotoki account's
  and apply on every anotoki site: the appearance and the language chosen in the
  account panel (or the admin panel's theme switch), the dates and the clock on
  the IAM's account page. Without signing in, the theme and the language are this
  device's and dates are written the device's way.
- **Admin panel**: every piece of game content and its media, the site's words
  (translations, languages and the guides' pages), the quizzes' levels, and the
  site settings (maintenance, the announcement, which pages are open to whom),
  migrations, backups, the audit log, errors, feedback, the file explorer and
  the people the site keeps a record of - the last eight the anotoki library's
  pages, for the ADMIN alone.
- **What's new**: the version at the bottom of the site opens the changelog
  (`frontend/public/changelog.json`).
- **Terms, Privacy and Contact**: the anotoki sites' shared pages with this
  site's own facts - what it keeps, why and for how long, what it stores in a
  browser - linked under every page beside the fan clause: "This site is a
  fan-made project and is not affiliated with or endorsed by HoYoverse."

Everything on the public site is open without an account - unless the IAM's
"Sign-in required" switch is on for this site (it is off by default); then the site
sends you to sign in before it shows anything. Playing without signing in, your
games and statistics are kept on the server for your browser, for 30 days after
your last visit (the Profile, the quizzes and the Daily page say so); signing in
brings them into your anotoki account, where they stay. Signed in to your
anotoki account already - at the IAM, or on another anotoki site - you are
signed in here without a click. Signing in also opens the admin panel to the
people who hold a role here.

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

You need **PHP 8.2 or newer** with `pdo_pgsql`, `mbstring` and `zlib`, **PostgreSQL**, **Node.js 22**
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
  translations, languages, people's records); the site settings are in the
  shared library's own tables beside them.
- **The content** is entered and changed in the admin panel. A character's talents, ascensions,
  constellations and voice-overs belong to shared sets, so the Traveler's forms
  share one copy.
- **Pictures and sounds** are files under `assets/`, catalogued in a `files`
  table that every picture and sound column points at. Uploads are converted to
  AVIF and Opus on the way in, and named after what they show ("Hu Tao" →
  `HU_TAO`).
- **Signing in** happens at the anotoki IAM (OpenID Connect); this site is its
  client `genshin`. The backend checks every access token itself, with the
  anotoki sites' shared library - the IAM's signature, issuer, audience and
  expiry - and keeps a small record of each person: the name and when they first
  came (the address is the IAM's; the site keeps none). How they like the sites
  to look is their anotoki account's, which the pages read and save through the
  IAM. Roles are granted in the IAM's admin console: **EDITOR** changes game
  content, **ADMIN** also the site's settings, migrations, backups, the error
  and audit logs, feedback, the file explorer and the people the site keeps a
  record of. A role taken away stops working here within ten minutes.
- **Languages**: the site's own words go through translation keys; names from
  the game stay as they are. The English and Slovak strings, and the guides'
  pages, live in the site's half of the database. How they are kept, sent and
  edited is the anotoki sites' shared library's (`anotoki-lib`'s translations,
  as on every anotoki site): an EDITOR rewords a string, adds or hides a
  language on the admin panel's Translations and Languages pages, and rewrites
  a guide on its Guides page. A new key comes only with a migration.
- **Site settings** (the anotoki library's since 0.11.0 - this site's own were
  the model for every site's): an admin can close the site for maintenance,
  show an announcement, and decide per page who sees it (everyone, signed in,
  editors, admins) or switch it off. The site hides what is closed, and the API
  refuses it too - everything during maintenance, and a page's data once its API
  paths are named. `/staff` is the way back in while the site is closed.
- **Migrations are the schema**: SQL files in `backend/migrations/` (and the
  shared library's own, around them), applied in order - by `php migration.php`
  here, and from the admin panel's Migrations page on the hosting; both back the
  database up first.
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

The hosting has FTP and nothing else - no shell, no cron. A release is
`frontend/` and `backend/`, built and put up by the anotoki library's
anotoki-deploy (`bun run anotoki-deploy build` in `frontend/`), never carrying any
configuration or secret, and replaced whole on the host; `assets/` is uploaded
on its own. The first install runs through `setup.php` in the browser, proved by
a token only FTP can read; it writes the settings, then locks and deletes
itself. Later schema changes are applied from the admin panel's Migrations page,
which backs the database up first - until they are, the site tells everybody but
its ADMIN that it is being updated.
The IAM has to be installed first. The upload map and every step:
[DEV.md](DEV.md) ("Deploying to the hosting").

## Hosting checklist

What the host and Cloudflare need for this site - check it before the first upload and after any change of
hosting:

- **PHP 8.2 or newer** with `pdo_pgsql`, `mbstring`, `openssl`, `json` and `zlib` (the backups); `curl` or `allow_url_fopen` to ask the IAM; `imagick` for converting pictures in the admin panel (optional); `upload_max_filesize` and `post_max_size` of 50M or more (the file explorer takes files up to 50 MB). `tools/host-check.php` checks all of it on the host: write a long
  random value into its `HOST_CHECK_TOKEN`, upload it beside `index.html`, open
  `https://<the site>/host-check.php?token=<that value>`, and delete it afterwards (the page has a button for
  it). It is never part of a build.
- **Cloudflare** (the zone's settings, the same for every anotoki site):
  - SSL/TLS **Full (strict)**: the connection from Cloudflare to the host is https - the site's secure cookies
    need it end to end (the host check says which it is).
  - Network -> **Pseudo IPv4 not "Overwrite headers"**: that setting would put a made-up IPv4 address into
    `CF-Connecting-IP` for IPv6 visitors.
  - The site believes the visitor's address in `CF-Connecting-IP` only on a connection from Cloudflare's
    published ranges (the anotoki library's list), and counts every limit by it.
  - Rules -> Transform Rules -> **Modify Request Header**: "Set static" `X-Anotoki-Origin` to the origin
    secret, for every request of the zone - and the same value in `backend/config/cloudflare.local.php`
    (`return ['origin_secret' => '...'];`, put there by hand; a long random value, 32+ characters). With it the
    site believes `CF-Connecting-IP` only on a request that carries the secret - anybody's Cloudflare Worker
    can connect from Cloudflare's ranges; without the file it believes `CF-Connecting-IP` from Cloudflare's
    ranges alone - deleting it is the one way to switch the secret off; with one it cannot read cleanly (a
    byte-order mark, a line before `<?php`) or that names no usable secret (blank, a misspelt key) it believes
    it from nobody - every visitor counts as their edge until the file is mended. Set the rule first, then the
    file, saved as UTF-8 without a BOM and starting with `<?php` - every `config/*.local.php` likewise.
- **The site's address** for robots.txt and sitemap.xml needs no file: a release names `https://genshin.anotoki.eu`,
  where the deploy tool puts it (`backend/config/app.php`; a checkout names `http://localhost:4200`). A host served
  at another address names it in `backend/config/app.local.php` - `<?php return ['url' => 'https://...'];` - by
  hand (setup.php never writes it; the one it wrote between 2026-09-29 and 2026-10-05 names
  `https://genshin.anotoki.eu`); one the site cannot read cleanly is passed over, said once in the PHP log.
- **After an upload**: the private folders (`storage/`, `config/`) answer 403 in a browser; the host check's
  "Who connects" says Cloudflare, not a proxy of the host's (behind one, every visitor would share one
  address); pending database updates are applied on the admin panel's Migrations page.

## Project layout

```text
backend/
  api/                  index.php (the Slim app); routes/genshin_impact/ and routes/users/, each with
                        endpoints/, models/ and responses/; meddleware/ (sign-in and roles, the
                        sign-in gate, validation); the query builder, the asset code; admin_tools.php and
                        audit_log.php (the shared library's sign-in, people and admin tools, set up for
                        this site); migration_runner.php and site_state.php (the migrations, where the
                        site stands and its site settings - maintenance, the announcement, Page access -
                        on the shared library); translations.php and guides.php
                        (the words, on the shared library; the guides' pages); quiz_levels.php (the
                        quizzes' levels the admin panel saves, and their rules)
  config/               one module per concern; *.local.php per installation (written by setup.php)
  migrations/           users/ and genshin_impact/ - the one database's schema, as SQL files applied in order
                        (the shared library's own sets around them, from vendor/)
  vendor/               committed: the hosting has no Composer (anotoki/lib, the anotoki sites' library, too)
  tests/                php tests/run.php - the upload rules; the game catalog and its ids, the words'
                        migration and routes, the quizzes' levels, the character page's answer, the library's data moves and admin tools, what a silent
                        sign-in brings in, every settings file read cleanly, migration.php (on throwaway
                        databases)
  setup.php, router.php, migration.php, db-dump.php, db-push.php, assets.php,
  merge-databases.php   (once, for a checkout from when the site had two databases),
  game-ids.php          (once: the game's own ids for the rows, by name - migration genshin_impact/031)
frontend/
  src/app/sites/main/   the public site: database, quizzes, daily, games, profile; legal/ (Terms, Privacy and
                        Contact: their frame and this site's facts)
  src/app/sites/admin/  the admin panel
  src/app/shared/       local-lib (what the family's UI kit has no piece for, the admin forms' checks, abstract bases),
                        site-auth.ts (the shared library's
                        sign-in, set up for this site), site-feedback.ts (its feedback form), site-legal.ts (its
                        legal pages), site-status.ts (its gate and Migrations page), site-translations.ts (its
                        words)
  src/app/api/          the API client, generated from the backend (npm run api)
  public/               config.json (where the API is), changelog.json
docs/                   generated reports: reference/, performance/, security/; PG-DUMP-INSTALL.md (pg_dump
                        on the hosting, for backups); images/ (the anotoki logos)
.claude/                project skills and agents for AI-assisted work
tools/                  host-check.php - what a host's PHP has and lacks (never part of a build)
.gitignore, CLAUDE.md, README.md, DEV.md, and the anotoki family's formatting setup - package.json and
bun.lock (Prettier alone: bun run format:check), .prettierrc.json, .prettierignore, .editorconfig - and
nothing else committed at the root (in development the untracked assets/ tree sits there too)
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
  migrations, configuration, the frontend's signals, the family's UI kit and
  local-lib, i18n and theming.
- Project skills (`.claude/skills/`): `sync-api-client`, `scaffold-entity`,
  `db-migration`, `deploy`, `refresh-docs`. Project agents (`.claude/agents/`):
  `backend-engineer`, `frontend-engineer`, `code-reviewer`.

## Current state

- Version 1.4.1 (the changelog has what each version brought). Since 1.1.0 a
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
- Since 2026-10-11 the site's words are the shared library's too - `anotoki-lib`
  0.3.0's translations, the one every anotoki site uses: the words' API
  (`/api/translations/{code}`, `/api/admin/translations`, `/api/admin/languages`),
  the admin Translations and Languages pages and `translations.php` are the
  library's, behind this site's own checks (EDITOR or ADMIN). Migration
  `users/050` moves the words into the library's shape - a language is known by
  its code, a key has no scope and a string no stamps but its last change, blank
  strings go, and the guides' pages move to `guide_contents`, read at
  `/api/guides/{guide}` and rewritten on the admin panel's new Guides page - and
  keeps full copies of the old tables for one release. At the owner's word, a key
  comes only with a migration: the admin panel's "new key", the import's and the
  command line's ways of making one are gone.
- Since 2026-10-11, too, signing in, the people the site keeps a record of and
  the admin tools are the shared library's - `anotoki-lib` 0.4.1, as on every
  anotoki site. The API checks the IAM's tokens with the library (its copy of the
  IAM's PHP SDK is gone) and keeps no address any more: migration `users/052`
  drops it - the IAM has it, and `/api/me` answers the token's. The admin panel's
  error log, audit log, feedback, backups and file explorer are the library's,
  and its new People page lists the people the site keeps a record of and can
  delete a person's games; whoever's anotoki account is deleted is anonymized
  here too, by itself - all for the ADMIN alone (an EDITOR no longer sees
  feedback or the audit log, nor their counts on the dashboard). Migrations
  `genshin_impact/028` and `029` move the audit log and the feedback into the
  library's tables, every row under its number - the feedback without the IP
  address it came from and its hash of the sender - and keep the old tables
  until a later release; `users/053` takes away the old feedback form's and
  sign-in page's words. The error log writes what the anotoki sites' does
  (every 5xx, and 404, 405, 413, 415, 429 - no longer every answer of 400 and
  up); the pages' own errors join it with the library's next release. Backups
  no longer need `pg_dump`, so they work on the hosting too, with no maximum
  age: one a day, and one before every
  update. The site's own backups and error logs from before stay on disk where
  they are, untouched, until the owner removes them. In the pages, signing in is
  the library's too (the copy of the IAM's browser SDK is gone; the same storage
  keys, so nobody was signed out): somebody signed in at the IAM - on its own
  pages or another anotoki site - is signed in here without a click (the IAM's
  sign-in hint), signed out there is signed out here at the next page load, and
  a sign-in that did not work is explained on the library's screen at
  `/auth/callback` (`robots.txt` keeps crawlers off `/auth/`). What a browser
  played without signing in comes into the account at such a sign-in without
  a click only when the account has nothing here yet; an account with games of
  its own here takes nothing in, and those games stay that browser's until
  the person signs in there themselves (the owner's decision of 2026-10-11;
  `POST /api/visitor/move` and `/api/quiz/progress/carry` with `silent`). The admin panel's
  Feedback, Audit Logs, Error Log, Files Explorer and Backups are the library's
  pages at their old addresses, with the new `/admin/people` - for the ADMIN
  alone, the messages nobody has opened counted beside Feedback - and the
  footer's feedback form is the library's, loaded when it is opened. The first
  load grows from 125.8 to 138.4 kB (transfer): the library's sign-in, with its
  two screens, in place of the site's own.
- Since 2026-10-12 the shared library is `anotoki-lib` 0.5.0. The site keeps no
  address of anybody's (the owner's rule): a request's address is
  `CF-Connecting-IP` when it comes through Cloudflare - whose published ranges
  are now committed - and the connection's own otherwise, one rule for the
  site's limits and the library's, and what is kept of one is a keyed hash
  (migration `users/054` for the count of new visitors; the old error log
  files' addresses are hashed once). The pages' own errors reach the admin
  panel's Error log, scrubbed. A restore of a backup no longer brings back a
  person's games or a message deleted after the backup was made, and backups
  are sealed - only one made here is restored here, a plain one from before
  0.5.0 offline. The People page's Delete takes the reply address and browser
  off the person's messages too, and the file explorer's previews are signed
  under the site's own secret. The sign-in screens load as they are shown: the
  first load is 140.3 kB (transfer), 578.8 kB in all (it was 139.5 and 585.0),
  the browser's error reporter in it.
- Since 2026-10-13 the library's PHP half is 0.5.2 (the Angular half stays
  0.5.0): given the secret the owner's Cloudflare zone adds to every request
  (`backend/config/cloudflare.local.php`, the Hosting checklist above - the
  owner's decision of 2026-10-13), the site believes `CF-Connecting-IP` only
  on a request that carries it: anybody's Cloudflare Worker can connect from
  Cloudflare's ranges, and any other request from them counts as the edge it
  came from. Nothing a player notices; no migration.
- Since 2026-10-18 the shared library is `anotoki-lib` 0.6.2 in both halves.
  The site has **Terms, Privacy and Contact** - the anotoki sites' shared pages
  (`/terms`, `/privacy`, `/contact`) with this site's own facts, each true of
  the code: the record of a person, their games, who changed what, the limits'
  counts, the old tables kept from the move into the library's, what a visitor
  without an account leaves, the feedback form, the logs, the plain backups and
  every item kept in a browser, by name; the hosting company, WebSupport
  s.r.o., and Cloudflare in front. Anybody may read them - signed in or not, while
  the IAM requires signing in, while the site is closed - and Contact opens
  the feedback form (which sends while the site is open - while the IAM
  requires signing in, for people signed in). Under every page: Terms ·
  Privacy · Contact and the fan
  clause (migration `users/055`; `users/056` drops four words nothing reads).
  Every `config/*.local.php` is read cleanly or not at all: one saved with a
  byte-order mark or a line before its `<?php` is never compiled (before, with
  `declare(strict_types=1)` after it, every request was a 500) and never
  printed; a required one leaves the site not set up, an unreadable
  `cloudflare.local.php` fails closed, an unreadable `visitors.local.php`
  trusts no proxy. The first load is 587.1 kB, 144.1 kB sent (it was 578.8 and
  140.3): the library's footer links and its 0.6 pieces.
- Later on 2026-10-18 the shared library is `anotoki-lib` 0.6.3 in both halves.
  The admin panel has the anotoki family's footer under its pages - the build
  analyzer's, the owner's choice for every admin panel: "Version 1.2.0 · What's
  new · Feedback" (What's new the site's own note; Feedback not offered while an
  update waits, when the server would refuse it), Terms · Privacy · Contact and
  the fan clause. The public site keeps its own footer, which the owner wants
  different. The status page - an update waiting, the database out of reach, not
  set up - stands alone, with no header, navigation or footer round it, as it
  did; the screenshot run holds it now, and the frame coming back with the site.
  A `cloudflare.local.php` that is there but names no usable secret (blank, no
  array, a misspelt or another key, a value that is not a string) or a folder in
  its place fails closed, as an unreadable one does - the owner's "do as you
  think is the best" of 2026-10-18: only deleting the file switches the secret
  off. The library's `anotoki_translations/012` brings the footer's four words.
  The first load is 541.9 kB, 142.2 kB sent (it was 537.6 and 140.3): Angular's
  own code for the binding the footer opens its feedback form with.
- Later still on 2026-10-18 the shared library is `anotoki-lib` 0.7.0 in both
  halves: its folders are named as in every anotoki project - its PHP half's
  files are under `backend/vendor/anotoki/lib/backend/` now, no longer `php/`.
  Nothing a player notices, nothing to apply; the first load is as it was.
- On 2026-10-19 the shared library is `anotoki-lib` 0.7.2 in both halves: the
  admin panel's footer writes the version short ("v1.2.0"), the library's
  feedback form says itself whom its message is for, and while the site's
  words have not come the library's own are in the reader's language (the
  status page's too). Nothing to apply.
- Later on 2026-10-19 the shared library is `anotoki-lib` 0.8.0 in both halves:
  the anotoki family's **About** and **Support** pages (`/about`, `/support`),
  anybody's as the legal pages are, linked first in both footers - About ·
  Support · Terms · Privacy · Contact. The library's `anotoki_translations/013`
  brings their words.
- Since 2026-10-20 the owner's other site, the build analyzer
  (builder.anotoki.eu), takes its game catalog from this one, at the owner's
  word: every character, weapon and artifact set carries the game's own id
  (migration `genshin_impact/030`; `031` fills it by name - every Aether row
  10000005, every Lumine row 10000007 - made by `backend/game-ids.php`), and
  `GET /api/catalog/characters`, `/weapons` and `/artifacts` answer the live
  rows, public and read-only, under the site's switches like every route (DEV.md,
  *The game catalog*). The admin panel's base-info tabs take a **Game ID**, and
  the owner's importer sends it from now on. Players notice nothing; the
  version stays 1.2.0.
- Since 2026-10-21, at the owner's word, the top bar's items open and close
  their sections: on a section's own page (`/quizzes`, `/daily`) its item leads
  back to the home page, inside it (`/quizzes/pixelate`) to the section's page,
  from anywhere else into the section - the link's address says which - and
  the open section's item is marked (`aria-current`). And the quizzes' levels -
  what each level of each quiz shows, try by try - are data: an ADMIN or an
  EDITOR changes them on the admin panel's new **Quiz levels** page, as JSON the
  server holds to its rules (the six quizzes, three levels each, five tries
  every level, each wrong guess showing more), and "Back to the defaults"
  returns to the built-in ones; both are in the audit log. The pages read the
  levels in force at `GET /api/quiz/levels` and play the built-in ones while
  nothing is saved and whenever that answer fails; the daily plays Easy, level
  1 of them. The difficulty dialog's numbers follow the levels (Voice's seconds
  too, migration `users/061`, which also makes the table, and general words for
  a Voice level with fewer pieces of the recording than its sentence names); the
  words no number can follow - the pictures' steps, Voice's, Mismatch's card and
  guide - the Quiz levels page says to reword when a level leaves them behind
  (DEV.md, *Quiz levels*).
- Since 2026-10-22, at the owner's word, the account panel chooses the
  appearance and the language only: the dates and the clock are chosen on the
  IAM's account page, and the site still writes every date by them. Migration
  `users/064` takes the panel's date and clock words away. In Minesweeper the
  dangerous reaction reads in both themes - each element a chip in its tiles'
  colour -, only a tile a press acts on shows the pointer, and the dark board
  tells its tiles apart at a glance: those a press acts on, those it cannot
  reach yet (dark, ringed) and those revealed. Version 1.4.1.
- Since 2026-10-24, at the owner's word, this admin panel's frame is the anotoki
  family's, in every anotoki admin panel alike (anotoki-lib 0.10.0,
  `<anotoki-admin-frame>`): the pages in a column on the left as before, and at
  its top who is signed in, "Back to the site", Sign out and the theme - now
  light, dark or as the device is set, the account's, as the Account window
  chooses it.
- Since 2026-10-25, at the owner's word ("I would like the projects to use the
  library primarily"), this site's settings are the anotoki library's
  (anotoki-lib 0.11.0) - its own were the model the library's were made from,
  and every anotoki site has them now: Getting in (the site closed for
  maintenance to all but its ADMIN, with what the maintenance page says),
  the Announcement and Page access, on the library's Site settings page
  (`/admin/site-settings`), behind the library's gates (the SiteGate's closed
  sign, 423 `page_locked` for a page's refused API paths) and on its pages (the
  bar, the guard, the administrators' notice, the closed sign with Sign in at
  `/staff`). `users/066` moved every switch and page across and dropped the
  old tables. Every admin menu has one shape: the site's own pages, then
  Localization, then System - the site's own system pages before the family's,
  Site settings, People, Feedback, Error log, Audit log, Backups, Migrations.
  And robots.txt and sitemap.xml are answered by the PHP (the library's Robots):
  robots kept out of the admin panel, the API, the sign-in's way back and
  `/staff`, and every public page and every character, weapon and material's
  page listed at the site's own address (a release's `https://genshin.anotoki.eu`,
  with no file to upload), without what Page access hides
  - the static `frontend/public/robots.txt` is gone. And no leftover tables:
  `users/067` and `genshin_impact/033` drop the old copies kept when the
  words, the audit log and feedback moved into the library's tables, and the
  Privacy page no longer names them.

## More

- Setting it up, running, checking, building and deploying:
  [DEV.md](DEV.md).
- The rules for changing the code: [CLAUDE.md](CLAUDE.md).
- Signing in through the anotoki IAM: the IAM repository (`../anotoki-iam`), its
  `docs/integrating-an-app.md`.
