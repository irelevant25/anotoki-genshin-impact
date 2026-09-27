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
DB come from `angular/api-spec.json`; the frontend map is read from the Angular
sources.

```
cd angular && npm run api:spec      # only if the backend changed since last spec
node docs/reference/build-docs.mjs  # from repo root; writes docs/reference/reference-<date>-<time>.html
```

## Performance — every GET endpoint timed

Two steps: measure, then render. The report compares the newest run against the
one before it, so keep the run archive (`docs/performance/runs/`) intact.

```
# from php/, if the dev server is not already up:
php -S localhost:8000 router.php

# from repo root — sign in as an account that can read admin endpoints:
node docs/performance/bench-endpoints.mjs <email> <password>
node docs/performance/build-report.mjs        # writes docs/performance/api-latency-<date>-<time>.html
```

The bench writes a timestamped run into `docs/performance/runs/`; the builder
turns the two newest runs into the report, with the comparison built in.

## Security — Semgrep + Psalm + composer audit + manual findings

The findings are curated in `docs/security/findings.json` (each with severity,
cause, fix and — once resolved — a `status`/`resolution`). The scanners are
installed on demand; re-run them, update `findings.json` to match what they and a
fresh read turn up, then rebuild.

```
# tools (install if missing):
python -m pip install semgrep
cd php && composer require --dev vimeo/psalm:^5.26

# re-run the scans (from repo root) into docs/security/tools/:
semgrep scan --config=p/php --config=p/security-audit --config=p/secrets \
  --config=p/owasp-top-ten --json --quiet --metrics=off \
  --exclude=vendor --exclude=node_modules php/ > docs/security/tools/semgrep-php.json
cd php && php vendor/bin/psalm --taint-analysis \
  --report=../docs/security/tools/psalm-taint.json --no-cache
cd php && composer audit --format=json > ../docs/security/tools/composer-audit.json

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
