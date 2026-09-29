# anotoki · genshin_impact

A Genshin Impact fan site: a public reference-and-quiz site, plus an admin panel
that maintains its data. Three parts.

| Part | Folder | Stack |
| --- | --- | --- |
| Backend | `backend/` | PHP 8.2+, Slim 4, PostgreSQL |
| Frontend | `frontend/` | Angular 21, standalone + zoneless, signals |
| Docs | `docs/` | Generated HTML reports: `performance/`, `security/`, `reference/` |

**Ignore these root folders** — they are not part of the app: `formats-converters`
(the local AVIF/Opus conversion scripts; on this machine the backend's upload
conversion also borrows their ffmpeg), `local` (gitignored: the wiki crawlers in
`local/crawling/` and the importer in `local/crawling-old/` that loads what they
produce through the API — its `import_scripts/README.md` is the guide when a
task is about importing data), `old` (the pre-rewrite Vue codebase).

Read `docs/reference/reference-*.html` for a generated map of the whole app —
every frontend page, backend endpoint, and database table, cross-linked.

`README.md` says what the site is; `DEVELOPING.md` is the human guide — setup
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
(`QUERIES`, `NAMES`, `BODIES`, `RESPONSES`, `BLOBS`, `GROUP_DOCS`), then
`api:client` is re-run. None of it needs a database or config. The
**sync-api-client** skill covers this.

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
| `app.local.php` | this site's own `url`, and any other `cors_origins` |

Optional: `backup.local.php` (pg_dump paths), `site.local.php` (a site code other
than `genshin_impact`).

Without them the API answers every request `503 {"code": "not_set_up"}`, pointing
at `/setup.php` (the gate at the top of `api/index.php`), and the frontend draws a
"not set up yet" page (`shared/not-set-up/`) instead of either site.

**`backend/setup.php` writes all of them — in development too.** Run the backend
(`php -S localhost:8000 router.php` in `backend/`) and open
`http://localhost:8000/setup.php`: on this computer (the built-in server, a
loopback address, a localhost Host) it needs no token, starts from the
development values, has **Test connection** buttons for the database and the IAM,
shows what is saved (never a secret; a blank password keeps it), applies pending
migrations, and can be run again whenever a setting changes. On a real host it is
the one-time installer: token file, lock, self-delete. Do not hand-edit the
`.local.php` files when setup.php can write them, and never print their contents.

## Signing in — the anotoki IAM

This site has no login of its own. Every anotoki site signs people in through
one identity provider, the **anotoki IAM** at iam.anotoki.eu (repository
`../anotoki-iam`; its `docs/integrating-an-app.md` is the contract).
Registration, passwords, emailed codes, Google, two-factor, sessions, the account
page and the admin pages for accounts all live there.

- **Frontend**: the vendored browser SDK (`anotoki-auth.mjs` in local-lib) does
  the OpenID Connect code flow with PKCE - "Sign in" goes to the IAM and comes
  back to `/auth/callback` - and the interceptor sends the access token as
  `Authorization: Bearer`. The issuer and client id come from
  `GET /api/settings/public` (`auth`).
- **Backend**: `api/site_user.php` verifies the token with the vendored
  `api/anotoki_iam.php` (RS256 against the IAM's published keys, issuer,
  audience `genshin`, `typ at+jwt`, expiry) and keeps the `users` row - id =
  the IAM user id, name, address, this site's preferences - in step with it.
  Config: `config/iam.local.php` (dev: issuer `http://localhost:4300`).
- **Roles** (`ADMIN`, `EDITOR`) are granted per site in the IAM's admin console
  and arrive in the token; revoking one reaches this site within one token
  lifetime (10 minutes).
