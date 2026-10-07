# backend

The site's JSON API: PHP 8.2+, Slim 4, PostgreSQL. In production it is served
from the same web root as the frontend, under `/api`; in development it runs on
`http://localhost:8000`, and `ng serve`'s proxy hands it the frontend's `/api` -
one origin either way, so the API sends no CORS headers.

## Layout

```text
api/            index.php - the Slim app, every request to /api lands here
  routes/       genshin_impact/ (the game content) and users/ (the site's own half:
                translations, languages, settings, page switches, people's records),
                each with endpoints/, models/ (DbModel) and responses/ (ResponseShape)
  meddleware/   sign-in and roles (the IAM's token; requireOwner() - a player's own data,
                the signed-in person or this browser's visitor; requireVisitorKey() - the
                visitor's key beside a token, for the move at sign-in in users/endpoints/
                visitor.php), the global gates - maintenance,
                sign-in required (the IAM's switch, sign_in.php), page locks - validation
                db_query.php (the query builder), model.php, full_resource.php (shared
                CRUD), migration_runner.php (the migrations on the anotoki sites' shared
                engine, anotoki/lib's Migrator: the two folders, the lock, the order
                guard), site_state.php (where the site stands - not set up, an update
                waiting, ready - and the shared library's gate in front of every route,
                with GET /api/site-status and the admin Migrations page's /api/admin/
                migrations), asset_*.php and
                media_convert.php (the asset tree), upload_guard.php (nothing uploaded
                may run: the names, the folders' .htaccess), anotoki_iam.php (the IAM's token
                verifier and sign-in switch reader, the SDK v1.1.0 vendored byte for byte),
                site_user.php, site_settings.php; visitors.php (playing without signing
                in: make, find, lock, sweep, move into an account at sign-in; ownerWrite(),
                the one way a player's own data is written), client_address.php (the address its limits
                count), after_response.php (work done after the answer - the sweep)
config/         one module per concern (db, secret, iam, site, backup, visitors), read
                through local.php; *.local.php per installation, gitignored, written by
                setup.php - but the optional visitors.local.php, written by hand if at all
migrations/     users/ then genshin_impact/ - the one database's schema, SQL applied in order
public/uploads/ uploaded media (only its .htaccess is committed)
storage/        logs, backups, caches, the visitors' sweep marker (gitignored)
tests/          php tests/run.php - the tests that need no database or server (the
                upload rules so far); never shipped
vendor/         committed: the hosting has no Composer - anotoki/lib, the anotoki sites'
                shared library, among it (updating it: ../DEV.md, The shared library)
```

## Entry points

| File | What it is |
| --- | --- |
| `router.php` | the development server's router: `/api` to `api/index.php`, `/uploads/...` from `public/`, `/setup.php` (it stands in for the hosting's Apache) |
| `setup.php` | the settings page on this computer, the one-time installer on the hosting: the database (`anotoki_genshin` on port 5432 to start from), the IAM and - on a host - the setup token, nothing else (this site's address comes from the request, pg_dump from `~/pgclient`); builds the database and writes `config/*.local.php` |
| `migration.php` | applies pending migrations (`--status`, `--dry-run`, `--folder=users`) |
| `translations.php` | the translation keys the frontend asks for against the database's strings (`--status`) |
| `build-dist.php` | the runtime-only slice for the upload, into `dist/` (with the asset tree's guard, `assets/.htaccess`) |
| `tests/run.php` | the backend's tests, `tests/*.test.php`: no database, no server |
| `generate-api-spec.php` | writes `../frontend/api-spec.json` for the generated client (`npm run api` in `frontend/` calls it) |
| `assets.php` | the asset tree against the catalogue and the rows naming it (`--status`, ...) |
| `db-dump.php`, `db-push.php` | back the database up with pg_dump; copy it to another server |
| `merge-databases.php` | once, for a checkout still configured with two databases |
| `seed_quiz_history.php` | plausible quiz history for looking at the profile page |

## Commands

```bash
composer start               # php -S localhost:8000 router.php - the API and setup.php
                             # then http://localhost:8000/setup.php on a fresh checkout
php migration.php --status   # what has run and what is pending
php migration.php            # apply what is pending (setup.php does this too)
php translations.php --status
php db-dump.php              # before risky data work
php tests/run.php            # the tests: the upload rules, no database, no server
php build-dist.php           # the upload -> dist/
```

## Checking it

The automated tests are few (the sign-in logic lives in the IAM, which has the
suite): `php tests/run.php` runs `tests/*.test.php`, each in a PHP process of its
own, with no database, server or config - so far the upload rules (names,
containment, the `.htaccess` guards). Beyond them, `php -l` every file you
touched, `php migration.php --dry-run` for a new
migration, `npm run api` in `frontend/` for a changed route, then use the API -
the happy path and its 401/403/404/409/422 answers. The IAM's "Sign-in required"
switch, and visitors (a played save by nobody, the key in `X-Visitor-Key`, the
move at sign-in):
`../DEV.md` (*Checking your work*) says how to try them without touching your
own setup.

Everything else - setting up, the code-generation pipeline, backups, the asset
library, deploying - is in [`../DEV.md`](../DEV.md); the conventions are in
[`../CLAUDE.md`](../CLAUDE.md).
