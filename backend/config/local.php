<?php

// ---------------------------------------------------------------------------
// config/local.php - this installation's own files, and whether it has them
// ---------------------------------------------------------------------------
// Every value that differs between one installation of the site and the next
// lives in config/*.local.php: gitignored, left out of build-dist.php, and
// written by setup.php - on a developer's machine as much as on the hosting.
//
//   database.local.php   the PostgreSQL connection and the database's name
//   secret.local.php     the site's own secret (a jwt.local.php from before the
//                        IAM is read in its place, which keeps valid the hashes
//                        already made with it)
//   iam.local.php        where people sign in - the IAM's address - and this
//                        site's client id there
//
// Optional: backup.local.php (the pg_dump paths for the command-line tools),
// site.local.php (which site of the family this is, when not genshin_impact),
// visitors.local.php (the limits on playing without signing in, and the
// proxies trusted to name a visitor's address - config/visitors.php; setup.php
// never writes it, and its defaults hold without it), and cloudflare.local.php
// (the origin secret the owner's Cloudflare zone adds to every request -
// config/cloudflare.php; setup.php never writes or reads it, and there is no
// secret without it).
// app.local.php (this site's own public address, robots.txt's Sitemap line
// and every address of sitemap.xml - config/app.php; setup.php never writes it,
// and without it robots.txt names no sitemap; written by the setup page of
// 2026-09-29 to 2026-10-05, for the CORS allowlist the API no longer has, whose
// cors_origins are not read).
//
// Nothing committed stands in for any of them. A default is how a development
// value ends up serving production - an allowlist of origins once named a
// domain nobody had set - so a checkout without these files is not running on
// defaults: it is not set up, and says so. Every API request is answered 503
// {"code": "not_set_up"} until they are all there - pointing at /setup.php
// while the site was never installed, and never once its installer has
// finished on a host (api/site_state.php).
//
// Every one of them is read cleanly or not at all (localConfigFileRead()):
// one written by hand without its <?php line, with a byte-order mark or a
// blank line before it, or with text after a closing tag would print what it
// holds - the database's password, the site secret, the origin secret - ahead
// of every answer; one that does not start with <?php is never even compiled
// (with declare(strict_types=1) after such a start, PHP could not compile it:
// a fatal error no handler catches, every request a 500). Such a file is
// passed over, said once in the PHP log by its fault - never a word of it -
// and is no file: a required one leaves the site not set up, an optional one
// its defaults, and never in a way that makes the site looser (a broken
// cloudflare.local.php is a secret no request carries, a broken
// visitors.local.php trusts no proxy, a broken site.local.php leaves the site
// not set up rather than reading another site's switches).
// ---------------------------------------------------------------------------

/** The files the API cannot run without, by their name before `.local.php`. */
const LOCAL_CONFIG_REQUIRED = ['database', 'secret', 'iam'];

/** Where setup.php is, from the API's own origin. */
const SETUP_PATH = '/setup.php';

/**
 * Something needed a value only setup.php can provide.
 *
 * The API never gets this far without its files - the SiteGate in front of
 * every route turns every request away first (api/site_state.php) - so this
 * is what a command-line script, or a file deleted in the middle of a
 * request, runs into.
 */
final class NotSetUpException extends RuntimeException {}

/**
 * The folder this installation's state is in - config/*.local.php and storage/; and on the host the uploads too. On
 * the host a release's backend/ carries release.json (anotoki-deploy) and the state is beside it, in the site's
 * folder, never part of an upload; in a checkout (and a copy of the code, the tests') it is backend/ itself.
 */
function siteStateRoot(): string
{
    $backend = dirname(__DIR__);

    return is_file($backend . '/release.json') ? dirname($backend) : $backend;
}

/**
 * The uploads (the older multipart saves, the file explorer's "Uploads"): uploads/ beside the release on the host,
 * served at /uploads/ by the switch (backend/composer.json's extra["anotoki-deploy"].beside); public/uploads/ in a
 * checkout, which router.php serves there.
 */
function siteUploadsDir(): string
{
    $state = siteStateRoot();

    return $state === dirname(__DIR__) ? dirname(__DIR__) . '/public/uploads' : $state . '/uploads';
}

function localConfigPath(string $name): string
{
    return siteStateRoot() . '/config/' . $name . '.local.php';
}

/**
 * What config/{name}.local.php returns, or null when there is no such file -
 * or one that could not be read cleanly (localConfigError() says why).
 *
 * Read once per request: several are consulted on every request, and the
 * answer does not change halfway through one. A file passed over is no more
 * usable than an absent one, and it never takes the whole API down with it.
 */
