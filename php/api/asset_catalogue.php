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
function catalogueCounts(PDO $pdo, bool $refresh = false): array
{
    // Five numbers that cost a walk over fifty thousand files and a diff
    // against every catalogue row - about two seconds. The dashboard asked for
    // them on every load and got the whole two seconds every time, which was
    // the slowest thing in the API by a factor of nine.
    //
    // Cached beside the survey, on the same clock and dropped by the same
    // assetStatsForget(), because they answer the same question from the two
    // ends: what is on disk, and what the database says about it.
    $file = _catalogueCountsFile();

    if (!$refresh && is_file($file) && (time() - (int) filemtime($file)) < ASSET_STATS_TTL) {
        $cached = json_decode((string) file_get_contents($file), true);
        if (is_array($cached) && isset($cached['on_disk'])) {
            return $cached;
        }
    }

    $compare = catalogueCompare($pdo);
    $counts = [
        'on_disk' => $compare['on_disk'],
        'catalogued' => $compare['catalogued'],
        'uncatalogued' => count($compare['adopt']) + count($compare['strays']),
        'unfiled' => count($compare['strays']),
        'missing' => count($compare['vanished']),
    ];

    if (!is_dir(dirname($file))) {
        @mkdir(dirname($file), 0775, true);
    }
    // A cache that cannot be written is not worth failing the request over.
    @file_put_contents($file, json_encode($counts));

    return $counts;
}

/** The counts if they have been worked out, and null rather than working them out. */
function catalogueCountsCached(): ?array
{
    $file = _catalogueCountsFile();
    if (!is_file($file) || (time() - (int) filemtime($file)) >= ASSET_STATS_TTL) {
        return null;
    }

    $cached = json_decode((string) file_get_contents($file), true);
    return is_array($cached) && isset($cached['on_disk']) ? $cached : null;
}

function _catalogueCountsFile(): string
{
    return dirname(__DIR__) . '/storage/cache/catalogue-counts.json';
}

/** Dropped whenever the tree changes - see assetStatsForget(). */
function catalogueCountsForget(): void
{
    $file = _catalogueCountsFile();
    if (is_file($file)) {
        @unlink($file);
    }
}

/**
 * Adopts what is on disk, and moves anything in no category into `unfiled`.
 *
 * `$by` names whoever pressed the button, and is written to nothing. The audit
 * entry for a sweep leaves changed_by null on purpose: the person who ran it is
 * not the person who put the files there, and recording them as such would be a
 * guess written down as a fact.
 */
/**
 * Puts what an upload just wrote into the catalogue.
 *
 * An upload leaves two files behind, not one: what arrived, and the AVIF or
 * Opus it was re-encoded into. The endpoints only ever catalogued the converted
 * one - and the Files page, which lists what is on disk, then showed the
 * original as a file it knew nothing about, with no category to move it to.
 *
 * Both are the same upload under two extensions, so both are taken by folder
 * and stem rather than by a path the caller has to take apart.
 */
function catalogueUploadedStem(PDO $pdo, string $folder, string $stem, ?int $by = null): int
{
    $categories = catalogueCategories($pdo);
    $category = catalogueCategoryFor($categories, $folder) ?? catalogueUnfiled($categories);
    if ($category === null) {
        return 0;
    }

    // The name a file is catalogued under is its path below the category, so a
    // voice over keeps the character and language folders it sits in.
    $within = trim(substr($folder, strlen($category['path'])), '/');
    $prefix = $within === '' ? '' : $within . '/';

    $directory = catalogueRoot() . '/' . $folder;
    $catalogued = 0;

    foreach (glob($directory . '/' . _globEscape($stem) . '.*') ?: [] as $found) {
        $extension = strtolower(pathinfo($found, PATHINFO_EXTENSION));
        if (upsertCatalogueFile($pdo, $category['code'], $prefix . $stem, $extension, $by) !== null) {
            $catalogued++;
        }
    }

    return $catalogued;
}

/**
 * Points rows at the pictures that are already there for them.
 *
 * Adopting a stray puts it in the catalogue; it does not tell the banner it
 * belongs to that it exists. A row imported by anything other than the admin
 * form - a data load, a script - arrives with no file id, and then the site
 * shows a gap where a picture plainly sits on disk.
 *
 * The name is worked out by the same code an upload would have used, so a match
 * means the file is named exactly the way this row's file is supposed to be. A
 * row whose picture is genuinely missing is left alone: this fills gaps, it
 * does not guess.
 */
