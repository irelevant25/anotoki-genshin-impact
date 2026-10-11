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
                engine, anotoki/lib's Migrator: the two folders, then the library's own
                set, the lock, the order guard), site_state.php (where the site stands - not set up, an update
                waiting, ready - and the shared library's gate in front of every route,
                with GET /api/site-status and the admin Migrations page's /api/admin/
                migrations), asset_*.php and
                media_convert.php (the asset tree), upload_guard.php (nothing uploaded
                may run: the names, the folders' .htaccess), anotoki_iam.php (the IAM's token
                verifier and sign-in switch reader, the SDK v1.1.0 vendored byte for byte),
                site_user.php, site_settings.php; translations.php (the words: anotoki/lib's
                Translations set up for this site - the released languages, the guides
                counted per language, the audit log) and guides.php (the guides' pages,
                guide_contents); visitors.php (playing without signing
                in: make, find, lock, sweep, move into an account at sign-in; ownerWrite(),
                the one way a player's own data is written), client_address.php (the address its limits
                count), after_response.php (work done after the answer - the sweep)
config/         one module per concern (db, secret, iam, site, backup, visitors), read
                through local.php; *.local.php per installation, gitignored, written by
                setup.php - but the optional visitors.local.php, written by hand if at all
migrations/     users/ then genshin_impact/ - the one database's schema, SQL applied in order
                (then the anotoki library's own set, anotoki_translations, from vendor/)
public/uploads/ uploaded media (only its .htaccess is committed)
storage/        logs, backups, caches, the visitors' sweep marker (gitignored)
tests/          php tests/run.php - the upload rules (no database), the words' migration and
                routes (throwaway databases, db_lib.php); never shipped
vendor/         committed: the hosting has no Composer - anotoki/lib, the anotoki sites'
                shared library, among it (updating it: ../DEV.md, The shared library)
```

## Entry points

| File | What it is |
| --- | --- |
| `router.php` | the development server's router: `/api` to `api/index.php`, `/uploads/...` from `public/`, `/setup.php` (it stands in for the hosting's Apache) |
| `setup.php` | the settings page on this computer, the one-time installer on the hosting: the database (`anotoki_genshin` on port 5432 to start from), the IAM and - on a host - the setup token, nothing else (this site's address comes from the request, pg_dump from `~/pgclient`); builds the database and writes `config/*.local.php` |
| `migration.php` | applies pending migrations, both folders and then the library's set (`--status`, `--dry-run`, `--folder=users`) |
| `translations.php` | the words from the command line, the library's `TranslationsCommand`: `--status` (the keys the frontend uses against the database's, each language's coverage), `--export sk [file]` / `--import sk file`; it makes no key - keys come with migrations |
| `build-dist.php` | the runtime-only slice for the upload, into `dist/` (with the asset tree's guard, `assets/.htaccess`) |
| `tests/run.php` | the backend's tests, `tests/*.test.php`: the upload rules; the words' migration and routes on throwaway `genshin_test_*` databases |
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
php translations.php --status   # the keys the pages use against the database's
php db-dump.php              # before risky data work
php tests/run.php            # the tests: the upload rules; the words (throwaway databases)
php build-dist.php           # the upload -> dist/
```

## Checking it

The automated tests are few (the sign-in logic lives in the IAM, which has the
suite): `php tests/run.php` runs `tests/*.test.php`, each in a PHP process of its
own - the upload rules (names, containment, the `.htaccess` guards) with no
database, server or config, and the words: `translations-migration` builds a
database from this site's own migrations, words it as an owner would and proves
`users/050` keeps every string; `translations-routes` drives the library's routes,
the guides and the gates in-process. Those two make `genshin_test_*` databases on
the PostgreSQL server `config/database.local.php` names, drop them when done, and
are skipped where there is none. Beyond them, `php -l` every file you
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
