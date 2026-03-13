<?php

print_r(PDO::getAvailableDrivers());

/**
 * Init script — run once from CLI:
 *   php init.php [schema.sql]
 *
 * Supports multiple databases defined as a comma-separated list in config:
 *   'dbname' => 'users,genshin_impact,star_rail'
 *
 * For each database:
 *   1. Creates the database if it does not exist yet.
 *   2. Applies the matching schema file as the initial migration
 *      (skipped if already applied). Schema file resolution order:
 *        a. CLI argument (only used for single-database setups)
 *        b. schema_{driver}_{dbname}.sql  (e.g. schema_pgsql_users.sql)
 *        c. schema_{driver}.sql           (fallback, single schema)
 *        d. schema.sql                    (last resort fallback)
 *   3. Migrations are tracked per database in ./migrations/{dbname}/
 *   4. Creates a default admin account in the 'users' database if no users exist:
 *        username : admin
 *        email    : admin@localhost
 *        password : Admin1234!
 *
 * Change the password immediately after first login via:
 *   PUT /api/auth/password   (Bearer token required)
 */

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/config/db.php';

define('DEFAULT_ADMIN_USERNAME', 'admin');
define('DEFAULT_ADMIN_EMAIL', 'admin@localhost');
define('DEFAULT_ADMIN_PASSWORD', 'Admin1234!');

define('INIT_MIGRATION', '001_initial_schema.sql');

// ─── HELPER ──────────────────────────────────────────────────────────────────

/**
 * Split a SQL string into individual statements, respecting:
 *   - PostgreSQL $$ dollar-quoted blocks (which may contain semicolons)
 *   - Single-quoted string literals
 *   - -- line comments and /* block comments (outside quoted contexts)
 */
function splitSqlStatements(string $sql): array
{
    $statements = [];
    $current = '';
    $len = strlen($sql);
    $i = 0;

    while ($i < $len) {
        $ch = $sql[$i];

        // ── Block comment /* ... */ ───────────────────────────────────────────
        if ($ch === '/' && isset($sql[$i + 1]) && $sql[$i + 1] === '*') {
            $end = strpos($sql, '*/', $i + 2);
            $i = $end === false ? $len : $end + 2;
            continue;
        }

        // ── Line comment -- ... \n ────────────────────────────────────────────
        if ($ch === '-' && isset($sql[$i + 1]) && $sql[$i + 1] === '-') {
            $end = strpos($sql, "\n", $i + 2);
            $i = $end === false ? $len : $end + 1;
            continue;
        }

        // ── Dollar-quoted string $tag$ ... $tag$ ─────────────────────────────
        if ($ch === '$') {
            // Find the closing $ of the opening tag
            $j = $i + 1;
            while ($j < $len && $sql[$j] !== '$' && (ctype_alnum($sql[$j]) || $sql[$j] === '_')) {
                $j++;
            }
            if (isset($sql[$j]) && $sql[$j] === '$') {
                $tag = substr($sql, $i, $j - $i + 1); // e.g. $$ or $body$
                $endPos = strpos($sql, $tag, $j + 1);
                if ($endPos !== false) {
                    $current .= substr($sql, $i, $endPos - $i + strlen($tag));
                    $i = $endPos + strlen($tag);
                    continue;
                }
            }
        }

        // ── Single-quoted string '...' (with '' escape) ──────────────────────
        if ($ch === "'") {
            $current .= $ch;
            $i++;
            while ($i < $len) {
                $current .= $sql[$i];
                if ($sql[$i] === "'" && (!isset($sql[$i + 1]) || $sql[$i + 1] !== "'")) {
                    $i++;
                    break;
                }
                if ($sql[$i] === "'" && isset($sql[$i + 1]) && $sql[$i + 1] === "'") {
                    $current .= $sql[++$i]; // consume second '
                }
                $i++;
            }
            continue;
        }

        // ── Statement delimiter ───────────────────────────────────────────────
        if ($ch === ';') {
            $stmt = trim($current);
            if ($stmt !== '') {
                $statements[] = $stmt;
            }
            $current = '';
            $i++;
            continue;
        }

        $current .= $ch;
        $i++;
    }

    $stmt = trim($current);
    if ($stmt !== '') {
        $statements[] = $stmt;
    }

    return $statements;
}

/**
 * Resolve schema file for a given database name.
 * Priority: schema_{driver}_{dbname}.sql → schema_{driver}.sql → schema.sql
 */
function resolveSchemaFile(string $dir, string $driver, string $dbname): ?string
{
    $candidates = [
        "{$dir}/schema_{$driver}_{$dbname}.sql",
        // "{$dir}/schema_{$driver}.sql",
        // "{$dir}/schema.sql",
    ];
    foreach ($candidates as $path) {
        if (file_exists($path)) {
            return $path;
        }
    }
    return null;
}

// ─── 1. LOAD CONFIG ──────────────────────────────────────────────────────────

$dbConfig = require __DIR__ . '/config/database.local.php';

$driver = $dbConfig['driver'];
$host = $dbConfig['host'];
$port = $dbConfig['port'];
$user = $dbConfig['username'];
$pass = $dbConfig['password'];
$charset = $dbConfig['charset'];

// 'databases' maps alias → actual DB name. Alias is used for schema files and migrations dir.
$databases = $dbConfig['databases'];

// Schema file override from CLI (only meaningful for single-db setups)
$schemaArgOverride = null;
foreach (array_slice($argv, 1) as $arg) {
    if (!str_starts_with($arg, '--')) {
        $schemaArgOverride = str_starts_with($arg, '/') ? $arg : __DIR__ . '/' . $arg;
        if (!file_exists($schemaArgOverride)) {
            echo "Schema file not found: {$schemaArgOverride}\n";
            exit(1);
        }
        break;
    }
}

