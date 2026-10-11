<?php

/**
 * merge-databases.php - moves the site's second database into the first, once.
 *
 *   php merge-databases.php            merge, then rewrite config/database.local.php
 *   php merge-databases.php --check    say what it would do, and change nothing
 *
 * The site used to keep two databases: the game content (genshin_impact), and
 * the site's own half (users) - the translations, languages, site settings,
 * page switches and the small record of each person who signs in, which is all
 * that half holds since the accounts moved to the anotoki IAM. It keeps one
 * now, like every anotoki project. This moves an installation that still has
 * two - config/database.local.php naming them under 'databases' - into the
 * content database:
 *
 *   1. Brings each up to date with its own migrations first, if it is behind,
 *      so both are the shape this code expects. That is the one change it makes
 *      to the old users database, and it says so when it does.
 *   2. In one transaction on the content database: creates the site's half in
 *      it exactly as the old database has it today - its schema from
 *      `pg_dump --schema-only`, not by replaying migrations/users/, whose early
 *      files made (and 040 dropped again) an account table called `roles`, the
 *      name the content half uses for character roles. Then checks every table
 *      came out the same shape, copies every row across (COPY, table by table,
 *      parents first, all read from one snapshot of the old database), compares
 *      each table's row count and a checksum of its contents, sets each
 *      sequence to where the old database's stood, and records the users/
 *      migrations as applied. Anything wrong rolls all of it back.
 *   3. Rewrites config/database.local.php to name the one database.
 *
 * Each step applies its database's own folder and nothing else - never the
 * anotoki library's set (anotoki_translations), which belongs to the merged
 * database: `php migration.php` applies it there afterwards, as it would on
 * any database that has both folders.
 *
 * Nothing here deletes data; the old users database stays where it is - drop it
 * once the site runs well without it. It needs pg_dump, found as the Backups
 * page finds it (config/backup.php). The schema comes from pg_dump and the rows
 * from a snapshot of this script's own, so nothing else should be writing to
 * the old database meanwhile - on a development machine nothing is.
 *
 * A maintenance script: CLI only, not shipped by build-dist.php. On the hosting
 * there is nothing to merge: setup.php installs the one database from scratch,
 * and data goes up with db-push.php.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit("merge-databases.php is a command-line tool.\n");
}

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/config/local.php';
require_once __DIR__ . '/config/backup.php';
require_once __DIR__ . '/api/migration_runner.php';

use Anotoki\Lib\Migrations\Splitter;

$checkOnly = in_array('--check', $argv, true);

function line(string $text = ''): void
{
    echo $text . "\n";
}

function stop(string $text): never
{
    fwrite(STDERR, "\n" . $text . "\n");
    exit(1);
}

// ── What is configured ────────────────────────────────────────────────────────

$config = localConfig('database');

if (!is_array($config)) {
    stop('config/database.local.php is missing. There is nothing to merge: set the site up with setup.php.');
}
if (is_string($config['database'] ?? null) && trim($config['database']) !== '') {
    line("config/database.local.php already names one database ({$config['database']}). Nothing to merge.");
    exit(0);
}

$sourceName = (string) ($config['databases']['users'] ?? '');
$targetName = (string) ($config['databases']['genshin_impact'] ?? '');
if ($sourceName === '' || $targetName === '') {
    stop("config/database.local.php names no 'users' and 'genshin_impact' databases to merge.");
}
if ($sourceName === $targetName) {
    stop("Both halves already name the same database ({$targetName}); only the config needs rewriting - run setup.php.");
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** A connection of its own - the COPY methods live on Pdo\Pgsql from PHP 8.4, on PDO before that. */
function mergeConnect(array $config, string $database): PDO
{
    $dsn = "pgsql:host={$config['host']};port={$config['port']};dbname={$database}";
    $options = [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC];

    return method_exists(PDO::class, 'connect')
        ? PDO::connect($dsn, $config['username'], $config['password'] ?? '', $options)
        : new PDO($dsn, $config['username'], $config['password'] ?? '', $options);
}

/** A name as a quoted identifier. The names come from the catalogue, but a quote in one is still a quote. */
function mergeIdent(string $name): string
{
    return '"' . str_replace('"', '""', $name) . '"';
}

/** A table of the public schema, qualified and quoted. */
function mergeTable(string $table): string
{
    return 'public.' . mergeIdent($table);
}

/**
 * The rows, in COPY text format. The separator and the NULL marker are left to
 * PHP's own defaults (a tab, and \N as COPY writes it): spelled in PHP source,
 * the marker is easy to get one backslash short, and then it is the letter N -
 * and every value that is exactly "N" comes back as NULL.
 *
 * @return string[]
 */
