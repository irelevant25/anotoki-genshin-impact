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
  meddleware/   who a request is and what they may (auth.php: the anotoki library's
                Identify in front of everything - a token that does not verify is 401
                invalid_token, but on the few paths that read no token; requireAuth();
                requireOwner() - a player's own data, the signed-in person or this
                browser's visitor; requireVisitorKey() - the visitor's key beside a token,
                for the move at sign-in in users/endpoints/visitor.php; the role groups),
                the global gates - maintenance, sign-in required (the library's SignInGate
                over the IAM's switch, sign_in.php), page locks - validation
                admin_tools.php (anotoki-lib 0.5.0 set up for this site: the IAM and its
                switch - AccessTokens, SignInRule, Identify, in place of the IAM's PHP SDK -
                the people module, and the admin tools: the error log (the pages' own
                errors too), feedback, backups (a restore does again the deletes since its
                backup), the file explorer - its guard keeps every link the content has to
                a file, its previews signed under the site secret - each with this site's
                answers), audit_log.php (the
                library's audit log for this site; the command line loads it too)
                db_query.php (the query builder; its writes are audited), model.php,
                full_resource.php (shared CRUD), migration_runner.php (the migrations on the
                anotoki sites' shared engine, anotoki/lib's Migrator: the library's
                anotoki_admin first, the two folders, its anotoki_translations and
                anotoki_people after them; the lock, the order guard, the backup before an
                Apply), site_state.php (where the site stands - not set up, an update
                waiting, ready - and the shared library's gate in front of every route,
                with GET /api/site-status and the admin Migrations page's /api/admin/
                migrations), asset_*.php and
                media_convert.php (the asset tree; explorer.php its snapshot for the Files
                page's figures), upload_guard.php (nothing uploaded
                may run: the names, the folders' .htaccess - no script, nosniff,
                anything but a picture as a download; and an upload is kept only when
                its bytes are what its name says, 50 MB at most -
                uploadFileAcceptable()), site_user.php (this site's
                record of a person, from the token), site_settings.php; translations.php
                (the words: anotoki/lib's Translations set up for this site - the released
                languages, the guides counted per language, the audit log) and guides.php
                (the guides' pages, guide_contents); visitors.php (playing without signing
                in: make, find, lock, sweep, move into an account at sign-in; ownerWrite(),
                the one way a player's own data is written), client_address.php (where a
                request comes from - the library's ClientAddress: CF-Connecting-IP from
                Cloudflare's ranges alone, with the origin secret only on a request
                carrying it (X-Anotoki-Origin) - for the site's limits and, through the
                AdminContext, the library's; and the keyed hash the limits keep, never
                the address), after_response.php (work done after the answer - the visitors' and
                the people's sweeps, the day's backup, feedback's pruning)
config/         one module per concern (db, secret, iam, site, backup, visitors - its
                committed trusted proxies Cloudflare's ranges -, cloudflare - the origin
                secret, none without its file), read
                through local.php; *.local.php per installation, gitignored, written by
                setup.php - but the optional visitors.local.php and cloudflare.local.php,
                written by hand if at all
migrations/     users/ then genshin_impact/ - the one database's schema, SQL applied in order
                (and the anotoki library's own sets around them, from vendor/: anotoki_admin
                before, anotoki_translations and anotoki_people after)
public/uploads/ uploaded media (only its .htaccess is committed)
storage/        caches, error-log/ (the library's error log), backups/ (the library's
                *.anotoki-backup), explorer/ (the file explorer's trash and snapshots),
                logs/ (the audit log's waiting entries), the visitors' sweep marker
                (gitignored). The site's own error log files from before 0.4.1
                (logs/errors-*.jsonl - each line's address hashed once since 0.5.0) and
                its pg_dump backups (backups/<stamp>-<hex>/, backups/manual/) stay where
                they are, unread: the owner removes them
tests/          php tests/run.php - the upload rules (no database); the words' migration and
                routes, the library's data moves, admin routes, sign-in and gates, the
                addresses (Cloudflare, keyed hashes), what
                a silent sign-in brings in (the visitor's move, the browser's games'
                carry), the command line (throwaway databases, db_lib.php); tools/
                browser-env.php, the throwaway site frontend/scripts/screenshots.mjs
                shows its pages on (a database with a little game content, a backend
                copy; `down` drops it); never shipped
vendor/         committed: the hosting has no Composer - anotoki/lib, the anotoki sites'
                shared library, among it (updating it: ../DEV.md, The shared library)
```

## Entry points

| File | What it is |
| --- | --- |
| `router.php` | the development server's router: `/api` to `api/index.php`, `/uploads/...` from `public/`, `/setup.php` (it stands in for the hosting's Apache) |
| `setup.php` | the settings page on this computer, the one-time installer on the hosting: the database (`anotoki_genshin` on port 5432 to start from), the IAM and - on a host - the setup token, nothing else (this site's address comes from the request, pg_dump from `~/pgclient`); builds the database and writes `config/*.local.php` |
| `migration.php` | applies pending migrations, every set in order - the library's around the two folders - after a backup of the database as it is (`--status`, `--dry-run`, `--folder=users`) |
| `translations.php` | the words from the command line, the library's `TranslationsCommand`: `--status` (the keys the frontend uses against the database's, each language's coverage), `--export sk [file]` / `--import sk file`; it makes no key - keys come with migrations |
| `build-dist.php` | the runtime-only slice for the upload, into `dist/` (with the asset tree's guard, `assets/.htaccess`) |
| `tests/run.php` | the backend's tests, `tests/*.test.php`: the upload rules; on throwaway `genshin_test_*` databases the words' migration and routes, the library's data moves and admin routes, the addresses and what is kept of them, what a silent sign-in brings in, the command line |
| `generate-api-spec.php` | writes `../frontend/api-spec.json` for the generated client (`npm run api` in `frontend/` calls it) |
| `assets.php` | the asset tree against the catalogue and the rows naming it (`--status`, ...) |
| `db-dump.php`, `db-push.php` | back the database up with pg_dump; copy it to another server (the computer's own PostgreSQL client - the admin panel's Backups need none) |
| `merge-databases.php` | once, for a checkout still configured with two databases |
| `seed_quiz_history.php` | plausible quiz history for looking at the profile page |

## Commands

```bash
composer start               # php -S localhost:8000 router.php - the API and setup.php
                             # then http://localhost:8000/setup.php on a fresh checkout
php migration.php --status   # what has run and what is pending
php migration.php            # apply what is pending, after a backup (setup.php applies too)
php translations.php --status   # the keys the pages use against the database's
php db-dump.php              # a pg_dump of your own, besides the library's backups
php tests/run.php            # the tests (throwaway databases); on PHP 8.2 too
php build-dist.php           # the upload -> dist/
```

## Checking it

`php tests/run.php` runs `tests/*.test.php`, each in a PHP process of its own -
on PHP 8.2 too, as the hosts run 8.2 and up: the upload rules (names,
containment, the `.htaccess` guards, an upload's bytes and size) with no
database, server or config; the
words: `translations-migration` builds a database from this site's own
migrations, words it as an owner would and proves `users/050` keeps every
string (and `users/053` takes only the old feedback form's and callback
page's); `translations-routes` drives the library's routes, the guides and the
gates in-process; the anotoki library's 0.5.0 modules: `library-tools-migration`
moves a database shaped like an installed one, with rows in every table that
moves, through `users/052`, `054` and `genshin_impact/028`-`029` and proves every
row came through under its id (and no address left); `library-tools-routes`
drives every admin tool's route (nobody, a MEMBER, an EDITOR, the ADMIN), who a
request is, the feedback form, the pages' error reports, a backup made (sealed),
downloaded and restored (the deletes since done again inside it, the scrub
after it), an unsealed one refused, the file explorer's rules and every link to
a file kept through its renames, moves, a refused delete and an Undo, a preview
link signed under the installation's key refused, the People page and the
scrub, and the gates around them; `addresses` where a request comes from
(Cloudflare's word from Cloudflare alone) and that only keyed hashes of it are
kept; `origin-secret` the same with the origin secret in `cloudflare.local.php`
(Cloudflare's word only on a request carrying it: none sent or a wrong one the
edge, the visitors' and feedback's limits counting the edge, what the file may
hold - never logged; one that cannot be read cleanly fails closed);
`settings-files` every `config/*.local.php` read cleanly or not at all - one
that does not start with `<?php` never compiled, one that prints caught - and
the attacks it stops, through the whole API in a process a case (a BOM'd
database file's password in no answer; a BOM or a blank line before `<?php
declare(strict_types=1);` not set up, never a 500; an unreadable
`cloudflare.local.php` failing closed; an unreadable `visitors.local.php`
trusting no proxy; a broken `site.local.php` not set up); `migration-cli` runs
`migration.php` itself. All but the first make `genshin_test_*` databases on
the PostgreSQL server `config/database.local.php` names, drop them when done,
and are skipped where there is none. Beyond them, `php -l` every file you
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
