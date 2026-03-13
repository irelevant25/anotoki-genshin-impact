<?php

/**
 * migration_mysql.php — Migration runner for MySQL
 *
 * Usage:
 *   php migration_mysql.php [schema.sql]              — diff migrations/ vs schema, generate + apply new migration
 *   php migration_mysql.php [schema.sql] --status     — show which migrations have been applied
 *   php migration_mysql.php [schema.sql] --apply-only — apply pending migration files without diffing
 *
 * Schema file defaults to schema.sql if not provided.
 */

// ─── CONFIG ──────────────────────────────────────────────────────────────────

require_once __DIR__ . '/config/db.php';

$config = [
    'schema_file'    => parseSchemaArg($argv, 'schema.sql'),
    'migrations_dir' => parseMigrationsDirArg($argv, __DIR__ . '/migrations'),
    'db_alias'       => parseDbAliasArg($argv),
];

// ─── BOOTSTRAP ───────────────────────────────────────────────────────────────

$mode = parseModeArg($argv);

try {
    $pdo = getDb($config['db_alias']);
} catch (PDOException $e) {
    colorLine("red", "Cannot connect to database: " . $e->getMessage());
    exit(1);
}
ensureMigrationsDir($config['migrations_dir']);

match ($mode) {
    '--status'     => cmdStatus($pdo, $config),
    '--apply-only' => cmdApplyOnly($pdo, $config),
    default        => cmdDiffAndMigrate($pdo, $config),
};

// ─── COMMANDS ────────────────────────────────────────────────────────────────

function cmdStatus(PDO $pdo, array $config): void
{
    $applied = getAppliedMigrations($pdo);
    $files   = getMigrationFiles($config['migrations_dir']);

    colorLine("cyan", "\n── Migration Status ──────────────────────────");
    if (empty($files)) {
        colorLine("yellow", "No migration files found in migrations/");
        return;
    }

    foreach ($files as $file) {
        $name   = basename($file);
        $status = in_array($name, $applied)
            ? "\033[32m✔ applied\033[0m"
            : "\033[33m✘ pending\033[0m";
        echo "  {$name}  {$status}\n";
    }

    $pending = array_filter($files, fn($f) => !in_array(basename($f), $applied));
    echo "\n";
    colorLine(empty($pending) ? "green" : "yellow",
        count($applied) . " applied, " . count($pending) . " pending.");
}

function cmdApplyOnly(PDO $pdo, array $config): void
{
    $applied = getAppliedMigrations($pdo);
    $files   = getMigrationFiles($config['migrations_dir']);
    $pending = array_filter($files, fn($f) => !in_array(basename($f), $applied));

    if (empty($pending)) {
        colorLine("green", "Nothing to apply — all migrations are up to date.");
        return;
    }

    foreach ($pending as $file) {
        $name = basename($file);
        colorLine("cyan", "Applying {$name}...");
        executeSqlStatements($pdo, file_get_contents($file));
        logMigration($pdo, $name);
        colorLine("green", "  ✔ Done");
    }
}

