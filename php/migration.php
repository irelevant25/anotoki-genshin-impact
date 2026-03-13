<?php

/**
 * migration.php — Driver-aware migration dispatcher
 *
 * Reads the 'driver' and 'databases' from config/database.local.php and
 * delegates to the appropriate migration script for each database:
 *   mysql → migration_mysql.php
 *   pgsql → migration_pgsql.php
 *
 * Usage:
 *   php migration.php [schema.sql] [--status|--apply-only]
 *
 * If no schema file is given, each database resolves its own schema in order:
 *   schema_{driver}_{alias}.sql → schema_{driver}.sql → schema.sql
 *
 * Migrations are stored per-database under migrations/{alias}/.
 * All flags are forwarded to the sub-script as-is.
 * Schema is resolved per-database: schema_{driver}_{alias}.sql, then schema_{driver}.sql, then schema.sql.
 */

$dbConfig = require __DIR__ . '/config/database.local.php';
$driver = $dbConfig['driver'] ?? 'mysql';
$databases = $dbConfig['databases'] ?? [];

if (empty($databases)) {
    echo "\033[31mNo databases defined in config/database.local.php.\033[0m\n";
    exit(1);
}

$scripts = [
    'mysql' => __DIR__ . '/migration_mysql.php',
    'pgsql' => __DIR__ . '/migration_pgsql.php',
];

if (!isset($scripts[$driver])) {
    echo "\033[31mUnsupported driver: {$driver}. Supported: mysql, pgsql\033[0m\n";
    exit(1);
}

// If a schema file is explicitly provided as an argument, use it for all databases.
$schemaArg = null;
foreach (array_slice($argv, 1) as $arg) {
    if (!str_starts_with($arg, '--')) {
        $schemaArg = $arg;
        break;
    }
}

if ($schemaArg !== null) {
    $explicitSchema = str_starts_with($schemaArg, '/') ? $schemaArg : __DIR__ . '/' . $schemaArg;
    if (!file_exists($explicitSchema)) {
        echo "\033[31mSchema file not found: {$explicitSchema}\033[0m\n";
        exit(1);
    }
}

// Forward flags (--status, --apply-only) to the sub-script
$forwardFlags = array_filter(array_slice($argv, 1), fn($a) => str_starts_with($a, '--'));

$script = $scripts[$driver];
$exitCode = 0;

foreach ($databases as $alias => $dbName) {
    $migrationsDir = __DIR__ . '/migrations/' . $alias;

    echo "\033[36m\n══ Database: {$alias} ({$dbName}) ══════════════════════════\033[0m\n";

    // Resolve schema: explicit arg → schema_{driver}_{alias}.sql → schema_{driver}.sql → schema.sql
    if (isset($explicitSchema)) {
        $schemaFile = $explicitSchema;
    } else {
        $candidates = [
            __DIR__ . "/schema_{$driver}_{$alias}.sql",
            // __DIR__ . "/schema_{$driver}.sql",
            // __DIR__ . '/schema.sql',
        ];
        $schemaFile = null;
        foreach ($candidates as $candidate) {
            if (file_exists($candidate)) {
                $schemaFile = $candidate;
                break;
            }
        }
        if ($schemaFile === null) {
            echo "\033[31mNo schema file found for '{$alias}'. Tried:\033[0m\n";
            foreach ($candidates as $candidate) {
                echo "  {$candidate}\n";
            }
            $exitCode = 1;
            continue;
        }
    }

    $args = array_merge(
        [escapeshellarg($schemaFile)],
        ['--db=' . $alias],
        ['--migrations-dir=' . escapeshellarg($migrationsDir)],
        array_map('escapeshellarg', array_values($forwardFlags))
    );

    passthru(PHP_BINARY . ' ' . escapeshellarg($script) . ' ' . implode(' ', $args), $code);

    if ($code !== 0) {
        $exitCode = $code;
    }
}

exit($exitCode);
