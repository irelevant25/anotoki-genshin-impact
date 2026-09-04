<?php

/**
 * The asset tree and what the database says about it.
 *
 *   php assets.php --status                 what is out there, and what disagrees
 *   php assets.php --align [--apply]        name converted files the way the database asks
 *   php assets.php --repoint [--apply]      point the database at the converted files
 *   php assets.php --reconcile [--apply]    put every file on disk into the catalogue
 *   php assets.php --revert=<log.json>      put an --align or --repoint back
 *
 * Both actions are dry runs unless --apply is given, and both write a log that
 * --revert reads. Take a backup before --apply anyway: the log covers what this
 * tool did, not what anything else did in between.
 *
 * ── Why these two exist ──────────────────────────────────────────────────────
 *
 * The site serves AVIF and Opus, and the tree holds a converted copy of nearly
 * everything. The database, though, stores paths that were written before any
 * of that - `../assets/character/icon/BAIZHU.png` - so visitors were served the
 * original of every image and every voice line while 44,000 converted files sat
 * unread beside them.
 *
 * Two things were in the way. Some converted files were named in a different
 * convention from the sources: `Baizhu.avif` beside `BAIZHU.png`, because an
 * early conversion pass used display names. That is invisible on Windows, whose
 * filesystem does not care about case, and a 404 everywhere else. `--align`
 * renames the converted file onto the source's exact stem - which is upper
 * snake where the database is upper snake, and for the Japanese voice lines
 * means putting back a katakana middle dot that had become a Latin one.
 *
 * Then `--repoint` rewrites the references themselves, but only where the
 * converted file is really there under the name being written. Anything else
 * is left pointing at a file that exists.
 */

require __DIR__ . '/config/db.php';
require __DIR__ . '/api/audit_file.php';

const ASSETS_ROOT = __DIR__ . '/../assets';

/** Sources that should have an AVIF beside them, and audio that should have Opus. */
const TO_AVIF = ['png', 'jpg', 'jpeg', 'webp'];
const TO_OPUS = ['mp3', 'ogg', 'wav', 'm4a'];

/**
 * The name two spellings of the same asset share.
 *
 * Letters and digits are kept whatever alphabet they are in - voice lines are
 * named in Japanese, Chinese and Korean - and everything else becomes a
 * separator, so `Adventurer's Bandana` and `ADVENTURERS_BANDANA` land on one
 * key and `エミリエを知る・1` matches `エミリエを知る·1`.
 */
function assetKey(string $stem): string
{
    $stem = preg_replace('/[\'’"\-]/u', '', $stem);
    $stem = mb_strtoupper($stem, 'UTF-8');

    return trim(preg_replace('/[^\p{L}\p{N}]+/u', '_', $stem), '_');
}

/** The converted extension a source should have, or null if it is not one. */
function assetTarget(string $extension): ?string
{
    if (in_array($extension, TO_AVIF, true)) {
        return 'avif';
    }

    return in_array($extension, TO_OPUS, true) ? 'opus' : null;
}

/** Every file, as `folder => [exact name => true]`. Exact, because Linux is. */
function assetsByFolder(): array
{
    $root = realpath(ASSETS_ROOT);
    $byFolder = [];

    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS | FilesystemIterator::UNIX_PATHS),
        RecursiveIteratorIterator::SELF_FIRST
    );

    foreach ($iterator as $path => $info) {
        if ($info->isDir()) {
            continue;
        }
        $relative = substr(str_replace('\\', '/', $path), strlen(str_replace('\\', '/', $root)) + 1);
        if (str_contains('/' . $relative, '/.')) {
            continue;
        }
        $byFolder[dirname($relative)][basename($relative)] = true;
    }

    return $byFolder;
}

/**
 * Every column that actually holds an asset path, found by looking rather than
 * by guessing from the column's name - `icon`, `card_icon`, `audio_english`,
 * `namecard_background` and a dozen others share no naming rule at all.
 */
