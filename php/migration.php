<?php

/**
 * migration.php - builds every database from its migrations, and nothing else
 *
 *   php migration.php              create what is missing, apply what is pending
 *   php migration.php --status     say what has run and what has not
 *   php migration.php --dry-run    say what would be applied, and apply nothing
 *   php migration.php --db=users   one database rather than all of them
 *
 * WHAT CHANGED, AND WHY
 *
 * There used to be two schema files - schema_pgsql_users.sql and
 * schema_pgsql_genshin_impact.sql - each holding the whole shape of a database
 * as it currently stood, next to a migrations/ folder holding the same shape
 * as a sequence of changes. Two descriptions of one thing, and nothing keeping
 * them in step: by the time they were deleted, the language table had four
 * columns in the schema file and one in the migration that created it, and the
 * character roles table had two different names.
 *
 * That is not a bug that gets fixed, it is a bug that recurs. A schema file is
 * only right until the next migration, and the only way to keep one honest is
 * to remember, every time, to change it too.
 *
 * So the migrations are the description now, and there is one of them. A
 * database is what you get by applying 001 and then everything after it, in
 * order, and that includes the rows the migrations insert - the languages, the
 * sites, every translated string. A database built here today is the same
 * database as one built from the same folder a year from now.
 *
 * Two scripts went with the schema files. migration_pgsql.php and its MySQL
 * twin generated migrations by diffing a schema file against a replay of the
 * migrations folder - which cannot mean anything without a schema file to diff
 * against, and which is also how the drift got in: a generated ALTER is a
 * guess about intent, and a renamed column is indistinguishable from a dropped
 * one and an added one. Migrations are written by hand now. init.php went too:
 * creating the database and applying the first migration are the first two
 * things this does.
 *
 * WHAT IT WILL NOT DO
 *
 * It will not un-apply anything. There is no down migration here and there is
 * not meant to be: the ones that matter are irreversible anyway - a dropped
 * column does not remember what was in it - and a rollback that half works is
 * worse than one that was never offered.
 *
 * A file already recorded in `migrations` is never run again, so editing one
 * that has been applied changes nothing on a database that has it and
 * everything on a database that has not. Write another file instead.
 */

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/config/db.php';

const MIGRATIONS_ROOT = __DIR__ . '/migrations';

/** Made for the `users` database when it has nobody in it at all. */
const DEFAULT_ADMIN_USERNAME = 'admin';
const DEFAULT_ADMIN_EMAIL = 'admin@localhost';
const DEFAULT_ADMIN_PASSWORD = 'Admin1234!';

// ─── Output ──────────────────────────────────────────────────────────────────

function colour(string $colour, string $text): string
{
    $codes = ['red' => 31, 'green' => 32, 'yellow' => 33, 'blue' => 34, 'cyan' => 36, 'grey' => 90];

    return "\033[" . ($codes[$colour] ?? 0) . "m" . $text . "\033[0m";
}

function say(string $colour, string $text): void
{
    echo colour($colour, $text) . "\n";
}

// ─── Reading SQL ─────────────────────────────────────────────────────────────

/**
 * Splits a SQL file into statements.
 *
 * A semicolon only ends a statement outside everything that can contain one:
 * a quoted string, a dollar-quoted block - which is how every trigger function
 * in the initial schema is written - and a comment. Getting any of those wrong
 * means half a function body arriving as a statement of its own.
 */
function splitSqlStatements(string $sql): array
{
    $statements = [];
    $current = '';
    $length = strlen($sql);
    $i = 0;

    while ($i < $length) {
        $character = $sql[$i];

        // Block comment.
        if ($character === '/' && ($sql[$i + 1] ?? '') === '*') {
            $end = strpos($sql, '*/', $i + 2);
            $i = $end === false ? $length : $end + 2;
            continue;
        }

        // Line comment.
        if ($character === '-' && ($sql[$i + 1] ?? '') === '-') {
            $end = strpos($sql, "\n", $i + 2);
            $i = $end === false ? $length : $end + 1;
            continue;
        }

        // Dollar-quoted block: $$ ... $$, or $tag$ ... $tag$.
        if ($character === '$') {
            $j = $i + 1;
            while ($j < $length && $sql[$j] !== '$' && (ctype_alnum($sql[$j]) || $sql[$j] === '_')) {
                $j++;
            }

            if (($sql[$j] ?? '') === '$') {
                $tag = substr($sql, $i, $j - $i + 1);
                $end = strpos($sql, $tag, $j + 1);

                if ($end !== false) {
                    $current .= substr($sql, $i, $end - $i + strlen($tag));
                    $i = $end + strlen($tag);
                    continue;
                }
            }
        }

        // Single-quoted string, in which '' is an escaped quote.
        if ($character === "'") {
            $current .= $character;
            $i++;

            while ($i < $length) {
                $current .= $sql[$i];

                if ($sql[$i] === "'") {
                    if (($sql[$i + 1] ?? '') === "'") {
                        $current .= $sql[++$i];
                    } else {
                        $i++;
                        break;
                    }
                }

                $i++;
            }

            continue;
        }

        if ($character === ';') {
            if (trim($current) !== '') {
                $statements[] = trim($current);
            }
            $current = '';
            $i++;
            continue;
        }

        $current .= $character;
        $i++;
    }

    if (trim($current) !== '') {
        $statements[] = trim($current);
    }

    return $statements;
}

