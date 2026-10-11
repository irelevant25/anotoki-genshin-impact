<?php

/**
 * This site's migrations, on the anotoki sites' shared engine.
 *
 * The engine itself - reading the files under backend/migrations/{folder}/,
 * running each one whole or not at all together with its record, stopping at
 * the first that fails, one apply at a time under an advisory lock - is
 * anotoki/lib's Migrator (vendor/anotoki/lib), the same on every anotoki site.
 * What is this site's is here: its two folders and their order, its lock, and
 * the two things only this site needs - adopting the bookkeeping table from
 * when each folder had a database of its own (ensureMigrationsTable(), the
 * Migrator's `prepare`), and refusing to build the folders out of order
 * (migrationsOrderRefusal(), its `beforeApply`).
 *
 * After the site's two folders comes one set that is the library's own:
 * anotoki_translations (vendor/anotoki/lib/php/migrations/translations), the
 * tables of the words in the shape the library works with, and its own words
 * (anotoki-lib 0.3.0, api/translations.php). It runs last - users/ made those
 * tables long before the library existed, and users/050 moved them into its
 * shape - and it is recorded like the folders, under its own name in the
 * bookkeeping table's `folder` column.
 *
 * Whatever applies migrations goes through siteMigrator() - the command line
 * (migration.php), the admin panel's Migrations page (/api/admin/migrations,
 * api/index.php), the installer (setup.php) and merge-databases.php - so a
 * database built any of those ways is the same database, which is the whole
 * point of there being one description of the schema. Nothing here prints
 * anything or reads a request.
 *
 * See migration.php's header for why the migrations *are* the schema, and why
 * nothing un-applies anything.
 */

use Anotoki\Lib\Migrations\MigrationSet;
use Anotoki\Lib\Migrations\Migrator;
use Anotoki\Lib\Translations\Schema as TranslationsSchema;

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
 *
 * Each folder is one of the engine's sets, under its own name: that name is
 * what the bookkeeping table's `folder` column holds. The library's set comes
 * after them (migrationSetNames()), and is not a folder of this site's.
 */
const MIGRATION_FOLDERS = ['users', 'genshin_impact'];

/**
 * Every set the database is built from, in the order they run: the site's two
 * folders, then the library's anotoki_translations. That set needs the tables
 * users/ made (and users/050 moved into its shape) and nothing of the
 * content's, but it comes last all the same: a library's sets follow a site's
 * own, and this one order is what the guard below holds every database to.
 *
 * @return list<string>
 */
function migrationSetNames(): array
{
    return [...MIGRATION_FOLDERS, TranslationsSchema::SET];
}

/** A set as a person reads its name: a folder of this site's, or the library's set. */
function migrationSetLabel(string $set): string
{
    return in_array($set, MIGRATION_FOLDERS, true) ? "migrations/{$set}/" : "the anotoki library's {$set}";
}

/**
 * Key of the advisory lock every apply takes, so two appliers (the admin
 * button pressed twice, setup.php beside the CLI) never run one file twice:
 * the second is told the first is busy, and does nothing. This site's own key
 * rather than the engine's default, so a build from before the shared engine
 * and this one still keep out of each other's way.
 */
const MIGRATION_LOCK = 4260917001;

/** backend/migrations, whichever context loaded this (api/ is one level down). */
function migrationsRoot(): string
{
    return dirname(__DIR__) . '/migrations';
}

/**
 * The sets as the engine's, in the order they run - the two folders, then the
 * library's - or the one set named.
 *
 * @return list<MigrationSet>
 */
function migrationSets(?string $only = null): array
{
    $sets = [];
    foreach (MIGRATION_FOLDERS as $folder) {
        if ($only === null || $only === $folder) {
            $sets[] = new MigrationSet($folder, migrationsRoot() . '/' . $folder);
        }
    }
    if ($only === null || $only === TranslationsSchema::SET) {
        $sets[] = TranslationsSchema::migrationSet();
    }

    if ($sets === []) {
        throw new InvalidArgumentException("No migrations folder '{$only}'. There are: " . implode(', ', migrationSetNames()));
    }

    return $sets;
}

/**
 * The engine, for one database: both folders and the library's set in order,
 * or only $only - the command line's --folder, and merge-databases.php, which
 * brings each half of a two-database installation up to date on its own (its
 * folder alone: the library's set is the merged database's, applied there
 * once the halves are one).
 *
 * The order guard is for a database holding both folders; merge-databases.php
 * turns it off ($orderGuard false), because each of the two databases it
 * merges holds one folder only - that is what it is there to mend.
 * $beforeFile(pdo, set, name) is told each file as it starts, inside the
 * file's transaction - the command line's progress.
 *
 * The connection is used as it is given, and needs PDO::ERRMODE_EXCEPTION:
 * getDb(), setup.php and the scripts all set it.
 */
