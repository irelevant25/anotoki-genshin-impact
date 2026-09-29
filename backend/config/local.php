<?php

// ---------------------------------------------------------------------------
// config/local.php - this installation's own files, and whether it has them
// ---------------------------------------------------------------------------
// Every value that differs between one installation of the site and the next
// lives in config/*.local.php: gitignored, left out of build-dist.php, and
// written by setup.php - on a developer's machine as much as on the hosting.
//
//   database.local.php   the PostgreSQL connection and the two databases' names
//   secret.local.php     the site's own secret (a jwt.local.php from before the
//                        IAM is read in its place, which keeps valid the hashes
//                        already made with it)
//   iam.local.php        where people sign in - the IAM's address - and this
//                        site's client id there
//   app.local.php        this site's own address, and any other origin allowed
//                        to call the API from a browser
//
// Optional: backup.local.php (the pg_dump paths for the Backups page), and
// site.local.php (which site of the family this is, when not genshin_impact).
//
// Nothing committed stands in for any of them. A default is how a development
// value ends up serving production - the CORS allowlist used to name a domain
// nobody had set - so a checkout without these files is not running on
// defaults: it is not set up, and says so. Every API request is answered 503
// {"code": "not_set_up"}, pointing at /setup.php, until they are all there.
// ---------------------------------------------------------------------------

/** The files the API cannot run without, by their name before `.local.php`. */
const LOCAL_CONFIG_REQUIRED = ['database', 'secret', 'iam', 'app'];

/** Where setup.php is, from the API's own origin. */
const SETUP_PATH = '/setup.php';

/**
 * Something needed a value only setup.php can provide.
 *
 * The API never gets this far without its files - index.php turns every
 * request away first - so this is what a command-line script, or a file
 * deleted in the middle of a request, runs into.
 */
final class NotSetUpException extends RuntimeException
{
}

function localConfigPath(string $name): string
{
    return __DIR__ . '/' . $name . '.local.php';
}

/**
 * What config/{name}.local.php returns, or null when there is no such file.
 *
 * Read once per request: several are consulted on every request, and the
 * answer does not change halfway through one. A file PHP cannot even parse is
 * reported through localConfigError() and otherwise treated as missing - it is
 * no more usable than an absent one, and it should not take the whole API down
 * with a parse error on every request.
 */
function localConfig(string $name): mixed
{
    return _localConfigRead($name)['value'];
}

/** Why config/{name}.local.php could not be read, or null when it could (or is simply absent). */
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
        $read[$name] = ['value' => null, 'error' => null];

        if (is_file($file)) {
            try {
                $read[$name]['value'] = require $file;
            } catch (\Throwable $e) {
                $read[$name]['error'] = $e->getMessage();
            }
        }
    }

    return $read[$name];
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
 * This is the one spelling of an address the rest compares with: an origin is
 * exactly this, and the IAM's issuer is compared character for character.
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
            $problems[] = "config/{$name}.local.php could not be read: " . localConfigError($name);
        }
    }

    $database = localConfig('database');
    if (!is_array($database)) {
        $problems[] = 'config/database.local.php is missing: the database connection.';
    } elseif (
        empty($database['host']) || empty($database['port']) || !isset($database['username'])
        || !is_array($database['databases'] ?? null)
        || empty($database['databases']['users']) || empty($database['databases']['genshin_impact'])
    ) {
        $problems[] = 'config/database.local.php does not name the host, port, username and both databases.';
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

    $app = localConfig('app');
    if (!is_array($app)) {
        $problems[] = 'config/app.local.php is missing: this site\'s own address.';
    } elseif (localConfigOrigin($app['url'] ?? null) === null) {
        $problems[] = 'config/app.local.php does not give this site\'s address, like http://localhost:4200.';
    }

    return $problems;
}

/** Throws, naming the file that setup.php would write. */
function notSetUp(string $file, string $what): never
{
    throw new NotSetUpException(
        "This installation is not set up: config/{$file} ({$what}) is missing or incomplete. "
        . 'Run setup.php - in development, `php -S localhost:8000 router.php` in backend/ and open '
        . 'http://localhost:8000/setup.php.'
    );
}