function mergeCopyOut(PDO $pdo, string $table, string $columns): array
{
    $rows = $pdo instanceof \Pdo\Pgsql
        ? $pdo->copyToArray(mergeTable($table), fields: $columns)
        : $pdo->pgsqlCopyToArray(mergeTable($table), fields: $columns);

    if ($rows === false) {
        throw new RuntimeException("Could not read {$table} from the old database.");
    }

    return $rows;
}

function mergeCopyIn(PDO $pdo, string $table, array $rows, string $columns): void
{
    if ($rows === []) {
        return;
    }

    $ok = $pdo instanceof \Pdo\Pgsql
        ? $pdo->copyFromArray(mergeTable($table), $rows, fields: $columns)
        : $pdo->pgsqlCopyFromArray(mergeTable($table), $rows, fields: $columns);

    if (!$ok) {
        throw new RuntimeException("Could not write {$table} into the merged database.");
    }
}

/** The base tables of the public schema, but the migrations record. */
function mergeTables(PDO $pdo): array
{
    return $pdo->query(
        "SELECT table_name FROM information_schema.tables
          WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name <> 'migrations'
          ORDER BY table_name"
    )->fetchAll(PDO::FETCH_COLUMN);
}

/** A table's columns as name => type, in order, generated ones left out (COPY cannot write them). */
function mergeColumns(PDO $pdo, string $table): array
{
    $query = $pdo->prepare(
        "SELECT column_name, format_type(a.atttypid, a.atttypmod) AS type
           FROM information_schema.columns c
           JOIN pg_attribute a ON a.attrelid = ('public.' || quote_ident(c.table_name))::regclass AND a.attname = c.column_name
          WHERE c.table_schema = 'public' AND c.table_name = ? AND c.is_generated = 'NEVER'
          ORDER BY c.ordinal_position"
    );
    $query->execute([$table]);

    return array_column($query->fetchAll(), 'type', 'column_name');
}

/** The rows' count, and a checksum of their contents - the same on both sides only when every value is. */
function mergeFingerprint(PDO $pdo, string $table): array
{
    return $pdo->query(
        'SELECT count(*) AS rows, md5(coalesce(string_agg(h, \'\' ORDER BY h), \'\')) AS sum
           FROM (SELECT md5(t::text) AS h FROM ' . mergeTable($table) . ' t) s'
    )->fetch();
}

/** $tables ordered so every table comes after the tables it refers to. */
function mergeParentsFirst(PDO $pdo, array $tables): array
{
    $parents = array_fill_keys($tables, []);
    $query = $pdo->query(
        "SELECT cl.relname AS child, pl.relname AS parent
           FROM pg_constraint c
           JOIN pg_class cl ON cl.oid = c.conrelid
           JOIN pg_class pl ON pl.oid = c.confrelid
          WHERE c.contype = 'f' AND c.connamespace = 'public'::regnamespace"
    );
    foreach ($query->fetchAll() as $edge) {
        if (isset($parents[$edge['child']]) && isset($parents[$edge['parent']]) && $edge['child'] !== $edge['parent']) {
            $parents[$edge['child']][] = $edge['parent'];
        }
    }

    $ordered = [];
    while (count($ordered) < count($tables)) {
        $progress = false;
        foreach ($tables as $table) {
            if (!in_array($table, $ordered, true) && !array_diff($parents[$table], $ordered)) {
                $ordered[] = $table;
                $progress = true;
            }
        }
        if (!$progress) {
            throw new RuntimeException('The tables refer to each other in a circle; copy them by hand.');
        }
    }

    return $ordered;
}

/** Sequence => where it stands, for the columns of the tables given. */
function mergeSequences(PDO $pdo, array $tables): array
{
    $sequences = [];
    foreach ($tables as $table) {
        foreach (array_keys(mergeColumns($pdo, $table)) as $column) {
            $query = $pdo->prepare('SELECT pg_get_serial_sequence(?, ?)');
            $query->execute([mergeTable($table), $column]);
            $sequence = $query->fetchColumn();
            if (is_string($sequence) && $sequence !== '') {
                $sequences[$sequence] = $pdo->query("SELECT last_value, is_called FROM {$sequence}")->fetch();
            }
        }
    }

    return $sequences;
}

/**
 * The old database's schema as SQL, from pg_dump - everything but the record of
 * migrations, which the one database already has. The trigger function both
 * halves define, identically, is made CREATE OR REPLACE so it does not collide
 * with the content half's.
 */
