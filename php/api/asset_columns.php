<?php

/**
 * Every entity column that names a file, and how to read or write through it.
 *
 * These thirty columns used to hold a path and, mostly, a base name beside it:
 * `characters.icon = '../assets/character/icon/BAIZHU.avif'`,
 * `characters.icon_name = 'BAIZHU'`. They now hold `icon_file_id`, a real
 * foreign key into `files`. Nothing downstream was supposed to notice.
 *
 * That is the whole point of this file. `resolveAssetRows()` turns a file id
 * back into the same path and name a reader has always been sent - the site
 * resolves art by `icon_name` and a folder convention almost everywhere
 * (`appMaterialIcon`), so that string has to keep meaning what it always
 * meant. `resolveAssetBody()` is the other direction: an admin form still
 * sends `{"icon": "../assets/character/icon/BAIZHU.avif"}`, exactly as before,
 * and this is what turns that back into the id a real column can hold. The
 * upload endpoints that write a fresh file to disk skip the parsing and call
 * `upsertCatalogueFile()` directly, since they already know the category, the
 * name and the extension without having to take a path apart.
 *
 * Three shapes of entry:
 *
 *   name column   the ordinary case - a path and a name beside it, both
 *                 rebuilt from one id: `icon` / `icon_name`.
 *   no name       voice-over audio has nowhere to put a name; the title
 *                 columns already carry it. Only the path comes back.
 *   audio         the prefix is bare (`assets/...`) rather than `../assets/`,
 *                 matching how `_saveAssetUpload()` has always told the two
 *                 apart.
 */

/** Rows a list endpoint answers with unless asked otherwise, and the ceiling. */
const LIST_PAGE_SIZE = 200;
const LIST_PAGE_SIZE_MAX = 2000;

/**
 * table => [ dbColumn => ['category' => code, 'name' => bool, 'audio' => bool] ]
 *
 * `category` is the code in `file_categories` the column's files live under -
 * several columns share one, because a category is a folder and a folder can
 * hold more than one field's pictures (a weapon's `icon` and `icon_ascension`
 * are both just files in `assets/weapons/`).
 */
function assetColumnMap(): array
{
    static $map = null;
    if ($map !== null) {
        return $map;
    }

    $image = fn(string $category) => ['category' => $category, 'name' => true, 'audio' => false];
    $audio = fn(string $category) => ['category' => $category, 'name' => false, 'audio' => true];

    return $map = [
        'characters' => [
            'icon' => $image('character.icon'),
            'card_icon' => $image('character.card_icon'),
            'card_icon_2' => $image('character.card_icon'),
            'wish_icon' => $image('character.wish_icon'),
            'ingame_icon' => $image('character.ingame_icon'),
            'ingame_icon_2' => $image('character.ingame_icon'),
            'namecard_icon' => $image('character.namecard_icon'),
            'namecard_background' => $image('character.namecard_background'),
            'namecard_banner' => $image('character.namecard_banner'),
        ],
        'characters_constellations' => ['icon' => $image('character.constellations')],
        'characters_talents' => ['icon' => $image('character.talents')],
        'characters_voice_overs' => [
            'audio_english' => $audio('character.voice_overs'),
            'audio_japanese' => $audio('character.voice_overs'),
            'audio_chinese' => $audio('character.voice_overs'),
            'audio_korean' => $audio('character.voice_overs'),
        ],
        'enemies' => ['icon' => $image('enemies')],
        'enemies_phases' => [
            'icon' => $image('enemies'),
            'art' => $image('enemies'),
        ],
        'artifacts' => ['icon' => $image('artifacts')],
        'artifacts_pieces' => ['icon' => $image('artifacts')],
        'weapons' => [
            'icon' => $image('weapons'),
            'icon_2' => $image('weapons'),
            'icon_ascension' => $image('weapons'),
        ],
        'foods' => [
            'icon_normal' => $image('foods'),
            'icon_delicious' => $image('foods'),
            'icon_suspicious' => $image('foods'),
        ],
        'materials' => ['icon' => $image('materials')],
        'banners' => ['icon' => $image('banners')],
        'backgrounds' => [
            'image' => $image('backgrounds'),
            'preview' => $image('backgrounds'),
        ],
        // The lookup tables that have a picture per row. They are keyed by name
        // rather than by an id, which changes nothing here: the column holds a
        // file id like every other one. `roles` and `food_types` have folders
        // too, but almost none of their rows have a file - see migration 015.
        'elements' => ['icon' => $image('elements')],
        'regions' => ['icon' => $image('regions')],
        'weapon_types' => ['icon' => $image('weapon_types')],
    ];
}

