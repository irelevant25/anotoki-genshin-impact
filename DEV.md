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
run on two ports, and `ng serve`'s proxy makes them one origin to the browser; in
production they are served from one origin. Signing in is
not this site's: it goes through the **anotoki IAM** (`../anotoki-iam`), which
has to be running for anybody to sign in locally.

| Development | Frontend | Backend |
| --- | --- | --- |
| this site | `http://localhost:4200` | `http://localhost:8000` |
| the IAM | `http://localhost:4300` | `http://localhost:8100` |

The **frontend's API client is generated from the backend** - see
[The code-generation pipeline](#the-code-generation-pipeline) before changing an
endpoint.

> The pre-rewrite Vue codebase (`old/`) is no longer in the tree; git history keeps it.
>
> The repository root holds `.claude/`, `.gitignore`, `CLAUDE.md`, `README.md`,
> `DEV.md`, `backend/`, `frontend/` and `docs/` - nothing else is committed there,
> like every anotoki project. In development the untracked asset tree, `assets/`
> (2.7 GB, never committed), sits there too: the backend files uploads into it and
> `ng serve` serves it. The logos are in `docs/images/`, the guide to pg_dump on the
> hosting is `docs/PG-DUMP-INSTALL.md`; the site's own favicon is
> `frontend/public/favicon.png`.

---

## Prerequisites

| Tool         | Version      | Notes                                             |
| ------------ | ------------ | ------------------------------------------------- |
| PHP          | 8.2+         | with `pdo_pgsql`; `curl` or `allow_url_fopen` for the IAM's keys and its sign-in switch |
| PostgreSQL   | 14+          | one database, `anotoki_genshin` (the installer creates it) |
| Node.js      | 22           | for `ng` and the scripts (`engines` in `package.json` names 22.15.0; nothing checks it) |
| Bun          | any recent   | `npm start` installs the frontend's packages with `bun ci`, from `bun.lock` |
| Composer     | any recent   | `backend/vendor/` is committed, so only needed to change PHP dependencies |
| The anotoki IAM | -         | `../anotoki-iam`, set up by its own DEV.md |

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
live in the IAM. Set it up first, by `../anotoki-iam/DEV.md`: its API on
`:8100`, its pages on `:4300`. It registers this site's development address
(`http://localhost:4200/auth/callback`) by default; `php clients.php --dev` in its
`backend/` puts that back if it was changed. The accounts this site used to
hold were brought over by its `import-legacy.php`; sign in with one holding the
`genshin` ADMIN or EDITOR role (granted in the IAM's admin console).

### 2. The backend - run `setup.php`

```bash
cd backend
composer start          # php -S localhost:8000 router.php
```

then open **<http://localhost:8000/setup.php>**. Until it has run, the API
answers every request `503 {"code": "not_set_up"}` and the site shows a "not set
up yet" page pointing here - nothing committed stands in for the configuration.

The installer starts from the development values - PostgreSQL on
`127.0.0.1:5432` as `postgres`, the database `anotoki_genshin`, the
IAM at `http://localhost:4300` with the client id `genshin` - and asks for nothing
else: the database and the IAM, plus the setup token on a host. This site's address
is not asked for (`http://localhost:4200` here; on a host, the address the page was
opened at). Fill in the database password, press **Test connection**
under the database and under the IAM to see that both answer, then **Save**. It
creates the database if it is missing, applies every migration - `migrations/users/`
then `migrations/genshin_impact/`, the site's half and the game content - and writes:

| File (in `backend/config/`, all gitignored) | What |
| --- | --- |
| `database.local.php` | the PostgreSQL connection and the database's name |
| `secret.local.php` | the site secret, generated once and never replaced (an old `jwt.local.php` is read in its place, and carried over) |
| `iam.local.php` | the IAM's address and this site's client id there |

An `app.local.php` from an older checkout (this site's address, from when the
API answered the dev frontend cross-origin) is no longer read; delete it if you
like.

The **Test connection** answers are the family's, word for word the same on every
anotoki setup page. The database's:

- `Connected to the database "anotoki_genshin": it is empty - Save makes the tables.`
  (or `N update(s) to apply - Save applies them.`, or `it is up to date.`)
- `Connected to the server. The database "anotoki_genshin" does not exist yet - Save creates it.`
- `Connected to the server, but there is no database "..." and this user may not create one. Make it in the hosting panel first.`
- `The server is there, but "<user>" cannot open the database "...": <reason>`
- `Cannot connect: <reason>`

The IAM's: `Found the IAM at <address> with N signing keys.`, then whether it knows
the client `genshin` with this site's `/auth/callback` (or `No answer from ...`,
`That address answers, but not like an IAM ...`, `The IAM there calls itself ...`).

On this computer - the built-in server, a localhost address - `setup.php` needs no
token and stays put: open it again whenever a setting changes. It shows what is
saved, never shows a secret back, and a blank password keeps the saved one. On
the hosting it behaves differently; see [Deploying](#deploying-to-the-hosting).

### 3. The frontend

In a second terminal:

```bash
cd frontend
npm start          # bun ci && ng serve --port 4200 --proxy-config proxy.conf.json
```

`npm start` installs the packages with `bun ci` (exactly what `bun.lock` names),
then runs `ng serve` on `http://localhost:4200` with `proxy.conf.json`, which hands
`/api`, `/.well-known` and `/setup.php` to the PHP server on `:8000`. The dev app
reads `frontend/public/config.json`, whose API URL is empty - so it calls its own
origin, exactly as in production, and the API needs no CORS. It does not
regenerate the API client: run `npm run api` yourself after changing the API (see
[The code-generation pipeline](#the-code-generation-pipeline)).

Open `http://localhost:4200`, and the admin panel at `http://localhost:4200/admin`.
"Sign in" goes to the IAM on `:4300` and comes back signed in.

---

## Day to day

Two servers of this site, plus the IAM's two when you need to sign in:

| | Command (from its folder) | URL |
| --- | --- | --- |
| API | `composer start` (in `backend/`: `php -S localhost:8000 router.php`) | `http://localhost:8000` |
| App | `npm start` (in `frontend/`) | `http://localhost:4200` |

The router script matters. Without it `php -S` decides whether a request is for a
file by looking for a dot in the last path segment, so any URL that ends in one -
`PUT /api/translation-keys/guide.banners.content`, and every other translation
key - is answered 404 without the API being reached. Apache has no such rule, so
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

Nothing runs this for you - `npm start` does not. None of it needs a database or the
`*.local.php` files - the spec is read from the route table and the migrations as
text. When the generator names something awkwardly, the fix is in
`frontend/api-config.mjs` (service groups, method names, query/response types),
then re-run `npm run api:client`. A route behind `requireOwner()` (a player's
own games and statistics) comes out with a trailing `context?: HttpContext`
parameter: the page says whom the request is issued as - the signed-in person
or this browser's visitor.

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

A `users/` migration never names a `genshin_impact/` table: on a fresh install
every `users/` file runs before `genshin_impact/001` makes the content and quiz
tables. A change to both halves is one file in each folder.

**Waiting to be applied (written 2026-10-05)** - in this order, after the IAM's
migration 010 and its public answer about this site (`GET
/api/public/applications/genshin`) are live, and after `php db-dump.php`:
`users/044` (the sign-in card's words - `php migration.php --status` says
whether it already ran), `users/045_visitors.sql`, `users/046_visitor_strings.sql`
and `genshin_impact/027_visitor_history_index.sql` - `php migration.php` applies
them in that order. 045 is the database part of visitor accounts (playing without
signing in, kept on the server): the sequence `visitor_ids` (-1, -2, ...), the
columns `users.visitor_key_hash` and `users.last_seen_at` (null for every
person), the check `users_kind_check` (a negative id is a visitor's, with a key's
hash; a positive one never has one; 0 is nobody's), two indexes and the table
`visitor_starts` (new visitors per address, kept an hour). It changes no row,
and refuses to run - saying why - while a `users` row has an id of 0 or below.
027 is an index on the quiz history by player, for the Profile page and the
visitors' limits, sweep and move. With 045 applied the API keeps a visitor's
games and statistics (`/api/settings/public` says `visitors.available: true`);
pending, it says false and every visitor path answers 503
`visitors_unavailable` - people's requests work either way, and the pages
keep a signed-out player's games in the browser as before. Applied, the pages
use it (see *Checking your work*). 046 is what a visitor is told (the keys
`visitor.*`, English and informal Slovak, never over a string reworded in the
admin panel): until it runs, the notice and the messages show their keys.

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

**The IAM's "Sign-in required" switch.** Turn it on for `genshin` in the local
IAM's admin console (Applications → genshin → Settings) and, within a minute,
`curl http://localhost:8000/api/characters` answers 401 `sign_in_required`
while `/api/settings/public` says `"login_required": true` and still answers,
with `/api/languages` and `/api/translations/en`. In a private window the site
now goes straight to the IAM's sign-in and comes back to the page opened, signed
in; where that cannot happen by itself (the IAM refused the sign-in, the browser
would not start it, the API refuses the tokens the IAM issues) it draws "Sign in
to continue" instead of itself, with Sign in and Create account, and never
starts another sign-in on its own. Maintenance mode still shows the closed sign
first. Turn the switch off again. Deleting
`backend/storage/cache/anotoki-iam-application-*.json` skips the minute. A local
IAM that does not serve `GET /api/public/applications/genshin` yet answers 404,
which reads as **required** - the site then sends everybody signed out to sign
in. The card's words are migration `users/044`: a database without it shows the
keys (`site.signInRequired.title`) - apply it (`php migration.php`).
Never point a check at somebody else's IAM: a stand-in IAM on a spare port and
a scratch copy of `backend/` with its own `config/*.local.php` and a throwaway
database is how a script tries the switch without touching your own setup.

**Visitors (playing without signing in).** With `users/045` applied and the
switch off, a played save by nobody makes a visitor and hands its key back in
a header:

```bash
curl -si -X PUT http://localhost:8000/api/quiz/progress/banners \
  -H 'Content-Type: application/json' \
  -d '{"state": {"tries": ["Amber"], "isQuestionComplete": false}}'
# 200, X-Visitor-Key: <43 characters>, Cache-Control: private, no-store
curl -s http://localhost:8000/api/quiz/progress -H 'X-Visitor-Key: <that key>'
```

A save of a fresh draw (`"tries": []`, not finished) is refused (422) and
makes nobody; nobody's reads answer `[]`; a wrong key is 401 `visitor_unknown`;
a `Bearer` header with a bad token is 401 `invalid_token` even beside a good
key; with the switch on, every key is 401 `sign_in_required`. The limits are
`config/visitors.php`'s (10 new visitors an hour per address, 60 in all, 1000
at once, 5000 results and 16 KiB a game each, kept 30 days) - an optional
`config/visitors.local.php` changes them for a try (`['visitors' =>
['new_per_hour_per_address' => 1]]`; delete it after). Visitors' rows are
`users` rows with negative ids; `backend/storage/visitors-swept` is when the
sweep of the long-unseen last ran (delete it to have the next request sweep).

The move at sign-in takes both - a person's token (the IAM account page's
"Tokens for scripts" gives one) and the key:

```bash
curl -si -X POST http://localhost:8000/api/visitor/move \
  -H 'Authorization: Bearer <token>' -H 'X-Visitor-Key: <that key>' \
  -H 'Content-Type: application/json' -d '{}'
# 200 {"found": true, "games": {"moved": 1, "kept": 0, "stale": 0}, "results": 0}
```

The person's own game stays where both have one for a quiz; the visitor's
log rows move and its totals are added to the person's; the key is 401
`visitor_unknown` from then on, and the same move again answers
`{"found": false, ...}`. It works with the switch on too. No key, or not a key:
422. Another request holding the rows longer than `move_lock_timeout_ms`
(5000; `visitors.local.php` can make it shorter for a try): 503
`visitor_move_retry` with `Retry-After: 2`, nothing moved.

In a browser (a private window, signed out, 045 applied): opening a quiz
makes nobody - its fresh question stays in the browser; the first guess makes
the visitor (localStorage `genshin-visitor` holds its key, `app_data` no
longer holds the quiz games - they went to the server with it), and the
Profile shows that browser's figures. Signing in from there moves them into
the account (the Network tab shows one `POST /api/visitor/move` with both the
token and the key, before the person's games are read); the key is gone
afterwards. A person's requests never carry `X-Visitor-Key` - but the move's -
and a visitor's never carry a token. With the switch on, the key stays in the
browser unsent until the next sign-in. Whom a request is for is decided by the
page (`issuedAs()`), and a person's request with no token is never sent: to
see it, let the token run out with the IAM stopped - the next guess sends
nothing.

What the visitor is told (046 applied): the Profile always shows a notice -
"kept for this browser for 30 days after your last visit", the number being
the server's `keep_days` - with a Sign in button; the quizzes hub and the Daily
page show it once the browser holds a key. After a sign-in that brought
anything along, one toast says so (and that the account's own game of a quiz
stayed, where it had one). Other toasts, once each: the key no longer known
(delete the visitor the way the sweep does - its rows in `quizzes_states`,
`user_quiz_history` and `quiz_stats_history`, then its `users` row - and
reload; the quiz tables have no foreign key to `users`, so a `users` row
deleted alone leaves rows that no sweep finds and the dashboard still counts),
the results cap reached (`visitors.local.php`: `max_results => 2`, then finish
three questions), the site full of visitors (`max_visitors => 0`: the game stays in the browser).
With the switch on and a key held, the sign-in card adds that the games come
along. The admin dashboard's *visitors* card counts them against
`max_visitors`, and asks to be looked at near the ceiling.

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
switches - in its admin console, for every site at once. So is **Sign-in
required** for this site (Applications → genshin → Settings; off by default):
while it is on, the API answers 401 `sign_in_required` to everybody not signed
in, but for the public settings, the languages, the strings and the asset
previews (`/api/files/raw`, which an `<img>` loads without a token;
`api/meddleware/sign_in.php`), and the pages send everybody signed out to the
IAM first, or draw "Sign in to continue" instead of the site. Maintenance still
comes first: a closed site answers 503, and shows its closed sign, before anybody
is asked to sign in. The IAM also decides who may
sign in: every account holds `MEMBER`, and taking it away blocks that person
from signing in here - not from reading the site, or playing as a visitor,
while sign-in is not required.

The same switch decides **visitors**: while sign-in is not required, somebody
playing without signing in has their games and statistics kept on the server
(once `users/045` is applied); switching it on stops every visitor at once -
their keys stay in their browsers unsent, and their data waits for the sweep
(30 days unseen) or for a sign-in in that browser, which moves it into the
account. The limits (how many visitors at once, how many new ones an hour,
results per visitor, the days kept) are `config/visitors.php`'s, changed in an
optional `config/visitors.local.php`; the dashboard's *visitors* card shows how
full it is.

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
  the way in; this is about what arrived before that, or was put on disk by
  hand. `missing` is a job (a source with no converted
  file beside it; **Convert** works through them in batches, a request each, with
  the queue in `storage/cache/asset-convert-queue.json`); `converted only` is not.

Pairing is by normalised name, not exact stem - the tree holds both
`Adventurer's Bandana.avif` and `ADVENTURERS_BANDANA.png` for one picture.

AVIF needs the `imagick` or `gd` extension. Opus needs `ffmpeg` on `PATH` - it is
looked for there and nowhere else. What cannot be encoded is counted and said so
on the page.

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
#   config/ (minus every *.local.php), vendor/, migrations/, and hardened
#   public/uploads/ + storage/. Dev tooling, secrets and composer.* stay behind.
```

---

## Deploying to the hosting

The hosting is **FTP-only - no shell, no cron**, which shapes everything below:
`vendor/` ships in the build, the first install runs from a web page, and schema
changes apply from the admin panel.

**The IAM goes first** whenever it gains something this site reads. This site
asks the IAM whether sign-in is required here
(`GET https://iam.anotoki.eu/api/public/applications/genshin`), and an IAM that
does not answer that yet says 404 - which this site reads as "sign-in required"
and sends everybody signed out to sign in. Before uploading a build that reads the
switch, check that address answers 200 with `"login_required": false`.

### The upload map

All into `public_html/`:

```
frontend/dist/angular/browser/*   →  public_html/              index.html, JS/CSS, config.json, .htaccess
backend/dist/*                    →  public_html/              api/, config/, vendor/, migrations/, public/, storage/
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
4. Replace the development values with the hosting's - the database connection and
   the IAM (`https://iam.anotoki.eu`, client id `genshin`); that is all it asks. The
   IAM's address must be https there, and never `localhost`. This site's address
   is the one the page was opened at (https, also behind the host's proxy), and the
   IAM test checks its `/auth/callback`. Test both connections, then **Run
   install**: it applies every migration and writes the three config files, plus
   `config/backup.local.php` when it finds the PostgreSQL client tools unpacked
   under `~/pgclient` in the hosting account's home (see
   [`docs/PG-DUMP-INSTALL.md`](docs/PG-DUMP-INSTALL.md)) - nothing to type; the
   closing page says so when there are none.
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

It copies the `users` database's tables and every row into the content database in one
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

**Visitor accounts on the host** (2026-10-05): after the IAM check above, upload
both builds, then Apply pending (`users/044`, `045`, `046`, `genshin_impact/027`
- either order is safe: a build before them is today's site, the migrations
before the build add columns nothing reads yet). Then, once, in a private
window: answer one quiz question - the dashboard's *visitors* card should say
1, which proves the hosting hands `X-Visitor-Key` to PHP (Apache passes `X-*`
headers through as `HTTP_X_VISITOR_KEY`). Behind Cloudflare's proxy, every
request comes from a Cloudflare address, so the per-address limit would count
the whole world as one: upload a `config/visitors.local.php` by FTP listing
Cloudflare's ranges (https://www.cloudflare.com/ips/) -
`['client_address' => ['trusted_proxies' => ['173.245.48.0/20', ...]]]` - and
the visitor's own address is then read from `CF-Connecting-IP`. setup.php never
writes that file, and build-dist leaves every `*.local.php` behind, so it
survives uploads. To stop visitors at once, switch **Sign-in required** on in
the IAM.

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
| API cannot connect to the database | Postgres is not running, or the connection in `setup.php` is wrong - its **Test connection** says which. |
| A new/changed endpoint isn't callable from the frontend | The client is stale - run `npm run api`. |
| Translation-key routes 404 in dev | The PHP server was started without `router.php`. Start it with `composer start` in `backend/`, which runs `php -S localhost:8000 router.php`. |
| Every API call fails in dev (502 or 504 from `ng serve`) | The API is not running on `:8000`, which `proxy.conf.json` hands `/api` to - start it with `composer start` in `backend/`. |
| Admin pages redirect to sign-in | Not signed in at the IAM, or the account holds neither the `genshin` ADMIN nor EDITOR role (grant it in the IAM admin console). |
| Sign-in bounces back with an error | The IAM is not running on 4300/8100, or does not know `http://localhost:4200/auth/callback` - run `php clients.php --dev` in the IAM's `backend/`. `setup.php`'s IAM test checks both. |
| Signed out, the site goes straight to the IAM's sign-in or shows "Sign in to continue" (the API answers 401 `sign_in_required`) | The IAM says sign-in is required for `genshin` - or cannot say: a 404 from `{issuer}/api/public/applications/genshin` (an IAM without that route yet, or one that does not know `genshin`) counts as required, and so does an IAM never reached. `/api/settings/public` shows what the site read (`auth.login_required`); the PHP log says why (`[iam] sign-in required: ...`). |
| Every request answers 401 though signed in | The API cannot fetch the IAM's key set from `http://localhost:4300/.well-known/jwks.json` - the IAM's frontend dev server must be running, it serves the issuer's URLs. |
| A player's games without signing in are gone ("...are no longer kept") | Nobody played in that browser for `keep_days` (30) and the sweep deleted them, or they were moved into an account by a sign-in in that browser - look in the account. A browser that clears its storage loses its key, and with it the games. |
| Signed-out players' games stay in the browser only ("Too many people are playing without signing in") | A visitor limit refused a new one (429 `too_many_visitors`): `max_visitors` reached (the dashboard's *visitors* card), or the per-address / hourly limits - behind Cloudflare without its ranges in `client_address.trusted_proxies`, everybody shares one address. Raise them in `config/visitors.local.php`; existing visitors are not affected. With `users/045` pending the same happens without a message. |
| Backups page: "pg_dump was not found" | The PostgreSQL client tools aren't on PATH. Point at them in `backend/config/backup.local.php`. |
| Locked out of an account (lost password) | Accounts are the IAM's: its dev mail goes to its own `backend/storage/mail/`, and its `reset-password.php` restores access. |

## Handy scripts (from `backend/`)

- `php db-dump.php [--dir=…]` - dump the database (custom format) to a file; prints the `pg_restore` command.
- `php merge-databases.php [--check]` - once, on a checkout still configured with two databases: moves the second into the first.
- `php db-push.php` - copy local data up to another server in one command. ⚠ erases the target (confirmed by typing the host); for seeding a fresh production server.
- `php assets.php --status` - the asset tree against the `files` catalogue and the rows that name it.
- `php translations.php --status` - the translation keys the frontend asks for against the ones the database has (`--add-missing`, `--export`, `--import`).
- `php build-dist.php` - the production backend slice (see above).
