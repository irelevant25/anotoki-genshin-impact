// Turns a production `ng build` into a release's app - anotoki-deploy runs it with the build
// (backend/composer.json, extra["anotoki-deploy"].frontendBuild: `npm run build:deploy`) - by writing the one
// thing the build cannot know on its own:
//
//   config.json   the site talks to its own origin, so the API base URL is
//                 empty and `/api/...` stays relative - in development too,
//                 where ng serve's proxy (proxy.conf.json) hands it to the PHP
//                 server. The copy in public/ says "dev"; this writes "prod"
//                 into the build output only.
//
// The release's frontend/.htaccess is anotoki-deploy's, from backend/composer.json: the SPA fallback, /api to the
// front controller, the asset tree's two formats (AVIF, Opus) the hosting's Apache does not know; /assets/ and
// /uploads/ are served beside the release by the switch.
//
// Run by `npm run build:deploy` after `ng build`. Nothing here is used in dev.

import { writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// The application builder puts the web files under dist/angular/browser/ - that
// folder, not its parent, is what becomes the web root. Fall back to the parent
// for older builders that emitted straight into dist/angular/.
const base = join(process.cwd(), 'dist', 'angular');
const dist = existsSync(join(base, 'browser')) ? join(base, 'browser') : base;

if (!existsSync(join(dist, 'index.html'))) {
  console.error(`No build at ${dist} (no index.html). Run \`ng build\` first.`);
  process.exit(1);
}

const config = { url: '', configuration: 'prod' };
writeFileSync(join(dist, 'config.json'), JSON.stringify(config, null, 2) + '\n');


const shown = dist
  .replace(process.cwd() + '\\', '')
  .replace(process.cwd() + '/', '')
  .replace(/\\/g, '/');
console.log(`Prepared ${shown}/ for a release:`);
console.log('  config.json  -> { url: "", configuration: "prod" }  (same-origin API)');
