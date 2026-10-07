<?php

/**
 * What keeps a folder of uploads from ever running as code on the web server.
 *
 * Editors upload into two folders the host's Apache serves as plain files: the
 * asset tree (assets/, beside the pages - uploads.php and the Files page) and
 * public/uploads/ (the older multipart saves in full_resource.php, and
 * POST /api/upload). An Apache that maps PHP with AddHandler or AddType runs a
 * file as PHP when ANY part of its name says so, not only the last: mod_mime
 * reads every dot-separated part after the first as an extension, so
 * `shell.php.png` is a script there, however well its bytes passed for a
 * picture. Two guards, so that neither is the last word:
 *
 *   the name   an upload keeps one extension, its own, from the allowlist -
 *              every other dot in a new name becomes "-" (asset_naming.php,
 *              _assetUploadStem()), and nothing named like a script goes back
 *              into the tree (uploadNameRunsOnServer())
 *   the folder each one's .htaccess takes PHP and the other script handlers
 *              away (uploadGuardRules()), put there by every deploy and, when
 *              it is missing, before every upload (ensureUploadGuard())
 *
 * The rules are only those that cannot take the folder down on an Apache we do
 * not know: mod_mime's RemoveHandler and RemoveType, which need AllowOverride
 * FileInfo - and the web root's own rewrite rules need that already, so it is
 * there wherever the site works. They take back any AddHandler or AddType
 * mapping of a script extension in the folder. Never php_flag, Options or
 * Require: each can answer 500 for every file in the folder on a host whose
 * AllowOverride does not allow it (php_flag needs Options even under mod_php,
 * and is an unknown directive without it), and in assets/ that is every
 * picture on the site. The name rule already stops the attack; these are the
 * second line, not a reason to risk the first.
 */

/**
 * Extensions a web server may run as a program, or read as its own
 * configuration - in any part of a name, not only the last.
 */
const UPLOAD_SCRIPT_EXTENSIONS = [
    'php', 'phtml', 'phar', 'pht', 'php3', 'php4', 'php5', 'php6', 'php7', 'php8', 'phps',
    'cgi', 'pl', 'py', 'sh', 'asp', 'aspx', 'jsp', 'shtml',
    'htaccess', 'htpasswd', 'ini',
];

/** The ones that are configuration rather than a handler: no RemoveHandler for these. */
const UPLOAD_CONFIG_EXTENSIONS = ['htaccess', 'htpasswd', 'ini'];

/**
 * Whether a web server could read any part of a file name as a script or as
 * its own configuration.
 *
 * Read the way Apache's mod_mime reads a name: the part before the first dot is
 * the file's own name, never an extension - `php.png` is a picture called php -
 * and every part after it counts, wherever it stands. A name that starts with a
 * dot has no such part, so all of it counts: `.htaccess` and `.user.ini` are
 * exactly what a server reads as configuration.
 */
function uploadNameRunsOnServer(string $name): bool
{
    $parts = explode('.', strtolower($name));
    array_shift($parts);

    foreach ($parts as $part) {
        if (in_array($part, UPLOAD_SCRIPT_EXTENSIONS, true)) {
            return true;
        }
    }

    return false;
}

/**
 * The directives that keep a folder from running anything, the same in every
 * upload folder (public/uploads/.htaccess carries them word for word, beside
 * its own rules about how files are served).
 */
function uploadGuardRules(): string
{
    $handlers = '.' . implode(' .', array_diff(UPLOAD_SCRIPT_EXTENSIONS, UPLOAD_CONFIG_EXTENSIONS));

    return "RemoveHandler $handlers\nRemoveType $handlers\n";
}

/**
 * The .htaccess an upload folder gets: the guard, and why it is there. The
 * asset tree's, word for word; public/uploads/ ships a longer one of its own
 * and gets this only if that one has gone.
 */
function uploadGuardHtaccess(): string
{
    return implode("\n", [
        '# What editors upload here is data - pictures and sound, never code - so',
        '# nothing in this folder may run as a script, whatever its name. Written by',
        '# the site (backend/api/upload_guard.php): every deploy brings it',
        '# (build-dist.php), and the API puts it back before an upload when it is',
        '# missing.',
        '#',
        '# Only rules that cannot take the folder down on an unknown Apache: mod_mime\'s',
        '# RemoveHandler and RemoveType (AllowOverride FileInfo, which the web root\'s',
        '# rewrite rules need already). Never php_flag, Options or Require: each can',
        '# answer 500 for every file in the folder on a host whose AllowOverride does',
        '# not allow it.',
        '',
    ]) . uploadGuardRules();
}

/**
 * Makes sure $dir has an .htaccess before anything is uploaded into it.
 *
 * Idempotent, and never overwrites: an .htaccess already there is left as it
 * is - public/uploads/ ships its own with more in it, and a deploy brings the
 * asset tree's (build-dist.php), so this only fills a gap such as a tree put up
 * by FTP before either. Written whole under another name and moved into place,
 * so Apache never reads half a file. Returns whether the folder has one.
 */
function ensureUploadGuard(string $dir): bool
{
    $target = rtrim($dir, '/\\') . '/.htaccess';
    if (is_file($target)) {
        return true;
    }
    if (!is_dir($dir)) {
        return false;
    }

    $temporary = $target . '.' . bin2hex(random_bytes(4)) . '.tmp';
    if (@file_put_contents($temporary, uploadGuardHtaccess()) === false) {
        return false;
    }
    if (!@rename($temporary, $target)) {
        @unlink($temporary);
    }

    return is_file($target);
}

/**
 * ensureUploadGuard(), or the request ends here: nothing is written into a
 * folder that cannot be kept from running it.
 */
function requireUploadGuard(string $dir): void
{
    if (ensureUploadGuard($dir)) {
        return;
    }

    error_log('[upload] refused: ' . basename($dir) . '/ has no .htaccess guard and none could be written');
    throw new ApiRefusal(500, 'upload_guard', 'Uploads are off: the upload folder has no .htaccess guard and none could be written.');
}
