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
`backend/`, `frontend/` and `docs/` - nothing else is committed there, like every
anotoki project. In development the untracked asset tree `assets/` (2.7 GB) sits
there too: the backend writes uploads into it (`_assetsRoot()` in
`api/asset_naming.php`) and `ng serve` serves it (`angular.json`'s `../assets`).
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
`backend/config/*.local.php` — gitignored, never shipped by `build-dist.php`, and
**required**. There is no committed fallback, environment variable or default
for any of them (`config/local.php` explains why):

| File | Holds |
| --- | --- |
| `database.local.php` | the PostgreSQL connection and the database's name |
| `secret.local.php` | the site secret (an old `jwt.local.php` is read in its place) |
| `iam.local.php` | the IAM's `issuer` and this site's `client_id` there |

Optional: `backup.local.php` (pg_dump paths), `site.local.php` (a site code other
than `genshin_impact`), `visitors.local.php` (the limits on playing without
signing in and the proxies trusted to name a visitor's address - see
`config/visitors.php`; never written by setup.php, put on a host by hand; every
value is type- and range-checked, a bad one keeps its default and is logged once,
so a typo such as `keep_days => 0` never sweeps everybody). A leftover
`app.local.php` (this site's address, from when the dev frontend called the API
cross-origin) is no longer read.

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
  a sign-in still works, the pages have their words and an ADMIN reaches Apply.
  `unavailable` and `ready` pass. A path goes in that list only when nobody could
  get to Apply without it.
- **The Migrations page's API** is the library's `MigrationsRoutes`: `GET
  /api/admin/migrations`, `GET /api/admin/migrations/file?set=&name=`, `POST
  /api/admin/migrations/apply` (409 `busy` while another apply runs). ADMIN only,
  judged by the token alone (`requireAdminToken()`, `meddleware/auth.php`): nothing
  a waiting migration has yet to make may stand between an ADMIN and Apply. Both
  prefixes are in api-config.mjs's `SKIP_PREFIXES` - the library's Angular half
  is their client.
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
  back. `/admin/migrations` is `<anotoki-migrations-page>`, from its own entry
  point `@anotoki/lib/migrations/page` (so it rides in the admin panel's lazy
  chunk, never the first load), inside the admin layout, the one page that works
  while an update waits. Never installed: "This site is not set up yet" and the
  setup page; installed once: "not available right now", never the setup page. Both
  are drawn with the library's kit, in the site's colours (`--anotoki-*`, the
  `anotoki-lib` mixin in `design-tokens.scss`), as are the admin Translations and
  Languages pages. Every colour the kit reads on these pages is mapped to one of
  the site's - one left out is the family's navy - and `border-strong`, the edge
  of its fields, switches and outlined buttons, stays 3:1 or more against every
  surface in both themes (WCAG 1.4.11; this site's own borders are dividers, 2:1
  at most). The admin panel has no anotoki top bar: `.admin-main` sets
  `--anotoki-topbar-height` to minus its padding, so the library's sticky heads
  stick flush with its top.
- **Updating the library**: both halves together, to one version - the constraint
  in `backend/composer.json` (`"anotoki/lib": "^0.3"`, from the GitHub VCS
  repository) and `composer update anotoki/lib --prefer-dist` in `backend/`; the
  release's tarball URL in `frontend/package.json`, then `bun install` and `npm
  install` (both lock files). Read its CHANGELOG.md first: while it is 0.x a minor
  version may break. A release that changes one half only is taken in that half
  (0.2.0 changed the Angular half alone); both halves are 0.3.0 now. Import a
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
  from the token), the audit log (`translationsAudit()` / `siteAuditWrite()`,
  into `audit_logs`), and `GuideLanguageUsage` (a language's guides: counted on the
  Languages page, gone with it). The routes are the library's
  (`routes/users/endpoints/translations.php`): `GET /api/translations/{code}`
  (public: `{language, languages, values, english?}`, snake_case, ETag) and, behind
  `requireAuth()` + `requireRole(...ROLES_CONTENT)`, `GET /api/admin/languages`,
  `GET|PUT /api/admin/translations`, `GET .../{code}/export`, `PUT .../{code}/import`,
  `POST /api/admin/languages`, `PUT|DELETE /api/admin/languages/{code}`. They are
  in api-config.mjs's `SKIP_PREFIXES`: the library's Angular half is their client.
- **The schema**: `translations` / `translation_keys` / `languages` keyed by its
  code, no scopes, flags or stamps; the library's own set `anotoki_translations`
  (`vendor/anotoki/lib/php/migrations/translations`) runs after both folders
  (`migrationSetNames()`, `api/migration_runner.php`) - its 001 proves the shape,
  its 002 adds the library's words under `anotoki.*` (54 keys: the kit's, the
  status page's), which the owner may reword like any string. `anotoki.` is the
  library's namespace: never a key of this site's. `translation_keys_before_library`
  and `translations_before_library` are 050's full copies, kept for one release.
- **The guides** (`api/guides.php`, `routes/users/endpoints/guides.php`,
  `guide_contents`): `GET /api/guides/{guide}?language=` (public: the reader's
  language, English where the guide has none), `GET /api/admin/guides`,
  `PUT /api/admin/guides/{guide}` (ADMIN or EDITOR; English never blank). Markup,
  drawn by `<app-rich-text>` only; made by migrations, edited on the admin Guides page.
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

- **Frontend**: the vendored browser SDK (`anotoki-auth.mjs` and its `.d.ts` in
  local-lib's `iam/`, the IAM's `sdk/js/` v1.2.0, copied byte for byte - never
  edited here) does the OpenID Connect code flow with PKCE - "Sign in" goes to
  the IAM and comes back to `/auth/callback` - and the interceptor sends the
  access token as `Authorization: Bearer`. The issuer and client id come from
  `GET /api/settings/public` (`auth`).
- **Backend**: `api/site_user.php` verifies the token with the vendored
  `api/anotoki_iam.php` (RS256 against the IAM's published keys, issuer,
  audience `genshin`, `typ at+jwt`, expiry) and keeps the `users` row - id =
  the IAM user id, name, address - in step with it.
  Config: `config/iam.local.php` (dev: issuer `http://localhost:4300`). The SDK
  is the IAM's `sdk/php/anotoki_iam.php` (v1.1.0), copied byte for byte - never
  edited here, never a fetch of our own beside it.
- **The theme, the dates, the clock and the language are the account's** (the
  IAM's migration 015, the owner's decision of 2026-10-06; its
  `docs/integrating-an-app.md`, "The account's preferences"): one choice every
  anotoki site follows - this one's admin panel included, which has no theme of
  its own any more. The SDK's `user().preferences` and `locale` carry them
  (`SecurityService.claims`), and `AccountPreferences`
  (`shared/local-lib/services/account-preferences.service.ts`) is the one place
  that says when they apply and that saves to them (`savePreferences()`): one
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
  reference work anyone can read. The backend reads it with the SDK's
  `anotoki_iam_login_required()` (`signInRequired()` in `api/site_settings.php`):
  `GET {issuer}/api/public/applications/genshin`, kept a minute in `cache_dir`
  (`storage/cache` - a private folder), and **fail closed**: a 404 (the IAM does
  not know the site, or switched it off) means required, an IAM out of reach
  keeps the last answer, or required when there never was one. It is relayed as
  `auth.login_required` in `GET /api/settings/public` - the frontend never asks
  the IAM. While on, the global `signInGate()` (`api/meddleware/sign_in.php`)
  answers every API path 401 `sign_in_required` to a request without a verified
  token, except `SIGN_IN_OPEN_PREFIXES` (`/api/settings/public` and exactly
  `/api/translations/{code}` - what the sign-in card needs, its words with the
  languages beside them - and `/api/files/raw`, the
  asset previews an `<img>` loads without a token); a signed-in request never
  asks the switch. The files under `assets/` stay reachable by address (the web
  server's, out of PHP's reach - game art only). Only `Authorization: Bearer`
  claims to be somebody: a bearer that does not verify answers 401
  `invalid_token`, `Basic ...` is no claim at all. The frontend's half (`loginRequired` in
  `SiteSettingsService`): while it is on, the app initializer sends somebody
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
  `Bearer` header - that person or 401 `invalid_token`, the key never read;
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
  with `Retry-After` when another request held the rows. **The pages'
  half** (`shared/local-lib/services/`: `issued-as.ts`, `visitor-key.service.ts`,
  `saves-in-flight.service.ts`, `http.interceptor.ts`; and
  `QuizProgressService`): a request to a player's own routes is issued as the
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
php migration.php                    # create missing + apply pending migrations
php migration.php --status           # what has run and what is pending
php migration.php --dry-run          # what would apply, applying nothing
php migration.php --folder=users     # one set only (users, genshin_impact, or the library's anotoki_translations)
php db-dump.php                      # back the database up (pg_dump) before risky data work
php merge-databases.php              # once, on a checkout still configured with two databases
php assets.php --status              # the asset tree against the catalogue and the rows naming it
php translations.php --status        # the keys the frontend asks for against the database's; each language's coverage
php translations.php --export sk [f] # a language's own strings as flat JSON; --import sk f puts them back (no new keys)
php tests/run.php                    # the backend's tests: the upload rules (no database), the words' migration and
                                     # routes (genshin_test_* databases of their own on the PostgreSQL server
                                     # config/database.local.php names - never its database - and a backend copy)

