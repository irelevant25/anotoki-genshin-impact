<?php

/**
 * migration.php - builds the database from its migrations, and nothing else
 *
 *   php migration.php                  create it if missing, apply what is pending
 *   php migration.php --status         say what has run and what has not
 *   php migration.php --dry-run        say what would be applied, and apply nothing
 *   php migration.php --folder=users   one migrations folder rather than both
 *
 * The one database is built from two folders, migrations/users/ (the site's
 * half: translations, languages, settings, page switches, people) and
 * migrations/genshin_impact/ (the game content) - they were two databases once.
 *
 * WHAT CHANGED, AND WHY
 *
 * There used to be two schema files - schema_pgsql_users.sql and
 * schema_pgsql_genshin_impact.sql - each holding the whole shape of a database
 * as it currently stood, next to a migrations/ folder holding the same shape
 * as a sequence of changes. Two descriptions of one thing, and nothing keeping
 * them in step: by the time they were deleted, the language table had four
 * columns in the schema file and one in the migration that created it, and the
 * character roles table had two different names.
 *
 * That is not a bug that gets fixed, it is a bug that recurs. A schema file is
 * only right until the next migration, and the only way to keep one honest is
 * to remember, every time, to change it too.
 *
 * So the migrations are the description now, and there is one of them. A
 * database is what you get by applying 001 and then everything after it, in
 * order, and that includes the rows the migrations insert - the languages, the
 * sites, every translated string. A database built here today is the same
 * database as one built from the same folder a year from now.
 *
 * Two scripts went with the schema files. migration_pgsql.php and its MySQL
 * twin generated migrations by diffing a schema file against a replay of the
 * migrations folder - which cannot mean anything without a schema file to diff
 * against, and which is also how the drift got in: a generated ALTER is a
 * guess about intent, and a renamed column is indistinguishable from a dropped
 * one and an added one. Migrations are written by hand now. init.php went too:
 * creating the database and applying the first migration are the first two
 * things this does.
 *
 * WHAT IT WILL NOT DO
 *
 * It will not un-apply anything. There is no down migration here and there is
 * not meant to be: the ones that matter are irreversible anyway - a dropped
 * column does not remember what was in it - and a rollback that half works is
 * worse than one that was never offered.
 *
 * A file already recorded in `migrations` is never run again, so editing one
 * that has been applied changes nothing on a database that has it and
 * everything on a database that has not. Write another file instead.
 *
 * The engine itself - reading, splitting, and applying the SQL - lives in
 * api/migration_runner.php, so the admin apply endpoint and the installer build
 * a database exactly the way this does. This file is that engine with a command
 * line and some colour around it.
 */

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/api/migration_runner.php';

// ─── Output ──────────────────────────────────────────────────────────────────

function colour(string $colour, string $text): string
{
    $codes = ['red' => 31, 'green' => 32, 'yellow' => 33, 'blue' => 34, 'cyan' => 36, 'grey' => 90];

    return "\033[" . ($codes[$colour] ?? 0) . "m" . $text . "\033[0m";
}

function say(string $colour, string $text): void
{
    echo colour($colour, $text) . "\n";
}


// ─── Doing it ────────────────────────────────────────────────────────────────

$options = getopt('', ['status', 'dry-run', 'apply-only', 'folder::', 'db::', 'help']);

if (isset($options['help'])) {
    echo file_get_contents(__FILE__, false, null, 0, 1400);
    exit(0);
}

$statusOnly = isset($options['status']);
// --dry-run and the old --apply-only, which named what is now simply the
// default. Kept so anything already written against it keeps working.
$dryRun = isset($options['dry-run']);
// --db named a database when each folder had one; it names the folder now.
$only = isset($options['folder']) ? (string) $options['folder'] : (isset($options['db']) ? (string) $options['db'] : null);

if ($only !== null && !in_array($only, MIGRATION_FOLDERS, true)) {
    say('red', "No migrations folder '{$only}'. There are: " . implode(', ', MIGRATION_FOLDERS));
    exit(1);
}

// Written by setup.php, which is also what builds the database the first time -
// this is for everything after that.
try {
    $config = databaseConfig();
} catch (NotSetUpException $e) {
    say('red', $e->getMessage());
    exit(1);
}