/**
 * The read-only column names that sit beside one `{field}_file_id`.
 *
 * `icon_file_id` is what a row stores; `icon` and `icon_name` are what
 * resolveAssetRows() puts beside it on the way out. Both generators ask for
 * these by the id column's name, since that is the one they can see - in a
 * table replayed from the migrations, or on a model's constructor - without
 * knowing which entity they are looking at.
 */
function assetAliasesFor(string $fkColumn): array
{
    if (!str_ends_with($fkColumn, '_file_id')) {
        return [];
    }

    $field = substr($fkColumn, 0, -strlen('_file_id'));
    foreach (assetColumnMap() as $columns) {
        if (isset($columns[$field])) {
            return $columns[$field]['name'] ? [$field, $field . '_name'] : [$field];
        }
    }

    return [];
}

/** Whether a table has any columns this file knows how to resolve. */
function assetColumnsFor(string $table): array
{
    return assetColumnMap()[$table] ?? [];
}

/**
 * Every file the entity tables point at, as `folder/name.ext` => where from.
 *
 * The entity columns used to hold these paths as text, so anything asking what
 * was still in use could find out by looking for `assets/` in every string
 * column in the database. They hold ids now, and that search comes back empty -
 * which would make every file in the tree look like nothing was using it. This
 * is the same question asked of the foreign keys, and it is the half that has
 * to be right before anything deletes a file.
 */
