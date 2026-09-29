# docs/security

A point-in-time security review of the API and frontend. Open
`security-report-<date>-<time>.html` in a browser — it carries its own data, so it
needs nothing running.

## What this is

Two scanners and a dependency audit, then a manual read of the code they cover
least well — authentication, authorization, and anything that turns a request
into a filesystem path or a SQL identifier. The automated tools found almost
nothing on the backend, which is a good sign but not a clean bill of health: the
data-access and auth code is procedural PHP, exactly where pattern-matching and
taint tracking lose the trail. The substance of the report is the manual review,
and every finding is labelled with where it came from.

The first review (2026-09-05) found nothing critical and nothing
remotely-exploitable by an anonymous user: one high-severity issue (the JWT
signing key was the committed fallback), two medium (an upload endpoint that
trusted the client's file extension, and missing security headers), and a
handful of low/informational items. Eight areas were attacked on paper and held.

All seven were fixed. The revisit of 2026-09-19 added six more (SEC-08 to
SEC-13), three of them since fixed. The revisit of 2026-09-29 followed the move of
signing in to the anotoki IAM - the registration, code and password findings are
resolved by that code having left this site, for an IAM that carries the fixes
under test - and the rework that made every per-installation value required
config written by `setup.php`; the installer's protections are listed with the
areas that held. `findings.json` carries a `status` and `resolution` per finding,
and the generator renders a resolved finding muted, with its original detail kept
as the record.

Report file names carry the date and the minute they were generated
(`security-report-YYYY-MM-DD-HH-MM.html`), so re-running after another round of
work leaves a new file beside the old one rather than overwriting the history.

## Files

- `security-report-<date>-<time>.html` — the report. Self-contained; open it directly.
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

# Psalm - installed on demand and removed afterwards; it is not kept in
# composer.json, because vendor/ is committed and shipped. Either require it in
# backend/ and `composer remove --dev vimeo/psalm` after, or - leaving the
# committed vendor/ alone entirely - install it into a scratch composer project
# and run that copy's vendor/bin/psalm from backend/ with -c psalm.xml.
cd backend && composer require --dev vimeo/psalm:^5.26
```

Then, from the repository root:

```
# Backend — pattern + security rules
semgrep scan --config=p/php --config=p/security-audit --config=p/secrets \
  --config=p/owasp-top-ten --json --quiet --metrics=off \
  --exclude=vendor --exclude=node_modules backend/ > docs/security/tools/semgrep-php.json

# Frontend
semgrep scan --config=p/javascript --config=p/typescript --config=p/security-audit \
  --config=p/owasp-top-ten --json --quiet --metrics=off \
  --exclude=node_modules --exclude=src/app/api frontend/src > docs/security/tools/semgrep-fe.json

# Psalm taint analysis (config in backend/psalm.xml)
cd backend && php vendor/bin/psalm --taint-analysis \
  --report=../docs/security/tools/psalm-taint.json --no-cache

# Dependency advisories
cd backend && composer audit --format=json > ../docs/security/tools/composer-audit.json
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

The counts on the tool cards are written by hand in `findings.json`, beside the
caveats that explain them. The build compares them with `tools/*.json` and prints
a `check:` line when they disagree, so a re-run scan cannot quietly leave the old
numbers on the page. The headline counts what is still open, not what was found.
`--out <file>` writes somewhere else.

## Reading the severities

**High** is a weakness in the authentication foundation. **Medium** is real but
bounded — usually needs an authenticated account or a particular server
configuration. **Low** and **Info** are hardening and hygiene. A scanner that
finds nothing has told you where it looked, not that there is nothing to find,
which is why the manual review carries the weight. Revisit after any change to
the auth, upload, or query code.