/** The migration files for one database, in the order they must be applied. */
function migrationFiles(string $alias): array
{
    $directory = MIGRATIONS_ROOT . '/' . $alias;

    if (!is_dir($directory)) {
        return [];
    }

    $files = array_map('basename', glob($directory . '/*.sql') ?: []);

    // By name, which is why they are numbered. Natural order rather than plain
    // string order, so a hundredth migration does not sort between the ninth
    // and the tenth.
    natsort($files);

    return array_values($files);
}

// ─── Creating the database ───────────────────────────────────────────────────

/**
 * Makes the database if it is not there, and answers whether it had to.
 *
 * CREATE DATABASE cannot run inside a transaction and cannot run against the
 * database it is creating, so this connects to the server rather than through
 * getDb().
 */
function ensureDatabase(array $config, string $name): bool
{
    $driver = $config['driver'];

    if ($driver === 'pgsql') {
        $server = new PDO(
            "pgsql:host={$config['host']};port={$config['port']};dbname=postgres",
            $config['username'],
            $config['password'],
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        $exists = (int) $server
            ->query('SELECT count(*) FROM pg_catalog.pg_database WHERE datname = ' . $server->quote($name))
            ->fetchColumn();

        if ($exists > 0) {
            return false;
        }

        // The name comes from the deployment's own config file rather than
        // from anything a request could reach, and CREATE DATABASE takes no
        // parameters - so it is quoted as an identifier and that is the whole
        // of what can be done about it.
        $server->exec('CREATE DATABASE "' . str_replace('"', '""', $name) . '"');

        return true;
    }

    throw new RuntimeException(
        "Unsupported driver '{$driver}'. This installation is PostgreSQL: the migrations use "
        . "ADD COLUMN IF NOT EXISTS, FILTER, and dollar-quoted trigger functions, none of which MySQL has."
    );
}

/**
 * The table that records what has run.
 *
 * Created here as well as by every 001, because it is read before the first
 * migration is applied - on a database where nothing exists yet, including
 * this.
 */
function ensureMigrationsTable(PDO $pdo): void
{
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS migrations (
            id         SERIAL          PRIMARY KEY,
            filename   VARCHAR(255)    NOT NULL UNIQUE,
            applied_at TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
        )'
    );
}

function appliedMigrations(PDO $pdo): array
{
    return $pdo->query('SELECT filename FROM migrations')->fetchAll(PDO::FETCH_COLUMN);
}

/**
 * Applies one file, all of it or none of it.
 *
 * PostgreSQL takes DDL inside a transaction, so a migration that fails halfway
 * leaves nothing behind - and the row saying it ran is written inside the same
 * transaction, so there is no window where the change happened and the record
 * of it did not.
 */
