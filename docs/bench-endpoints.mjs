// Times every GET endpoint the API exposes, several times each, and writes the
// numbers out as JSON for docs/api-latency-report.html to draw.
//
//   node docs/bench-endpoints.mjs <email> <password> [apiUrl]
//
// Sign in as an account that can read the admin endpoints; roughly a third of
// the API is behind a role. Reads only - timing writes would mean creating and
// destroying an entity per sample, which measures the fixture rather than the
// endpoint.
import { readFileSync, writeFileSync } from 'node:fs';

const [email, password, apiArg] = process.argv.slice(2);
if (!email || !password) {
  console.error('usage: node docs/bench-endpoints.mjs <email> <password> [apiUrl]');
  process.exit(1);
}

const API = apiArg ?? 'http://localhost:8000';
const SPEC = new URL('../angular/api-spec.json', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const OUT = new URL('./api-latency-timings.json', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

const WARMUP = 2;
const SAMPLES = 7;

// Slow on purpose, or doing work rather than answering a question. Timed once
// rather than sampled, and marked, so a survey of the asset tree does not sit
// in the same distribution as reading a lookup table.
const HEAVY = [/\/api\/files\/(stats|folders|missing|cleanup)/, /\/api\/backups/];

const login = await (
  await fetch(API + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
).json();
const token = login.token;
if (!token) throw new Error('could not sign in: ' + JSON.stringify(login).slice(0, 200));

const auth = { Authorization: `Bearer ${token}` };
const spec = JSON.parse(readFileSync(SPEC, 'utf8'));
const gets = spec.routes.filter((r) => r.method === 'GET');

// An id that belongs to the resource being asked about, rather than one id used
// everywhere - otherwise half the sample is a 404 being timed.
const collectionCache = new Map();
const firstOf = async (collection, key) => {
  const cacheKey = collection + '|' + key;
  if (collectionCache.has(cacheKey)) return collectionCache.get(cacheKey);
  let value = null;
  try {
    const response = await fetch(API + collection, { headers: auth });
    if (response.ok) {
      const body = await response.json().catch(() => null);
      const list = Array.isArray(body) ? body : (body?.items ?? body?.result ?? body?.files ?? []);
      if (Array.isArray(list) && list.length && list[0][key] !== undefined) value = list[0][key];
    }
  } catch {
    /* leave it null; the route is reported as unmeasured */
  }
  collectionCache.set(cacheKey, value);
  return value;
};

const fixed = { code: 'en', alias: 'genshin_impact', user_id: login.user?.id ?? 1 };

const resolve = async (route, arg) => {
  if (fixed[arg.name] !== undefined) return fixed[arg.name];

  // /api/artifacts/{id}/full -> ask /api/artifacts for its first id.
  const collection = route.path.slice(0, route.path.indexOf('/{'));
  if (arg.name === 'id') return await firstOf(collection, 'id');
  if (arg.name === 'name') return await firstOf(collection, 'name');
  if (arg.name === 'character_id') return await firstOf('/api/characters', 'id');
  if (arg.name === 'quiz_id') return await firstOf('/api/quizzes', 'id');
  return null;
};

const fill = async (route) => {
  let path = route.path;
  for (const arg of route.args ?? []) {
    const value = await resolve(route, arg);
    if (value === null || value === undefined) return null;
    path = path.replace(`{${arg.name}}`, encodeURIComponent(String(value)));
  }
  return path.includes('{') ? null : path;
};

const time = async (path) => {
  const started = performance.now();
  const response = await fetch(API + path, { headers: auth });
  const body = await response.arrayBuffer();
  return { ms: performance.now() - started, status: response.status, bytes: body.byteLength };
};

// What a request costs before any of its own work: the cheapest endpoint there
// is, so the rest can be read as "this much, plus what it does".
const floorSamples = [];
for (let i = 0; i < 3; i++) await time('/api/elements');
for (let i = 0; i < 15; i++) floorSamples.push((await time('/api/elements')).ms);
floorSamples.sort((a, b) => a - b);
const floor = floorSamples[Math.floor(floorSamples.length / 2)];
console.log(`  floor (GET /api/elements, 7 rows): ${floor.toFixed(1)}ms`);

const results = [];
let done = 0;

for (const route of gets) {
  const path = await fill(route);
  if (path === null) {
    results.push({ path: route.path, method: 'GET', file: route.file, skipped: 'nothing to put in the path' });
    continue;
  }

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

const measured = results.filter((r) => !r.skipped);
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
console.log('failing:', measured.filter((r) => r.status >= 400).map((r) => `${r.status} ${r.path}`).join(', ') || 'none');
const slow = measured.filter((r) => !r.heavy).sort((a, b) => b.median - a.median).slice(0, 8);
for (const r of slow) console.log(`  ${r.median.toFixed(0).padStart(6)}ms  ${(r.bytes / 1048576).toFixed(2).padStart(6)} MB  ${r.path}`);