function mergeSchemaSql(array $config, string $database): string
{
    $environment = backupProcessEnv();
    $environment['PGPASSWORD'] = (string) ($config['password'] ?? '');

    $process = proc_open(
        [backupBinary('pg_dump'), '-h', (string) $config['host'], '-p', (string) $config['port'], '-U', (string) $config['username'],
            '--schema-only', '--no-owner', '--no-privileges',
            '-T', 'public.migrations', '-T', 'public.migrations_id_seq', $database],
        [1 => ['pipe', 'w'], 2 => ['pipe', 'w']],
        $pipes,
        null,
        $environment
    );
    if (!is_resource($process)) {
        throw new RuntimeException('Could not start pg_dump.');
    }
    $sql = (string) stream_get_contents($pipes[1]);
    $errors = trim((string) stream_get_contents($pipes[2]));
    fclose($pipes[1]);
    fclose($pipes[2]);
    if (proc_close($process) !== 0) {
        throw new RuntimeException('pg_dump failed: ' . $errors);
    }

    // psql's own commands (a newer pg_dump fences its output with \restrict)
    // are not SQL, and nothing else here reads them.
    $sql = (string) preg_replace('/^\\\\.*$/m', '', $sql);

    return str_replace('CREATE FUNCTION public.set_updated_at()', 'CREATE OR REPLACE FUNCTION public.set_updated_at()', $sql);
}

// ── Connecting, and what each side holds ──────────────────────────────────────

line("Merging the site's second database into the first:");
line("  {$sourceName}  (translations, languages, settings, page switches, people)");
line("  -> {$targetName}  (the game content, and from now on everything)");
line();

if (!backupBinary('pg_dump')) {
    stop('pg_dump was not found. Add it to PATH, or point config/backup.local.php at it. Nothing was changed.');
}

try {
    $source = mergeConnect($config, $sourceName);
    $target = mergeConnect($config, $targetName);
} catch (\Throwable $e) {
    stop('Cannot connect: ' . $e->getMessage());
}

$sourceRecorded = recordedMigrations($source)['users'];
$targetRecorded = recordedMigrations($target);
$files = migrationFilesByFolder($target);
$sourcePending = array_values(array_diff($files['users'], $sourceRecorded));
$targetPending = array_values(array_diff($files['genshin_impact'], $targetRecorded['genshin_impact']));

if ($targetRecorded['users'] !== []) {
    stop("{$targetName} already records migrations of the site's half - it looks merged already, or half-merged."
        . ' Check it before going on; nothing was changed.');
}

line("  {$sourceName}: " . count(mergeTables($source)) . ' tables, ' . count($sourceRecorded) . ' migrations recorded'
    . ($sourcePending ? ', ' . count($sourcePending) . ' pending' : ''));
line("  {$targetName}: " . count($targetRecorded['genshin_impact']) . ' migrations recorded'
    . ($targetPending ? ', ' . count($targetPending) . ' pending' : ''));

if ($checkOnly) {
    line();
    line('--check: nothing was changed. Without it, this ' . ($sourcePending || $targetPending ? 'first applies the pending migrations, then ' : '')
        . "moves every row of the site's half into {$targetName}, and rewrites config/database.local.php.");
    exit(0);
}

// ── 1. Both up to date ────────────────────────────────────────────────────────
// Only where one is behind, each with its own folder only - through the engine
// every way of building the database uses (api/migration_runner.php), under its
// lock, but without the order guard: a database holding one folder is what
// this is here to mend. Applying also brings that database's record of
// migrations up to the shape with a folder per row.

$applied = [];
foreach ([[$source, 'users', $sourceName, $sourcePending], [$target, 'genshin_impact', $targetName, $targetPending]] as [$pdo, $folder, $name, $pending]) {
    if (!$pending) {
        continue;
    }
    $result = siteMigrator($pdo, $folder, orderGuard: false)->apply();
    if ($result['busy']) {
        stop("{$name}: another apply is running on it (`php migration.php`, or a site still pointed at it). Nothing was merged"
            . ($applied ? '; the migrations listed above stay applied.' : '.'));
    }
    $names = array_map(fn (array $file): string => $file['name'], $result['applied']);
    if ($names) {
        $applied[$name] = $names;
        line("  {$name}: applied " . implode(', ', $names));
    }
    if ($result['error'] !== null) {
        stop("{$name}: migration {$folder}/" . ($result['failed']['name'] ?? '') . " failed - {$result['error']}\nNothing was merged"
            . ($applied ? '; the migrations listed above stay applied.' : '.'));
    }
}

// Only now, with both at the shape this code expects: before users/040 has run,
// the old database still holds its account `roles`, which is no clash at all.
$sourceTables = mergeTables($source);
$clashes = array_values(array_intersect($sourceTables, mergeTables($target)));
if ($clashes) {
    stop("{$targetName} already has tables of the site's half (" . implode(', ', $clashes) . ').'
        . ($applied ? ' Only the migrations listed above were applied.' : ' Nothing was changed.'));
}

try {
    $schema = mergeSchemaSql($config, $sourceName);
} catch (\Throwable $e) {
    stop($e->getMessage() . "\nNothing was merged" . ($applied ? '; the migrations listed above stay applied.' : '.'));
}

// ── 2. The move, all or nothing ───────────────────────────────────────────────

line();

