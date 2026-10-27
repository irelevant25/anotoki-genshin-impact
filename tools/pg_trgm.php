<?php
/**
 * Check whether the PostgreSQL pg_trgm extension is enabled
 * in the current database, and optionally enable it.
 *
 * Usage (CLI):     php check_pg_trgm.php
 *                  php check_pg_trgm.php --enable
 * Usage (browser): check_pg_trgm.php
 *                  check_pg_trgm.php?enable=1
 *
 * Delete this file from your web server when you're done with it.
 */

// --- Connection settings: adjust to your environment ---------------------
$host     = getenv('DB_HOST') ?: 'xxx';
$port     = getenv('DB_PORT') ?: '5432';
$dbname   = getenv('DB_NAME') ?: 'anotoki_genshin';
$user     = getenv('DB_USER') ?: 'xxx';
$password = getenv('DB_PASS') ?: 'xxx';
// --------------------------------------------------------------------------

/**
 * Returns the installed version of pg_trgm, or null if it is not enabled
 * in the current database.
 */
function getPgTrgmVersion(PDO $pdo): ?string
{
    $stmt = $pdo->prepare("SELECT extversion FROM pg_extension WHERE extname = :name");
    $stmt->execute(['name' => 'pg_trgm']);
    $version = $stmt->fetchColumn();

    return $version === false ? null : (string) $version;
}

/**
 * True if pg_trgm is enabled in the current database.
 */
function isPgTrgmEnabled(PDO $pdo): bool
{
    return getPgTrgmVersion($pdo) !== null;
}

/**
 * True if pg_trgm is installed on the server and *could* be enabled
 * (i.e. the contrib package is present).
 */
function isPgTrgmAvailable(PDO $pdo): bool
{
    $stmt = $pdo->prepare("SELECT 1 FROM pg_available_extensions WHERE name = :name");
    $stmt->execute(['name' => 'pg_trgm']);

    return $stmt->fetchColumn() !== false;
}

/**
 * Enables pg_trgm in the current database.
 * Requires CREATE privilege on the database (superuser on PostgreSQL < 13,
 * since pg_trgm is a "trusted" extension only from PG 13 onward).
 */
function enablePgTrgm(PDO $pdo): void
{
    $pdo->exec("CREATE EXTENSION IF NOT EXISTS pg_trgm");
}

// --- Run -------------------------------------------------------------------
if (PHP_SAPI !== 'cli') {
    header('Content-Type: text/plain; charset=utf-8');
}

try {
    $pdo = new PDO(
        "pgsql:host=$host;port=$port;dbname=$dbname",
        $user,
        $password,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $version = getPgTrgmVersion($pdo);

    if ($version !== null) {
        echo "pg_trgm is enabled (version $version).\n";
        exit(0);
    }

    echo "pg_trgm is NOT enabled in database '$dbname'.\n";

    if (!isPgTrgmAvailable($pdo)) {
        echo "It is also not available on the server — install the PostgreSQL contrib package first.\n";
        exit(1);
    }

    $wantsEnable = PHP_SAPI === 'cli'
        ? in_array('--enable', $argv ?? [], true)
        : isset($_GET['enable']);

    if ($wantsEnable) {
        enablePgTrgm($pdo);
        echo "pg_trgm has been enabled (version " . getPgTrgmVersion($pdo) . ").\n";
        exit(0);
    }

    echo "It is available on the server. Run with --enable (CLI) or open with ?enable=1 (browser) to turn it on.\n";
    exit(1);

} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
    exit(2);
}