function cmdDiffAndMigrate(PDO $pdo, array $config): void
{
    colorLine("cyan", "\n── Diffing migrations/ vs schema.sql ─────────");

    // ── Build "current" state by replaying all migration files ──
    $migrationFiles = getMigrationFiles($config['migrations_dir']);
    if (empty($migrationFiles)) {
        colorLine("red", "No migration files found. Run init.php first.");
        exit(1);
    }

    $replayedSQL = '';
    foreach ($migrationFiles as $file) {
        $replayedSQL .= "\n" . file_get_contents($file);
    }

    $schemaSQL = file_get_contents($config['schema_file']);
    if (!$schemaSQL) {
        colorLine("red", "Cannot read {$config['schema_file']}");
        exit(1);
    }

    // Parse both into table definitions
    $replayedTables = parseSchemaFile($replayedSQL);
    $schemaTables   = parseSchemaFile($schemaSQL);

    // Remove the migrations tracking table from both — it's infrastructure, not user schema
    unset($replayedTables['migrations'], $schemaTables['migrations']);

    $statements = [];

    // ── New tables (in schema.sql, not in replayed state) ──
    foreach ($schemaTables as $table => $schemaCols) {
        if (!isset($replayedTables[$table])) {
            colorLine("green", "  + New table: `{$table}`");
            $statements[] = buildCreateTable($table, $schemaCols);
        }
    }

    // ── Removed tables (in replayed state, not in schema.sql) ──
    foreach ($replayedTables as $table => $replayedCols) {
        if (!isset($schemaTables[$table])) {
            colorLine("yellow", "  - Table removed: `{$table}`");
            if (confirm("    Drop table `{$table}`?")) {
                $statements[] = "DROP TABLE IF EXISTS `{$table}`;";
            }
        }
    }

    // ── Changed tables ──
    foreach ($schemaTables as $table => $schemaCols) {
        if (!isset($replayedTables[$table])) continue;

        $replayedCols   = $replayedTables[$table];
        $schemaColNames  = array_keys($schemaCols);
        $replayedColNames = array_keys($replayedCols);

        $added   = array_diff($schemaColNames, $replayedColNames);
        $removed = array_diff($replayedColNames, $schemaColNames);

        // ── New columns ──
        foreach ($added as $col) {
            $renameCandidate = findRenameCandidate($col, $removed, $schemaCols[$col], $replayedCols);

            if ($renameCandidate) {
                colorLine("yellow", "  ? `{$table}`: `{$renameCandidate}` removed + `{$col}` added — possible rename?");
                echo "    [1] Rename `{$renameCandidate}` → `{$col}` (keeps data)\n";
                echo "    [2] Drop `{$renameCandidate}` and add `{$col}` as new column (loses data)\n";
                $choice = prompt("    Your choice (1/2): ");

                if ($choice === '1') {
                    $statements[] = "ALTER TABLE `{$table}` RENAME COLUMN `{$renameCandidate}` TO `{$col}`;";
                    colorLine("green", "    → Will rename");
                } else {
                    $statements[] = "ALTER TABLE `{$table}` DROP COLUMN `{$renameCandidate}`;";
                    $statements[] = buildAddColumn($table, $col, $schemaCols[$col]);
                    colorLine("green", "    → Will drop + add");
                }
                $removed = array_diff($removed, [$renameCandidate]);
            } else {
                colorLine("green", "  + `{$table}`.`{$col}` — new column");
                $statements[] = buildAddColumn($table, $col, $schemaCols[$col]);
            }
        }

        // ── Removed columns ──
        foreach ($removed as $col) {
            colorLine("yellow", "  - `{$table}`.`{$col}` — column removed");
            if (confirm("    Drop column `{$col}` from `{$table}`?")) {
                $statements[] = "ALTER TABLE `{$table}` DROP COLUMN `{$col}`;";
            }
        }

        // ── Modified columns ──
        foreach ($schemaCols as $col => $schemaDef) {
            if (!isset($replayedCols[$col])) continue;
            $replayedDef = $replayedCols[$col];
            if ($schemaDef['def'] !== $replayedDef['def']) {
                colorLine("cyan", "  ~ `{$table}`.`{$col}` — definition changed");
                echo "    Was:    " . $replayedDef['def'] . "\n";
                echo "    Now:    " . $schemaDef['def'] . "\n";
                if (confirm("    Apply change?")) {
                    $statements[] = buildModifyColumn($table, $col, $schemaDef);
                }
            }
        }
    }

    if (empty($statements)) {
        colorLine("green", "\nNo changes detected — schema.sql matches migrations.");
        return;
    }

    // ── Preview & confirm ──
    colorLine("cyan", "\n── Generated SQL ─────────────────────────────");
    foreach ($statements as $s) {
        echo "  " . trim($s) . "\n";
    }

    echo "\n";
    if (!confirm("Apply these changes and save as a new migration file?")) {
        colorLine("yellow", "Aborted. No changes made.");
        return;
    }

    // ── Save migration file ──
    $filename = generateMigrationFilename($config['migrations_dir']);
    $filepath = $config['migrations_dir'] . '/' . $filename;
    $content  = "-- Migration: {$filename}\n-- Generated: " . date('Y-m-d H:i:s') . "\n\n"
        . implode("\n", $statements) . "\n";

    file_put_contents($filepath, $content);
    colorLine("green", "Saved: migrations/{$filename}");

    // ── Apply to live DB ──
    executeSqlStatements($pdo, implode("\n", $statements));
    logMigration($pdo, $filename);
    colorLine("green", "Migration applied successfully!");
}

// ─── SCHEMA PARSING ──────────────────────────────────────────────────────────

/**
 * Parse all CREATE TABLE statements from a SQL string.
 * Also replays ALTER TABLE ADD/DROP/MODIFY/RENAME COLUMN so migration files
 * are fully accounted for when building the replayed state.
 * Returns: [ 'table_name' => [ 'col_name' => ['def' => '...'], ... ], ... ]
 */