function applyMigration(PDO $pdo, string $alias, string $filename): void
{
    $path = MIGRATIONS_ROOT . '/' . $alias . '/' . $filename;
    $statements = splitSqlStatements((string) file_get_contents($path));

    $pdo->beginTransaction();

    try {
        foreach ($statements as $index => $statement) {
            try {
                $pdo->exec($statement);
            } catch (PDOException $e) {
                throw new RuntimeException(
                    "statement " . ($index + 1) . " of " . count($statements) . ": " . $e->getMessage()
                    . "\n\n  " . implode("\n  ", array_slice(explode("\n", $statement), 0, 6))
                );
            }
        }

        $pdo->prepare('INSERT INTO migrations (filename) VALUES (?) ON CONFLICT DO NOTHING')->execute([$filename]);
        $pdo->commit();
    } catch (\Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}

/**
 * The account somebody has to sign in with to make any others.
 *
 * Only when the table is empty, so it is a way to start rather than a way in:
 * on a database with users on it this does nothing at all.
 */
function ensureDefaultAdmin(PDO $pdo): void
{
    if ((int) $pdo->query('SELECT count(*) FROM users')->fetchColumn() > 0) {
        return;
    }

    $pdo->prepare('INSERT INTO users (username, email, password, role, force_password_change) VALUES (?, ?, ?, ?, TRUE)')
        ->execute([
            DEFAULT_ADMIN_USERNAME,
            DEFAULT_ADMIN_EMAIL,
            password_hash(DEFAULT_ADMIN_PASSWORD, PASSWORD_DEFAULT),
            'ADMIN',
        ]);

    say('green', "\n  Default admin created.");
    echo '    username : ' . DEFAULT_ADMIN_USERNAME . "\n";
    echo '    email    : ' . DEFAULT_ADMIN_EMAIL . "\n";
    echo '    password : ' . DEFAULT_ADMIN_PASSWORD . "\n";
    // The flag is set on the row, so the site asks for a new one on the way in
    // rather than trusting anybody to come back and do it later.
    say('yellow', '    The site will ask for a new password at the first sign-in.');
}

// ─── Doing it ────────────────────────────────────────────────────────────────

$options = getopt('', ['status', 'dry-run', 'apply-only', 'db::', 'help']);

if (isset($options['help'])) {
    echo file_get_contents(__FILE__, false, null, 0, 1200);
    exit(0);
}

$statusOnly = isset($options['status']);
// --dry-run and the old --apply-only, which named what is now simply the
// default. Kept so anything already written against it keeps working.
$dryRun = isset($options['dry-run']);
$only = isset($options['db']) ? (string) $options['db'] : null;

$config = require __DIR__ . '/config/database.local.php';
$databases = $config['databases'] ?? [];

if (!$databases) {
    say('red', 'No databases in config/database.local.php.');
    exit(1);
}

if ($only !== null && !isset($databases[$only])) {
    say('red', "No database aliased '{$only}'. This config has: " . implode(', ', array_keys($databases)));
    exit(1);
}

$exitCode = 0;
$appliedAnything = false;

foreach ($databases as $alias => $name) {
    if ($only !== null && $alias !== $only) {
        continue;
    }

    say('cyan', "\n══ " . $alias . ' (' . $name . ') ' . str_repeat('═', max(0, 40 - strlen($alias . $name))));

    $files = migrationFiles($alias);

    if (!$files) {
        // Not an error. The config lists star_rail, which is a database this
        // installation intends to have and has not written a line of yet.
        say('grey', '  No migrations/' . $alias . '/ - nothing to build.');
        continue;
    }

    try {
        if (!$statusOnly && !$dryRun && ensureDatabase($config, $name)) {
            say('green', "  Database created.");
        }

        $pdo = getDb($alias);
        ensureMigrationsTable($pdo);
        $applied = appliedMigrations($pdo);
    } catch (\Throwable $e) {
        say('red', '  Cannot reach it: ' . $e->getMessage());
        $exitCode = 1;
        continue;
    }

    $pending = array_values(array_diff($files, $applied));

    // A file recorded as applied that is no longer on disk. Worth saying: it
    // means somebody deleted or renamed a migration, and this database and a
    // fresh one are no longer the same database.
    $missing = array_values(array_diff($applied, $files));

    if ($statusOnly) {
        foreach ($files as $file) {
            $done = in_array($file, $applied, true);
            echo '  ' . ($done ? colour('green', '✔') : colour('yellow', '·')) . ' ' . $file
                . ($done ? '' : colour('yellow', '   pending')) . "\n";
        }
        printf("  %d applied, %d pending\n", count($files) - count($pending), count($pending));

        foreach ($missing as $file) {
            say('red', "  ! {$file} is recorded as applied but is not in migrations/{$alias}/");
        }

        continue;
    }

    foreach ($missing as $file) {
        say('red', "  ! {$file} is recorded as applied but is not in migrations/{$alias}/");
    }

    if (!$pending) {
        say('green', '  Up to date - ' . count($files) . ' migrations.');
    }

    foreach ($pending as $file) {
        if ($dryRun) {
            say('yellow', '  would apply ' . $file);
            continue;
        }

        echo '  ' . $file . ' ... ';

        try {
            applyMigration($pdo, $alias, $file);
            say('green', 'done');
            $appliedAnything = true;
        } catch (\Throwable $e) {
            say('red', 'FAILED');
            say('red', '    ' . $e->getMessage());
            say('yellow', '    Nothing from this file was applied. The migrations before it stand.');
            $exitCode = 1;
            // On to the next database: everything after this file in this one
            // is written expecting it to have run.
            continue 2;
        }
    }

    if (!$dryRun && $alias === 'users') {
        try {
            ensureDefaultAdmin($pdo);
        } catch (\Throwable $e) {
            say('red', '  Could not create the default admin: ' . $e->getMessage());
            $exitCode = 1;
        }
    }
}

if ($dryRun) {
    say('grey', "\n--dry-run: nothing was written.");
} elseif ($appliedAnything) {
    say('cyan', "\nDone.");
}

exit($exitCode);
