// Times every GET endpoint the API exposes, several times each, and writes the
// numbers out as JSON for build-report.mjs to turn into a page.
//
//   node docs/performance/bench-endpoints.mjs <personal-token> [apiUrl]
//
// Signing in is the anotoki IAM's, so the bench does not take a password: it
// takes a personal token (IAM account page -> Tokens for scripts, application
// genshin) of an account that can read the admin endpoints - roughly a third of
// the API is behind a role - and exchanges it at the IAM's token endpoint for
// access tokens, again whenever one runs out. The IAM's address and this site's
// client id come from the site's own /api/settings/public, so the IAM must be
// reachable from here. Reads only - timing writes would mean creating and
// destroying an entity per sample, which measures the fixture rather than the
// endpoint.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const [personalToken, apiArg] = process.argv.slice(2);
if (!personalToken || !personalToken.startsWith('iam_pat_')) {
  console.error('usage: node docs/performance/bench-endpoints.mjs <personal-token: iam_pat_...> [apiUrl]');
  process.exit(1);
}

const API = (apiArg ?? 'http://localhost:8000').replace(/\/+$/, '');
// fileURLToPath rather than URL.pathname: pathname is percent-encoded, so a
// checkout under a folder with a space in its name resolved to a path that
// does not exist.
const local = (relative) => fileURLToPath(new URL(relative, import.meta.url));
const SPEC = local('../../frontend/api-spec.json');

// Every run is kept, named by when it happened. A report is only worth reading
// next to the one before it, and that needs the one before it to still be there
// - so nothing here overwrites anything.
const RUNS = local('./runs/');
const OUT = join(RUNS, new Date().toISOString().slice(0, 16).replace(/[-:]/g, '') + 'Z.json');

const WARMUP = 2;
const SAMPLES = 7;
const FLOOR_PATH = '/api/elements';

// Slow on purpose, or doing work rather than answering a question. Timed once
// rather than sampled, and marked, so a survey of the asset tree does not sit
// in the same distribution as reading a lookup table.
const HEAVY = [/\/api\/files\/(stats|folders|missing|cleanup)/, /\/api\/backups/];

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

// A server that is not up and a token that is wrong are the two ways this
// usually goes, and neither deserves a stack trace.
let signIn;
try {
  const response = await fetch(API + '/api/settings/public');
  signIn = (await response.json().catch(() => ({}))).auth;
  if (!response.ok || !signIn?.issuer) {
    fail(`the API did not say where it signs in (${response.status}) - is its migration 040 applied?`);
  }
} catch (error) {
  fail(
    `could not reach the API at ${API} - start it from backend/ with: php -S localhost:8000 router.php\n  (${error.cause?.code ?? error.message})`
  );
}

// An access token lives ten minutes and a full run can take longer, so it is
// exchanged again a little before it would run out.
let access = { token: null, until: 0 };

const accessToken = async () => {
  if (access.token && access.until > Date.now() + 30_000) {
    return access.token;
  }
  let response;
  try {
    response = await fetch(signIn.issuer + '/api/oidc/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: personalToken, client_id: signIn.client_id }),
    });
  } catch (error) {
    fail(`could not reach the IAM at ${signIn.issuer} (${error.cause?.code ?? error.message})`);
  }
  const answer = await response.json().catch(() => ({}));
  if (!response.ok || !answer.access_token) {
    fail(`the IAM refused the personal token (${response.status}): ${answer.error_description ?? answer.error ?? ''}`);
  }
  access = { token: answer.access_token, until: Date.now() + answer.expires_in * 1000 };
  return access.token;
};

await accessToken();
const spec = JSON.parse(readFileSync(SPEC, 'utf8'));
const gets = spec.routes.filter((r) => r.method === 'GET');

const getJson = async (path) => {
  try {
    const response = await fetch(API + path, { headers: { Authorization: `Bearer ${await accessToken()}` } });
    return response.ok ? await response.json().catch(() => null) : null;
  } catch {
    return null;
  }
};

// The first row of whatever a collection answers with. Most answer with a bare
// list; the paged ones wrap it under a key of their own.
const LIST_KEYS = ['items', 'result', 'files', 'groups', 'rows', 'data'];
const rowCache = new Map();
const firstRow = async (collection) => {
  if (rowCache.has(collection)) return rowCache.get(collection);
  const body = await getJson(collection);
  const list = Array.isArray(body) ? body : LIST_KEYS.map((key) => body?.[key]).find(Array.isArray);
  const row = list?.length ? list[0] : null;
  rowCache.set(collection, row);
  return row;
};

// An id that belongs to the resource being asked about, rather than one id used
// everywhere - otherwise half the sample is a 404 being timed. The collection
// is looked for by walking up the path, so /api/materials/by-name/{name} finds
// its name in /api/materials once /api/materials/by-name has answered 404.
const firstOf = async (collection, key) => {
  for (let path = collection; path.split('/').length > 2; path = path.slice(0, path.lastIndexOf('/'))) {
    const row = await firstRow(path);
    if (row && row[key] !== undefined && row[key] !== null) return row[key];
  }
  return null;
};

// Routes keyed by a user id are timed as the person the token belongs to.
const me = await getJson('/api/me');
const fixed = { code: 'en', alias: 'genshin_impact', user_id: me?.id ?? 1 };
const elsewhere = { character_id: '/api/characters', quiz_id: '/api/quizzes' };

