<?php

/**
 * The migration engine, with no opinion on who is driving.
 *
 * These functions read the files under backend/migrations/{folder}/, apply the
 * ones the database has not seen, and record each in its `migrations` table -
 * by folder and file name, because both folders start at 001_initial_schema.sql.
 * They print nothing and read no request - so the CLI (migration.php), the admin
 * apply endpoint, and the first-run installer all build the database the same
 * way, which is the whole point of there being one description of the schema.
 *
 * See migration.php's header for why the migrations *are* the schema, and why
 * nothing here un-applies anything.
 */

/**
 * The migration folders, in the order they are applied. Both build the one
 * database: users/ is the site's half (translations, languages, settings, page
 * switches, people), genshin_impact/ the game content. They were two databases
 * once, so neither refers to the other's tables - but they share one namespace
 * now, and history made the order matter: users/001 made an account table
 * called `roles` (and put ADMIN, EDITOR and USER in it), and users/040 dropped
 * it again, while `roles` is also genshin_impact/'s table of character roles.
 * users/ first means its `roles` is gone before the other one is made. Run
 * over a database that already holds the content, users/001 would put those
 * rows among the character roles and 040 would then fail on the content's
 * references to that table - which is what migrationsOrderRefusal() stops.
 */
const MIGRATION_FOLDERS = ['users', 'genshin_impact'];

/**
 * Key of the advisory lock applying migrations holds, so two appliers (the
 * admin button pressed twice, setup.php beside the CLI) never run one file
 * twice.
 */
const MIGRATION_LOCK = 4260917001;

/** Applying migrations here would build them in the wrong order; see migrationsOrderRefusal(). */
final class MigrationOrderException extends RuntimeException
{
}

/** backend/migrations, whichever context loaded this (api/ is one level down). */
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

/** The migration files of one folder, in the order they must be applied. */
function migrationFiles(string $folder): array
{
    $directory = migrationsRoot() . '/' . $folder;

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
 * The table that records what has run, one row per folder and file.
 *
 * Created here as well as by each folder's 001, because it is read before the
 * first migration is applied - on a database where nothing exists yet,
 * including this. The 001s create it only if it is missing, so this shape is
 * the one that stands.
 */
function ensureMigrationsTable(PDO $pdo): void
{
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS migrations (
            id         SERIAL          PRIMARY KEY,
            folder     VARCHAR(64)     NOT NULL,
            filename   VARCHAR(255)    NOT NULL,
            applied_at TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (folder, filename)
        )'
    );

    $hasFolder = (bool) $pdo->query(
        "SELECT 1 FROM information_schema.columns
          WHERE table_schema = current_schema() AND table_name = 'migrations' AND column_name = 'folder'"
    )->fetchColumn();

    if (!$hasFolder) {
        migrationsTableAddFolder($pdo);
    }
}

/**
 * Brings a `migrations` table from when each folder had a database of its own
 * up to the shared shape: every row it holds came from one folder, and it is
 * the folder whose files those rows name - the content database's table names
 * genshin_impact's files, the old site database's names users'. Only
 * 001_initial_schema.sql is in both, so the count is never close.
 */
function migrationsTableAddFolder(PDO $pdo): void
{
    $folder = migrationsFolderOf($pdo->query('SELECT filename FROM migrations')->fetchAll(PDO::FETCH_COLUMN), $pdo);

    $ownTransaction = !$pdo->inTransaction();
    if ($ownTransaction) {
        $pdo->beginTransaction();
    }

    try {
        $pdo->exec('ALTER TABLE migrations ADD COLUMN IF NOT EXISTS folder VARCHAR(64)');
        $pdo->prepare('UPDATE migrations SET folder = ? WHERE folder IS NULL')->execute([$folder]);
        $pdo->exec('ALTER TABLE migrations ALTER COLUMN folder SET NOT NULL');
        $pdo->exec('ALTER TABLE migrations DROP CONSTRAINT IF EXISTS migrations_filename_key');
        $pdo->exec(
            "DO \$\$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_constraint
                                WHERE conrelid = 'migrations'::regclass AND conname = 'migrations_folder_filename_key') THEN
                    ALTER TABLE migrations ADD CONSTRAINT migrations_folder_filename_key UNIQUE (folder, filename);
                END IF;
            END \$\$"
        );

        if ($ownTransaction) {
            $pdo->commit();
        }
    } catch (\Throwable $e) {
        if ($ownTransaction) {
            $pdo->rollBack();
        }
        throw $e;
    }
}

