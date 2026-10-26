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
> `DEV.md`, `backend/`, `frontend/`, `docs/`, `tools/` (the host check) and the
> anotoki family's formatting setup - `package.json` and `bun.lock` (Prettier
> alone), `.prettierrc.json`, `.prettierignore` and `.editorconfig` - nothing else
> is committed there, like every anotoki project. In development the untracked asset tree, `assets/`
> (2.7 GB, never committed), sits there too: the backend files uploads into it and
> `ng serve` serves it. The logos are in `docs/images/`, the guide to pg_dump on the
> hosting is `docs/PG-DUMP-INSTALL.md`; the site's own favicon is
> `frontend/public/favicon.png`.

---

## Prerequisites

| Tool         | Version      | Notes                                             |
| ------------ | ------------ | ------------------------------------------------- |
| PHP          | 8.2+         | with `pdo_pgsql`, `mbstring` (the shared library needs it since 0.5.0) and `zlib` (the backups); `curl` or `allow_url_fopen` for the IAM's keys and its sign-in switch |
| PostgreSQL   | 14+          | one database, `anotoki_genshin` (the installer creates it) |
| Node.js      | 22           | for `ng` and the scripts (`engines` in `package.json` names 22.15.0; nothing checks it) |
| Bun          | any recent   | `npm start` installs the frontend's packages with `bun ci`, from `bun.lock` |
| Composer     | any recent   | `backend/vendor/` is committed, so only needed to change PHP dependencies - `anotoki/lib` among them ([The shared library](#the-shared-library-anotoki-lib)) |
| The anotoki IAM | -         | `../anotoki-iam`, set up by its own DEV.md |

Optional, for specific admin features:

- **`pg_dump` / `pg_restore`** - `db-dump.php` and `db-push.php` alone (the
  admin **Backups** page needs neither since anotoki-lib 0.4.1: it backs up by
  COPY through PDO). Found on `PATH` or in the usual PostgreSQL install
  folders; point elsewhere with `backend/config/backup.local.php`.
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
answers every request `503 {"code": "not_set_up"}` and the site shows "This site
is not set up yet" with a link here - nothing committed stands in for the
configuration. (Only until the site has been installed on a host: from then on
it never offers the setup page again, and says "not available right now"
instead.)

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
API answered the dev frontend cross-origin) names the address robots.txt and
sitemap.xml give - `http://localhost:4200`, which a checkout gives without it
(`config/app.php`); delete it if you like.

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
"Sign in" goes to the IAM on `:4300` and comes back signed in. Signed in at the
IAM already (its own pages, or another anotoki site), opening this site signs you
in by itself - the IAM's sign-in hint, a cookie that is host-only `localhost` in
development: open both as `localhost`, never `127.0.0.1`.

---

## Day to day

Two servers of this site, plus the IAM's two when you need to sign in:

| | Command (from its folder) | URL |
| --- | --- | --- |
| API | `composer start` (in `backend/`: `php -S localhost:8000 router.php`) | `http://localhost:8000` |
| App | `npm start` (in `frontend/`) | `http://localhost:4200` |

The router script matters. Without it `php -S` decides whether a request is for a
file by looking for a dot in the last path segment, so any URL that ends in one
is answered 404 without the API being reached (the translation keys' old routes,
`PUT /api/translation-keys/guide.banners.content`, were all such URLs). Apache
has no such rule, so this only bites in development. `router.php` also serves
`/uploads/...` from `public/` and the installer at `/setup.php`.

```bash
# Backend (backend/)
php migration.php --status     # what has run and what is pending
php migration.php --dry-run    # what would apply, applying nothing
php migration.php              # apply what is pending (setup.php does this too)
php migration.php --folder=users  # one migrations folder only
php db-dump.php                # back the database up before risky data work
php assets.php --status        # the asset tree against the catalogue and the rows naming it
php tests/run.php              # the backend's tests (the upload rules) - no database, no server

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

Some prefixes are left out of the client on purpose (`SKIP_PREFIXES` in
`api-config.mjs`): `/api/site-status` and `/api/admin/migrations`, and the words -
`/api/translations`, `/api/admin/translations`, `/api/admin/languages` - are the
shared library's routes, and its Angular half is already their client.

---

## The shared library (anotoki-lib)

The migrations engine, what the site does while it is not set up or waits for a
database update, the site's words (since 0.3.0), and - since 0.4.1 - signing in
(the IAM's tokens and switch, who a request is), the site's record of people
(the People page, the scrub of the accounts the IAM deleted) and the admin tools
(the error log, the audit log, feedback, backups, the file explorer) are the
same on every anotoki site: one library, `anotoki-lib`
(`https://github.com/irelevant25/anotoki-lib`; a clone sits at
`../anotoki-lib`), never edited here. Two halves, one version:

| Half | Here | Installed from |
| --- | --- | --- |
| `anotoki/lib` (PHP) | `backend/vendor/anotoki/lib`, committed with the rest of `vendor/` | the GitHub repository, a VCS entry in `backend/composer.json` (`"anotoki/lib": "^0.11.0"`) |
| `@anotoki/lib` (Angular) | `frontend/node_modules/@anotoki/lib` | the release's tarball, its URL in `frontend/package.json` |