- **Locally**, sign-in needs the IAM running: its API on 8100 and its pages on
  4300 (see the IAM's DEVELOPING.md). It registers `http://localhost:4200` for
  `genshin` by default; `php clients.php --dev` in its `backend/` puts that back.
  setup.php's IAM test says whether it answers and knows this site.
- **Scripts** (the importer in `local/`, the benchmark) use a personal token
  from the IAM account page ("Tokens for scripts"), exchanged at the IAM's token
  endpoint - never an email and password.

## Commands

```
# Backend (from backend/)
php -S localhost:8000 router.php     # dev server (mimics the production Apache; serves /setup.php too)
                                     # then http://localhost:8000/setup.php on a fresh checkout
php migration.php                    # create missing + apply pending migrations
php migration.php --status           # what has run and what is pending
php migration.php --dry-run          # what would apply, applying nothing
php migration.php --folder=users     # one migrations folder only
php db-dump.php                      # back the database up (pg_dump) before risky data work
php merge-databases.php              # once, on a checkout still configured with two databases
php assets.php --status              # the asset tree against the catalogue and the rows naming it

# Frontend (from frontend/)
npm start                            # ng serve on :4200 (checks node version first)
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
  small record of each person - name, address, preferences; the accounts
  themselves are the IAM's). Routes live in `backend/api/routes/genshin_impact/`
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
  function must not take a name the other folder uses. (The order matters for
  history: `users/001` made an account table called `roles`, which `users/040`
  dropped before `genshin_impact/` makes its own; running `users/` over a database
  that already holds the content is refused - `migrationsOrderRefusal()` in the
  engine.) Migrations that change data
  carry a `DO $$ … $$` verification gate that fails loudly if the result is
  wrong. Never edit an applied migration — add a new one (old ones still say
  `php/` and `angular/` in their comments; leave them). The engine
  (`backend/api/migration_runner.php`) is shared: the CLI, the admin **Migrations**
  page's *Apply pending* button (`POST /api/migrations/apply`, ADMIN — for hosts
  with no shell), and the installer `backend/setup.php` all build the database the
  same way. A closed set of values is a `CHECK (col IN (...))` on the column —
  `characters.arkhe` (022), `characters_voice_overs.type` (025) — not a lookup
  table or a Postgres ENUM: the spec generator reads the CHECK into a TypeScript
  union. Its replay understands CREATE TABLE, ALTER TABLE (add, drop, rename or
  retype a column; add a CHECK) and DROP TABLE; anything else changes the
  database without changing the generated client.
- **Config** is read through `config/local.php` (`localConfig()`), one module
  per concern: `db.php`, `secret.php`, `iam.php`, `app.php`, `site.php`,
  `backup.php`. A value that differs per installation goes in a `.local.php`
  that setup.php writes, never in a committed default.
- **Auth is the anotoki IAM's** (see *Signing in* above). `requireAuth()`
  (`api/meddleware/auth.php`) verifies the IAM access token and puts `user` on the
  request - this site's record of the person plus the `role` the token grants
  here (ADMIN / EDITOR / USER). Role groups: `ROLES_CONTENT` (ADMIN/EDITOR,
  writing game content), `ROLES_SYSTEM_READ`, `ROLES_SYSTEM_WRITE`. Ownership via
  `requireSelfOrAdmin` / `refuseForeignUserId`. `optionalAuthUser()` for open
  endpoints that behave differently when signed in; `recentSignInRefusal()` for
  the few actions that want a sign-in from the last ten minutes (restoring a
  backup).
- **Assets**: files live under `assets/` (untracked), catalogued in the `files`
  table; every asset column across the entity tables is a foreign key into it.
  `backend/api/asset_columns.php` lists which columns are assets. The tree holds the
  converted formats only (AVIF, Opus): uploads are re-encoded by
  `api/media_convert.php` and named by `api/asset_naming.php` (`assetBaseName()`:
  "Hu Tao" → `HU_TAO`). A column's `{field}_name` is the file's name only where
  `assetColumnMap()` says so — `constellation_name` and `demo_music_name` are
  columns of their own.

## Frontend layout & conventions

- **Two sites**: `frontend/src/app/sites/main/` (public) and `sites/admin/`. The
  root component draws `shared/not-set-up/` instead of either while the API says
  `not_set_up`.
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
- **i18n**: user copy goes through the `translate` pipe with a key; proper
  nouns (character names, usernames, version numbers) are shown as they are, not
  through the pipe. Dates go through `AppDatePipe`. New keys arrive in a `users`
  migration with English and Slovak strings (`php translations.php --status`
  checks the code against the database).
- **Theming**: the site has light/dark; never hard-code a colour that only works
  in one theme.

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
  `vendor/`, `migrations/`, and hardened `public/uploads/` + `storage/`. Dev
  tooling and secrets are left out.

Upload both into the web root, plus `assets/` separately. Production is
**FTP-only, no shell**, which shapes everything: `vendor/` ships in the dist (no
`composer install` on the server); the **first install** runs through
`backend/setup.php`, uploaded by hand (it asks for the DB connection, the IAM
address + this site's client id, and this site's address, with a token only FTP
access can read; writes every `*.local.php`, then locks and deletes itself - there
is no admin to create here, the IAM holds the accounts and must be installed
first); and **later schema changes** go through the admin Migrations page, since
`php migration.php` cannot run there.

Full steps — the upload map, the installer, a checkout that still has two databases, the
constraints — are in `DEVELOPING.md` (*Deploying to the hosting*). The **deploy**
skill covers this workflow.

## Working conventions

- **Regenerate, don't hand-edit generated code** — see the pipeline above.
- **Comment style**: explain *why*, in plain prose, at the point a reader would
  wonder. Match the surrounding density; the codebase favours a short paragraph
  over a redundant restatement of the code.
- **Stage only your own edits.** The maintainer edits alongside you. Never
  `git add -A`/`git add .`; stage the exact files you changed, by path. Leave
  `formats-converters/`, `local/`, `old/` alone.
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
