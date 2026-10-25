<?php

// ---------------------------------------------------------------------------
// config/app.php - this site's own public address
// ---------------------------------------------------------------------------
// The address robots.txt names the sitemap at and every address of
// sitemap.xml begins with (the anotoki library's Robots, api/robots.php) -
// never one read off a request: a Host header is anybody's to write, and a
// sitemap served under somebody else's name would send search engines there.
//
// Where the code runs says it, as the survey's siteAddress() does (the owner's
// word of 2026-10-25: no file to upload for it): a release - its backend/
// carries release.json, which anotoki-deploy puts there - is served at
// SITE_RELEASE_ADDRESS, the one address the deploy tool puts a release at
// (backend/composer.json's extra["anotoki-deploy"].url); a checkout at
// SITE_DEVELOPMENT_ADDRESS, ng serve's, which hands both files to the PHP
// server.
//
// An installation served at another address names it in the OPTIONAL
// config/app.local.php - gitignored like every *.local.php - under the key the
// setup page wrote it with from 2026-09-29 to 2026-10-05 (for the CORS
// allowlist the API no longer has; an old file's cors_origins are not read):
//
//   <?php return ['url' => 'https://genshin.example'];
//
// setup.php does not write it: the address it works out is read off the
// request, believed for its IAM test and a sentence only, never for anything
// written (setupSiteAddress()). The tests and the screenshot pass write it for
// the throwaway sites they serve.
//
// A file there that cannot be read cleanly (config/local.php), that names no
// usable url - an http(s) origin, nothing after its host and port - or that
// is no file (a folder in its place) is passed over, said once in the PHP log
// by its fault - never a word of it - and the address of where the code runs
// holds: robots.txt keeps its Sitemap line, and sitemap.xml is served.
// ---------------------------------------------------------------------------

require_once __DIR__ . '/local.php';

/** Where a release is served: the address backend/composer.json's extra["anotoki-deploy"] puts it at (its `url` - tests/settings-files.test.php holds the two together). */
const SITE_RELEASE_ADDRESS = 'https://genshin.anotoki.eu';

/** Where a checkout is served on this computer: ng serve (CLAUDE.md's development ports), which hands robots.txt and sitemap.xml to the PHP. */
const SITE_DEVELOPMENT_ADDRESS = 'http://localhost:4200';

/**
 * This site's public address - its origin, `scheme://host[:port]`:
 * config/app.local.php's url when the file names one, else where the code
 * runs (siteIsRelease(): a release's SITE_RELEASE_ADDRESS, a checkout's
 * SITE_DEVELOPMENT_ADDRESS). Never the request's Host. Worked out once a
 * request; what was wrong with the file goes to the PHP log
 * (siteAddressReport()).
 */
function siteAddress(): string
{
    static $address = null;

    if ($address === null) {
        $whereItRuns = siteIsRelease() ? SITE_RELEASE_ADDRESS : SITE_DEVELOPMENT_ADDRESS;
        $file = localConfigPath('app');
        $named = null;
        $problem = null;
        // No file at all: where the code runs, and nothing to say.
        if (file_exists($file)) {
            if (!is_file($file)) {
                $problem = 'is not a file (a folder, or something else, in its place)';
            } elseif (localConfigError('app') !== null) {
                $problem = 'cannot be read cleanly (' . localConfigError('app') . ')';
            } else {
                $local = localConfig('app');
                $named = is_array($local) ? localConfigOrigin($local['url'] ?? null) : null;
                if ($named === null) {
                    $problem = 'names no usable url (an http(s) origin, nothing after its host and port)';
                }
            }
        }
        $address = $named ?? $whereItRuns;
        siteAddressReport($problem === null ? [] : ["config/app.local.php {$problem}: it is passed over - robots.txt and sitemap.xml name {$whereItRuns}, where the code runs"]);
    }

    return $address;
}

/**
 * What was wrong with config/app.local.php, to the PHP log - once, not on
 * every request, config/cloudflare.php's way: the sentences are remembered
 * (their hash, in storage/cache/app-settings-reported) and the same ones are
 * not written again until they change. They name the file's fault, never a
 * word of it.
 */
function siteAddressReport(array $problems): void
{
    $marker = siteStateRoot() . '/storage/cache/app-settings-reported';
    $said = $problems === [] ? '' : hash('sha256', implode("\n", $problems));

    clearstatcache(true, $marker);
    $before = is_file($marker) ? (string) @file_get_contents($marker) : '';
    if ($said === $before) {
        return;
    }
    foreach ($problems as $problem) {
        error_log('[app] ' . $problem);
    }
    if (!is_dir(dirname($marker))) {
        @mkdir(dirname($marker), 0775, true);
    }
    @file_put_contents($marker, $said, LOCK_EX);
}
