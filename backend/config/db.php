<?php

// config/db.php - PDO connection helper
//
// getDb(string $alias = '')
//   $alias: logical database alias as defined in config 'databases'.
//            Examples: getDb('users'), getDb('genshin_impact')
//            If empty, defaults to the first database in the config.
//
// Aliases are stable identifiers used throughout the codebase. The actual
// database names on the server are defined only in config/database.local.php,
// which setup.php writes (see config/local.php) - there is no committed
// fallback to it. Its shape:
//
//   return [
//       'driver'     => 'pgsql',           // the migrations are PostgreSQL's
//       'host'       => '127.0.0.1',
//       'port'       => '5432',
//       'databases'  => ['users' => 'users', 'genshin_impact' => 'genshin_impact'],
//       'username'   => '...',
//       'password'   => '...',
//       'persistent' => true,              // see getDb()
//       'charset'    => 'utf8',
//   ];

require_once __DIR__ . '/local.php';

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

/**
 * The connection settings, exactly as config/database.local.php gives them.
 *
 * Also what pg_dump is handed (config/backup.php) and what the command-line
 * scripts connect with, so every one of them reaches the same database.
 */
function databaseConfig(): array
{
    $config = localConfig('database');

    if (!is_array($config) || !is_array($config['databases'] ?? null) || !$config['databases']) {
        notSetUp('database.local.php', 'the database connection');
    }

    return $config + ['driver' => 'pgsql', 'charset' => 'utf8', 'persistent' => false, 'password' => ''];
}

function getDb(string $alias = ''): PDO
{
    static $connections = [];

    $config = databaseConfig();

    // Resolve alias → actual database name
    if ($alias === '') {
        $dbname = trim((string) reset($config['databases']));
    } elseif (isset($config['databases'][$alias])) {
        $dbname = trim($config['databases'][$alias]);
    } else {
        throw new \InvalidArgumentException(
            "Unknown database alias '{$alias}'. Add it to the 'databases' array in config/database.local.php."
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

    // Opening a connection costs more than most requests spend on their own
    // query - about 34ms here, against a cheapest response of 86ms, and most
    // requests open two. A persistent one is handed back from the pool instead,
    // which measured at nothing.
    //
    // The catch is that a pooled connection keeps whatever the last request
    // left on it, so it is opt-in per environment: it is only a win where PHP
    // is served by something that holds processes open, and only safe where
    // nothing leaves session state behind.
    $persistent = !empty($config['persistent']);

    $pdo = new PDO($dsn, $config['username'], $config['password'], $persistent ? [PDO::ATTR_PERSISTENT => true] : []);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // Set charset for PostgreSQL
    if ($config['driver'] === 'pgsql') {
        // A reused connection could be carrying a transaction that its last
        // request died inside, and inheriting one is far worse than the round
        // trip this costs. Postgres warns rather than errors when there is
        // nothing to roll back, and both statements travel together.
        $pdo->exec($persistent
            ? "ROLLBACK; SET NAMES '{$config['charset']}'"
            : "SET NAMES '{$config['charset']}'");
    }

    $connections[$dbname] = $pdo;
    return $pdo;
}
