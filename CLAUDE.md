# anotoki · genshin_impact

A Genshin Impact fan site: a public reference-and-quiz site, plus an admin panel
that maintains its data. Three parts.

| Part | Folder | Stack |
| --- | --- | --- |
| Backend | `backend/` | PHP 8.2+, Slim 4, PostgreSQL |
| Frontend | `frontend/` | Angular 21, standalone + zoneless, signals |
| Docs | `docs/` | Generated HTML reports (`performance/`, `security/`, `reference/`), `PG-DUMP-INSTALL.md`, the logos (`images/`) |

The pre-rewrite Vue codebase (`old/`) is gone from the tree; git history keeps it.

The root holds `.claude/`, `.gitignore`, `CLAUDE.md`, `README.md`, `DEV.md`,
`backend/`, `frontend/`, `docs/`, `tools/` (the host check) and the anotoki
family's formatting setup - `package.json` and `bun.lock` (Prettier alone),
`.prettierrc.json`, `.prettierignore` and `.editorconfig` - nothing else is
committed there, like every anotoki project. In development the untracked
asset tree `assets/` (2.7 GB) sits there too: the backend writes uploads into
it (`_assetsRoot()` in `api/asset_naming.php`) and `ng serve` serves it
(`angular.json`'s `../assets`).
A file that would sit at the root goes where it is used: tooling
into `backend/` or `frontend/scripts/`, images into `docs/images/` or
`frontend/public/`, guides into `docs/`.

Read `docs/reference/reference-*.html` for a generated map of the whole app —
every frontend page, backend endpoint, and database table, cross-linked.

`README.md` says what the site is; `DEV.md` is the human guide — setup
(`setup.php`), running, checking, building and deploying.

Development ports: this site's frontend `http://localhost:4200` and backend
`http://localhost:8000`; the IAM's frontend `http://localhost:4300` and backend
`http://localhost:8100`.

## The code-generation pipeline — read this first

The frontend's API client is **generated from the backend**, not hand-written.
The backend's own route table, response shapes and migrations are read into
`frontend/api-spec.json`, and the typed client under `frontend/src/app/api/` is
generated from that. Editing files under `frontend/src/app/api/` by hand is
almost always a mistake — they are overwritten.

After any change to a backend route, its `responds()` shape, a `DbModel`, or a
migration, regenerate:

```
cd frontend && npm run api       # = api:spec (PHP) + api:client + api:docs
```

Or the steps individually: `npm run api:spec`, `npm run api:client`,
`npm run api:docs`. Method names, query types and response types that the
generator gets wrong are corrected in `frontend/api-config.mjs`
(`QUERIES`, `NAMES`, `BODIES`, `RESPONSES`, `BLOBS`, `GROUPS` / `GROUP_DOCS`), then
`api:client` is re-run. None of it needs a database or config. A route behind
`requireOwner()` (a player's own data) or `requireVisitorKey()` (the move at
sign-in) is marked `owner` / `visitor_key` in the spec, and its method takes a
trailing `context?: HttpContext`: the caller says whom the request is issued
as (a person or this browser's visitor), never the interceptor from whether a
token happens to be there. The **sync-api-client** skill covers this.

## Configuration — `backend/config/*.local.php`, written by `setup.php`

Every value that differs between one installation and the next lives in
`config/*.local.php` (`backend/config/` in a checkout, beside the release on the host) — gitignored, never in a release, and
**required**. There is no committed fallback, environment variable or default
for any of them (`config/local.php` explains why):

| File | Holds |
| --- | --- |
| `database.local.php` | the PostgreSQL connection and the database's name |
| `secret.local.php` | the site secret (an old `jwt.local.php` is read in its place) |
| `iam.local.php` | the IAM's `issuer` and this site's `client_id` there |

Optional: `backup.local.php` (pg_dump paths), `site.local.php` (a site code other
than `genshin_impact`), `visitors.local.php` (the limits on playing without
signing in, and the proxies trusted to name a request's address - committed as
Cloudflare's published ranges, the site being behind Cloudflare; `[]` on a host
that is not - see `config/visitors.php`; never written by setup.php, put on a
host by hand; every value is type- and range-checked, a bad one keeps its
default and is logged once, so a typo such as `keep_days => 0` never sweeps
everybody), `cloudflare.local.php` (the origin secret, the same file in every
anotoki site - see `config/cloudflare.php` and *Visitors* below; never written
or read by setup.php, put on a host by hand; no secret without it). A leftover
`app.local.php` (this site's address, from when the dev frontend called the API
cross-origin) is no longer read.

**Every one of them is read cleanly or not at all** (`localConfigFileRead()`,
`config/local.php` - the anotoki family's rule; Japanese Academy's review of
2026-10-18 added the first five bytes): a file whose first five bytes are not
`<?php` (any case) - a byte-order mark, a blank line or a space before it, no
`<?php` line - is never compiled (with `declare(strict_types=1)` after such a
start PHP could not compile it: a fatal error no handler catches, every request
a 500); one that prints all the same (text after a closing tag, an echo) is
caught and never sent; one PHP cannot parse is said by the kind of its error and
its line - never `$e->getMessage()`, which can quote the file. Such a file is
passed over and said once in the PHP log (`[settings] ...`, by its fault or byte
count, never its text), and is no file - and never in a way that makes the site
looser: a required one leaves the site not set up (never a 500, nothing of it in
any answer - `/api/site-status` included); `cloudflare.local.php` **fails
closed** (a secret no request carries - `originSecretUnmatchable()` - so every
request from Cloudflare's ranges counts as its edge until it is mended), and so,
since the owner's "do as you think is the best" of 2026-10-18, does one read
cleanly that names no usable secret (blank, no array, a misspelt or another key,
a value that is not a string) and anything else in its place, a folder too
(`file_exists()`, never `is_file()`): only deleting the file switches the secret
off; `visitors.local.php` keeps
the limits' defaults and trusts **no proxy** (it may be the file that said `[]`;
a `client_address` or `trusted_proxies` that is no list trusts none either);
`site.local.php` leaves the site not set up (never `genshin_impact`'s switches
read in another site's database); `backup.local.php` is no paths. setup.php
reads its own token file through the same guard, and never saves over a
database, secret, jwt or iam file it could not read (a secret with a BOM is
still the secret). `tests/settings-files.test.php` holds the attacks: a
database file with a BOM, a password and no `<?php` puts the password in no
answer; a BOM or a blank line before `<?php declare(strict_types=1);` leaves the
site not set up, never a 500; an unreadable `cloudflare.local.php` never makes a
forged `CF-Connecting-IP` from Cloudflare's ranges believed.

**No CORS.** The pages and the API are one origin everywhere: the web root in
production, and in development `ng serve`'s proxy (`frontend/proxy.conf.json`:
`/api`, `/.well-known`, `/setup.php` to :8000), with `frontend/public/config.json`'s
API URL empty as in production. The API sends no `Access-Control-*` header and
answers no preflight; no other site calls it from a browser.

Without them the API answers every request `503 {"code": "not_set_up"}` - with
`"setup": "/setup.php"` only while the site was never installed - and the pages
draw "This site is not set up yet" instead of either site; see *Where the site
stands* below.

**`backend/setup.php` writes all of them — in development too.** Run the backend
(`composer start` in `backend/`) and open
`http://localhost:8000/setup.php`: on this computer (the built-in server, a
loopback address, a localhost Host) it needs no token, starts from the
development values (PostgreSQL on port 5432, the database `anotoki_genshin`),
asks for the database and the IAM only (and on a host the setup token - this
site's address is read from the request, `setupSiteAddress()`; on a host
`pg_dump` is found under `~/pgclient` in the account's home, `setupBackupHome()`), has
**Test connection** buttons for the database and the IAM - answering in the
family's words, the same sentences on every anotoki setup page -
shows what is saved (never a secret; a blank password keeps it), applies pending
migrations, and can be run again whenever a setting changes. On a real host it is
the one-time installer: token file, lock, self-delete. Do not hand-edit the
`.local.php` files when setup.php can write them, and never print their contents.

## Where the site stands — the shared library (anotoki-lib)

What the site does while it is not set up, or while its database waits for an
update, is the same on every anotoki site, from one library (the owner's request
of 2026-10-07 - README.md, *Current state*): `anotoki-lib`
(github.com/irelevant25/anotoki-lib, a clone at `../anotoki-lib`), the Composer
package `anotoki/lib` (`backend/vendor/anotoki/lib`, committed with the rest of
`vendor/`) and the npm package `@anotoki/lib` (the release tarball named in
`frontend/package.json`). Never edited here; its README says what each part does.
So, since 0.3.0, are the site's words - *The words* below.

- **The states**, decided on the server for every request (`api/site_state.php`:
  the library's `SiteState` from `localConfigProblems()`, `storage/installed.lock`
  and the migrations): `not_set_up` (a `config/*.local.php` missing or unusable),
  `update_pending` (a migration file the database has not run), `unavailable`
  (the database out of reach), `ready`. `GET /api/site-status` says which, to
  anybody, and passes every gate: it is in the maintenance and sign-in gates' open
  lists, the route gate never judges it, and no page can claim it.
- **The SiteGate** runs first of the global gates (`api/index.php`). `not_set_up`:
  every path 503 `{code: "not_set_up", installed, message}`, with `setup:
  "/setup.php"` only while never installed. `update_pending`: every path 503
  `{code: "update_pending", message}` with `Retry-After: 60` but
  `SITE_OPEN_WHILE_UPDATING` - `/api/settings/public`, `/api/me`,
  `/api/translations/{code}` (exactly: the library's
  `TranslationsRoutes::openPath()`) and `/api/admin/migrations/**` - so
  a sign-in still works, the pages have their words and an ADMIN reaches Apply;
  and the two admin tools that need no table, the error log and the backups
  (exactly the library's `ErrorLogRoutes::openPaths()` and
  `BackupsRoutes::openPaths()` - a backup's restore never), so an ADMIN sees what
  failed and backs up before Apply. `unavailable` and `ready` pass. A path goes in
  that list only when nobody could get to Apply without it.
- **The Migrations page's API** is the library's `MigrationsRoutes`: `GET
  /api/admin/migrations`, `GET /api/admin/migrations/file?set=&name=`, `POST
  /api/admin/migrations/apply` (409 `busy` while another apply runs). ADMIN only,
  judged by the token alone (the library's `RequireRole::admin()`, behind its
  `Identify`): nothing a waiting migration has yet to make may stand between an
  ADMIN and Apply. Apply makes a backup of the database as it is first (the
  library's `Backups::beforeApplyHook()`, through `siteMigrator(..., backups:)`;
  `php migration.php` does too, `setup.php` does not), and after it the audit
  log's waiting entries go in, with `migrations.applied`. Both prefixes are in
  api-config.mjs's `SKIP_PREFIXES` - the library's Angular half is their client.
- **The pages** (`@anotoki/lib/migrations`, configured in
  `frontend/src/app/shared/site-status.ts`): the boot asks the status
  beside the public settings and never stops on an update; `siteStatusInterceptor`
  hears a 503 `update_pending` or `not_set_up`; the root component's
  `<anotoki-site-gate>` around the router outlet - given as a marked template,
  `<ng-template anotokiSitePages>` (`SitePagesDirective` in its imports; without
  the marker the gate draws nothing), so neither site is made while the gate's
  page shows - draws, instead of either site,
  "The site is being updated" (English or Slovak, with a quiet Sign in while nobody
  is signed in) for everybody but this site's ADMIN, who reads "A database update
  is waiting" and "Open Migrations"; both reload by themselves once the site is
  back. That page stands alone (the owner's rule of 2026-10-18; anotoki-lib
  0.6.3 draws it in a `<main>` of its own): no header, navigation or footer
  round it - the public site's header, footer and notes and the admin panel's
  navigation and footer are inside the routed sites, never beside the gate;
  `scripts/screenshots.mjs`'s STATUS holds it in all three states, and the
  frame back once the site is ready. `/admin/migrations` is `<anotoki-migrations-page>`, from its own entry
  point `@anotoki/lib/migrations/page` (so it rides in the admin panel's lazy
  chunk, never the first load), inside the admin layout, the one page that works
  while an update waits. Never installed: "This site is not set up yet" and the
  setup page; installed once: "not available right now", never the setup page. Both
  are drawn with the library's kit in the site's colours, as every page is (*The
  kit and the palette*, under Frontend conventions). The admin panel has no
  anotoki top bar: `.admin-main` sets `--anotoki-topbar-height` to minus its
  padding (on a phone, to its own 56 px row), so the library's sticky heads stick
  flush with its top.
- **Updating the library**: both halves together, to one version - the constraint
  in `backend/composer.json` (`"anotoki/lib": "^0.9.0"`, from the GitHub VCS
  repository; on 0.x a caret takes no next minor) and `composer update anotoki/lib
  --prefer-dist` in `backend/`; the release's tarball URL in
  `frontend/package.json`, then `bun install` (bun.lock), and package-lock.json's
  `@anotoki/lib` entry given bun.lock's version, address and integrity by hand -
  never `npm install`, which would rewrite the whole lock. Read its CHANGELOG.md
  first: while it is 0.x a minor version may break. A release that changes one
  half only is taken in that half (0.2.0 changed the Angular half alone; 0.5.1 and
  0.5.2 the PHP half alone): both halves are 0.9.1 now (never 0.4.0, whose PHP
  failed a search on 8.2). Import a
  piece of the library's kit from its own entry point (`@anotoki/lib/ui/config`,
  `@anotoki/lib/ui/button`, ...), never from `@anotoki/lib/ui`, which would pull
  every piece into the first load.

## The words — through the library (anotoki-lib 0.3.0)

The site's languages, keys and strings are kept in the anotoki family's one
shape and read and written by the library's translations module (both halves),
since `users/050` moved this site's tables into that shape. The owner's
decisions for the move: keys come from migrations only (no route, import or
command makes one), their descriptions are the code's, the guides behind the
question marks are content of their own, and who may change the words stays
ADMIN or EDITOR, languages too.

- **Server**: `api/translations.php` is the site's part - `siteTranslations()`
  (the library's `Translations`, released languages `en` and `sk`), the error body
  `{error, code, ...}` (`translationsError()`), the writer (`translationsActor()`,
  from the token), the audit log (`translationsAudit()`, into the library's
  `anotoki_audit_log` under its own names - `language.*`, `translations.saved|
  imported` - `api/audit_log.php`), and `GuideLanguageUsage` (a language's guides: counted on the
  Languages page, gone with it). The routes are the library's
  (`routes/users/endpoints/translations.php`): `GET /api/translations/{code}`
  (public: `{language, languages, values, english?}`, snake_case, ETag) and, behind
  `requireAuth()` + `requireRole(...ROLES_CONTENT)`, `GET /api/admin/languages`,
  `GET|PUT /api/admin/translations`, `GET .../{code}/export`, `PUT .../{code}/import`,
  `POST /api/admin/languages`, `PUT|DELETE /api/admin/languages/{code}`. They are
  in api-config.mjs's `SKIP_PREFIXES`: the library's Angular half is their client.
- **The schema**: `translations` / `translation_keys` / `languages` keyed by its
  code, no scopes, flags or stamps; the library's own set `anotoki_translations`
  (`vendor/anotoki/lib/backend/migrations/translations`) runs after both folders
  (`migrationSetNames()`, `api/migration_runner.php`) - its 001 proves the shape,
  its 002-009, 012 and 013 add the library's words under `anotoki.*` (the kit's, the
  status page's, the sign-in page's, the feedback form's, the legal pages' 122,
  the top bar's, the kit's newer pieces', the tabs', the inputs', - 012,
  0.6.3 - the family's footer's four and - 013, 0.8.0 - the About and Support
  pages' and the footer's links to them),
  and 010-011 reword the Privacy page's sentences where nobody saved them, which
  the owner may reword like any string. `anotoki.` is the
  library's namespace: never a key of this site's. `translation_keys_before_library`
  and `translations_before_library` are 050's full copies, kept for one release.
- **The guides** (`api/guides.php`, `routes/users/endpoints/guides.php`,
  `guide_contents`): `GET /api/guides/{guide}?language=` (public: the reader's
  language, English where the guide has none), `GET /api/admin/guides`,
  `PUT /api/admin/guides/{guide}` (ADMIN or EDITOR; English never blank). Markup,
  kept as it was written - the server has no allow-list - so it reaches a live
  page only through the page's (`rich-html.ts`): drawn by `<app-rich-text>`, and
  loaded into the HTML editor through `sanitizeRichHtml()` (an `<img onerror>` an
  EDITOR saved never runs in an ADMIN's browser); made by migrations, edited on
  the admin Guides page. The voice-overs' `text_*` columns are the same.
- **Pages**: `@anotoki/lib/translations` - its `TranslationService` (the reader's
  language, the account's while its choices apply, `effectiveLanguage()` English in
  the admin panel for its staff), its `translate` pipe in every template, the kit's
  words (`forKit()`, `app.config.ts`) and the status page's (`siteStatusWords()`),
  configured in `shared/site-translations.ts`; `noteAddress()` from the root
  component after every navigation. The admin Translations and Languages pages are
  the library's (`@anotoki/lib/translations/admin`, lazy, with
  `anotokiUnsavedChangesGuard`); Guides is this site's
  (`sites/admin/localization/guides/`).
- **Command line**: `php translations.php` is the library's `TranslationsCommand`
  with this site's `KeyScanner` (`--status`, `--export`, `--import`); keys put
  together at run time are declared in `frontend/src/app/shared/dynamic-keys.ts`.

## Signing in — the anotoki IAM

This site has no login of its own: no local accounts, nothing in setup.php to
choose. Every anotoki site signs people in through
one identity provider, the **anotoki IAM** at iam.anotoki.eu (repository
`../anotoki-iam`; its `docs/integrating-an-app.md` is the contract).
Registration, passwords, emailed codes, Google, two-factor, sessions, the account
page and the admin pages for accounts all live there.

- **Frontend**: the anotoki library's auth module (`@anotoki/lib/auth`, since
  0.4.1; set up in `shared/site-auth.ts`) - the IAM's browser SDK ported into
  the library, under the same storage keys (nobody was signed out by the move).
  It does the OpenID Connect code flow with PKCE - "Sign in" goes to the IAM
  and comes back to `/auth/callback`, the library's page ("Signing you in…", or
  its screen of a sign-in that did not work - why, from the code alone, with Try
  again and Back, in the library's words `anotoki.signIn.*`; `noindex`, and
  `public/robots.txt` says `Disallow: /auth/`; the library puts a failed
  sign-in's address back where it started, so the app initializer moves it to
  `/auth/callback` before the router starts; since 0.5.0 both screens load as
  they are shown, from `@anotoki/lib/auth/screens` - the route's
  `AuthCallbackComponent`, and the sign-in card's and closed sign's
  `<anotoki-sign-in-failure-route>`, never in the first load) - and its interceptor
  (`anotokiAuthInterceptor`, after the site's own `http.interceptor.ts`) sends
  the access token as `Authorization: Bearer`. The issuer, the client id,
  `login_required` and `sign_in_available` come from `GET /api/settings/public`
  (`auth`, read first at boot) - the page never asks the IAM. **The IAM's
  sign-in hint**: genshin lets visitors in, so a visitor who is signed in at the
  IAM (its `anotoki_signed_in` cookie, which opens nothing) is signed in here
  with one silent `prompt=none` hop at boot - once per hint value, at most once
  a minute, never from a frame or while the site is blocked, never for a crawler
  (which holds no cookie); and a session follows the IAM: signed out there is
  signed out here at the next page load. `SecurityService` is this site's view
  of it - its signals, and this site's own record of the person from `/api/me`
  (the name, the one role, when they first came; the address is the token's,
  the site keeps none). A page shown to a person whose session then ended goes
  on as a visitor's page: its requests that say nobody in particular go bare
  (`http.interceptor.ts`); a player's own data is always issued as somebody.
- **Backend**: the anotoki library's auth module (anotoki-lib, since 0.4.1,
  `Anotoki\Lib\Auth`, set up in `api/admin_tools.php`) - the IAM's PHP SDK this
  site kept a copy of is gone. Its `Identify` runs once for every request, in
  front of the gates (`identifyRequests()`, `meddleware/auth.php`): an
  `Authorization: Bearer` token is checked by its `AccessTokens` (RS256 and
  `typ at+jwt` pinned, a `kid` of the IAM's key set, issuer, audience `genshin`,
  expiry) - a person, or 401 `invalid_token` on every path but
  `TOKENLESS_PATHS` (the status, the words' bundle, `/api/settings/public`,
  `/api/files/raw` and the two links an admin's browser opens), which read no
  token at all: Identify is not asked there, the request gets the attributes it
  gives nobody - taking the header off would not do, as the library reads the
  server's copies of it too (`HTTP_AUTHORIZATION`, `REDIRECT_HTTP_AUTHORIZATION`,
  set by php-fpm, CGI and `php -S`); `Basic ...` is nobody; no cookie is ever read as somebody, the
  IAM's sign-in hint least of all. `api/site_user.php` (`siteUserOf()`) keeps the
  `users` row - id = the IAM user id, the name - through the library's
  `PeopleRecorder`; no address (users/052: the IAM holds it, `/api/me` answers
  the token's). Config: `config/iam.local.php` (dev: issuer
  `http://localhost:4300`), read by the library's `IamClient::fromArray()` - the
  SDK's keys; its key set and switch answer kept in `storage/cache` as before.
  Never a fetch of the IAM of our own beside the library.
- **The theme, the dates, the clock and the language are the account's** (the
  IAM's migration 015, the owner's decision of 2026-10-06; its
  `docs/integrating-an-app.md`, "The account's preferences"): one choice every
  anotoki site follows - this one's admin panel included, which has no theme of
  its own any more. The library's `AnotokiAuth` carries them (`preferences()`,
  `locale()`), and the library's `AccountPreferences` (`@anotoki/lib/auth` -
  this site's own, moved into the library) is the one place
  that says when they apply and that saves to them (`save()`): one
  save at a time, the latest choice of each last, one preference a request. They
  apply only while somebody is signed in here and `preferences` is not null - a
  visitor, or an IAM before 015, keeps the device's: the theme and the language
  in localStorage (`theme` - the old `theme-main` carried over once - and
  `language`), the dates the device's way (`auto`). The language follows that
  rule too, though the IAM always had it: following it while a choice made here
  could not be saved back would undo the choice at the next load. The choosers
  (the account panel, the admin panel's theme button) show a choice at once and
  save it after; a refusal puts the account's theme or format back and says so,
  keeps a refused language for the visit and says so (the public shell's toast,
  on the library's `languageNotSaved`), and a language the IAM does not offer
  (`invalid_request`) stays this site's for the visit, silently. The language's
  saving and following are the library's `TranslationService`
  (`shared/site-translations.ts` hands it `AccountPreferences`'s language and
  save). `ThemeToggleService`, `DateFormatService` and
  `TranslationService` follow the account's values whenever they change (another
  site, another tab), but not while a choice of the same one is on its way. The
  API keeps no copy: `/api/me` answers no preference, the `PUT /api/me/theme`,
  `/language` and `/formats` routes are gone, and `users.theme_main`,
  `theme_admin`, `language`, `date_format` and `time_format` (with the
  `themes` lookup) went with `users/048`, at the owner's word.
- **Sign-in required** is the IAM's switch, per site (its admin console:
  Applications → genshin → Settings), off for this site by default - a
  reference work anyone can read. The backend reads it with the library's
  `SignInRule` (`siteSignInRule()`, `api/admin_tools.php`; `signInRequired()` in
  `api/site_settings.php` logs an odd answer): `GET
  {issuer}/api/public/applications/genshin`, kept a minute in `cache_dir`
  (`storage/cache` - a private folder), and **fail closed**: a 404 (the IAM does
  not know the site, or switched it off) means required, an IAM out of reach
  keeps the last answer, or required when there never was one; one answer a
  request. It is relayed in `GET /api/settings/public` as the library's
  `AuthRoutes::configBody()` - `auth.login_required` and `auth.sign_in_available`
  (false once the IAM said it does not know the site: no sign-in offered, the
  hint sends nobody) beside the issuer and client id - the frontend never asks
  the IAM. While on, the library's `SignInGate` (`api/meddleware/sign_in.php`)
  answers every API path 401 `sign_in_required` to a request without a verified
  token, except `SIGN_IN_OPEN_PATHS` (exactly: `/api/settings/public` and
  `/api/translations/{code}` - what the sign-in card needs, its words with the
  languages beside them - `/api/site-status`, and what a browser loads without a
  token: `/api/files/raw`, the asset previews; `/api/admin/files/raw`, the file
  explorer's signed previews; `/api/admin/backups/{id}/file`, a backup's
  single-use download); a signed-in request never asks the switch. The files
  under `assets/` stay reachable by address (the web server's, out of PHP's
  reach - game art only). Only `Authorization: Bearer` claims to be somebody
  (the library's Identify): a bearer that does not verify answers 401
  `invalid_token`, `Basic ...` is no claim at all. The frontend's half (`loginRequired` in
  `SiteSettingsService` - the auth module's, which fails closed: true unless the
  settings said false, and true from the moment a visitor's request is refused
  `sign_in_required`): while it is on, the app initializer sends somebody
  signed out to the IAM before the first page is drawn and back to the
  address they opened - never on the callback, after a sign-in that came back
  failed, while the SDK holds a session the API refuses (the admin gate's
  no-loop rule) or while maintenance has the site closed - and the public
  site's shell draws the sign-in card (`sites/main/common/sign-in-required/`)
  instead of itself for as long as nobody is signed in (a refused sign-in is
  explained there; a sign-out in another tab puts it up). The closed sign
  outranks it, as on the API.
