---
report: Deep analysis of anotoki-genshin-impact
repository: https://github.com/irelevant25/anotoki-genshin-impact
analyzed_commit: 17a0c5472 (main, tag 0.9, 2026-09-05 "Add the v0.9 changelog, and pop it up when the version is new")
analysis_date: 2026-09-23
method: full clone with history; runtime verification of the PHP API on PostgreSQL 16; static review of PHP, SQL, Angular, tooling, CI and docs; production checks limited to public non-sensitive URLs and DNS; every finding and section re-checked against the code by two independent review passes
findings: 40 (P0 7, P1 10, P2 14, P3 9)
companion: anotoki-findings.json (same findings and decisions, machine-readable)
---

# Anotoki (Genshin Impact): deep project analysis

## 0. How to use this report

This report is written for Claude Code agents (and the owner) to decide what to work on and how. Read §1 for the picture, §5 for the work, §8 for what must not be decided without the owner, and §10 before changing code.

Rules for agents:

1. **IDs are stable.** Findings are `ANL-01` to `ANL-40`, decisions `D1` to `D10`. Numbers do not imply priority: the index in §5.1 is in priority order. Refer to them in branch names, commit messages and PR descriptions. The same data is in `anotoki-findings.json`.
2. **Line numbers refer to commit `17a0c5472`.** Re-locate the code before editing; the repo may have moved on. Paths do too: since 2026-09-28 `php/` is `backend/` and `angular/` is `frontend/`.
3. **Do not act on a finding that names a decision (`D#`) until the owner has answered it.** Everything else is safe to pick up in priority order.
4. **Trust code over comments.** This codebase explains itself at length, and most comments are accurate, but §5 (`ANL-32`) lists ones that are now wrong. When a comment and the code disagree, verify at runtime.
5. **Every fix ships with a check.** Each finding has a *Verify* line. Turn it into a test where the toolchain allows (see `ANL-15`, Appendix C).
6. **`needs-host-check` findings** depend on the production server. Ask the owner, or check on the host, before changing deploy-related files.

## 1. Executive summary

- **What it is.** Anotoki is a fan site for Genshin Impact: daily quizzes, a quiz collection (banners, dish, mismatch, music, pixelate, voice), games (tournament, elemental minesweeper), a public game database (characters, weapons, materials, banners), accounts with profile statistics, and a large admin panel that manages all content, translations, media files, backups and site switches. It is live at `https://anotoki.eu` (v0.9, released 2026-09-05). A Honkai: Star Rail sister site is planned; the `users` database and the `site` concept are already shared.
- **Stack.** An Angular 21 SPA (standalone, zoneless, signals) and a PHP 8.2+ Slim 4 JSON API on PostgreSQL, served same-origin under `/api` on Apache shared hosting (Websupport), with a ~10 GB media tree outside git. The API is described from its own route table, and an OpenAPI document and a TypeScript client are generated from it.
- **Maturity.** Rebuilt from a Vue prototype into Angular/PHP/Postgres between 2026-03 and 2026-09. Since 2026-08-28 almost every commit (93 of the last ~105 on main) is co-authored by Claude. The code is thoughtful and heavily documented, but has **no automated tests, no CI beyond a misconfigured Pages deploy, and a hand-run deployment**.
- **Top risks (fix first).**
  1. `ANL-36` and `ANL-37`: two ways into someone else's account. A password-reset link signs in without the second factor, and Google sign-in adopts an account that someone pre-registered with the owner's address, keeping that person's password. Google sign-in and registration are both switched on in production.
  2. `ANL-01`: deleting content does not remove it. The content read endpoints (lists, details, /full, random) and the site ignore the `deleted` flag; only a few reads filter it.
  3. `ANL-02`: voice-over audio uploaded in the character form is thrown away.
  4. `ANL-03` and `ANL-04`: the sign-in-code endpoints are unthrottled. One of them leaks whether a 2FA code is right, which defeats 2FA for anyone who has the password; together they allow unlimited sign-in-code mail to any confirmed account without 2FA, and about 720 a day to one with 2FA.
  5. `ANL-05`: a fresh install cannot sign in with the documented credentials, and the obvious workaround would ship a public admin password that the API does not force anyone to change.
  6. `ANL-06` and `ANL-35`: the admin HTML editor runs stored markup, and tokens live in localStorage with no CSP. An editor account is one step from the admin account.
- **One host check with a wide effect.** The site sits behind Cloudflare, and every rate limit keys on `REMOTE_ADDR`. Unless the host restores visitor addresses, all limits are shared per Cloudflare edge address (`ANL-38`). One SQL query in production settles it.
- **Cheap, high-leverage wins.** Re-pointing eight old tags cuts clone size from ~9.3 GB to ~1.8 GB (`ANL-10`). Deleting the Pages workflow (`ANL-11`), fixing the route-gate decoding (`ANL-07`), and auditing deletes (`ANL-08`) are each a few lines. Making the code generators deterministic (`ANL-16`) removes phantom diffs on Linux agents.
- **What is solid.** SQL is parameterised with allowlisted identifiers. Path handling resists traversal. Sessions are server-side, revocable and named by random 128-bit ids. Per-user reads are ownership-checked (two writes are not: `ANL-39`). CORS uses an allowlist, and API responses carry security headers. Backup/restore is careful. Migrations build a correct database from zero, and the generated spec and client match the code (the committed `openapi.json` does not: `ANL-32`). All of this was verified; see §6.
- **Biggest structural gap for agent work.** There is no test or CI safety net. The documented `npm start` exits on Linux/macOS unless Node is exactly 22.15.0, and `npm run lint` cannot run as committed (`ANL-15`). Setting that up (§9, phase 1) will make every later change cheaper and safer.

## 2. Project at a glance

