---
name: deploy
description: >
  Build and ship the site to production. Use for "build for production", "deploy",
  "release", "prepare the upload", "how do I put this live", "run the installer",
  or applying a schema change on the live server. Covers the release
  (anotoki-deploy: frontend/ and backend/, swapped in whole, a rollback), the
  installer (setup.php), and applying migrations on an FTP-only host.
---

# Deploy to production

Production is the site's folder, `anotoki.eu/sub/genshin/`, served **same-origin**:
the Angular app at the root, the API under `/api`, images under `/assets/`. The frontend calls
its own `/api`, so there is no second domain and no CORS. The host is
**SFTP-only — no shell**, which is why `vendor/` is shipped, migrations apply
over HTTP, and a first install runs from a web page.

The authoritative, step-by-step version lives in `DEV.md` (*Building for
production* and *Deploying to the hosting*). This skill is the operating summary.

## The release

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

`backend/setup.php` is never in a release: for a first install it goes up by hand
into the live `backend/`, and it deletes itself. The asset tree (`assets/`) goes up
on its own, by SFTP - it is large and changes rarely.

`assets/.htaccess` (on the host) is the asset tree's guard: nothing in the tree
may run as a script (the host's Apache would run `x.php.png` as PHP where PHP is
mapped by AddHandler), no file is sniffed into markup, and anything but a raster
picture goes out as a download (an old `.svg` or `.html` never runs on the
site's origin). It merges into the tree on the host; never leave it out.
Once, and after any upload of files by FTP, look for names that could run -
DEV.md, *Looking for files that could run*.

When a migration renames files in the tree - `024` renamed the demo music to
`HU_TAO.opus`-style names - upload the renamed files **and delete the old names
on the server**. The host is Linux and case-sensitive: `Albedo.opus` and
`ALBEDO.opus` are two files there, where Windows saw one. Upload new files before
applying the migration that points the catalogue at them.

## The IAM first

The API asks the IAM whether this site requires signing in
(`GET https://iam.anotoki.eu/api/public/applications/genshin`, kept a minute in
`storage/cache/`), and reads a 404 - an IAM that does not serve that address
yet, or does not know `genshin` - as **required**: everybody signed out is then
turned away. So when the IAM gains something this site reads, the IAM ships
first. Before uploading, check that address answers 200 with
`"login_required": false` (the switch is the IAM admin's, Applications →
genshin → Settings).

## Configuration

Every per-installation value is in `config/*.local.php` - `database`, `secret`,
`iam` - written by `setup.php`, left out of the builds, never committed.
There are no defaults: without them the API answers every request
`503 not_set_up` and the site shows "This site is not set up yet" (with the setup
page only until `storage/installed.lock` is there - after the first install,
"not available right now"). A deploy never touches them, nor the lock.

One optional file is put on the host by hand, never by setup.php:
`config/visitors.local.php`, the limits on playing without signing in and the
proxies whose `CF-Connecting-IP` names a request's address. The site is behind
Cloudflare, whose published ranges are committed in `config/visitors.php`
(anotoki-lib 0.5.0): nothing to upload for that - a host that is not behind
Cloudflare says `['client_address' => ['trusted_proxies' => []]]` there, and a
file listing ranges of its own replaces Cloudflare's (check it, where there is
one). Every value is checked; a bad one keeps its default and is logged once.

A second one, the same in every anotoki site (anotoki-lib PHP 0.5.2, the
owner's decision of 2026-10-13): `config/cloudflare.local.php`, the origin
secret - `<?php return ['origin_secret' => '<a long random value, 32+ characters>'];`,
the same value as the Cloudflare zone's Transform Rule (Rules → Transform
Rules → Modify Request Header → "Set static" `X-Anotoki-Origin`, every request
of the zone). Set the rule first, then the file; from then on `CF-Connecting-IP`
is believed only on a request carrying the secret. Never print it; without the
file the site works as before (DEV.md, *The origin secret on the host*).

