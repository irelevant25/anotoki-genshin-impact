# docs/reference

The technical reference — one self-contained HTML page describing how the app
fits together. Open `reference-<date>-<time>.html` in a browser; it needs
nothing running.

## What it is

Three tabs, cross-linked:

- **Frontend** — every page under the Main and Admin sites, grouped by section,
  each listing the API endpoints it calls. Click an endpoint to jump to its
  backend entry.
- **Backend** — every endpoint, grouped by the file that defines it, with who
  may call it, what it takes and returns, and the tables it touches. Click a
  table to jump to its model.
- **Database** — every table, its columns, and every endpoint that reads or
  writes it. Click an endpoint to jump back to the backend.

So the thread the reference is built for — *Main → Database → Characters → the
endpoints it calls → the tables those touch → everything else that uses them* —
is a few clicks, in either direction. The search box filters within the current
tab.

## Where the content comes from

Almost none of it is written by hand, which is the point — a hand-kept document
drifts from the code; this cannot.

- **Backend and Database** come from `angular/api-spec.json`, which the API
  generates from its own route table, response shapes and migrations. Exact.
- **Frontend** is read from the Angular sources: the page tree from the folder
  layout under `sites/main/features` and `sites/admin`, and the endpoints each
  page uses from the API-service methods it calls. This part is heuristic — a
  page that reaches the API an unusual way (through a shared service, say) may
  under-report — so treat the frontend map as a strong guide, not a contract.

## Regenerating

The spec must be current first, then build the page:

```
php php/generate-api-spec.php     # refresh angular/api-spec.json from the API
node angular/generate-api.mjs     # (only needed if the client is stale)
node docs/reference/build-docs.mjs
```

The output name carries the date and minute
(`reference-YYYY-MM-DD-HH-MM.html`), so regenerating leaves a new file beside
the old rather than overwriting it.

## Files

- `build-docs.mjs` — reads the spec and the Angular sources, writes the page.
- `reference.css`, `reference.js` — the design and the tab/filter/cross-link
  behaviour, inlined into the output so it stays self-contained.
