// Turns the two most recent benchmark runs into a report you can open.
//
//   node docs/build-report.mjs [--out <file>]
//
// The runs come from docs/runs/, written by bench-endpoints.mjs. The newest is
// the report; the one before it is what the report compares against. That is
// the whole reason runs are archived rather than overwritten - a number on its
// own says very little, and "68 ms faster than last week" says a great deal.
//
// The page is self-contained: the CSS, the drawing code and the measurements
// are all inlined into it, so it opens from disk with nothing running.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';

const local = (relative) => new URL(relative, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const RUNS = local('./runs/');

const outArg = process.argv.indexOf('--out');
const runs = readdirSync(RUNS)
  .filter((name) => name.endsWith('.json'))
  .sort();

if (!runs.length) {
  console.error('no runs in docs/runs - run bench-endpoints.mjs first');
  process.exit(1);
}

const read = (name) => JSON.parse(readFileSync(RUNS + name, 'utf8'));
const current = read(runs[runs.length - 1]);
const previous = runs.length > 1 ? read(runs[runs.length - 2]) : null;

// ── The shape the page draws from ────────────────────────────────────────────
// Short keys because this is embedded in the HTML and read by machine, not by
// a person: p path, f source file, m median, lo min, hi p95, b bytes, s status,
// h does filesystem work, a needs a token.
const compact = (run) => ({
  generated: run.generated_at,
  floor: round(run.floor),
  samples: run.samples,
  totals: run.totals,
  endpoints: run.results
    .filter((r) => !r.skipped)
    .map((r) => ({
      p: r.path,
      f: r.file,
      m: round(r.median),
      lo: round(r.min),
      hi: round(r.p95),
      b: r.bytes,
      s: r.status,
      h: !!r.heavy,
      a: !!r.auth,
    })),
  skipped: run.results.filter((r) => r.skipped).map((r) => ({ p: r.path, f: r.file, why: r.skipped })),
});

function round(n) {
  return Math.round(n * 10) / 10;
}

const data = compact(current);
if (previous) {
  const before = compact(previous);
  // Only what a comparison needs. The previous run's own report already holds
  // the rest of it, and duplicating all of it here would double the page.
  data.previous = {
    generated: before.generated,
    floor: before.floor,
    endpoints: before.endpoints.map((e) => ({ p: e.p, m: e.m, b: e.b, s: e.s, h: e.h })),
    file: runs[runs.length - 2],
  };
}

// ── The parts of the prose that are facts ────────────────────────────────────
const ordinary = data.endpoints.filter((e) => !e.h);
const medians = ordinary.map((e) => e.m).sort((a, b) => a - b);
const median = medians[Math.floor(medians.length / 2)];
const slowest = [...ordinary].sort((a, b) => b.m - a.m)[0];
const failing = data.endpoints.filter((e) => e.s >= 500);
const bytes = data.endpoints.reduce((sum, e) => sum + e.b, 0);

const ms = (n) => (n >= 1000 ? (n / 1000).toFixed(2) + ' s' : Math.round(n) + ' ms');
const size = (b) => (b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : b >= 1024 ? Math.round(b / 1024) + ' KB' : b + ' B');

// The headline is the one number a reader should leave with. Which number that
// is depends on the run: a floor that moved is the story when it moved, and the
// slowest endpoint is the story when nothing else did.
const floorMoved = data.previous && Math.abs(data.floor - data.previous.floor) > Math.max(5, data.previous.floor * 0.1);
const headline = floorMoved
  ? `The floor moved from ${ms(data.previous.floor)} to ${ms(data.floor)}`
  : `The cheapest thing this API can do takes ${ms(data.floor)}`;

const standfirst = floorMoved
  ? `Every GET route timed against the running API. The number underneath them all is the one worth knowing, and it changed:
     nothing here answers in under ${ms(data.floor)}, against ${ms(data.previous.floor)} in the run before. The median endpoint
     is ${ms(median)}, and the slowest that is not surveying the filesystem is <code>${slowest.p}</code> at ${ms(slowest.m)}.`
  : `Every GET route timed against the running API. Nothing here answers in under ${ms(data.floor)}, and most of that is spent
     before the endpoint does any work of its own. The median endpoint is ${ms(median)}, and the slowest that is not surveying
     the filesystem is <code>${slowest.p}</code> at ${ms(slowest.m)}.`;

const date = new Date(data.generated);
const stamp = date.toISOString().slice(0, 10);

// ── The page ─────────────────────────────────────────────────────────────────
const css = readFileSync(local('./report/report.css'), 'utf8');
const js = readFileSync(local('./report/report.js'), 'utf8');

const comparison = data.previous
  ? `
  <section id="since">
    <h2>What changed since <span id="since-when">the last run</span></h2>
    <p class="lede">
      Measured the same way, on the same machine, against the same database. Anything that moved by less than
      12&nbsp;% or 8&nbsp;ms is treated as noise and left out — two runs on a workstation differ by that much for
      reasons that have nothing to do with the code. Endpoints marked <span class="pill pill-warn">fs</span> survey
      the filesystem and are timed once with no warm-up, so what moved there is usually the state of the disk and
      the caches rather than the code.
    </p>

    <div class="verdict">
      <div class="figure" id="since-floor"><div class="figure-value">—</div><div class="figure-label">—</div></div>
      <div class="figure" id="since-median"><div class="figure-value">—</div><div class="figure-label">—</div></div>
      <div class="figure" id="since-bytes"><div class="figure-value">—</div><div class="figure-label">—</div></div>
      <div class="figure" id="since-count"><div class="figure-value">—</div><div class="figure-label">—</div></div>
    </div>

    <h3>What moved most</h3>
    <div class="panel movers" id="movers"></div>

    <h3>What appeared, went, or changed its answer</h3>
    <div class="panel ledger" id="ledger"></div>
  </section>`
  : '';

const page = `<title>API Latency Readout — ${stamp}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap">

<style>
${css}</style>

<div class="wrap">
  <header class="masthead">
    <div class="eyebrow">anotoki · genshin_impact api · ${stamp}</div>
    <h1>${headline}</h1>
    <p class="standfirst">${standfirst}</p>
    <div class="runline">
      <span id="run-when">measured —</span>
      <span id="run-count">—</span>
      <span id="run-samples">—</span>
    </div>
  </header>

  <div class="verdict">
    <div class="figure">
      <div class="figure-value"><span id="fig-floor">—</span><span class="unit"> ms</span></div>
      <div class="figure-label">The cheapest endpoint in the API</div>
    </div>
    <div class="figure">
      <div class="figure-value"><span id="fig-median">—</span><span class="unit"> ms</span></div>
      <div class="figure-label">The median one, across <span id="fig-n">—</span> ordinary reads</div>
    </div>
    <div class="figure">
      <div class="figure-value"><span id="fig-share">—</span><span class="unit"> %</span></div>
      <div class="figure-label">Land within twice the cheapest — the spread is the framework</div>
    </div>
    <div class="figure">
      <div class="figure-value"><span id="fig-slow">—</span></div>
      <div class="figure-label">Take more than twice the cheapest, and are worth a look</div>
    </div>
  </div>
${comparison}
  <section>
    <h2>What the spread actually looks like</h2>
    <p class="lede">
      Median response time per endpoint, excluding the ones that survey the filesystem. The shape is the argument:
      almost everything piles up in a narrow band, and a thin tail does real work.
    </p>
    <div class="panel">
      <div class="hist" id="hist"></div>
    </div>
  </section>

  <section>
    <h2>The ones that are actually slow</h2>
    <p class="lede">
      Grey is the ${ms(data.floor)} every one of them pays before starting. Colour is what the endpoint itself adds —
      the part worth looking at.
    </p>
    <div class="panel ranked" id="ranked"></div>
  </section>

  <section>
    <h2>Slowness is not payload</h2>
    <p class="lede">
      Response size against response time. If big answers were the problem the points would form a line. Where they do
      not, the cost is in the work rather than the bytes.
    </p>
    <div class="panel">
      <div class="chartbox"><canvas id="scatter"></canvas></div>
    </div>
  </section>

  <section>
    <h2>Every endpoint measured</h2>
    <p class="lede">
      Sorted slowest first. <strong>Own cost</strong> is the median with the ${ms(data.floor)} floor subtracted — what the
      endpoint adds on top of what every request pays. <strong>Δ</strong> is against the previous run.
    </p>
    <div class="tools">
      <input type="search" id="filter" placeholder="Filter by path or file…" aria-label="Filter endpoints">
      <button type="button" class="chip" id="chip-slow" aria-pressed="false">Above the cheapest</button>
      <button type="button" class="chip" id="chip-fail" aria-pressed="false">Not 200</button>
      <button type="button" class="chip" id="chip-heavy" aria-pressed="false">Filesystem work</button>
    </div>
    <div class="tablewrap">
      <table>
        <thead>
          <tr>
            <th data-sort="p">Path</th>
            <th data-sort="m" class="num">Median</th>
            <th data-sort="own" class="num">Own cost</th>
            <th data-sort="delta" class="num">Δ</th>
            <th data-sort="hi" class="num">p95</th>
            <th data-sort="b" class="num">Payload</th>
            <th data-sort="s">Status</th>
            <th data-sort="f">Source</th>
          </tr>
        </thead>
        <tbody id="rows"></tbody>
      </table>
    </div>
    <p id="rowcount" style="margin-top: 10px; color: var(--muted); font-size: 13px"></p>
  </section>

  <section>
    <h2>How this was measured</h2>
    <div class="panel">
      <p style="margin: 0 0 12px">
        Every GET route in <code>angular/api-spec.json</code>, called against a development server on this workstation
        with a database on the same machine. Two warm-up requests, then ${data.samples} timed ones; the number quoted is
        the median. Path arguments are filled from the collection the route belongs to, so an id used in a request is an
        id that exists — otherwise half the sample would be a 404 being timed.
      </p>
      <p style="margin: 0 0 12px">
        Routes that survey the filesystem are timed once rather than sampled and marked <span class="pill pill-warn">fs</span>;
        they are doing work rather than answering a question, and averaging them in would misrepresent the rest.
        Writes are not timed at all: that would mean creating and destroying an entity per sample, which measures the
        fixture rather than the endpoint.
      </p>
      <p style="margin: 0; color: var(--muted); font-size: 13.5px">
        <span id="method-skipped"></span>
        The absolute values do not travel — production has different hardware, a different PHP setup, and a network in
        between. The shape does: what dominates, what is an outlier, and which direction things moved between runs.
        This run answered ${size(bytes)} in total across ${data.endpoints.length} endpoints${failing.length ? `, with ${failing.length} still failing` : ', with none failing'}.
      </p>
    </div>
  </section>
</div>

<script id="data" type="application/json">${JSON.stringify(data)}</script>
<script>
${js}</script>
`;

const out = outArg !== -1 ? process.argv[outArg + 1] : local(`./api-latency-${stamp}.html`);
mkdirSync(local('./'), { recursive: true });
writeFileSync(out, page);

console.log(`report written to ${out}`);
console.log(`  run      ${runs[runs.length - 1]}`);
console.log(`  compared ${previous ? runs[runs.length - 2] : '(nothing earlier to compare against)'}`);
console.log(`  floor    ${ms(data.floor).replace(' ', ' ')}${data.previous ? `  (was ${ms(data.previous.floor).replace(' ', ' ')})` : ''}`);
console.log(`  median   ${ms(median).replace(' ', ' ')}`);
