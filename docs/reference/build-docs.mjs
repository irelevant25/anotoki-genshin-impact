// Builds the technical reference — one self-contained HTML page describing the
// backend, the frontend, and the database, cross-linked so you can follow a
// thread from a screen to the endpoints it calls to the tables those touch.
//
//   node docs/reference/build-docs.mjs
//
// Almost nothing here is written by hand. The backend and the database models
// come from angular/api-spec.json, which the API generates from its own route
// table, response shapes and migrations — so this documentation cannot drift
// from the code the way a hand-kept document does. The frontend side is read
// from the Angular sources: the page tree from the folder layout, and the
// endpoints each page uses from the API-service methods it calls.
//
// Regenerate whenever the API or the pages change (after `php
// generate-api-spec.php && node generate-api.mjs`, which refreshes the spec).
import { readFileSync, readdirSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const local = (rel) => new URL(rel, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const ROOT = local('../../');
const spec = JSON.parse(readFileSync(join(ROOT, 'angular/api-spec.json'), 'utf8'));

const esc = (s) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const titleCase = (s) =>
  String(s).replace(/[-_]/g, ' ').replace(/\.php$/, '').replace(/\b\w/g, (c) => c.toUpperCase()).trim();

// ─────────────────────────────────────────────────────────────────────────────
// Backend: endpoints, from the spec's route table
// ─────────────────────────────────────────────────────────────────────────────
const beAnchor = (method, path) => 'be-' + slug(method + '-' + path);
const dbAnchor = (table) => 'db-' + slug(table);

const roleLabel = (route) =>
  route.roles?.length ? route.roles.join(' / ') : route.auth ? 'any signed-in user' : 'public';

// One endpoint, enriched with the anchors it links to.
const endpoints = spec.routes
  .map((r) => ({
    method: r.method,
    path: r.path,
    file: r.file,
    anchor: beAnchor(r.method, r.path),
    auth: !!r.auth,
    roles: r.roles ?? [],
    access: roleLabel(r),
    tables: r.tables ?? [],
    response: r.responds ? (r.responds.list ? r.responds.shape + '[]' : r.responds.shape) : null,
    payload: r.payload ?? null,
    args: r.args ?? [],
    statuses: r.statuses ?? [],
    line: r.source?.line ?? null,
  }))
  .sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));

// Group endpoints by their source file — one file is one resource — and give
// each group a readable name.
const beGroups = new Map();
for (const e of endpoints) {
  const key = e.file || 'other';
  if (!beGroups.has(key)) beGroups.set(key, { file: key, title: titleCase(key), anchor: 'beg-' + slug(key), endpoints: [] });
  beGroups.get(key).endpoints.push(e);
}
const backendGroups = [...beGroups.values()].sort((a, b) => a.title.localeCompare(b.title));

// A quick lookup so a path+method resolves to its anchor from anywhere.
const endpointByKey = new Map(endpoints.map((e) => [e.method + ' ' + e.path, e]));

// ─────────────────────────────────────────────────────────────────────────────
// Database: tables, from the spec, with a reverse index of who uses each
// ─────────────────────────────────────────────────────────────────────────────
const usedBy = new Map(); // table -> Set of endpoint keys
for (const e of endpoints) {
  for (const t of e.tables) {
    if (!usedBy.has(t)) usedBy.set(t, new Set());
    usedBy.get(t).add(e.method + ' ' + e.path);
  }
}

const tables = spec.tables
  .map((t) => ({
    table: t.table,
    database: t.database,
    interface: t.interface,
    anchor: dbAnchor(t.table),
    columns: t.columns ?? [],
    usedBy: [...(usedBy.get(t.table) ?? [])].map((k) => endpointByKey.get(k)).filter(Boolean),
  }))
  .sort((a, b) => a.table.localeCompare(b.table));

const tableByName = new Map(tables.map((t) => [t.table, t]));

// ─────────────────────────────────────────────────────────────────────────────
// Frontend: the page tree and the endpoints each page calls
// ─────────────────────────────────────────────────────────────────────────────