Every one of these files is read cleanly or not at all (since 2026-10-18,
`config/local.php`): save each as UTF-8 **without a BOM**, starting with
`<?php` on its first line. One that does not is never compiled and is passed
over - a required one leaves the site not set up, an unreadable
`cloudflare.local.php` fails closed (every visitor counts as their Cloudflare
edge), an unreadable `visitors.local.php` trusts no proxy - and the PHP log says
which file and why (`[settings] ...`), never a word of it.

## First install (empty database)

The admin "apply migrations" button needs an admin to sign in, which needs the
database the migrations build — a chicken-and-egg only `setup.php` can break.

**The anotoki IAM comes first.** Accounts and sign-in are the IAM's
(iam.anotoki.eu, repository `../anotoki-iam`, its own deploy notes): install it,
with its import of this site's old accounts, before this site's migration
`users/040_accounts_move_to_iam` runs - that migration removes the old account
tables and waits for the import's marker. This site's address must be registered
for the client `genshin` in the IAM (migration 002 there registers
`https://genshin.anotoki.eu`).

1. Create the database in the hosting panel (the app user usually cannot) and
   note its name.
2. Upload the build (above) plus `backend/setup.php`.
3. Open `https://the-site/setup.php`. Off localhost it first writes a random token
   to `config/setup.local.php`; **read that token over SFTP** (proof of server
   access — it is never shown in the browser). The form and its **Test
   connection** buttons both need it.
4. Replace the development values the form starts from: the DB host / port /
   username / password / the database name; the IAM address
   (`https://iam.anotoki.eu`) and client id (`genshin`). That is all it asks.
   Off localhost, the IAM's address must be https and never localhost. This
   site's address is the one the page was opened at (https, also behind the
   host's proxy). Test the database and the IAM (the IAM test also says whether
   the IAM accepts `<site>/auth/callback` for `genshin`), then run the install:
   every migration, then `config/database.local.php`, `secret.local.php` and
   `iam.local.php` - plus `backup.local.php` when the PostgreSQL client tools are
   under `~/pgclient` in the hosting account's home (found by itself; the closing
   page says when they are not). No admin is created:
   sign in through the IAM with an account holding the `genshin` ADMIN role.
5. It writes `storage/installed.lock` (the durable "don't run twice" guard), then
   deletes `config/setup.local.php` and itself. If the host blocks the
   self-delete, remove `setup.php` by hand — the lock still protects it.

## One database