/**
 * The folder a list of recorded file names came from: the one holding most of
 * them. A tie - nothing recorded but 001_initial_schema.sql, which both folders
 * have - is settled by the tables the database holds, when it is given.
 */
function migrationsFolderOf(array $recorded, ?PDO $pdo = null): string
{
    $counts = [];
    foreach (MIGRATION_FOLDERS as $candidate) {
        $counts[$candidate] = count(array_intersect($recorded, migrationFiles($candidate)));
    }
    arsort($counts);
    [$first, $second] = array_values($counts) + [0, 0];

    if ($first === $second && $pdo !== null) {
        if ($pdo->query("SELECT to_regclass('characters') IS NOT NULL")->fetchColumn()) {
            return 'genshin_impact';
        }
        if ($pdo->query("SELECT to_regclass('translations') IS NOT NULL")->fetchColumn()) {
            return 'users';
        }
    }

    return $first === $second ? MIGRATION_FOLDERS[0] : (string) array_key_first($counts);
}

/**
 * What the database has recorded, by folder - reading only, whichever shape
 * the table has (see migrationsTableAddFolder()) and none at all. For the
 * callers that must not write: `migration.php --status`, the installer's test
 * button.
 *
 * @return array<string, string[]> folder => file names
 */
function recordedMigrations(PDO $pdo): array
{
    $byFolder = array_fill_keys(MIGRATION_FOLDERS, []);

    foreach (recordedMigrationRows($pdo) as $row) {
        $byFolder[$row['folder']][] = $row['filename'];
    }

    return $byFolder;
}

/**
 * Every row of the record, oldest first, each with its folder - reading only,
 * whichever shape the table has; none when there is no table. For the admin
 * page, which shows when each ran.
 *
 * @return list<array{id: int, folder: string, filename: string, applied_at: ?string}>
 */
function recordedMigrationRows(PDO $pdo): array
{
    if (!$pdo->query("SELECT to_regclass('migrations') IS NOT NULL")->fetchColumn()) {
        return [];
    }

    $hasFolder = (bool) $pdo->query(
        "SELECT 1 FROM information_schema.columns
          WHERE table_schema = current_schema() AND table_name = 'migrations' AND column_name = 'folder'"
    )->fetchColumn();

    $rows = $pdo->query(
        'SELECT id, ' . ($hasFolder ? 'folder' : 'NULL AS folder') . ', filename, applied_at FROM migrations ORDER BY applied_at ASC, id ASC'
    )->fetchAll(PDO::FETCH_ASSOC);

    if (!$hasFolder) {
        $folder = migrationsFolderOf(array_column($rows, 'filename'), $pdo);
        foreach ($rows as &$row) {
            $row['folder'] = $folder;
        }
        unset($row);
    }

    return $rows;
}

/**
 * Why applying migrations now would build them in the wrong order, or null.
 *
 * A folder with nothing recorded while a later folder has something: the
 * content half of a two-database installation that was never merged (its record
 * names genshin_impact/ only), or genshin_impact/ applied on its own first. Its
 * migrations would then run over the later folder's tables - users/001 would
 * add its account roles to the character roles, and users/040 would fail for
 * good (see MIGRATION_FOLDERS). $only is the one folder about to be applied,
 * when only one is.
 */
function migrationsOrderRefusal(array $recorded, ?string $only = null): ?string
{
    foreach (MIGRATION_FOLDERS as $position => $folder) {
        if ($recorded[$folder] !== []) {
            continue;
        }

        $later = array_slice(MIGRATION_FOLDERS, $position + 1);
        foreach ($later as $next) {
            if ($recorded[$next] !== []) {
                return "This database has run migrations/{$next}/ but not migrations/{$folder}/, which comes first - it is"
                    . ' the content half of a site that still has two databases, or a folder was applied on its own.'
                    . " Applying migrations/{$folder}/ over it would build the site's half on top of the content's tables."
                    . ' Merge the other half in with `php merge-databases.php`, or install into an empty database.';
            }
        }

        if ($only !== null && in_array($only, $later, true)) {
            return "migrations/{$folder}/ comes before migrations/{$only}/ and has not run here: apply it first, or apply everything.";
        }
    }

    return null;
}

