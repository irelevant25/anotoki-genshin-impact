# anotoki · genshin_impact

A Genshin Impact fan site: a public reference-and-quiz site, plus an admin panel
that maintains its data. Three parts.

| Part | Folder | Stack |
| --- | --- | --- |
| Frontend | `angular/` | Angular 21, standalone + zoneless, signals |
| Backend | `php/` | PHP 8.2, Slim 4, PostgreSQL |
| Docs | `docs/` | Generated HTML reports: `performance/`, `security/`, `reference/` |

**Ignore these root folders** — they are not part of the app: `formats-converters`
(the local AVIF/Opus conversion scripts; on this machine the backend's upload
conversion also borrows their ffmpeg), `local` (gitignored: the wiki crawlers in
`local/crawling/` and the importer in `local/crawling-old/` that loads what they
produce through the API — its `import_scripts/README.md` is the guide when a
task is about importing data), `old` (the pre-rewrite Vue codebase).

Read `docs/reference/reference-*.html` for a generated map of the whole app —
every frontend page, backend endpoint, and database table, cross-linked.

`DEVELOPING.md` at the repo root is the human setup-and-run guide (prerequisites,
first-time local setup, day-to-day, building for production).

## The code-generation pipeline — read this first

The Angular API client is **generated from the backend**, not hand-written. The
backend's own route table, response shapes and migrations are read into
`angular/api-spec.json`, and the typed client under `angular/src/app/api/` is
generated from that. Editing files under `angular/src/app/api/` by hand is
almost always a mistake — they are overwritten.

After any change to a backend route, its `responds()` shape, a `DbModel`, or a
migration, regenerate:

```
cd angular && npm run api        # = api:spec (PHP) + api:client + api:docs
```

Or the steps individually: `npm run api:spec`, `npm run api:client`,
`npm run api:docs`. Method names, query types and response types that the
generator gets wrong are corrected in `angular/api-config.mjs`
(`QUERIES`, `NAMES`, `BODIES`, `RESPONSES`, `BLOBS`, `GROUP_DOCS`), then
`api:client` is re-run. The **sync-api-client** skill covers this.

## Commands

```
# Backend (from php/)
php -S localhost:8000 router.php     # dev server (mimics the production Apache)
php migration.php                    # create missing + apply pending migrations
php migration.php --status           # what has run and what is pending
php migration.php --dry-run          # what would apply, applying nothing
php migration.php --db=users         # one database only
php db-dump.php                      # back both databases up (pg_dump) before risky data work
php assets.php --status              # the asset tree against the catalogue and the rows naming it

# Frontend (from angular/)
npm start                            # ng serve on :4200 (checks node version first)
npm run api                          # regenerate the API client (see above)
npm run lint

# Production build (see Deployment)
cd angular && npm run build:deploy   # FE → dist/angular/browser/ (prod config.json + SPA .htaccess)
cd php && php build-dist.php          # BE → php/dist/ (runtime-only slice; no secrets, no dev tooling)

# Docs generators (from repo root)
node docs/reference/build-docs.mjs
node docs/performance/bench-endpoints.mjs <email> <password>   # then:
node docs/performance/build-report.mjs
node docs/security/build-report.mjs                            # after re-running the tools
```

## Backend layout & conventions

- **Per database, per concern.** `php/api/routes/genshin_impact/` and
  `php/api/routes/users/`, each with `endpoints/`, `models/`, `responses/`.
  Two databases: `genshin_impact` (content) and `users` (accounts, sessions,
  translations, settings).
- **Endpoints** are `$app->get(...)` calls at the top of a file that is
  `require_once`'d in `php/api/index.php`. They end with a middleware chain:
  `->add(responds(...))->add(requireRole(...ROLES_CONTENT))->add(requireAuth())`.
- **`responds($shape, list: bool)`** declares what an endpoint returns — a
  snake_case table name (schema read from replayed migrations) or a PascalCase
  `ResponseShape` subclass in `responses/`.
- **`DbQuery`** (`php/api/db_query.php`) is the query builder — always
  parameterised; table/column identifiers come from literals or whitelisted
  `DbModel` fields, never request input.
- **`DbModel`** (`php/api/model.php`) subclasses in `models/` map a table:
  constructor params are the columns; `fromBody()`/`toDbArray()`/
  `partialToDbArray()` whitelist by those params (no mass assignment).
- **`registerFullResource()`** (`php/api/full_resource.php`) is the shared CRUD
  for a parent-with-children resource (weapons, artifacts, foods, enemies,
  materials, banners) — see the `*_full.php` endpoints. Response metadata for
  these comes from `fullResourceShapes()`.
- **Characters are the exception**: `characters_full.php` is hand-written, and a
  character's talents (with their costs), ascensions, constellations and
  voice-overs belong to shared **sets** (`characters_*_sets`, migrations 016–020)
  that the character points at, so the Traveler's variants share one copy. It
  writes through the set, and leaves alone a set the character was just
  repointed at.
