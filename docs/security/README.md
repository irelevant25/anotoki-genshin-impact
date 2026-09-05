# docs/security

A point-in-time security review of the API and frontend. Open
`security-report-<date>.html` in a browser — it carries its own data, so it
needs nothing running.

## What this is

Two scanners and a dependency audit, then a manual read of the code they cover
least well — authentication, authorization, and anything that turns a request
into a filesystem path or a SQL identifier. The automated tools found almost
nothing on the backend, which is a good sign but not a clean bill of health: the
data-access and auth code is procedural PHP, exactly where pattern-matching and
taint tracking lose the trail. The substance of the report is the manual review,
and every finding is labelled with where it came from.

The headline result of the first review (2026-09-05): nothing critical, nothing
remotely-exploitable by an anonymous user. One high-severity issue (the JWT
signing key is the committed fallback), two medium (an upload endpoint that
trusts the client's file extension, and missing security headers), and a handful
of low/informational items. Eight areas were attacked on paper and held.

## Files

- `security-report-<date>.html` — the report. Self-contained; open it directly.
- `findings.json` — the findings themselves: severity, location, what, why, fix.
  This is the source of truth; the HTML is a view of it.
- `report.css`, `report.js` — the report's design and its severity filter,
  inlined into the HTML at build time so the output stays self-contained.
- `build-report.mjs` — turns `findings.json` plus the tool output into the HTML.
- `tools/` — the raw scanner output the review was built on: `semgrep-php.json`,
  `semgrep-fe.json`, `psalm-taint.json`, `composer-audit.json`.

## Re-running it

The tools install through PHP's and Python's own package managers, as suggested:

```
# Semgrep (Python)
python -m pip install semgrep

# Psalm (Composer dev dependency; already in composer.json)
cd php && composer install
```

Then, from the repository root:

```
# Backend — pattern + security rules
semgrep scan --config=p/php --config=p/security-audit --config=p/secrets \
  --config=p/owasp-top-ten --json --quiet --metrics=off \
  --exclude=vendor --exclude=node_modules php/ > docs/security/tools/semgrep-php.json

# Frontend
semgrep scan --config=p/javascript --config=p/typescript --config=p/security-audit \
  --config=p/owasp-top-ten --json --quiet --metrics=off \
  --exclude=node_modules --exclude=src/app/api angular/src > docs/security/tools/semgrep-fe.json

# Psalm taint analysis (config in php/psalm.xml)
cd php && php vendor/bin/psalm --taint-analysis \
  --report=../docs/security/tools/psalm-taint.json --no-cache

# Dependency advisories
cd php && composer audit --format=json > ../docs/security/tools/composer-audit.json
```

Psalm runs in `--taint-analysis` mode deliberately: `psalm.xml` sits at
`errorLevel="8"` (the most permissive) so the security signal is not buried
under type notes about procedural code. Note the tool versions this review used —
Semgrep 1.176.1, Psalm 5.26.1 — and that Psalm 6 needs PHP ≥ 8.2.27.

Then edit `findings.json` — add, remove, or re-rank findings based on what the
tools and a fresh read turn up — and rebuild:

```
node docs/security/build-report.mjs
```

## Reading the severities

**High** is a weakness in the authentication foundation. **Medium** is real but
bounded — usually needs an authenticated account or a particular server
configuration. **Low** and **Info** are hardening and hygiene. A scanner that
finds nothing has told you where it looked, not that there is nothing to find,
which is why the manual review carries the weight. Revisit after any change to
the auth, upload, or query code.