- **Visitors** (playing without signing in, while the switch is off): the
  server keeps a visitor's games and statistics under a visitor of its own -
  a `users` row with a negative id, opened by a key the server made, sent
  back in `X-Visitor-Key` (*Visitors* below). Who a request to a player's own
  routes (`/api/quiz/progress`, `/result`, `/stats`, `/activity`, `/results`,
  `/progress/carry`) is, is `requireOwner()`'s alone, in this order: a
  `Bearer` header - that person, or 401 `invalid_token` from the library's
  Identify before any route runs - the key never read;
  else sign-in required - 401 `sign_in_required`, the key never looked up;
  else a key - that visitor or 401 `visitor_unknown`; else nobody, who reads
  nothing (`[]`) and whose first save **with a play** makes a visitor inside
  that save's transaction (a fresh draw, which every quiz saves on a page
  view, makes nobody: 422). A visitor never passes `requireAuth()` /
  `requireRole()` / `isAdminUser()`: no `/api/me`, no admin route, no
  feedback reading, nobody else's row. The browser's own games are carried
  in once by `POST /api/quiz/progress/carry` (the account's game stays where
  both have one; a daily of another day never moves). Every owner answer is
  `Cache-Control: private, no-store` with `Vary: Authorization, X-Visitor-Key`.
  `/api/settings/public` relays `visitors: {available, keep_days}` (`available`
  false while `users/045` waits). **The move at sign-in**,
  `POST /api/visitor/move` (`routes/users/endpoints/visitor.php`,
  `visitorMove()`), takes the token AND the key (`requireVisitorKey()`, the
  only other reader of the key - never who a request is, only what moves):
  allowed whatever the switch, one transaction locking the visitor's row then
  the person's with `move_lock_timeout_ms`; the person's saved game stays
  where both have one for a quiz (a daily of another day never moves, and the
  person's of another day is replaced by the visitor's of today), every log
  row moves as it is and the totals are added, then the visitor is gone;
  repeatable (a key nobody has: `{found: false}`), 503 `visitor_move_retry`
  with `Retry-After` when another request held the rows. **After a silent
  sign-in** (the owner's decision of 2026-10-11): the page sends `silent: true`
  when the session was made by the IAM's sign-in hint without a click
  (`shared/silent-sign-in.ts` - the library's IAM client, given as
  `ANOTOKI_AUTH_CLIENT_FACTORY` in `app.config.ts`, notes the callback's
  `AnotokiInitResult.silent` in localStorage `genshin-silent-sign-in`, the
  account's id; a sign-in the person makes clears it), and the visitor then
  comes only into an account with nothing here yet - no row in any of
  `VISITOR_PERSON_TABLES`, a fresh draw included (`personHasData()`, asked
  under the move's locks). Into one that has, nothing moves: `stayed: true`
  with zeros, the visitor untouched under its key, which `VisitorKey` keeps
  (that page load asks no more; the next asks again) until a sign-in the
  person makes, which moves it as above. The carry of the games the browser
  kept by itself (`POST /api/quiz/progress/carry`) follows the same rule: a
  person's carry with `silent: true` into such an account writes nothing and
  answers `stayed: true` (zeros, the account's own games), and
  `QuizProgressService` keeps the browser's games (`app_data`) for when nobody
  is signed in here again or the person signs in themselves; on a visitor's
  carry `silent` says nothing. Never a silent merge into an account with its
  own here; `silent` other than true or false is 422 on both. **The pages'
  half** (the auth module's `issuedAs()`, interceptor and `SavesInFlight`, set
  up in `shared/site-auth.ts` - the key goes on a player's own routes only;
  `shared/local-lib/services/visitor-key.service.ts`, the site's key store and
  the move, its key handed to the move's request through `http.interceptor.ts`;
  and `QuizProgressService`): a request to a player's own routes is issued as the
  person or as this browser's visitor (`issuedAs()`, an `HttpContext`) from
  what the page shows - never decided from whether a token happens to be
  there; a person's request whose token comes back null is never sent (it
  fails in the browser as 401 `sign_in_required`), so it can never go out
  bare and make a visitor holding the person's game. The key (localStorage
  `genshin-visitor`, read at send time, the first key kept) goes only on a
  visitor's requests, only while sign-in is not required and
  `visitors.available`; it is kept - not sent - while sign-in is required,
  forgotten on `visitor_unknown` (only while it is still the one sent) and
  after the move, which `VisitorKey` runs after every sign-in while a key is
  held; a person's first load of their games waits for it (`settledMove()`,
  pending whenever signed in with a key held). Only a save with a play makes
  a visitor: nobody's carry of the browser's games, the one just played among
  them; a result recorded just before it waits for it, and saves made
  meanwhile are sent again as the visitor's. Once the server keeps the games
  (a person, or a visitor) nothing is written to the browser, and a person's
  first load carries the browser's own games in, once. A quiz page holds a
  ticket (`QuizProgressService.ticket()`): when the owner changes under it - a
  session that ended, a sign-in or a visitor in another tab, a move - its
  saves are dropped and it loads again (`restarts`); after a person's session
  ends under an open page, no visitor is made for the rest of that page load.
  A sign-in waits for the saves on their way (`SavesInFlight`), or a new
  visitor's key would be lost with the page. `/admin` never plays as a
  visitor. **What a visitor is told** (`visitor.*`, `users/046`, informal
  Slovak): the notice (`sites/main/common/visitor-notice/`: how long the
  server keeps their games - `visitors.keep_days`, relayed, never a number of
  the page's own - and a Sign in button) on the Profile always, on the quizzes
  hub and the Daily page once this browser holds a key; the public shell's
  toasts, once each (`sites/main/app.component.ts`: what a move or a person's
  carry brought and what the account kept - `VisitorKey.moved`,
  `QuizProgressService.carried`; a key the server no longer knows -
  `VisitorKey.lost`; a make or a result refused - `QuizProgressService.refusal`
  'busy' / 'full'); a line on the sign-in card while a key is held. The
  services keep only the facts; the words are the shell's. The admin
  dashboard's *visitors* card (`DashboardVisitors`) counts them against
  `max_visitors`.
- **Roles** (`MEMBER`, `ADMIN`, `EDITOR`) are granted per site in the IAM's admin
  console and arrive in the token; revoking one reaches this site within one
  token lifetime (10 minutes). Every account holds `MEMBER` - an ordinary reader,
  `USER` here (`siteRoleFromClaims()`); nothing asks for it. Taking a person's
  MEMBER away is how the IAM blocks them from this site: it refuses their next
  sign-in and refresh, while the token they hold verifies until it expires
  (minutes) - and while sign-in is not required they can still read the site
  like anybody, and play as a visitor. To keep somebody out entirely, require
  sign-in.
- **Locally**, sign-in needs the IAM running: its API on 8100 and its pages on
  4300 (see the IAM's DEV.md). It registers `http://localhost:4200` for
  `genshin` by default; `php clients.php --dev` in its `backend/` puts that back.
  setup.php's IAM test says whether it answers and knows this site.
- **Scripts** (the benchmark, anything that calls the API from outside) use a personal token
  from the IAM account page ("Tokens for scripts"), exchanged at the IAM's token
  endpoint - never an email and password.

## Commands

```
# Backend (from backend/)
composer start                       # dev server: php -S localhost:8000 router.php (mimics the production Apache; serves /setup.php too)
                                     # then http://localhost:8000/setup.php on a fresh checkout
php migration.php                    # create missing + apply pending migrations, after a backup (the library's)
php migration.php --status           # what has run and what is pending
php migration.php --dry-run          # what would apply, applying nothing
php migration.php --folder=users     # one set only (users, genshin_impact, or the library's anotoki_admin,
                                     # anotoki_translations, anotoki_people)
php db-dump.php                      # a pg_dump of your own (the admin Backups page needs no pg_dump)
php merge-databases.php              # once, on a checkout still configured with two databases
php assets.php --status              # the asset tree against the catalogue and the rows naming it
php translations.php --status        # the keys the frontend asks for against the database's; each language's coverage
php translations.php --export sk [f] # a language's own strings as flat JSON; --import sk f puts them back (no new keys)
php game-ids.php [--from=<site>]     # the game's ids for the rows by name, a dry run (--write-migration writes
                                     # genshin_impact/031; the lists kept outside the repository, --cache=<folder>)
php tests/run.php                    # the backend's tests: the upload rules (no database); the words' migration and
                                     # routes, the game catalog and its ids, the quizzes' levels (every rule, the routes,
                                     # users/061), the library's data moves, every admin route's permissions, sign-in,
                                     # the gates, a restore doing again the deletes since its backup, the pages'
                                     # error reports, where a request comes from (Cloudflare; with the origin
                                     # secret, only through the owner's zone) and what is kept of
                                     # it (keyed hashes), what a silent sign-in brings in (the move, the carry),
                                     # every settings file read cleanly or not at all (the attacks it stops),
                                     # migration.php (genshin_test_* databases of their own on the
                                     # PostgreSQL server config/database.local.php names - never its database -
                                     # and a backend copy). They must pass on PHP 8.5 (the owner's rule of 2026-10-12)

# Frontend (from frontend/)
npm start                            # bun ci, then ng serve on :4200 through proxy.conf.json (/api etc. to :8000)
                                     # - it does not regenerate the API client: npm run api after an API change
npm run api                          # regenerate the API client (see above)
npm run lint
cd .. && bun run format:check        # Prettier on every file of both halves, at the root (bun install there first)
node scripts/screenshots.mjs         # every page and its dialogs in headless Edge, light and dark, 1280 and 390 px:
                                     # screenshots to compare before and after a change to the pages, and what a
                                     # picture hides (wider than a phone, console errors, a key shown as a word);
                                     # a sign-in the IAM refuses (the library's screens of it), the legal pages in
                                     # English and Slovak (and one while sign-in is required), and an error
                                     # thrown in a page, read back from the error log, scrubbed - the Errors
                                     # page's row, and that row opened; the status page alone in its three
                                     # states (light English, dark Slovak) and the frame back after; the public
                                     # footer (light English, dark Slovak) and the account panel's wallpapers; the
                                     # top bar's items opening and closing their sections; the quizzes at saved
                                     # levels (the browser answering /api/quiz/levels) and at the built-in ones
                                     # when that fails; the Quiz levels page (problems as typed, the words levels
                                     # leave behind, a save and back); the
                                     # admin panel's footer, its two dialogs, and Migrations while an update waits.
                                     # A production build, a throwaway database and backend copy
                                     # (backend/tests/tools/browser-env.php) and the library's stand-in IAM, all
                                     # removed after; --out, --only admin-, --no-build. PHP=<a PHP 8.2+> where php is older

# Production build (see Deployment)
cd frontend && bun run anotoki-deploy build   # → dist/frontend/ + dist/backend/: the release (deploy skill)

# Docs generators (from repo root)
node docs/reference/build-docs.mjs
node docs/performance/bench-endpoints.mjs <personal-token>     # (an IAM token for scripts) then:
node docs/performance/build-report.mjs
node docs/security/build-report.mjs                            # after re-running the tools
```

## Backend layout & conventions

- **One database, two halves.** Everything is in one PostgreSQL database, like
  every anotoki project. Its two halves were separate databases once and keep
  their own folders: `genshin_impact` (the game content) and `users`
  (translations, languages, site settings and page switches, and this site's
  small record of each person - name, address; the accounts themselves, and how
  each person likes the sites to look, are the IAM's). Routes live in `backend/api/routes/genshin_impact/`
  and `backend/api/routes/users/`, each with `endpoints/`, `models/`,
  `responses/`; `genshinDb()` and `usersDb()` say which half a query is about and
  hand back the same connection. A checkout still configured with two databases
  (`'databases'` in `database.local.php`) is refused until
  `php merge-databases.php` has moved the second into the first.
- **Endpoints** are `$app->get(...)` calls at the top of a file that is
  `require_once`'d in `backend/api/index.php`. They end with a middleware chain:
  `->add(responds(...))->add(requireRole(...ROLES_CONTENT))->add(requireAuth())`.
- **`responds($shape, list: bool)`** declares what an endpoint returns — a
  snake_case table name (schema read from replayed migrations) or a PascalCase
  `ResponseShape` subclass in `responses/`.
- **`DbQuery`** (`backend/api/db_query.php`) is the query builder — always
  parameterised; table/column identifiers come from literals or whitelisted
  `DbModel` fields, never request input.
- **`DbModel`** (`backend/api/model.php`) subclasses in `models/` map a table:
  constructor params are the columns; `fromBody()`/`toDbArray()`/
  `partialToDbArray()` whitelist by those params (no mass assignment).
- **`registerFullResource()`** (`backend/api/full_resource.php`) is the shared CRUD
  for a parent-with-children resource (weapons, artifacts, foods, enemies,
  materials, banners) — see the `*_full.php` endpoints. Response metadata for
  these comes from `fullResourceShapes()`.
- **Characters are the exception**: `characters_full.php` is hand-written, and a
  character's talents (with their costs), ascensions, constellations and
  voice-overs belong to shared **sets** (`characters_*_sets`, migrations 016–020)
  that the character points at, so the Traveler's variants share one copy. It
  writes through the set, and leaves alone a set the character was just
  repointed at.
- **Migrations are the schema.** `backend/migrations/{users,genshin_impact}/NNN_name.sql`,
  applied in order by `php migration.php` - `users/` first, then `genshin_impact/`,
  into the one database, and recorded in its `migrations` table by folder and file
  name. There is no separate schema file; the database is what you get by
  replaying them. Both folders share one namespace: a new table, index or
  function must not take a name the other folder uses. A `users/` migration
  never names a `genshin_impact/` table - on a fresh install every `users/` file
  runs before `genshin_impact/001` makes the content and quiz tables - so a
  change that touches both halves is two files (`users/045` the visitors,
  `genshin_impact/027` the quiz history's index). (The order matters for
  history: `users/001` made an account table called `roles`, which `users/040`
  dropped before `genshin_impact/` makes its own; running `users/` over a database
  that already holds the content is refused - `migrationsOrderRefusal()`, the
  engine's `beforeApply`.) Migrations that change data
  carry a `DO $$ … $$` verification gate that fails loudly if the result is
  wrong. Never edit an applied migration — add a new one (old ones still say
  `php/` and `angular/` in their comments; leave them). Around both folders come
  the library's own sets (anotoki-lib 0.5.0, in its README's order), each recorded
  with `folder = '<set>'`: `anotoki_admin` FIRST (the admin tools' tables,
  `anotoki_audit_log` and `anotoki_feedback` - `genshin_impact/028` and `029`
  moved the old `audit_logs` and `feedback` into them, every row under its id;
  nothing else makes an `anotoki_*` table), then `users/` and `genshin_impact/`,
  then `anotoki_translations` (*The words*) and `anotoki_people` (the scrub's two
  tables, after `users/052` readied `users`): a site migration never depends on
  a library file but `anotoki_admin`'s tables, writes only the words' base
  columns, and its gate never counts keys outside this site's own namespaces
  (`anotoki.` is the library's). The engine is the anotoki
  sites' shared one, anotoki/lib's `Migrator` (*Where the site stands*), set up
  for this site in `backend/api/migration_runner.php` (`siteMigrator()`: the sets
  in order (`migrationSetNames()`), the lock `MIGRATION_LOCK`, `prepare` adopting
  the record table from when each folder had a database of its own,
  `beforeApply` the order guard - which lets `anotoki_admin` be missing where
  everything after it ran, as on every database installed before 0.4, and
  refuses `--folder` of a later set while it has not run - and, for the button
  and the CLI, a backup of the database before anything runs): the CLI, the
  admin **Migrations** page's *Apply pending* (`POST
  /api/admin/migrations/apply`, ADMIN — for hosts with no shell), the installer
  `backend/setup.php` and `merge-databases.php` all build the database the same
  way, one apply at a time (another one meanwhile is told it is busy). Until a
  file is applied, the site is closed to everybody but its ADMIN. A closed set of values is a `CHECK (col IN (...))` on the column —
  `characters.arkhe` (022), `characters_voice_overs.type` (025) — not a lookup
  table or a Postgres ENUM: the spec generator reads the CHECK into a TypeScript
  union. Its replay understands CREATE TABLE, ALTER TABLE (add, drop, rename or
  retype a column; add a CHECK) and DROP TABLE; anything else changes the
  database without changing the generated client.
- **Config** is read through `config/local.php` (`localConfig()`), one module
  per concern: `db.php`, `secret.php`, `iam.php`, `site.php`, `backup.php`,
  `visitors.php`, `cloudflare.php`. A value that differs per installation goes in a `.local.php`
  that setup.php writes, never in a committed default - but for the optional
  ones, whose committed defaults are safe (`visitors.php`'s limits, and its
  trusted proxies - Cloudflare's ranges, the site being behind Cloudflare; a
  host that is not says `[]` in `visitors.local.php`; `cloudflare.php`'s
  origin secret - none without `cloudflare.local.php`, as before).
- **Visitors** (playing without signing in) live in `api/visitors.php`, the
  only code that makes, finds, locks or sweeps one: a `users` row with a
  negative id, `username` 'visitor', the SHA-256 of a key the server made
  (`users/045`). `visitorMake()` runs only inside the transaction of the save
  that makes the visitor (a refused save makes nobody and counts nothing), under
  the limits; `visitorLock()` takes the row before anything is written for it
  (the quiz tables have no foreign key to `users`); `visitorSweep()` deletes the
  unseen after `keep_days`, after the answer (`api/after_response.php`). A table
  keyed by the user id goes into `VISITOR_PERSON_TABLES`. The address the limits
  count is `clientAddressCounted()` (`api/client_address.php`, the one reader of
  an address, over the library's `ClientAddress` - the owner's rule of
  2026-10-11: REMOTE_ADDR, or `CF-Connecting-IP` on a connection from one of
  `config/visitors.php`'s trusted proxies, committed as Cloudflare's published
  ranges; never `X-Forwarded-For`; IPv6 by /64 - and, with the origin secret,
  only on a request that carries it: the owner's decision of 2026-10-13,
  anotoki-lib 0.5.2. Cloudflare's ranges are every Cloudflare customer's -
  anybody's Worker can connect from them and write the `CF-Connecting-IP` it
  likes - so a Transform Rule of the owner's zone adds `X-Anotoki-Origin` with
  a secret to every request; the site keeps the same value in the optional
  `config/cloudflare.local.php` (`originSecret()`, `config/cloudflare.php`;
  never printed or logged) and counts any other request from Cloudflare as
  its edge - coarser, never looser; without the file, as before - deleting it
  is the one way to switch the secret off; with one that cannot be read
  cleanly, or names no usable secret, or anything else in its place, a secret
  no request carries - fails closed, never "no secret" (*Configuration* above;
  `tests/origin-secret.test.php`,
  `tests/settings-files.test.php`), and the AdminContext hands
  the library the same rule (`originSecret:`); what `visitor_starts` keeps of it is
  `clientAddressHash()`, a keyed HMAC (users/054) - never the address, nowhere
  (`tests/addresses.test.php`). An answer decided deep inside
  the work is thrown as `ApiRefusal` (`api/helpers.php`) and answered by the
  default error handler as `{error, code[, params]}` - no trace, no PHP log line
  (an owner route answers its own, `apiRefusalResponse()`, with the private
  headers). A player's own data is read and written only behind
  `requireOwner('empty' | 'make' | 'refuse')` (`meddleware/auth.php`: the one
  reader of `X-Visitor-Key` that says who a request is; `requireVisitorKey()`
  reads it only beside a person's token, for the move), and written only
  through `ownerWrite()` - one transaction that makes the visitor (`'make'`)
  or locks its row first - with `withVisitorMade()` putting a new key on the
  answer and `ownerPrivate()` the `Cache-Control` / `Vary` on every answer.
  `visitorMove()` is the one place a visitor's rows become a person's: a table
  added to `VISITOR_PERSON_TABLES` needs its own rule there (the move refuses
  to run until it has one).
- **Auth is the anotoki IAM's** (see *Signing in* above), through the anotoki
  library's auth module. `identifyRequests()` (`api/meddleware/auth.php`, the
  library's `Identify`) says who every request is, once; `requireAuth()` then
  wants a person (401 `sign_in_required` for nobody) and puts `user` on the
  request - this site's record of the person (`siteUserOf()`, the library's
  `PeopleRecorder`) plus the `role` the token grants here (ADMIN / EDITOR / USER)
  - and `session` (the IAM's `sid`). Role groups: `ROLES_CONTENT` (ADMIN/EDITOR,
  writing game content - and the words: strings, languages, guides - and the
  quizzes' levels),
  `ROLES_SYSTEM_READ` (the dashboard), `ROLES_SYSTEM_WRITE`. Ownership via
  `requireSelfOrAdmin` / `refuseForeignUserId`. The library's admin tools and the
  Migrations routes are ADMIN's alone, judged from the token (`RequireRole::admin()`).
  The global middleware runs in this order (`api/index.php`; each says what it
  leaves open): the shared library's `SiteGate` (503 while the site is not set
  up or an update waits - `api/site_state.php`); inside it the people's hourly
  scrub and the day's backup (after the answer); `Identify` (401 `invalid_token`
  for a token that does not verify, but on `TOKENLESS_PATHS`); the audit log's
  context (who acts, from which session); `maintenanceGate()` (503 while the
  site is closed); `signInGate()` (the library's `SignInGate`: 401 while the IAM
  requires sign-in) and `routeGate()` (423 for a page's locked API paths).
  `/api/site-status` passes them all. Only a path the sign-in card needs, or one
  a browser loads without a token (an `<img>`'s, the admin tools' two links),
  goes in `SIGN_IN_OPEN_PATHS` (exact paths, or a `~` pattern - never a
  prefix); in the other lists an entry that starts with `~` is a pattern the
  whole path must match (`gatePathOpen()` - the words' bundle, exactly
  `/api/translations/{code}`), any other is a path with everything under it. A
  gate judges the path the router routes on,
  `gatePath()` (`meddleware/maintenance.php`: decoded once, as Slim decodes it) -
  never `getUri()->getPath()`, which keeps the percent-encoding: `/%61pi/characters`
  is routed to `/api/characters`. The sign-in gate has no "outside `/api/`"
  shortcut: what reaches it is the API, open by its list or behind the switch.
- **The admin tools and People, the server's half** (anotoki-lib 0.5.0;
  `api/admin_tools.php` gives each this site's answers once - `siteAdminContext()`:
  the actor and the ADMIN check from the token, the proof a backup asks for (a
  sign-in at the IAM of the last ten minutes, `auth_time`), people's names by id
  (`peopleNamesById()`: a backup's maker, the audit log's and feedback's
  people), the trusted proxies (`config/visitors.php`: Cloudflare's ranges,
  none wider than a proxy's; their header Cloudflare's `CF-Connecting-IP`,
  pinned - no setting, never `X-Real-IP` or `True-Client-IP` - believed with
  the origin secret only on a request carrying it, `originSecret()` - so the library
  reads an address by `clientAddressCounted()`'s rule, its `ClientAddress`), this API's `{error,
  code}` body). Each route group guards itself and gets `RequireRole::admin()`
  from this site as well:
  `/api/admin/errors` (`siteErrorLog()`: files in `storage/error-log/` - the
  site's old `storage/logs/errors-*.jsonl` stay where they are, unread, but
  for the address each line kept (`ip`, the old `requestIp()`, gone), which
  `oldErrorLogAddressesForget()` turns into the library's keyed `client` hash
  once, after an answer (a stamp in `storage/cache`); the answers the anotoki
  family's rule takes, the library's default - every 5xx, and 404, 405, 413,
  415, 429 - never a 401, 403, 409 or 422 (the owner's decision of 2026-10-11,
  in place of this site's old "every answer of 400 and up"), nor an answer
  that says a state the site is in (the library's `expected`,
  `SITE_EXPECTED_ANSWERS`: the family's `update_pending`, `feature_unavailable`,
  `not_set_up`, and this site's `maintenance`, `guides_unavailable`,
  `visitors_unavailable`, `quiz_levels_unavailable` - the owner's rule: an expected refusal stays out, a
  real failure is written, a 503 among them: `storage_unavailable`,
  `database_unavailable`, `visitor_move_retry`); an `ApiRefusal` is an answer,
  not a failure. The pages' own errors come in at `POST
  /api/client-errors` (`ErrorLogRoutes::client`, the owner's decision: every
  site's) - behind every gate as any route, scrubbed in the browser and again
  here, at most 20 an hour from one sender (a person by their account, a
  visitor by their address bucket) and 500 a day from the visitors, as many
  from the people signed in), `/api/admin/audit` (`siteAudit()`, `api/audit_log.php`:
  `anotoki_audit_log` - `content.*` from DbQuery, the guides and the quiz levels, `catalogue.*`
  from `auditFile()`, the words' and the tools' own; entries wait in
  `storage/logs/audit-pending.jsonl` until `genshin_impact/028` has run),
  `/api/admin/feedback` and the public `POST /api/feedback` (`siteFeedback()`:
  kinds bug/idea/other, `FEEDBACK_SECTIONS`, `FEEDBACK_FIELDS` - the old
  columns' names; nothing of where a message came from kept; five an hour and
  twenty a day from one sender - an account, or a visitor's address bucket -
  and three hundred a day from the visitors, as many from the people signed
  in; the reply address is only what the sender leaves in the form's field,
  which the page fills with their account's - `feedbackSender()` hands the
  library the id alone, and the library takes no address from the sender;
  "send without my name" keeps neither - the owner's decision of 2026-10-11,
  "it's their choice"; a delete is audited inside its own transaction, with
  the message's time), `/api/admin/backups`
  (`siteBackups()`: COPY through PDO, no pg_dump, `storage/backups/*.anotoki-backup`;
  daily, before every Apply and restore; restore on; no maximum age - the owner's
  decision of 2026-10-11: the automatic kinds go only as newer ones of their kind
  replace them (14 daily, 5 and 5), a manual one only when the owner deletes it,
  and a deleted person's data stays in them until then; not encrypted - the
  owner's decision of 2026-10-11: a backup file shows whoever gets it the
  people's names, the feedback's messages and reply addresses, play history
  and the IAM session ids of the audit log (the new visitors' count, since
  users/054, only keyed hashes), so it stays in the denied `storage/backups/`,
  its files `0600`, and leaves only by the single-use download; sealed since
  0.5.0 - an HMAC of its id and SHA-256 under the installation's key - and only
  a sealed one is restored through the page: the plain backups made before
  0.5.0 have no seal and are restored offline only (DEV.md); a restore does
  again, inside its transaction, every People-page and Feedback-page delete
  made since the backup (the library's `People::restoreHooks()`, by the audit
  log: `peopleDeleteGames()` on the restore's own connection), then runs the
  scrub of the IAM's deleted accounts - one that does not finish is the
  library's `after_restore_error`, the upkeep's stamp removed after the answer
  (this site's runner, `afterResponse()`) so the next request retries - and
  forgets the Files page's figures (`then:`); the old pg_dump folders never touched),
  `/api/admin/files` (`siteFileExplorer()`: roots `assets` - the asset tree, a
  snapshot - and `uploads` - `public/uploads/`; the library's upload rules; its
  trash and snapshots in `storage/explorer/`, apart from the Files page's
  `storage/trash/`; its previews' links signed under the site secret
  (`siteFilePreviewKey()`, `Keys::derive(secret, 'file-preview')`), never the
  installation's key in `storage/`, which whoever can write that folder could
  make their own. The catalogue's rows follow what it does and keep their ids:
  every `*_file_id` is ON DELETE SET NULL, so a row deleted and made again
  strips the picture from the content - `explorerAfterWrite()` moves the same
  rows on a rename or move (`catalogueMove()`, a folder's with it), and
  `explorerGuard()`, after the ADMIN check, refuses 409 `file_in_use` for a
  file the content shows (`catalogueReferences()`, every foreign key to
  `files`) and 409 `not_catalogued` for a move where no category claims the
  file; before a write it puts this site's guard `.htaccess` in a root that has
  none) and `/api/admin/people` (`sitePeople()`: `users` by `username` and
  `created_at`; the delete hook `peopleDeleteGames()` takes a person's
  `VISITOR_PERSON_TABLES` rows inside the library's transaction
  (`People::delete()`, which forgets the person's feedback's reply address and
  browser and writes `person.data_deleted` in the same one) - it begins no
  transaction of its own and does all its work on the `$pdo` it is given,
  never `usersDb()`: a restore does it again on its own connection, its request
  null; the scrub hook `peopleScrubCopies()` blanks the feedback's address and
  browser and the audit log's address and names about the person, every write
  on the scrub's connection). `BackupsRoutes::file()` and
  `FilesRoutes::raw()` stand outside every admin check - a single-use ticket, a
  signed link - and are open in the maintenance and sign-in gates for that
  reason. All of them are in api-config.mjs's `SKIP_PREFIXES`, `/api/client-errors`
  too.
- **Assets**: files live under `assets/` (untracked), catalogued in the `files`
  table; every asset column across the entity tables is a foreign key into it.
  `backend/api/asset_columns.php` lists which columns are assets. The tree holds the
  converted formats only (AVIF, Opus): uploads are re-encoded by
  `api/media_convert.php` (audio with the `ffmpeg` on PATH, nowhere else) and
  named by `api/asset_naming.php` (`assetBaseName()`:
  "Hu Tao" → `HU_TAO`). A column's `{field}_name` is the file's name only where
  `assetColumnMap()` says so — `constellation_name` and `demo_music_name` are
  columns of their own.
- **Nothing uploaded may run** (`api/upload_guard.php`). The tree and
  `public/uploads/` are served by the host's Apache, whose mod_mime reads
  every dot-separated part of a name as an extension: `shell.php.png` runs as
  PHP where PHP is mapped by AddHandler. So a file keeps one extension, its own
  from the allowlist - every other dot in a new name, uploaded or renamed,
  becomes `-` (`_assetUploadStem()`: "5.0 - X" is stored as "5-0 - X"; a file
  being replaced keeps its name unless a part of it could run) - and nothing
  named like a script goes back in (`uploadNameRunsOnServer()`: the restore,
  the conversion). Every write into the tree goes through `_assetUploadDir()`
  (inside the tree by `_assetPathInside()` - realpath, with the separator - and
  behind the guard), and each upload folder has an `.htaccess` guard
  (`uploadGuardRules()`: mod_mime's RemoveHandler/RemoveType, which need just
  AllowOverride FileInfo, as the rewrite rules do; and inside
  `<IfModule mod_headers.c>`, `uploadGuardHeaders()`: nosniff, and anything but
  a raster picture served as a download - public/uploads/'s rules word for word,
  so an old `.svg` or `.html` in the tree never runs on the site's origin, while
  an `<img>` or an `<audio>` reads its file as before; never `php_flag`,
  `Options` or `Require` - each can answer 500 for the folder on a host whose
  AllowOverride does not allow it, and in `assets/` that is every picture),
  kept on the host beside the release (never in one) and written by the API
  before an upload where it is missing (the file explorer's writes too, `explorerGuard()`). `php
  tests/run.php` checks all of it.
- **The game catalog, for the build analyzer** (2026-10-20, at the owner's
  word): another of the owner's sites, builder.anotoki.eu, takes its game catalog from here
  instead of a third party's lists, matching what players import by the game's
  ids and what builds name by name. `characters`, `weapons` and `artifacts`
  carry the game's own id, `game_id` (`genshin_impact/030`: a nullable INTEGER,
  `CHECK (game_id > 0)`, one live row an id - a Traveler's on `(game_id,
  element)`: every Aether row is 10000005, every Lumine row 10000007; `031`
  filled it by name, generated by `backend/game-ids.php`, a one-off run on the
  owner's computer and never in a release - DEV.md, *The game catalog*). `GET
  /api/catalog/characters`, `/weapons` and `/artifacts` (`api/catalog.php` the
  queries, `routes/genshin_impact/endpoints/catalog.php` the routes,
  `responses/catalog.php` the shapes) answer bare lists of the live rows: the
  fields the analyzer was promised and nothing else - no editor's fields, no
  `deleted`, no row ids - by name `COLLATE "C"` then id; a version as the pages
  read it (`api/game_versions.php`, the PHP half of `database-helpers.ts`'s
  `versionNumber()`: change one, change the other -
  `tests/catalog-versions.test.php` holds them together); an icon as an
  absolute address on the request's own host (its Host header, as Slim reads it
  into the URI): https and no port - a port there is likelier the one a proxy
  reached PHP on (`SERVER_PORT`) - but http and its port for a loopback host
  (ng serve in development). Public and read-only, under every gate like any route - an
  update waiting, maintenance, sign-in required, a page's lock: the analyzer
  keeps what it last read meanwhile. It reads server to server, so there is
  still no CORS. ETag + `no-cache` and a 304 as the guides answer. The admin
  forms' base-info tabs take a "Game ID" (sent as a number or null, never `''`,
  which `validateBody()` refuses and a create's model cannot even be built
  from), and the owner's importer sends `game_id` from now on.
  `tests/catalog-routes.test.php` covers the answers, the gates, the indexes
  and both migrations' gates.
- **The quizzes' levels** (the owner's decision of 2026-10-21): what each level
  of each quiz shows, try by try, is data - `quiz_levels` (`users/061`: one row
  at most, the levels as JSONB and their time, no person; no row is the
  built-in levels, the frontend's `QUIZ_LEVELS`), `api/quiz_levels.php` the
  rules and the row, `routes/users/endpoints/quiz_levels.php` the routes,
  `responses/quiz_levels.php` the shapes. `GET /api/quiz/levels` (public,
  `{levels}` - null for the built-in levels, also for a saved row the rules no
  longer take and before the table is there; ETag + `no-cache`, a 304; under
  every gate like `/api/quiz`); `GET`, `PUT` and `DELETE /api/admin/quiz-levels`
  and `POST /api/admin/quiz-levels/check` (ADMIN or EDITOR, `ROLES_CONTENT`;
  `{levels}` in a body of 16 KB at most, read by `JsonBody`; a save the rules
  refuse is 422 `invalid_levels` with `problems` - `{quiz, level, try,
  message}`, English - and keeps nothing; a check answers the same problems and
  keeps nothing; 503 `quiz_levels_unavailable` before `users/061`, one of
  `SITE_EXPECTED_ANSWERS`). The server is the rule (`quizLevelsChecked()`), held
  to before a row is written and again as it is read: exactly the six quizzes and
  the levels "1"-"3"; `triesMax` 5 everywhere (the owner's rule of 2026-10-19 -
  a change to it is a decision, not a refactor) and five steps, `try` 0-4 in
  order; a step's `class` only its quiz's CSS classes, one of each kind;
  Pixelate's grid 3-60 on every step, Music's seconds 1-60 on every step but
  the last, Voice's 0.25-10 never beside `hidden-audio`, none on a picture;
  Mismatch's `choicesAmount` 3-8; each wrong guess showing more, never less; no
  other key, no other type. The levels are kept and answered in their own order
  (the quizzes, the levels, each object's keys), so a save of the same levels
  changes nothing and writes no entry. A save and a reset are
  `content.insert|update|delete` on `quiz_levels` (`auditContent()`, the levels
  before and after). `tests/quiz-levels.test.php` reads `QUIZ_LEVELS` from
  `quiz-levels.ts` - the built-in levels must pass the rules - and holds every
  rule, the routes, the audit, the gates and `users/061`.

## Frontend layout & conventions

- **Two sites**: `frontend/src/app/sites/main/` (public) and `sites/admin/`. The
  root component wraps both in the shared library's `<anotoki-site-gate>`
  (`shared/site-status.ts`), which draws its own page instead of either
  while the site is not set up, not answering, or waiting for a database update
  (for its ADMIN, the way to `/admin/migrations`, the library's Migrations page) -
  see *Where the site stands*.
- **A component is always three files**: `name.component.ts`, `.html` and
  `.scss`, side by side. No inline `template:` or `styles:` — ESLint refuses them
  (`@angular-eslint/component-max-inline-declarations` at zero), and the
  `angular.json` schematics generate separate files. A component with nothing to
  draw still gets its (commented) `.html` and `.scss`; an abstract base class that
  needs no template is a `@Directive()`, not a component. Shared styles are a
  partial the component's own `.scss` pulls in with `@use`.
- **Zoneless, signals-first.** State is `signal()` / `computed()` / `model()`;
  no `zone.js`. Prefer the generated services (`src/app/api/services/`) over raw
  `HttpClient`.
- **A player's own data** (saved games, results, the Profile's statistics) is
  read and written only through `QuizProgressService` and the Profile, which
  issue each request with `issuedAs('person' | 'visitor')` from
  `QuizProgressService.owner()`. A quiz page passes `progress.ticket()` back
  with every save and result and loads again on `progress.restarts()`. Nothing
  else sends `X-Visitor-Key` or decides person / visitor (see *Signing in*).
  What a visitor is told is drawn from their facts in one place each - the
  notice component, the shell's toasts - never a sentence in a service.
- **The kit and the palette**: the pages are drawn with the anotoki family's UI
  kit (anotoki-lib 0.9.1), each piece imported from its own entry point -
  `@anotoki/lib/ui/button` (`anotokiButton`), `ui/forms`, `ui/dialog`
  (`AnotokiDialog`, `ConfirmService`), `ui/toast`, `ui/tabs`, `ui/pagination`,
  `ui/segmented`, `ui/tooltip`, `ui/menu` (menus, popovers), `ui/drawer`,
  `ui/card`, `ui/page-header`, `ui/empty-state`, `ui/error-state`, `ui/badge`,
  `ui/alert`, `ui/icon`, `ui/spinner`, and 0.6's pieces in place of the site's
  own: `ui/side-nav` (the admin panel's navigation), `ui/disclosure` (what
  folds: an accordion of disclosures), `ui/combobox` (the quizzes' search with
  pictures), `ui/date-field`, `ui/slider`, `ui/chips`, `ui/file-picker`,
  `ui/color-field`, `ui/rich-text` (the HTML editor's toolbar) and `ui/icons`
  (the family's drawings) - never `@anotoki/lib/ui`. Beside them: a dialog as
  wide as `xl` (64rem: the guides' editor, the parts of the site, the
  wallpapers), `variant="danger-ghost"` for a row's quiet Delete, a page
  header's lead with markup in `[pageLead]`, `.table-middle` on the admin
  tables of pictures and buttons, a tab's `icon` (the panel's from
  `sites/admin/admin-icons.ts` - its navigation's, its tabs', the dashboard's
  tiles' -, registered with the kit's `AnotokiIcons` as the panel loads; a
  lazy page registers its own). The toasts'
  host is in each site's root component, the confirm host in the admin panel's.
  A kit slot (`alertActions`, `cardActions`, `drawerActions`...) goes on a
  wrapper around the buttons, never on a button: the kit draws the slot's
  element `display: contents`, and a button carrying it loses its box. A size
  a kit input takes is in its own unit (a popover's `minWidth` is rem).
  The family has one palette and genshin gives it its colours: `styles.scss`
  writes `anotoki.root(...)` with genshin's light and dark values (the owner's
  decision: a site keeps its look by its colours, never by re-styling the
  kit's pieces), keeping text 4.5:1 on every ground and `border-strong` (every
  field's edge) and `focus` 3:1 (WCAG 1.4.11; genshin's own borders are dividers,
  2:1 at most). Then the family's Manrope, base and tables, then
  `local-lib/general.scss`. The site's own names for colours (`--bg-card`,
  `--text-secondary`, `--color-primary`, ...) are those tokens again
  (`design-tokens.scss`); its own colours - the wallpaper's veils, the
  elements, the rarities - stay its own. A colour a page needs is one of these
  custom properties (*Theming*).
- **local-lib** (`src/app/shared/local-lib/`) holds what the kit has no piece
  for and the bases the pages build on: the field adapters `app-text`,
  `app-number`, `app-textarea`, `app-checkbox`, `app-dropdown`, `app-calendar`
  (the kit's date field; a birthday, kept as a DATE in year 4, is mapped at
  the boundary to the field's day and month, `stored-dates.ts`; its order is
  the one the site writes dates in for the reader - the account's
  `date_format`, else the device's, DateFormatService) and `app-chips` (the kit's choice
  chips) - the kit's fields, keeping the typed values and the validation the
  admin forms run through `AbstractInputComponent` - and `app-multiselect` (the
  kit's popover of its checkboxes: a filter's compact trigger, kept beside the
  kit's combobox); the site's own fields, drawn as the kit draws its fields
  (`components.scss`): `app-file` (a button that chooses a folder or files -
  the kit's file picker, which the pages that choose one file to look at
  first use, has no folder) and the HTML editor (the kit's rich-text toolbar
  over its contenteditable; its own size and font menus, colours in a panel
  of the kit's colour field, a link asked in its own dialog and set through
  the kit's `link()`; a paste comes in as plain text; a stored text loads
  through the page's allow-list); rich text (the allow-list's renderer,
  `rich-html.ts`); the waypoint loader, the audio
  players, the theme toggle. Every file an editor uploads is checked again on
  the server by its bytes and its size (`uploadFileAcceptable()`,
  `api/upload_guard.php`: anotoki-lib's `UploadPolicy::contentRefusal()`, the
  family's rule - the picture or sound its name says, no markup at its start
  nor a page's tags in its first kilobyte): the browser's check is a
  convenience. The bases:
  `AbstractInputComponent`, `AbstractModalComponent` (`openModal()` over the
  kit's `AnotokiDialog`, data through `ANOTOKI_DIALOG_DATA`, `closeModal()`,
  `dialogHeading()`, `notificationService` = the kit's `ToastService`),
  `AbstractRolesComponent`. A piece the kit lacks is built here from the kit's
  pieces and tokens, and goes to the library when another site wants it.
- **The admin frame**: the kit's side navigation (`<anotoki-side-nav>`,
  `@anotoki/lib/ui/side-nav`): the dashboard, then Database, Lookup Tables,
  Localization and System under their headings, the feedback nobody has opened
  beside Feedback, in a 220 px column beside the page; up to 860 px (its
  `phoneMax`) the page has the whole width under a row with the brand, the
  theme and a Menu button (`[anotokiSideNavTrigger]`) that opens the same
  navigation in the kit's drawer - the column is `display: contents` there,
  never `display: none`, for the drawer opens from it
  (`sites/admin/app.component.*`). Under every page, the anotoki family's footer
  (`<anotoki-site-footer>`, `@anotoki/lib/footer`, anotoki-lib 0.6.3 - the
  owner's choice of 2026-10-18 for every admin panel; the public site keeps its
  own, which he calls "completely different"): the version (`public/changelog.json`'s
  newest, the public footer's one source), What's new (the public footer's
  dialog, `site-whats-new-modal`, loaded with the press), Feedback (the
  library's form in its own dialog, sent as the person signed in; never while
  an update waits - `SiteStatus.blocked()` - when the server would refuse it),
  About · Support · Terms · Privacy · Contact (the public site's pages, the
  legal configuration's paths) and the fan clause (`fan="hoyoverse"`). A landmark
  of its own beside the panel's `<main>` (`.admin-page`), both in the column
  that scrolls (`.admin-main`, its padding and sticky offsets as they were), at
  its foot on a short page. Every page works at 390 px.
- **Admin CRUD** for an entity lives in `sites/admin/<entity>/<entity>-list/`
  and `<entity>-form/`, wired in `sites/admin/admin.routes.ts` with a nav entry
  in `sites/admin/app.component.ts`. Simple lookup tables use the shared
  `lookup-table` component: a line in `LOOKUP_PAGES` in `sites/admin/pages/pages.ts`
  and `lookupRoute('path')` in `admin.routes.ts`.
- **Public DB pages** live in `sites/main/features/database/<entity>/`.
- **Admin assets**: the **Files** page (`sites/admin/files/`) browses the
  DB-catalogued assets, previewing through its `file-preview` modal; **Files
  Explorer** (`/admin/files-explorer`) is the library's file explorer over the
  asset tree and `public/uploads/` (below).
- **The admin tools and People are the anotoki library's** (since 0.4.1): Feedback,
  Audit Logs, Error Log, Files Explorer and Backups (`@anotoki/lib/admin/*`) and
  People (`@anotoki/lib/people/page`), each on a lazy route of the admin panel
  at the address this site's own page had - `/admin/feedback`,
  `/admin/audit-logs`, `/admin/errors`, `/admin/files-explorer`,
  `/admin/backups`, and the new `/admin/people`. The tools' configuration is
  `shared/site-admin-tools.ts`, provided at the app's root (`app.config.ts`) -
  the library's pages read it through a root service, and so does the badge -
  and People's is `sites/admin/people.ts`, on the panel's route; the pages
  themselves never load before they are opened. For this site's ADMIN alone (the owner's decision: EDITORs see
  none of them): the navigation shows them to the ADMIN only, a page tells
  anybody else whose it is and asks nothing, and the server refuses them. Beside
  Feedback, the messages nobody has opened (`FeedbackUnread`; no mail is sent).
  People's Delete takes a person's games (saved games, quiz results, statistics)
  and asks in the site's words - their record and their feedback stay, the
  messages without the reply address and browser they were sent with (the
  library forgets those with the games, since 0.5.0). The
  visitors' feedback form is the library's too (`@anotoki/lib/feedback`,
  `shared/site-feedback.ts`: the server's thirteen sections, a bug's and an
  idea's own fields in the site's `feedback.*` words), in the public footer's
  dialog (`site-feedback-modal`) and the admin panel's footer's own, loaded
  when it is opened.
- **The browser's errors** (anotoki-lib 0.5.0, the owner's decision: every
  site's): `app.config.ts` provides `provideBrowserGlobalErrorListeners()` and
  the library's `provideAnotokiErrorReport()` (`@anotoki/lib/error-report`) -
  the app's ErrorHandler tells the console as Angular's own does and reports
  each error, scrubbed, at most five a page load, to `POST /api/client-errors`
  through the app's HttpClient, so this site's interceptors make it the API's
  (the base URL, the token of whoever is signed in). Its request carries
  `ANOTOKI_ERROR_REPORT` in its context; `http.interceptor.ts` has no error
  handling of its own to skip for it.
- **Terms, Privacy and Contact** (anotoki-lib 0.6, the owner's decisions of
  2026-10-13): the family's pages (`@anotoki/lib/legal/pages`) on `/terms`,
  `/privacy` and `/contact` - each a lazy route of its own in
  `sites/main/main.routes.ts` whose parent is their frame
  (`sites/main/legal/legal-frame`, the site's veiled column), never one
  empty-path parent holding the three (the router would take an address read
  whole for it - the survey's lesson), and before `**`. Anybody's: no
  `routeAccessGuard` (the API refuses a site_routes row for them,
  `ROUTE_PATH_LEGAL`), the public shell draws them in place of its closed sign
  and sign-in card (`legalPage()`), and the app initializer never sends somebody
  opening one to the IAM (`mustSignInFirst()`). The family's About and Support
  pages (anotoki-lib 0.8.0: `@anotoki/lib/legal/about`, `/legal/support`, the
  same on every anotoki site, in the library's words) are routed the same way
  on `/about` and `/support`, in the same frame, anybody's by the same rules
  (`LEGAL_PAGE_PATHS` in `shared/site-legal.ts`, `ROUTE_PATH_LEGAL`). `provideAnotokiLegal()`
  (`shared/site-legal.ts`: the page's language, the database's words; the
  operator the library's default, Code Hero s.r.o.) is in the first load; the
  facts are the frame's (`sites/main/legal/legal-facts.ts`), out of it - each
  fact TRUE of the code, what it rests on written beside it: a change to what the
  site keeps, or for how long, changes its `legal.*` strings (a `users/`
  migration: 055 brought them) and `SITE_LEGAL_UPDATED`. Every address the
  pages link to (the IAM's Privacy and account pages from the issuer, the
  operator's, the processors') is the code's, never a string an administrator
  can reword. Contact opens the footer's feedback form (the library's) in the
  kit's dialog; the Terms and Contact pages carry the fan clause
  (`fanDisclaimer: 'hoyoverse'`). Under every public page, the site's own
  footer (`sites/main/common/footer`, the owner's order of 2026-10-18): on the
  right the version, What's new (`site-whats-new-modal`), Feedback and the
  account - buttons, each opening its dialog; the wallpapers' window opens from
  the account panel, never the footer - then About · Support · Terms · Privacy ·
  Contact, router links in the library's words (`anotoki.legalLinks.*`, the open one
  `aria-current`); on the left, alone, the fan clause in the site's words
  (`footer.fanDisclaimer`: "This site is a fan-made project and is not
  affiliated with or endorsed by HoYoverse."), its black fading towards the
  middle as the right side's does. Fixed to the window's bottom from 1440 px -
  measured: where the clause keeps to two lines beside the items in Slovak, a
  scrollbar counted (`footer.component.scss`; re-measure when an item or its
  words change) - stacked in the page's flow under it; the closed sign and the
  sign-in card keep the links and the clause alone (`legalOnly`). The admin
  panel has the family's footer instead (*The admin frame*).
- **The top bar's items open and close their sections**
  (`sites/main/common/header`, the owner's decision of 2026-10-21): on a
  section's own page (`/quizzes`, `/daily`) its item leads to the home page
  (`aria-current="page"`), on a page inside it (`/quizzes/pixelate`,
  `/daily/banners`) to the section's page (`aria-current="true"`), from anywhere
  else into the section - the link's address is where it goes, read from the
  router's settled address (`NavigationEnd`), so hovering it says so, and Enter
  goes there; the open section's item is marked (`li.active`, the hover's
  look). `data-section` names each item for the screenshot run's checks.
- **The quizzes' levels, the pages' half** (*The quizzes' levels* in the
  backend's conventions): `features/quizzes/shared/quiz-levels.ts` holds the
  built-in levels (`QUIZ_LEVELS`, which must pass the server's rules - the
  backend's test reads them from the file: keep the literal plain), the
  dialog's words (`levelWords()`) and a client's check of an answer's shape
  (`usableLevels()`); `QuizLevelsService` the levels in force - asked once a
  page load, joined to every quiz's characters, at most 2.5 seconds, the
  built-in ones while it asks and on any failure, and never changed after
  that - and every quiz reads its level from it (the daily's Easy, level 1 of
  them). The difficulty dialog takes every number from the level in force (the
  reader's way of writing numbers; a key keeps its English's placeholders, so a
  Voice level playing fewer pieces of the recording than its sentence names is
  said in `quiz.levelInfo.voiceOther`'s general words - never a placeholder
  left unfilled); what no number can say -
  `quiz.levelInfo.picture*`, the steps of `quiz.levelInfo.voice*`, Mismatch's
  card and guide - is written for the built-in levels, and the admin Quiz
  levels page (`sites/admin/quiz-levels/`, System in the navigation, ADMIN or
  EDITOR, `anotokiUnsavedChangesGuard`) warns when levels leave it behind
  (`quiz-level-words.ts`) - a new kind of step, or a sentence that names one,
  needs a warning there too. The page shows what the server's rules say (`POST
  /api/admin/quiz-levels/check`, as it is typed), never rules of its own.
- **i18n**: user copy goes through the `translate` pipe with a key (the
  library's, `@anotoki/lib/translations`, as is `TranslationService` - *The
  words*); proper
  nouns (character names, usernames, version numbers) are shown as they are, not
  through the pipe. Dates go through `AppDatePipe`: the signed-in account's date
  order and clock (a chosen clock in the page language's words for am and pm),
  else the device's. The reading language is the signed-in account's when this
  site has it, else this device's (see *Signing in*, the account's
  preferences); the admin panel is English for its staff. New keys arrive in a
  `users` migration with a description, English and Slovak strings - copy
  `users/051` - never from the admin panel (`php translations.php --status`
  checks the code against the database); a key put together at run time has
  its prefix and every tail in `shared/dynamic-keys.ts`. A guide's body is no
  key: it is `guide_contents`, read through `GET /api/guides/{guide}`.
- **Theming**: the site has light/dark - one theme for the whole site, the admin
  panel included, the signed-in account's or this device's (`ThemeToggleService`);
  never hard-code a colour that only works in one theme.

## Deployment

The site ships to **one web root, served same-origin** (the frontend calls its
own `/api`). Two builds assemble it, neither adding anything the running app
would not have:

- `cd frontend && bun run anotoki-deploy build` → `dist/frontend/` (the
  production build, its prod `config.json` - empty API URL, so `/api` stays
  relative -, `index.php`, `.htaccess`) and `dist/backend/` (`api/` minus
  generators/openapi/docs, `config/` minus every `*.local.php`, `vendor/`,
  `migrations/`): a release, replaced whole on the host beside `config/`,
  `storage/`, `assets/` and `uploads/`, which no release writes. The 2.7 GB
  `assets/` tree is **not** in it. anotoki-deploy is the anotoki library's
  (`backend/composer.json`'s `extra["anotoki-deploy"]`); the **deploy** skill
  covers shipping.

Upload both into the web root, plus `assets/` separately. Production is
**FTP-only, no shell**, which shapes everything: `vendor/` ships in the dist (no
`composer install` on the server); the **first install** runs through
`backend/setup.php`, uploaded by hand (it asks for the DB connection and the IAM
address + this site's client id, with a token only FTP access can read - this
site's address comes from the request, pg_dump from `~/pgclient` if it is there;
writes every `*.local.php`, then locks and deletes itself - there
is no admin to create here, the IAM holds the accounts and must be installed
first); and **later schema changes** go through the admin Migrations page, since
`php migration.php` cannot run there. From the moment a new migration file is on
the host until it is applied, the site tells everybody but its ADMIN that it is
being updated - so upload, sign in as ADMIN, Apply, in one go.

Full steps — the upload map, the installer, a checkout that still has two databases, the
constraints — are in `DEV.md` (*Deploying to the hosting*). The **deploy**
skill covers this workflow.

## Working conventions

- **Regenerate, don't hand-edit generated code** — see the pipeline above.
- **Versions and What's new**: `frontend/public/changelog.json`, newest first, is
  the site's version (both footers show its newest entry, the public site's and
  the admin panel's - one source) and what What's new says. A version is MAJOR.MINOR.PATCH - big changes, new features, bug fixes -
  and `frontend/package.json` carries the same one. An entry holds only what a
  regular player notices, in their words: nothing technical, nothing for
  developers. The version a browser last saw is compared with `sameVersion()`
  (`sites/main/common/footer/versions.ts`), so "1.0" kept from before 1.1.0 is
  "1.0.0".
- **Comment style**: explain *why*, in plain prose, at the point a reader would
  wonder. Match the surrounding density; the codebase favours a short paragraph
  over a redundant restatement of the code.
- **Stage only your own edits.** The maintainer edits alongside you. Never
  `git add -A`/`git add .`; stage the exact files you changed, by path.
- **Shut the dev servers down** (PHP on 8000, `ng serve` on 4200) before ending
  a task that started them — and check the port afterwards: on Windows the
  `ng serve` child of `npx` can outlive its parent.
- **Commit only when asked.** End commit messages with the Co-Authored-By
  trailer.
- **Secrets**: `backend/config/*.local.php` are per-installation and gitignored,
  every one of them. Never expose the Postgres password, the site secret, or any
  access token in output, and nothing that git would publish names a path on
  anybody's machine: say `../anotoki-iam`, `backend/...`.

## Agents & skills

Project-local helpers live in `.claude/agents/` and `.claude/skills/`. Reach for
them by default: backend work → **backend-engineer**, frontend work →
**frontend-engineer**, before committing → **code-reviewer**, and the skills for
their named workflows. They all read this file first, so keep it current when the
project changes.

The user-level Angular toolkit in `~/.claude` (`generate-api`, `fe-api-sync`, …)
expects `openapi-generator-cli` and an `openapitools.json`; this repo has neither.
Its client comes from `npm run api` — the **sync-api-client** skill.

- **skill: sync-api-client** — regenerate the spec + client after backend changes.
- **skill: scaffold-entity** — a new resource end-to-end (migration → API → admin page).
- **skill: db-migration** — write and apply a migration in the house style.
- **skill: deploy** — build and ship to production (the two builds, the installer,
  and applying migrations on an FTP-only host).
- **skill: refresh-docs** — regenerate the security / performance / reference reports.
- **agent: backend-engineer** — PHP/Slim work in the conventions above.
- **agent: frontend-engineer** — Angular/signals/local-lib work.
- **agent: code-reviewer** — read-only review against these conventions and the security findings.
