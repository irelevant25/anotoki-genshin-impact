<?php

// config/db.php - PDO connection helper
//
// The site keeps everything in one PostgreSQL database: the game content, and
// what used to be a second database of its own - the translations, languages,
// site settings, page switches and the small record of each person who signs
// in (and of each visitor who plays without signing in, api/visitors.php). The
// two halves still have their own migration folders
// (migrations/genshin_impact/ and migrations/users/) and their own route
// folders, and usersDb() and genshinDb() still say which half a query is
// about, but both hand back the same connection.
//
// The database's name, like everything else that differs per installation, is
// only in config/database.local.php, which setup.php writes (see
// config/local.php) - there is no committed fallback to it. Its shape:
//
//   return [
//       'driver'     => 'pgsql',           // the migrations are PostgreSQL's
//       'host'       => '127.0.0.1',
//       'port'       => '5432',
//       'database'   => 'anotoki_genshin', // setup.php's default
//       'username'   => '...',
//       'password'   => '...',
//       'persistent' => true,              // see getDb()
//       'charset'    => 'utf8',
//   ];
//
// A file from before the two were one names them under 'databases' instead,
// and is refused until merge-databases.php has moved the second one in.

require_once __DIR__ . '/local.php';

/** The site's half of the database: translations, settings, page switches, people. */
function usersDb(): PDO
{
    return getDb();
}

/** The game content. */
function genshinDb(): PDO
{
    return getDb();
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

    if (!is_array($config)) {
        notSetUp('database.local.php', 'the database connection');
    }

    if (!is_string($config['database'] ?? null) || trim($config['database']) === '') {
        if (is_array($config['databases'] ?? null)) {
            throw new NotSetUpException(databaseTwoDatabasesMessage());
        }
        notSetUp('database.local.php', 'the database connection');
    }

    $config['database'] = trim($config['database']);

    return $config + ['driver' => 'pgsql', 'charset' => 'utf8', 'persistent' => false, 'password' => ''];
}

function getDb(): PDO
{
    static $pdo = null;

    if ($pdo !== null) {
        return $pdo;
    }

    $config = databaseConfig();
    $dbname = $config['database'];

    // Build the DSN based on the driver
    if ($config['driver'] === 'pgsql') {
        $dsn = "pgsql:host={$config['host']};port={$config['port']};dbname={$dbname}";
    } else {
        $dsn = "mysql:host={$config['host']};port={$config['port']};dbname={$dbname};charset={$config['charset']}";
    }

    // Opening a connection costs more than most requests spend on their own
    // query - about 34ms here, against a cheapest response of 86ms. A
    // persistent one is handed back from the pool instead, which measured at
    // nothing.
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

    return $pdo;
}