function localConfig(string $name): mixed
{
    return _localConfigRead($name)['value'];
}

/**
 * Why config/{name}.local.php was passed over - "does not start with <?php
 * (...)", "prints 12 bytes of its own (...)", "cannot be read (ParseError on
 * line 3)" - or null when it was read cleanly, or is simply absent. It names
 * the file's fault, never a word of what is in it.
 */
function localConfigError(string $name): ?string
{
    return _localConfigRead($name)['error'];
}

/** @return array{value: mixed, error: ?string} */
function _localConfigRead(string $name): array
{
    static $read = [];

    if (!array_key_exists($name, $read)) {
        $file = localConfigPath($name);
        $read[$name] = is_file($file) ? localConfigFileRead($file) : ['value' => null, 'error' => null];
        localConfigReport($name, $read[$name]['error']);
    }

    return $read[$name];
}

/**
 * Requires one hand-written settings file - read cleanly, or not at all - and
 * answers what it returned, or why it was passed over. Uncached: setup.php
 * reads its own token file through here, right after writing it.
 *
 * A file that does not start with <?php - saved by hand with a byte-order
 * mark, a blank line or a space before it, or without that line at all - is
 * passed over before PHP ever compiles it: required, it would print what comes
 * before (all of it, the password or the secret too, where the line is
 * missing) ahead of every answer, and one with declare(strict_types=1) after
 * such a start is a compile-time fatal error ("strict_types declaration must
 * be the very first statement") that no try, no handler and no output buffer
 * catches - every request, /api/site-status too, would be a 500 instead of
 * "not set up", and a cloudflare.local.php would never fail closed (Japanese
 * Academy's review of 2026-10-18, the anotoki family's rule since). Its first
 * five bytes are read alone, never the rest. One PHP may not open is no file
 * either. This covers a bad start only: a file that does start with <?php and
 * still cannot be compiled (a declare after another statement) stays a fatal
 * error PHP raises before anything here can act - nothing printed, nothing
 * served looser - and no slip of the hand makes one.
 *
 * A file that does start with it is required inside a closure of its own, so
 * it sees none of the caller's variables, with whatever it prints all the
 * same caught - text after a closing tag, an echo, a buffer of its own left
 * open: it goes nowhere, and the file is no file, its fault the number of
 * bytes it printed. One PHP cannot parse or run (a ParseError, an Error) is no
 * file either, said by the kind of error and its line alone - never the
 * error's message, which can quote the file.
 *
 * @return array{value: mixed, error: ?string}
 */
function localConfigFileRead(string $file): array
{
    $head = @file_get_contents($file, false, null, 0, 5);
    if ($head === false) {
        return ['value' => null, 'error' => 'cannot be read (PHP may not open it)'];
    }
    if (strtolower($head) !== '<?php') {
        return ['value' => null, 'error' => 'does not start with <?php (a byte-order mark, a blank line or a space before it, or no <?php line at all)'];
    }

    $level = ob_get_level();
    $value = null;
    $failure = null;
    $printed = 0;

    ob_start();
    try {
        $value = (static fn(string $path): mixed => require $path)($file);
    } catch (\Throwable $e) {
        $failure = 'cannot be read (' . get_class($e) . ' on line ' . $e->getLine() . ')';
    } finally {
        // Every buffer down to the caller's, one the file opened and left open included.
        while (ob_get_level() > $level) {
            $buffer = ob_get_clean();
            if ($buffer === false) {
                break;
            }
            $printed += strlen($buffer);
        }
    }

    if ($failure !== null) {
        return ['value' => null, 'error' => $failure];
    }
    if ($printed > 0) {
        return ['value' => null, 'error' => "prints {$printed} bytes of its own (text after a closing tag, or something it echoes)"];
    }

    return ['value' => $value, 'error' => null];
}

/**
 * A settings file passed over, to the PHP log - once, not on every request:
 * what was said is remembered (its hash, in
 * storage/cache/settings-reported-{name}) and not written again until it
 * changes; a file mended and broken again is said again. By its fault alone,
 * never a word of the file. A storage that cannot be written says it on every
 * request, which is noisy but never silent. What the file's absence means
 * (not set up, a default, a secret no request carries) is said by whoever
 * reads it.
 */
function localConfigReport(string $name, ?string $error): void
{
    $marker = siteStateRoot() . '/storage/cache/settings-reported-' . preg_replace('/[^a-z0-9_-]/', '', strtolower($name));
    $said = $error === null ? '' : hash('sha256', $error);

    clearstatcache(true, $marker);
    $before = is_file($marker) ? (string) @file_get_contents($marker) : '';
    if ($said === $before) {
        return;
    }
    if ($error !== null) {
        error_log("[settings] config/{$name}.local.php {$error}: it is passed over, nothing in it read");
    }
    if (!is_dir(dirname($marker))) {
        @mkdir(dirname($marker), 0775, true);
    }
    @file_put_contents($marker, $said, LOCK_EX);
}

