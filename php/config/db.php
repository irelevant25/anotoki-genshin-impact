<?php

// config/db.php - PDO connection helper
//
// getDb(string $alias = '')
//   $alias: logical database alias as defined in config 'databases'.
//            Examples: getDb('users'), getDb('genshin_impact')
//            If empty, defaults to the first database in the config.
//
// Aliases are stable identifiers used throughout the codebase.
// The actual database name on the server is defined only in database.local.php.

function usersDb(): PDO
{
    return getDb('users');
}

function genshinDb(): PDO
{
    return getDb('genshin_impact');
}

function starRailDb(): PDO
{
    return getDb('star_rail');
}

function getDb(string $alias = ''): PDO
{
    static $connections = [];
    static $config = null;

    if ($config === null) {
        $configFile = __DIR__ . '/database.local.php';
        if (!file_exists($configFile)) {
            $configFile = __DIR__ . '/database.php';
        }
        $config = require $configFile;
    }

    // Resolve alias → actual database name
    if ($alias === '') {
        $dbname = trim((string) reset($config['databases']));
    } elseif (isset($config['databases'][$alias])) {
        $dbname = trim($config['databases'][$alias]);
    } else {
        throw new \InvalidArgumentException(
            "Unknown database alias '{$alias}'. Add it to the 'databases' array in your database config."
        );
    }

    // Return cached connection
    if (isset($connections[$dbname])) {
        return $connections[$dbname];
    }

    // Build the DSN based on the driver
    if ($config['driver'] === 'pgsql') {
        $dsn = "pgsql:host={$config['host']};port={$config['port']};dbname={$dbname}";
    } else {
        $dsn = "mysql:host={$config['host']};port={$config['port']};dbname={$dbname};charset={$config['charset']}";
    }

    $pdo = new PDO($dsn, $config['username'], $config['password']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // Set charset for PostgreSQL
    if ($config['driver'] === 'pgsql') {
        $pdo->exec("SET NAMES '{$config['charset']}'");
    }

    $connections[$dbname] = $pdo;
    return $pdo;
}