function catalogueRelink(PDO $pdo, ?int $by = null): array
{
    $categories = catalogueCategories($pdo);
    $linked = 0;
    $byField = [];

    $lookup = $pdo->prepare(
        "SELECT id, extension FROM files
          WHERE category_id = :category AND name = :name
          ORDER BY CASE extension WHEN 'avif' THEN 0 WHEN 'opus' THEN 1 ELSE 2 END, id
          LIMIT 1"
    );

    foreach (_uploadTargets() as $entity => $spec) {
        $table = $spec['table'];
        $hasDeleted = (int) $pdo->query(
            "SELECT count(*) FROM information_schema.columns
              WHERE table_name = " . $pdo->quote($table) . " AND column_name = 'deleted'"
        )->fetchColumn();

        foreach ($spec['fields'] as $field => $fieldSpec) {
            $column = $field . '_file_id';
            $live = $hasDeleted ? ' AND deleted = FALSE' : '';
            $rows = $pdo->query("SELECT * FROM \"$table\" WHERE \"$column\" IS NULL$live")->fetchAll(PDO::FETCH_ASSOC);

            foreach ($rows as $row) {
                // Voice overs and banners work their own folder and name out
                // from the row; everything else has a fixed folder and the
                // conventional name.
                $folder = $fieldSpec['folder'] ?? null;
                $name = null;
                if (isset($spec['resolver'])) {
                    $resolved = ($spec['resolver'])($pdo, $row, $field);
                    if (!$resolved) {
                        continue;
                    }
                    $folder = $resolved['folder'];
                    $name = $resolved['base'];
                }
                $name ??= _defaultUploadName($pdo, $spec, $fieldSpec, $row);

                if ($folder === null || $name === null || $name === '') {
                    continue;
                }

                $category = catalogueCategoryFor($categories, $folder);
                if ($category === null) {
                    continue;
                }

                $lookup->execute(['category' => $category['id'], 'name' => $name]);
                $file = $lookup->fetch(PDO::FETCH_ASSOC);
                if (!$file) {
                    continue;
                }

                $pdo->prepare("UPDATE \"$table\" SET \"$column\" = ? WHERE id = ?")
                    ->execute([$file['id'], $row['id']]);
                $linked++;
                $byField["$table.$field"] = ($byField["$table.$field"] ?? 0) + 1;
            }
        }
    }

    $repointed = _catalogueRepointToConverted($pdo, $byField);

    if ($linked > 0 || $repointed > 0) {
        auditFile($pdo, 0, 'RECONCILE', ['relinked' => $linked, 'repointed' => $repointed, 'by_field' => $byField], $by);
    }

    return ['linked' => $linked, 'repointed' => $repointed, 'by_field' => $byField];
}

/**
 * Moves a reference onto the file the site actually serves.
 *
 * Converting leaves two files and the row keeps naming the one it was given.
 * That matters in two ways, and both end with a row naming the wrong file.
 *
 * The loud one: take the originals away afterwards - which is the point of
 * converting - and every row still naming an `.ogg` is naming nothing, while
 * the `.opus` beside it goes unread. For a voice line that is not a broken
 * link the page recovers from, it plays silence.
 *
 * The quiet one: a row naming an original that is *still there* keeps that
 * original alive, because nothing deletes a file something points at. So the
 * four `.ogg` files nobody could get rid of were four rows pointing at them,
 * and the button offering to remove the originals never went away.
 *
 * Both are the same fix - point at the converted file - and it is safe in both
 * cases, because the converted file is checked to be on disk before anything
 * moves. A row whose file is gone with nothing to replace it is left alone and
 * shows up under "recorded but gone", which is the honest place for it.
 */
function _catalogueRepointToConverted(PDO $pdo, array &$byField): int
{
    $root = catalogueRoot();
    $sources = array_merge(ASSET_TO_AVIF, ASSET_TO_OPUS);
    $twin = $pdo->prepare(
        "SELECT id, extension FROM files
          WHERE category_id = :category AND name = :name AND extension IN ('avif', 'opus')
          ORDER BY CASE extension WHEN 'avif' THEN 0 ELSE 1 END
          LIMIT 1"
    );

    $repointed = 0;

    foreach (assetColumnMap() as $table => $columns) {
        $hasDeleted = (int) $pdo->query(
            "SELECT count(*) FROM information_schema.columns
              WHERE table_name = " . $pdo->quote($table) . " AND column_name = 'deleted'"
        )->fetchColumn();

        foreach (array_keys($columns) as $field) {
            $column = $field . '_file_id';
            $live = $hasDeleted ? ' WHERE t.deleted = FALSE' : '';
            $rows = $pdo->query(
                "SELECT DISTINCT f.id, f.name, f.extension, f.category_id, c.path
                   FROM \"$table\" t
                   JOIN files f ON f.id = t.\"$column\"
                   JOIN file_categories c ON c.id = f.category_id$live"
            )->fetchAll(PDO::FETCH_ASSOC);

            foreach ($rows as $row) {
                $suffix = $row['extension'] === '' ? '' : '.' . $row['extension'];
                $here = is_file($root . '/' . $row['path'] . '/' . $row['name'] . $suffix);
                $isSource = in_array(strtolower($row['extension']), $sources, true);

                // Either the file is not there, or it is an original with a
                // converted copy that should be read instead.
                if ($here && !$isSource) {
                    continue;
                }

                $twin->execute(['category' => $row['category_id'], 'name' => $row['name']]);
                $found = $twin->fetch(PDO::FETCH_ASSOC);
                if (!$found || !is_file($root . '/' . $row['path'] . '/' . $row['name'] . '.' . $found['extension'])) {
                    continue;
                }

                $update = $pdo->prepare("UPDATE \"$table\" SET \"$column\" = ? WHERE \"$column\" = ?");
                $update->execute([$found['id'], $row['id']]);
                $moved = $update->rowCount();
                if ($moved > 0) {
                    $repointed += $moved;
                    $byField["$table.$field"] = ($byField["$table.$field"] ?? 0) + $moved;
                }
            }
        }
    }

    return $repointed;
}

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

    // Now that everything on disk is in the catalogue, hand the rows that have
    // no picture the one that was sitting there for them all along.
    $relinked = catalogueRelink($pdo, $by);

    $result = [
        'adopted' => $adopted,
        'moved_to_unfiled' => $moved,
        'resized' => count($compare['resized']),
        'missing' => count($compare['vanished']),
        'on_disk' => $compare['on_disk'],
        'relinked' => $relinked['linked'] + $relinked['repointed'],
    ];

    // One entry for the run. The first sweep adopts eighty-eight thousand
    // files, and an audit trail of that is not an audit trail.
    auditFile($pdo, 0, 'RECONCILE', $result);

    $pdo->commit();

    return $result;
}