/** Runs $work holding the migrations lock (MIGRATION_LOCK), and lets it go again whatever happens. */
function withMigrationLock(PDO $pdo, callable $work): mixed
{
    $pdo->query('SELECT pg_advisory_lock(' . MIGRATION_LOCK . ')');

    try {
        return $work();
    } finally {
        $pdo->query('SELECT pg_advisory_unlock(' . MIGRATION_LOCK . ')');
    }
}

/** The files of one folder the database has recorded as applied. */
function appliedMigrations(PDO $pdo, string $folder): array
{
    $query = $pdo->prepare('SELECT filename FROM migrations WHERE folder = ?');
    $query->execute([$folder]);

    return $query->fetchAll(PDO::FETCH_COLUMN);
}

/** The files of one folder on disk the database has not recorded yet, in apply order. */
function pendingMigrations(PDO $pdo, string $folder): array
{
    ensureMigrationsTable($pdo);
    return array_values(array_diff(migrationFiles($folder), appliedMigrations($pdo, $folder)));
}

/**
 * Applies one file, all of it or none of it.
 *
 * PostgreSQL takes DDL inside a transaction, so a migration that fails halfway
 * leaves nothing behind - and the row saying it ran is written inside the same
 * transaction, so there is no window where the change happened and the record
 * of it did not.
 */
function applyMigration(PDO $pdo, string $folder, string $filename): void
{
    $path = migrationsRoot() . '/' . $folder . '/' . $filename;
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

        $pdo->prepare('INSERT INTO migrations (folder, filename) VALUES (?, ?) ON CONFLICT (folder, filename) DO NOTHING')->execute([$folder, $filename]);
        $pdo->commit();
    } catch (\Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}

/**
 * Applies every pending file of one folder, stopping at the first failure.
 *
 * Stopping is deliberate: each migration is written expecting the ones before
 * it to have run, so carrying on past a failure would apply changes against a
 * shape they were never meant for. Returns what ran, and what did not and why.
 *
 * @return array{applied: string[], failed: ?string, error: ?string}
 */
function applyPendingMigrations(PDO $pdo, string $folder): array
{
    $applied = [];

    foreach (pendingMigrations($pdo, $folder) as $filename) {
        try {
            applyMigration($pdo, $folder, $filename);
            $applied[] = $filename;
        } catch (\Throwable $e) {
            return ['applied' => $applied, 'failed' => $filename, 'error' => $e->getMessage()];
        }
    }

    return ['applied' => $applied, 'failed' => null, 'error' => null];
}

/**
 * Every folder in turn, stopping at the first failure in any of them, under
 * the migrations lock. The folders share one namespace, and the order they run
 * in is part of what makes the database right (see MIGRATION_FOLDERS), so a
 * later folder does not go on over an earlier one that stopped halfway: it is
 * reported as not run. A database whose record says the order was already
 * broken is refused before anything runs.
 *
 * @return array<string, array{applied: string[], failed: ?string, error: ?string}> by folder
 * @throws MigrationOrderException
 */
function applyAllPendingMigrations(PDO $pdo): array
{
    return withMigrationLock($pdo, function () use ($pdo): array {
        $refusal = migrationsOrderRefusal(recordedMigrations($pdo));
        if ($refusal !== null) {
            throw new MigrationOrderException($refusal);
        }

        $results = [];
        $stoppedAt = null;

        foreach (MIGRATION_FOLDERS as $folder) {
            if ($stoppedAt !== null) {
                $results[$folder] = ['applied' => [], 'failed' => null, 'error' => "not run: migrations/{$stoppedAt}/ stopped at a failure first"];
                continue;
            }

            $results[$folder] = applyPendingMigrations($pdo, $folder);
            if ($results[$folder]['failed'] !== null) {
                $stoppedAt = $folder;
            }
        }

        return $results;
    });
}
