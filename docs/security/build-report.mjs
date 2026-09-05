// Turns findings.json and the raw tool output into one HTML report you can open.
//
//   node docs/security/build-report.mjs
//
// The report is self-contained: the findings, the tool summaries, the styles
// and the interactions are all inlined, so it opens from disk with nothing
// running. This mirrors docs/performance — the data is the source of truth and
// the page is a view of it, so a re-review means editing findings.json and
// running this again.
//
// Findings come from a curated file rather than straight from the scanners on
// purpose. Semgrep and Psalm found almost nothing here; the substance is a
// manual read of the auth, authorization and path-handling code, which is
// exactly what those tools are weakest at. The page keeps the two clearly
// apart: every finding is labelled with where it came from, and the tool runs
// are reported with their own counts and caveats so the automated coverage is
// legible on its own terms.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';

const local = (relative) => new URL(relative, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

const data = JSON.parse(readFileSync(local('./findings.json'), 'utf8'));

// Raw tool outputs, read only for their headline counts. Missing files are not
// fatal — the report says "not run" rather than refusing to build.
const readTool = (name) => {
  try {
    return JSON.parse(readFileSync(local('./tools/' + name), 'utf8'));
  } catch {
    return null;
  }
};
const semgrepPhp = readTool('semgrep-php.json');
const semgrepFe = readTool('semgrep-fe.json');

const SEV = {
  critical: { label: 'Critical', rank: 0 },
  high: { label: 'High', rank: 1 },
  medium: { label: 'Medium', rank: 2 },
  low: { label: 'Low', rank: 3 },
  info: { label: 'Info', rank: 4 },
};

const esc = (s) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const findings = [...data.findings].sort((a, b) => SEV[a.severity].rank - SEV[b.severity].rank);
const counts = Object.fromEntries(Object.keys(SEV).map((k) => [k, findings.filter((f) => f.severity === k).length]));
const worst = findings.length ? findings[0].severity : 'info';

const stamp = data.reviewed_at;

// The headline states the most severe thing found, so the reader knows the
// verdict before the detail. "Nothing above Low" is a real and good headline.
const headline =
  counts.critical
    ? `${counts.critical} critical issue${counts.critical > 1 ? 's' : ''} to fix before anything else`
    : counts.high
      ? `${counts.high} high-severity issue${counts.high > 1 ? 's' : ''}, led by the JWT signing key`
      : counts.medium
        ? `Nothing critical — ${counts.medium} medium issue${counts.medium > 1 ? 's' : ''} worth scheduling`
        : 'Nothing above low severity';

const toolLine = (t) =>
  `<div class="tool">
     <div class="tool-head"><span class="tool-name">${esc(t.name)}</span><span class="tool-ver">${esc(t.version)}</span></div>
     <p class="tool-what">${esc(t.what)}</p>
     <dl class="tool-nums">
       ${t.backend ? `<div><dt>Backend</dt><dd>${esc(t.backend)}</dd></div>` : ''}
       ${t.frontend ? `<div><dt>Frontend</dt><dd>${esc(t.frontend)}</dd></div>` : ''}
     </dl>
     ${t.note ? `<p class="tool-note">${esc(t.note)}</p>` : ''}
   </div>`;

const findingCard = (f) => `
  <article class="finding sev-${f.severity}" data-sev="${f.severity}" id="${esc(f.id)}">
    <header class="finding-top">
      <span class="sev-badge sev-${f.severity}">${SEV[f.severity].label}</span>
      <div class="finding-title">
        <h3>${esc(f.title)}</h3>
        <div class="finding-meta">
          <span class="fid">${esc(f.id)}</span>
          <span class="dot">·</span><span>${esc(f.category)}</span>
          <span class="dot">·</span><span class="src src-${esc(f.source)}">${f.source === 'manual' ? 'manual review' : esc(f.source)}</span>
          ${f.cwe ? `<span class="dot">·</span><span class="cwe">${esc(f.cwe)}</span>` : ''}
          ${f.effort ? `<span class="dot">·</span><span class="effort">fix effort: ${esc(f.effort)}</span>` : ''}
        </div>
      </div>
    </header>
    <div class="finding-body">
      <p class="location"><span class="loc-label">Where</span> <code>${esc(f.location)}</code></p>
      <div class="block"><h4>What</h4><p>${esc(f.what)}</p></div>
      <div class="block"><h4>Why it matters</h4><p>${esc(f.why)}</p></div>
      ${f.evidence ? `<div class="block"><h4>Evidence</h4><p class="evidence">${esc(f.evidence)}</p></div>` : ''}
      <div class="block fix"><h4>Recommended fix</h4><p>${esc(f.fix)}</p></div>
    </div>
  </article>`;

const css = readFileSync(local('./report.css'), 'utf8');

const page = `<title>Security Review — ${esc(stamp)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap">

<style>
${css}</style>

<div class="wrap">
  <header class="masthead">
    <div class="eyebrow">anotoki · genshin_impact · security review · ${esc(stamp)}</div>
    <h1>${esc(headline)}</h1>
    <p class="standfirst">${esc(data.scope)}</p>
  </header>

  <div class="verdict" role="group" aria-label="Findings by severity">
    ${['critical', 'high', 'medium', 'low', 'info']
      .map(
        (k) => `<button class="figure sev-fig sev-${k}${counts[k] ? '' : ' is-zero'}" data-filter="${k}" aria-pressed="false">
          <div class="figure-value">${counts[k]}</div>
          <div class="figure-label">${SEV[k].label}</div>
        </button>`
      )
      .join('')}
  </div>

  <section>
    <h2>What ran, and how far it reached</h2>
    <p class="lede">
      Two scanners and a dependency audit, then a manual read of the code they cover least well. The counts below are the
      automated coverage on its own terms; the findings that follow are labelled with where each came from.
    </p>
    <div class="tools">
      ${data.tools.map(toolLine).join('')}
    </div>
    <p class="ledenote">
      The honest summary: the automated tools surfaced almost nothing on the backend
      ${semgrepPhp ? `(Semgrep read ${semgrepPhp.paths?.scanned?.length ?? '—'} files and reported ${semgrepPhp.results?.length ?? 0})` : ''},
      which is a good sign but not a clean bill of health — the data-access and auth code is procedural, and that is where both
      Semgrep's patterns and Psalm's taint tracking lose the trail. Everything ranked below Info in the list came from reading
      that code by hand.
    </p>
  </section>

  <section>
    <h2>Findings</h2>
    <p class="lede">Most severe first. Tap a severity above to filter. Each finding says what it is, why it matters, and how to fix it.</p>
    <div class="findings-list" id="findings">
      ${findings.map(findingCard).join('')}
    </div>
  </section>

  <section>
    <h2>Checked, and holding up</h2>
    <p class="lede">
      A security report that is only a list of problems hides its most useful result: the things that were attacked on paper
      and did not give. These were reviewed specifically and are sound.
    </p>
    <div class="cleared-list">
      ${data.cleared
        .map(
          (c) => `<div class="cleared">
            <div class="cleared-check" aria-hidden="true">✓</div>
            <div><h3>${esc(c.area)}</h3><p>${esc(c.detail)}</p></div>
          </div>`
        )
        .join('')}
    </div>
  </section>

  <section>
    <h2>How to read this</h2>
    <div class="panel method">
      <p>
        Severity weighs how much access an attacker needs against what they gain. <strong>High</strong> here means a weakness
        in the authentication foundation; <strong>Medium</strong> means real but bounded, usually needing an authenticated
        account or a specific server configuration; <strong>Low</strong> and <strong>Info</strong> are hardening and hygiene.
        None of these is a remotely-exploitable anonymous compromise — the review looked for one specifically and did not find it.
      </p>
      <p class="muted">
        Reviewed ${esc(stamp)} against the working tree. Static analysis cannot prove the absence of a bug, and a scanner that
        finds nothing has told you where it looked, not that there is nothing to find — which is why the manual review carries
        the weight here. Re-run the tools and revisit the findings after any change to the auth, upload, or query code. The raw
        tool output is saved beside this report under <code>tools/</code>.
      </p>
    </div>
  </section>
</div>

<script>
${readFileSync(local('./report.js'), 'utf8')}</script>
`;

mkdirSync(local('./'), { recursive: true });
const out = local(`./security-report-${stamp}.html`);
writeFileSync(out, page);

console.log(`report written to ${out}`);
console.log(`  findings: ${findings.length}  (` + Object.entries(counts).filter(([, n]) => n).map(([k, n]) => `${n} ${k}`).join(', ') + ')');
console.log(`  cleared:  ${data.cleared.length} areas`);