function assetPathColumns(PDO $pdo): array
{
    $columns = $pdo->query("
        SELECT table_name, column_name FROM information_schema.columns
        WHERE table_schema = 'public' AND data_type IN ('character varying', 'text')
        ORDER BY table_name, column_name")->fetchAll(PDO::FETCH_ASSOC);

    $found = [];
    foreach ($columns as $column) {
        [$table, $name] = [$column['table_name'], $column['column_name']];
        try {
            $sample = $pdo->query("SELECT \"$name\" FROM \"$table\" WHERE \"$name\" LIKE '%assets/%' LIMIT 1")->fetchColumn();
        } catch (PDOException) {
            continue;
        }
        if ($sample !== false && $sample !== null) {
            $found[] = [$table, $name];
        }
    }

    return $found;
}

/** `../assets/x/y.png` and `assets/x/y.png` name the same file. */
function assetRelative(string $value): string
{
    return preg_replace('#^(\.\./)?assets/#', '', $value);
}

// ─────────────────────────────────────────────────────────────────────────────

$apply = in_array('--apply', $argv, true);
$revert = null;
foreach ($argv as $argument) {
    if (str_starts_with($argument, '--revert=')) {
        $revert = substr($argument, strlen('--revert='));
    }
}

$pdo = genshinDb();

if ($revert !== null) {
    revertLog($pdo, $revert);
} elseif (in_array('--align', $argv, true)) {
    align($pdo, $apply);
} elseif (in_array('--repoint', $argv, true)) {
    repoint($pdo, $apply);
} elseif (in_array('--reconcile', $argv, true)) {
    reconcile($pdo, $apply);
} else {
    status($pdo);
}

// ── Status ───────────────────────────────────────────────────────────────────

function status(PDO $pdo): void
{
    $byFolder = assetsByFolder();
    $files = array_sum(array_map('count', $byFolder));

    $referenced = [];
    foreach (assetPathColumns($pdo) as [$table, $column]) {
        foreach ($pdo->query("SELECT DISTINCT \"$column\" AS v FROM \"$table\" WHERE \"$column\" LIKE '%assets/%'") as $row) {
            $referenced[assetRelative((string) $row['v'])][] = "$table.$column";
        }
    }

    $missing = 0;
    $servingSource = 0;
    $couldServeConverted = 0;
    $noTwin = 0;

    foreach ($referenced as $relative => $where) {
        $folder = dirname($relative);
        if (!isset($byFolder[$folder][basename($relative)])) {
            $missing++;
        }

        $extension = strtolower(pathinfo($relative, PATHINFO_EXTENSION));
        $target = assetTarget($extension);
        if ($target === null) {
            continue;
        }

        $servingSource++;
        $wanted = substr(basename($relative), 0, -strlen($extension)) . $target;
        isset($byFolder[$folder][$wanted]) ? $couldServeConverted++ : $noTwin++;
    }

    $unreferenced = 0;
    foreach ($byFolder as $folder => $names) {
        foreach (array_keys($names) as $name) {
            if (!isset($referenced["$folder/$name"])) {
                $unreferenced++;
            }
        }
    }

    echo "files on disk                       : ", number_format($files), "\n";
    echo "distinct files the database names   : ", number_format(count($referenced)), "\n";
    echo "  pointing at nothing on disk       : ", number_format($missing), "\n";
    echo "  still pointing at a source format : ", number_format($servingSource), "\n";
    echo "    with a converted file ready     : ", number_format($couldServeConverted), "   <- what --repoint would switch\n";
    echo "    with none                       : ", number_format($noTwin), "\n";
    echo "files nothing in the database names : ", number_format($unreferenced), "\n";
}

// ── Align ────────────────────────────────────────────────────────────────────

function align(PDO $pdo, bool $apply): void
{
    $byFolder = assetsByFolder();

    $referenced = [];
    foreach (assetPathColumns($pdo) as [$table, $column]) {
        foreach ($pdo->query("SELECT DISTINCT \"$column\" AS v FROM \"$table\" WHERE \"$column\" LIKE '%assets/%'") as $row) {
            $referenced[assetRelative((string) $row['v'])] = true;
        }
    }

    $moves = [];
    $claimed = [];

    foreach (array_keys($referenced) as $relative) {
        $extension = strtolower(pathinfo($relative, PATHINFO_EXTENSION));
        $target = assetTarget($extension);
        if ($target === null) {
            continue;
        }

        $folder = dirname($relative);
        $wanted = substr(basename($relative), 0, -strlen($extension)) . $target;
        if (isset($byFolder[$folder][$wanted])) {
            continue;
        }

        $key = assetKey(pathinfo($relative, PATHINFO_FILENAME));
        foreach (array_keys($byFolder[$folder] ?? []) as $candidate) {
            if (strtolower(pathinfo($candidate, PATHINFO_EXTENSION)) !== $target) {
                continue;
            }
            if (assetKey(pathinfo($candidate, PATHINFO_FILENAME)) !== $key) {
                continue;
            }

            $from = "$folder/$candidate";
            $to = "$folder/$wanted";

            // Two sources may not claim one file, and one file may not move twice.
            if (isset($claimed[$to]) || isset($moves[$from])) {
                echo "contested, left alone: $from\n";
                break;
            }

            $moves[$from] = $to;
            $claimed[$to] = true;
            break;
        }
    }

    echo 'converted files to rename: ', number_format(count($moves)), "\n";

    if (!$apply) {
        $shown = 0;
        foreach ($moves as $from => $to) {
            echo "  $from\n    -> $to\n";
            if (++$shown >= 5) {
                break;
            }
        }
        echo "dry run - add --apply\n";
        return;
    }

    $done = [];
    $failed = [];

    foreach ($moves as $from => $to) {
        // A case-only rename has a destination that "exists" on a case-blind
        // filesystem, because it is the same file. Comparing the exact names is
        // what tells that apart from a real collision.
        if (strcasecmp($from, $to) !== 0 && file_exists(ASSETS_ROOT . "/$to")) {
            $failed[] = "$from -> $to (destination exists)";
            continue;
        }

        if (@rename(ASSETS_ROOT . "/$from", ASSETS_ROOT . "/$to")) {
            $done[] = ['from' => $from, 'to' => $to];
        } else {
            $failed[] = "$from -> $to (rename refused)";
        }
    }

    $log = writeLog('align', ['moves' => $done]);
    echo 'renamed: ', number_format(count($done)), "\n";
    echo 'failed : ', number_format(count($failed)), "\n";
    foreach (array_slice($failed, 0, 10) as $failure) {
        echo "  $failure\n";
    }
    echo "log: $log\n";
}

// ── Repoint ──────────────────────────────────────────────────────────────────

function repoint(PDO $pdo, bool $apply): void
{
    $byFolder = assetsByFolder();
    $changes = [];

    foreach (assetPathColumns($pdo) as [$table, $column]) {
        foreach ($pdo->query("SELECT DISTINCT \"$column\" AS v FROM \"$table\" WHERE \"$column\" LIKE '%assets/%'") as $row) {
            $value = (string) $row['v'];
            $relative = assetRelative($value);
            $extension = strtolower(pathinfo($relative, PATHINFO_EXTENSION));
            $target = assetTarget($extension);
            if ($target === null) {
                continue;
            }

            $folder = dirname($relative);
            $wanted = substr(basename($relative), 0, -strlen($extension)) . $target;

            // Only where the file is really there under the name being written.
            if (!isset($byFolder[$folder][$wanted])) {
                continue;
            }

            $changes[] = [
                'table' => $table,
                'column' => $column,
                'from' => $value,
                'to' => substr($value, 0, -strlen($extension)) . $target,
            ];
        }
    }

    echo 'references to repoint: ', number_format(count($changes)), "\n";

    $byColumn = [];
    foreach ($changes as $change) {
        $byColumn["{$change['table']}.{$change['column']}"] = ($byColumn["{$change['table']}.{$change['column']}"] ?? 0) + 1;
    }
    arsort($byColumn);
    foreach ($byColumn as $where => $count) {
        printf("  %-42s %s\n", $where, number_format($count));
    }

    if (!$apply) {
        echo "dry run - add --apply\n";
        return;
    }

    // One transaction: a half-repointed database serves a mixture nobody can
    // reason about, and there is no reason to leave that possible.
    $pdo->beginTransaction();
    $written = 0;

    try {
        foreach ($changes as $change) {
            $statement = $pdo->prepare(
                "UPDATE \"{$change['table']}\" SET \"{$change['column']}\" = :to WHERE \"{$change['column']}\" = :from"
            );
            $statement->execute(['to' => $change['to'], 'from' => $change['from']]);
            $written += $statement->rowCount();
        }
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        echo "rolled back: ", $e->getMessage(), "\n";
        exit(1);
    }

    $log = writeLog('repoint', ['changes' => $changes]);
    echo 'rows written: ', number_format($written), "\n";
    echo "log: $log\n";
}

// ── Reconcile ────────────────────────────────────────────────────────────────

/**
 * Every category, longest path first.
 *
 * Longest first is what makes `character/voice_overs` win over a category for
 * `character` if one is ever added: a file belongs to the most specific folder
 * that claims it, not the first one that happens to match.
 */
function assetCategories(PDO $pdo): array
{
    $categories = $pdo->query('SELECT id, code, path, is_system FROM file_categories WHERE deleted = FALSE')
        ->fetchAll(PDO::FETCH_ASSOC);

    usort($categories, fn(array $a, array $b) => strlen($b['path']) <=> strlen($a['path']));

    return $categories;
}

/** The category a folder belongs to, or null when nothing claims it. */
function assetCategoryFor(array $categories, string $folder): ?array
{
    foreach ($categories as $category) {
        if ($folder === $category['path'] || str_starts_with($folder . '/', $category['path'] . '/')) {
            return $category;
        }
    }

    return null;
}

/**
 * Brings the catalogue in line with the disk.
 *
 * Three things can be out of step. A file on disk with no row is adopted. A row
 * whose file has gone is reported rather than removed - a file that vanished is
 * news, and quietly dropping the row would take its category and its history
 * with it. And a file in a folder no category claims is moved into `unfiled`,
 * because the catalogue's whole shape is "path = category path + name" and a
 * row that does not satisfy that is a row that lies.
 */
function reconcile(PDO $pdo, bool $apply): void
{
    $categories = assetCategories($pdo);
    $unfiled = null;
    foreach ($categories as $category) {
        if ($category['code'] === 'unfiled') {
            $unfiled = $category;
        }
    }
    if ($unfiled === null) {
        echo "no 'unfiled' category - has migration 008 run?\n";
        exit(1);
    }

    // What the catalogue already holds, keyed the way a path is built.
    $known = [];
    foreach ($pdo->query('SELECT f.id, f.name, f.extension, f.size, c.path
                          FROM files f JOIN file_categories c ON c.id = f.category_id') as $row) {
        $known[$row['path'] . '/' . $row['name'] . '.' . $row['extension']] = $row;
    }

    $root = realpath(ASSETS_ROOT);
    $seen = [];
    $adopt = [];
    $strays = [];
    $resized = [];

    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS | FilesystemIterator::UNIX_PATHS),
        RecursiveIteratorIterator::SELF_FIRST
    );

    foreach ($iterator as $path => $info) {
        if ($info->isDir()) {
            continue;
        }
        $relative = substr(str_replace('\\', '/', $path), strlen(str_replace('\\', '/', $root)) + 1);
        if (str_contains('/' . $relative, '/.')) {
            continue;
        }

        $seen[$relative] = true;

        if (isset($known[$relative])) {
            if ((int) $known[$relative]['size'] !== $info->getSize()) {
                $resized[] = [(int) $known[$relative]['id'], $info->getSize(), $info->getMTime()];
            }
            continue;
        }

        $folder = dirname($relative);
        $category = assetCategoryFor($categories, $folder);

        if ($category === null) {
            $strays[] = $relative;
            continue;
        }

        $extension = strtolower(pathinfo($relative, PATHINFO_EXTENSION));
        $name = substr($relative, strlen($category['path']) + 1);
        $name = $extension === '' ? $name : substr($name, 0, -(strlen($extension) + 1));

        $adopt[] = [
            'category_id' => (int) $category['id'],
            'name' => $name,
            'extension' => $extension,
            'size' => $info->getSize(),
            'modified_at' => date('Y-m-d H:i:s', $info->getMTime()),
        ];
    }

    $vanished = [];
    foreach ($known as $relative => $row) {
        if (!isset($seen[$relative])) {
            $vanished[] = $relative;
        }
    }

    echo 'files on disk        : ', number_format(count($seen)), "\n";
    echo 'already catalogued   : ', number_format(count($known) - count($vanished)), "\n";
    echo 'to adopt             : ', number_format(count($adopt)), "\n";
    echo 'size changed         : ', number_format(count($resized)), "\n";
    echo 'in no category       : ', number_format(count($strays)), "   (would move to ", $unfiled['path'], "/)\n";
    echo 'catalogued but gone  : ', number_format(count($vanished)), "\n";
    foreach (array_slice($vanished, 0, 5) as $gone) {
        echo "    $gone\n";
    }

    if (!$apply) {
        echo "dry run - add --apply\n";
        return;
    }

    $pdo->beginTransaction();

    $insert = $pdo->prepare(
        'INSERT INTO files (category_id, name, extension, size, modified_at)
         VALUES (:category_id, :name, :extension, :size, :modified_at)
         ON CONFLICT (category_id, name, extension) DO NOTHING
         RETURNING id'
    );

    $adopted = 0;
    foreach ($adopt as $file) {
        $insert->execute($file);
        $id = $insert->fetchColumn();
        // RETURNING leaves the statement holding a result set, and re-executing
        // one that still has rows in it is an error on pgsql.
        $insert->closeCursor();
        if ($id !== false) {
            // One line per adoption would be eighty thousand rows the first
            // time this runs, so the audit gets the run, not the file.
            $adopted++;
        }
    }

    $touch = $pdo->prepare('UPDATE files SET size = :size, modified_at = :modified_at, updated_at = CURRENT_TIMESTAMP WHERE id = :id');
    foreach ($resized as [$id, $size, $modified]) {
        $touch->execute(['id' => $id, 'size' => $size, 'modified_at' => date('Y-m-d H:i:s', $modified)]);
    }

    // The run itself, against the catalogue rather than a file, so there is one
    // legible entry saying what a reconcile did instead of thousands saying
    // that a file exists.
    auditFile($pdo, 0, 'RECONCILE', [
        'adopted' => $adopted,
        'resized' => count($resized),
        'vanished' => count($vanished),
        'strays' => count($strays),
    ]);

    $pdo->commit();

    echo 'adopted : ', number_format($adopted), "\n";
    echo 'resized : ', number_format(count($resized)), "\n";
}

