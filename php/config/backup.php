<?php

// ---------------------------------------------------------------------------
// config/backup.php — where backups go, and what makes them
// ---------------------------------------------------------------------------
// A backup is one directory under storage/backups/ holding a pg_dump file per
// database plus a backup.json manifest describing them. The manifest lives on
// disk rather than in a table on purpose: a list of backups that is itself
// inside the database would roll back the moment you restored an old one.
//
// pg_dump is not usually on PATH on Windows, so it is looked for in the
// standard install locations too. To point at a particular one, create
// config/backup.local.php returning an array, the way the other .local.php
// files work:
//
//   <?php return ['pg_dump' => 'C:/Program Files/PostgreSQL/18/bin/pg_dump.exe'];
//
// Recognised keys: pg_dump, pg_restore, directory.
//
// The backups themselves go under storage/, which is already gitignored - a
// dump holds every row in the database, password hashes included.
// ---------------------------------------------------------------------------

function backupConfig(): array
{
    static $config = null;

    if ($config === null) {
        $localFile = __DIR__ . '/backup.local.php';
        $config = file_exists($localFile) ? (array) require $localFile : [];
    }

    return $config;
}

/** Where the backup directories live. Created on first use. */
function backupDirectory(): string
{
    $directory = backupConfig()['directory'] ?? __DIR__ . '/../storage/backups';

    if (!is_dir($directory)) {
        mkdir($directory, 0775, true);
    }

    // One spelling of a path everywhere: this ends up in the manifest, in API
    // responses and on the System page, and Windows hands back backslashes.
    return rtrim(strtr(realpath($directory) ?: $directory, DIRECTORY_SEPARATOR, '/'), '/');
}

/**
 * The full path to a PostgreSQL client program, or null if it cannot be found.
 *
 * $name is 'pg_dump' or 'pg_restore'. The configured path wins; after that it
 * is whatever is on PATH, and then the usual install directories, newest
 * major version first - so a machine with 16 and 18 side by side uses 18,
 * which is the one that can read an 18 server.
 */
function backupBinary(string $name): ?string
{
    static $found = [];

    if (array_key_exists($name, $found)) {
        return $found[$name];
    }

    $configured = backupConfig()[$name] ?? null;
    if ($configured && is_file($configured)) {
        return $found[$name] = $configured;
    }

    $windows = stripos(PHP_OS_FAMILY, 'Windows') === 0;
    $executable = $windows ? $name . '.exe' : $name;

    // On PATH is the normal case on a Linux server.
    $which = $windows ? "where $executable" : "command -v $executable";
    $onPath = trim((string) @shell_exec($which . ' 2>' . ($windows ? 'nul' : '/dev/null')));
    if ($onPath !== '') {
        $first = trim(explode("\n", $onPath)[0]);
        if (is_file($first)) {
            return $found[$name] = $first;
        }
    }

    $candidates = [];
    foreach (['C:/Program Files/PostgreSQL', 'C:/Program Files (x86)/PostgreSQL', '/usr/lib/postgresql'] as $root) {
        foreach (glob($root . '/*/bin/' . $executable) ?: [] as $path) {
            $candidates[] = $path;
        }
    }

    // "18" sorts before "9" alphabetically, so compare the version numerically.
    usort($candidates, function (string $a, string $b) {
        preg_match('~/(\d+(?:\.\d+)?)/bin/~', $a, $left);
        preg_match('~/(\d+(?:\.\d+)?)/bin/~', $b, $right);
        return (float) ($right[1] ?? 0) <=> (float) ($left[1] ?? 0);
    });

    return $found[$name] = $candidates[0] ?? null;
}

/** The version pg_dump reports, for the manifest and the System page. */
function backupBinaryVersion(string $name): ?string
{
    $path = backupBinary($name);
    if (!$path) {
        return null;
    }

    $output = @shell_exec(escapeshellarg($path) . ' --version 2>&1');
    return preg_match('/(\d+(?:\.\d+)+)/', (string) $output, $match) ? $match[1] : null;
}

/**
 * The database connection settings, loaded exactly the way getDb() loads them.
 *
 * pg_dump is a separate program, so it needs the host, port and credentials
 * rather than the PDO handle the rest of the API works with.
 */
function backupDatabaseConfig(): array
{
    static $config = null;

    if ($config === null) {
        $configFile = __DIR__ . '/database.local.php';
        if (!file_exists($configFile)) {
            $configFile = __DIR__ . '/database.php';
        }
        $config = (array) require $configFile;
    }

    return $config;
}
