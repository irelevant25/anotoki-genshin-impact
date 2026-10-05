---
name: sync-api-client
description: >
  Regenerate the Angular API client after a backend change. Use whenever a Slim
  route, its responds() shape, a DbModel, or a migration that affects a response
  has changed — or when the frontend is missing/using-wrong an endpoint's method,
  types, or return shape. Covers the php→spec→client pipeline and the
  api-config.mjs overrides.
---

# Sync the API client with the backend

The Angular client under `frontend/src/app/api/` is **generated from the backend**,
never hand-written. The backend's route table, `responds()` shapes and migrations
are read into `frontend/api-spec.json`; the typed services, models and types are
generated from that spec. Editing `src/app/api/**` by hand is wrong — it is
overwritten on the next run.

## When to run this

- After adding/changing/removing a Slim route.
- After changing an endpoint's `responds(...)` shape, a `ResponseShape`, or a
  `DbModel` whose fields appear in a response.
- After a migration that changes a table used by `responds('table', ...)`
  (the shape is introspected from the replayed migrations).
- When a frontend service method is missing, misnamed, or has the wrong
  parameter/return type.

## Do it

From `frontend/`:

```
npm run api
```

That runs three steps in order:
1. `npm run api:spec` → `php ../backend/generate-api-spec.php`, rewriting
   `frontend/api-spec.json` from the live route table (no database or config
   needed; source paths in it are repo-relative).
2. `npm run api:client` → `node generate-api.mjs`, rewriting `src/app/api/`
   (services, models, types) from the spec.
3. `npm run api:docs` → `node generate-openapi.mjs`, rewriting
   `backend/api/openapi.json`.

Run the steps individually with `npm run api:spec`, `npm run api:client`,
`npm run api:docs` when you only need one (e.g. re-running `api:client` after an
`api-config.mjs` edit).

## When the generator gets a name or type wrong

Do not fix it in the generated file. The mechanical rules live in
`frontend/api-config.mjs`; correct it there and re-run `npm run api:client`:

- **`NAMES`** — override a generated method name (collisions, or a name the
  mechanical rule gets wrong). Keyed by `"METHOD /path"`.
- **`QUERIES`** — declare the query-parameter type for an endpoint (a `?` suffix
  means the params argument is optional). Keyed by `"METHOD /path"`.
- **`BODIES`** — declare the request-body type where the PHP model does not
  describe it; the value `"FormData"` marks a multipart (upload) endpoint. Keyed
  by `"METHOD /path"`.
- **`RESPONSES`** — override the response type where the spec cannot express it.
- **`BLOBS`** — endpoints that return a file rather than JSON.
- **`GROUPS`** / **`GROUP_DOCS`** — which service a route belongs to (first prefix that matches;
  anything unmatched lands in the `lookup` service), and the doc comment for each group. A
  new area of routes (e.g. `/api/visitor`) gets its own line above `lookup`.

## Owner routes take a context

A route behind `requireOwner(...)` (a player's own games and statistics: the signed-in
person, or this browser's visitor) or `requireVisitorKey()` (the move at sign-in) is marked
`owner` / `visitor_key` in the spec (`readHandler()` in `backend/generate-api-spec.php`), and
`auth` stays true for it (a 401 is possible). Its generated method gains a trailing
`context?: HttpContext`, passed as `{ context }`: the caller says whom the request is issued
as, and the interceptor reads that - never whether a token happens to be there. The OpenAPI
document gives such a route `bearerAuth` or `visitorKey` (or nothing: nobody reads nothing),
and the reference docs label it "a signed-in user or this browser's visitor"
(`docs/reference/build-docs.mjs`).

If a response shape is genuinely new (a page wrapper, a join, a computed answer),
the right fix is usually a new `ResponseShape` on the **backend** in
`backend/api/routes/*/responses/`, then re-run the full `npm run api`.

## Verify

- The change you expected is in `frontend/src/app/api/` — the new/renamed method
  in the right `*.service.ts`, the type in `models/` or `types/`.
- `npx tsc --noEmit -p tsconfig.json` passes (a wrong type surfaces here).
- Check `git diff --stat frontend/src/app/api frontend/api-spec.json` — the
  changes should be additive/expected, not a surprise churn. `api-spec.json`
  changing is normal; a giant unrelated diff means something else moved.

## Stage

Stage the regenerated files together with the backend change that caused them:
`frontend/api-spec.json`, the touched files under `frontend/src/app/api/`, and
`frontend/api-config.mjs` if you edited it. Never `git add -A`. Do not commit
unless asked.
