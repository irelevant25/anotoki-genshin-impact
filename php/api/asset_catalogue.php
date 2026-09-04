<?php

/**
 * Keeping the `files` table and the disk in step.
 *
 * The catalogue is only worth anything if it agrees with what is actually
 * there, and it will not on its own: files arrive over FTP, get deleted by
 * hand, and are written by scripts that know nothing about any of this. So
 * there is a sweep, and it can be run from the admin page or the command line.
 *
 * Shared between the two for the same reason `audit_file.php` is: the CLI tool
 * loads nothing else from api/, and two copies of a reconciliation are two
 * chances to disagree about what "in step" means.
 *
 * Three things can be out of step, and each gets a different answer:
 *
 *   on disk, no row      adopted, in whatever category claims its folder
 *   row, no file         reported, not deleted. A file that vanished is news,
 *                        and dropping the row would take its category and its
 *                        history with it.
 *   in no category       moved into `unfiled`. The whole shape of the table is
 *                        "path = category path + name", and a row that does
 *                        not satisfy that is a row that lies.
 */

/** Where the asset tree is, from here. */
function catalogueRoot(): string
{
    return dirname(__DIR__, 2) . '/assets';
}

/**
 * Every live category, longest path first.
 *
 * Longest first is what makes `character/voice_overs` win over a category for
 * `character`, if one is ever added: a file belongs to the most specific folder
 * that claims it, not the first that happens to match.
 */
function catalogueCategories(PDO $pdo): array
{
    $categories = $pdo->query('SELECT id, code, label, path, is_system FROM file_categories WHERE deleted = FALSE')
        ->fetchAll(PDO::FETCH_ASSOC);

    usort($categories, fn(array $a, array $b) => strlen($b['path']) <=> strlen($a['path']));

    return $categories;
}

/** The category a folder belongs to, or null when nothing claims it. */
function catalogueCategoryFor(array $categories, string $folder): ?array
{
    foreach ($categories as $category) {
        if ($folder === $category['path'] || str_starts_with($folder . '/', $category['path'] . '/')) {
            return $category;
        }
    }

    return null;
}

/** The `unfiled` category, which the migration guarantees exists. */
function catalogueUnfiled(array $categories): ?array
{
    foreach ($categories as $category) {
        if ($category['code'] === 'unfiled') {
            return $category;
        }
    }

    return null;
}

/**
 * What the disk and the table each hold, and where they differ.
 *
 * One walk and one query. Both are the expensive part of everything else here,
 * so callers that want the numbers *and* the work pass the result along rather
 * than asking twice.
 */
function catalogueCompare(PDO $pdo): array
{
    $categories = catalogueCategories($pdo);
    $root = realpath(catalogueRoot());

    $known = [];
    foreach ($pdo->query('SELECT f.id, f.name, f.extension, f.size, c.path
                          FROM files f JOIN file_categories c ON c.id = f.category_id') as $row) {
        $known[$row['path'] . '/' . $row['name'] . '.' . $row['extension']] = $row;
    }

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
                $resized[] = ['id' => (int) $known[$relative]['id'], 'size' => $info->getSize(), 'modified' => $info->getMTime()];
            }
            continue;
        }

        $folder = dirname($relative);
        $category = catalogueCategoryFor($categories, $folder);

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

    return [
        'categories' => $categories,
        'on_disk' => count($seen),
        'catalogued' => count($known) - count($vanished),
        'adopt' => $adopt,
        'strays' => $strays,
        'resized' => $resized,
        'vanished' => $vanished,
    ];
}

/** Just the counts, for a page that only wants to say whether anything drifted. */
function catalogueCounts(PDO $pdo): array
{
    $compare = catalogueCompare($pdo);

    return [
        'on_disk' => $compare['on_disk'],
        'catalogued' => $compare['catalogued'],
        'uncatalogued' => count($compare['adopt']) + count($compare['strays']),
        'unfiled' => count($compare['strays']),
        'missing' => count($compare['vanished']),
    ];
}

/**
 * Adopts what is on disk, and moves anything in no category into `unfiled`.
 *
 * `$by` names whoever pressed the button, and is written to nothing. The audit
 * entry for a sweep leaves changed_by null on purpose: the person who ran it is
 * not the person who put the files there, and recording them as such would be a
 * guess written down as a fact.
 */
function catalogueReconcile(PDO $pdo, ?int $by = null): array
{
    $compare = catalogueCompare($pdo);
    $unfiled = catalogueUnfiled($compare['categories']);

    if ($unfiled === null) {
        return ['error' => "no 'unfiled' category - has migration 008 run?"];
    }

    $root = realpath(catalogueRoot());
    $moved = 0;
    $adopt = $compare['adopt'];

    // Strays first: each becomes an adoption once it is somewhere a category
    // claims, so the insert below can treat them like anything else.
    foreach ($compare['strays'] as $relative) {
        $extension = strtolower(pathinfo($relative, PATHINFO_EXTENSION));
        $name = basename($relative);
        $destination = $root . '/' . $unfiled['path'] . '/' . $name;

        if (!is_dir(dirname($destination)) && !@mkdir(dirname($destination), 0755, true)) {
            continue;
        }
        // Never overwrite something already sitting in unfiled.
        if (file_exists($destination)) {
            $name = pathinfo($relative, PATHINFO_FILENAME) . '-' . substr(md5($relative), 0, 6)
                . ($extension === '' ? '' : '.' . $extension);
            $destination = $root . '/' . $unfiled['path'] . '/' . $name;
        }

        if (@rename($root . '/' . $relative, $destination)) {
            $moved++;
            $adopt[] = [
                'category_id' => (int) $unfiled['id'],
                'name' => $extension === '' ? $name : substr($name, 0, -(strlen($extension) + 1)),
                'extension' => $extension,
                'size' => filesize($destination),
                'modified_at' => date('Y-m-d H:i:s', filemtime($destination)),
            ];
        }
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
        // RETURNING leaves a result set behind, and re-executing a statement
        // that still has rows in it is an error on pgsql.
        $insert->closeCursor();
        if ($id !== false) {
            $adopted++;
        }
    }

    $touch = $pdo->prepare('UPDATE files SET size = :size, modified_at = :modified_at, updated_at = CURRENT_TIMESTAMP WHERE id = :id');
    foreach ($compare['resized'] as $file) {
        $touch->execute([
            'id' => $file['id'],
            'size' => $file['size'],
            'modified_at' => date('Y-m-d H:i:s', $file['modified']),
        ]);
    }

    $result = [
        'adopted' => $adopted,
        'moved_to_unfiled' => $moved,
        'resized' => count($compare['resized']),
        'missing' => count($compare['vanished']),
        'on_disk' => $compare['on_disk'],
    ];

    // One entry for the run. The first sweep adopts eighty-eight thousand
    // files, and an audit trail of that is not an audit trail.
    auditFile($pdo, 0, 'RECONCILE', $result);

    $pdo->commit();

    return $result;
}