/**
 * The site secret - secret.local.php, or jwt.local.php under the name it had
 * before the IAM - or null when neither holds one.
 *
 * At least 32 characters, or it is not treated as one: a short secret is a
 * guessable one, and failing closed is the point of not having a default.
 */
function localSecret(): ?string
{
    foreach (['secret', 'jwt'] as $name) {
        $value = localConfig($name);
        if (is_string($value) && strlen($value) >= 32) {
            return $value;
        }
    }

    return null;
}

/**
 * `scheme://host[:port]` of an address, lower-cased, or null when it is not an
 * http(s) address with nothing after the host.
 *
 * This is the one spelling of an address the rest compares with: the IAM's
 * issuer is compared character for character.
 */
function localConfigOrigin(mixed $address): ?string
{
    if (!is_string($address)) {
        return null;
    }

    $address = rtrim(trim($address), '/');

    if (!preg_match('#^(https?)://([a-z0-9.\-]+|\[[0-9a-f:.]+\])(:\d{1,5})?$#i', $address, $m)) {
        return null;
    }

    return strtolower($m[1] . '://' . $m[2]) . ($m[3] ?? '');
}

/**
 * What is missing or unusable, a sentence each - empty when the site is set up.
 *
 * Shape only. Whether the database answers is a different failure - a 500 with
 * the reason in the log - and not one that writing a file would fix.
 */
function localConfigProblems(): array
{
    $problems = [];

    foreach (LOCAL_CONFIG_REQUIRED as $name) {
        if (localConfigError($name) !== null) {
            $problems[] = "config/{$name}.local.php " . localConfigError($name) . ': it is passed over, nothing in it read.';
        }
    }

    // Optional, but never guessed: without the file the site is genshin_impact; with one that cannot be read, or
    // names no site, which site this is is unknown - and reading genshin_impact's settings and page switches in
    // another site's database would find none of them (no maintenance, no page locked): not set up instead.
    if (is_file(localConfigPath('site'))) {
        if (localConfigError('site') !== null) {
            $problems[] = 'config/site.local.php ' . localConfigError('site') . ': which site this is cannot be told.';
        } elseif (!is_string(localConfig('site')) || trim(localConfig('site')) === '') {
            $problems[] = 'config/site.local.php names no site: it returns ' . get_debug_type(localConfig('site')) . ', not a site\'s code.';
        }
    }

    $database = localConfig('database');
    if (!is_array($database)) {
        $problems[] = 'config/database.local.php is missing: the database connection.';
    } elseif ((!is_string($database['database'] ?? null) || trim($database['database']) === '') && is_array($database['databases'] ?? null)) {
        // The two-database layout: running on it would find half the tables
        // missing, and setup.php saving over it would start that half empty.
        $problems[] = databaseTwoDatabasesMessage();
    } elseif (empty($database['host']) || empty($database['port']) || !isset($database['username']) || !is_string($database['database'] ?? null) || trim($database['database']) === '') {
        $problems[] = 'config/database.local.php does not name the host, port, username and database.';
    }

    if (localSecret() === null) {
        $problems[] = 'config/secret.local.php is missing: the site secret.';
    }

    $iam = localConfig('iam');
    if (!is_array($iam)) {
        $problems[] = 'config/iam.local.php is missing: where people sign in.';
    } elseif (localConfigOrigin($iam['issuer'] ?? null) === null || trim((string) ($iam['client_id'] ?? '')) === '') {
        $problems[] = 'config/iam.local.php does not give the IAM\'s address and this site\'s client id there.';
    }

    return $problems;
}

/**
 * What a checkout still set up with two databases is told, wherever it asks -
 * the API's not_set_up answer, setup.php, the command-line scripts.
 */
function databaseTwoDatabasesMessage(): string
{
    return 'config/database.local.php still names two databases, from before the site kept everything in one. ' .
        'Move the second into the first with `php merge-databases.php` in backend/ - it copies every row and then ' .
        'rewrites that file.';
}

/** Throws, naming the file that setup.php would write. */
function notSetUp(string $file, string $what): never
{
    throw new NotSetUpException(
        "This installation is not set up: config/{$file} ({$what}) is missing or incomplete. " .
            'Run setup.php - in development, `composer start` in backend/ and open ' .
            'http://localhost:8000/setup.php.',
    );
}