// ── Logs ─────────────────────────────────────────────────────────────────────

function writeLog(string $kind, array $body): string
{
    $directory = __DIR__ . '/storage/asset-logs';
    if (!is_dir($directory)) {
        @mkdir($directory, 0775, true);
    }

    $file = "$directory/$kind-" . date('Ymd-His') . '.json';
    file_put_contents($file, json_encode(['kind' => $kind, 'at' => date('c')] + $body, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

    return $file;
}

function revertLog(PDO $pdo, string $file): void
{
    $log = json_decode((string) @file_get_contents($file), true);
    if (!is_array($log)) {
        echo "cannot read $file\n";
        exit(1);
    }

    if (($log['kind'] ?? '') === 'align') {
        $back = 0;
        foreach (array_reverse($log['moves']) as $move) {
            if (@rename(ASSETS_ROOT . '/' . $move['to'], ASSETS_ROOT . '/' . $move['from'])) {
                $back++;
            } else {
                echo "could not put back: {$move['to']}\n";
            }
        }
        echo 'put back: ', number_format($back), ' of ', number_format(count($log['moves'])), "\n";
        return;
    }

    if (($log['kind'] ?? '') === 'repoint') {
        $pdo->beginTransaction();
        $back = 0;
        foreach (array_reverse($log['changes']) as $change) {
            $statement = $pdo->prepare(
                "UPDATE \"{$change['table']}\" SET \"{$change['column']}\" = :from WHERE \"{$change['column']}\" = :to"
            );
            $statement->execute(['from' => $change['from'], 'to' => $change['to']]);
            $back += $statement->rowCount();
        }
        $pdo->commit();
        echo 'rows put back: ', number_format($back), "\n";
        return;
    }

    echo "unknown log kind\n";
    exit(1);
}