- **Migrations are the schema.** `php/migrations/{genshin_impact,users}/NNN_name.sql`,
  applied in order by `php migration.php`. There is no separate schema file;
  the database is what you get by replaying them. Migrations that change data
  carry a `DO $$ … $$` verification gate that fails loudly if the result is
  wrong. Never edit an applied migration — add a new one. The engine
  (`php/api/migration_runner.php`) is shared: the CLI, the admin **Migrations**
  page's *Apply pending* button (`POST /api/migrations/apply`, ADMIN — for hosts
  with no shell), and the first-run installer `php/setup.php` all build a
  database the same way. A closed set of values is a `CHECK (col IN (...))` on
  the column — `characters.arkhe` (022), `characters_voice_overs.type` (025) —
  not a lookup table or a Postgres ENUM: the spec generator reads the CHECK into
  a TypeScript union. Its replay understands CREATE TABLE, ALTER TABLE (add,
  drop, rename or retype a column; add a CHECK) and DROP TABLE; anything else
  changes the database without changing the generated client.
- **Auth**: JWT (`config/jwt.php`, secret in gitignored `config/jwt.local.php`),
  session-backed and revocable; roles re-read from the DB each request. Role
  groups: `ROLES_CONTENT` (ADMIN/EDITOR, writing game content),
  `ROLES_SYSTEM_READ`, `ROLES_SYSTEM_WRITE`. Ownership via `requireSelfOrAdmin` /
  `refuseForeignUserId`.
- **Assets**: files live under `assets/` (untracked), catalogued in the `files`
  table; every asset column across the entity tables is a foreign key into it.
  `php/api/asset_columns.php` lists which columns are assets. The tree holds the
  converted formats only (AVIF, Opus): uploads are re-encoded by
  `api/media_convert.php` and named by `api/asset_naming.php` (`assetBaseName()`:
  "Hu Tao" → `HU_TAO`). A column's `{field}_name` is the file's name only where
  `assetColumnMap()` says so — `constellation_name` and `demo_music_name` are
  columns of their own.

## Frontend layout & conventions

- **Two sites**: `angular/src/app/sites/main/` (public) and `sites/admin/`.
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
  `lookup-table` component, configured in `sites/admin/pages/pages.ts`.
- **Public DB pages** live in `sites/main/features/database/<entity>/`.
- **Admin assets**: the **Files** page (`sites/admin/files/`) browses the
  DB-catalogued assets; **Files Explorer** (`sites/admin/files-explorer/`)
  browses the raw disk tree off a cached snapshot. Both preview through the
  shared `file-preview` modal.
- **i18n**: user copy goes through the `translate` pipe with a key; proper nouns
  (character names, usernames, version numbers) are shown as they are, not
  through the pipe. Dates go through `AppDatePipe`.
- **Theming**: the site has light/dark; never hard-code a colour that only works
  in one theme.

## Deployment

The site ships to **one web root, served same-origin** (the frontend calls its
own `/api`). Two builds assemble it, neither adding anything the running app
would not have:

- `cd angular && npm run build:deploy` → `dist/angular/browser/` — a production
  build, plus a prod `config.json` (empty API URL, so `/api` stays relative) and
  an SPA-fallback `.htaccess`. The 2.7 GB `assets/` tree is **not** bundled.
- `cd php && php build-dist.php` → `php/dist/` — the runtime-only slice: `api/`
  (minus generators/openapi/docs), `config/` (minus every `*.local.php` and
  `google.php`), `vendor/`, `migrations/`, and hardened `public/uploads/` +
  `storage/`. Dev tooling and secrets are left out.

Upload both into the web root, plus `assets/` separately. Production is
**FTP-only, no shell**, which shapes everything: `vendor/` ships in the dist (no
`composer install` on the server); the **first install** runs through
`php/setup.php` (asks for the DB connection + admin + email + an optional Google
client ID, writes `database.local.php`, `jwt.local.php`, `mail.local.php` and
`google.local.php` itself, then self-deletes); and **later schema changes** go
through the admin Migrations page, since `php migration.php` cannot run there.
`setup.php` is uploaded by hand and is not part of `build-dist.php`.

Full steps — the upload map, the secrets to place by hand, the installer, the
constraints — are in `php/README.md` (*Deploying to Hosting*) and `DEVELOPING.md`.
The **deploy** skill covers this workflow.

## Working conventions

- **Regenerate, don't hand-edit generated code** — see the pipeline above.
- **Comment style**: explain *why*, in plain prose, at the point a reader would
  wonder. Match the surrounding density; the codebase favours a short paragraph
  over a redundant restatement of the code.
- **Stage only your own edits.** The maintainer edits alongside you. Never
  `git add -A`/`git add .`; stage the exact files you changed, by path. Leave
  `formats-converters/`, `local/`, `old/` alone.
- **Shut the dev servers down** (PHP on 8000, `ng serve` on 4200) before ending
  a task that started them.
- **Commit only when asked.** End commit messages with the Co-Authored-By
  trailer.
- **Secrets**: `config/*.local.php` are per-machine and gitignored (except
  `database.local.php`, tracked on purpose with dev-only values). Never expose
  the Postgres password or the JWT secret in output.

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
- **skill: deploy** — build and ship to production (the two builds, first-run
  installer, and applying migrations on an FTP-only host).
- **skill: refresh-docs** — regenerate the security / performance / reference reports.
- **agent: backend-engineer** — PHP/Slim work in the conventions above.
- **agent: frontend-engineer** — Angular/signals/local-lib work.
- **agent: code-reviewer** — read-only review against these conventions and the security findings.