The site keeps everything in one database: the game content and its own half
(translations, settings, page switches, people's records), built by
`migrations/users/` then `migrations/genshin_impact/`, with the anotoki library's
own sets around them (from `vendor/anotoki/lib`): `anotoki_admin` before,
`anotoki_translations` and `anotoki_people` after. Production gets the one
database `setup.php` asks for. A checkout still configured with two
(`'databases'` in `database.local.php`) is merged once with
`php merge-databases.php` before its data goes anywhere - see `DEV.md`,
*A checkout with two databases*.

## Later schema changes (no shell)

FTP the new `migrations/{folder}/*.sql` up, then in the admin **Migrations** page
(`/admin/migrations`) press **Apply pending** (`POST /api/admin/migrations/apply`,
ADMIN). It backs the database up first (the library's backup, which needs no
shell), then runs every pending file in order - the anotoki library's
`anotoki_admin`, `users/`, `genshin_impact/`, the library's `anotoki_translations`
and `anotoki_people` (the library's files come with `vendor/anotoki/lib`) -
stopping at the first failure; a second apply meanwhile is told it is busy. The
engine (anotoki/lib's `Migrator`, set up in `backend/api/migration_runner.php`) is
the same one the CLI and `setup.php` use. From the upload until the Apply the site
shows everybody but its ADMIN "The site is being updated" - so do it in one go:
upload, open the site, Sign in on that page as an ADMIN, Open Migrations, Apply.

Visitor accounts (`users/045`, `046`, `genshin_impact/027`, after `044`): safe
before or after the upload. Once applied, answer one quiz question in a private
window - the dashboard's *visitors* card should then say 1, which proves the
hosting hands the `X-Visitor-Key` header to PHP. DEV.md, *Later schema changes*,
has the whole list.

The account's preferences (2026-10-06; `users/047`, strings only, and `users/048`,
which drops the site's old copy of them - Apply both after the upload, never
before: an older build reads those columns): the IAM's build with `POST /api/oidc/preferences` and its
migration 015 go first - against an IAM without them the site keeps a signed-in
reader's theme and language on their device and saves nothing. Then, signed in,
the admin panel's theme switch sends one `POST` to the IAM, and the IAM's
account page shows the same theme.

The old "not set up" page's strings (2026-10-07; `users/049`, strings only):
safe before or after the upload - nothing reads them since the shared library's
page took that page's place.

The words through the anotoki library (anotoki-lib 0.3.0; `users/050`, `051` and
the library's `anotoki_translations/001`, `002`): export every language from the
admin Translations page and take a dump (Backups page) first; then upload both
builds and Apply at once - never before the upload, and no older build on the
host afterwards (050 changes the shape of the words' tables, which an older build
reads). 050's gate proves every string came through; full copies stay as
`*_before_library` for one release. DEV.md, *Later schema changes*, has the rest.

Signing in, people and the admin tools through the anotoki library (anotoki-lib
0.4.1, 2026-10-11; the library's `anotoki_admin/001`-`002`, `users/052`-`053`,
`genshin_impact/028`-`029`, the library's `anotoki_translations/003`-`004` and
`anotoki_people/001`): upload both builds and Apply at once - never before the
upload, and no older build on the host afterwards (052 drops `users.email`, 053
the old feedback form's and callback page's strings, 028 and 029 move
`audit_logs` and `feedback` into the library's tables under their ids, keeping
the old ones as `*_before_library` until a later release drops them -
`feedback`'s without `ip` and `submitter_hash`). Apply makes a backup first. Then, as the
ADMIN: the Files explorer's **Rescan** once. `robots.txt` with `Disallow: /auth/`
comes with the frontend's build, the asset tree's new `assets/.htaccess`
(nosniff, anything but a picture a download) with `dist/`. Redirect every alias
of the site (`www.`, the host's own name) to the address the IAM knows: the
sign-in hint's silent hop dead-ends at the IAM on any other. The last step, when
the owner no longer wants a way back: `users.email` and the feedback's `ip` and
`submitter_hash` are out of the database but still in the backup the Apply made
first (`storage/backups/*-before-migration-*.anotoki-backup`) and in the old
pg_dump folders (`storage/backups/<stamp>-<hex>/`, `manual/`), and every
request's IP address in the old `storage/logs/errors-*.jsonl` (a keyed hash
there since 0.5.0's first answer, their words scrubbed) - nothing reads them;
they go when the owner deletes them (DEV.md, the 0.4.1 entry).

anotoki-lib 0.5.0 (2026-10-12; `users/054`; the host's PHP needs `mbstring`, and
`zlib` for the backups): upload both builds and Apply at
once - never before the upload, and no older build on the host afterwards (054
deletes the addresses the new visitors' count kept and lets the column take
nothing but a keyed hash, which an older build would not write). Then, as the
ADMIN, on the Backups page, **Back up now**: the library's plain backups are
sealed from this release, and those made before restore offline only. Nothing
for Cloudflare (its ranges are committed); the first answer hashes the
addresses in the old `storage/logs/errors-*.jsonl`; the pages' own errors
arrive in the Error log (`POST /api/client-errors`).

anotoki-lib 0.6.2 (2026-10-18; `users/055`, `056` and the library's
`anotoki_translations/005`-`011`; no schema change): upload both builds and
Apply at once. Then open `/terms`, `/privacy` and `/contact` signed out: the
facts in English and Slovak, the footer's links and fan clause under every
page; the Privacy page names the hosting company, WebSupport s.r.o., as the
owner named it on 2026-10-18 (`GENSHIN_HOSTING` in
`frontend/src/app/sites/main/legal/legal-facts.ts`). For the Privacy
page's "30 days" of the error log and its backups to be the whole truth, delete
the old `storage/logs/errors-*.jsonl` and the old pg_dump folders
(`storage/backups/<stamp>-<hex>/`, `manual/`) by FTP once the owner agrees.

anotoki-lib 0.6.3 (2026-10-18; the library's `anotoki_translations/012`, the
footer's four words; no schema change): upload both builds and Apply at once.
Then the admin panel's pages have the family's footer - Version, What's new,
Feedback, Terms · Privacy · Contact, the fan clause - and the public site's
footer is as it was. A `config/cloudflare.local.php` on the host that names no
usable secret (blank, another key) fails closed from this release: make sure it
holds the zone's value, or delete it.

The public site's footer (2026-10-18; `users/057`, words only - What's new and
the account panel's Background added, Feedback without "/Contact" where nobody
reworded it, the GitHub and Backgrounds items' words gone): upload both builds
and Apply at once - before it, the new footer shows two keys bare; after it, an
older build would show `footer.backgrounds` bare. Then the public footer reads
v1.2.0 · What's new · Feedback · Account · Terms · Privacy · Contact, the fan
clause on its left, and the wallpapers open from the Account panel.

## Copying local data up to production

Production has no shell, but the copy runs from the developer's machine against
the remote database, so no shell is needed there either.

- `php db-push.php` (from `backend/`) is the one-command path: it asks for the target
  connection, dumps local, clears the target (on a managed host, by dropping what
  the site's user owns in `public` - it usually does not own the schema) and
  restores into it. It works whether or not `setup.php` already built the target,
  passes the password through the environment (no `PGPASSWORD` to set by hand),
  and **erases** the target (typed host confirmation). The dump carries schema,
  data and the migrations table, so no migration run is needed after; the target
  keeps its own `config/*.local.php` and `assets/`.
- `php db-dump.php` is the manual alternative: it dumps to a file and prints the
  `pg_restore` command to run yourself (into a database created empty in the
  panel, or add `--clean --if-exists` for one setup.php has already built).
- The dump carries no passwords any more: accounts are the IAM's, and move
  with the IAM, not with this site's database.

Both need the PostgreSQL client tools locally; if `pg_dump`/`pg_restore` are not
on PATH, point `config/backup.local.php` at them. Production cannot run them -
but the admin **Backups** page needs neither (anotoki-lib 0.4.1: COPY through
PDO): it backs production up on the host itself, daily and before every Apply,
and a backup downloads as one `.anotoki-backup` file (`tail -n +3 x.anotoki-backup
| tar -xz` opens it anywhere).

## Constraints to respect

- **No shell / no `proc_open`** in production. `pg_dump` / `pg_restore` will not
  run there (the library's backups need neither). Do not add production
  features that depend on a shell.
- **`.local.php` = this installation's real values**, dev and prod each their own,
  all written by `setup.php`. Nothing committed stands in for them. Never ship or
  commit a `*.local.php`, and never print one.
- **Never overwrite the server's secrets on a redeploy.** The two builds exclude
  `*.local.php`, and `setup.php` will not clobber an existing `secret.local.php`.

## Verify before handing it over

- The release (`dist/`) has no `*.local.php`, no `openapi.json`/`docs.html`; the
  host keeps the upload guards `uploads/.htaccess` and `assets/.htaccess`
  (`php tests/run.php` checks that neither uses `php_flag`, `Options` or
  `Require` - each can answer 500 for the folder on a host whose AllowOverride
  does not allow it).
- `dist/frontend/config.json` is `{ "url": "", ... "prod" }`, beside `index.html`.
- These are build outputs (gitignored) — do not commit `dist/` or
  `frontend/dist/`. Commit only source changes, and only when asked.
