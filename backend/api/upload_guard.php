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
 *              away (uploadGuardRules()) and - where Apache has mod_headers -
 *              keeps a browser from reading a file as anything but its own
 *              type, and hands anything that is not a picture over as a
 *              download (uploadGuardHeaders(): an old .svg or .html in the
 *              asset tree never runs on the site's origin), put there by every
 *              deploy and, when it is missing, before every upload
 *              (ensureUploadGuard())
 *
 * The rules are only those that cannot take the folder down on an Apache we do
 * not know: mod_mime's RemoveHandler and RemoveType, which need AllowOverride
 * FileInfo - and the web root's own rewrite rules need that already, so it is
 * there wherever the site works - and mod_headers' Header, which needs the
 * same and stands inside <IfModule>. They take back any AddHandler or AddType
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
    'php',
    'phtml',
    'phar',
    'pht',
    'php3',
    'php4',
    'php5',
    'php6',
    'php7',
    'php8',
    'phps',
    'cgi',
    'pl',
    'py',
    'sh',
    'asp',
    'aspx',
    'jsp',
    'shtml',
    'htaccess',
    'htpasswd',
    'ini',
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
 * The largest file an editor may upload into the asset tree or
 * public/uploads/: the file explorer's own limit (its roots,
 * api/admin_tools.php) and what the hosting's PHP is set to take (README's
 * Hosting checklist). The admin pages' file pickers say so first, in the
 * browser; this is what decides.
 */
const UPLOAD_MAX_BYTES = 50 * 1024 * 1024;

/**
 * Whether an upload may be kept: something in it, no larger than
 * UPLOAD_MAX_BYTES, and bytes that are what its extension says - the
 * family's rule, anotoki-lib's UploadPolicy::contentRefusal() (its file
 * explorer's): a picture that getimagesize() and finfo call that kind of
 * picture, an AVIF's ftyp box naming AVIF as its major brand, a sound's magic
 * bytes, and no markup where the file begins nor a page's tags in its first
 * kilobyte - so XBM or WBMP text named .png or .jpg, GIF bytes named .png, an
 * HTML comment that spells ftyp, a page behind ID3 or OggS: none of them. Read
 * from the upload's own file (PHP's temporary copy), never from its name or
 * the browser's word for its type. The admin pages check the kind and the size
 * in the browser too (@anotoki/lib/ui/file-picker); that is a convenience, and
 * this is the check (anotoki-lib 0.6.0's review; the code review of
 * 2026-10-18 found a check of the site's own that let all of those through).
 *
 * @param Psr\Http\Message\UploadedFileInterface $file
 */
function uploadFileAcceptable(object $file, string $extension, int $maxBytes = UPLOAD_MAX_BYTES): bool
{
    $size = $file->getSize();
    if (!is_int($size) || $size <= 0 || $size > $maxBytes) {
        return false;
    }
    $path = (string) $file->getStream()->getMetadata('uri');

    return $path !== '' && \Anotoki\Lib\Files\UploadPolicy::contentRefusal($path, strtolower($extension)) === null;
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
 * How the files of an upload folder are served, where Apache has mod_headers:
 * never sniffed into markup, and anything that is not one of the raster
 * pictures an upload may be - audio, SVG (a picture that can carry script),
 * whatever an old upload or FTP left - handed over as a download rather than
 * shown on the site's origin. public/uploads/.htaccess's rules, word for word;
 * an <img> or an <audio> reads its file whatever the download header says.
 */
function uploadGuardHeaders(): string
{
    return implode("\n", [
        '<IfModule mod_headers.c>',
        '    Header set X-Content-Type-Options "nosniff"',
        '    <FilesMatch "(?i)\.(?!(?:avif|png|jpe?g|webp|gif)$)[^./]*$">',
        '        Header set Content-Disposition "attachment"',
        '    </FilesMatch>',
        '</IfModule>',
    ]) . "\n";
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
    ]) .
        uploadGuardRules() .
        implode("\n", [
            '',
            '# Where Apache has mod_headers (which needs the same FileInfo): no file is',
            '# sniffed into markup, and anything that is not a raster picture - audio,',
            '# SVG (a picture that can carry script), whatever else is here - goes out as',
            '# a download, never shown on the site\'s origin. An <img> or an <audio> reads',
            '# its file whatever the download header says.',
            '',
        ]) .
        uploadGuardHeaders();
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
