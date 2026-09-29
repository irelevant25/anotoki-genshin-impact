# docs/performance

Latency reports for the API. Each one is a single HTML file that carries its own
measurements — open it in a browser, it needs nothing running.

| Report | Covers |
| --- | --- |
| `api-latency-report.html` | The first survey. Written by hand; the state of things before any of it was fixed. |
| `api-latency-<date>-<time>.html` | Generated. The newest run, and what changed since the run before it. |

## Making a new one

```
php -S localhost:8000 router.php          # from backend/, if it is not already up
node docs/performance/bench-endpoints.mjs <personal-token>
node docs/performance/build-report.mjs
```

The personal token is made on the anotoki IAM's account page (Tokens for
scripts, application genshin) by an account that can read the admin endpoints —
roughly a third of the API is behind a role, and those routes are reported as
401s otherwise. The bench exchanges it at the IAM for access tokens as it goes,
so the IAM must be reachable (in development: its servers on 4300 and 8100).

Path arguments are filled from the collection a route belongs to, and the few
routes that answer 404 until they are told what to look at (`/api/files`,
`/api/files/raw`, `/api/migrations/file`) are given a query naming something
real, so what is timed is the work rather than the refusal. A route with nothing
to fill it from is listed as skipped, with the reason.

The first command times every GET route and writes the numbers to
`docs/performance/runs/<timestamp>.json`. Nothing is overwritten: every run is kept, because
a report is only worth reading next to the one before it.

The second turns the two newest runs into `docs/performance/api-latency-<date>-<time>.html` — the
newest is the report, the one before it is what the report compares against.
That comparison is not optional and not something to remember to do: it is how
the generator works, so every report from here on has one.

`--out <file>` writes somewhere else. With only one run in the archive, the
comparison section removes itself rather than showing empty deltas.

## What the comparison says

Four figures at the top: how the floor moved, how the median endpoint moved, how
much the whole API's payload changed, and how many endpoints got measurably
faster or slower. Then the twelve that moved most, each as a before-and-after
bar. Then a ledger of what appeared, what went, and what changed its answer —
a route that was returning 500 and is now gone shows up there.

Anything that moved by less than 12 % or 8 ms is treated as noise and left out.
Two runs on the same workstation differ by that much for reasons that have
nothing to do with the code, and a report that reports those is a report nobody
trusts. Endpoints marked `fs` survey the filesystem, are timed once with no
warm-up, and move with the state of the disk and the caches rather than the
code — the comparison marks them so they are not read as regressions.

## Reading the numbers

They come from a development server on a workstation, against a database on the
same machine. The absolute values do not travel: production has different
hardware, a different PHP setup, and a network in between. What travels is the
shape — what dominates, what is an outlier, and which direction things moved
between two runs measured the same way.

The development server runs PHP without OPcache, so every request compiles the
API's files before it does anything. On the workstation the runs so far come
from, that is about 40 ms of the floor: the same copy answered `/api/elements`
in about 25 ms with OPcache on and 68 ms without. The floor therefore grows with
the amount of code as well as with what a request does. The 53 → 69 ms between
the 2026-09-05 and 2026-09-29 runs is mostly that (the IAM sign-in code and the
config modules arrived in between); verifying the IAM's bearer token itself
costs 0.5–3 ms. Production runs with OPcache and does not pay it.

So compare only runs made the same way. Every run so far used XAMPP's PHP 8.2
without OPcache (`php -S localhost:8000 router.php` with that `php.exe`), on a
machine with nothing else busy. Test suites running at the same time add a few
per cent to everything.

The account behind the personal token matters for the routes that read one
person's data. The 2026-09-29 run used a test account with no quiz data, so the
two per-person quiz routes answer 404 there; they are not broken.

## Files

- `bench-endpoints.mjs` — times every GET route, writes a run into `runs/`.
- `build-report.mjs` — turns the two newest runs into a report.
- `report/report.css`, `report/report.js` — the design and the drawing code,
  inlined into each generated report so the output stays self-contained.
- `runs/` — every measurement ever taken, oldest first by name.
