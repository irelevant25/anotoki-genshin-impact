<?php

declare(strict_types=1);

/**
 * What the tests that need a database load after tests/lib.php: databases of
 * their own on this computer's PostgreSQL - genshin_test_<what>_<random>,
 * dropped when the file ends, whatever happened - built with the site's own
 * engine from its own migrations, and a backend of their own to run the API
 * in, so nothing a test does reaches your database, your settings, your logs
 * or your storage.
 *
 * The server and its user are borrowed from config/database.local.php (which
 * setup.php writes): the database named there is never opened, and the file
 * is read where it is - never copied, so the password is in no temporary
 * file and never printed. Without it, a file that needs a database says it is
 * skipped and checks nothing. The user needs CREATEDB, as it does for
 * setup.php's own "Save creates it".
 */

use Anotoki\Lib\Migrations\MigrationSet;
use Anotoki\Lib\Migrations\Migrator;

// No autoloader here: a file that runs the API loads the backend copy's own
// (with its api/index.php), and two of them in one process would collide. A
// file that uses the engine directly loads backend/vendor/autoload.php itself.

const TEST_DATABASE_CONFIG = TEST_BACKEND . '/config/database.local.php';

/** The development server's connection, without a database of its own - or null without config/database.local.php. */
function testServerConfig(): ?array
{
    if (!is_file(TEST_DATABASE_CONFIG)) {
        return null;
    }
    $config = require TEST_DATABASE_CONFIG;
    if (!is_array($config) || ($config['driver'] ?? 'pgsql') !== 'pgsql' || !isset($config['host'], $config['username'])) {
        return null;
    }

    return ['host' => (string) $config['host'], 'port' => (string) ($config['port'] ?? '5432'), 'username' => (string) $config['username']];
}

/** Ends the file - skipped, not failed - when there is no server to borrow. */
function testNeedsDatabase(): void
{
    if (testServerConfig() === null) {
        echo "  skipped: there is no config/database.local.php to borrow a PostgreSQL server from (setup.php writes it)\n";
        exit(0);
    }
}

/** A connection to one database on the borrowed server, set up as the site's own getDb() is. */
function testPdo(string $database): PDO
{
    $server = testServerConfig() ?? throw new RuntimeException('no database server to borrow');
    $config = require TEST_DATABASE_CONFIG;
    $pdo = new PDO("pgsql:host={$server['host']};port={$server['port']};dbname={$database}", $server['username'], (string) ($config['password'] ?? ''));
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->exec("SET NAMES 'utf8'");

    return $pdo;
}

/**
 * A new database - empty, or a copy of $template (which nobody may be
 * connected to) - dropped when the file ends.
 */
function testDatabase(string $label, ?string $template = null): string
{
    $name = 'genshin_test_' . $label . '_' . bin2hex(random_bytes(4));
    if (preg_match('/^genshin_test_[a-z0-9_]+$/D', $name) !== 1) {
        throw new InvalidArgumentException("not a test database's name: $name");
    }
    testPdo('postgres')->exec('CREATE DATABASE "' . $name . '"' . ($template === null ? '' : ' TEMPLATE "' . $template . '"'));
    $GLOBALS['TEST_CLEANUP'][] = static function () use ($name): void {
        $server = testPdo('postgres');
        $server->exec("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$name' AND pid <> pg_backend_pid()");
        $server->exec('DROP DATABASE IF EXISTS "' . $name . '"');
    };

    return $name;
}

/**
 * Builds a database with the site's engine, as the installer would, in the
 * sets' own order (migrationSetNames()): every folder whole, or a folder only
 * up to the file $upTo names (set => file name), the rest of it left for
 * later. The library's sets are among them only where $upTo names them too -
 * a database as it stood before a release brought them (anotoki_translations
 * up to 002 for one installed before 0.4) - and siteMigrator() brings the rest
 * of them, with whatever else was left. Needs api/migration_runner.php loaded.
 *
 * @param array<string, string> $upTo
 * @return array the engine's answer: applied, failed, error, busy, note
 */
function testMigrate(PDO $pdo, array $upTo = []): array
{
    $sets = [];
    foreach (migrationSetNames() as $name) {
        $folder = in_array($name, MIGRATION_FOLDERS, true);
        if (!$folder && !isset($upTo[$name])) {
            continue;
        }
        $source = $folder ? migrationsRoot() . '/' . $name : libraryMigrationSet($name)->directory;
        if (!isset($upTo[$name])) {
            $sets[] = new MigrationSet($name, $source);
            continue;
        }
        $copy = testTempDir("migrations-$name");
        foreach (glob("$source/*.sql") ?: [] as $file) {
            if (strnatcmp(basename($file), $upTo[$name]) <= 0) {
                copy($file, "$copy/" . basename($file));
            }
        }
        $sets[] = $folder ? new MigrationSet($name, $copy) : MigrationSet::library($name, $copy);
    }

    return (new Migrator($pdo, $sets, ['lock' => MIGRATION_LOCK, 'prepare' => ensureMigrationsTable(...)]))->apply();
}