function parseSchemaFile(string $sql): array
{
    $tables = [];

    // Strip comments
    $sql = preg_replace('/\/\*.*?\*\//s', '', $sql);
    $sql = preg_replace('/--[^\n]*/', '', $sql);

    // ── CREATE TABLE ──
    preg_match_all(
        '/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(\w+)`?\s*\((.*?)\)\s*(?:ENGINE[^;]*)?;/si',
        $sql,
        $matches,
        PREG_SET_ORDER
    );
    foreach ($matches as $m) {
        $tables[$m[1]] = parseColumnDefs($m[2]);
    }

    // ── DROP TABLE (for migration files) ──
    preg_match_all('/DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?`?(\w+)`?\s*;/si', $sql, $drops, PREG_SET_ORDER);
    foreach ($drops as $d) {
        unset($tables[$d[1]]);
    }

    // ── ALTER TABLE (for migration files) ──
    preg_match_all('/ALTER\s+TABLE\s+`?(\w+)`?\s+(.*?);/si', $sql, $alters, PREG_SET_ORDER);
    foreach ($alters as $a) {
        $table  = $a[1];
        $clause = trim($a[2]);

        if (!isset($tables[$table])) continue;

        // ADD COLUMN
        if (preg_match('/^ADD\s+COLUMN\s+`?(\w+)`?\s+(.+)$/i', $clause, $m)) {
            $col = $m[1];
            $def = preg_replace('/\s+/', ' ', rtrim(trim($m[2]), ', '));
            $tables[$table][$col] = ['def' => $def];
        }
        // DROP COLUMN
        elseif (preg_match('/^DROP\s+COLUMN\s+`?(\w+)`?/i', $clause, $m)) {
            unset($tables[$table][$m[1]]);
        }
        // MODIFY COLUMN
        elseif (preg_match('/^MODIFY\s+COLUMN\s+`?(\w+)`?\s+(.+)$/i', $clause, $m)) {
            $col = $m[1];
            $def = preg_replace('/\s+/', ' ', rtrim(trim($m[2]), ', '));
            $tables[$table][$col] = ['def' => $def];
        }
        // RENAME COLUMN
        elseif (preg_match('/^RENAME\s+COLUMN\s+`?(\w+)`?\s+TO\s+`?(\w+)`?/i', $clause, $m)) {
            $old = $m[1];
            $new = $m[2];
            if (isset($tables[$table][$old])) {
                $tables[$table][$new] = $tables[$table][$old];
                unset($tables[$table][$old]);
            }
        }
    }

    return $tables;
}

/**
 * Parse column definitions from a CREATE TABLE body.
 * Skips PRIMARY KEY, INDEX, UNIQUE, FOREIGN KEY, CONSTRAINT lines.
 */
function parseColumnDefs(string $body): array
{
    $columns = [];
    $lines   = explode("\n", $body);

    foreach ($lines as $line) {
        $line = trim($line, " \t,");
        if ($line === '') continue;
        if (preg_match('/^(PRIMARY\s+KEY|KEY|INDEX|UNIQUE|CONSTRAINT|FOREIGN)/i', $line)) continue;

        if (preg_match('/^`?(\w+)`?\s+(.+)$/i', $line, $m)) {
            $colName = $m[1];
            $def     = preg_replace('/\s+/', ' ', rtrim(trim($m[2]), ', '));
            $columns[$colName] = ['def' => $def];
        }
    }

    return $columns;
}

// ─── SQL BUILDERS ─────────────────────────────────────────────────────────────

function buildCreateTable(string $table, array $cols): string
{
    $lines = [];
    foreach ($cols as $col => $def) {
        $lines[] = "  `{$col}` " . $def['def'];
    }
    return "CREATE TABLE IF NOT EXISTS `{$table}` (\n" . implode(",\n", $lines) . "\n);";
}

function buildAddColumn(string $table, string $col, array $def): string
{
    return "ALTER TABLE `{$table}` ADD COLUMN `{$col}` " . rtrim($def['def'], ', ') . ";";
}