# Frontend (from frontend/)
npm start                            # bun ci, then ng serve on :4200 through proxy.conf.json (/api etc. to :8000)
                                     # - it does not regenerate the API client: npm run api after an API change
npm run api                          # regenerate the API client (see above)
npm run lint

# Production build (see Deployment)
cd frontend && npm run build:deploy  # FE → frontend/dist/angular/browser/ (prod config.json + SPA .htaccess)
cd backend && php build-dist.php     # BE → backend/dist/ (runtime-only slice; no secrets, no dev tooling)

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
  `php/` and `angular/` in their comments; leave them). After both folders comes
  the library's own set, `anotoki_translations` (*The words*), recorded with
  `folder = 'anotoki_translations'`: a site migration never depends on a library
  file, writes only the words' base columns, and its gate never counts keys
  outside this site's own namespaces (`anotoki.` is the library's). The engine is the anotoki
  sites' shared one, anotoki/lib's `Migrator` (*Where the site stands*), set up
  for this site in `backend/api/migration_runner.php` (`siteMigrator()`: the two
  folders then the library's set, in order (`migrationSetNames()`), the lock
  `MIGRATION_LOCK`, `prepare` adopting the record
  table from when each folder had a database of its own, `beforeApply` the order
  guard, which holds the library's set to the third place): the CLI, the admin **Migrations** page's *Apply pending* (`POST
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
  `visitors.php`. A value that differs per installation goes in a `.local.php`
  that setup.php writes, never in a committed default - but for the optional
  ones, whose committed defaults are safe (`visitors.php`'s limits).
- **Visitors** (playing without signing in) live in `api/visitors.php`, the
  only code that makes, finds, locks or sweeps one: a `users` row with a
  negative id, `username` 'visitor', the SHA-256 of a key the server made
  (`users/045`). `visitorMake()` runs only inside the transaction of the save
  that makes the visitor (a refused save makes nobody and counts nothing), under
  the limits; `visitorLock()` takes the row before anything is written for it
  (the quiz tables have no foreign key to `users`); `visitorSweep()` deletes the
  unseen after `keep_days`, after the answer (`api/after_response.php`). A table
  keyed by the user id goes into `VISITOR_PERSON_TABLES`. The address the limits
  count is `clientAddressCounted()` (`api/client_address.php`: REMOTE_ADDR
  unless a trusted proxy names it; IPv6 by /64). An answer decided deep inside
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
- **Auth is the anotoki IAM's** (see *Signing in* above). `requireAuth()`
  (`api/meddleware/auth.php`) verifies the IAM access token and puts `user` on the
  request - this site's record of the person plus the `role` the token grants
  here (ADMIN / EDITOR / USER). Role groups: `ROLES_CONTENT` (ADMIN/EDITOR,
  writing game content - and the words: strings, languages, guides),
  `ROLES_SYSTEM_READ`, `ROLES_SYSTEM_WRITE`. Ownership via
  `requireSelfOrAdmin` / `refuseForeignUserId`. `optionalAuthUser()` for open
  endpoints that behave differently when signed in; `recentSignInRefusal()` for
  the few actions that want a sign-in from the last ten minutes (restoring a
  backup). Four global gates run before any route, in this order
  (`api/index.php`; each says what it leaves open): the shared library's
  `SiteGate` (503 while the site is not set up or an update waits -
  `api/site_state.php`), `maintenanceGate()` (503 while the site is closed),
  `signInGate()` (401 while the IAM requires sign-in) and `routeGate()` (423 for
  a page's locked API paths). `/api/site-status` passes all four. Only a path
  the sign-in card needs, or one a browser loads without a token (an `<img>`'s),
  goes in `SIGN_IN_OPEN_PREFIXES`; an entry of these lists that starts with `~`
  is a pattern the whole path must match (`gatePathOpen()` - the words' bundle,
  exactly `/api/translations/{code}`), any other is a path with everything under
  it. A gate judges the path the router routes on,
  `gatePath()` (`meddleware/maintenance.php`: decoded once, as Slim decodes it) -
  never `getUri()->getPath()`, which keeps the percent-encoding: `/%61pi/characters`
  is routed to `/api/characters`. The sign-in gate has no "outside `/api/`"
  shortcut: what reaches it is the API, open by its list or behind the switch.
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
  (`uploadGuardRules()`: mod_mime's RemoveHandler/RemoveType only, which need
  just AllowOverride FileInfo, as the rewrite rules do; never `php_flag`,
  `Options` or `Require` - each can answer 500 for the folder on a host whose
  AllowOverride does not allow it, and in `assets/` that is every picture),
  shipped by `build-dist.php` and written by the API before an upload where it
  is missing. `php tests/run.php` checks all of it.

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
- **local-lib** (`src/app/shared/local-lib/`) holds the shared UI kit and the
  abstract bases: `AbstractInputComponent`, `AbstractModalComponent` (gives
  `openModal`, `closeModal`, `notificationService`), `AbstractRolesComponent`.
  Build on these rather than reinventing them.
- **Admin CRUD** for an entity lives in `sites/admin/<entity>/<entity>-list/`
  and `<entity>-form/`, wired in `sites/admin/admin.routes.ts` with a nav entry
  in `sites/admin/app.component.ts`. Simple lookup tables use the shared
  `lookup-table` component: a line in `LOOKUP_PAGES` in `sites/admin/pages/pages.ts`
  and `lookupRoute('path')` in `admin.routes.ts`.
- **Public DB pages** live in `sites/main/features/database/<entity>/`.
- **Admin assets**: the **Files** page (`sites/admin/files/`) browses the
  DB-catalogued assets; **Files Explorer** (`sites/admin/files-explorer/`)
  browses the raw disk tree off a cached snapshot. Both preview through the
  shared `file-preview` modal.
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

- `cd frontend && npm run build:deploy` → `frontend/dist/angular/browser/` — a
  production build, plus a prod `config.json` (empty API URL, so `/api` stays
  relative) and an SPA-fallback `.htaccess`. The 2.7 GB `assets/` tree is **not**
  bundled.
- `cd backend && php build-dist.php` → `backend/dist/` — the runtime-only slice:
  `api/` (minus generators/openapi/docs), `config/` (minus every `*.local.php`),
  `vendor/`, `migrations/`, hardened `public/uploads/` + `storage/`, and the
  asset tree's guard `assets/.htaccess` (the tree itself goes up separately).
  Dev tooling, tests and secrets are left out.

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
  the site's version (the footer shows its newest entry) and what What's new
  says. A version is MAJOR.MINOR.PATCH - big changes, new features, bug fixes -
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