function siteMigrator(PDO $pdo, ?string $only = null, bool $orderGuard = true, ?Closure $beforeFile = null): Migrator
{
    $options = [
        'lock' => MIGRATION_LOCK,
        // Before the table is read for an apply: made in this site's shape
        // when it is missing, brought to it from a folder's own database.
        'prepare' => ensureMigrationsTable(...),
    ];

    if ($beforeFile !== null) {
        $options['beforeFile'] = $beforeFile;
    }

    if ($orderGuard) {
        // Once, before anything runs. The engine ends the apply with this
        // message as its error, nothing applied. (It runs after `prepare`, so
        // a refused database has had its record labelled by folder - which
        // any later run would do the same way, and which is right whatever
        // happens next.)
        $options['beforeApply'] = function (PDO $pdo, array $files) use ($only): ?string {
            $refusal = migrationsOrderRefusal(recordedMigrations($pdo), $only);
            if ($refusal !== null) {
                throw new RuntimeException($refusal);
            }

            return null;
        };
    }

    return new Migrator($pdo, migrationSets($only), $options);
}

/**
 * The files on disk, set by set - the two folders and the library's - as the
 * engine lists them: by name, in natural order, so a hundredth migration does
 * not sort between the ninth and the tenth.
 *
 * @return array<string, list<string>> set => file names
 */
function migrationFilesByFolder(PDO $pdo): array
{
    $migrator = siteMigrator($pdo);
    $files = [];
    foreach (migrationSets() as $set) {
        $files[$set->name] = $migrator->files($set);
    }

    return $files;
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

// ─── The record of what has run ──────────────────────────────────────────────

/**
 * The table that records what has run, one row per folder and file - the
 * engine's `prepare`, so it runs before an apply reads the table.
 *
 * Created here, in this site's shape, when it is missing: the engine would
 * make the same table for two sets, but not for one (merge-databases.php
 * applies one folder at a time), and the shape is this site's, whichever way
 * the database is built. Each folder's 001 creates it only if it is missing
 * too, so this shape is the one that stands.
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
 * have - is settled by the tables the database holds. Only the site's own
 * folders are candidates: a table from before they shared one never recorded
 * a file of the library's.
 */
function migrationsFolderOf(array $recorded, PDO $pdo): string
{
    $counts = [];
    foreach (migrationFilesByFolder($pdo) as $candidate => $files) {
        if (in_array($candidate, MIGRATION_FOLDERS, true)) {
            $counts[$candidate] = count(array_intersect($recorded, $files));
        }
    }
    arsort($counts);
    [$first, $second] = array_values($counts) + [0, 0];

    if ($first === $second) {
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
 * What the database has recorded, by set - the two folders and the library's
 * - reading only, whichever shape the table has (see
 * migrationsTableAddFolder()) and none at all. For what must understand a
 * table the engine's `prepare` has not adopted yet: the order guard,
 * `migration.php --status`, the installer's test button and
 * merge-databases.php.
 *
 * @return array<string, string[]> set => file names
 */
function recordedMigrations(PDO $pdo): array
{
    $byFolder = array_fill_keys(migrationSetNames(), []);

    foreach (recordedMigrationRows($pdo) as $row) {
        $byFolder[$row['folder']][] = $row['filename'];
    }

    return $byFolder;
}

/**
 * Every row of the record, oldest first, each with its folder - reading only,
 * whichever shape the table has; none when there is no table. For
 * merge-databases.php, which carries each row over with the time it ran.
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
 * good (see MIGRATION_FOLDERS). $only is the one set about to be applied,
 * when only one is.
 *
 * The library's set is the next in that order, after both folders
 * (migrationSetNames()): its 001 makes the tables of the words where they are
 * missing, so run before users/ it would leave users/ building on the
 * library's tables instead of its own. Nothing applies it out of order -
 * applying it alone before the folders is refused here like any set - but a
 * record that says otherwise is refused all the same.
 */
function migrationsOrderRefusal(array $recorded, ?string $only = null): ?string
{
    $sets = migrationSetNames();

    foreach ($sets as $position => $set) {
        if (($recorded[$set] ?? []) !== []) {
            continue;
        }

        $later = array_slice($sets, $position + 1);
        foreach ($later as $next) {
            if (($recorded[$next] ?? []) === []) {
                continue;
            }
            if (in_array($next, MIGRATION_FOLDERS, true)) {
                return "This database has run migrations/{$next}/ but not migrations/{$set}/, which comes first - it is"
                    . ' the content half of a site that still has two databases, or a folder was applied on its own.'
                    . " Applying migrations/{$set}/ over it would build the site's half on top of the content's tables."
                    . ' Merge the other half in with `php merge-databases.php`, or install into an empty database.';
            }

            return 'This database has run ' . migrationSetLabel($next) . ' but not ' . migrationSetLabel($set)
                . ', which comes before it - a set was applied on its own. What comes first would now build on what came'
                . ' after it, so nothing more is applied here: install into an empty database.';
        }

        if ($only !== null && in_array($only, $later, true)) {
            return migrationSetLabel($set) . ' comes before ' . migrationSetLabel($only)
                . ' and has not run here: apply it first, or apply everything.';
        }
    }

    return null;
}
