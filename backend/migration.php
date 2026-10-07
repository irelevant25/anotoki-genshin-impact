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
 * Nor will it wait for another apply: one runs at a time, whoever started it
 * (the admin panel's Migrations page, setup.php, another migration.php), and
 * this one says so and stops.
 *
 * The engine - reading, splitting and applying the SQL, the record of what ran,
 * the lock - is the anotoki sites' shared one (anotoki/lib's Migrator), set up
 * for this site's two folders in api/migration_runner.php, so the admin panel
 * and the installer build a database exactly the way this does. This file is
 * that engine with a command line and some colour around it.
 */

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/api/migration_runner.php';

use Anotoki\Lib\Migrations\MigrationSet;

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

/**
 * Files recorded as applied that are no longer on disk. Worth saying: it means
 * somebody deleted or renamed a migration, and this database and a fresh one
 * are no longer the same database.
 */
function sayMissing(string $folder, array $missing): void
{
    foreach ($missing as $file) {
        say('red', "  ! {$file} is recorded as applied but is not in migrations/{$folder}/");
    }
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

$folders = $only === null ? MIGRATION_FOLDERS : [$only];

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

    // Read as the table is - the one from before the two folders shared it
    // too: looking changes nothing, and neither does a run that is refused
    // below. Only applying brings the table up to the shape with a folder per
    // row (ensureMigrationsTable(), the engine's `prepare`).
    $recorded = recordedMigrations($pdo);
    $files = [];
    $engine = siteMigrator($pdo, $only);
    foreach (migrationSets($only) as $set) {
        $files[$set->name] = $engine->files($set);
    }
} catch (\Throwable $e) {
    say('red', '  Cannot reach it: ' . $e->getMessage());
    exit(1);
}

$missing = [];
$pending = [];
foreach ($folders as $folder) {
    $missing[$folder] = array_values(array_diff($recorded[$folder], $files[$folder]));
    $pending[$folder] = array_values(array_diff($files[$folder], $recorded[$folder]));
}

// ─── Looking ─────────────────────────────────────────────────────────────────

if ($statusOnly || $dryRun) {
    // A database whose record says the folders would run out of order - the
    // content half of a site not yet merged, or genshin_impact/ asked for
    // before users/ has run - is refused when applying (the engine's
    // beforeApply, api/migration_runner.php); looking only warns.
    $refusal = migrationsOrderRefusal($recorded, $only);
    if ($refusal !== null) {
        say('yellow', "\n  " . $refusal);
    }

    foreach ($folders as $folder) {
        say('cyan', "\n  ── migrations/{$folder}/");

        if ($statusOnly) {
            foreach ($files[$folder] as $file) {
                $done = !in_array($file, $pending[$folder], true);
                echo '  ' . ($done ? colour('green', '✔') : colour('yellow', '·')) . ' ' . $file
                    . ($done ? '' : colour('yellow', '   pending')) . "\n";
            }
            printf("  %d applied, %d pending\n", count($files[$folder]) - count($pending[$folder]), count($pending[$folder]));
            sayMissing($folder, $missing[$folder]);
            continue;
        }

        sayMissing($folder, $missing[$folder]);
        if (!$pending[$folder]) {
            say('green', '  Up to date - ' . count($files[$folder]) . ' migrations.');
        }
        foreach ($pending[$folder] as $file) {
            say('yellow', '  would apply ' . $file);
        }
    }

    if ($dryRun) {
        say('grey', "\n--dry-run: nothing was written.");
    }
    exit(0);
}

// ─── Applying ────────────────────────────────────────────────────────────────

// The engine tells each file as it starts it (beforeFile, inside the file's
// transaction); its line is finished when the next one starts, or when the
// run is over. A folder with nothing to run is said to be up to date as the
// run passes it.
$announced = [];
$open = false;

$announce = function (string $folder) use (&$announced, $missing): void {
    if (!isset($announced[$folder])) {
        $announced[$folder] = true;
        say('cyan', "\n  ── migrations/{$folder}/");
        sayMissing($folder, $missing[$folder]);
    }
};

// Every folder before $folder (or every one, for null) not announced yet had nothing to run.
$upToDateBefore = function (?string $folder) use (&$announced, $folders, $files, $announce): void {
    foreach ($folders as $earlier) {
        if ($earlier === $folder) {
            return;
        }
        if (!isset($announced[$earlier])) {
            $announce($earlier);
            say('green', '  Up to date - ' . count($files[$earlier]) . ' migrations.');
        }
    }
};

$engine = siteMigrator($pdo, $only, beforeFile: function (PDO $pdo, MigrationSet $set, string $file) use (&$open, $announce, $upToDateBefore): void {
    if ($open) {
        say('green', 'done');
    }
    $upToDateBefore($set->name);
    $announce($set->name);
    echo '  ' . $file . ' ... ';
    $open = true;
});

try {
    $result = $engine->apply();
} catch (\Throwable $e) {
    // The connection itself, or the record that could not be brought to its shape.
    say('red', ($open ? "FAILED\n" : "\n") . '  ' . $e->getMessage());
    exit(1);
}

if ($result['busy']) {
    say('red', "\n  Another apply is running - the admin panel's Migrations page, setup.php or another migration.php."
        . ' Nothing was applied: run this again once it has finished.');
    exit(1);
}

if ($result['failed'] !== null) {
    say('red', 'FAILED');
    say('red', '    ' . $result['error']);
    say('yellow', '    Nothing from this file was applied. The migrations before it stand.');
    // Stopped here, the other folder included: everything after this file is
    // written expecting it to have run, and the two folders share one
    // namespace in an order that matters (api/migration_runner.php,
    // MIGRATION_FOLDERS).
    $stoppedAt = $result['failed']['set'];
    $notRun = array_slice(MIGRATION_FOLDERS, array_search($stoppedAt, MIGRATION_FOLDERS, true) + 1);
    say('red', "\nStopped at migrations/{$stoppedAt}/." . ($notRun && $only === null
        ? ' Not run: ' . implode(', ', array_map(fn ($f) => "migrations/{$f}/", $notRun)) . '.'
        : ''));
    exit(1);
}

if ($result['error'] !== null) {
    // Refused before anything ran: the folders would have run out of order.
    say('red', "\n  " . $result['error']);
    exit(1);
}

if ($open) {
    say('green', 'done');
}
$upToDateBefore(null);

if ($result['applied']) {
    say('cyan', "\nDone.");
}

exit(0);
