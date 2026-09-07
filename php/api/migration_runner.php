<?php

/**
 * The migration engine, with no opinion on who is driving.
 *
 * These functions read the files under php/migrations/{alias}/, apply the ones a
 * database has not seen, and record each in that database's `migrations` table.
 * They print nothing and read no request - so the CLI (migration.php), the admin
 * apply endpoint, and the first-run installer all build a database the same way,
 * which is the whole point of there being one description of the schema.
 *
 * See migration.php's header for why the migrations *are* the schema, and why
 * nothing here un-applies anything.
 */

/** Made for the `users` database when it has nobody in it at all. */
const DEFAULT_ADMIN_USERNAME = 'admin';
const DEFAULT_ADMIN_EMAIL = 'admin@localhost';
const DEFAULT_ADMIN_PASSWORD = 'Admin1234!';

/** php/migrations, whichever context loaded this (api/ is one level down). */
function migrationsRoot(): string
{
    return dirname(__DIR__) . '/migrations';
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
    $directory = migrationsRoot() . '/' . $alias;

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
 * getDb(). On most shared hosting the application's database user has no rights
 * to CREATE DATABASE at all - there the database is made in the control panel
 * first and this simply finds it already there.
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

/** The files on disk this database has not recorded yet, in apply order. */
function pendingMigrations(PDO $pdo, string $alias): array
{
    ensureMigrationsTable($pdo);
    return array_values(array_diff(migrationFiles($alias), appliedMigrations($pdo)));
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
    $path = migrationsRoot() . '/' . $alias . '/' . $filename;
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
 * Applies every pending file for one database, stopping at the first failure.
 *
 * Stopping is deliberate: each migration is written expecting the ones before
 * it to have run, so carrying on past a failure would apply changes against a
 * shape they were never meant for. Returns what ran, and what did not and why.
 *
 * @return array{applied: string[], failed: ?string, error: ?string}
 */
function applyPendingMigrations(PDO $pdo, string $alias): array
{
    $applied = [];

    foreach (pendingMigrations($pdo, $alias) as $filename) {
        try {
            applyMigration($pdo, $alias, $filename);
            $applied[] = $filename;
        } catch (\Throwable $e) {
            return ['applied' => $applied, 'failed' => $filename, 'error' => $e->getMessage()];
        }
    }

    return ['applied' => $applied, 'failed' => null, 'error' => null];
}

/**
 * The account somebody has to sign in with to make any others.
 *
 * Only when the table is empty, so it is a way to start rather than a way in:
 * on a database with users on it this returns null and changes nothing. The
 * password is flagged for change, so the site asks for a new one at first
 * sign-in rather than trusting anyone to come back and do it.
 *
 * @return array{username: string, email: string, password: string}|null
 */
function createDefaultAdmin(PDO $pdo, ?string $email = null, ?string $password = null): ?array
{
    if ((int) $pdo->query('SELECT count(*) FROM users')->fetchColumn() > 0) {
        return null;
    }

    $email = $email ?: DEFAULT_ADMIN_EMAIL;
    $password = $password ?: DEFAULT_ADMIN_PASSWORD;
    $username = DEFAULT_ADMIN_USERNAME;

    $pdo->prepare('INSERT INTO users (username, email, password, role, force_password_change) VALUES (?, ?, ?, ?, TRUE)')
        ->execute([$username, $email, password_hash($password, PASSWORD_DEFAULT), 'ADMIN']);

    return ['username' => $username, 'email' => $email, 'password' => $password];
}