const resolve = async (route, arg) => {
  if (fixed[arg.name] !== undefined) return fixed[arg.name];
  if (elsewhere[arg.name]) return await firstOf(elsewhere[arg.name], 'id');

  // /api/artifacts/{id}/full -> ask /api/artifacts for its first id. The arg's
  // own name is the column, which covers {id}, {name} and {fingerprint} alike.
  return await firstOf(route.path.slice(0, route.path.indexOf('/{')), arg.name);
};

// Routes that answer 404 or 422 until they are told what to look at. Without
// these they were timed anyway, and the report counted a refusal as a reading.
// Each names something real, so what is timed is the work and not the refusal.
const QUERIES = {
  '/api/files': async () => {
    const folder = await firstOf('/api/files/folders', 'folder');
    return folder === null ? null : { folder };
  },
  '/api/files/raw': async () => {
    const folder = await firstOf('/api/files/folders', 'folder');
    if (folder === null) return null;
    const page = await getJson('/api/files?' + new URLSearchParams({ folder }));
    const name = page?.files?.[0]?.name;
    return name ? { folder, name } : null;
  },
  '/api/migrations/file': async () => {
    const row = await firstRow('/api/migrations');
    return row?.database && row?.filename ? { database: row.database, filename: row.filename } : null;
  },
};

// The path to call, or the reason there is none.
const fill = async (route) => {
  let path = route.path;
  for (const arg of route.args ?? []) {
    const value = await resolve(route, arg);
    if (value === null || value === undefined) return { skipped: 'nothing to put in the path' };
    path = path.replace(`{${arg.name}}`, encodeURIComponent(String(value)));
  }
  if (path.includes('{')) return { skipped: 'nothing to put in the path' };

  if (QUERIES[route.path]) {
    const query = await QUERIES[route.path]();
    if (query === null) return { skipped: 'nothing to put in the query' };
    path += '?' + new URLSearchParams(query);
  }
  return { path };
};

const time = async (path) => {
  // The token is fetched before the clock starts: an exchange at the IAM is not
  // part of what the endpoint costs.
  const headers = { Authorization: `Bearer ${await accessToken()}` };
  const started = performance.now();
  const response = await fetch(API + path, { headers });
  const body = await response.arrayBuffer();
  return { ms: performance.now() - started, status: response.status, bytes: body.byteLength };
};

// What a request costs before any of its own work: the cheapest endpoint there
// is, so the rest can be read as "this much, plus what it does".
const floorSamples = [];
for (let i = 0; i < 3; i++) await time(FLOOR_PATH);
for (let i = 0; i < 15; i++) floorSamples.push((await time(FLOOR_PATH)).ms);
floorSamples.sort((a, b) => a - b);
const floor = floorSamples[Math.floor(floorSamples.length / 2)];
console.log(`  floor (GET ${FLOOR_PATH}): ${floor.toFixed(1)}ms`);

const results = [];
let done = 0;

for (const route of gets) {
  const filled = await fill(route);
  if (filled.skipped) {
    results.push({ path: route.path, method: 'GET', file: route.file, skipped: filled.skipped });
    continue;
  }
  const path = filled.path;

  const heavy = HEAVY.some((re) => re.test(route.path));
  const samples = [];
  let status = 0;
  let bytes = 0;

  try {
    for (let i = 0; i < (heavy ? 0 : WARMUP); i++) await time(path);
    for (let i = 0; i < (heavy ? 1 : SAMPLES); i++) {
      const one = await time(path);
      samples.push(one.ms);
      status = one.status;
      bytes = one.bytes;
    }
  } catch (error) {
    results.push({ path: route.path, method: 'GET', file: route.file, skipped: String(error).slice(0, 80) });
    continue;
  }

  samples.sort((a, b) => a - b);
  const at = (q) => samples[Math.min(samples.length - 1, Math.floor(q * samples.length))];

  results.push({
    path: route.path,
    called: path,
    method: 'GET',
    file: route.file,
    auth: !!route.auth,
    roles: route.roles ?? [],
    tables: route.tables ?? [],
    status,
    bytes,
    heavy,
    samples: samples.length,
    min: samples[0],
    median: at(0.5),
    p95: at(0.95),
    max: samples[samples.length - 1],
  });

  done++;
  if (done % 25 === 0) console.log(`  timed ${done}...`);
}

// Nothing to sign out of: a personal token opens no session, and its access
// tokens simply run out.

const measured = results.filter((r) => !r.skipped);
mkdirSync(RUNS, { recursive: true });
writeFileSync(
  OUT,
  JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      warmup: WARMUP,
      samples: SAMPLES,
      floor,
      floor_samples: floorSamples,
      totals: {
        routes: spec.routes.length,
        get_routes: gets.length,
        measured: measured.length,
        skipped: results.length - measured.length,
        by_method: spec.routes.reduce((acc, r) => ({ ...acc, [r.method]: (acc[r.method] ?? 0) + 1 }), {}),
      },
      results,
    },
    null,
    1
  )
);

console.log(`\nmeasured ${measured.length} of ${gets.length} GET endpoints`);
console.log(`written to ${OUT}`);
console.log('failing:', measured.filter((r) => r.status >= 400).map((r) => `${r.status} ${r.path}`).join(', ') || 'none');
const slow = measured.filter((r) => !r.heavy).sort((a, b) => b.median - a.median).slice(0, 8);
for (const r of slow) console.log(`  ${r.median.toFixed(0).padStart(6)}ms  ${(r.bytes / 1048576).toFixed(2).padStart(6)} MB  ${r.path}`);
