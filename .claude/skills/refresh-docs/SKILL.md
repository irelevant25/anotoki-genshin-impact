---
name: refresh-docs
description: >
  Regenerate the generated HTML reports under docs/ — the technical reference,
  the API performance report, or the security review. Use for "update the docs",
  "regenerate the reference/report", "re-run the security scan", "benchmark the
  API again". Each report is generated from the code, and each keeps its history.
---

# Refresh the docs reports

`docs/` holds three self-contained HTML reports, each produced by a generator so
it does not drift from the code. Each generator names its output with the date
(and, for the reports, the minute) so a new run sits beside the old one rather
than overwriting the record. Pick the one you need.

## Reference — how the app fits together

Frontend pages, backend endpoints and database tables, cross-linked. Backend and
DB come from `frontend/api-spec.json`; the frontend map is read from the Angular
sources in `frontend/src/`.

```
cd frontend && npm run api:spec     # only if the backend changed since last spec
node docs/reference/build-docs.mjs  # from repo root; writes docs/reference/reference-<date>-<time>.html
```

## Performance — every GET endpoint timed

Two steps: measure, then render. The report compares the newest run against the
one before it, so keep the run archive (`docs/performance/runs/`) intact.

```
# from backend/, if the dev server is not already up (it needs its config -
# backend/config/*.local.php from setup.php - or it answers not_set_up):
composer start

# from repo root — with a personal token (IAM account page → Tokens for scripts,
# application genshin) of an account that can read admin endpoints. The IAM
# must be reachable to exchange it; the script learns its address from the
# site's own /api/settings/public (dev: http://localhost:4300):
node docs/performance/bench-endpoints.mjs <personal-token> [apiUrl]
node docs/performance/build-report.mjs        # writes docs/performance/api-latency-<date>-<time>.html
```

The bench writes a timestamped run into `docs/performance/runs/`; the builder
turns the two newest runs into the report, with the comparison built in.

Serve the API with the same PHP the runs before used - so far XAMPP's PHP 8.2
without OPcache - on a machine with nothing else busy. Without OPcache about
40 ms of every request is PHP compiling its files, so a different PHP or cache
setting moves every number and the comparison then measures the setup, not the
code (`docs/performance/README.md`, *Reading the numbers*). A run made the wrong
way goes out of `runs/` before the builder is run, or it becomes the baseline.

## Security — Semgrep + Psalm + composer audit + manual findings

The findings are curated in `docs/security/findings.json` (each with severity,
cause, fix and — once resolved — a `status`/`resolution`). The scanners are
installed on demand; re-run them, update `findings.json` to match what they and a
fresh read turn up, then rebuild.

```
# tools (install if missing):
python -m pip install semgrep
cd backend && composer require --dev vimeo/psalm:^5.26

# re-run the scans (from repo root) into docs/security/tools/:
semgrep scan --config=p/php --config=p/security-audit --config=p/secrets \
  --config=p/owasp-top-ten --json --quiet --metrics=off \
  --exclude=vendor --exclude=node_modules backend/ > docs/security/tools/semgrep-php.json
cd backend && php vendor/bin/psalm --taint-analysis \
  --report=../docs/security/tools/psalm-taint.json --no-cache
cd backend && composer audit --format=json > ../docs/security/tools/composer-audit.json
# then take Psalm out again - vendor/ is committed and shipped:
cd backend && composer remove --dev vimeo/psalm

# then edit docs/security/findings.json, and render:
node docs/security/build-report.mjs           # writes docs/security/security-report-<date>-<time>.html
```

See `docs/security/README.md` for the full command set and the reasoning (Psalm
runs in taint mode; it is not kept as a committed dependency — installed on
demand, removed after).

## After any of them

- Open the generated HTML and sanity-check it rendered (charts/tables present,
  both light and dark legible).
- Stage the new report file(s) and any updated inputs (`findings.json`, a new
  `runs/*.json`, `tools/*.json`) by path. Never `git add -A`. Commit only when
  asked.
- Each `docs/<area>/README.md` documents that area's generator in more detail.
