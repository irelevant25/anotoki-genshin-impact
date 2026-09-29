<?php

/**
 * Assembles backend/dist/ - the runtime-only slice of the backend, ready to upload
 * into the hosting web root beside the built Angular app.
 *
 *     php build-dist.php
 *
 * This is the PHP counterpart to `ng build`, minus the transpilation: it is a
 * copy with an allowlist. What lands in dist/ is exactly what the running site
 * needs and nothing else - the generators, the dev server, the API reference,
 * the linters and the per-machine secrets are all left behind.
 *
 * What is shipped:
 *   api/            minus openapi.json, docs.html and the dev vhost file
 *   config/         minus every *.local.php (secrets, see below)
 *   vendor/         the composer dependencies (FTP hosts cannot run composer)
 *   composer.json, composer.lock
 *   migrations/     the schema, so the Migrations page can read it
 *   public/uploads/.htaccess, and empty storage/ - both hardened, both writable
 *
 * What is NOT shipped, and must already exist on the server - setup.php writes
 * the config files there on the first install, and a deploy never touches them:
 *   config/database.local.php   production database credentials
 *   config/secret.local.php     the site secret
 *   config/iam.local.php        the IAM address and this site's client id
 *   config/app.local.php        the site's own address (and any extra CORS origin)
 *   assets/                     the image tree, uploaded separately to /assets
 *
 * Without the config files the API answers every request 503 not_set_up; see
 * config/local.php. setup.php itself is not part of the build either: it goes up
 * by hand for the first install and removes itself when done.
 *
 * See DEVELOPING.md, "Deploying to the hosting".
 */

$root = __DIR__;
$dist = $root . '/dist';

// ── Tiny fs helpers ───────────────────────────────────────────────────────────

function rrmdir(string $dir): void
{
    if (!is_dir($dir)) {
        return;
    }
    foreach (scandir($dir) as $entry) {
        if ($entry === '.' || $entry === '..') {
            continue;
        }
        $path = $dir . '/' . $entry;
        is_dir($path) ? rrmdir($path) : @unlink($path);
    }
    @rmdir($dir);
}

function ensureDir(string $dir): void
{
    if (!is_dir($dir)) {
        mkdir($dir, 0775, true);
    }
}

/** State the copy passes accumulate into, for the closing summary. */
$stats = ['files' => 0, 'bytes' => 0];

function copyFileCounted(string $src, string $dst): void
{
    global $stats;
    ensureDir(dirname($dst));
    copy($src, $dst);
    $stats['files']++;
    $stats['bytes'] += (int) @filesize($src);
}

/**
 * Copies a tree, skipping whatever $skip returns true for.
 *
 * $skip is handed the path relative to $src (forward-slashed) and whether it is
 * a directory; returning true drops that entry, and a dropped directory is not
 * descended into.
 */
function copyTree(string $src, string $dst, ?callable $skip = null): void
{
    $src = rtrim(str_replace('\\', '/', $src), '/');
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($src, FilesystemIterator::SKIP_DOTS | FilesystemIterator::UNIX_PATHS),
        RecursiveIteratorIterator::SELF_FIRST
    );

    foreach ($iterator as $path => $info) {
        $relative = substr(str_replace('\\', '/', $path), strlen($src) + 1);
        if ($skip && $skip($relative, $info->isDir())) {
            // A skipped directory must not be descended into.
            if ($info->isDir()) {
                $iterator->getSubIterator()->next();
            }
            continue;
        }
        if ($info->isDir()) {
            ensureDir($dst . '/' . $relative);
        } else {
            copyFileCounted($path, $dst . '/' . $relative);
        }
    }
}

/** A "not over HTTP" guard for the folders that only PHP should read. */
function writeDenyHtaccess(string $dir): void
{
    ensureDir($dir);
    file_put_contents($dir . '/.htaccess', <<<HT
        # Read by PHP from disk, never served over HTTP.
        <IfModule mod_authz_core.c>
            Require all denied
        </IfModule>
        <IfModule !mod_authz_core.c>
            Order allow,deny
            Deny from all
        </IfModule>

        HT);
}

// ── Assemble ──────────────────────────────────────────────────────────────────

echo "Assembling backend/dist/ ...\n";
rrmdir($dist);
ensureDir($dist);

// api/ - the whole thing bar the three dev-only files.
$apiSkip = ['openapi.json', 'docs.html', 'httpd-vhosts.conf'];
copyTree($root . '/api', $dist . '/api', fn(string $rel, bool $isDir) => in_array($rel, $apiSkip, true));

// config/ - code only; secrets stay on the server.
$skippedSecrets = [];
copyTree($root . '/config', $dist . '/config', function (string $rel, bool $isDir) use (&$skippedSecrets) {
    if ($isDir) {
        return false;
    }
    // Nothing reads it any more: Google sign-in is the IAM's. Left out rather
    // than shipped as a file the running site never opens.
    if ($rel === 'google.php') {
        return true;
    }
    $secret = str_ends_with($rel, '.local.php');
    if ($secret) {
        $skippedSecrets[] = $rel;
    }
    return $secret;
});

// vendor/ + the manifests, so an FTP-only host needs no composer.
copyTree($root . '/vendor', $dist . '/vendor');
copyFileCounted($root . '/composer.json', $dist . '/composer.json');
if (is_file($root . '/composer.lock')) {
    copyFileCounted($root . '/composer.lock', $dist . '/composer.lock');
}

// migrations/ - the Migrations page reads these; never served.
copyTree($root . '/migrations', $dist . '/migrations');

// The uploads store's own hardening, and an empty, writable cache dir.
copyFileCounted($root . '/public/uploads/.htaccess', $dist . '/public/uploads/.htaccess');
ensureDir($dist . '/storage/cache');

// Defence in depth: keep the disk off the web even where PHP would run it.
foreach (['config', 'migrations', 'storage', 'vendor'] as $guard) {
    writeDenyHtaccess($dist . '/' . $guard);
}

// ── Report ────────────────────────────────────────────────────────────────────

$mb = number_format($stats['bytes'] / 1048576, 1);
echo "\n  {$stats['files']} files, {$mb} MB -> backend/dist/\n";

echo "\nUpload the CONTENTS of backend/dist/ into the web root (public_html/), beside the\n";
echo "Angular build from `npm run build:deploy`.\n";

if ($skippedSecrets) {
    sort($skippedSecrets);
    echo "\nLeft out on purpose - make sure each already exists on the server:\n";
    foreach ($skippedSecrets as $secret) {
        echo "  config/{$secret}\n";
    }
}

echo "\nNot part of any build - upload separately, once, when it changes:\n";
echo "  assets/  ->  public_html/assets/   (the image tree the public site loads)\n";

echo "\nNote: this host is FTP-only, so `php migration.php` cannot run on the server.\n";
echo "New migrations go through the admin Migrations page - see DEVELOPING.md, \"Deploying to the hosting\".\n";