function assetFkReferences(PDO $pdo): array
{
    $referenced = [];

    foreach (assetColumnMap() as $table => $columns) {
        foreach (array_keys($columns) as $field) {
            $rows = $pdo->query("
                SELECT DISTINCT c.path || '/' || f.name ||
                       CASE WHEN f.extension = '' THEN '' ELSE '.' || f.extension END AS relative
                  FROM \"$table\" t
                  JOIN files f ON f.id = t.\"{$field}_file_id\"
                  JOIN file_categories c ON c.id = f.category_id");
            foreach ($rows as $row) {
                $referenced[$row['relative']][] = "$table.$field";
            }
        }
    }

    return $referenced;
}

// ── Reading: file id back to path and name ──────────────────────────────────

/**
 * Rewrites the `_file_id` columns on a set of rows into the path and name a
 * reader has always been sent, resolved from the catalogue in one query
 * rather than one per row.
 *
 * Safe to call on rows that do not have these columns at all - an `excludeCols`
 * list, say - since it only ever touches keys that are actually present.
 */
function resolveAssetRows(PDO $pdo, string $table, array &$rows): void
{
    $columns = assetColumnsFor($table);
    if (!$columns || !$rows) {
        return;
    }

    $ids = [];
    foreach ($columns as $dbColumn => $spec) {
        $fkColumn = $dbColumn . '_file_id';
        foreach ($rows as $row) {
            if (!empty($row[$fkColumn])) {
                $ids[(int) $row[$fkColumn]] = true;
            }
        }
    }

    $lookup = $ids ? _assetFileLookup($pdo, array_keys($ids)) : [];

    foreach ($rows as &$row) {
        foreach ($columns as $dbColumn => $spec) {
            $fkColumn = $dbColumn . '_file_id';
            if (!array_key_exists($fkColumn, $row)) {
                continue;
            }

            $id = $row[$fkColumn];
            $file = $id !== null ? ($lookup[(int) $id] ?? null) : null;
            $prefix = $spec['audio'] ? 'assets/' : '../assets/';

            $row[$dbColumn] = $file ? $prefix . $file['relative'] : null;
            if ($spec['name']) {
                $row[$dbColumn . '_name'] = $file['name'] ?? null;
            }
        }
    }
    unset($row);
}

/** id => ['name' => base name, 'relative' => 'folder/name.ext' without a prefix]. */
function _assetFileLookup(PDO $pdo, array $ids): array
{
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $statement = $pdo->prepare("
        SELECT f.id, f.name, f.extension, c.path
        FROM files f JOIN file_categories c ON c.id = f.category_id
        WHERE f.id IN ($placeholders)");
    $statement->execute($ids);

    $lookup = [];
    foreach ($statement as $row) {
        $suffix = $row['extension'] === '' ? '' : '.' . $row['extension'];
        $lookup[(int) $row['id']] = ['name' => $row['name'], 'relative' => $row['path'] . '/' . $row['name'] . $suffix];
    }

    return $lookup;
}

// ── Writing: catalogue the file, keep only its id ───────────────────────────

/**
 * Finds or creates the catalogue row for one file already on disk, and
 * returns its id.
 *
 * This is the one place a path becomes a row: every write - a fresh upload, a
 * path string arriving in a save body, the reconcile sweep - ends up here.
 * Called with a file that does not exist on disk returns null rather than
 * cataloguing a lie.
 */
function upsertCatalogueFile(PDO $pdo, string $categoryCode, string $name, string $extension, ?int $by = null): ?int
{
    $category = $pdo->prepare('SELECT id, path FROM file_categories WHERE code = ? AND deleted = FALSE');
    $category->execute([$categoryCode]);
    $categoryRow = $category->fetch(PDO::FETCH_ASSOC);
    if (!$categoryRow) {
        return null;
    }

    $suffix = $extension === '' ? '' : '.' . $extension;
    $absolute = catalogueRoot() . '/' . $categoryRow['path'] . '/' . $name . $suffix;
    $real = realpath($absolute);
    if ($real === false || !is_file($real)) {
        return null;
    }

    $existing = $pdo->prepare('SELECT id FROM files WHERE category_id = ? AND name = ? AND extension = ?');
    $existing->execute([$categoryRow['id'], $name, $extension]);
    $id = $existing->fetchColumn();

    $size = filesize($real);
    $modified = date('Y-m-d H:i:s', filemtime($real));

    if ($id !== false) {
        $pdo->prepare('UPDATE files SET size = ?, modified_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            ->execute([$size, $modified, $id]);
        return (int) $id;
    }

    $insert = $pdo->prepare(
        'INSERT INTO files (category_id, name, extension, size, modified_at, created_by) VALUES (?, ?, ?, ?, ?, ?) RETURNING id'
    );
    $insert->execute([$categoryRow['id'], $name, $extension, $size, $modified, $by]);
    $newId = (int) $insert->fetchColumn();

    auditFile($pdo, $newId, 'INSERT', ['category' => $categoryCode, 'name' => $name, 'extension' => $extension], $by);

    return $newId;
}

/**
 * Parses a stored path back into what `upsertCatalogueFile()` needs.
 *
 * Only ever sees paths this same code already writes - `../assets/x/y.avif`
 * or `assets/x/y.opus` - so the two prefixes are all that is stripped. Returns
 * null for anything else, including a bare id or an empty string, rather than
 * guess at what was meant.
 */
function _parseAssetPath(string $path): ?array
{
    $path = trim($path);
    if (!preg_match('#^(?:\.\./)?assets/(.+)$#', $path, $match)) {
        return null;
    }

    $relative = $match[1];
    $slash = strrpos($relative, '/');
    if ($slash === false) {
        return null;
    }

    $folder = substr($relative, 0, $slash);
    $file = substr($relative, $slash + 1);
    $dot = strrpos($file, '.');
    $name = $dot === false ? $file : substr($file, 0, $dot);
    $extension = $dot === false ? '' : strtolower(substr($file, $dot + 1));

    return ['folder' => $folder, 'name' => $name, 'extension' => $extension];
}

/**
 * The category whose path best accounts for this folder, and the name that
 * leaves for the file within it.
 *
 * Not an exact match: a voice line lives at
 * `character/voice_overs/Aino/combat/en`, four folders below its category's
 * own path of `character/voice_overs`, with the rest becoming part of the
 * catalogue name - `Aino/combat/en/Elemental Burst 01` - exactly as the
 * migration that first populated this column computed it. The longest
 * matching path wins, the same rule `_fullFetchChildren()`'s sibling in
 * asset_catalogue.php uses to place a file found on disk.
 */
function _categoryAndNameForFolder(PDO $pdo, string $folder, string $leafName): ?array
{
    static $categories = null;
    if ($categories === null) {
        $categories = $pdo->query('SELECT code, path FROM file_categories WHERE deleted = FALSE')->fetchAll(PDO::FETCH_ASSOC);
        usort($categories, fn(array $a, array $b) => strlen($b['path']) <=> strlen($a['path']));
    }

    foreach ($categories as $category) {
        if ($folder === $category['path']) {
            return ['category' => $category['code'], 'name' => $leafName];
        }
        if (str_starts_with($folder . '/', $category['path'] . '/')) {
            $within = substr($folder, strlen($category['path']) + 1);
            return ['category' => $category['code'], 'name' => $within . '/' . $leafName];
        }
    }

    return null;
}

/**
 * Turns the path-shaped fields an admin form still sends into the `_file_id`
 * columns the table actually has, in place.
 *
 * A field absent from `$data` is left alone - a partial update that never
 * mentions `icon` must not touch it. A field present and a real path is
 * catalogued and replaced with its id. A field present and explicitly `null`
 * or `''` clears it. A value that does not parse as one of our paths is left
 * exactly as it arrived - which matters: the old key is only ever removed
 * once a replacement is ready to take its place, not before, or a malformed
 * value would vanish from the write instead of surfacing as one.
 */
function resolveAssetBody(PDO $pdo, string $table, array &$data, ?int $by = null): void
{
    $columns = assetColumnsFor($table);
    if (!$columns) {
        return;
    }

    foreach ($columns as $dbColumn => $spec) {
        if (!array_key_exists($dbColumn, $data)) {
            continue;
        }

        // A form sends the row back whole, so the path it was given arrives
        // beside the id - and the path is the stale half the moment a new file
        // is picked. The id wins wherever both are there; the path is only
        // read when it is all there is.
        if (array_key_exists($dbColumn . '_file_id', $data)) {
            unset($data[$dbColumn], $data[$dbColumn . '_name']);
            continue;
        }

        $value = $data[$dbColumn];
        $fileId = null;
        $resolved = true;

        if ($value === null || $value === '') {
            $fileId = null;
        } elseif (!is_string($value)) {
            // Already an id (or something wrong) - do not guess.
            $fileId = $value;
        } else {
            $parsed = _parseAssetPath($value);
            $placed = $parsed ? _categoryAndNameForFolder($pdo, $parsed['folder'], $parsed['name']) : null;
            if ($placed === null) {
                $resolved = false; // Not one of our paths; leave the field untouched.
            } else {
                $fileId = upsertCatalogueFile($pdo, $placed['category'], $placed['name'], $parsed['extension'], $by);
            }
        }

        if ($resolved) {
            unset($data[$dbColumn], $data[$dbColumn . '_name']);
            $data[$dbColumn . '_file_id'] = $fileId;
        }
    }
}
