// Turns a production `ng build` into something ready to upload, by writing the
// two things the build cannot know on its own:
//
//   config.json   the site talks to its own origin in production, so the API
//                 base URL is empty and `/api/...` stays relative. The copy in
//                 public/ holds the dev value (http://localhost:8000); this
//                 overwrites it in the build output only.
//
//   .htaccess     the app is one page with client-side routes, so every path
//                 that is not a real file has to fall back to index.html or a
//                 refresh on /admin/... is a 404. The API and uploaded files
//                 are handed through untouched to their own handlers. It also
//                 names the asset tree's two formats, which the hosting's
//                 Apache does not know.
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

const htaccess = `# Angular single-page app, served from the site root.
#
# The API and uploaded files are their own handlers, so let them through before
# anything else. Everything that is a real file or directory (the hashed JS/CSS,
# favicon, config.json, the assets/ tree) is served as-is; every other path is a
# client-side route and is answered with index.html so a refresh does not 404.
RewriteEngine On

RewriteRule ^api(/|$) - [L]
RewriteRule ^uploads(/|$) - [L]

RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]

# The site's converted formats (api/media_convert.php), AVIF and Opus, are two
# the hosting's Apache does not know: without these they go out with no
# Content-Type at all. The same types as /api/files/raw sends.
AddType image/avif .avif
AddType audio/ogg .opus
`;
writeFileSync(join(dist, '.htaccess'), htaccess);

const shown = dist.replace(process.cwd() + '\\', '').replace(process.cwd() + '/', '').replace(/\\/g, '/');
console.log(`Prepared ${shown}/ for production (upload its contents to the web root):`);
console.log('  config.json  -> { url: "", configuration: "prod" }  (same-origin API)');
console.log('  .htaccess    -> SPA fallback, /api and /uploads passed through, AVIF/Opus types');