// Everything read from the old database from here on comes from one snapshot.
$source->exec('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
$target->beginTransaction();

try {
    ensureMigrationsTable($target);

    foreach (Splitter::split($schema) as $statement) {
        $target->exec($statement);
    }
    // pg_dump's script empties search_path so every name it uses is qualified;
    // the rest of this runs on unqualified names.
    $target->exec('RESET search_path');
    line("  made the site's half in {$targetName}: " . count($sourceTables) . ' tables, as ' . $sourceName . ' has them');

    // Copying into a different shape is how columns go quietly missing, so the
    // shapes are compared before a row moves.
    $missing = array_values(array_diff($sourceTables, mergeTables($target)));
    if ($missing) {
        throw new RuntimeException('The schema did not make ' . implode(', ', $missing) . ', which the old database has.');
    }
    foreach ($sourceTables as $table) {
        if (mergeColumns($source, $table) !== mergeColumns($target, $table)) {
            throw new RuntimeException("{$table} is not the same shape in both databases: its columns differ.");
        }
    }

    foreach (mergeParentsFirst($source, $sourceTables) as $table) {
        $columns = implode(',', array_map('mergeIdent', array_keys(mergeColumns($source, $table))));
        mergeCopyIn($target, $table, mergeCopyOut($source, $table, $columns), $columns);

        $want = mergeFingerprint($source, $table);
        $got = mergeFingerprint($target, $table);
        if ($want !== $got) {
            throw new RuntimeException("{$table}: {$want['rows']} rows in the old database, {$got['rows']} arrived"
                . ($want['rows'] === $got['rows'] ? ', and their contents differ.' : '.'));
        }
        line(sprintf('  %-24s %6d rows, contents identical', $table, $got['rows']));
    }

    // Each sequence where the old database's stood, so the next id is the one
    // it would have handed out.
    foreach (mergeSequences($source, $sourceTables) as $sequence => $state) {
        $set = $target->prepare('SELECT setval(?, ?, ?)');
        $set->bindValue(1, $sequence);
        $set->bindValue(2, (int) $state['last_value'], PDO::PARAM_INT);
        $set->bindValue(3, (bool) $state['is_called'], PDO::PARAM_BOOL);
        $set->execute();
    }

    // What had run on the old database has run here now: its tables are these.
    $record = $target->prepare('INSERT INTO migrations (folder, filename, applied_at) VALUES (?, ?, ?)');
    $recorded = 0;
    foreach (recordedMigrationRows($source) as $row) {
        if ($row['folder'] === 'users') {
            $record->execute(['users', $row['filename'], $row['applied_at']]);
            $recorded++;
        }
    }
    line("  recorded the {$recorded} users/ migrations the old database had applied");

    $target->commit();
    $source->exec('COMMIT');
} catch (\Throwable $e) {
    $target->rollBack();
    $source->exec('ROLLBACK');
    stop('Rolled back - ' . $targetName . ' is as it was' . (isset($applied[$targetName]) ? ' after step 1' : '')
        . ', and so is the config. ' . $e->getMessage());
}

// ── 3. The config ─────────────────────────────────────────────────────────────

$merged = $config;
unset($merged['databases']);
$merged = ['database' => $targetName] + $merged;

// Written aside and renamed, under a name that is itself a *.local.php - so
// that one left behind by a crash is ignored by git and left out of
// build-dist.php like the file it stands for - and readable by its owner only.
$path = localConfigPath('database');
$temporary = dirname($path) . '/database.merge-' . bin2hex(random_bytes(4)) . '.local.php';
$umask = umask(0077);
$written = file_put_contents($temporary, "<?php\n\nreturn " . var_export($merged, true) . ";\n");
umask($umask);
if ($written === false || !rename($temporary, $path)) {
    @unlink($temporary);
    stop("The rows are in {$targetName}, but config/database.local.php could not be rewritten. Replace its 'databases'"
        . " entry with 'database' => '{$targetName}' by hand.");
}
if (DIRECTORY_SEPARATOR === '/') {
    @chmod($path, 0600);
}

line();
line("Done. config/database.local.php names one database now: {$targetName}.");
line("{$sourceName} is " . (isset($applied[$sourceName]) ? 'as it was after step 1' : 'untouched') . ' - drop it once the site runs well without it.');
line('Then `php migration.php`: the anotoki library\'s set (anotoki_translations) is applied on the merged database only.');

// An alias with no migrations folder (star_rail was one, meant for a site that
// was never written) had nothing in it for this code to read; it goes from the
// config with the rest of the list, and its database stays where it is.
$others = array_diff(array_keys($config['databases']), ['users', 'genshin_impact']);
foreach ($others as $alias) {
    line("'{$alias}' ({$config['databases'][$alias]}) was named too, with no migrations and nothing reading it; it is"
        . ' no longer in the config, and the database is left as it is.');
}
