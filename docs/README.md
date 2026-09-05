# docs

## api-latency-report.html

Every GET endpoint in the API, timed. Open the file in a browser — it carries
its own data, so it needs nothing running.

The short version: nothing in the API answers in under about 86 ms, most of that
is opening two PostgreSQL connections per request, and the spread between the
cheapest endpoint and the median one is narrower than what either spends before
running a query. The handful that are genuinely slow, and the routes that cannot
succeed at all, are named in the report.

### Regenerating it

```
php -S localhost:8000 router.php          # from php/, if it is not already up
node docs/bench-endpoints.mjs <email> <password>
```

Sign in as an account that can read the admin endpoints — roughly a third of the
API is behind a role, and those routes are reported as 401s otherwise. The script
writes `api-latency-timings.json` beside itself.

The report embeds its own snapshot of that JSON rather than fetching it, so a new
measurement is only in the page once the `<script id="data">` block near the
bottom is replaced with the new file's contents.

### Reading the numbers

They come from a development server on a workstation, against a database on the
same machine. The *shape* travels — the floor dominating, connections dominating
the floor, four endpoints returning most of the bytes. The absolute values do
not; production has different hardware, a different PHP setup, and a network in
between.