Where the site uses it: `backend/api/migration_runner.php` (the engine, set up
for the two folders with the library's own sets around them - `anotoki_admin`
first, `anotoki_translations` and `anotoki_people` after), `backend/api/site_state.php` (the site's state and the
gate in front of every route, and the site settings - maintenance, the
announcement, Page access - since 0.11.0), `backend/api/index.php` (the status and admin
migrations routes, the admin tools' and the site settings' routes, the gates -
the library's PageAccessGate among them), `backend/api/admin_tools.php`
(signing in, people and the admin tools set up for this site) and
`backend/api/audit_log.php` (the audit log), `backend/api/translations.php` and
`routes/users/endpoints/translations.php` (the words: the library's
`Translations` and its routes, set up for this site), `backend/translations.php`
(its command line), `frontend/src/app/shared/site-status.ts` (the pages'
gate, the "being updated" page, the closed sign with Sign in at `/staff` and the
Migrations page, set up for this site), `frontend/src/app/shared/site-settings.ts`
(the site settings on the pages: the announcement bar, Page access's guard, the
administrators' notice; the admin Site settings page on its lazy route),
`frontend/src/app/shared/site-translations.ts` (the words in the pages: the
language, the `translate` pipe, the admin Translations and Languages pages),
`frontend/src/app/shared/site-auth.ts` (signing in: the IAM from the public
settings, the sign-in hint, the interceptor, the visitor key on a player's own
routes), `frontend/src/app/shared/site-feedback.ts` (the visitors' feedback
form), `frontend/src/app/shared/site-legal.ts` and
`frontend/src/app/sites/main/legal/` (Terms, Privacy and Contact with this
site's facts, since 0.6.0; About and Support on `/about` and `/support` in the
same frame, since 0.8.0), `frontend/src/app/shared/site-admin-tools.ts` (the admin tools,
provided at the app's root) and `frontend/src/app/sites/admin/people.ts` (the
People page, on the admin panel's route) - their pages on lazy routes,
`frontend/src/app/app.config.ts` and `app.component.html` (the pages as the
gate's `<ng-template anotokiSitePages>`), the admin routes `/admin/migrations`,
`/admin/translations` and `/admin/languages` (the pages from their own entry
points), the admin panel's frame (`frontend/src/app/sites/admin/app.component.*`:
the library's `<anotoki-admin-frame>`, 0.10.0, its theme switch reading genshin's
own theme service through `shared/local-lib/theme-toggle/shell-theme.ts`), and the
`--anotoki-*` colours in `design-tokens.scss` (every colour the kit reads, its
controls' edge at 3:1 or more).

**Updating it** - both halves together, to the same version; read the
library's `CHANGELOG.md` first (while it is 0.x a minor version may break). A
release that changes one half only is taken in that half (0.2.0 changed the
Angular half alone; 0.5.1 and 0.5.2 the PHP half alone - a restore's
sequences that count down, then the origin secret): both halves are 0.11.1 now
(never 0.4.0, whose admin Feedback search fails on PHP 8.2). On 0.x a caret
takes no next minor: `^0.10.0` never brings 0.11, which needs its constraint
written. A piece of the library's kit is
imported from its own entry point (`@anotoki/lib/ui/config`, `ui/button`, ...),
never from `@anotoki/lib/ui`, which would pull every piece into the first load.

```bash
cd backend
composer update anotoki/lib --prefer-dist      # a new constraint in composer.json first, when the version needs one
cd ../frontend
# the new release's tarball URL in package.json, then:
bun install                                    # bun.lock, which npm start's bun ci installs from
```

package-lock.json is kept in step by hand: its `@anotoki/lib` entry (the
dependency's address, and `node_modules/@anotoki/lib`'s `version`, `resolved`
and `integrity`) given bun.lock's - never `npm install`, which would rewrite
the whole lock.

Then run the checks below, and ship `vendor/anotoki/lib` with the next upload
(a release carries `vendor/` whole).

---

## Database & migrations

**The migrations are the schema.** There is no separate schema file; a database
is what you get by replaying `backend/migrations/{users,genshin_impact}/NNN_name.sql`
in order, with the anotoki library's own sets around them (in
`vendor/anotoki/lib/backend/migrations/`): `anotoki_admin` first (the admin tools'
tables, `anotoki_audit_log` and `anotoki_feedback`, which `genshin_impact/028`
and `029` move the old rows into), then the two folders, then
`anotoki_translations` (the words' tables proved, the library's own words added)
and `anotoki_people` (the scrub's two tables) - including the rows they insert, so a database built
today has the same languages and translated strings as one built from the same
folders a year from now. A file already recorded in a database's `migrations`
table is never run again, so never edit an applied migration: write the next one.

- Locally: `php migration.php` (or `setup.php`) applies everything pending.
- On the hosting, with no shell: FTP the new `.sql` up, then the admin
  **Migrations** page → **Apply pending** (`POST /api/admin/migrations/apply`,
  ADMIN only).

The engine behind the CLI, that button, `setup.php` and `merge-databases.php` is
the shared library's `Migrator`, set up for this site in one file,
`backend/api/migration_runner.php` (`siteMigrator()`: the library's
`anotoki_admin`, `users/`, `genshin_impact/`, the library's `anotoki_translations`
and `anotoki_people`, the record by folder (set) and file, this site's advisory
lock, the adoption of a record table from when each folder had a database of its
own, and the refusal to run the sets out of order - but `anotoki_admin`, which a
database installed before 0.4 meets last) - so a database built any of those
ways is the same database. Each file runs whole or not at all with its record,
the run stops at the first that fails, and one apply runs at a time: a second -
the button pressed twice, the CLI beside it - is told it is busy and does
nothing. The button and the CLI make a backup of the database as it is first
(the library's, in `storage/backups/`, once for each list of pending files; a
backup that cannot be made stops the run before anything is applied);
`setup.php` does not. `generate-api-spec.php` replays the same folder to work out
what each table looks like, so a new column reaches the generated client without
being written down anywhere else. Migrations that change data end with a
`DO $$ … $$` gate that fails loudly when the result is wrong.

A `users/` migration never names a `genshin_impact/` table: on a fresh install
every `users/` file runs before `genshin_impact/001` makes the content and quiz
tables. A change to both halves is one file in each folder.

### While an update waits

From the moment a migration file is on disk that the database has not run until
it is applied, the site is closed - the same way on every anotoki site (the
shared library; `backend/api/site_state.php`):

- the API answers `503 {"code": "update_pending"}` with `Retry-After: 60` to
  everything but what a sign-in and the Migrations page need:
  `/api/settings/public`, `/api/me`, `/api/translations/{code}` (the words, with
  the languages beside them) and `/api/admin/migrations/...` - and the two admin
  tools that need no table, the error log (`/api/admin/errors`) and the backups
  (`/api/admin/backups`, a backup's restore excepted), for the ADMIN;
  `GET /api/site-status` says `{"state": "update_pending", ...}`;
- visitors and signed-in readers see "The site is being updated" in their
  language - no error, nothing but a quiet **Sign in** while nobody is signed
  in - and the page reloads by itself once the site is back;
- the site's ADMIN, signed in, reads "A database update is waiting" and **Open
  Migrations**: `/admin/migrations` works, nothing else does. Apply there, and the
  site is open again.

Signing in keeps working the whole time, so an ADMIN gets in from that page's
Sign in. A file that fails does not change this: the site stays closed until
every file is applied (a failed one is rolled back whole and stays pending -
upload it mended and Apply again). Locally the same happens when you pull a
migration and have not run `php migration.php` yet.

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

**And (written 2026-10-06)** `users/047_account_preferences_strings.sql`: the
account panel's line under its choosers saying they are the anotoki account's
(`account.preferencesNote`), and a truer description for
`account.formats.failed`, which the panel now also shows when a theme or a
language could not be saved. It changes no schema and no other string; until it
runs, a signed-in reader sees the line's key.

**And (written 2026-10-06)** `users/048_drop_own_preferences.sql`, at the
owner's word: the columns the site kept its own copy of the preferences in
(`users.theme_main`, `theme_admin`, `language`, `date_format`, `time_format`)
and the `themes` lookup go. **Not a way back**: a build from before 047 reads
those columns, so upload the new build first, then Apply - and once 048 has
run, an older build never goes on the host again.

**And (written 2026-10-07)** `users/049_drop_not_set_up_strings.sql`: the four
`site.notSetUp.*` strings of the site's own "not set up" page, which went when
the shared library's page took its place - nothing reads them any more. It
changes no schema and no other string, and is safe before or after the upload
(the page of a build from before the library falls back to its own English).

**And (written 2026-10-11): anotoki-lib 0.4.1** - signing in, people and the
admin tools from the library. In the order they run: the library's
`anotoki_admin/001_audit_log.sql` and `002_feedback.sql` (its tables),
`users/052_people.sql` (`users.anonymized_at` added, `users.email` dropped - no
anotoki site keeps anybody's address, the owner's decision - and
`users.created_at` a TIMESTAMPTZ, read in the server's zone),
`users/053_drop_old_feedback_and_callback_strings.sql` (the old feedback form's
and sign-in callback page's 36 strings, which nothing reads since the
library's took their place - the key scan says so; the keys the pages still
read are kept), `genshin_impact/028_audit_into_library.sql` (every `audit_logs` row into
`anotoki_audit_log` under its id: `content.*`, the files catalogue's
`catalogue.*`), `029_feedback_into_library.sql` (every `feedback` message into
`anotoki_feedback` under its id, without `ip` and `submitter_hash` - the
owner's decision), the library's `anotoki_translations/003` and `004` (the
sign-in page's and the feedback form's words) and `anotoki_people/001`. 028 and
029 keep the old tables, renamed `audit_logs_before_library` and
`feedback_before_library` (the latter without `ip` and `submitter_hash`), unread,
until a later release's migration drops them (`genshin_impact/033`, anotoki-lib
0.11.0's release) - and each gate proves every row
came through, field for field; a file that would lose something (a message
longer than the library's 10,000 characters, an id already taken) stops with
nothing of it applied. Apply makes a backup first. **Not a way back**: a build
from before them writes `users.email` and the old tables - upload the new build
first, then Apply, and never put an older build on the host again. The site's
own error log files (`storage/logs/errors-*.jsonl`) and its pg_dump backups
(`storage/backups/<stamp>-<hex>/`, `storage/backups/manual/`) are no longer read
by anything; they stay where they are until you remove them (by FTP on the
host).

**And (written 2026-10-12): anotoki-lib 0.5.0** - `users/054_visitor_starts_hashed.sql`.
The site keeps no address of anybody's (the owner's rule of 2026-10-11): the
count of new visitors per address (`visitor_starts`) kept the address itself
for an hour, and now keeps a keyed HMAC of it (`api/client_address.php`'s
`clientAddressHash()`, under a key derived from the site secret) - the same for
one address as long as the secret lasts, a stable pseudonym of it in every
backup made meanwhile: whoever holds a backup AND `config/secret.local.php`
can find an IPv4 address again by trying all 2^32. 054 deletes
the addresses there (an hour's worth at most - the limits on new visitors count
from zero for that hour) and adds a check that the column takes nothing but
such a hash; its gate proves the check validated and no address left. Apply it
at once after the upload. **Not a way back**: a build from before writes the
address, which the check refuses - its first save for a new visitor would fail;
never put an older build on the host again. The backups made before 054 hold
their hour's addresses as they were, until you delete them. The same release,
with nothing to apply: the old error log files' addresses (`ip` in
`storage/logs/errors-*.jsonl`) become a keyed hash after the first answer;
the library's backups are sealed from now on, so a plain backup made before
the update restores offline only (make one right after it - *The admin tools*).

**And (written 2026-10-18): anotoki-lib 0.6.2** - Terms, Privacy and Contact.
In the order they run: `users/055_legal_pages.sql` (this site's facts for the
family's legal pages - 44 keys, English and informal Slovak, each string only
where it has none - and the footer's fan clause, `footer.fanDisclaimer`),
`users/056_drop_multiselect_selected_strings.sql` (the multiselect's four old
summaries, which nothing reads: `multiselect.selected.*`), then the library's
`anotoki_translations/005`-`009` (the legal pages' 122 words, the top bar's,
the kit's newer pieces', the tabs' and the inputs') and `010`-`011` (the
Privacy page's sentences on backups, the account's address and the sign-in's
notes, made true - each only while nobody saved another wording). No schema
changes; the Apply backs the database up first. Upload both builds and Apply at
once - until then the site is being updated for everybody but its ADMIN, as for
every update. Nothing else to set; the Privacy page names the hosting company,
WebSupport s.r.o., as the owner named it on 2026-10-18 (`GENSHIN_HOSTING` in
`frontend/src/app/sites/main/legal/legal-facts.ts`).

**And (written 2026-10-18): anotoki-lib 0.6.3** - the family's footer under the
admin panel's pages. One file waits: the library's
`anotoki_translations/012_footer_words.sql` (the footer's four words, English and
Slovak, each only where it has none - until it runs the footer says the library's
own). Upload both builds and Apply at once. A `cloudflare.local.php` on the host
that names no usable secret fails closed from this release (*The origin secret on
the host*, below): make sure it holds the zone's value, or delete it.

**And (written 2026-10-20): the game's own ids**, for the build analyzer's
catalog (*The game catalog*, below). Two files, in this order:
`genshin_impact/030_game_ids.sql` (the column `game_id` on `characters`,
`weapons` and `artifacts`, a positive number or nothing, one live row an id - a
Traveler's one an element - no row changed) and `031_game_ids_filled.sql` (the
ids, set by name: 136 characters with the 14 Traveler rows, 252 weapons and 63
artifact sets, as the live site's public lists named them on 2026-10-20; a row
with an id keeps it, a deleted row and an id another live row holds are left
alone; its gate proves no id changed, each one set is its name's, and nothing it
names was missed). Upload both builds and Apply at once; the Apply backs the
database up first. Either order is safe - a build from before reads and writes no
`game_id` - but the catalog needs the new build. Players notice nothing. Four
rows stay without an id (no list of the game's carries them): Prized Isshin
Blade (Awakened) and (Shattered), Sword of Narzissenkreuz (Quest), Initiate.

**And (written 2026-10-21): the quizzes' levels**, on the admin panel (*Quiz
levels*, below). One file: `users/061_quiz_levels.sql` - the table
`quiz_levels` (one row at most, the levels as JSON, its time; no person - who
changed them is the audit log's), which it leaves empty: the built-in levels
stay in force until somebody saves others. And Voice's three sentences in the
difficulty dialog take their seconds from the levels (`{first}`, `{second}`,
`{third}`), English and Slovak, each only while it is still `users/058`'s
words - a Slovak one only beside this file's English; one key is new,
`quiz.levelInfo.voiceOther` (English and Slovak, each only where it has none):
the general words for a Voice level that plays fewer pieces of the recording
than its sentence names. Its gate proves the table empty, no Voice sentence
left in 058's words, the new key in both languages, and every key the dialog
reads still there. Upload both builds and Apply at once; the Apply backs the database
up first. Either order is safe: a build from before reads no `quiz_levels` and
plays the built-in levels, as the new one does with nothing saved.

---

## Checking your work

`backend/tests/` - the upload rules (what an upload may be called, where it may
be written, the folders' `.htaccess` guard, an upload's bytes and size), run
without a database or a server, and so is `catalog-versions.test.php` (a version
read as the pages read it, held to the cases `database-helpers.ts` names);
the game catalog (`catalog-routes.test.php`: its three answers, field for field,
the icons' host, ETag and 304, the gates and the admin's way in, 030's indexes
and CHECK, and 031 on a database with rows - each id by its name, never over one
- with both gates shown to notice what they must);
the words (`translations-migration.test.php`: users/050 on a database as its
owner left it - reworded strings and guides, blanks, a hidden language - and
what it refuses, and users/053's strings gone with the keys still read kept; `translations-routes.test.php`: the whole API in-process - the
bundle, who may do what, saves, the languages, the guides, the gates); the
quizzes' levels (`quiz-levels.test.php`: the built-in levels, read from the
frontend's `quiz-levels.ts`, passing the rules; every rule refusing what it
must, saying where; who may - nobody, a MEMBER refused, an EDITOR and the ADMIN
not; a save and a reset with their audit entries; the public read - ETag and
304, null for the built-in levels, for saved ones the rules no longer take and
before the table is there - under the site's switches; users/061's table,
Voice's sentences reworded only where they are still 058's, and its gate); the
character page's answer (`character-full.test.php`: the special dish on the
character beside its id, by its name and its picture - the food's own normal
icon, as a path and the file's name, never a file named after the dish - none
when it is deleted or there is none, no picture for a dish without a normal
icon, the birthday as the site keeps it); and
anotoki-lib 0.5.0 here (`library-tools-migration.test.php`: users/052, 054 and
genshin_impact/028-029 on a database shaped like an installed one, with rows in
every table that moves, in a server zone that is not UTC - every row under its
id, field for field - and what they refuse; `library-tools-routes.test.php`:
every admin tool's route for nobody, a MEMBER, an EDITOR and the ADMIN, who a
request is (the server's copies of the header too), the feedback form, the
pages' error reports (scrubbed, their caps, the gates), a backup made - by a
name, sealed -, downloaded once and restored (the People page's and the
Feedback page's deletes since done again inside it, the scrub after it, an IAM
out of reach said and retried), one without this installation's seal refused,
the file explorer's rules and every link to a file kept through a rename, a
move, a refused delete and an Undo, a preview link signed under the
installation's key refused, the People page and the scrub, the gates;
`addresses.test.php`: where a request comes from - Cloudflare's word from
Cloudflare alone, by one rule for the site and the library - and what is kept
of it: keyed hashes in the new visitors' count, feedback's limit and the
error log, the old error log files' addresses hashed in place, nothing under
`api/` reading an address itself;
`silent-sign-in.test.php`: what a silent sign-in brings in - the visitor's
move and the browser's own games' carry, each into an account here for the
first time, into one with its own games (nothing comes, the visitor and the
browser's games left as they were), and a sign-in the person makes into that
one;
`settings-files.test.php`: every `config/*.local.php` read cleanly or not at
all - one that does not start with `<?php` never compiled, one that prints
caught, a parse error said by its kind and line - and the attacks it stops,
each through the whole API in a process of its own: a database file with a
BOM, a password and no `<?php` puts the password in no answer (the status
page's included); a BOM or a blank line before `<?php declare(strict_types=1);`
leaves the site not set up, never a 500; an unreadable `cloudflare.local.php`,
one naming no usable secret or a folder in its place, fails closed (a forged
`CF-Connecting-IP` from Cloudflare's ranges is the edge, the visitors' limit
counts one sender); an unreadable
`visitors.local.php` trusts no proxy; a broken `site.local.php` is not set up;
`migration-cli.test.php`: `php migration.php` itself). All but the first make
databases of their own, `genshin_test_*`, on the PostgreSQL server
`config/database.local.php` names (never its database; the user needs CREATEDB,
as setup.php's does) and drop them when they end, and run the API in a backend
copy of their own with a key pair standing in for the IAM; without the config
file they say they are skipped. They must pass on PHP 8.5 (the owner's rule of
2026-10-12); the hosts run 8.2 and up, so the code uses nothing 8.2 lacks. What
there is:

```bash
# Frontend (frontend/)
npx tsc --noEmit -p tsconfig.app.json          # types
npm run lint                                   # includes: no inline template/styles
npx ng build --configuration development --output-path <a scratch folder>   # templates are only fully checked by a build
node scripts/screenshots.mjs --out <a scratch folder>   # every page in a real browser (below)

# Backend (backend/)
php -l <file>                                  # every PHP file you touched
php tests/run.php                              # the backend's tests (tests/*.test.php)
php migration.php --dry-run                    # a new migration is picked up

# Both halves (the root)
bun run format:check                           # Prettier on every file, the anotoki family's one setup (bun install there first)

# The generated client is in step with the backend
cd frontend && npm run api && git diff --stat src/app/api api-spec.json
```

**Every page in a real browser.** `node scripts/screenshots.mjs` (in `frontend/`)
builds the site for production and shows every page of it - the public site as
a visitor, its dialogs, a quiz's search with a name begun, the top bar's items
opening and closing their sections (the address each leads to, `aria-current`,
Enter), the quizzes at saved levels (answered by the browser for
`/api/quiz/levels`: Mismatch's count, the difficulty dialog's numbers) and at
the built-in ones when that answer fails, a character's special dish (its
picture - the food's own normal icon - and its name, never its id) and birthday
(a day and a month, never the stored date) in English and Slovak, Terms, Privacy and
Contact in English and Slovak (the Privacy page flagged unless it names the
hosting company, and Contact's feedback form), a sign-in the IAM refuses (the anotoki library's screen
of it on the callback's page, and in the sign-in card while the IAM requires
signing in), the Privacy page while the IAM requires signing in (drawn, never
the card, no trip to the IAM), the status page while an update waits, the
database is out of reach and the site is not set up (alone - flagged with any
header, navigation or footer round it - in light English and dark Slovak, and
flagged unless the site's frame comes back once it is ready), then the admin
panel as its ADMIN (the Errors page with the page's thrown error as its row,
and that row opened; the Quiz levels page - what the rules say as levels are
typed, a text that is no JSON, the words levels leave behind, a save and back
to the defaults; the kit's pieces opened - what folds, a birthday's
calendar, the editor's link dialog and colour panel, the voice-over import; the
admin forms filled and saved - every kind of field typed into, chosen, ticked,
a row added, numbers refused as typed, a save refused and the tab of its first
wrong field opened -, and each form that keeps lists saved untouched (every list
must go back as it came, the seed's own), the body each sent kept in
`form-bodies.json` (the save answered by the browser, so nothing is written): a
run before a change to the forms and one after must keep the same file but for
the rows' times; the family's footer and the two dialogs it opens, the status page while an update
waits, and Migrations then in the panel's frame, its footer without Feedback),
and three pages signed in - in headless Edge (or Chrome, `BROWSER=`), light and dark, 1280 and 390 px
wide: a screenshot of each, whole, with `focus-*` ones of the keyboard's focus,
and `report.json`. It flags what a picture hides: a page wider than a phone, an
error in the console, a key shown where a word should be, stored markup that
ran (every seeded voice-over line carries an `<img onerror>`, which must never
run in the HTML editor or on the character page) - and throws an error
in a page, which must reach the backend's error log as the page's own,
scrubbed (`error-report` in the report). Take one before a
change to the pages and one after, and look at them side by side. It shows
them on a site of its own: a throwaway `genshin_test_browser_*` database with a
little game content and a backend copy (`backend/tests/tools/browser-env.php`,
the tests' PostgreSQL server, never its database), the anotoki library's
stand-in IAM, the build and the API on one origin on ports 8592-8595 - and stops
all of it and drops the database when it ends, also when something fails. It
needs PHP 8.2 or later (`PHP=` names one where `php` is older); `--only admin-`
keeps some pages (`--only admin-form-,admin-banners-edit`: several),
`--no-build` takes the last build.

Then run both servers and use the thing: the page you changed, both themes, a
phone-width window, and the API's failure answers (401/403/404/409/422) with
`curl` as well as the happy path. Writes need an IAM token with the `genshin`
ADMIN or EDITOR role; a personal token from the IAM's account page ("Tokens for
scripts") is how a script gets one.

**The IAM's "Sign-in required" switch.** Turn it on for `genshin` in the local
IAM's admin console (Applications → genshin → Settings) and, within a minute,
`curl http://localhost:8000/api/characters` answers 401 `sign_in_required`
while `/api/settings/public` says `"login_required": true` and still answers,
with `/api/translations/en`. In a private window the site
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
# 200 {"found": true, "games": {"moved": 1, "kept": 0, "stale": 0}, "results": 0, "stayed": false}
```

The person's own game stays where both have one for a quiz; the visitor's
log rows move and its totals are added to the person's; the key is 401
`visitor_unknown` from then on, and the same move again answers
`{"found": false, ...}`. It works with the switch on too. No key, or not a key:
422. Another request holding the rows longer than `move_lock_timeout_ms`
(5000; `visitors.local.php` can make it shorter for a try): 503
`visitor_move_retry` with `Retry-After: 2`, nothing moved.

After a **silent sign-in** - the IAM's sign-in hint signed the person in,
nobody clicked anything - the page sends `{"silent": true}`, and the visitor
comes only into an account that has nothing here yet (no saved game, not
even a fresh draw, no finished question, no total). Into one that has,
nothing moves - `{"found": true, ..., "stayed": true}` with zeros - and the
visitor stays as it was, its key still opening it in that browser, until a
sign-in the person makes there (the owner's decision of 2026-10-11: a
browser's games never land silently in an account that already has its own
here). `silent` other than true or false: 422. The carry of the games a
browser kept by itself (`POST /api/quiz/progress/carry`, when no visitor could
be made) follows the same rule: a person's carry with `"silent": true` writes
nothing into such an account and answers `"stayed": true` with the account's
own games, and the browser keeps its games.

In a browser (a private window, signed out, 045 applied): opening a quiz
makes nobody - its fresh question stays in the browser; the first guess makes
the visitor (localStorage `genshin-visitor` holds its key, `app_data` no
longer holds the quiz games - they went to the server with it), and the
Profile shows that browser's figures. Signing in from there moves them into
the account (the Network tab shows one `POST /api/visitor/move` with both the
token and the key, before the person's games are read); the key is gone
afterwards. Signed in by the IAM's hint instead (signed in on another anotoki
site first) into an account that already has games here, the move says
`"silent": true` and answers `stayed`: the key stays in `genshin-visitor` (and
games the browser kept by itself stay in `app_data`), nothing is said, signing
out brings the visitor's games back, and the person's own Sign in brings them
into the account (localStorage
`genshin-silent-sign-in` holds the account's id while its session is a silent
one). A person's requests never carry `X-Visitor-Key` - but the move's -
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

**The account's preferences** (the local IAM with its migration 015). Signed
in, the account panel's choosers - appearance, language - and the
admin panel's theme switch (light, dark, as the device is set) each show the choice at once and send one
`POST {issuer}/api/oidc/preferences` (the Network tab; never a request to this
site's API), one at a time when clicked quickly; the IAM's account page shows
the same choice, and a choice made there reaches this site with its next token
refresh (or at once in a tab of this site that saved it). The dates and the
clock are chosen on the IAM's account page alone (the owner's decision of
2026-10-22): one chosen there writes this site's dates - the account panel's
member-since among them - from the next refresh. The theme is the same
in `/admin` as on the site. With the IAM stopped, a theme
goes back to the account's and the panel says it could not be saved; a language
stays on the page for the visit, with the same words - and without a word when
the IAM simply does not offer it. Signed out, the
appearance and the language are kept in this browser's localStorage (`theme`,
`language`, prefixed `anotoki-genshin-impact-`) and dates are written the
device's way.

**While an update waits** (*Database & migrations*). A database one migration
behind is enough: leave the newest file unapplied on a scratch copy (never your
own database - the IAM's advice above holds here too: a scratch copy of
`backend/` with its own `config/*.local.php` and a throwaway database). Then
`curl -si http://localhost:8000/api/site-status` says `update_pending`,
`/api/characters` answers 503 `update_pending` with `Retry-After: 60`, and
`/api/settings/public` and `/api/translations/en` still answer.
In a private window every page shows "The site is being updated" (in Slovak too,
with the language chosen) and nothing else, Sign in included; signed in as an
ADMIN the same page says "A database update is waiting", **Open Migrations**
reaches `/admin/migrations`, and **Apply pending** opens the site again. With
another apply running (`php migration.php` beside the button) the page says the
update is busy and applies nothing. Without the `config/*.local.php` files the
pages say "This site is not set up yet" with the setup page; with
`storage/installed.lock` there as well, "not available right now" and never the
setup page. `/api/site-status` answers in every state - maintenance mode and
the IAM's sign-in switch included.

The generated reports under `docs/` - reference, performance, security - are
rebuilt by their own scripts; `docs/README.md` has the commands.

---

## How the admin features work

### Site settings

Admin panel → System → Site settings (`/admin/site-settings`, the ADMIN's
alone): the anotoki library's page (anotoki-lib 0.11.0 - this site's own page,
made every anotoki site's), a card a part, each opening its dialog. Every
switch takes effect the moment it is saved, for everybody, and the server keeps
it too; the site's ADMIN is never shut out of anything.

| Part | What it does |
| --- | --- |
| Getting in | Maintenance mode: the library's closed sign ("Back shortly" and what you wrote, in the reader's language, else English, else the library's sentence) stands instead of the site for everybody but this site's ADMIN, who uses the site as it is with a line above every page; the API answers 503 `maintenance` to everything but the reserved paths - who is signed in (`/api/me`), the boot's settings, the words, the site's status, the site settings themselves - the error log and the backups (for their ADMIN), and the two links an ADMIN's browser opens by itself (`site_state.php`). The legal pages, About and Support stay open to anybody. |
| Announcement | A bar above the header, one message per language, information, a warning or something wrong; Hide keeps a mark of it in the browser until its words change. |
| Page access | Who sees each page, a page switched off, and the API paths refused with it (below). |

Whether anybody may sign in at all, and whether Google is offered, are the IAM's
switches - in its admin console, for every site at once. So is **Sign-in
required** for this site (Applications → genshin → Settings; off by default):
while it is on, the API answers 401 `sign_in_required` to everybody not signed
in, but for the public settings, the strings (with the languages), the site's status
and what a browser opens without a token - the asset previews (`/api/files/raw`,
an `<img>`'s), the file explorer's previews (signed links) and a backup's
download (a single-use ticket); `api/meddleware/sign_in.php`), and the pages send everybody signed out to the
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

**Getting back in after switching the site off**: `/staff`. The closed sign
offers Sign in there alone (to the IAM, as everywhere), back to the home page;
the API lets nobody but an admin past, so the path grants nothing on its own.
While the site is open, `/staff` is a page with the same button.

The switches live in the library's `anotoki_site_settings` (a row per switch,
its value JSON; a switch with no row is at its default) - `users/066` brought
this site's rows across from its own `site_settings` and dropped it. The
switches are the library's: a new one is a change to anotoki-lib.

### Page access

The third card. A row per page in the library's `anotoki_page_access` (`users/066`
brought the 27 rows the router's pages were seeded with in `users/035`, and any
added since, across from `site_routes`), carrying two separate decisions:

- **Visible to** - `PUBLIC`, `USER`, `EDITOR` or `ADMIN`: the lowest kind of reader
  the page is drawn for. Everything is seeded `PUBLIC`; `ADMIN` is the default for
  a row added by hand, because the safe default for a page nobody has thought
  about is that nobody sees it.
- **Off** - takes it away from everybody who is not an admin, whatever the first
  says. "Members only" and "off this week" are different things.

Either one takes the page out of the menu and stops it matching in the router
(the library's `pageAccessGuard`), so its address answers as not found. Admins
keep every page, with a badge in the menu and the library's notice above the
page saying which of the two it is.

A page's **API paths** are optional and empty by default, so switching a page off
leaves its data being served - right for "that page is not finished", wrong for
"nobody may have this". Naming a path is what turns the sign into a lock: the
library's `PageAccessGate` then answers 423 `page_locked` to anybody the page is
not drawn for. Paths are matched from the start, so `/api/quiz` covers
`/api/quizzes` and `/api/quiz/stats` alike. Where two pages claim the same path
the more open one wins, and a path that touches a reserved one either way - who
is signed in (`/api/me`), the boot's settings (`/api/settings/public`), the
site's status, the words, the site settings' own two - is refused on save, and
passed over in a row put in by hand.

**Add a page** takes a path the migration did not seed. Removing a row stops
governing that page rather than removing it from the site. The sign-in's way
back (`/auth`), `/staff`, the admin panel, the legal pages, About and Support
have no row and cannot be given one: the first is where the IAM sends people
back, the second the way back in when the site is closed.

Everything above is enforced twice on purpose: the site draws the closed sign and
hides the menu item, and the API means it.

### The words: languages, translations, guides

Admin panel → Localization, for ADMIN and EDITOR. **Languages** and
**Translations** are the anotoki sites' shared pages (anotoki-lib's
`@anotoki/lib/translations/admin`, the same on every anotoki site; the API is
the library's too, `backend/api/translations.php` the site's part of it):

- **Translations** - every key with its string in every language, each
  language's coverage, a search over keys, descriptions and text, "Missing in",
  export and import per language. Only the boxes you changed are sent; what you
  type is kept in the tab until it is saved or discarded. A refusal (a
  placeholder like `{days}` dropped from the English, say) is shown beside its
  key, and nothing of that save is kept.
- **Languages** - each language's names, order and whether readers are offered
  it; a new one starts hidden and reads in English until its strings are
  written. English and Slovak come with the site and cannot be deleted; another
  language can, after the page offers to export its strings first - its guides
  go with it.
- **Guides** - the pages behind the question marks, a page of markup each,
  edited in the family's HTML editor (`<anotoki-html-editor>`, anotoki-lib
  0.11.0) with a preview beside it, every language at once; empty, a language
  reads the English. Kept through the family's allow-list as it is saved
  (`backend/api/rich_text.php`: paragraphs, headings h2-h4, lists, the words'
  formats, links to the web and to mail, five inline styles, the "tag" class -
  nothing else survives). The site's own page (`sites/admin/localization/guides/`).

What the panel no longer does (since `users/050`): make, rename or delete a key,
or edit its description - keys come from migrations with their descriptions;
an import never creates one either. The guides' bodies left the strings for
`guide_contents`. Before an upload that changes the words, export every language
from the Translations page and keep the files.

### Quiz levels

Admin panel → System → Quiz levels, for ADMIN and EDITOR (since `users/061`):
what each level of each quiz shows, try by try - the classes that hide a
picture (Banners, Dish) or a voice line, Pixelate's grid, the seconds of a
track or a recording, how many characters Mismatch offers - as JSON in the
kit's code editor, which colours it (`@anotoki/lib/ui/code-editor`, since
anotoki-lib 0.9.2; `sites/admin/quiz-levels/`). Nothing saved, it holds the built-in
levels (`frontend/.../quizzes/shared/quiz-levels.ts`, `QUIZ_LEVELS`).

- As you type, the page asks the server what its rules say
  (`POST /api/admin/quiz-levels/check`) and lists every problem with where it
  is - the quiz, the level, the try - and what is wrong; **Save** waits until
  there is none. The server is the rule (`backend/api/quiz_levels.php`): exactly
  the six quizzes, the levels "1", "2" and "3"; five tries on every level of every
  quiz (`triesMax` 5 - the Profile counts tries and wins across levels) and five
  steps, `try` 0 to 4 in order; a step's `class` only the classes its quiz's CSS
  has, one crop and one filter for a picture, one cut of the line and
  `hidden-audio` for Voice, none for Pixelate and Music; `data` Pixelate's grid
  (3 to 60 blocks across, every step), Music's seconds (1 to 60, every step but
  the last, which may leave it out for the whole track), Voice's seconds (0.25 to
  10, never beside `hidden-audio`), none for a picture; Mismatch's
  `choicesAmount` 3 to 8; each wrong guess showing more, never less (the grid
  finer, the seconds more, a picture or a line never hidden more than the try
  before, the player never hidden again); no other key, no other type, 16 KB at
  most. A save the rules refuse answers 422 `invalid_levels` with the same
  problems, and keeps nothing.
- **Save** puts them in force for every quiz from its next page load; **Back to
  the defaults** deletes what is saved, and the built-in levels are in force
  again. Both are in the audit log (`content.insert|update|delete` on
  `quiz_levels`, the levels before and after); a save of the levels as they are
  changes nothing. Saved levels a later release's rules no longer take are shown
  as saved, with why, and the quizzes play the built-in ones until they are
  mended.
- The pages ask `GET /api/quiz/levels` once a page load (`{levels}`, null for the
  built-in ones; ETag and no-cache) beside a quiz's characters, and play the
  built-in levels while it is on its way, when it fails or is refused, or when
  what it says is no levels (`QuizLevelsService`, at most 2.5 seconds' wait);
  settled once a page load, they never change under a question being played. The
  daily plays Easy - level 1 of the levels in force.
- The difficulty dialog takes its numbers from the levels in force - Pixelate's
  grid, Music's and Voice's seconds, Mismatch's count - in the reader's way of
  writing numbers ("0,5 s" in Slovak). What no number can say is written for
  the built-in levels: Banners' and Dish's steps (`quiz.levelInfo.picture*`),
  which of Voice's steps show the line and which play the recording
  (`quiz.levelInfo.voice*`), and Mismatch's card and guide, which say three to
  five characters (`quiz.mismatch.info`, the Mismatch guide). The page warns -
  never refuses - when levels leave those words behind, naming each string to
  reword on the Translations page (and the guide on the Guides page). A key
  keeps its English's placeholders, so a Voice level that plays fewer pieces
  of the recording than its sentence names is said in general words instead
  (`quiz.levelInfo.voiceOther`) - never a number missing - and the page says
  that too.

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

**Names.** An upload keeps one extension, its own: any other dot in the name it
is given becomes `-`, so a new banner "5.0 - Epitome Invocation" is stored as
`5-0 - Epitome Invocation.avif` (the pages read a file's name from the
catalogue, so it shows all the same). Replacing a file - the Files page's
Replace, a voice line uploaded again - keeps the name it had, `1.0 - ...`
included. A rename follows the same rule. The reason is the host's Apache,
which runs `shell.php.png` as PHP where PHP is mapped by AddHandler; the
tree's `.htaccess` guard is the second line (`api/upload_guard.php`, and
[Looking for files that could run](#the-upload-map)).

### The admin tools (anotoki-lib 0.5.0)

Admin panel → System: **Error log**, **Audit log**, **Feedback** (with the count
of new messages beside it), **Backups**, **Files explorer** and **People** - the
anotoki sites' shared pages and API (`backend/api/admin_tools.php`,
`audit_log.php`: this site's answers to them), for this site's **ADMIN alone**:
an EDITOR sees none of them, and the dashboard shows an EDITOR no feedback and no
recent editing (the owner's decision). Each route answers 401 to nobody and 403
to anybody but the ADMIN, judged from the token.

- **Error log** - what went wrong, in files (`storage/error-log/`, a day a file,
  30 days, 64 MB at most), so it works while the database is down or an update
  waits: by the anotoki family's rule, every answer of 500 and up and the 404s,
  405s, 413s, 415s and 429s (a refused token or role, a 409 or a 422 is the API
  doing its job, and is not written - the owner's decision of 2026-10-11, in
  place of this site's old "every answer of 400 and up"), every exception with
  a trace that holds no call's arguments, PHP's warnings and fatal errors - never
  a body, a query string, a header, a token or an address (a keyed hash of it
  instead). Nor an answer that says a state the site is in: an update waiting, a
  table waiting for one (the guides', the visitors', a tool's), the site closed
  for maintenance or not set up - an expected refusal stays out (the owner's
  rule), while a real failure is written, a 503 among them (the feedback's count
  that could not be kept, a database out of reach). And the pages' own errors (anotoki-lib 0.5.0, every anotoki site's):
  what goes wrong in the browser is reported by the library's ErrorHandler to
  `POST /api/client-errors` - scrubbed in the browser and again on the server,
  at most five a page load, 20 an hour from one sender (a person by their
  account, a visitor by their address) and 500 a day from the visitors, as many
  from the people signed in - and listed as the page's own (`source: client`).
  The site's own log files from before (`storage/logs/errors-*.jsonl`) are not
  read; once, after the first answer of 0.5.0, each line is scrubbed as the
  library scrubs its own - its address (`ip`) a keyed hash, an address, an
  e-mail address, a token or a secret in its message and trace (which kept its
  calls' arguments) marked, a line cut short scrubbed whole - and a file it
  could not read or write is named in the PHP log. Nothing else of them
  changes, and they stay until you remove them.
- **Audit log** - the library's `anotoki_audit_log`: every content write
  (`content.insert|update|delete`, filed under the entity it belongs to), the
  files catalogue's (`catalogue.*`), the words', and the tools' own (a backup
  made, a message marked, a file moved, a person's data deleted, an Apply), each
  with who and from which IAM session. `genshin_impact/028` moved the old log
  in, every entry under its id.
- **Feedback** - the footer's form is the library's (`POST /api/feedback`): bug,
  idea or other, a place, a subject (a bug's and an idea's), the message and the
  site's fields (`steps_to_reproduce`, `expected_behavior`, `actual_behavior`,
  `browser_device_info`, `why_important`, `additional_info`); five an hour and
  twenty a day from one sender - somebody signed in by their account, a visitor
  (or a message "without my name") by their address - and three hundred a day
  from the visitors, as many from the people signed in; nothing of where a
  message came from kept with it; no mail. The reply address is what the sender
  leaves in the form's field: signed in, the page fills it with their account's,
  and what they leave there is kept with the message - cleared, none is; "send
  without my name" keeps neither their name nor an address (the owner's
  decision of 2026-10-11: "it's their choice"; the server never takes the
  address from the token). An account the IAM deletes has it blanked by the
  People page's scrub, and the People page's Delete blanks it too.
  `genshin_impact/029` moved the old messages in.
- **Backups** - of the database, by PostgreSQL's COPY through PDO: no pg_dump, so
  they work on the host too. `storage/backups/<id>.anotoki-backup`: one a day
  after the first answer of a UTC day (14 kept), one before every Apply and every
  `php migration.php` run (5), one before a restore (5), and those made on the
  page (kept until deleted). A backup has no maximum age (the owner's decision
  of 2026-10-11): the automatic kinds go only as newer ones of their kind take
  their place, the ones made on the page only when you delete them - and a
  person deleted since stays in them until then. They are not encrypted (the
  owner's decision of 2026-10-11): whoever gets a backup file reads in it the
  people's names, the feedback's messages and reply addresses, everybody's play
  history and the IAM session ids the audit log keeps (the new visitors' count
  holds keyed hashes, not addresses, since `users/054` - a stable pseudonym of
  each address, which a backup together with the site secret can turn back
  into an IPv4 address; a backup made before it, the addresses of its hour) -
  so they stay in `storage/backups/` (denied
  to the web, each file the site's own user's alone, `0600`) and leave only by
  the single-use download. The page names who made each. Making,
  downloading (a single-use link, a minute), deleting and restoring each ask for
  a sign-in at the IAM from the last ten minutes (the page offers "Sign in
  again"), and are audited. Each backup is **sealed** (anotoki-lib 0.5.0): its
  sidecar carries an HMAC of its id and its SHA-256 under this installation's
  key (`storage/anotoki-lib.key`), and only a sealed one is restored here - the
  page's Restore - its bytes hashed as they are read. A plain backup made
  before 0.5.0 has no seal: listed, downloaded, but restored offline only
  (unpacked and loaded by hand - *Troubleshooting*), so make a backup right
  after the update. The seal keeps out a file put into
  `storage/backups` from elsewhere (another installation's, one changed since) -
  not somebody who can write the whole storage folder. A restore puts back
  everything but the bookkeeping and the audit log, all or nothing, only into a
  database whose migrations match the backup's; inside it, before anybody sees
  the rows, it does again every People-page and Feedback-page delete made since
  the backup (the audit log, never restored, says which) - so a person's games
  or a message deleted after the backup stay deleted - then runs the scrub of
  the IAM's deleted accounts at once, so nobody the IAM deleted since the backup
  is named again; a scrub that cannot finish (the IAM out of reach) is said with
  the restore's answer and in the error log, and runs again with the next
  request. The pg_dump backups from
  before (`storage/backups/<stamp>-<hex>/` and `manual/`) are no backups of the
  library's - never listed, never touched: download them by FTP, remove them when
  you like. `php db-dump.php` still makes a pg_dump of your own with the client
  tools (`config/backup.local.php`).
- **Files explorer** - the asset tree (`assets/`, listed from a snapshot that
  **Rescan** takes) and `public/uploads/`: browse, search, upload (by the
  button or by dropping), new folders, rename and move, delete into a trash
  (`storage/explorer/trash/`) and back. The library's rules decide what goes in:
  one extension per name, from the folder's list, every other dot a dash; no
  part of a name a server could run (`shell.php.png` is refused); the bytes what
  the extension says. A file already there that the rules would refuse now stays:
  it is listed, previewed by its own extension (a picture as a picture, anything
  the folder does not take as a download) and can be moved to the trash, never
  run - and since the asset tree's `.htaccess` sends nosniff and hands anything
  but a picture over as a download, an old `.svg` or `.html` there never runs on
  the site when its address is opened either. What the explorer does in the
  asset tree reaches the catalogue, and never takes a picture or a sound away
  from the content: a file renamed or moved - or a folder, with everything in it
  - keeps its catalogue row, the same id under the new path, so every character,
  weapon or region showing it still does; a file the content shows cannot go in
  the trash (409, saying which rows use it: point them elsewhere, or rename or
  move it instead), nor anything the catalogue has be moved where no category
  claims it; a new file is catalogued, one nothing shows put in the trash is
  forgotten, and catalogued again when it comes back. Uploads arrive as they
  are: the Files page's Convert makes their AVIF or Opus. (The Files page's own
  Delete still forgets a file's row and with it every link to it, as it always
  did.) A preview's link opens one file for five minutes with no sign-in, so it
  is signed under the site secret (`config/secret.local.php`), never the key
  the library keeps in `storage/`.
- **People** - everybody who signed in here, by IAM id, with their saved games,
  quiz results and messages; **Delete** takes their saved games, results and
  statistics (their row and their messages stay - the messages without the
  reply address and browser they were sent with), asking only its question;
  **Check now** runs the scrub of the accounts the IAM deleted (otherwise once an
  hour, after an answer): the name becomes `deleted-{id}`, the address and
  browser their messages kept go, the data stays.

### Filling the profile page with something to look at (optional)

```bash
php seed_quiz_history.php --user=1 --questions=1800 --days=180   # from backend/
```

Invents quiz history for one account, from normal distributions rather than flat
ones. `--dry-run` prints the summary without writing.

---

## The game catalog (for the build analyzer)

The owner's other site, the build analyzer (builder.anotoki.eu), takes its game
catalog - characters, weapons, artifact sets - from this site (2026-10-20, at
the owner's word). It reads three public lists, server to server: no browser asks
for them, so the API still sends no CORS header.

| Route | Each item |
| --- | --- |
| `GET /api/catalog/characters` | `game_id`, `name`, `element`, `weapon_type`, `rarity`, `region`, `version`, `version_name`, `release_date`, `is_traveler`, `icon`, `stats` |
| `GET /api/catalog/weapons` | `game_id`, `name`, `type`, `rarity`, `version`, `version_name`, `release_date`, `icon`, `stats` |
| `GET /api/catalog/artifacts` | `game_id`, `name`, `two_piece`, `four_piece`, `rarities` (`[4, 5]`, lowest first), `version`, `version_name`, `icon` |

```json
{
  "game_id": 10000046,
  "name": "Hu Tao",
  "element": "Pyro",
  "weapon_type": "Polearm",
  "rarity": 5,
  "region": "Liyue",
  "version": "1.3",
  "version_name": null,
  "release_date": "2021-03-02",
  "is_traveler": false,
  "icon": "https://genshin.anotoki.eu/assets/character/icon/HU_TAO.avif",
  "stats": {
    "base": { "hp": 1210.72, "atk": 8.29, "def": 68.21 },
    "lv80": { "hp": 14459.03, "atk": 98.95, "def": 814.56 },
    "ascension": { "stat": "Crit DMG %", "value": 38.4 },
    "phases": [
      { "phase": 0, "start": { "hp": 1210.72, "atk": 8.29, "def": 68.21 }, "end": { "hp": 3140.1, "atk": 21.5, "def": 176.9 }, "ascension": 0 },
      { "phase": 6, "start": { "hp": 14459.03, "atk": 98.95, "def": 814.56 }, "end": { "hp": 15552.3, "atk": 106.4, "def": 876.2 }, "ascension": 38.4 }
    ]
  }
}
```

- **Live rows only**, each list a bare JSON array, by name (byte by byte) then
  id; nothing of an editor's, no row ids. `game_id` is null where nobody knows
  it yet.
- **The stats** (since 2026-10-26, for the analyzer's stat targets) are the
  ascension phases' own numbers, nothing computed: a character's HP, ATK and
  DEF at level 1 (phase 0's start) and at level 80 ascended (phase 6's start),
  and the stat its ascensions raise with its whole value, under the label this
  site stores ("Crit DMG %"); a weapon's `base_atk` and `lv80_atk` likewise,
  and its `secondary` stat at level 1 (`{"stat": "Crit DMG %", "value": 9.6}`,
  null for a weapon without one), and `phases` - every phase there is, in
  order: a character's stats at the phase's first level (ascended) and at its
  last (before the next ascension) with the ascension stat's value through it,
  a weapon's base ATK and secondary stat at the phase's first level. Null for
  a character or weapon without both phase 0 and phase 6. Level 90 is the
  reader's to work out with the game's growth curve: phase 6's end value is
  not it.
- **The Travelers** are rows like any other, one per element, named Aether or
  Lumine, `is_traveler` true: every Aether row carries 10000005, every Lumine
  row 10000007. `element` is as this site keeps it: Anemo, Cryo, Dendro,
  Electro, Geo, Hydro, Pyro - or Adaptive, for Manekin and Manekina.
- **A version** as the pages read it (`api/game_versions.php`): "1.3" is version
  1.3 with no name; "Luna III" is version 6.2 with `version_name` "Luna III";
  any other text is no version, the text in `version_name`.
- **An icon** is an absolute address on the host the request named - https and
  no port (a port there is likelier the one a proxy reached PHP on than one
  anybody asked for), but http and its port for a loopback host:
  `http://localhost:4200/assets/...` through `ng serve`, which serves the asset
  tree (the backend's own :8000 does not). A request whose Host is no host
  answers 400 `invalid_host`.
- **ETag** and `Cache-Control: no-cache`: send the tag back in `If-None-Match`
  and an unchanged list answers 304 with no body (a weak `W/` tag, or one an
  Apache marked `-gzip`, is the same tag).
- **Under the site's switches**, like every route: 503 while an update waits or
  the site is closed for maintenance, 401 `sign_in_required` while the IAM
  requires signing in here, 423 while a page's row names `/api/catalog`. The
  analyzer keeps the catalog it read last until this answers again.

```bash
curl -si http://localhost:8000/api/catalog/characters | head -20
```

### The ids

`game_id` is the game's own id of a character, a weapon or an artifact set
(migration `genshin_impact/030`): a positive number, one live row each - a
Traveler's one an element. The admin panel's base-info tabs of a character, a
weapon and an artifact set have a **Game ID** field for it (empty is none; an id
another live row holds is refused, 409). **The owner's importer, which feeds this
site's database, sends `game_id` with every character, weapon and set it writes
from now on.**

The ids the rows had on 2026-10-20 came from `backend/game-ids.php`, a one-off
run on this computer (never in a release):

```bash
cd backend
php game-ids.php                                       # a dry run: what matched, what did not, the duplicates
php game-ids.php --from=https://genshin.anotoki.eu     # the rows as a site's public lists name them
php game-ids.php --from=<site> --write-migration       # writes migrations/genshin_impact/031_game_ids_filled.sql
```

It reads this checkout's rows from its database (read-only) - or, with
`--from`, from a site's public lists, which is how 031 was made: from the live
site's, as a checkout's database may hold no game content - and the game's own
data lists (`https://gi.yatta.moe/api/v2/en/avatar`, `/weapon` and
`/reliquary`, the lists the build analyzer read its catalog from until now),
each downloaded once into a folder outside the repository (`--cache=<folder>`,
the system's temporary folder by default) and read from there after;
`--refresh` asks again. A row matches by its name reduced to lowercase letters
and digits (the analyzer's own key), a Traveler by its name, and where the
game's list has one name twice - a quest's copy, a weapon's skin - the lowest
id wins; a row that has an id keeps it. What matched nothing was looked up by
hand (`GAME_IDS_BY_HAND`): the two Prized Isshin Blades, the quest's Sword of
Narzissenkreuz and Initiate are in none of the game's lists and stay without an
id. 031 sets the ids by name - and element, for a Traveler - never by a row's
id, so it applies on the host's database as on this one; once applied anywhere
it is never written again (`--force` writes over it only before that).

---

## Building for production

A release is `frontend/` and `backend/`, built by the anotoki library's
anotoki-deploy and replaced whole on the host (*Deploying to the hosting*,
below). It adds nothing the running site would not have:

```bash
cd frontend && bun run anotoki-deploy build            # npm run build:deploy (production + the prod config.json),
                                                       # then the release -> ../dist/frontend/ and ../dist/backend/
bun run anotoki-deploy deploy --backups <folder>       # a dry run: what goes up
bun run anotoki-deploy deploy --backups <folder> --go  # the live frontend/ and backend/ copied into <folder>,
                                                       # the release up beside them, checked, swapped in, the site checked
bun run anotoki-deploy rollback --go                   # the release before (kept as .old) back in
```

(`@anotoki/deploy`: a dev dependency of `frontend/`, from anotoki-lib's release.
`bun run` finds it whichever tool installed `node_modules/`; on Windows, `npx`
misses bun's links.) anotoki-deploy is the anotoki library's deploy tool, the
same for every site; this site's facts are in `backend/composer.json`,
`extra["anotoki-deploy"]`: what goes into `backend/` (`api/` minus
`openapi.json`, `docs.html` and the dev vhost, `config/` minus every
`*.local.php` and the unused `google.php`, `migrations/`, `vendor/` - never
`setup.php`, the command-line tools, the tests or `composer.*`), the AVIF and
Opus types the hosting's Apache does not know, and `assets` and `uploads`, which
the switch serves beside the release. The SFTP login is never in a repository:
`ANOTOKI_DEPLOY_SECRETS` names a `secrets.json`, with the host's pinned key in
`hostkey.txt` beside it. The first time: `bun run anotoki-deploy switch --go`,
once. The PHP finds its state with one rule (`siteStateRoot()`,
`config/local.php`): with `release.json` in `backend/`, `config/`, `storage/` and
`uploads/` are the ones beside it; in a checkout, `backend/`'s own
(`public/uploads/` there). `_assetsRoot()` is beside `backend/` in both.

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

### The site's folder on the host

```
anotoki.eu/sub/genshin/   what genshin.anotoki.eu serves
  .htaccess   the switch: /assets/ and /uploads/ as they are, every other request -> frontend/
  frontend/   the built app, config.json, index.php (the front controller), .htaccess  } a release:
  backend/    api/, config/ (the loaders, no *.local.php), migrations/, vendor/,        } replaced whole
              release.json                                                              }
  config/     *.local.php - the settings, the site's secret among them                  never in a release
  storage/    the lock, logs, backups, caches, the trash                               never in a release
  assets/     the asset tree (2.7 GB), its guard .htaccess                             uploaded on its own
  uploads/    the older uploads, their guard .htaccess                                 never in a release
```

`assets/.htaccess` is the asset tree's guard: it keeps anything in the tree from
running as a script (`api/upload_guard.php`). Keep it there: the API writes it
back before an upload when it is missing, but a tree with none waits for that
upload. `uploads/.htaccess` is the uploads' (`backend/public/uploads/.htaccess`
in the repository: upload it into `uploads/` once, on a new site).

**The move to the release layout (2026-10-19), once.** Until then everything was
uploaded over the web root, and the uploads were in `public/uploads/` - linked
as `/uploads/...`, which no folder answered, so every upload was a 404. Rename
`public/uploads` → `uploads` on the host first (its guard goes with it), then
`deploy --go` and `switch --go` (the folder's `.htaccess` before is kept as
`.htaccess.flat`; `switch --undo --go` puts it back). The old files of the flat
layout - the bundles, `api/`, `vendor/`, `migrations/`, `config/`'s loaders -
are deleted once the site runs well; `config/*.local.php`, `storage/`, `assets/`
and `uploads/` stay.

**Looking for files that could run.** Until 2026-10-07 an upload kept every
dot in its name, so an editor could store `shell.php.png` (or `.avif`, or
`shell.php.mp3`), which an Apache mapping PHP by AddHandler runs as PHP. Uploads
can no longer be named so, but look once for anything left from before, and
whenever files have gone up by FTP: a name with `.php`, `.phtml`, `.phar`,
`.pht`, `.php3`-`.php8`, `.phps`, `.cgi`, `.pl`, `.py`, `.sh`, `.asp`, `.aspx`,
`.jsp`, `.shtml`, `.htaccess`, `.htpasswd` or `.ini` anywhere after its first
dot, in `assets/` or `uploads/` - the guard files themselves apart. With
no shell on the host, list the tree over FTP and filter the names, e.g. with
lftp:

```bash
lftp -u <ftp-user> <ftp-host> -e 'find anotoki.eu/sub/genshin/assets anotoki.eu/sub/genshin/uploads; bye' \
  | grep -iE '\.(php[3-8s]?|phtml|phar|pht|cgi|pl|py|sh|aspx?|jsp|shtml|htaccess|htpasswd|ini)(\.|$)'
```

(FileZilla's Server → Search remote files with a regular expression does the
same.) The catalogue can be asked too, from your machine as for
[Copying local data up](#copying-local-data-up-to-production) -
`SELECT c.path, f.name, f.extension FROM files f JOIN file_categories c ON
c.id = f.category_id WHERE f.name || '.' || f.extension ~* '\.(php[3-8s]?|phtml|phar|pht|cgi|pl|py|sh|aspx?|jsp|shtml|htaccess|htpasswd|ini)(\.|$)'` -
but it knows only what was catalogued, and the FTP listing is the whole tree.
Delete what turns up - on the Files page (it moves to the trash, which is not
served, and the trash will not put such a name back) or over FTP - and never
open one in a browser.

The real config lives in `config/*.local.php` - beside the release on the host,
never in one - which a deploy never touches; `setup.php` writes it on the server. Never
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
   the next part fails, and from which the site never offers the setup page to
   anybody again - then deletes `config/setup.local.php` and itself. If the
   host would not let it self-delete, remove `setup.php` by hand. Keep the lock:
   without it a site that loses a config file would point visitors at a setup
   page that is no longer there.

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
site runs without it. It needs `pg_dump`, found as `db-dump.php` finds it
(`config/backup.local.php`).

Backups made before the merge hold two dumps, in the pg_dump folders the
Backups page made before anotoki-lib 0.4.1; nothing reads those any more -
restore one by hand with `pg_restore` if you ever need it.

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
page and press **Apply pending** - `POST /api/admin/migrations/apply` makes a
backup of the database as it is, then runs them in order (ADMIN only): the
anotoki library's `anotoki_admin`, `users/`, `genshin_impact/`, the library's
`anotoki_translations` and `anotoki_people` (the library's files come with
`vendor/anotoki/lib`), stopping at the first failure.
From the moment the files are up until they are applied the site is closed to
everybody but its ADMIN (*While an update waits*), so do it in one go: upload,
open the site, **Sign in** on the "being updated" page as an ADMIN, **Open
Migrations**, **Apply pending**.

**The shared library on the host** (2026-10-07, `anotoki-lib` 0.1.0): nothing to
apply - release it (`vendor/anotoki/lib` goes up in the release's
`backend/`; the new pages ask `/api/site-status`, which an older API
answers 404 - read as "not available right now" until the API is there too)
and the site works as before, but for what it does while not ready. Check that
`storage/installed.lock` is on the host (the installer wrote it there): it is
what keeps a site that loses a config file from pointing visitors at a setup
page that no longer exists. The Migrations page is now `/admin/migrations` for
the ADMIN only; editors no longer see it.

**Visitor accounts on the host** (2026-10-05): after the IAM check above, upload
both builds, then Apply pending (`users/044`, `045`, `046`, `genshin_impact/027`
- either order is safe: a build before them is today's site, the migrations
before the build add columns nothing reads yet). Then, once, in a private
window: answer one quiz question - the dashboard's *visitors* card should say
1, which proves the hosting hands `X-Visitor-Key` to PHP (Apache passes `X-*`
headers through as `HTTP_X_VISITOR_KEY`). Behind Cloudflare's proxy, every
request comes from a Cloudflare address, so the per-address limit would count
the whole world as one - since anotoki-lib 0.5.0 Cloudflare's ranges are
committed in `config/visitors.php`, and the visitor's own address is read from
`CF-Connecting-IP` on a connection from them (nothing to upload; a host that is
not behind Cloudflare says so in a `config/visitors.local.php`,
`['client_address' => ['trusted_proxies' => []]]`, which setup.php never writes
and a release never carries or touches) - and, with the origin
secret, only on a request that carries it (*The origin secret on the host*,
below). To stop visitors at once,
switch **Sign-in required** on in the IAM.

**The account's preferences on the host** (2026-10-06): the IAM first - its
build with `POST /api/oidc/preferences` and its migration 015 applied - then
upload both builds here and Apply pending (`users/047` and `048` - after the
upload, never before: 048 drops the columns an older build reads). A site built before
this one keeps its own copy as it did; this one, against an IAM without 015,
keeps every signed-in reader's theme and language on their device, hides the
date and clock choosers, and saves nothing to the account - nothing breaks,
but nobody's choices travel until 015 is there. A session signed in before the
upload brings the account's choices with its next token refresh (ten minutes
at most). The first load after the upload carries a visitor's site theme
(`theme-main` in localStorage) over as the one theme; an admin panel theme kept
apart on a device is forgotten.

**The words through the anotoki library** (anotoki-lib 0.3.0; `users/049`, `050`,
`051` and the library's `anotoki_translations/001`, `002`): before the upload,
export every language from the admin Translations page (the old one: its
Export) and take a database dump (the Backups page). Then upload both builds -
`vendor/anotoki/lib` brings the library's set - and Apply pending at once; in
between, the site is "being updated" and its old pages are gone. `050` moves the
words' tables into the library's shape (keyed by the language's code, no
scopes, flags or stamps; the guides into `guide_contents`) and proves that
every string that was not blank came through word for word, keeping full
copies (`translation_keys_before_library`, `translations_before_library`) for
one release (`users/067` dropped them); it refuses - naming it - a language code that is no code, or a
table that refers to the languages besides the strings. Never before the
upload, and no older build on the host afterwards: it reads the old shape. Then,
signed in, the Translations page shows every string as it was (and the
library's own `anotoki.*` keys beside them), Languages each language's guides,
and Guides the eleven guides.

**Signing in, people and the admin tools through the anotoki library**
(anotoki-lib 0.4.1, 2026-10-11; the files in *While an update waits*, from
`anotoki_admin/001` to `anotoki_people/001`): the IAM needs nothing new (its
sign-in hint and its list of deleted accounts are there already). Upload both
builds - `vendor/anotoki/lib` brings the library's sets - and Apply pending at
once: the Apply backs the database up first (the library's backup, now that
backups need no pg_dump), then moves the audit log and the feedback into the
library's tables, every row under its id, drops `users.email` and the old
feedback form's and callback page's strings. Never before the upload, and no
older build on the host afterwards. Then, signed in as the
ADMIN: the System pages are the library's (an EDITOR sees none of them); the
Audit log shows the old entries as `content.*` and `catalogue.*`, Feedback the
old messages; the People page lists everybody; **Files explorer** → **Rescan**
once, to take the asset tree's snapshot. Add `Disallow: /auth/` to robots.txt
with the frontend's build (the sign-in hint signs visitors in from there). The
asset tree's new `.htaccess` (nosniff; anything but a picture a download) goes
up with `dist/`.

**anotoki-lib 0.5.0 on the host** (2026-10-12; `users/054` in *While an update
waits*): upload both builds - `vendor/anotoki/lib` and the frontend's build go
together - and Apply pending at once (the Apply backs the database up first).
Never before the upload, and no older build on the host afterwards: it would
write the visitors' addresses, which 054's check refuses. Then, signed in as the
ADMIN, on the Backups page, **Back up now**: every backup made before is plain
and unsealed, and restores offline only (*The admin tools*). Nothing to set for
Cloudflare: its ranges are committed (`config/visitors.php`) - unless a
`config/visitors.local.php` on the host lists its own, which then win; check
that one, if it is there. The first answer after the upload hashes the
addresses the old error log files kept (`storage/logs/errors-*.jsonl`); the
pages' own errors start arriving in the Error log as `client`.

**The origin secret on the host** (anotoki-lib PHP 0.5.2, the Angular half
still 0.5.0; the owner's decision of 2026-10-13; no migration): Cloudflare's
ranges are every Cloudflare customer's, not the owner's zone alone - anybody's
Worker can open a connection to the host from them and write the
`CF-Connecting-IP` it likes, a new address every time, past every limit that
counts per address. So the owner's zone adds a secret header to every request
through it, and the site believes `CF-Connecting-IP` only on a request that
carries it; any other request from Cloudflare counts as the edge it came from
(coarser - a Worker's made-up visitors share one bucket - never looser). The
same value in two places, a long random value of 32 characters or more:

1. In Cloudflare: Rules → Transform Rules → Modify Request Header → "Set
   static" `X-Anotoki-Origin` to the secret, for every request of the zone -
   one rule for every anotoki site; a site without the secret pays it no heed.
2. On the host, by hand (setup.php never writes or reads it, a release never
   carries or touches it): `config/cloudflare.local.php` -
   `<?php return ['origin_secret' => '<the same value>'];` - the same file in
   every anotoki site. Keep a copy off the server.

Set the rule first, then the file: the other way round, every visitor counts
as their edge until the rule is there; changing the secret, likewise. Without
the file the site believes `CF-Connecting-IP` from the trusted proxies alone, as
before - deleting it is the one way to switch the secret off. A file that is
there but gives no usable secret **fails closed** (since 2026-10-18, the anotoki
family's rule): one that cannot be read cleanly - saved with a byte-order mark, a
blank line before its `<?php`, no `<?php` line, text after a closing tag, a
typo PHP cannot parse - and one read cleanly whose `origin_secret` is not a
string with something in it (blank, no array, a misspelt or another key, a
number), or a folder in its place: its secret is one no request carries, so
every request from Cloudflare counts as its edge until the file is mended - save
it as UTF-8 without a BOM, starting with `<?php`. What is wrong with the file is said in
the PHP log once (`[settings] ...` and `[cloudflare] ...`) - never its value,
nor what PHP said of it - and never makes the site "not set up"
(`config/cloudflare.php`).

**anotoki-lib 0.11.0 on the host** (2026-10-25): upload both builds - `vendor/anotoki/lib`
and the frontend's build go together - and Apply pending at once (the Apply
backs the database up first): the library's `anotoki_admin/003` (the site
settings' tables), `users/066` (genshin's switches and pages moved into them,
its own tables and the fifteen words nothing asks for any more gone),
`users/067` (the words' old copies and the Privacy page's "Older copies"
line gone), `users/068` (the old multiselect's three "+2 more" words gone:
the admin panel's multiselect is the library's), `genshin_impact/032` (the
lists the character form wrapped, unwrapped), `genshin_impact/033` (the audit
log's and feedback's old copies gone - no leftover tables, at the owner's
word), and the library's words `anotoki_translations/014` and `015`. From
this release on, every guide and voice line saved is kept through the
family's allow-list (`backend/api/rich_text.php`), as the pages draw it; what
was saved before is drawn through it as ever, and cleaned the next time it is
saved. Never before the
upload, and no older build on the host afterwards: it would read tables that are
gone. Then, signed in as the ADMIN: System → **Site settings** shows the switches
and pages as they were. robots.txt and sitemap.xml are the PHP's from this
release on: the old `frontend/robots.txt` goes with the release (the front
controller answers both before any file), and since 0.11.1 their address needs
no file (below).

**anotoki-lib 0.11.1 on the host** (2026-10-25; no migration): upload both
builds together - nothing to Apply. robots.txt and sitemap.xml name the address
a release is put at, `https://genshin.anotoki.eu` (`config/app.php`), with no
`config/app.local.php` to upload; one a host has (the setup page wrote
`https://genshin.anotoki.eu` there from 2026-09-29 to 2026-10-05) still names
its own, and may go. `https://genshin.anotoki.eu/robots.txt` ends with its
`Sitemap:` line.

Serve the site from one address: redirect every other name it answers to
(`www.`, the host's own alias) to the address the IAM knows it by. The IAM's
sign-in hint signs a visitor in with a silent hop to the IAM and back, and the
IAM sends nobody back to an address it was not given - on an alias the hop ends
at the IAM's error, not signed in.

The last step, when you no longer want a way back: what this update took out
of the database is still in files made before it, until you delete them -
`users.email` and the feedback's `ip` and `submitter_hash` in the backup the
Apply made first (`storage/backups/*-before-migration-*.anotoki-backup`, the
Backups page deletes it) and in the old pg_dump folders
(`storage/backups/<stamp>-<hex>/`, `storage/backups/manual/`), and every
request's IP address, as it came, in the old error log files
(`storage/logs/errors-*.jsonl` - since anotoki-lib 0.5.0 a keyed hash there,
their words scrubbed, after the first answer). Remove those by FTP; nothing
reads them any more.

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
| The site shows "This site is not set up yet", or the API answers `503 not_set_up` | `backend/config/*.local.php` are missing or incomplete. Open `http://localhost:8000/setup.php` - it lists what is missing. A file that is there but "does not start with <?php", "prints N bytes of its own" or "cannot be read (ParseError on line N)" (setup.php's list, the PHP log's `[settings]` line) was saved by hand with a byte-order mark, a blank line before `<?php`, text after a closing tag or a typo: save it as UTF-8 without a BOM, starting with `<?php` - setup.php will not save over it until then. |
| The site shows "The site is being updated" (the API answers `503 update_pending`) | A migration file is there that the database has not run - `php migration.php --status` says which. Run `php migration.php`, or as the site's ADMIN sign in on that page, **Open Migrations** and **Apply pending**. |
| The site shows "The site is not available right now" | The database does not answer (Postgres stopped, or the connection is wrong), or - on an installed site - a `config/*.local.php` went missing. `/api/site-status` says which (`unavailable`, `not_set_up`). |
| API cannot connect to the database | Postgres is not running, or the connection in `setup.php` is wrong - its **Test connection** says which. |
| Apply says another database update is running | Another apply holds the migrations lock - the button in another tab, `php migration.php`, `setup.php`. Wait for it, then look again. |
| A new/changed endpoint isn't callable from the frontend | The client is stale - run `npm run api`. |
| An API path with a dot in its last segment 404s in dev | The PHP server was started without `router.php`. Start it with `composer start` in `backend/`, which runs `php -S localhost:8000 router.php`. |
| A page shows a key (`nav.daily`) instead of words | No string for it in the database: a key the code asks for that no migration wrote - `php translations.php --status` lists it. A key put together at run time needs its prefix and tail in `frontend/src/app/shared/dynamic-keys.ts`. |
| The admin Translations or Languages page says to apply the pending database update | The words' tables are not in the library's shape yet: `users/050` and the library's set wait - Migrations → **Apply pending**. |
| Every API call fails in dev (502 or 504 from `ng serve`) | The API is not running on `:8000`, which `proxy.conf.json` hands `/api` to - start it with `composer start` in `backend/`. |
| Admin pages redirect to sign-in | Not signed in at the IAM, or the account holds neither the `genshin` ADMIN nor EDITOR role (grant it in the IAM admin console). |
| Sign-in bounces back with an error | The IAM is not running on 4300/8100, or does not know `http://localhost:4200/auth/callback` - run `php clients.php --dev` in the IAM's `backend/`. `setup.php`'s IAM test checks both. |
| Signed out, the site goes straight to the IAM's sign-in or shows "Sign in to continue" (the API answers 401 `sign_in_required`) | The IAM says sign-in is required for `genshin` - or cannot say: a 404 from `{issuer}/api/public/applications/genshin` (an IAM without that route yet, or one that does not know `genshin`) counts as required, and so does an IAM never reached. `/api/settings/public` shows what the site read (`auth.login_required`); the PHP log says why (`[iam] sign-in required: ...`). |
| Every request answers 401 though signed in | The API cannot fetch the IAM's key set from `http://localhost:4300/.well-known/jwks.json` - the IAM's frontend dev server must be running, it serves the issuer's URLs. |
| A player's games without signing in are gone ("...are no longer kept") | Nobody played in that browser for `keep_days` (30) and the sweep deleted them, or they were moved into an account by a sign-in in that browser - look in the account. A browser that clears its storage loses its key, and with it the games. |
| Signed-out players' games stay in the browser only ("Too many people are playing without signing in") | A visitor limit refused a new one (429 `too_many_visitors`): `max_visitors` reached (the dashboard's *visitors* card), or the per-address / hourly limits - behind a proxy whose ranges are not in `client_address.trusted_proxies` (Cloudflare's are committed; a `config/visitors.local.php` may have replaced them), everybody shares one address. Raise them in `config/visitors.local.php`; existing visitors are not affected. With `users/045` pending the same happens without a message. |
| `php db-dump.php`: "pg_dump was not found" | The PostgreSQL client tools aren't on PATH. Point at them in `backend/config/backup.local.php`. (The admin Backups page needs no pg_dump.) |
| Backups page: making, downloading or deleting a backup answers "Sign in again" (403 `reauth_required`) | It asks for a sign-in at the IAM from the last ten minutes - the button signs in again and comes back. |
| Backups page: a backup's Restore is off, or answers 422 `archive_invalid` ("It carries no seal of this site's") | It was made before anotoki-lib 0.5.0 (plain backups were not sealed then), or it was not made here, or it changed since: restore it offline - download it, unpack it (`tail -n +3 <id>.anotoki-backup \| tar -xz`: its manifest, each set's migrations, each table's rows in COPY's format) and load it into a database by hand (the migrations, then `psql`'s `\copy` table by table, in the manifest's order). Loaded by hand, it does nothing the page's Restore does after the rows: whatever was deleted on the People page or the Feedback page since the backup was made is back, and nobody the IAM deleted since is scrubbed until the next hourly upkeep. So, before opening the site to anybody: on the Audit page, list the `person.data_deleted` and `feedback.deleted` entries from the backup's time (its manifest's `snapshot_at`, else `created_at`) on, and do each again - Delete that person on the People page, delete that message (the same id, sent at the time the entry names) on the Feedback page - then People → **Check now**. Back up now after the update, so there is a sealed one. |
| A request with an old token answers 401 `invalid_token` on a public page's data | A token that does not verify is refused on every path but the boot, the words, the status and the two browser links (the anotoki library's Identify): the pages refresh it and ask again. |
| Locked out of an account (lost password) | Accounts are the IAM's: its dev mail goes to its own `backend/storage/mail/`, and its `reset-password.php` restores access. |

## Handy scripts (from `backend/`)

- `php db-dump.php [--dir=…]` - dump the database (custom format) to a file; prints the `pg_restore` command.
- `php merge-databases.php [--check]` - once, on a checkout still configured with two databases: moves the second into the first.
- `php db-push.php` - copy local data up to another server in one command. ⚠ erases the target (confirmed by typing the host); for seeding a fresh production server.
- `php assets.php --status` - the asset tree against the `files` catalogue and the rows that name it.
- `php translations.php --status` - the translation keys the frontend asks for against the ones the database has, each language's coverage, and stored strings a save would refuse (`--export CODE [FILE]`, `--import CODE FILE`; the anotoki library's command - no key is made here, keys come from migrations).
- `php game-ids.php [--from=<site>] [--write-migration]` - the game's own ids for the characters, weapons and artifact sets by name, a dry run unless asked to write `genshin_impact/031` ([The game catalog](#the-game-catalog-for-the-build-analyzer)); a one-off, the game's lists kept outside the repository.
- `php tests/run.php [file…]` - the backend's tests (`tests/*.test.php`: the upload rules, a version as the pages read it; the words' migration and routes, the game catalog, on `genshin_test_*` databases of their own).