/**
 * A backend of the test's own in a temporary folder - the code (api/,
 * config/'s loaders, vendor/, migrations/) copied as it is, and settings of
 * its own: the test database, a secret, and an IAM that is only a key set on
 * disk (the SDK's jwks_file) with its answer about this site on disk too
 * (application_file). The database's connection is read from the developer's
 * own file at run time, never written down. Answers the folder.
 *
 * @param array<string, mixed> $iam  what config/iam.local.php holds besides the issuer and client id
 */
function testBackendCopy(string $database, array $iam): string
{
    $dir = testTempDir('backend');
    foreach (['api', 'vendor', 'migrations'] as $folder) {
        testCopyTree(TEST_BACKEND . "/$folder", "$dir/$folder");
    }
    mkdir("$dir/config");
    foreach (glob(TEST_BACKEND . '/config/*.php') ?: [] as $file) {
        if (!str_ends_with($file, '.local.php')) {
            copy($file, "$dir/config/" . basename($file));
        }
    }
    mkdir("$dir/storage/cache", 0777, true);

    file_put_contents("$dir/config/database.local.php", "<?php\n\n\$borrowed = require " . var_export(TEST_DATABASE_CONFIG, true) . ";\nunset(\$borrowed['databases']);\n\nreturn array_replace(\$borrowed, " . var_export(['database' => $database, 'persistent' => false], true) . ");\n");
    file_put_contents("$dir/config/secret.local.php", "<?php\n\nreturn " . var_export(bin2hex(random_bytes(32)), true) . ";\n");
    file_put_contents("$dir/config/iam.local.php", "<?php\n\nreturn " . var_export(['issuer' => TEST_ISSUER, 'client_id' => 'genshin', 'cache_dir' => "$dir/storage/cache"] + $iam, true) . ";\n");

    return $dir;
}

/** The issuer the test tokens name, as config/iam.local.php has it in development. */
const TEST_ISSUER = 'http://localhost:4300';

function testCopyTree(string $from, string $to): void
{
    if (is_dir($from)) {
        @mkdir($to, 0777, true);
        foreach (scandir($from) ?: [] as $entry) {
            if ($entry !== '.' && $entry !== '..') {
                testCopyTree("$from/$entry", "$to/$entry");
            }
        }

        return;
    }
    copy($from, $to);
}

/**
 * An IAM that is a key pair: its key set written to $dir/jwks.json (what the
 * PHP SDK reads as jwks_file) and a function minting access tokens it signs -
 * RS256, typ at+jwt, for the client `genshin`, as the real IAM's are.
 *
 * @return array{jwks: string, token: Closure(int $sub, list<string> $roles, array $claims = []): string}
 */
function testIam(string $dir): array
{
    // A key needs a configuration file on some systems (Windows), and any will do.
    file_put_contents("$dir/openssl.cnf", "[ req ]\ndistinguished_name = dn\n[ dn ]\n");
    $key = openssl_pkey_new(['private_key_bits' => 2048, 'private_key_type' => OPENSSL_KEYTYPE_RSA, 'config' => "$dir/openssl.cnf"]);
    if ($key === false) {
        throw new RuntimeException('could not make a key pair: ' . openssl_error_string());
    }
    $public = openssl_pkey_get_details($key)['rsa'];
    $b64 = static fn (string $bytes): string => rtrim(strtr(base64_encode($bytes), '+/', '-_'), '=');
    $kid = 'test-' . bin2hex(random_bytes(4));
    file_put_contents("$dir/jwks.json", json_encode(['keys' => [['kty' => 'RSA', 'kid' => $kid, 'use' => 'sig', 'alg' => 'RS256', 'n' => $b64($public['n']), 'e' => $b64($public['e'])]]]));

    $token = static function (int $sub, array $roles, array $claims = []) use ($key, $kid, $b64): string {
        $now = time();
        $head = $b64(json_encode(['alg' => 'RS256', 'typ' => 'at+jwt', 'kid' => $kid]));
        $body = $b64(json_encode($claims + [
            'iss' => TEST_ISSUER, 'aud' => 'genshin', 'sub' => (string) $sub, 'client_id' => 'genshin', 'iat' => $now, 'exp' => $now + 600,
            'sid' => "sid-$sub", 'roles' => $roles, 'preferred_username' => "person$sub", 'email' => "person$sub@example.test",
        ]));
        openssl_sign("$head.$body", $signature, $key, OPENSSL_ALGO_SHA256);

        return "$head.$body." . $b64($signature);
    };

    return ['jwks' => "$dir/jwks.json", 'token' => $token];
}