// ─── 2. PROCESS EACH DATABASE ────────────────────────────────────────────────

foreach ($databases as $alias => $dbName) {
    $dbName = trim($dbName);
    echo "\n=== Database: {$dbName} (alias: {$alias}) ===\n";

    // ── 2a. CREATE DATABASE IF NOT EXISTS ────────────────────────────────────

    if ($driver === 'mysql') {
        try {
            $rootPdo = new PDO(
                "mysql:host={$host};port={$port};charset={$charset}",
                $user,
                $pass,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );
            $rootPdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET {$charset} COLLATE {$charset}_unicode_ci");
            echo "Database `{$dbName}` is ready.\n";
        } catch (PDOException $e) {
            echo "Failed to create database `{$dbName}`: " . $e->getMessage() . "\n";
            exit(1);
        }
    } elseif ($driver === 'pgsql') {
        try {
            $rootPdo = new PDO(
                "pgsql:host={$host};port={$port};dbname=postgres",
                $user,
                $pass,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );
            $exists = (int) $rootPdo->query(
                "SELECT COUNT(*) FROM pg_catalog.pg_database WHERE datname = " . $rootPdo->quote($dbName)
            )->fetchColumn();

            if ($exists === 0) {
                $rootPdo->exec("CREATE DATABASE \"{$dbName}\"");
                echo "Database \"{$dbName}\" created.\n";
            } else {
                echo "Database \"{$dbName}\" already exists.\n";
            }
        } catch (PDOException $e) {
            echo "Failed to create database \"{$dbName}\": " . $e->getMessage() . "\n";
            exit(1);
        }
    } else {
        echo "Unsupported driver: {$driver}. Supported: mysql, pgsql\n";
        exit(1);
    }

    // ── 2b. CONNECT TO THE DATABASE ──────────────────────────────────────────

    try {
        $pdo = getDb($alias);
    } catch (PDOException $e) {
        echo "Failed to connect to \"{$dbName}\": " . $e->getMessage() . "\n";
        exit(1);
    }

    // ── 2c. RESOLVE SCHEMA FILE ───────────────────────────────────────────────
    // Schema files are named after the alias, not the actual DB name.
    // e.g. schema_pgsql_genshin_impact.sql for alias 'genshin_impact'

    if ($schemaArgOverride !== null && count($databases) === 1) {
        $schemaFile = $schemaArgOverride;
    } else {
        $schemaFile = resolveSchemaFile(__DIR__, $driver, $alias);
        if ($schemaFile === null) {
            echo "No schema file found for alias \"{$alias}\". Tried:\n";
            echo "  schema_{$driver}_{$alias}.sql\n";
            echo "Skipping schema for \"{$alias}\".\n";
            continue;
        }
    }

    echo "Using schema: " . basename($schemaFile) . "\n";

    // ── 2d. APPLY INITIAL MIGRATION ───────────────────────────────────────────
    // Migrations are tracked per alias in ./migrations/{alias}/

    $migrationsDir = __DIR__ . '/migrations/' . $alias;

    try {
        $rawSql = file_get_contents($schemaFile);
        $statements = splitSqlStatements($rawSql);

        foreach ($statements as $statement) {
            $pdo->exec($statement);
        }

        // Check if the initial migration was already logged
        $already = (int) $pdo->query(
            "SELECT COUNT(*) FROM migrations WHERE filename = " . $pdo->quote(INIT_MIGRATION)
        )->fetchColumn();

        if ($already > 0) {
            echo "Initial migration already applied. Skipping.\n";
        } else {
            if (!is_dir($migrationsDir)) {
                mkdir($migrationsDir, 0755, true);
            }

            $migrationPath = $migrationsDir . '/' . INIT_MIGRATION;
            if (!file_exists($migrationPath)) {
                copy($schemaFile, $migrationPath);
            }

            if ($driver === 'mysql') {
                $pdo->prepare("INSERT INTO migrations (filename) VALUES (?)")
                    ->execute([INIT_MIGRATION]);
            } else {
                $pdo->prepare("INSERT INTO migrations (filename) VALUES (?) ON CONFLICT DO NOTHING")
                    ->execute([INIT_MIGRATION]);
            }

            echo "Schema applied and logged as " . INIT_MIGRATION . ".\n";
        }

    } catch (PDOException $e) {
        echo "Migration error for \"{$dbName}\": " . $e->getMessage() . "\n";
        exit(1);
    }

    // ── 2e. CREATE DEFAULT ADMIN (users database only) ────────────────────────

    if ($alias === 'users') {
        try {
            $count = (int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();

            if ($count > 0) {
                echo "Users table already has {$count} user(s). Skipping default admin.\n";
            } else {
                $stmt = $pdo->prepare(
                    'INSERT INTO users (username, email, password, role)
                     VALUES (?, ?, ?, ?)'
                );
                $stmt->execute([
                    DEFAULT_ADMIN_USERNAME,
                    DEFAULT_ADMIN_EMAIL,
                    password_hash(DEFAULT_ADMIN_PASSWORD, PASSWORD_DEFAULT),
                    'ADMIN',
                ]);

                echo "\nDefault ADMIN account created.\n";
                echo "  username : " . DEFAULT_ADMIN_USERNAME . "\n";
                echo "  email    : " . DEFAULT_ADMIN_EMAIL . "\n";
                echo "  password : " . DEFAULT_ADMIN_PASSWORD . "\n";
                echo "\nPlease change the password immediately after first login!\n";
            }
        } catch (PDOException $e) {
            echo "Failed to create ADMIN user: " . $e->getMessage() . "\n";
            exit(1);
        }
    }
}

echo "\nDone.\n";