$name = $config['database'];
say('cyan', "\n══ " . $name . ' ' . str_repeat('═', max(0, 44 - strlen($name))));

try {
    if (!$statusOnly && !$dryRun && ensureDatabase($config, $name)) {
        say('green', '  Database created.');
    }

    $pdo = getDb();

    // Read as the table is: looking changes nothing, and neither does a run
    // that is refused below. Only applying brings the table up to the shape
    // with a folder per row.
    $recorded = recordedMigrations($pdo);
} catch (\Throwable $e) {
    say('red', '  Cannot reach it: ' . $e->getMessage());
    exit(1);
}

// A database whose record says the folders would run out of order - the
// content half of a site not yet merged, or genshin_impact/ asked for before
// users/ has run - is refused; looking only warns.
$refusal = migrationsOrderRefusal($recorded, $only);
if ($refusal !== null) {
    say($statusOnly || $dryRun ? 'yellow' : 'red', "\n  " . $refusal);
    if (!$statusOnly && !$dryRun) {
        exit(1);
    }
}

// Applying holds the migrations lock, so the admin button or setup.php cannot
// run the same file at the same moment. It goes with the connection at exit.
if (!$statusOnly && !$dryRun) {
    $pdo->query('SELECT pg_advisory_lock(' . MIGRATION_LOCK . ')');
    ensureMigrationsTable($pdo);
    $recorded = recordedMigrations($pdo);
}

$exitCode = 0;
$appliedAnything = false;

foreach (MIGRATION_FOLDERS as $folder) {
    if ($only !== null && $folder !== $only) {
        continue;
    }

    say('cyan', "\n  ── migrations/{$folder}/");

    $files = migrationFiles($folder);
    $applied = $recorded[$folder];
    $pending = array_values(array_diff($files, $applied));

    // A file recorded as applied that is no longer on disk. Worth saying: it
    // means somebody deleted or renamed a migration, and this database and a
    // fresh one are no longer the same database.
    $missing = array_values(array_diff($applied, $files));

    if ($statusOnly) {
        foreach ($files as $file) {
            $done = in_array($file, $applied, true);
            echo '  ' . ($done ? colour('green', '✔') : colour('yellow', '·')) . ' ' . $file
                . ($done ? '' : colour('yellow', '   pending')) . "\n";
        }
        printf("  %d applied, %d pending\n", count($files) - count($pending), count($pending));

        foreach ($missing as $file) {
            say('red', "  ! {$file} is recorded as applied but is not in migrations/{$folder}/");
        }

        continue;
    }

    foreach ($missing as $file) {
        say('red', "  ! {$file} is recorded as applied but is not in migrations/{$folder}/");
    }

    if (!$pending) {
        say('green', '  Up to date - ' . count($files) . ' migrations.');
    }

    foreach ($pending as $file) {
        if ($dryRun) {
            say('yellow', '  would apply ' . $file);
            continue;
        }

        echo '  ' . $file . ' ... ';

        try {
            applyMigration($pdo, $folder, $file);
            say('green', 'done');
            $appliedAnything = true;
        } catch (\Throwable $e) {
            say('red', 'FAILED');
            say('red', '    ' . $e->getMessage());
            say('yellow', '    Nothing from this file was applied. The migrations before it stand.');
            $exitCode = 1;
            $stoppedAt = $folder;
            // Stop here, the other folder included: everything after this file
            // is written expecting it to have run, and the two folders share
            // one namespace in an order that matters (api/migration_runner.php,
            // MIGRATION_FOLDERS).
            break 2;
        }
    }
}

if ($dryRun) {
    say('grey', "\n--dry-run: nothing was written.");
} elseif (isset($stoppedAt)) {
    $notRun = array_slice(MIGRATION_FOLDERS, array_search($stoppedAt, MIGRATION_FOLDERS, true) + 1);
    say('red', "\nStopped at migrations/{$stoppedAt}/." . ($notRun && $only === null
        ? ' Not run: ' . implode(', ', array_map(fn($f) => "migrations/{$f}/", $notRun)) . '.'
        : ''));
} elseif ($appliedAnything) {
    say('cyan', "\nDone.");
}

exit($exitCode);
