# docs

Latency reports for the API. Each one is a single HTML file that carries its own
measurements — open it in a browser, it needs nothing running.

| Report | Covers |
| --- | --- |
| `api-latency-report.html` | The first survey. Written by hand; the state of things before any of it was fixed. |
| `api-latency-<date>.html` | Generated. The newest run, and what changed since the run before it. |

## Making a new one

```
php -S localhost:8000 router.php          # from php/, if it is not already up
node docs/performance/bench-endpoints.mjs <email> <password>
node docs/performance/build-report.mjs
```

Sign in as an account that can read the admin endpoints — roughly a third of the
API is behind a role, and those routes are reported as 401s otherwise.

The first command times every GET route and writes the numbers to
`docs/performance/runs/<timestamp>.json`. Nothing is overwritten: every run is kept, because
a report is only worth reading next to the one before it.

The second turns the two newest runs into `docs/performance/api-latency-<date>.html` — the
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

## Files

- `bench-endpoints.mjs` — times every GET route, writes a run into `runs/`.
- `build-report.mjs` — turns the two newest runs into a report.
- `report/report.css`, `report/report.js` — the design and the drawing code,
  inlined into each generated report so the output stays self-contained.
- `runs/` — every measurement ever taken, oldest first by name.
