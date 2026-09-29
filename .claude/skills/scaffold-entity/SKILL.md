---
name: scaffold-entity
description: >
  Add a new resource end-to-end — database table, backend model + endpoints,
  regenerated API client, and admin CRUD page (and a public database page if it
  is player-facing). Use for "add a new entity/table with CRUD", "scaffold X",
  "create the admin screen and API for X", "new database section". Ties together
  the db-migration and sync-api-client skills.
---

# Scaffold a new resource, end to end

This is a checklist, not a script — each step is real work in the house style.
Read `CLAUDE.md` first. Before starting, decide two things:

- **Which database?** `genshin_impact` (game content) or `users` (translations,
  settings, page switches, this site's record of each person).
  Most new resources are content.
- **Shape?** A **plain entity** (one table, flat CRUD — like `artifacts`), a
  **parent-with-children** resource (a header row plus related rows edited
  together — like `weapons`/`materials`, served by `registerFullResource`), or a
  **lookup table** (name + a few columns — like `regions`, rendered by the shared
  admin `lookup-table`). The rest of the steps branch on this. A handful of fixed
  values nobody edits is none of these: it is a `CHECK` on the column that uses
  them (see the **db-migration** skill) — `voice_over_types` was a table for two
  words until migration 025.

Pick the closest existing resource and use it as the exemplar throughout —
`artifacts` (plain), `weapons` (parent+children), `regions` (lookup).

## 1. Migration (→ db-migration skill)

Create `backend/migrations/<db>/NNN_<name>.sql` for the table(s), in the house style
(soft delete, stamps, partial unique indexes, asset columns as FKs into `files`).
Apply with `php migration.php`. Full detail is in the **db-migration** skill.

## 2. Backend model

`backend/api/routes/<db>/models/<name>.php`: a `class X extends DbModel` whose
constructor parameters are the table's editable columns. Override `jsonFields()`
if any column holds JSON. Copy `models/artifact.php` and adjust. The constructor
param list IS the mass-assignment whitelist — only columns listed here can be
written from a request body.

## 3. Response shape (only if needed)

If the endpoint returns exactly the table, skip this — `responds('<table>',
list: ...)` introspects the shape from the migrations. Add a `ResponseShape`
subclass in `backend/api/routes/<db>/responses/` only for a custom answer (a page
wrapper, a join, computed fields). Follow `responses/content.php`.

## 4. Backend endpoints

`backend/api/routes/<db>/endpoints/<name>.php` with GET list, GET single, POST, PUT,
DELETE. Copy the exemplar and keep the conventions (see the **backend-engineer**
agent for the rules): `DbQuery` for reads, `DbQuery::insert/update` with
`X::fromBody`/`partialToDbArray` for writes, `resolveAssetBody` if it has asset
columns, and the middleware chain
`->add(responds(...))->add(validateRequest(X::class[, true]))
->add(requireRole(...ROLES_CONTENT))->add(requireAuth())`. Reads are usually
public (no auth middleware); writes are `ROLES_CONTENT`.

For a **parent-with-children** resource, use `registerFullResource()` instead of
hand-writing the routes (copy `endpoints/artifacts_full.php`), and declare its
shape metadata in `fullResourceShapes()`.

Then register the file with a `require_once` in `backend/api/index.php`, in the
matching section. If the entity has asset columns, add them to
`backend/api/asset_columns.php`, and give the admin an upload target for each in
`_uploadTargets()` (`backend/api/asset_naming.php`: folder and file naming).

## 5. Regenerate the client (→ sync-api-client skill)

`cd frontend && npm run api`. Add any `QUERIES`/`NAMES`/`RESPONSES` overrides in
`frontend/api-config.mjs` and re-run `npm run api:client` if a method name/type
is off. Full detail in the **sync-api-client** skill. Confirm the new
`X…ApiService` methods and DTO types exist and `npx tsc --noEmit` passes.

## 6. Admin UI

**Lookup table** (name + a few columns): add an entry to `LOOKUP_PAGES` in
`frontend/src/app/sites/admin/pages/pages.ts`, route it with `lookupRoute('path')`
in `admin.routes.ts`, and let the shared `lookup-table` component render it — no
bespoke components. Add the nav entry.

**Full CRUD entity**: create
`sites/admin/<name>/<name>-list/<name>-list.component.ts` (+ `.html`, `.scss` -
every component is three files) and `<name>-form/<name>-form.component.ts` (+ its
`.html` and `.scss`), copying the `artifacts` pair. Then:
- register the routes in `sites/admin/admin.routes.ts`,
- add a nav entry in `sites/admin/app.component.ts` (right section, correct
  role/`readOnly` flag).
Follow the **frontend-engineer** conventions (signals, local-lib bases, generated
services, both themes, `translate` pipe, `AppDatePipe`). Upload assets through the
existing image/audio flow.

## 7. Public database page (only if player-facing)

If players should browse it, add `sites/main/features/database/<name>/` (list +
`detail/`), copying the `characters` database page, and wire its route in the
main routing.

## 8. Verify

- Backend: `php -l` the new files; run the dev server and `curl` the routes for
  real status/body, including failure paths (401/403/404/409/422).
- Frontend: `npx tsc --noEmit`, then a dev-mode build for templates; open the
  admin page and exercise create/edit/delete against the running API; check both
  themes.
- The writes need an IAM token with the `genshin` ADMIN or EDITOR role, which
  you do not have: never create an IAM account or reset a password to get one.
  Exercise the public routes yourself, and hand the signed-in checks to the
  maintainer (or use a personal token they give for this task, through the
  environment only). Stop the servers.

## 9. Stage

Stage every file you touched, by path — migration, model, endpoint, `index.php`,
`asset_columns.php`, `api-spec.json`, the regenerated `src/app/api/**`,
`api-config.mjs`, and the Angular pages. Never `git add -A`; leave
`formats-converters/`, `local/`, `old/` and the maintainer's own edits alone.
Commit only when asked.