// Every API-service method, mapped to the endpoint it calls. Parsed from the
// generated services: each method carries a `\`METHOD /path\`` doc comment right
// above its name.
const serviceDir = join(ROOT, 'angular/src/app/api/services');
const methodToEndpoint = new Map(); // methodName -> {method, path, service}
for (const file of readdirSync(serviceDir).filter((f) => f.endsWith('.service.ts'))) {
  const src = readFileSync(join(serviceDir, file), 'utf8');
  const service = (src.match(/export class (\w+)/) || [])[1] || file;
  // Walk doc-comment + signature pairs.
  const re = /\*\s+`(GET|POST|PUT|PATCH|DELETE)\s+([^`]+)`[\s\S]*?\n\s*(?:async\s+)?(\w+)\s*\(/g;
  let m;
  while ((m = re.exec(src))) {
    const [, method, path, name] = m;
    methodToEndpoint.set(name, { method, path: path.trim(), service });
  }
}

// The pages. Rather than parse the route indirection, the tree is read from the
// folder layout under the two sites, which is where the routing points anyway:
// sites/main/features/<section>/<page> and sites/admin/<section>/<page>.
const KNOWN_METHODS = [...methodToEndpoint.keys()];
const methodCallRe = new RegExp('[.\\s](' + KNOWN_METHODS.join('|') + ')\\s*\\(', 'g');

function pagesUnder(baseRel, site) {
  const base = join(ROOT, baseRel);
  const pages = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) {
        walk(full);
      } else if (name.endsWith('.component.ts') && !/modal|confirm/.test(name)) {
        const src = readFileSync(full, 'utf8');
        const calls = new Set();
        let m;
        methodCallRe.lastIndex = 0;
        while ((m = methodCallRe.exec(src))) {
          const hit = methodToEndpoint.get(m[1]);
          if (hit) calls.add(hit.method + ' ' + hit.path);
        }
        const rel = full.slice(join(ROOT, baseRel).length + 1).replace(/\\/g, '/');
        const parts = rel.split('/').slice(0, -1); // drop the filename
        const section = parts[0] ? titleCase(parts[0]) : 'Top level';
        const pageName = titleCase(name.replace('.component.ts', '').replace(/-list$/, '').replace(/-/g, ' '));
        pages.push({
          site,
          section,
          name: pageName,
          file: rel,
          anchor: 'fe-' + slug(site + '-' + rel),
          endpoints: [...calls].map((k) => endpointByKey.get(k)).filter(Boolean),
        });
      }
    }
  };
  walk(base);
  return pages;
}

const fePages = [...pagesUnder('angular/src/app/sites/main/features', 'Main'), ...pagesUnder('angular/src/app/sites/admin', 'Admin')];

// Group pages by Site -> Section.
const feTree = new Map(); // site -> Map(section -> pages[])
for (const p of fePages) {
  if (!feTree.has(p.site)) feTree.set(p.site, new Map());
  const sections = feTree.get(p.site);
  if (!sections.has(p.section)) sections.set(p.section, []);
  sections.get(p.section).push(p);
}

// ─────────────────────────────────────────────────────────────────────────────
// Render
// ─────────────────────────────────────────────────────────────────────────────
const methodPill = (m) => `<span class="verb verb-${m.toLowerCase()}">${m}</span>`;

const endpointRef = (e) =>
  `<a class="ref ref-be" href="#${e.anchor}">${methodPill(e.method)}<code>${esc(e.path)}</code></a>`;

const tableRef = (t) => {
  const tbl = tableByName.get(t);
  return tbl
    ? `<a class="ref ref-db" href="#${tbl.anchor}"><code>${esc(t)}</code></a>`
    : `<span class="ref ref-db is-dead"><code>${esc(t)}</code></span>`;
};

// ── Frontend section ──────────────────────────────────────────────────────────
const renderFrontend = () => {
  let out = '';
  for (const [site, sections] of feTree) {
    out += `<div class="fe-site">`;
    out += `<h3 class="fe-site-title">${esc(site)} site</h3>`;
    for (const [section, pages] of [...sections].sort((a, b) => a[0].localeCompare(b[0]))) {
      out += `<div class="fe-section"><h4 class="fe-section-title">${esc(section)}</h4><div class="fe-pages">`;
      for (const p of pages.sort((a, b) => a.name.localeCompare(b.name))) {
        out += `<article class="fe-page" id="${p.anchor}" data-name="${esc((p.site + ' ' + p.section + ' ' + p.name).toLowerCase())}">
          <div class="fe-page-head"><span class="fe-page-name">${esc(p.name)}</span><code class="fe-page-file">${esc(p.file)}</code></div>`;
        if (p.endpoints.length) {
          out += `<div class="fe-endpoints"><span class="fe-endpoints-label">calls</span><div class="ref-list">${p.endpoints
            .sort((a, b) => a.path.localeCompare(b.path))
            .map(endpointRef)
            .join('')}</div></div>`;
        } else {
          out += `<p class="fe-none">No API endpoints called directly — a presentational or container page.</p>`;
        }
        out += `</article>`;
      }
      out += `</div></div>`;
    }
    out += `</div>`;
  }
  return out;
};

// ── Backend section ─────────────────────────────────────────────────────────
const renderBackend = () => {
  let out = '';
  for (const g of backendGroups) {
    out += `<div class="be-group" id="${g.anchor}"><h3 class="be-group-title">${esc(g.title)} <span class="be-group-file">${esc(g.file)}</span></h3>`;
    for (const e of g.endpoints) {
      const search = (e.method + ' ' + e.path + ' ' + e.file + ' ' + (e.response ?? '')).toLowerCase();
      out += `<article class="endpoint" id="${e.anchor}" data-access="${e.auth ? (e.roles.length ? 'role' : 'auth') : 'public'}" data-search="${esc(search)}">
        <div class="endpoint-head">
          ${methodPill(e.method)}
          <code class="endpoint-path">${esc(e.path)}</code>
          <span class="access access-${e.auth ? (e.roles.length ? 'role' : 'auth') : 'public'}">${esc(e.access)}</span>
        </div>
        <div class="endpoint-body">`;
      if (e.args.length) {
        out += `<div class="ep-row"><span class="ep-label">Path args</span><span>${e.args
          .map((a) => `<code>${esc(a.name)}</code>`)
          .join(' ')}</span></div>`;
      }
      if (e.payload) {
        out += `<div class="ep-row"><span class="ep-label">Body</span><code>${esc(e.payload)}</code></div>`;
      }
      if (e.response) {
        out += `<div class="ep-row"><span class="ep-label">Returns</span><code>${esc(e.response)}</code></div>`;
      }
      if (e.tables.length) {
        out += `<div class="ep-row"><span class="ep-label">Tables</span><span class="ref-list">${e.tables.map(tableRef).join('')}</span></div>`;
      }
      out += `<div class="ep-row ep-meta"><span class="ep-label">Status</span><span>${e.statuses.join(', ') || '—'}</span>`;
      if (e.line) out += `<span class="ep-src">${esc(e.file)}:${e.line}</span>`;
      out += `</div></div></article>`;
    }
    out += `</div>`;
  }
  return out;
};

// ── Database section ──────────────────────────────────────────────────────────
const renderDatabase = () => {
  let out = '';
  for (const t of tables) {
    const search = (t.table + ' ' + (t.interface ?? '') + ' ' + t.columns.map((c) => c.name).join(' ')).toLowerCase();
    out += `<article class="table-doc" id="${t.anchor}" data-db="${esc(t.database)}" data-search="${esc(search)}">
      <div class="table-head">
        <code class="table-name">${esc(t.table)}</code>
        <span class="table-db">${esc(t.database)}</span>
        ${t.interface ? `<span class="table-iface">${esc(t.interface)}</span>` : ''}
      </div>
      <div class="table-cols"><table><thead><tr><th>Column</th><th>Type</th><th>Null</th></tr></thead><tbody>`;
    for (const c of t.columns) {
      out += `<tr><td><code>${esc(c.name)}</code></td><td class="col-type">${esc(c.sqlType)}${
        c.enum ? ` <span class="col-enum">${c.enum.map((v) => esc(v)).join(' | ')}</span>` : ''
      }</td><td class="col-null">${c.nullable ? 'yes' : 'no'}</td></tr>`;
    }
    out += `</tbody></table></div>`;
    if (t.usedBy.length) {
      out += `<div class="table-usedby"><span class="ep-label">Used by</span><div class="ref-list">${t.usedBy
        .sort((a, b) => a.path.localeCompare(b.path))
        .map(endpointRef)
        .join('')}</div></div>`;
    }
    out += `</article>`;
  }
  return out;
};

const stamp = new Date().toISOString().slice(0, 10);
const fileStamp = new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', '-');

const totals = {
  endpoints: endpoints.length,
  pages: fePages.length,
  tables: tables.length,
  pagesWired: fePages.filter((p) => p.endpoints.length).length,
};

const css = readFileSync(local('./reference.css'), 'utf8');
const js = readFileSync(local('./reference.js'), 'utf8');

const page = `<title>anotoki Reference — ${esc(stamp)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap">
<style>
${css}</style>

<div class="wrap">
  <header class="masthead">
    <div class="eyebrow">anotoki · genshin_impact · technical reference · ${esc(stamp)}</div>
    <h1>How the app fits together</h1>
    <p class="standfirst">
      Generated from the code, not written beside it: the backend and the database come from the API's own generated spec,
      the frontend page tree from the Angular sources and the API-service calls each page makes. Start on a screen and follow
      it to the endpoints it calls; follow an endpoint to the tables it touches; follow a table back to everything that uses
      it. Search filters within the tab you are on.
    </p>
    <div class="counts">
      <span><strong>${totals.pages}</strong> pages</span>
      <span><strong>${totals.endpoints}</strong> endpoints</span>
      <span><strong>${totals.tables}</strong> tables</span>
    </div>
  </header>

  <nav class="tabs" role="tablist">
    <button class="tab is-active" data-tab="frontend" role="tab">Frontend</button>
    <button class="tab" data-tab="backend" role="tab">Backend</button>
    <button class="tab" data-tab="database" role="tab">Database</button>
    <input type="search" id="filter" placeholder="Filter within this tab…" aria-label="Filter">
  </nav>

  <section class="view is-active" id="view-frontend">
    <p class="view-hint">Every page under the Main and Admin sites, by section. Each lists the API endpoints it calls — click one to jump to its backend entry.</p>
    ${renderFrontend()}
  </section>

  <section class="view" id="view-backend">
    <p class="view-hint">Every endpoint, grouped by the source file that defines it. Each shows who may call it, what it takes and returns, and the tables it touches — click a table to jump to its model.</p>
    ${renderBackend()}
  </section>

  <section class="view" id="view-database">
    <p class="view-hint">Every table, its columns, and — the useful part — every endpoint that reads or writes it. Click an endpoint to jump back to the backend.</p>
    ${renderDatabase()}
  </section>

  <footer class="foot">
    Generated ${esc(stamp)} from <code>angular/api-spec.json</code> and the Angular sources by <code>docs/reference/build-docs.mjs</code>.
    Backend and database are exact; the frontend map is read heuristically from which API-service methods each page calls, so a
    page reaching the API an unusual way may under-report. Regenerate after <code>php generate-api-spec.php &amp;&amp; node generate-api.mjs</code>.
  </footer>
</div>

<script>
${js}</script>
`;

const out = local(`./reference-${fileStamp}.html`);
writeFileSync(out, page);
console.log(`reference written to ${out}`);
console.log(`  ${totals.pages} pages (${totals.pagesWired} call the API), ${totals.endpoints} endpoints, ${totals.tables} tables`);
console.log(`  service methods mapped: ${methodToEndpoint.size}`);