| Aspect | Facts (verified at `17a0c5472`) |
|---|---|
| Frontend | Angular 21.2.0 (lockfile), TypeScript 5.9, SCSS; standalone components, `provideZonelessChangeDetection()`, signals (530 `signal`, 364 `computed`, 25 `effect`); one app with two "sites": main (`/`) and admin (`/admin`, lazy) |
| Backend | PHP (README: 8.2.12; verified lint + run on 8.4.21; no 8.3+-only features found), Slim 4.15.3, slim/psr7 1.8.0 (vendored in `php/vendor`), procedural modules + reflection-based DTOs (`DbModel`) + a small query builder (`DbQuery`) |
| Database | PostgreSQL (README 18.3; all migrations verified on 16.13). Databases: `users` (17 tables, shared by all sites), `genshin_impact` (64 tables), `star_rail` (declared, empty) |
| API surface | 399 routes: GET 174, POST 92, PUT 64, DELETE 69. Auth: 139 public, 35 any signed-in user, 204 ADMIN/EDITOR, 21 ADMIN-only. 59 request models, 124 response shapes |
| Frontend size | 175 component files (main 53, admin 69, shared `local-lib` 52, root 1); ~51.8k non-blank lines hand-written (TS 27.9k, SCSS 13.4k, HTML 10.5k) + the API client in `src/app/api` (67 files, 7.7k lines: 53 generated, 14 hand-written types and helpers) |
| Backend size | `php/api` 17.5k PHP lines (+ generated `openapi.json`, stale: `ANL-32`), root scripts/config 2.6k, 53 SQL migrations (users 38, genshin_impact 15, 6.3k lines) |
| Legacy | `old/`: 3,075 files, the pre-2026 Vue site (11k code lines + 423k data lines), deployed only via GitHub Pages and broken there |
| Content | Not in the repo. A fresh database has lookups and 485 translation keys (en, sk) but no characters/weapons/...; real content exists only in production and its backups |
| Media | `assets/` at repo root, gitignored; ~65-88k files and ~10 GB per code comments (mostly voice-over audio); served by the web server; catalogued in `files`/`file_categories` |
| Tests / CI | 0 tests. One workflow: GitHub Pages static deploy of the whole repo |
| Production | `https://anotoki.eu` SPA behind Cloudflare (DNS), `config.json` = `{"url":"","configuration":"prod"}`, API same-origin at `/api/*`; analytics `umami.anotoki.eu`; Apache + PHP `mail()` on Websupport (per code comments) |
| History | 260 commits on main (2025-02-22 to 2026-09-05) + 165 reachable only via tags 0.1-0.8; one author under three identities; Claude co-authored: Opus 5 x76, Fable 5 x17; 1 PR (#1, 2025-04-18), 0 issues; branch `dev` fully merged and stale since 2025-11-20 |
| Repo weight | `.git` 8.7 GB on disk for a 47 MB checkout; 9.27 GB packed blobs (see `ANL-10`) |
| Dev environment | The owner works on Windows (Windows-style absolute paths showed up in generated files); production is Linux, so case-sensitivity bugs are a recurring class (see `php/assets.php` header) |

## 3. Architecture

### 3.1 Repository map

| Path | Role | Status |
|---|---|---|
| `angular/` | The SPA. `src/app/sites/main` (public site), `src/app/sites/admin` (admin panel), `src/app/shared/local-lib` (in-house component library, merged from another project), `src/app/api` (API client: `models/`, `services/` and `index.ts` generated; `types/` and three helpers hand-written), `public/` (config.json, changelog.json, favicons) | active |
| `angular/generate-api.mjs`, `generate-openapi.mjs`, `api-config.mjs`, `api-spec.json` | Code generation (see 3.6) | active, generated artefacts committed |
| `php/api/` | Slim app: `index.php` (bootstrap + global middleware), `meddleware/` (sic), shared modules (`db_query.php`, `model.php`, `response.php`, `full_resource.php`, auth/session/TOTP/Google/mail helpers, asset pipeline), `routes/<database>/{models,responses,endpoints}` | active |
| `php/config/` | `db.php` (connections), `jwt.php`, `site.php`, `backup.php`, `mail.php`, `google.php`, `database.php` (template) and the tracked `database.local.php` (see `ANL-12`). Of the `*.local.php` overrides the code reads (database, jwt, site, backup, mail, google, cors), only `jwt.local.php` is gitignored, whatever the comments say | active |
| `php/migrations/<alias>/NNN_*.sql` | The schema, applied in natural order by `php/migration.php` | active |
| `php/generate-api-spec.php`, `assets.php`, `translations.php`, `seed_quiz_history.php`, `router.php` | CLI tools and the dev router for `php -S` | active |
| `php/public/uploads/` | Legacy upload target (see `ANL-27`) | legacy, still written |
| `php/storage/` (runtime, gitignored) | Backups, logs, cache, trash, dev mail | runtime |
| `assets/` (gitignored) | The media tree the site serves | runtime |
| `docs/` | Generated HTML reports: technical reference, API latency, security review (with `findings.json`) | active |
| `formats-converters/` | One-off Node/PHP media conversion scripts | tooling (destructive defaults, see `ANL-33`) |
| `old/` | Legacy Vue site | legacy (`D9`) |
| `.github/workflows/static.yml` | Pages deploy of the whole repo | to remove (`ANL-11`) |

### 3.2 Backend request pipeline

Global middleware runs outermost-first (Slim adds later middleware outside earlier ones):

```
request
 -> security headers        index.php:349-374   (fills nosniff, XFO DENY, Referrer-Policy, CSP default-src 'none', HSTS on https)
 -> CORS                    index.php:323-343   (echo Origin only if allowlisted; OPTIONS answered 204 here)
 -> failed-response logger  index.php:283-316   (4xx/5xx responses -> storage/logs/errors-YYYY-MM-DD.jsonl)
 -> Slim ErrorMiddleware    index.php:215-274   (JSON errors; PDO 22xxx->400, 23xxx->409 with driver text: ANL-13; /api/errors crash: ANL-14)
 -> maintenanceGate         meddleware/maintenance.php (503 unless admin or allowlisted path)
 -> routeGate               meddleware/route_gate.php  (423 for API prefixes claimed by a locked page: ANL-07)
 -> body parsing            index.php:34               (innermost app middleware: the gates run before the body is parsed)
 -> Slim routing (rawurldecode) -> per-route middleware -> handler
```

Per-route middleware is written `->add(responds(...))->add(validateRequest(...))->add(requireRole(...))->add(requireAuth())`, so it executes `requireAuth -> requireRole -> validateRequest -> responds -> handler`. `responds()` is a no-op at runtime; the spec generator reads it to learn the response shape.

Request-scoped state lives in function-level `static` caches (`gateCaller`, `siteSettingsAll`, `siteRoutesAll`, `getDb`, `auditScope`, `auditSession`, `errorLogHandled`). That is correct under mod_php, PHP-FPM or `php -S`, but would leak between requests under a persistent runner (RoadRunner, Swoole, FrankenPHP worker mode). Do not adopt one without refactoring these.

Data access follows three patterns:
- `DbQuery::from($pdo, 'table')->...->fetchAll()/find()` with `include()`/`includeExternal()` joins and automatic asset resolution (`resolveAssetRows`).
- Writes through `Model::fromBody($body)->toDbArray()` / `Model::partialToDbArray($body)`. Reflection over constructor parameters is the column allowlist; `DbQuery::insert/update` write audit rows when `created_by`/`updated_by` are present (not on deletes, `ANL-08`).
- Raw PDO with bound parameters for anything bespoke.

"Full resource" endpoints (`registerFullResource()` in `full_resource.php`; characters have their own in `characters_full.php`) read and write a parent with nested children in one request. Children are soft-deleted and re-inserted on each save (`ANL-26`).

### 3.3 Data model

- **`users` database (shared across sites).** `users` (roles ADMIN/EDITOR/USER; soft-delete flag doubles as "disabled"), `user_sessions`, `user_tokens` (hashed one-time tokens: email confirm, password reset, 6-digit login code), `user_identities` (Google), `user_recovery_codes`, `user_trusted_devices`, `user_login_attempts` (rate limiting), `languages`, `translation_keys` (with `site` scope and `is_html`), `translations`, `sites`, `site_settings` (switches), `site_routes` + `site_route_endpoints` (page governance), `themes`, `roles`, `migrations`.
- **`genshin_impact` database.** Content entities (`characters` and 17 `characters_*` child tables for talents, constellations, ascensions and costs, builds, teams, voice overs, relationships, roles; `weapons` (+refinements, ascensions, costs), `artifacts` (+pieces), `materials` (+groups), `foods` (+recipes), `enemies` (+phases, drops, damage types), `banners` (+characters, weapons), `backgrounds`), lookups (`elements`, `regions`, `rarities`, `weapon_types`, ...), quiz data (`quizzes`, `quizzes_states`, `quiz_stats_history`, `user_quiz_history`), `feedback`, `audit_logs` (with `entity_table`/`entity_id`/`session_id`), and the asset catalogue (`file_categories`, `files`; entity columns are `*_file_id` FKs since migration 010).
- **Cross-database references** (`created_by`, `updated_by`, `user_id` in genshin_impact) are plain integers without FKs, resolved in PHP with `includeExternal()`.
- **Conventions.** `deleted BOOLEAN` soft delete on content tables; `created_at/created_by/updated_at/updated_by` stamps with `set_updated_at()` triggers; CHECK constraints act as enums; JSON columns decoded by the client (`json-columns.ts`).
- The spec generator's migration replay matches the real database exactly (79/79 tables, verified in §4).

### 3.4 Authentication and authorization

- **Tokens.** HS256 JWT (`config/jwt.php`), 48 h, carrying `sid`. Every authenticated request looks up a live `user_sessions` row and re-reads the user, so roles and disabling take effect immediately and logout revokes. Tokens are auto-renewed in `X-Refresh-Token` when less than 24 h remain. The secret comes from `JWT_SECRET` or `config/jwt.local.php`. There is no fallback: without a secret the API still boots and serves anonymous reads, but anything that signs or verifies a token (every sign-in, every Bearer request, POST /api/feedback) answers 500. Each token names a server-side session with a random 128-bit id, so the signing key alone cannot forge a working token.
- **Ways in.** Password; emailed 6-digit code (`ANL-03`, `ANL-04`); Google Identity Services ID token (verified locally against Google JWKS, RS256 pinned, `aud`/`iss`/`exp` checked); email links (confirm, reset), which sign in directly and skip the second factor (`ANL-36`). Registration requires email confirmation, but Google sign-in links to an existing account by address, confirmed or not (`ANL-37`).
- **2FA.** RFC 6238 TOTP (±1 step, constant-time compare), 10 hashed single-use recovery codes, 30-day trusted-device tokens (hashed server-side, stored in localStorage client-side).
- **Rate limiting.** `user_login_attempts`: 10 failures per email+IP and 50 per IP per 15 min, applied to login, register, confirm-resend and forgot, keyed on `REMOTE_ADDR`, which in production may be a Cloudflare address (`ANL-38`). **Not** applied to the login-code endpoints.
- **Roles.** `ROLES_CONTENT` = ADMIN+EDITOR for content writes (uploaded files count as content); `ROLES_SYSTEM_READ` = ADMIN+EDITOR; `ROLES_SYSTEM_WRITE` = ADMIN (`meddleware/auth.php:128-154`). Per-user data uses `requireSelfOrAdmin()`/`refuseForeignUserId()` or derives the user from the token; two PUTs still write a `user_id` from the body (`ANL-39`).
- **Site switches** (`site_settings`): maintenance mode (503 for non-admins, `/staff` sign-in stays open), login on/off, Google on/off, announcement. **Page governance** (`site_routes`): visibility PUBLIC/USER/EDITOR/ADMIN, blocked flag, optional API prefixes enforced by the route gate (`ANL-07`). Both are enforced in the API and mirrored in the UI.

### 3.5 Asset pipeline

- The tree lives at `<repo>/assets` (`_assetsRoot()`, `catalogueRoot()`) and is served by the web server. The front end resolves many images by folder and name convention (`appMaterialIcon`, upper-snake names), and others through `*_file_id` resolved to `../assets/<category path>/<name>.<ext>` (audio: `assets/...`).
- New uploads go to `/api/uploads/{entity}/{field}` or `/api/uploads/{entity}/{id}/{field}` and `/api/files`, are re-encoded to AVIF (Imagick or GD) or Opus (ffmpeg via `proc_open` with an argument array), keep the original alongside, and are catalogued (`upsertCatalogueFile`).
- Admin Files page: browse, upload/replace, trash/restore, empty trash, rename, move between categories, reconcile (adopt strays; move unclaimed folders to `unfiled`), batch convert, batch cleanup of originals. There is a one-day stats cache and queues in `storage/cache`. Risks: `ANL-18`.
- Legacy: `php/public/uploads` via `_fullSaveUpload()` and `/api/upload` (`ANL-27`, `ANL-02`, `ANL-21`).

### 3.6 Code-generation pipeline

```
php/api (routes + closures' middleware text + DbModel ctors + ResponseShape classes) + php/migrations (replayed)
  --php php/generate-api-spec.php-->  angular/api-spec.json
  --node angular/generate-api.mjs-->  angular/src/app/api/** (25 services, 399 methods, 243 interfaces)
  --node angular/generate-openapi.mjs (needs `typescript`)-->  php/api/openapi.json  (+ php/api/docs.html Swagger UI)
  --node docs/reference/build-docs.mjs-->  docs/reference/reference-<date>.html
```

`npm start` runs the first three before `ng serve`, non-fatally (on Linux only with Node exactly 22.15.0, `ANL-15`). The committed spec and client match the code (verified by regeneration); the committed `php/api/openapi.json` does not (369 of 399 operations, last regenerated 2026-09-03: `ANL-32`). The output is platform-dependent (`ANL-16`). A route file that is not `require`d from `api/index.php` silently does not exist, which has happened before (`index.php:169-171`).

### 3.7 Frontend

- **Bootstrap** (`app.config.ts`): `ConfigService` loads `./config.json`, then `SiteSettingsService` (`/api/settings/public`: switches, announcement, route governance), then `SecurityService` (JWT from localStorage, then `/api/auth/me`), then `TranslationService` (`/api/translations/{code}`, ETag-cached).
- **HTTP**: one functional interceptor prefixes the backend URL, attaches `Authorization`, stores refreshed tokens, and signs out on 401 (`ANL-29`).
- **Main site**: route guard `routeAccessGuard` mirrors page governance. Daily quizzes pick 2 of 6 per UTC day deterministically (`daily.ts`); the question inside a quiz is random per browser. Progress syncs to the account when signed in (`quiz-progress.service.ts`), otherwise it stays in localStorage. The main site is one lazy chunk with every feature inside it (`ANL-31`).
- **Admin**: lazy chunk; forms per entity with image pickers that upload before saving; files manager, translations grid with an HTML editor (`ANL-06`), backups with restore confirmation, sessions, settings, route governance, audit logs, error log viewer, migrations viewer.
- **Rendering DB markup**: `app-rich-text` with `sanitizeRichHtml()` (an allowlist over a DOMParser document). This is the approved path; anything else that renders stored HTML is a bug.

### 3.8 Delivery and runtime topology

- **Production**: SPA at `https://anotoki.eu`, behind Cloudflare (DNS), with SPA fallback (deep links return the app shell), and the API under `/api/` on the same host. The files probed under `/vendor/` and `/storage/` answer 403 while unknown paths get the app shell, so a deny rule exists somewhere (at Cloudflare or the origin) and is not in the repo (`ANL-22`). `/api/openapi.json` is not deployed.
- **Deploy**: manual. `ng build --configuration production` plus SFTP (php/README.md). The production `config.json` is maintained on the server (`ANL-20`). There is no deploy script. The only web-server config in the repo is `php/api/.htaccess` (rewrite to index.php), `php/public/uploads/.htaccess` (`ANL-21`) and a Windows dev vhost (`php/api/httpd-vhosts.conf`).
- **Dev**: `php -S localhost:8000 router.php` from `php/` (the router is required so dotted paths reach the API and `/uploads` is served), plus `npm start` in `angular/` (`ANL-15`).

## 4. How this analysis was done

| Step | Result |
|---|---|
| Full clone with all refs (~3 min, 8.7 GB) | Inventory, history, blob accounting per path and per ref (`ANL-10`) |
| `php migration.php` on a fresh PostgreSQL 16.13 | All 53 migrations applied cleanly; the default admin cannot log in (`ANL-05`) |
| API run with `php -S ... router.php` (PHP 8.4.21), ~60 scripted requests | Reproduced `ANL-01`, `-02`, `-03`, `-04`, `-05`, `-07`, `-08`, `-09`, `-13`, `-14`, `-24`, `-36`, `-37` (Google's signature check stubbed), `-39`; confirmed the protections in §6 |
| Spec and client regeneration on Linux + diff against committed | In sync except platform noise (`ANL-16`) |
| Spec schema replay vs live database | 79/79 tables identical (the generator keys tables by name across both databases, so `users.migrations` and `users.roles` are shadowed by their identical genshin_impact namesakes) |
| `php -l` on every PHP file | Clean |
| PHPStan 2.2.14, levels 2 and 5 | 382 `$app might not be defined` (architecture noise); real: `index.php:250` (`ANL-14`); rest cosmetic |
| Psalm 6.18 `--taint-analysis` with the project's psalm.xml | No findings (71.5% type inference, same as the project's own run) |
| gitleaks 8.24.2 over full history and tree (redacted) | No findings with default rules; manual redacted checks of config history (`ANL-12`) |
| Manual review | All core PHP modules and middleware, auth/users/backups/files/categories/uploads/quiz/feedback/errors/translations endpoints, the migration runner and key migrations; Angular bootstrap, security service, interceptor, sanitizer, HTML editor, character form, route guard, daily logic; tooling, CI, docs |
| Production (read-only, public URLs only) | `config.json`, `/api/settings/public`, SPA deep link, canaries `/php/...` (SPA shell), `/vendor/...` and `/storage/...` (403), `/api/openapi.json` (404); DNS (Cloudflare in front) |
| Independent review of this report | Two separate passes re-checked every finding, line reference and section against the code. Their corrections are applied, and the defects they found that the first pass missed are `ANL-36` to `ANL-40`, each confirmed before inclusion (four at runtime). |
| Advisory databases | Angular/Vite/Slim versions checked against GitHub Advisory Database (`ANL-17`) |

Not possible in the sandbox: installing Angular dependencies, and therefore `ng build`, lint, bundle size and browser tests (the npm registry was blocked); Semgrep and `composer audit` (registries blocked); Apache `.htaccess` behaviour; reading production response headers.

## 5. Findings

Priorities: **P0** do now, **P1** next, **P2** planned, **P3** backlog. Confidence: **verified-runtime** (reproduced on a running instance), **verified-static** (read end to end, not executed), **needs-host-check** (depends on the production server). Effort: S < half a day, M 1-3 days, L more.

### 5.1 Index (priority order)

| ID | P | Severity | Confidence | Area | Title | Decision |
|---|---|---|---|---|---|---|
| [ANL-01](#anl-01) | P0 | high | verified-runtime | correctness | Soft-deleted content is still served by the content read endpoints (public site and admin) | D2 |
| [ANL-02](#anl-02) | P0 | high | verified-runtime | correctness | Voice-over audio uploaded through the character form is silently discarded | - |
| [ANL-03](#anl-03) | P0 | high | verified-runtime | security | POST /api/auth/login/code/verify acts as an unthrottled 2FA oracle | - |
| [ANL-05](#anl-05) | P0 | high | verified-runtime | ops | Fresh installs: the seeded admin cannot sign in, and 'forced password change' is only a UI rule | D4 |
| [ANL-36](#anl-36) | P0 | high | verified-runtime | security | Password-reset and confirmation links sign in without the second factor | - |
| [ANL-37](#anl-37) | P0 | high | verified-runtime | security | Google sign-in adopts an account someone else pre-registered with the same address, and keeps their password | - |
| [ANL-04](#anl-04) | P0 | medium | verified-runtime | security | Sign-in-code endpoints are unthrottled (unbounded mail to confirmed accounts, code guessing) | - |
| [ANL-06](#anl-06) | P1 | medium | verified-static | security | Admin HTML editor renders stored markup unsanitized (an editor can steal an admin session) | D3 |
| [ANL-07](#anl-07) | P1 | medium | verified-runtime | security | Route gate (page locks on API paths) is bypassed by percent-encoding | - |
| [ANL-08](#anl-08) | P1 | medium | verified-runtime | correctness | Soft deletes never reach the audit log | - |
| [ANL-09](#anl-09) | P1 | medium | verified-runtime | correctness | Email addresses are case-sensitive (duplicate accounts, failed logins, missed Google linking) | - |
| [ANL-10](#anl-10) | P1 | medium | verified-static | repo-health | Repository weighs 9.3 GB: 7.5 GB is reachable only through orphaned tags 0.1-0.8 | D1 |
| [ANL-11](#anl-11) | P1 | medium | verified-runtime | ops | GitHub Pages workflow publishes the whole repository; its site is broken | D5 |
| [ANL-12](#anl-12) | P1 | medium | verified-static | security | Credential config files are tracked or unprotected in git, and the old JWT fallback secret is public | D6 |
| [ANL-15](#anl-15) | P1 | medium | verified-static | dx | Frontend toolchain is fragile: `npm start` needs nvm and an exact Node, lint cannot run, no tests | D7, D8 |
| [ANL-16](#anl-16) | P1 | medium | verified-runtime | dx | Generated API spec and client are not reproducible across machines | - |
| [ANL-38](#anl-38) | P1 | medium | needs-host-check | security | Production sits behind Cloudflare, but every rate limit and stored IP uses REMOTE_ADDR | - |
| [ANL-18](#anl-18) | P2 | medium | verified-static | ops | Asset-library operations can silently break the live site, and editors are allowed to run them | D3 |
| [ANL-19](#anl-19) | P2 | medium | verified-static | performance | Large unauthenticated payloads, expensive endpoints, and no general rate limiting | - |
| [ANL-20](#anl-20) | P2 | medium | needs-host-check | ops | `ng build` bundles the whole asset tree, and production config.json is hand-managed | - |
| [ANL-22](#anl-22) | P2 | medium | needs-host-check | security | Production storage/ and vendor/ appear to sit under the web root, protected only by rules outside the repo | - |
| [ANL-35](#anl-35) | P2 | medium | verified-static | security | SPA hardening: no Content-Security-Policy, bearer secrets in localStorage | - |
| [ANL-13](#anl-13) | P2 | low | verified-runtime | security | Raw PostgreSQL error text reaches anonymous callers; missing length validation | - |
| [ANL-14](#anl-14) | P2 | low | verified-runtime | correctness | Error handler crashes on any exception under /api/errors | - |
| [ANL-17](#anl-17) | P2 | low | verified-static | security | Angular 21.2.0 and Vite 7.3.1 (lockfile) are behind 2026 security releases | D8 |
| [ANL-21](#anl-21) | P2 | low | needs-host-check | security | Uploads .htaccess does not do what its comments (and SEC-02) say | - |
| [ANL-23](#anl-23) | P2 | low | verified-static | security | An admin setting a user's password leaves that user's sessions and trusted devices alive | - |
| [ANL-27](#anl-27) | P2 | low | verified-static | maintainability | Two parallel upload systems; the legacy one writes files nothing catalogues | - |
| [ANL-28](#anl-28) | P2 | low | verified-static | privacy | Personal data (IP addresses) kept without retention; a comment claims the opposite | - |
| [ANL-39](#anl-39) | P2 | low | verified-runtime | security | A signed-in user can move their own quiz rows into another account | - |
| [ANL-32](#anl-32) | P2 | info | verified-static | docs | Stale or misleading documentation and comments (agents read these) | - |
| [ANL-24](#anl-24) | P3 | low | verified-runtime | security | optionalAuthUser() accepts revoked (signed-out) tokens | - |
| [ANL-25](#anl-25) | P3 | low | verified-static | product | Quiz results are client-asserted and unthrottled; the voice quiz ships the answer with the question | D10 |
| [ANL-26](#anl-26) | P3 | low | verified-static | maintainability | Child rows are soft-deleted and re-inserted on every save (unstable ids, growth, asymmetric shapes) | - |
| [ANL-29](#anl-29) | P3 | low | verified-static | security | HTTP interceptor sends the JWT to any destination; dead cache code from another project | - |
| [ANL-30](#anl-30) | P3 | low | verified-static | security | `sanitize` input on AbstractInputComponent actually disables sanitization | - |
| [ANL-31](#anl-31) | P3 | low | verified-static | performance | Main-site features are not split per route | - |
| [ANL-34](#anl-34) | P3 | low | verified-static | correctness | Audit writes swallow PDO errors inside transactions (PostgreSQL then aborts the transaction) | - |
| [ANL-40](#anl-40) | P3 | low | needs-host-check | security | Asset file names keep inner dots, so double extensions such as `x.php.png` can land in the served tree | - |
| [ANL-33](#anl-33) | P3 | info | verified-static | repo-health | Repository leftovers and hygiene | D9 |

### 5.2 Details

### ANL-01

**Soft-deleted content is still served by the content read endpoints (public site and admin)**

`priority: P0` · `severity: high` · `confidence: verified-runtime` · `category: correctness` · `effort: M` · `decision: D2`

- **Where**
  - `php/api/routes/genshin_impact/endpoints/characters.php:9-52` (list, minimal, single, random: no deleted filter)
  - `php/api/routes/genshin_impact/endpoints/weapons.php:7-25` (same pattern in materials.php, foods.php, banners.php, artifacts.php, enemies.php and the child-table endpoints)
  - `php/api/full_resource.php:277-303` (GET /api/{path}/full lists every parent, deleted or not)
  - `php/api/routes/genshin_impact/endpoints/characters_full.php:355-404` (GET /api/characters/{id}/full returns a deleted character)
  - `php/api/routes/genshin_impact/endpoints/characters_voice_overs.php:7-45`
  - `php/api/full_resource.php:341, php/api/routes/genshin_impact/endpoints/characters_full.php:229` (the /full PUT the admin forms use finds the row without checking `deleted`)
  - `angular/src/app` (no code under sites/main or shared filters on `deleted`)
- **What**: Deleting is a soft delete (`deleted = TRUE`). The list, single, /minimal, /random and /full parent reads of characters, weapons, materials, foods, banners, artifacts and enemies, and every child-table endpoint, never add `deleted = false`. A few reads do filter (the /api/quizzes and /api/backgrounds lists, /api/quiz/voice-over/random, /api/materials/{id}/usage, /api/dashboard/stats, and the child collections inside /full), so the rule is applied piecemeal. The Angular main site never filters on `deleted` either.
- **Evidence**: Local run: `DELETE /api/characters/1` answered 200 'Deleted successfully', after which `GET /api/characters`, `/api/characters/minimal`, `/api/characters/1` and `/api/character/random` all still returned the row with `deleted: true`. Rows stored with `deleted = true` were returned by `/api/weapons`, `/api/weapons/full`, `/api/enemies` and `/api/enemies/full`.
- **Impact**: Anything an editor deletes stays on the public site: database pages, quizzes (the public site calls getCharactersMinimal/getCharacters/getWeapons/getMaterials/getFoods/getBannersFull), and random picks. In the admin, deleted rows stay in the lists and still open and save: the forms use PUT /api/<entity>/{id}/full, which does not check `deleted`, so the save succeeds and the row stays deleted (only some per-table PUTs, such as weapons.php:47, answer 404). Children re-inserted on every save (ANL-26) pile up as deleted duplicates in the child-table endpoints.
- **Fix**: Settle D2 first. Recommended: public reads return live rows only; admin lists default to live rows, with `?includeDeleted=1` for ADMIN if a restore feature is wanted. Implement it in one place, for example a `DbQuery::live()` helper that adds `_t.deleted = false` when the table has the column, and use it in every GET, in `registerFullResource()` parent queries, and in the characters /full GET (404 for deleted). `DbQuery::count()` (db_query.php:144-151) builds its own SQL without the `_t` alias, so it needs the same filter or paged totals keep counting deleted rows. Add regression tests.
- **Fix risk**: Low to medium. An admin screen may currently rely on seeing deleted rows; there is no restore feature today.
- **Verify**: Create, delete, then assert the row is absent from public GET list/detail/full/random, and present only with the ADMIN opt-in.
- **Related**: [ANL-26](#anl-26), [ANL-08](#anl-08)

### ANL-02

**Voice-over audio uploaded through the character form is silently discarded**

`priority: P0` · `severity: high` · `confidence: verified-runtime` · `category: correctness` · `effort: M`

- **Where**
  - `angular/src/app/sites/admin/characters/character-form/character-form.component.ts:331-347` (appends `vo_audio_{i}_{lang}` file parts)
  - `php/api/routes/genshin_impact/endpoints/characters_full.php:62-73` (`_saveAudioFile` -> `_fullSaveUpload` writes php/public/uploads/voice-overs/<name> and sets `audio_<lang>` = '/uploads/voice-overs/...')
  - `php/api/asset_columns.php:364-409` (`resolveAssetBody`: an `audio_<lang>_file_id` already in the payload wins and the new path is dropped; a '/uploads/...' path is not an asset path and is left as is)
  - `php/api/routes/genshin_impact/models/character_voice_over.php:28-31` (model only has `audio_*_file_id`, so `audio_<lang>` is dropped by `fromBody`)
- **What**: Images in the character form go through the new catalogued upload flow, but voice-over audio still rides along as multipart parts handled by the legacy `/uploads` saver. The path it produces is never turned into a `files` row, and the model has nowhere to put a path.
- **Evidence**: Local run: POST /api/characters/full with `vo_audio_0_english=About Jean.ogg` answered 201; the file was written to php/public/uploads/voice-overs/About_Jean.ogg; the voice-over row kept `audio_english_file_id = NULL`, and GET /full showed `audio_english: null`.
- **Impact**: Editors believe audio was attached and it never is. Orphan files pile up in php/public/uploads, outside the catalogue and the Files page.
- **Fix**: In `_applyUploads()`, save voice-over audio with `_saveAssetUpload($file, 'character/voice_overs/<Character>/<type>/<lang>', <free name>, true)`, reusing the naming in `_resolveVoiceOverTarget()`/`_freeVoiceOverName()` and taking the row data from the payload. Set `$vo['audio_<lang>']` to the returned `assets/...` path and `unset($vo['audio_<lang>_file_id'])` so `resolveAssetBody()` catalogues it. Drop the legacy `/uploads` path for audio.
- **Fix risk**: Low.
- **Verify**: Upload through the form, then check that GET /api/characters/{id}/full shows `audio_english` under assets/character/voice_overs/... and that a `files` row exists.
- **Related**: [ANL-27](#anl-27), [ANL-26](#anl-26)

### ANL-03

**POST /api/auth/login/code/verify acts as an unthrottled 2FA oracle**

`priority: P0` · `severity: high` · `confidence: verified-runtime` · `category: security` · `effort: S`

- **Where**
  - `php/api/routes/users/endpoints/auth.php:923-949` (TOTP checked at :934, before the emailed code at :938; no loginAttemptsExceeded/recordLoginAttempt)
  - `php/api/totp.php:132-148` (±1 step window, no replay tracking)
  - `php/api/routes/users/endpoints/auth.php:703-781` (Google path: TOTP failures are not recorded as attempts either)
- **What**: Without the emailed code, a caller can send any code plus a TOTP guess for a 2FA account. A wrong TOTP answers 403 `totp_invalid`; a correct one answers 400 `invalid_code`. Nothing throttles the endpoint.
- **Evidence**: Local run: wrong TOTP -> 403 totp_invalid; current TOTP -> 400 invalid_code; 60 rapid guesses -> all 403, never 429 (POST /api/auth/login returned 429 after 10 failures).
- **Impact**: Preconditions: the attacker already has the password, which is exactly the case 2FA exists for, and can send a large number of requests. The oracle finds a currently valid TOTP within roughly 10^5 to 10^6 requests, and that code is then usable on /api/auth/login inside its window. 2FA is reduced to a rate-limit problem.
- **Fix**: (1) Check the emailed code first and the TOTP only after it passes, or evaluate both and return one uniform error. (2) Apply `loginAttemptsExceeded()` and `recordLoginAttempt(..., 'bad_totp'|'bad_code')` on this endpoint and on the Google TOTP branch. (3) Keep a per-account TOTP failure window. (4) Store the last accepted TOTP step per user to block replay.
- **Fix risk**: Low.
- **Verify**: Regression test: responses for a wrong TOTP and a wrong code are indistinguishable, and a 429 follows after N failures.
- **Related**: [ANL-04](#anl-04), [ANL-36](#anl-36), [ANL-38](#anl-38)

### ANL-05

**Fresh installs: the seeded admin cannot sign in, and 'forced password change' is only a UI rule**

`priority: P0` · `severity: high` · `confidence: verified-runtime` · `category: ops` · `effort: S` · `decision: D4`

- **Where**
  - `php/migration.php:57-60, 299-320` (seed inserts admin@localhost / Admin1234! without email_confirmed)
  - `php/migrations/users/001_initial_schema.sql:63` (email_confirmed DEFAULT FALSE)
  - `php/migrations/users/017_account_auth.sql:39` (one-off UPDATE that runs before the seed on a fresh database)
  - `php/api/routes/users/endpoints/auth.php:373-379` (login refuses unconfirmed accounts)
  - `php/api/meddleware/auth.php:23-78` (requireAuth never looks at force_password_change)
  - `php/README.md` (publishes the default credentials)
- **What**: On an empty database every migration runs first, so 017's 'confirm everyone' UPDATE finds nobody; the admin is then inserted unconfirmed and login refuses it. Separately, `force_password_change` is enforced only by the Angular UI: the API serves everything to such a session.
- **Evidence**: Fresh PostgreSQL 16 + `php migration.php`, then login as admin@localhost / Admin1234! -> 403 email_not_confirmed. After confirming by SQL, a session for an account with force_password_change = TRUE got 200 from GET /api/users and GET /api/backups.
- **Impact**: A fresh `users` database cannot be signed into with the documented credentials. With the default `file` mail driver the owner can get in through 'forgot password' (a reset also confirms the address) or 'resend confirmation' and the .eml in php/storage/mail/, but nothing documents this; where the `mail` driver is configured, SQL is the only way in. The obvious 'quick fix' of confirming the seed would ship a publicly documented admin password that the API honours until somebody changes it through the UI.
- **Fix**: Seed with `email_confirmed = TRUE` and a random one-time password printed once, or one taken from env/CLI flags. Enforce `force_password_change` in `requireAuth()` by allowing only /api/auth/me, /api/auth/password, /api/auth/password/set and /api/auth/logout. Update php/README.md.
- **Fix risk**: Low.
- **Verify**: Build a fresh database, sign in with the printed password, and check that everything except the password change answers 403 until it is changed.

### ANL-36

**Password-reset and confirmation links sign in without the second factor**

`priority: P0` · `severity: high` · `confidence: verified-runtime` · `category: security` · `effort: S`

- **Where**
  - `php/api/routes/users/endpoints/auth.php:424-465` (POST /api/auth/password/reset: consumes the token, sets the password, then issues a session at :464 without `authTotpRefusal()`)
  - `php/api/routes/users/endpoints/auth.php:255-279` (POST /api/auth/confirm: the same, session at :278)
  - `php/api/routes/users/endpoints/auth.php:364, 724, 738, 934` (password login, Google and the emailed code all check the second factor first)
- **What**: Every other way in calls `authTotpRefusal()` before `authSession()`. The two email-link endpoints go straight to `authSession()`, so for an account with 2FA the link alone is a full sign-in. The reset path works for every 2FA account that has a password. The confirmation path is reachable only in edge cases (an admin clears `email_confirmed`, or a 48-hour confirmation link is still unused after the address was confirmed another way).
- **Evidence**: Local run: an account with TOTP enabled; POST /api/auth/login with the right password and no TOTP -> 403 totp_required. POST /api/auth/password/forgot, then POST /api/auth/password/reset with the token from the mail -> 200 with a session token; GET /api/auth/me with it -> 200 (totp_enabled: true).
- **Impact**: Whoever can read the mailbox, or gets hold of a reset link (valid 60 minutes), takes over a 2FA account without the second factor, and the reset also signs the owner out and removes their trusted devices. For an ADMIN with 2FA, a mailbox compromise alone gives full admin (backups, restore, accounts). The code states the intended rule itself on the Google path: 'an account with 2FA on must not gain a new way in on the strength of a Google token alone'.
- **Fix**: In both handlers call `authTotpRefusal($response, $pdo, $user, $body['totp'] ?? null, $body['device_token'] ?? null)` before `authSession()`. On refusal keep the new password (or the confirmation) but return no session, so the user signs in normally with the second factor. The SPA's reset and confirm pages need the same 2FA prompt the login page has. Accounts without 2FA keep today's behaviour.
- **Fix risk**: Low. The reset and confirm pages must handle `totp_required`.
- **Verify**: Replay the local run: for a 2FA account /password/reset answers 403 totp_required with no session, the new password then works together with a TOTP, and a valid TOTP in the reset body gives 200.
- **Related**: [ANL-03](#anl-03), [ANL-37](#anl-37)

### ANL-37

**Google sign-in adopts an account someone else pre-registered with the same address, and keeps their password**

`priority: P0` · `severity: high` · `confidence: verified-runtime` · `category: security` · `effort: S`

- **Where**
  - `php/api/routes/users/endpoints/auth.php:181-249` (anyone can register any address; the account stays unconfirmed with the registrant's password, and nothing prunes it)
  - `php/api/routes/users/endpoints/auth.php:171-176` (`authFindByEmail()` ignores `email_confirmed`)
  - `php/api/routes/users/endpoints/auth.php:735-754` (Google branch: attaches the identity, sets `email_confirmed = TRUE`, signs in)
  - `php/api/routes/users/endpoints/auth.php:107-110, 373-379` (the registrant's password stays valid; the unconfirmed address was the only thing stopping it)
- **What**: Registration creates an unconfirmed account for any address, with a password the registrant chooses. When the real owner of that address later signs in with Google for the first time, the Google branch finds the unconfirmed account by address, attaches the Google identity, marks the address confirmed and signs the owner in. The registrant's password is kept and now works.
- **Evidence**: Local run with only Google's signature check stubbed: registered victim@gmail.com with an attacker's password -> password login 403 email_not_confirmed; Google sign-in with a verified claim for that address -> 200; the attacker's password login -> 200, and /api/auth/me shows the same account for both sessions. Production has `google_login_enabled: true` and `login_enabled: true` (https://anotoki.eu/api/settings/public).
- **Impact**: Anyone can pre-register the addresses of people likely to join (Gmail addresses, for example) and wait. Once the owner arrives through Google and uses the account, the registrant signs in with the password and can read and change everything in it; the owner sees nothing unusual. A lesser variant needs the owner's click: they open the unsolicited confirmation mail and end up in an account whose password someone else knows.
- **Fix**: When the Google branch matches an account that is not `email_confirmed`, clear its password (`password = NULL`) and revoke its sessions and one-time tokens before attaching, or refuse to link and ask the user to confirm the address first. Delete unconfirmed accounts once the 48-hour confirmation window has passed. Normalise the address (ANL-09) before matching.
- **Fix risk**: Low.
- **Verify**: Pre-register an address, then sign in with Google for it: the registrant's password no longer works (or linking is refused).
- **Related**: [ANL-09](#anl-09), [ANL-36](#anl-36)

### ANL-04

**Sign-in-code endpoints are unthrottled (unbounded mail to confirmed accounts, code guessing)**

`priority: P0` · `severity: medium` · `confidence: verified-runtime` · `category: security` · `effort: S`

- **Where**
  - `php/api/routes/users/endpoints/auth.php:896-913` (POST /api/auth/login/code: no limiter)
  - `php/api/routes/users/endpoints/auth.php:923-949` (verify: no limiter)
  - `php/api/one_time_token.php:143-206` (cap of 5 live codes; 5 wrong guesses burn them, which frees the cap)
- **What**: Requesting a code is capped only by 5 outstanding codes per account (10-minute lifetime). For accounts without 2FA, failed verifies burn the codes, so the cap resets on demand. For 2FA accounts a verify without a valid TOTP stops at the TOTP check (auth.php:934) before any code is looked at, so they stay capped at 5 codes per 10 minutes. Neither endpoint uses the login limiter that register, resend, forgot and login use.
- **Evidence**: Local run: 30 requests -> 30x 200 and 5 mails; 4 cycles of (5 requests + 5 wrong verifies) -> 20 mails, no 429.
- **Impact**: Anyone can make the server send unlimited sign-in-code mails to any confirmed account without 2FA, and about 720 a day to one with 2FA. That means harassment, an exhausted hosting mail quota, and damage to domain reputation that blocks real confirmation and reset mail. For accounts without 2FA, guessing a code costs about 25-in-a-million per 10 requests, with no per-IP cost.
- **Fix**: Use the same limiter as /login on both endpoints (per email+IP and per IP), add a per-account issuance ceiling per hour and per day, and record failed verifies as failed login attempts.
- **Fix risk**: Low.
- **Verify**: Tests: the 11th request in 15 minutes gets 429, and the mail count stays bounded.
- **Related**: [ANL-03](#anl-03), [ANL-38](#anl-38)

### ANL-06

**Admin HTML editor renders stored markup unsanitized (an editor can steal an admin session)**

`priority: P1` · `severity: medium` · `confidence: verified-static` · `category: security` · `effort: S` · `decision: D3`

- **Where**
  - `angular/src/app/shared/local-lib/components/html-editor/html-editor.component.ts:400-405` (`el.innerHTML = value`)
  - `angular/src/app/shared/local-lib/helper.class.ts:311-320` (`normalizeHtml` parses with a live-document element)
  - `angular/src/app/sites/admin/localization/translations/html-translation-modal/html-translation-modal.component.html:25-32` (raw translation value into the editor)
  - `php/api/routes/users/endpoints/translations.php:165-237` (EDITOR may write any translation)
  - `angular/src/app/shared/local-lib/services/security.service.ts:336, 343` (JWT and trusted-device token in localStorage)
- **What**: The public renderer (`app-rich-text`) sanitizes with a good allowlist, but the admin editor assigns the raw stored value to a contenteditable element in the live document. `normalizeHtml()` does the same on every keystroke through a `document.createElement('div')`, and images with event handlers run even on detached elements.
- **Evidence**: Code path read end to end: html-translation-modal -> app-html-editor [(value)] -> afterValueChange -> el.innerHTML. Not executed in a browser here, because the frontend could not be built in the sandbox.
- **Impact**: Anyone who can write translations (EDITOR, an import file, a restored backup, SQL) can run script in an ADMIN's browser when the admin opens that key. The script can read the admin JWT and trusted-device token from localStorage, which gives full admin: backups, accounts, sessions.
- **Fix**: Pass the value through `sanitizeRichHtml()` before assigning innerHTML in `afterValueChange()` and when leaving source mode. Make `normalizeHtml()` parse with `DOMParser` or `document.implementation.createHTMLDocument()`. Add a CSP for the SPA (ANL-35).
- **Fix risk**: Low. The editor already shows sanitized output in its preview.
- **Verify**: Component test: a value containing an image with an event-handler attribute leaves no handler attribute in the editor DOM.
- **Related**: [ANL-35](#anl-35)

### ANL-07

**Route gate (page locks on API paths) is bypassed by percent-encoding**

`priority: P1` · `severity: medium` · `confidence: verified-runtime` · `category: security` · `effort: S`

- **Where**
  - `php/api/meddleware/route_gate.php:41` (compares the raw, still-encoded path)
  - `php/api/site_routes.php:184-210` (prefix match)
  - `php/vendor/slim/slim/Slim/Routing/RouteResolver.php:42` (Slim routes on rawurldecode()d path)
- **What**: The gate matches claimed prefixes against `getUri()->getPath()`, which is still percent-encoded, while Slim decodes the path before routing.
- **Evidence**: With /quizzes blocked and /api/quizzes claimed: GET /api/quizzes -> 423, while GET /api/%71uizzes and /api/quizze%73 -> 200 with the data. Maintenance mode is not affected: it is an allowlist, and encoded paths stayed at 503.
- **Impact**: 'Naming a path is what turns the sign into a lock' (php/README.md:157) does not hold. Any locked endpoint can be read by encoding one character.
- **Fix**: Normalise once, `rawurldecode($request->getUri()->getPath())`, and reject paths that decode to '/..' or contain NUL, in routeGate() (and in maintenanceGate() for consistency). The alternative is to run the gate as route middleware and match on the route pattern.
- **Fix risk**: Low.
- **Verify**: Test that the encoded variants also get 423.

### ANL-08

**Soft deletes never reach the audit log**

`priority: P1` · `severity: medium` · `confidence: verified-runtime` · `category: correctness` · `effort: S`

- **Where**
  - `php/api/routes/genshin_impact/endpoints/characters.php:98-107, weapons.php:64-70` (two of the 37 DELETE handlers that call `DbQuery::update($pdo, $table, ['deleted' => true], $id)`)
  - `php/api/db_query.php:260-279` (audit row written only when `updated_by` is present; its DELETE detection is therefore dead code)
- **What**: No delete handler passes `updated_by`, so `DbQuery::update()` skips the audit write. Three tables with a `deleted` column have no `updated_by` column at all (users, quizzes, file_categories).
- **Evidence**: Local run: after DELETE /api/characters/1, audit_logs still held only the two INSERT rows.
- **Impact**: The audit screen cannot say who deleted what, which is the question an audit log most often has to answer.
- **Fix**: Add a `DbQuery::softDelete($pdo, $table, $id, $userId)` helper that writes the DELETE audit row itself and sets `updated_by` only where the column exists. Passing `updated_by` to `DbQuery::update()` on users, quizzes or file_categories would fail with SQLSTATE 42703 after the audit row is already written (db_query.php:262-278). Use the helper in every delete handler and add a CI grep for `'deleted' => true` outside it.
- **Fix risk**: Low.
- **Verify**: Delete a row and assert an audit row with action DELETE and changed_by set.
- **Related**: [ANL-01](#anl-01)

### ANL-09

**Email addresses are case-sensitive (duplicate accounts, failed logins, missed Google linking)**

`priority: P1` · `severity: medium` · `confidence: verified-runtime` · `category: correctness` · `effort: M`

- **Where**
  - `php/api/routes/users/endpoints/auth.php:181-250` (register trims, never lowercases)
  - `php/api/routes/users/endpoints/auth.php:171-176` (authFindByEmail: exact match)
  - `php/api/routes/users/endpoints/auth.php:720, 735` (Google path lowercases before matching)
  - `php/api/routes/users/endpoints/users.php:303-358` (admin create: same)
  - `php/migrations/users/001_initial_schema.sql:62` (UNIQUE on the raw string)
- **What**: Addresses are stored, compared and limited exactly as typed.
- **Evidence**: Local run: registered 'Probe.User@Example.com'; login with the lowercase form -> 401; registering the lowercase form -> 201, a second account.
- **Impact**: Users locked out by capitalisation; duplicate accounts; Google sign-in fails to attach to a mixed-case registration and creates a second account; the per email+IP limiter can be sidestepped by varying case (the per-IP limit still applies).
- **Fix**: Normalise with `strtolower(trim())` on every write and lookup. Add a migration with a unique index on lower(email), after checking production for existing case-duplicates (`SELECT lower(email), count(*) FROM users GROUP BY 1 HAVING count(*) > 1`).
- **Fix risk**: Medium: needs a production data check before the index.
- **Verify**: Login and register tests with case variants.
- **Related**: [ANL-37](#anl-37)

### ANL-10

**Repository weighs 9.3 GB: 7.5 GB is reachable only through orphaned tags 0.1-0.8**

`priority: P1` · `severity: medium` · `confidence: verified-static` · `category: repo-health` · `effort: S (a) / M (b)` · `decision: D1`

- **Where**
  - `refs/tags/0.1 ... 0.8` (point at a pre-rewrite lineage that is not on main; 165 commits reachable only through them)
  - main history: 1.78 GB of deleted `assets/` blobs (untracked 2026-09-04, commit 29e7f4aba)
- **What**: A full clone downloads 9.27 GB of packed blobs (8.7 GB .git on disk) for a 47 MB checkout. Tags 0.1-0.8 keep an old, rewritten history alive, and each has a same-message, same-date twin on main: 0.1->52ae7f8c1, 0.2->086edd140, 0.3->0eda76724, 0.4->8dddeafab, 0.5->c28fcf0cb, 0.6->8d816bda3, 0.7->0991c5a80, 0.8->768e81010.
- **Evidence**: `git rev-list --objects` accounting: all blobs 9.27 GB; reachable from main 1.79 GB (1.78 GB of it assets/); only via tags or other refs 7.48 GB. None of the tag commits 0.1-0.8 is an ancestor of main.
- **Impact**: Every full clone (agents, new machines) pulls about 9 GB (about 3 minutes here; the default shallow CI checkout is unaffected), which risks GitHub size limits. Tags that are not on main mislead `git describe`, changelog tooling and 'diff since release'.
- **Fix**: Settle D1. Step (a), cheap and non-rewriting: re-point the eight tags to their main twins and force-push the tags; fresh clones drop to about 1.8 GB. Step (b), optional and destructive: purge `assets/` from main history with git-filter-repo, then re-tag and force-push, which gives clones of tens of MB. Until then, agents should clone with `--filter=blob:none` or `--depth 1`.
- **Fix risk**: (a) low, but changes tag hashes seen by anyone who fetched them. (b) high coordination: every hash changes.
- **Verify**: A fresh `git clone` measures the size; `git tag --no-merged main` prints nothing (today it prints 0.1-0.8).
- **Related**: [ANL-11](#anl-11)

### ANL-11

**GitHub Pages workflow publishes the whole repository; its site is broken**

`priority: P1` · `severity: medium` · `confidence: verified-runtime` · `category: ops` · `effort: S` · `decision: D5`

- **Where**
  - `.github/workflows/static.yml:36-40` (`path: '.'`, runs on every push to main; 43 runs so far)
- **What**: Every push to main uploads the entire repository as a static site, including php/, docs/ and the tracked dev database config. The root has no index.html since the legacy app moved to old/. docs/security/findings.json on that site carries the old JWT fallback verbatim (ANL-12).
- **Evidence**: https://irelevant25.github.io/anotoki-genshin-impact/ -> 404; /README.md and /docs/security/findings.json are served; /old/ serves the legacy shell, whose assets are no longer in git.
- **Impact**: A confusing second, broken 'site'; source and config republished outside GitHub's UI; wasted CI minutes.
- **Fix**: Delete the workflow and unpublish Pages in the repo settings, or publish only a built docs/ folder.
- **Fix risk**: Low.
- **Verify**: The Pages URL answers 404 or disabled; the Actions tab shows no Pages runs.
- **Related**: [ANL-10](#anl-10), [ANL-12](#anl-12)

### ANL-12

**Credential config files are tracked or unprotected in git, and the old JWT fallback secret is public**

`priority: P1` · `severity: medium` · `confidence: verified-static` · `category: security` · `effort: S` · `decision: D6`

- **Where**
  - `.gitignore:23-33` (ignores only google.php, database.local.php and jwt.local.php; the first two are tracked anyway, database.local.php deliberately, per the comment)
  - `php/config/google.php` (comment says 'committed rather than local', contradicting .gitignore:27)
  - `php/config/site.local.php, mail.local.php, backup.local.php, google.local.php, cors.local.php` (read by config/site.php:24, api/mail.php:49, config/backup.php:29, api/google_identity.php:45 and api/helpers.php:20, and not ignored by git; config/site.php:16 and config/mail.php:12 wrongly say they are)
  - `commits 8ae6b7167 / 44e482a15` (untracked, then re-added the same day)
  - `php/config/jwt.php, docs/security/findings.json, docs/security/security-report-2026-09-05-17-49.html` (a 55-character former fallback secret: in jwt.php history up to 7756ccd13, and verbatim in the current tree in the SEC-01 evidence of both docs)
- **What**: .gitignore does not protect tracked files, and most `*.local.php` overrides the code reads are not ignored at all. database.local.php currently holds only local-dev values (postgres on 127.0.0.1, 4-character password), but it is the file the README tells you to fill with real credentials.
- **Evidence**: `git ls-files php/config` lists both files, and `git check-ignore` matches none of the other overrides except jwt.local.php. A redacted scan of every historical version shows only local host/user values. gitleaks 8.24.2 (default rules) found nothing in history or tree; its rules do not catch a custom constant such as the old JWT fallback. GitHub Pages serves docs/security/findings.json publicly (ANL-11).
- **Impact**: Once anybody puts real values into database.local.php, or creates mail.local.php, backup.local.php, google.local.php, cors.local.php or site.local.php, `git commit -a` or `git add -A` (typical agent behaviour) publishes them. The old JWT fallback must be treated as known to everyone. Every token must also name a live, random 128-bit session id (session.php:84), so the old key alone does not let anyone forge a working token today; it still must not be the production secret (SEC-01 says the environment was re-keyed; confirm it for production).
- **Fix**: Add `php/config/*.local.php` to .gitignore. Commit `database.dev.php` with dev defaults and make every loader fall back local -> dev -> template: config/db.php:34 and config/backup.php:124 already fall back to the template, but php/migration.php:337 and endpoints/migrations.php:13 require database.local.php outright and would crash on a fresh clone. Then run `git rm --cached php/config/database.local.php`, settle the google.php/.gitignore contradiction and fix the two 'gitignored' comments. Add gitleaks with a custom rule for `*.local.php` and `'password' =>` to a pre-commit hook and CI. Confirm the production JWT secret differs from the published fallback.
- **Fix risk**: Low. Developers need to create their local file once.
- **Verify**: `git ls-files '*.local.php'` is empty; `git check-ignore php/config/mail.local.php` matches; CI secret scan passes.
- **Related**: [ANL-11](#anl-11)

### ANL-15

**Frontend toolchain is fragile: `npm start` needs nvm and an exact Node, lint cannot run, no tests**

`priority: P1` · `severity: medium` · `confidence: verified-static` · `category: dx` · `effort: M` · `decision: D7, D8`

- **Where**
  - `angular/start.js:26-32, 73-78` (`execSync('nvm use ...')` whenever Node is not exactly 22.15.0; exits 1 when it fails, before the client is regenerated)
  - `angular/package.json:5-7` (engines: node exactly 22.15.0)
  - `angular/eslint.config.js:3-5` (imports @angular-eslint/* which are in neither devDependencies nor bun.lock); :20 (ignores src/app/generated/, but the generated client lives in src/app/api/)
  - `angular/README.md` (describes Karma tests that do not exist; there are 0 *.spec.ts files and no PHP tests)
  - `angular/bun.lock` (the only lockfile, while the scripts call npm/npx; lite-server only backs the `server` script at package.json:22, which no documented workflow uses)
- **What**: The documented entry points depend on the author's Windows setup (nvm-windows), and quality tooling is not runnable as committed.
- **Evidence**: Static review of package.json, start.js, eslint.config.js and bun.lock. Execution was not possible here because the npm registry is blocked in the analysis sandbox.
- **Impact**: On Linux or macOS (cloud agents, CI) `npm start` exits unless Node is exactly 22.15.0, because nvm is a shell function there and `execSync('nvm use')` fails. `npm run lint` fails on missing modules. Agents have no automated regression net.
- **Fix**: Replace the nvm switch with a version-range check (or `.nvmrc`) and keep the client regeneration. Add @angular-eslint/* matching Angular 21 and fix the ignore path. Choose one package manager and commit its lockfile. Add unit tests (Angular 21's `@angular/build:unit-test` builder runs Vitest) plus a PHP API smoke suite (Appendix C). Remove lite-server and its `server` script.
- **Fix risk**: Low.
- **Verify**: CI runs `ng build`, lint and tests on Linux.
- **Related**: [ANL-16](#anl-16), [ANL-17](#anl-17)

### ANL-16

**Generated API spec and client are not reproducible across machines**

`priority: P1` · `severity: medium` · `confidence: verified-runtime` · `category: dx` · `effort: S`

- **Where**
  - `angular/generate-api.mjs:278, 398` (`localeCompare` with no locale)
  - `angular/generate-api.mjs:290, 301, 443, 454, 468` (writes CRLF explicitly)
  - `php/generate-api-spec.php` (route `file` stored as the checkout's absolute path rather than a repo-relative one)
  - `.gitattributes` (absent from the repository)
- **What**: Output depends on the OS locale, the OS line endings and the checkout path.
- **Evidence**: Regenerated on Linux: the spec content was identical apart from 399 absolute paths; the client was identical apart from CRLF and method order in 3 services (auth, banner, lookup). Slovak collation sorts 'ch' after 'h', so createBannerCharacter and createBannerFull swap.
- **Impact**: Any agent running `npm run api` (or `npm start` on exactly Node 22.15.0) on Linux produces large no-op diffs, which buries real changes and invites accidental commits.
- **Fix**: Use `a.localeCompare(b, 'en')` or a plain code-point compare; write LF; store paths relative to the repo root; add `.gitattributes` (`* text=auto eol=lf`, binaries marked).
- **Fix risk**: Low. One-time reformat commit.
- **Verify**: Regenerating on Windows and on Linux gives byte-identical output.
- **Related**: [ANL-15](#anl-15)

### ANL-38

**Production sits behind Cloudflare, but every rate limit and stored IP uses REMOTE_ADDR**

`priority: P1` · `severity: medium` · `confidence: needs-host-check` · `category: security` · `effort: S`

- **Where**
  - `php/api/session.php:46-61` (`requestIp()`: REMOTE_ADDR only; its comment says a proxy would make the limit shared and names the fix, a trusted-proxy list)
  - `php/api/session.php:175-188` (10 failures per email+IP and 50 per IP per 15 minutes)
  - `php/api/routes/genshin_impact/endpoints/feedback.php:42-51, 85-92` (feedback limit keyed on a hash of REMOTE_ADDR)
  - `user_sessions.ip, user_login_attempts.ip, user_trusted_devices.ip, feedback.ip` (the stored addresses, ANL-28)
- **What**: anotoki.eu, www.anotoki.eu and umami.anotoki.eu resolve to Cloudflare addresses (104.21.25.199, 172.67.134.133, 2606:4700:3036::ac43:8685, 2606:4700:3037::6815:19c7). Unless the origin restores the visitor's address (mod_remoteip with Cloudflare's ranges, or an equivalent the host provides), REMOTE_ADDR is a Cloudflare edge address, and the code trusts nothing else.
- **Evidence**: DNS lookups from the analysis sandbox; code review. The origin's web-server configuration is not in the repository.
- **Impact**: If REMOTE_ADDR is Cloudflare's, the per-IP ceiling (50 failures per 15 minutes) is shared by everyone who comes through the same edge address, so one person failing logins can lock unrelated users out of login, registration and password reset. An attacker whose requests arrive from several edge addresses gets 10 guesses per account per address instead of 10 in total. The fixes for ANL-03 and ANL-04 inherit both problems, and stored addresses are useless for investigation.
- **Fix**: Check first, in production: `SELECT ip, count(*) FROM user_login_attempts GROUP BY ip ORDER BY 2 DESC LIMIT 20`. If the top addresses are Cloudflare's, enable mod_remoteip at the host (`RemoteIPHeader CF-Connecting-IP` plus `RemoteIPTrustedProxy` for Cloudflare's published ranges), or implement the trusted-proxy list the comment in session.php describes: take CF-Connecting-IP only when REMOTE_ADDR is inside Cloudflare's ranges. Consider Cloudflare rate-limiting rules for /api/auth/* as a second layer.
- **Fix risk**: Low, as long as the header is trusted only from Cloudflare's ranges.
- **Verify**: New rows in user_login_attempts show visitor addresses, not Cloudflare ranges.
- **Related**: [ANL-03](#anl-03), [ANL-04](#anl-04), [ANL-19](#anl-19), [ANL-28](#anl-28)

### ANL-18

**Asset-library operations can silently break the live site, and editors are allowed to run them**

`priority: P2` · `severity: medium` · `confidence: verified-static` · `category: ops` · `effort: M` · `decision: D3`

- **Where**
  - `php/api/asset_catalogue.php:435-527` (Reconcile moves every file in a folder no category claims into assets/unfiled)
  - `php/api/routes/genshin_impact/endpoints/file_categories.php:211-267` (changing a category path moves all its files in one request, without batching or raising PHP's time limit; the disk renames run inside a DB transaction that cannot undo them)
  - `php/api/routes/genshin_impact/endpoints/file_categories.php:104-137` (`_categoryMoveOneFile` flattens every name to its basename; collisions get an md5 suffix)
  - `php/api/routes/genshin_impact/endpoints/file_categories.php:269-305` (deleting a category moves every file into unfiled, flattened the same way)
  - `php/api/routes/genshin_impact/endpoints/file_categories.php:318-397` (rename); files.php:549-604 (forget missing), 610-646 (empty trash: permanent)
  - `php/api/meddleware/auth.php:128-154` (the written rule counts uploaded files as content, ADMIN or EDITOR; these routes follow it, so restricting them is the policy change D3 asks about)
- **What**: Structural and destructive file operations are editor-level and act immediately on the served tree.
- **Evidence**: Code review. The public site resolves much art by folder and name convention (asset_columns.php header; material-icon directive). Older trees had folders such as emoji/, wallpaper/ and wishes/ that no seeded category claims.
- **Impact**: Moving, renaming, deleting or reconciling can break art on the public site without any error: files referenced through `*_file_id` follow their rows, but art found by folder and name convention does not. A category path change or delete also flattens every file name to its basename, so the character/voice_overs tree (about 76k files, names four folders deep) would collapse into one folder even when the move completes, and a time-out half-way leaves disk and catalogue out of sync.
- **Fix**: Settle D3. Restrict structural and destructive file operations to ADMIN; give Reconcile a dry-run listing of the strays it would move; when only a category's path changes, rename its folder in one operation and keep the file names; queue any per-file moves in batches like convert and cleanup do; confirm every served folder is claimed by a category before reconciling production.
- **Fix risk**: Low.
- **Verify**: An editor gets 403 on these routes; the reconcile dry run lists the strays; changing a category path keeps nested file names.
- **Related**: [ANL-40](#anl-40)

### ANL-19

**Large unauthenticated payloads, expensive endpoints, and no general rate limiting**

`priority: P2` · `severity: medium` · `confidence: verified-static` · `category: performance` · `effort: M`

- **Where**
  - `php/api/full_resource.php:146-168, 277-303` (GET /api/{path}/full: every parent with nested children, N+1 queries)
  - `php/api/routes/genshin_impact/endpoints/characters_voice_overs.php:13-16` (`pageSize=0` returns every row, for anyone)
  - `docs/performance/runs/20260905T1331Z.json`
- **What**: Public list endpoints can return megabytes and cost seconds. Nothing throttles them.
- **Evidence**: The project's own benchmark (dev workstation, 52 ms floor): /api/enemies/full 9.65 MB in 1.8 s; /api/weapons/full 2.18 MB in 0.68 s; /api/files/stats 4.95 s; /api/backups/status 2.1 s; /api/files/missing 1.96 s; /api/files/folders 1.77 s (the last four are signed-in only).
- **Impact**: On shared hosting, a trivial loop of anonymous requests can saturate PHP workers and the DB.
- **Fix**: Paginate or cap public lists (drop `pageSize=0` for anonymous callers); ETag and Cache-Control on public content, as translations already do; fetch children per table with IN(...) instead of per parent; rate-limit at Cloudflare, which already fronts the site (ANL-38), or at the web server.
- **Fix risk**: Low to medium: callers of /full lists expect whole arrays.
- **Verify**: The benchmark shows reduced p95 and bytes; a burst of anonymous requests gets 429.
- **Related**: [ANL-26](#anl-26), [ANL-38](#anl-38)

### ANL-20

**`ng build` bundles the whole asset tree, and production config.json is hand-managed**

`priority: P2` · `severity: medium` · `confidence: needs-host-check` · `category: ops` · `effort: S`

- **Where**
  - `angular/angular.json:49-59` (build assets include ../assets -> output assets/)
  - `angular/public/config.json` (dev values: url http://localhost:8000, configuration dev)
- **What**: Every build copies ../assets, about 65-88k files and about 10 GB according to the code's own comments, into dist/. The only committed runtime config is the dev one.
- **Evidence**: Repository config. Production https://anotoki.eu/config.json is {"url":"","configuration":"prod"}, so it is maintained on the server.
- **Impact**: Slow, huge builds; a naive deploy of dist/ (by a person or an agent) overwrites production config.json with dev values, pointing the live site at localhost.
- **Fix**: Keep the ../assets glob only in the development configuration and serve assets from the web server in production. Add a production config (fileReplacements or a deploy step that writes config.json). Document the deploy in the repo.
- **Fix risk**: Medium: check how assets are currently deployed before changing the build.
- **Verify**: `ng build --configuration production` output has no assets/ tree and carries the prod config.
- **Related**: [ANL-22](#anl-22)

### ANL-22

**Production storage/ and vendor/ appear to sit under the web root, protected only by rules outside the repo**

`priority: P2` · `severity: medium` · `confidence: needs-host-check` · `category: security` · `effort: S`

- **Where**
  - `php/README.md` ('Deploying to Hosting' copies api/, config/ and vendor/ into public_html)
  - `php/config/backup.php:39, php/api/error_log.php:28, php/api/mail.php:122` (storage/ is created beside api/)
- **What**: storage/ holds full pg_dump backups (including password hashes), error logs (IP addresses, user ids, paths), mail files (dev driver), caches and the asset trash.
- **Evidence**: https://anotoki.eu/storage/cache/asset-stats.json -> 403 and /vendor/composer/installed.json -> 403, whereas unknown paths such as /php/... get the SPA shell, so something denies these two prefixes. anotoki.eu is proxied by Cloudflare, so the rule may sit at Cloudflare or at the origin, and a 403 does not prove the directories exist; check on the host. /api/openapi.json -> 404. No deny rule is in the repository.
- **Impact**: One server-config change or migration to another host and backups or logs become downloadable. Error-log file names are predictable (errors-YYYY-MM-DD.jsonl).
- **Fix**: Move storage/, config/ and vendor/ outside the document root (make the storage path configurable), or have the code write `storage/.htaccess` with `Require all denied` whenever it creates the directory. Document the real production layout in the repo.
- **Fix risk**: Low.
- **Verify**: Requests to /storage/** return 403 or 404 from a rule that is in the repository.
- **Related**: [ANL-20](#anl-20)

### ANL-35

**SPA hardening: no Content-Security-Policy, bearer secrets in localStorage**

`priority: P2` · `severity: medium` · `confidence: verified-static` · `category: security` · `effort: M`

- **Where**
  - `angular/src/index.html` (no CSP meta; umami script from umami.anotoki.eu)
  - `angular/src/app/shared/local-lib/services/security.service.ts:336, 343, 454` (JWT and 30-day trusted-device token in localStorage)
  - `php/api/index.php:349-374` (strict CSP only on API responses)
- **What**: The API sends strict security headers, but the SPA (served by the web server, config not in the repo) has no CSP in the repository. Session and device secrets are readable by any script on the origin, and the main site and admin share it.
- **Evidence**: Repository review; production SPA headers could not be read from the sandbox.
- **Impact**: Any XSS, for example ANL-06, turns directly into account takeover, including admin.
- **Fix**: Serve a CSP for the SPA (`default-src 'self'; script-src 'self' https://umami.anotoki.eu https://accounts.google.com/gsi/client; object-src 'none'; base-uri 'self'; frame-ancestors 'none'`, then adjust for Google Identity Services and inline styles), and commit it as .htaccess or a documented server config. Longer term, consider an HttpOnly cookie session for the admin.
- **Fix risk**: Medium: CSP needs testing with Google sign-in and the analytics script.
- **Verify**: securityheaders.com and the browser console show no violations on main and admin pages.
- **Related**: [ANL-06](#anl-06), [ANL-29](#anl-29)

### ANL-13

**Raw PostgreSQL error text reaches anonymous callers; missing length validation**

`priority: P2` · `severity: low` · `confidence: verified-runtime` · `category: security` · `effort: S`

- **Where**
  - `php/api/index.php:231-241` ('Invalid data: ' / 'Conflict: ' . $exception->getMessage())
  - `php/api/routes/users/endpoints/auth.php:191-208` (no username length or charset rules)
- **What**: SQLSTATE 22xxx and 23xxx exceptions are mapped to 400 and 409 with the driver message attached. The project's own review lists this area as cleared ('no ... DSNs reach the client').
- **Evidence**: Anonymous POST /api/auth/register with a 150-character username -> 400 {"error":"Invalid data: SQLSTATE[22001]: String data, right truncated: 7 ERROR: value too long for type character varying(100)"}.
- **Impact**: Schema details (column types, constraint names, and on 23505 the conflicting key values) leak. Users see unreadable errors.
- **Fix**: Return generic messages or field-level validation errors and log the detail server-side. Validate username (length, allowed characters) and email length before inserting.
- **Fix risk**: Low.
- **Verify**: The same request gets a 422 with a field error and no SQLSTATE in the body.
- **Related**: [ANL-14](#anl-14)

### ANL-14

**Error handler crashes on any exception under /api/errors**

`priority: P2` · `severity: low` · `confidence: verified-runtime` · `category: correctness` · `effort: S`

- **Where**
  - `php/api/index.php:249-251` (`return $response;` where $response is undefined)
  - `php/psalm.xml` (suppresses UndefinedVariable, which would have flagged it)
- **What**: The default error handler returns an undefined variable for paths starting with /api/errors.
- **Evidence**: PATCH /api/errors -> PHP warning 'Undefined variable $response', then fatal TypeError in ErrorMiddleware; bare 500 text/html with no CORS or security headers. PHPStan also reports it (variable.undefined).
- **Impact**: The error-log pages fail opaquely exactly when something is wrong, for example a DB outage while reading.
- **Fix**: Build the JSON response as for other paths and skip only the logging. Remove the UndefinedVariable suppression from psalm.xml and run PHPStan level 2 in CI.
- **Fix risk**: Low.
- **Verify**: PATCH /api/errors -> 405 JSON.

### ANL-17

**Angular 21.2.0 and Vite 7.3.1 (lockfile) are behind 2026 security releases**

`priority: P2` · `severity: low` · `confidence: verified-static` · `category: security` · `effort: S` · `decision: D8`

- **Where**
  - `angular/bun.lock` (@angular/* 21.2.0; @angular/build 21.2.0 -> vite 7.3.1)
- **What**: The resolved versions predate fixes for CVE-2026-50557 (namespace sanitization bypass, fixed in 21.2.15), CVE-2026-54265 (two-way binding sanitization bypass, fixed in 21.2.17), CVE-2026-54268 (formatDate DoS, fixed in 21.2.17), and the Vite dev-server file-access bypasses CVE-2026-39364 (fixed 7.3.2) and CVE-2026-53571 (Windows, fixed 7.3.5).
- **Evidence**: Versions read from bun.lock; advisories from GitHub Advisory Database (see Sources). PHP dependencies slim/slim 4.15.3 and slim/psr7 1.8.0 have no open advisories.
- **Impact**: Low exploitability as written: no SSR, no service worker, no Angular i18n, no two-way binding on DOM security properties found; the Vite issues matter only when `ng serve` is exposed with --host (for example for phone testing on a Windows LAN). Worth patching anyway.
- **Fix**: Bump to the latest 21.2.x (>= 21.2.17) or to 22.x, regenerate the lockfile, rebuild, and add `npm audit`/`bun audit` plus `composer audit` to CI.
- **Fix risk**: Low (patch releases).
- **Verify**: Lockfile shows the patched versions; audit is clean.
- **Related**: [ANL-15](#anl-15)

### ANL-21

**Uploads .htaccess does not do what its comments (and SEC-02) say**

`priority: P2` · `severity: low` · `confidence: needs-host-check` · `category: security` · `effort: S`

- **Where**
  - `php/public/uploads/.htaccess:1-14`
  - `php/api/full_resource.php:36-46` (writes `php_flag engine off` into public/uploads)
  - `docs/security/findings.json` (SEC-02 resolution)
- **What**: The only header the file sets is `X-Content-Type-Options` (:12-14); nothing sends Content-Disposition, so non-images are not forced to download as the comment at :9-11 claims. `php_flag` (:5) is a mod_php directive; under PHP-FPM/CGI, Apache answers 500 for the whole directory.
- **Evidence**: File contents. Apache behaviour depends on the host and was not testable here.
- **Impact**: Either uploads stop being served (FPM hosts) or the documented download protection is missing.
- **Fix**: Wrap the PHP directives in `<IfModule mod_php.c>`; add `<FilesMatch>` with `Header set Content-Disposition attachment` for non-image extensions, plus `Options -Indexes`; or retire public/uploads entirely (ANL-27).
- **Fix risk**: Low.
- **Verify**: On the host: /uploads/<file>.ogg answers 200 with an attachment disposition, and a .php placed there is not executed.
- **Related**: [ANL-27](#anl-27), [ANL-40](#anl-40)

### ANL-23

**An admin setting a user's password leaves that user's sessions and trusted devices alive**

`priority: P2` · `severity: low` · `confidence: verified-static` · `category: security` · `effort: S`

- **Where**
  - `php/api/routes/users/endpoints/users.php:447-479` (the comment at :473-474 says tokens are 'signed, not looked up', untrue since sessions were added; the response note at :477 is accurate today and must be rewritten with the fix)
- **What**: Self-service password changes and resets revoke sessions and trusted devices; the admin reset does not.
- **Evidence**: Code review: php/api/routes/users/endpoints/auth.php:449-451 and :640-641 revoke; users.php:470-478 does not.
- **Impact**: Resetting a compromised account's password from the admin panel does not sign the intruder out.
- **Fix**: Call `revokeSessionsFor($pdo, $id, SESSION_REVOKED_PASSWORD)` and `revokeTrustedDevices($pdo, $id)`, and fix the comment and the note.
- **Fix risk**: Low.
- **Verify**: The target's old token gets 401 after the admin reset.

### ANL-27

**Two parallel upload systems; the legacy one writes files nothing catalogues**

`priority: P2` · `severity: low` · `confidence: verified-static` · `category: maintainability` · `effort: M`

- **Where**
  - `php/api/full_resource.php:18-132` (`_fullSaveUpload` -> php/public/uploads, used by /full multipart parts)
  - `php/api/routes/genshin_impact/endpoints/upload.php` (POST /api/upload -> public/uploads, random names)
  - `php/api/routes/genshin_impact/endpoints/uploads.php` (new flow -> assets/ + catalogue)
- **What**: Legacy upload paths ('/uploads/...') never become `files` rows, so they cannot be stored in `*_file_id` columns.
- **Evidence**: See ANL-02 for the live consequence.
- **Impact**: Silent data loss (ANL-02), orphan files, two sets of hardening rules to keep in step (ANL-21).
- **Fix**: Route every write through `_saveAssetUpload()` plus the catalogue. Retire /api/upload and the multipart file parts of the /full endpoints once the admin no longer sends them.
- **Fix risk**: Low.
- **Verify**: grep finds no remaining writer to public/uploads.
- **Related**: [ANL-02](#anl-02), [ANL-21](#anl-21)

### ANL-28

**Personal data (IP addresses) kept without retention; a comment claims the opposite**

`priority: P2` · `severity: low` · `confidence: verified-static` · `category: privacy` · `effort: S`

- **Where**
  - `php/api/routes/genshin_impact/endpoints/feedback.php:40` ('The address itself is never stored') vs :118 (stores `ip`)
  - `php/migrations/genshin_impact/011_feedback_origin.sql` (feedback.ip, feedback.mac)
  - `user_sessions.ip, user_login_attempts.ip, user_trusted_devices.ip` (none pruned; trusted_device.php:44-46 fills the last) and php/api/error_log.php (30-day logs with IP)
- **What**: IP addresses (personal data under GDPR, and the audience is Slovak/EU) accumulate indefinitely in four tables.
- **Evidence**: Schema and code review; no DELETE or prune job for these tables exists.
- **Impact**: Compliance exposure and a stale comment that misleads maintainers. If the host does not restore visitor addresses behind Cloudflare, the stored values are Cloudflare's and useless as well (ANL-38).
- **Fix**: Add retention jobs (for example login attempts > 90 days, feedback IP nulled after N days, ended sessions trimmed), a privacy notice, drop the unused feedback.mac column, and fix the comment.
- **Fix risk**: Low.
- **Verify**: Scheduled job runs; counts of old rows go to zero.
- **Related**: [ANL-38](#anl-38)

### ANL-39

**A signed-in user can move their own quiz rows into another account**

`priority: P2` · `severity: low` · `confidence: verified-runtime` · `category: security` · `effort: S`

- **Where**
  - `php/api/routes/genshin_impact/endpoints/quiz_states.php:63-82` (PUT: `QuizState::partialToDbArray()` at :74 writes every model field in the body, `user_id` included; the guard added at :82 checks only the path)
  - `php/api/routes/genshin_impact/endpoints/quiz_stats_history.php:53-70` (the same pattern; update at :62-65)
  - `php/api/routes/genshin_impact/models/quiz_state.php:6 and models/quiz_stats_history.php:6` (`user_id` is a model field)
  - `php/api/meddleware/auth.php:169-182` (`requireSelfOrAdmin()` looks at the route argument only)
- **What**: Both PUTs check that the path's user_id is the caller, then run `UPDATE ... SET <body fields>`, and the model lets `user_id` through.
- **Evidence**: Local run: user 37 created a quiz state, then PUT /api/quiz-states/37/1 with body {"user_id": 38} -> 200; the row now belongs to user 38, with user 37's content.
- **Impact**: Any signed-in user can plant quiz state or statistics in anyone else's account, for example to spoil their daily quiz. If the target already has a row with that key, the unique-violation text comes back (ANL-13). It contradicts the project's own 'cleared' IDOR review (see §7).
- **Fix**: Remove the key columns from the update (`unset($data['user_id'], $data['quiz_id'], $data['character_id'])`) or pin them to the path values, and check the other PUTs guarded by `requireSelfOrAdmin()` for the same pattern.
- **Fix risk**: Low.
- **Verify**: The same PUT leaves the row with user 37 (or answers 422).
- **Related**: [ANL-13](#anl-13)

### ANL-32

**Stale or misleading documentation and comments (agents read these)**

`priority: P2` · `severity: info` · `confidence: verified-static` · `category: docs` · `effort: S`

- **Where**
  - `docs/security/README.md` ('Psalm ... already in composer.json': composer.json has no require-dev)
  - `docs/security/findings.json` (SEC-02 claims .htaccess forces downloads; it does not)
  - `php/api/routes/users/endpoints/users.php:473-474` (tokens 'signed, not looked up')
  - `php/api/routes/genshin_impact/endpoints/feedback.php:40` ('address never stored')
  - `angular/README.md` (Angular CLI 19.2.10, Karma; actual Angular 21.2, no tests)
  - `php/README.md` (a 'PHP CRUD API Template' with 'Swagger annotations' and 'openapi-generator-cli'; empty 'Flyway' header; generic deploy steps; default admin that cannot log in, ANL-05)
  - `php/generate-api-spec.php:24-31` (says row shapes come from schema files; it replays migrations since :483)
  - `angular/src/app/sites/main/features/quizzes/shared/daily.ts:23-25` ('clearing the browser cannot reroll'; true for which quizzes, not for the question: character-quiz.class.ts:158-165 uses Math.random)
  - `php/api/helpers.php:28-31` (CORS default anotoki.eu) vs php/config/mail.php and google.php examples (anotoki.sk, which does not resolve)
  - `README.md` (a 'Next version 1.0' TODO list, not a README)
  - `php/api/openapi.json` (stale: 369 operations for 399 routes; 33 current routes missing, 3 obsolete /api/stats/{id} ones present; its description still says '9 registered routes are left out'; last regenerated in cde22f9a2 on 2026-09-03; docs.html serves it)
  - `php/config/site.php:16, php/config/mail.php:12` ('gitignored, like the other .local.php files': they are not, ANL-12)
  - `php/config/database.local.php:5` ('database.local.php is gitignored': it is tracked)
  - `.gitignore:30-31` (the API 'refuses to start' without a JWT secret: it starts, and only signing and verifying tokens fail)
- **What**: The codebase leans heavily on explanatory comments; several now contradict the code.
- **Evidence**: Each item checked against the code at commit 17a0c5472.
- **Impact**: Agents that trust comments will make wrong decisions (for example assuming uploads are forced to download, that the default admin works, that a new *.local.php file cannot be committed, or that openapi.json describes the API).
- **Fix**: Correct the items; regenerate openapi.json (`cd angular && npm run api`) in a commit of its own; add a 'comments must match code' check to review; write a real top-level README (what, stack, setup, deploy).
- **Fix risk**: None.
- **Verify**: Re-read each item.

### ANL-24

**optionalAuthUser() accepts revoked (signed-out) tokens**

`priority: P3` · `severity: low` · `confidence: verified-runtime` · `category: security` · `effort: S`

- **Where**
  - `php/api/meddleware/auth.php:112-126`
- **What**: Optional-auth endpoints (feedback) verify the signature only, not the session.
- **Evidence**: After POST /api/auth/logout, POST /api/feedback with the old token stored the feedback with that account's user_id, username and email.
- **Impact**: A leaked old token can still post feedback in someone's name. Minor, but inconsistent with the session model.
- **Fix**: Check `findSession()` and the session's user_id as `requireAuth()` does.
- **Fix risk**: Low.
- **Verify**: After logout, feedback is saved as anonymous.

### ANL-25

**Quiz results are client-asserted and unthrottled; the voice quiz ships the answer with the question**

`priority: P3` · `severity: low` · `confidence: verified-static` · `category: product` · `effort: M` · `decision: D10`

- **Where**
  - `php/api/routes/genshin_impact/endpoints/quiz_progress.php:117-169` (win, attempts and difficulty from the body)
  - `php/api/routes/genshin_impact/endpoints/user_quiz_history.php:32-46` (inserts history without updating totals)
  - `php/api/routes/genshin_impact/endpoints/quiz_voice_over.php:27-69` (returns character_id and name with the clip)
  - `php/api/routes/genshin_impact/endpoints/quiz_progress.php:63-93` (state blob stored as-is, no size cap)
- **What**: The server records whatever the browser says happened.
- **Evidence**: Code review.
- **Impact**: Fine for personal stats. It would block leaderboards or any competitive feature, if one is planned (none is in README.md or the changelog; see D10). Unthrottled writes and uncapped state allow database bloat.
- **Fix**: Before any competitive feature: server-side answer checking with a question token. Now: rate limits, a cap on state size (for example 64 KB), and retiring POST /api/user-quiz-history.
- **Fix risk**: Low.
- **Verify**: Tests for size cap and throttle.

### ANL-26

**Child rows are soft-deleted and re-inserted on every save (unstable ids, growth, asymmetric shapes)**

`priority: P3` · `severity: low` · `confidence: verified-static` · `category: maintainability` · `effort: L`

- **Where**
  - `php/api/routes/genshin_impact/endpoints/characters_full.php:252-334`
  - `php/api/full_resource.php:335-370`
  - `php/api/routes/genshin_impact/endpoints/characters_full.php:393-403` (GET returns `talent_cost` and flat `ascension_cost`; POST at :160-189 and PUT at :276-298, :316-324 expect `talent_costs` and nested `ascensions[].costs`)
- **What**: Each save gives every child a new id and leaves the old copy as a deleted row.
- **Evidence**: Code review; the voice quiz stores `voiceOverId` in saved state (quizzes/voice/voice.component.ts:73).
- **Impact**: Unbounded table growth; stale references (saved quiz state, audit record ids); deleted duplicates in the child-table endpoints (ANL-01); the asymmetric characters /full shape is a trap for client code.
- **Fix**: Upsert children by id (diff) or hard-delete them (write DELETE audit rows on the way; inserts are already audited). Align the characters /full GET and PUT shapes and regenerate the client.
- **Fix risk**: Medium.
- **Verify**: Saving twice keeps child ids stable.
- **Related**: [ANL-01](#anl-01), [ANL-02](#anl-02)

### ANL-29

**HTTP interceptor sends the JWT to any destination; dead cache code from another project**

`priority: P3` · `severity: low` · `confidence: verified-static` · `category: security` · `effort: S`

- **Where**
  - `angular/src/app/shared/local-lib/services/http.interceptor.ts:17-32` (cache for '/enums/' and '/hodnotaCiselnika/' that never matches this API)
  - `angular/src/app/shared/local-lib/services/http.interceptor.ts:50-57` (Authorization added regardless of host)
- **What**: A latent leak: the first HttpClient call to a third-party URL would carry the session token.
- **Evidence**: No such external call exists today (only the GIS script tag).
- **Impact**: None today; easy to trip later.
- **Fix**: Attach the token only when the URL is under the configured backend or '/api/'; delete the dead cache block.
- **Fix risk**: Low.
- **Verify**: Unit test on the interceptor.
- **Related**: [ANL-35](#anl-35)

### ANL-30

**`sanitize` input on AbstractInputComponent actually disables sanitization**

`priority: P3` · `severity: low` · `confidence: verified-static` · `category: security` · `effort: S`

- **Where**
  - `angular/src/app/shared/local-lib/abstract-input.class.ts:38, 61-67`
- **What**: `sanitize = true` calls `bypassSecurityTrustHtml()`. Nothing sets it today.
- **Evidence**: grep: no usages.
- **Impact**: A footgun for the next person, or agent, who reads the name.
- **Fix**: Rename it to `trustHtml` or remove it.
- **Fix risk**: Low.
- **Verify**: grep shows no bypass reachable from inputs.

### ANL-31

**Main-site features are not split per route**

`priority: P3` · `severity: low` · `confidence: verified-static` · `category: performance` · `effort: S`

- **Where**
  - `angular/src/app/sites/main/main.routes.ts:1-29` (every feature imported statically)
  - `angular/src/app/app.routes.ts:8-11` (the whole main site is one lazy `loadChildren` chunk)
- **What**: Each site is one lazy chunk. Within the main site nothing is split, so the first visit to any public page downloads quizzes, games, database pages and profile together.
- **Evidence**: Code review; bundle size not measured (no build possible here).
- **Impact**: Slower first public page. The chunk is lazy, so the 500 kB initial budget does not measure it and will not catch its growth.
- **Fix**: Use `loadComponent` or `loadChildren` per feature.
- **Fix risk**: Low.
- **Verify**: The `ng build` stats show a lazy chunk per feature.

### ANL-34

**Audit writes swallow PDO errors inside transactions (PostgreSQL then aborts the transaction)**

`priority: P3` · `severity: low` · `confidence: verified-static` · `category: correctness` · `effort: S`

- **Where**
  - `php/api/db_query.php:321-342` (`catch (\PDOException) {}` in writeAuditLog)
- **What**: In PostgreSQL a failed statement aborts the surrounding transaction. Catching the error hides the cause, and the next statement fails with 'current transaction is aborted'.
- **Evidence**: Code review; /full saves run inside transactions.
- **Impact**: Rare (only if audit_logs is broken), but it turns into a misleading error far from its cause.
- **Fix**: Use a SAVEPOINT around the audit insert, or let the error propagate now that the table always exists.
- **Fix risk**: Low.
- **Verify**: Test with audit_logs renamed: the error names the audit insert.

### ANL-40

**Asset file names keep inner dots, so double extensions such as `x.php.png` can land in the served tree**

`priority: P3` · `severity: low` · `confidence: needs-host-check` · `category: security` · `effort: S`

- **Where**
  - `php/api/asset_naming.php:31-43` (`_assetPathSegment()` strips separators and leading dots, keeps inner dots)
  - `php/api/routes/genshin_impact/endpoints/uploads.php:64-68, 138 and files.php:262-266` (file names come from the client, or a server default)
  - `php/api/full_resource.php:76` (the legacy saver, by contrast, replaces every dot)
- **What**: Names are sanitised per path segment, but a stem such as `shell.php` survives. The extension allowlist and the image check look at the last extension and the bytes, and the original is kept beside its AVIF copy, so `shell.php.png` holding a valid PNG with PHP in a text chunk is accepted.
- **Evidence**: Code review. Whether Apache would run such a file depends on how the host maps PHP: `AddHandler` or `AddType` for .php runs any file with .php among its extensions, while a `<FilesMatch "\.php$">` handler does not. assets/ is gitignored, so any rule the host keeps there is not in the repository either.
- **Impact**: Code execution on the host from an EDITOR account, but only on hosts that map PHP by extension anywhere in the name and have no script-refusing rule for assets/.
- **Fix**: Replace inner dots in stems (as the legacy saver does), or refuse stems whose inner parts end in a script extension. Keep a rule for assets/ that refuses script extensions anywhere in the name in the documented server config.
- **Fix risk**: Low.
- **Verify**: An upload named `a.php` is stored without the inner dot, or refused; on the host, any path under /assets/ containing `.php` is refused.
- **Related**: [ANL-18](#anl-18), [ANL-21](#anl-21)

### ANL-33

**Repository leftovers and hygiene**

`priority: P3` · `severity: info` · `confidence: verified-static` · `category: repo-health` · `effort: S` · `decision: D9`

- **Where**
  - branch `dev` (last commit 2025-11-20; fully merged into main)
  - `angular/src/app/shared/local-lib/diacritics copy.ts` (byte-identical duplicate, unused)
  - `php/test.php, formats-converters/server-test.php` (a PDO-driver printout and a host capability probe: make sure neither is deployed)
  - `php/vendor/**` (committed, including 41 test files; composer.json has no PHP platform constraint)
  - `formats-converters/` (package.json names a main 'mp3-to-opus.js' that does not exist; DELETE_ORIGINAL = true by default in mp3-or-ogg-to-opus.js:17 and ogg-or-mp3-to-opus.php:6)
  - `old/` (3,075 files of the legacy Vue app, its assets gone)
  - `feedback.mac` (a dead column since users/038 dropped the session one)
  - `php/api/routes/genshin_impact/endpoints/migrations.php:11-15` (requires database.local.php directly, unlike db.php's fallback)
- **What**: Small items that confuse readers or carry risk out of proportion to their value.
- **Evidence**: Inventory.
- **Impact**: Noise for agents; destructive defaults in converter scripts; possible info-disclosure pages if deployed.
- **Fix**: Delete or archive as appropriate (old/ is D9); flip DELETE_ORIGINAL to false; add `"require": {"php": ">=8.2"}`.
- **Fix risk**: Low.
- **Verify**: Inventory again.

## 6. What is solid (verified; do not "fix" these)

| Area | Verification |
|---|---|
| SQL injection | Every request value is bound (one path argument is escaped with `PDO::quote` instead, `languages.php:132`, which is safe). Identifiers come from code or from DTO constructor allowlists (`fromBody`/`partialToDbArray`). A grep for request data flowing into identifiers, `ORDER BY` or `LIMIT` found none; Psalm taint found nothing. |
| Path traversal | `/uploads/..`, `/uploads/%2e%2e`, `/api/files/raw?folder=..`, encoded variants and migration file names all answered 404 or 401 at runtime; `realpath` prefix checks and per-segment sanitising (`_assetPathSegment`) hold. |
| Sessions | Logout revoked the token (200 -> 401 at runtime). `requireAuth` re-reads the user and checks session ownership. Password change and reset, and 2FA on/off, revoke other sessions and trusted devices (code). |
| Tokens and secrets at rest | Email tokens, login codes, recovery codes and device tokens stored as SHA-256; passwords bcrypt; CSPRNG everywhere; JWT signature compared with `hash_equals` and the algorithm is pinned. |
| Object-level authorization (reads) | User 3 reading user 2's quiz state and stats -> 403; `/api/users`, `/api/backups` and `/api/user-quiz-history` as a USER -> 403 (runtime). Writes have one gap (`ANL-39`). |
| CORS | A stranger Origin gets no CORS headers; the allowlisted origin is echoed with `Vary: Origin` (runtime). |
| API security headers | nosniff, `X-Frame-Options: DENY`, `Referrer-Policy`, `CSP default-src 'none'` on API responses (runtime). |
| Maintenance mode | Anonymous `/api/characters` -> 503, admin -> 200, `/api/settings/public` -> 200, encoded path -> 503 (runtime). |
| Password-login throttling | 429 after 10 failures (local runtime). In production the per-IP keys may be Cloudflare edge addresses (`ANL-38`). |
| Google token verification | RS256 pinned, JWKS by `kid` with one refetch, `iss`/`aud`/`exp`/`sub` checked, `email_verified` required for linking by address (code). Linking itself is not safe (`ANL-37`). |
| Backup/restore | Typed confirmation, password re-entry, automatic safety backup, `pg_restore --single-transaction`, `proc_open` with argument arrays and `PGPASSWORD` in the environment (code). |
| Migrations | Idempotent runner, one transaction per file, natural ordering, missing-file detection; builds cleanly from zero (runtime). |
| Generated contract | Spec and client regenerate identically in content (runtime); the replayed schema equals the real one (runtime). The committed `php/api/openapi.json` is stale (`ANL-32`). |
| Public rich text | `sanitizeRichHtml()`: DOMParser inert document, tag/attribute/style allowlists, URL scheme allowlist, `rel=noopener`. |
| Upload type checks (new flow) | Extension allowlist, `getimagesizefromstring` for rasters, AVIF/Opus re-encoding. File names come from the client (or a server default) and are sanitised per path segment; inner dots survive (`ANL-40`). |

## 7. The project's own security review (2026-09-05), re-checked

| Finding in `docs/security/findings.json` | Claimed | Re-check |
|---|---|---|
| SEC-01 JWT signing key was the committed fallback | fixed | Code fails closed when a token is signed or verified (`jwt.php:35-61`). The old 55-character fallback is still public: in `jwt.php` history up to 7756ccd13 and verbatim in `docs/security/findings.json` and the HTML report, which Pages republishes. Treat it as burned and confirm production's secret differs (`ANL-12`); forged tokens would still need a live random session id. |
| SEC-02 `/api/upload` trusted client extension | fixed | Allowlist and image check confirmed in code. The claim that `public/uploads/.htaccess` forces downloads is **false**, and `php_flag` breaks on PHP-FPM (`ANL-21`). |
| SEC-03 No security headers | fixed | Confirmed on API responses at runtime. The SPA itself has none in the repo (`ANL-35`). |
| SEC-04 Registration enumeration and throttling | fixed | Confirmed (shared limiter). The **login-code** endpoints were missed (`ANL-03`, `ANL-04`). |
| SEC-05 slim/slim advisory | fixed | `vendor/composer/installed.json` shows 4.15.3. |
| SEC-06 CORS handled twice | fixed | One middleware; behaviour confirmed at runtime. |
| SEC-07 Footer href | fixed | `isSafeUrl()` + `[href]` binding confirmed. |
| "Cleared: secret and error handling ... no DSNs reach the client" | cleared | Partly wrong: PostgreSQL messages reach anonymous clients on 22xxx/23xxx (`ANL-13`). |
| "Cleared: brute force / login" | cleared | True for `/api/auth/login` only (`ANL-03`, `ANL-04`), and in production only if the host restores visitor addresses (`ANL-38`). |
| "Cleared: broken object-level authorization (IDOR)" | cleared | Reads hold (403s at runtime); two PUTs accept a new `user_id` in the body (`ANL-39`). |
| Not covered by the review | - | Email-link sign-ins skip 2FA (`ANL-36`); Google linking adopts pre-registered accounts (`ANL-37`). |

## 8. Decisions that need the owner

Agents: do not implement the findings listed under **Blocks** until the owner answers.

| ID | Question | Options | Recommendation | Reversible | Blocks |
|---|---|---|---|---|---|
| D1 | How far to shrink the git repository? | (a) Re-point tags 0.1-0.8 to their twins on main and force-push tags: clone ~9.3 GB -> ~1.8 GB, no rewrite of main.<br>(b) Additionally purge assets/ from main history with git-filter-repo: clone -> tens of MB, every commit hash changes.<br>(c) Leave as is; agents use partial clones. | (a) now, (b) when there is a quiet window; tell anyone with a clone to re-clone after (b). | (a) yes (the old targets are plain commits behind lightweight tags and can be re-pushed from any full clone that still has them); (b) only from a backup mirror. | ANL-10 |
| D2 | What does 'deleted' mean for readers? | Hidden everywhere (public and admin), no restore.<br>Hidden on the public site; admin lists hide by default with an ADMIN-only 'show deleted' toggle and a restore action.<br>Switch children to hard deletes (inserts are already audited; the delete path must write its own DELETE audit rows) and keep soft delete only for top-level entities. | Option 2, combined with option 3 for child rows (ANL-26). | Yes. | ANL-01, ANL-26 |
| D3 | What may an EDITOR do? | Keep today's model (content + translations + all file operations).<br>EDITOR keeps content and plain-text translations; HTML translations, file-structure changes (category moves, renames, reconcile, cleanup, empty trash, forget missing) and language deletion become ADMIN-only. | Option 2. This changes the written rule rather than applying it: php/api/meddleware/auth.php:128-154 counts uploaded files as content (ADMIN or EDITOR), so adopting option 2 means amending that comment and adding a role group for asset structure and HTML translations. | Yes. | ANL-06, ANL-18 |
| D4 | How is the first admin created on a fresh database? | Random one-time password printed once by migration.php (email_confirmed = TRUE, force_password_change = TRUE).<br>Credentials from environment/CLI flags (`php migration.php --admin-email=... --admin-password=...`).<br>Keep the fixed documented password (not recommended). | Option 1 as the default, option 2 for automation; plus server-side enforcement of force_password_change. | Yes. | ANL-05 |
| D5 | What should GitHub Pages publish? | Nothing: delete the workflow.<br>Only docs/ (the generated reports). | Delete it. The reports contain internal detail about the API that does not need a public URL. | Yes. | ANL-11 |
| D6 | Keep php/config/database.local.php tracked for convenience? | Keep it tracked (today) and rely on discipline.<br>Commit database.dev.php with dev defaults; database.local.php becomes untracked and optional. | Option 2. Agents commit whatever is modified. | Yes. | ANL-12 |
| D7 | What is the minimum quality gate in CI? | php -l + PHPStan level 2 (baseline the `$app might not be defined` noise) + API smoke suite on PostgreSQL + ng build + lint + unit tests + secret scan.<br>Build only. | Option 1, introduced in that order: each step is cheap and each catches a class of issue found in this report. | Yes. | ANL-14, ANL-15, ANL-17 |
| D8 | Which package manager and Node policy for angular/? | bun (bun.lock is what exists)<br>npm (what the scripts call) | Pick one, commit its lockfile, delete the other, and declare a Node range (e.g. >=22.15 <23) instead of an exact pin. | Yes. | ANL-15, ANL-17 |
| D9 | What happens to old/ (the legacy Vue site)? | Delete it (history keeps it; tag the last commit that has it).<br>Keep it. | Delete it after tagging. Its assets are gone, so it no longer works anyway. | Yes (via the tag). | ANL-33 |
| D10 | Are competitive features (leaderboards, shared scores) planned? | Yes: results must be validated server-side first.<br>No: current trust model is acceptable for personal stats. | Decide before building any shared ranking. | Yes. | ANL-25 |

## 9. Recommended plan

Each line is one small PR unless noted. The order inside a phase is a suggestion; the dependencies are real.

**Phase 0: safety fixes (hours each, no decisions needed)**
1. `ANL-36` and `ANL-37`: second factor on the email-link sign-ins; clear the password (or refuse) when Google links to an unconfirmed account; prune unconfirmed accounts.
2. `ANL-38` (host check, ask the owner): one SQL query in production; if the addresses are Cloudflare's, restore visitor IPs before relying on any limiter.
3. `ANL-03` and `ANL-04`: limiter on both login-code endpoints; check the code before the TOTP; record TOTP failures; TOTP replay guard.
4. `ANL-07`: decode the path in the route gate (and the maintenance gate).
5. `ANL-08`: soft-delete helper that writes its own audit row (+ grep check).
6. `ANL-14` + `ANL-13`: fix the error handler; generic DB error messages; username and email length validation.
7. `ANL-23` + `ANL-24` + `ANL-39`: revoke sessions on admin password reset; session check in `optionalAuthUser()`; key columns out of the quiz updates.
8. `ANL-06`: sanitize before `innerHTML` in the HTML editor and `normalizeHtml()`.
9. `ANL-02`: store voice-over audio through the asset pipeline.

**Phase 1: foundations (days)**
10. Test and CI scaffolding (`D7`): the API smoke suite from Appendix C on PostgreSQL in GitHub Actions; `php -l`; PHPStan level 2 with a baseline; secret scan.
11. `ANL-15` (`D8`): runnable `npm start` on Linux, working lint, unit-test runner, one lockfile; then `ANL-17` (patch Angular/Vite), with `ng build` + lint + tests in CI.
12. `ANL-16`: deterministic generators + `.gitattributes`, as one normalising commit.
13. `ANL-05` (`D4`): bootstrap admin + server-side `force_password_change`.
14. `ANL-01` (`D2`): live-row filtering on every read + admin toggle; then `ANL-26` for children.
15. `ANL-09`: email normalisation (after checking production for case-duplicates).
16. `ANL-11` (`D5`), `ANL-12` (`D6`), `ANL-10` step (a) (`D1`): remove Pages, ignore and untrack local config, re-point tags.

**Phase 2: hardening and operations**
17. `ANL-35` SPA CSP; `ANL-29` interceptor scope.
18. `ANL-18` (`D3`): role restrictions and dry-run for asset operations; category moves that keep nested names, in batches.
19. `ANL-19`: pagination/caching of heavy public endpoints; rate limiting at Cloudflare or the web server.
20. `ANL-20`, `ANL-21`, `ANL-22`, `ANL-40`: build without assets, prod config handling, uploads, assets and storage lockdown with committed server config; document the deploy.
21. `ANL-27`: retire the legacy upload path. `ANL-28`: retention jobs and privacy notice. `ANL-32`: correct stale docs, regenerate openapi.json and write a real README.

**Phase 3: backlog**
22. `ANL-10` step (b) history purge (`D1`), `ANL-25` (`D10`), `ANL-31` lazy routes, `ANL-30`, `ANL-33` (`D9`), `ANL-34`.

## 10. Agent operating guide

### 10.1 Local setup that works today (verified on Linux)

```bash
# Clone light (history is ~9 GB, see ANL-10)
git clone --filter=blob:none https://github.com/irelevant25/anotoki-genshin-impact.git

# PostgreSQL >= 14 (16 verified). Write config with REAL local values only.
# NOTE: php/config/database.local.php is TRACKED (ANL-12): never commit changes to it.
#       Until ANL-12 is fixed: git update-index --skip-worktree php/config/database.local.php
php -r "echo bin2hex(random_bytes(32));"            # put the result in php/config/jwt.local.php:  <?php return '...';
cd php && php migration.php                         # creates and builds users + genshin_impact from zero
psql -h 127.0.0.1 -U postgres -d users -c "UPDATE users SET email_confirmed = TRUE WHERE email = 'admin@localhost';"   # until ANL-05 is fixed (or: 'forgot password', then the .eml in storage/mail)
php -S localhost:8000 router.php                    # the router is required (dotted paths, /uploads)
# sign in as admin@localhost / Admin1234!, then change the password (the site asks)

# Frontend (until ANL-15 is fixed, skip start.js on Linux/macOS)
cd ../angular && npm install            # or bun install, see D8
npx ng serve                            # uses public/config.json -> http://localhost:8000
# The committed client is current: run `npm run api` only after an API change (house rule 1).
```

Mail uses the `file` driver in development: links and codes land in `php/storage/mail/*.eml`. Only `jwt.local.php` is gitignored; if you create another `php/config/*.local.php` override (mail, site, backup, google, cors), add it to `.git/info/exclude` first (`ANL-12`). The fresh database has no game content; ask the owner for a sanitised dump restored through the Backups page, or seed test rows.

### 10.2 House rules (invariants)

1. **Schema changes** go in a new numbered file in `php/migrations/<alias>/`. Never edit an applied migration. Then run `php migration.php` (from `php/`) and `npm run api` (from `angular/`: spec, client and `php/api/openapi.json`; needs `typescript`), and commit all three with the change. `openapi.json` is stale at `17a0c5472` (369 of 399 operations): land its catch-up regeneration as a commit of its own first. Until `ANL-16` is fixed, normalise CRLF and ordering noise before committing on Linux. The migration replay in the spec generator supports create/add/drop/rename/retype and CHECK; if you use other DDL, compare the spec's table with the real one.
2. **New endpoint**: put it in `php/api/routes/<db>/endpoints/`, and **require the file in `php/api/index.php`** (an unrequired file is silently absent). Chain `->add(responds(...))`, then validation, role (`ROLES_*` constants) and `requireAuth()`. Declare response shapes in `routes/<db>/responses/`. Regenerate the client.
3. **Writes** use `Model::fromBody()` / `partialToDbArray()`. Never build column lists from request keys. Never let a body change a key column that the path identifies (`ANL-39`). Stamp `created_by` / `updated_by` from the token; soft deletes use `['deleted' => true, 'updated_by' => $user['id']]` on tables that have `updated_by` (users, quizzes and file_categories do not; `ANL-08`).
4. **Reads** of tables with `deleted` filter live rows (`ANL-01`, once D2 is settled).
5. **Anything that authenticates, sends mail, or answers differently per account** uses `loginAttemptsExceeded()` / `recordLoginAttempt()` and must not reveal whether an account exists (two deliberate, documented exceptions: register's 'already taken', routes/users/endpoints/auth.php:224-236, and `password_login_unavailable`, :343-356; change them only with the owner). Every path that mints a session calls `authTotpRefusal()` first (`ANL-36`).
6. **Stored HTML** is rendered only through `app-rich-text` / `sanitizeRichHtml()`. Never assign `innerHTML` from data, and never use `bypassSecurityTrust*` on data.
7. **Files**: production is Linux, so file names are case-sensitive. Image paths are `../assets/...` and audio paths `assets/...` (`resolveAssetRows`). New uploads go through `_saveAssetUpload()` + the catalogue, never `public/uploads`.
8. **Generated code** (`angular/src/app/api/models/**`, `services/**` and `index.ts`, `angular/api-spec.json`, `php/api/openapi.json`, `docs/**/*.html`) is never hand-edited; change the source and regenerate. `angular/src/app/api/types/*.ts`, `form-data.ts`, `http-params.ts` and `json-columns.ts` are hand-written and edited directly.
9. **Never commit**: real values in any `php/config/*.local.php` (only `jwt.local.php` is gitignored today, `ANL-12`), `php/storage/**`, `assets/**`, ffmpeg binaries, `formats-converters/node_modules`.
10. **PHP compatibility**: keep to PHP 8.2 features (dev README 8.2.12; production version unknown, ask), and PostgreSQL 14+ SQL.
11. **Budgets**: initial bundle warns at 500 kB and errors at 1 MB; component styles warn at 10 kB and error at 15 kB (`angular.json`).
12. **House style**: commit subjects are imperative sentences about behaviour ("Stop the dropdown showing the first option you ever picked"). Comments explain *why* in full sentences. Keep both, and keep comments true (`ANL-32`).

### 10.3 Verification checklist per change

- PHP: `php -l` on changed files; PHPStan level 2 (not a dependency: use the phar; ignore `$app might not be defined`); run `migration.php` against a scratch PostgreSQL (it always reads `config/database.local.php`, so use a separate instance or a copy of `php/` with its own config); exercise the endpoint with curl as anonymous, USER, EDITOR and ADMIN.
- Frontend: `ng build --configuration production` (budgets); lint and unit tests once `ANL-15` lands; check the admin and main flows touched.
- Contract: regenerate with `npm run api`; the diff must only contain intended changes.
- Security-relevant: add a regression test from the finding's *Verify* line.

### 10.4 Traps (seen in this codebase)

- `npm start` on Linux fails in `start.js` (nvm) unless Node is exactly 22.15.0 (`ANL-15`); `npm run lint` fails on missing modules.
- `npm run api` also rewrites the stale `php/api/openapi.json` (33 missing operations, `ANL-32`): commit that catch-up on its own.
- Regenerating on Linux reorders methods and flips line endings (`ANL-16`).
- `php -S` without `router.php` returns 404 for any path ending in a dotted segment (translation keys), which the browser reports as CORS.
- `database.local.php` is tracked; `google.php` is tracked although `.gitignore` lists it; the other `*.local.php` overrides except `jwt.local.php` are not ignored at all (`ANL-12`).
- `users`, `quizzes` and `file_categories` have `deleted` but no `updated_by` (`ANL-08`).
- Changing a file category's path flattens nested file names (`ANL-18`).
- Email-link sign-ins skip 2FA today (`ANL-36`); do not copy that pattern into new flows.
- The characters `/full` GET and PUT shapes differ (`talent_cost` vs `talent_costs`, flat vs nested ascension costs) (`ANL-26`).
- Child ids change on every save; do not store them in client state (`ANL-26`).
- Default admin credentials in the README do not work on a fresh database (`ANL-05`).
- `sanitize` on inputs means *bypass* (`ANL-30`).
- The dev machine is Windows (case-insensitive); production is not.

### 10.5 Draft `CLAUDE.md` (for the owner to adopt at the repo root)

```markdown
# Anotoki - agent instructions
- Read ANOTOKI_ANALYSIS_REPORT.md (sections 1, 5, 8, 10) before non-trivial work; findings are ANL-xx, decisions D#.
- Stack: Angular 21 (angular/), PHP 8.2 Slim 4 API (php/api), PostgreSQL (php/migrations). Prod: https://anotoki.eu, API same-origin /api.
- Setup: see report section 10.1. Always run the API with `php -S localhost:8000 router.php` from php/.
- Schema: new numbered migration only; run `php migration.php` (from php/), then `cd angular && npm run api`; commit spec, client and php/api/openapi.json.
- New route file => require it in php/api/index.php. Add ->add(responds(...)) and ROLES_* guards.
- Soft delete: ['deleted' => true, 'updated_by' => $user['id']] where the table has updated_by (not users, quizzes, file_categories). Read filtering waits for D2 (ANL-01).
- Per-user updates: never let the body change a key column the path identifies.
- Auth-ish endpoints: loginAttemptsExceeded/recordLoginAttempt; never reveal account existence; anything that mints a session calls authTotpRefusal first.
- Stored HTML: only <app-rich-text>/sanitizeRichHtml; never innerHTML/bypassSecurityTrust on data.
- Never commit php/config/*.local.php (most are not gitignored), php/storage, assets/. Generated files (src/app/api/models, services, index.ts; api-spec.json; openapi.json) are never hand-edited; src/app/api/types and the three helpers are.
- Production is Linux: file names are case-sensitive.
- Ask the owner before: history rewrites, tag changes, deploy/server config, role-model changes, deleting old/.
- Every change: php -l, migration on a scratch DB, curl as anon/USER/EDITOR/ADMIN, ng build --configuration production; add PHPStan L2, lint and tests once ANL-15/D7 land.
```

## 11. Appendices

### A. Size and structure metrics

| Area | Files (tracked) | Non-blank lines |
|---|---|---|
| angular/src (hand-written) | 615 | 51,775 (TS 27,878 / SCSS 13,437 / HTML 10,460) |
| angular/src/app/api | 67 (53 generated, 14 hand-written) | 7,735 (7,001 + 734) |
| angular/ root (configs, generators, api-spec.json) | 25 | 30,997 in the 23 text files (api-spec.json 27,956) |
| php/api | 176 | 17,452 PHP (+ openapi.json 44,955, docs.html) |
| php/migrations | 53 | 6,296 SQL |
| php root + config | 20 | 2,629 PHP |
| php/vendor (committed) | 238 | 16,212 PHP |
| docs | 25 | 15,559 (generated reports and data) |
| old/ (legacy) | 3,075 | 11,088 code + 423,025 data |

Git: 260 commits on main; 425 in all refs; 72,378 blobs, 9.27 GB packed (assets/character 8.72 GB; .mp3 6.13 GB, .opus 1.70 GB, .png 1.31 GB).

### B. Performance hotspots (project's own run `docs/performance/runs/20260905T1331Z.json`, dev workstation, floor 52 ms)

| Endpoint | Median | Payload |
|---|---|---|
| GET /api/files/stats | 4,950 ms | 0.5 KB |
| GET /api/backups/status | 2,115 ms | 0.6 KB |
| GET /api/files/missing | 1,956 ms | - |
| GET /api/enemies/full (public) | 1,817 ms | 9.65 MB |
| GET /api/files/folders | 1,770 ms | 63 KB |
| GET /api/files/cleanup | 677 ms | 0.1 KB |
| GET /api/weapons/full (public) | 676 ms | 2.18 MB |
| GET /api/materials/full (public) | 292 ms | 0.82 MB |
| GET /api/foods/full (public) | 232 ms | 0.98 MB |
| GET /api/banners/full (public) | 215 ms | 0.38 MB |

### C. Local verification recipes (dev instance only)

These are regression checks for your own local instance (`localhost:8000`, file mail driver). Turn them into the API smoke suite suggested in phase 1.

```bash
API=http://localhost:8000
# ANL-14: error handler on /api/errors  (expect 405 JSON after the fix; today a bare 500)
curl -s -i -X PATCH $API/api/errors | head -1

# ANL-07: route gate decoding  (lock /quizzes with API prefix /api/quizzes in Admin > Settings > Parts of the site)
curl -s -o /dev/null -w "%{http_code}\n" $API/api/quizzes        # 423
curl -s -o /dev/null -w "%{http_code}\n" $API/api/%71uizzes      # must also be 423 after the fix

# ANL-01: soft delete visibility (as ADMIN, delete a character, then as anonymous)
curl -s $API/api/characters | jq '[.[] | select(.deleted)] | length'   # must be 0 after the fix

# ANL-13: DB error text  (expect a 422 field error, no SQLSTATE, after the fix)
curl -s -X POST $API/api/auth/register -H 'Content-Type: application/json' \
  -d "{\"username\":\"$(printf 'x%.0s' {1..150})\",\"email\":\"a@b.c\",\"password\":\"abcdefgh12\"}"

# ANL-03/04: after the fix, repeated wrong verifies must reach 429, and a wrong TOTP
# and a wrong code must produce the same status and body.

# ANL-36: for an account with 2FA on, POST /api/auth/password/forgot, take the token from
# storage/mail, POST /api/auth/password/reset without "totp": expect 403 totp_required, no token.

# ANL-39: as user A, PUT /api/quiz-states/<A>/<quiz> with {"user_id": <B>}: the row must stay A's.
```

Suggested smoke suite: spin up PostgreSQL in CI, run `php migration.php`, confirm and sign in the seeded admin (after `ANL-05`: use the printed password), then create/read/update/delete one entity per `registerFullResource()` type, run the auth flows (register -> confirm via `storage/mail` -> login -> 2FA setup/enable -> login with TOTP -> logout -> token rejected), check role boundaries (USER/EDITOR/ADMIN on one route from each `ROLES_*` group), and run the checks above.

### D. Tool results

- PHPStan 2.2.14 (level 2 and level 5, `php/api`, `php/config`, root scripts): 382 `variable.undefined` for `$app` (by design: route files share the global `$app`), 1 real undefined variable (`index.php:250`), 8 docblock table-type notices (by design: `@var <table>`), and cosmetic items (`php/translations.php:320-325` `?? 1` on a void call, `asset_naming.php:56`, `helpers.php:54`, `errors.php:56, 71`, `files.php:573`, `file_categories.php:416`, `generate-api-spec.php:158`).
- Psalm 6.18 taint analysis: no issues.
- gitleaks 8.24.2 over all refs (it reported 360 commits scanned, the ones with text changes) and the working tree: no leaks with default rules, which do not catch the custom JWT fallback (`ANL-12`).
- `php -l`: all files clean on PHP 8.4.21.

### E. Sources

- Angular security advisories: https://github.com/angular/angular/security/advisories
- CVE-2026-50557 / GHSA-f3m7-gqxr-g87x: https://github.com/advisories/GHSA-f3m7-gqxr-g87x
- CVE-2026-54265 / GHSA-58w9-8g37-x9v5: https://github.com/advisories/GHSA-58w9-8g37-x9v5
- CVE-2026-54268 / GHSA-48r7-hpm6-gfxm: https://github.com/advisories/GHSA-48r7-hpm6-gfxm
- Vite CVE-2026-39364 / GHSA-v2wj-q39q-566r: https://github.com/advisories/GHSA-v2wj-q39q-566r
- Vite CVE-2026-53571 / GHSA-fx2h-pf6j-xcff: https://github.com/advisories/GHSA-fx2h-pf6j-xcff
- slim/psr7 releases and advisories: https://packagist.org/packages/slim/psr7
- Repository, PR #1 and Actions: https://github.com/irelevant25/anotoki-genshin-impact
- Production switches (Google sign-in, login): https://anotoki.eu/api/settings/public
- Cloudflare's published IP ranges (for `ANL-38`): https://www.cloudflare.com/ips/
- ESLint v9.21.0 reintroduced `--ext` (why `npm run lint`'s flag is not the problem in `ANL-15`): https://eslint.org/blog/2025/02/eslint-v9.21.0-released/
