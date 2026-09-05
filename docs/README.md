# docs

Generated, self-contained HTML reports about this project. Each opens in a
browser with nothing running, and each has a script that regenerates it from the
code so it does not drift.

| Folder | What it holds | Regenerate |
| --- | --- | --- |
| [`reference/`](reference/) | How the app fits together — frontend pages, backend endpoints, and database tables, cross-linked. | `node docs/reference/build-docs.mjs` |
| [`performance/`](performance/) | Every GET endpoint timed, newest report comparing itself to the one before. | `node docs/performance/bench-endpoints.mjs <email> <pass>` then `node docs/performance/build-report.mjs` |
| [`security/`](security/) | A security review — Semgrep, Psalm and a manual read — with each finding's severity, cause and fix. | `node docs/security/build-report.mjs` (after re-running the tools) |

Each folder has its own README with the details. The pattern is the same
throughout: the data is the source of truth, a small generator renders it, and
the output file name carries the date (and, for the reports, the minute) so a
new run sits beside the old rather than overwriting the record.