function buildModifyColumn(string $table, string $col, array $def): string
{
    return "ALTER TABLE `{$table}` MODIFY COLUMN `{$col}` " . rtrim($def['def'], ', ') . ";";
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/**
 * Try to find a likely rename candidate from removed columns.
 * Heuristic: same base type family (INT, VARCHAR, etc.)
 */
function findRenameCandidate(string $newCol, array $removedCols, array $newDef, array $replayedCols): ?string
{
    if (empty($removedCols)) return null;

    $newBase = extractBaseType($newDef['def']);

    foreach ($removedCols as $oldCol) {
        if (!isset($replayedCols[$oldCol])) continue;
        if (extractBaseType($replayedCols[$oldCol]['def']) === $newBase) {
            return $oldCol;
        }
    }

    // Only one candidate regardless of type — still suggest it
    if (count($removedCols) === 1) {
        return reset($removedCols);
    }

    return null;
}

function extractBaseType(string $def): string
{
    preg_match('/^(\w+)/', strtoupper(trim($def)), $m);
    return $m[1] ?? '';
}

function generateMigrationFilename(string $dir): string
{
    $files = getMigrationFiles($dir);
    $last  = empty($files) ? 1 : (int) substr(basename(end($files)), 0, 3);
    $next  = str_pad($last + 1, 3, '0', STR_PAD_LEFT);
    $date  = date('Ymd_His');
    return "{$next}_migration_{$date}.sql";
}

function getMigrationFiles(string $dir): array
{
    $files = glob($dir . '/*.sql');
    sort($files);
    return $files ?: [];
}

function getAppliedMigrations(PDO $pdo): array
{
    try {
        $stmt = $pdo->query("SELECT filename FROM migrations ORDER BY applied_at ASC");
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    } catch (PDOException) {
        return [];
    }
}

function logMigration(PDO $pdo, string $filename): void
{
    $pdo->prepare("INSERT IGNORE INTO migrations (filename) VALUES (?)")
        ->execute([$filename]);
}

function executeSqlStatements(PDO $pdo, string $sql): void
{
    $sql = preg_replace('/\/\*.*?\*\//s', '', $sql);
    $sql = preg_replace('/--[^\n]*/', '', $sql);

    $statements = array_filter(
        array_map('trim', explode(';', $sql)),
        fn($s) => $s !== ''
    );

    foreach ($statements as $statement) {
        try {
            $pdo->exec($statement);
        } catch (PDOException $e) {
            colorLine("red", "SQL Error: " . $e->getMessage());
            colorLine("red", "Statement: " . substr($statement, 0, 120));
            if (!confirm("Continue anyway?")) exit(1);
        }
    }
}

function ensureMigrationsDir(string $dir): void
{
    if (!is_dir($dir)) mkdir($dir, 0755, true);
}

// ─── CLI UTILS ────────────────────────────────────────────────────────────────

/**
 * Return the first non-flag argument as the schema file path (relative to __DIR__),
 * or $default if none is given.
 *   php migration_mysql.php              → schema.sql
 *   php migration_mysql.php my.sql       → my.sql
 *   php migration_mysql.php my.sql --status
 */
function parseSchemaArg(array $argv, string $default): string
{
    foreach (array_slice($argv, 1) as $arg) {
        if (!str_starts_with($arg, '--')) {
            // Absolute: Unix /path or Windows C:\path
            $isAbsolute = str_starts_with($arg, '/') || (strlen($arg) > 1 && $arg[1] === ':');
            return $isAbsolute ? $arg : __DIR__ . '/' . $arg;
        }
    }
    return __DIR__ . '/' . $default;
}

/**
 * Return the value of --migrations-dir=... if present, otherwise $default.
 */
function parseMigrationsDirArg(array $argv, string $default): string
{
    foreach (array_slice($argv, 1) as $arg) {
        if (str_starts_with($arg, '--migrations-dir=')) {
            return substr($arg, strlen('--migrations-dir='));
        }
    }
    return $default;
}

/**
 * Return the value of --db=... if present, otherwise '' (getDb default).
 */
function parseDbAliasArg(array $argv): string
{
    foreach (array_slice($argv, 1) as $arg) {
        if (str_starts_with($arg, '--db=')) {
            return substr($arg, strlen('--db='));
        }
    }
    return '';
}

/**
 * Return --status or --apply-only if present, otherwise null (default diff+migrate mode).
 */
function parseModeArg(array $argv): ?string
{
    foreach (array_slice($argv, 1) as $arg) {
        if (in_array($arg, ['--status', '--apply-only'], true)) return $arg;
    }
    return null;
}

function prompt(string $message): string
{
    echo $message;
    return trim(fgets(STDIN));
}

function confirm(string $message): bool
{
    return strtolower(prompt($message . " [y/N] ")) === 'y';
}

function colorLine(string $color, string $message): void
{
    $colors = [
        'red'    => "\033[31m",
        'green'  => "\033[32m",
        'yellow' => "\033[33m",
        'cyan'   => "\033[36m",
    ];
    echo ($colors[$color] ?? '') . $message . "\033[0m\n";
}