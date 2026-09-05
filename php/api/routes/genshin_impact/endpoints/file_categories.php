<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * The kinds of asset there are, and where each kind lives.
 *
 *   GET    /api/file-categories          every category, with what it holds
 *   POST   /api/file-categories          add one
 *   PUT    /api/file-categories/{id}     rename it, or move where it points
 *   DELETE /api/file-categories/{id}     retire it; its files go to unfiled
 *   PUT    /api/files/{id}/category      move one file to another category
 *
 * Moving is the part worth being careful about. A category's path is where its
 * files are, so changing either one has to move files on disk - and a rename
 * that updated the row and left the files behind would leave the whole table
 * describing a tree that is not there.
 *
 * `unfiled` is refused by every write here. Everything else depends on it
 * existing, a file with no category has to be somewhere, and a category that
 * could be deleted while holding the files of a deleted category is a way to
 * lose things quietly.
 */

/** Codes nobody may create, rename or remove. */
const FILE_CATEGORY_RESERVED = ['unfiled'];

/** A dotted code: `character.icon`, `materials`. Letters, digits, dot, underscore. */
function _categoryCodeRefusal(string $code): ?string
{
    if ($code === '') {
        return 'A category needs a code';
    }
    if (strlen($code) > 100) {
        return 'That code is too long';
    }
    if (!preg_match('/^[a-z0-9]+([._][a-z0-9]+)*$/', $code)) {
        return "'$code' is not a code - lower case words joined by dots, like character.icon";
    }
    if (in_array($code, FILE_CATEGORY_RESERVED, true)) {
        return "'$code' is the home for files with no category and cannot be one";
    }

    return null;
}

/** A folder under assets/, with no way out of it. */
function _categoryPathRefusal(string $path): ?string
{
    if ($path === '') {
        return 'A category needs a folder';
    }
    if (strlen($path) > 255) {
        return 'That folder name is too long';
    }
    if (!preg_match('#^[A-Za-z0-9_-]+(/[A-Za-z0-9_-]+)*$#', $path)) {
        return "'$path' is not a folder under assets/";
    }
    if (in_array($path, FILE_CATEGORY_RESERVED, true)) {
        return "'$path' is where files with no category go";
    }

    return null;
}

/** The dotted code as a folder: `character.icon` -> `character/icon`. */
function _categoryPathFromCode(string $code): string
{
    return str_replace('.', '/', $code);
}

function _categoryRows(PDO $pdo): array
{
    $rows = $pdo->query(
        'SELECT c.id, c.code, c.label, c.path, c.deleted, c.is_system, c.sort_order,
                count(f.id) AS files, coalesce(sum(f.size), 0) AS bytes
         FROM file_categories c
         LEFT JOIN files f ON f.category_id = c.id
         GROUP BY c.id
         ORDER BY c.sort_order, c.code'
    )->fetchAll(PDO::FETCH_ASSOC);

    return array_map(fn(array $row) => [
        'id' => (int) $row['id'],
        'code' => $row['code'],
        'label' => $row['label'],
        'path' => $row['path'],
        'deleted' => (bool) $row['deleted'],
        'is_system' => (bool) $row['is_system'],
        'sort_order' => (int) $row['sort_order'],
        'files' => (int) $row['files'],
        'bytes' => (int) $row['bytes'],
    ], $rows);
}

/**
 * Moves one file from one category's folder into another's.
 *
 * The row and the file move together or neither does: a row saying the file is
 * somewhere it is not is worse than a file left where it was, because the first
 * is a lie the whole table is built on and the second is only untidy.
 *
 * The name is flattened on the way. `character/voice_overs` holds names four
 * folders deep, and those folders mean nothing in another category - least of
 * all in `unfiled`, which is one folder by definition.
 */
function _categoryMoveOneFile(PDO $pdo, array $file, string $fromPath, array $to): bool
{
    $root = realpath(catalogueRoot());
    $suffix = $file['extension'] === '' ? '' : '.' . $file['extension'];
    $source = $root . '/' . $fromPath . '/' . $file['name'] . $suffix;

    $name = basename($file['name']);
    $destination = $root . '/' . $to['path'] . '/' . $name . $suffix;

    if (!is_dir(dirname($destination)) && !@mkdir(dirname($destination), 0755, true)) {
        return false;
    }

    // Never write over something already there. Two categories can hold a
    // BAIZHU.avif each and mean different pictures.
    if ($source !== $destination && file_exists($destination)) {
        $name .= '-' . substr(md5($file['name']), 0, 6);
        $destination = $root . '/' . $to['path'] . '/' . $name . $suffix;
    }

    // A row whose file has already gone still moves: the catalogue should end
    // up saying where the file would be, not where it used to not be.
    if (is_file($source) && !@rename($source, $destination)) {
        return false;
    }

    $pdo->prepare('UPDATE files SET category_id = :category_id, name = :name, updated_at = CURRENT_TIMESTAMP WHERE id = :id')
        ->execute(['category_id' => $to['id'], 'name' => $name, 'id' => $file['id']]);

    return true;
}

/** Every file of a category, into another one. Returns how many made it. */
function _categoryMoveFiles(PDO $pdo, array $from, array $to): int
{
    $files = $pdo->prepare('SELECT id, name, extension FROM files WHERE category_id = :id');
    $files->execute(['id' => $from['id']]);

    $moved = 0;
    foreach ($files->fetchAll(PDO::FETCH_ASSOC) as $file) {
        if (_categoryMoveOneFile($pdo, $file, $from['path'], $to)) {
            $moved++;
        }
    }

    return $moved;
}

// ─────────────────────────────────────────────────────────────────────────────

$app->get('/api/file-categories', function (Request $request, Response $response) {
    return respondJson($response, _categoryRows(genshinDb()));
})->add(responds(FileCategory::class, list: true))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

$app->post('/api/file-categories', function (Request $request, Response $response) {
    $body = $request->getParsedBody() ?? [];
    $pdo = genshinDb();

    $code = strtolower(trim((string) ($body['code'] ?? '')));
    $label = trim((string) ($body['label'] ?? ''));
    // The folder follows from the code unless one is given: `character.icon`
    // means `character/icon`, which is the whole convention.
    $path = trim((string) ($body['path'] ?? '')) ?: _categoryPathFromCode($code);

    foreach ([_categoryCodeRefusal($code), _categoryPathRefusal($path)] as $refusal) {
        if ($refusal !== null) {
            return respondJson($response, ['error' => $refusal], 422);
        }
    }
    if ($label === '') {
        $label = ucfirst(str_replace(['.', '_'], ' ', $code));
    }

    $existing = $pdo->prepare('SELECT id, deleted FROM file_categories WHERE code = :code OR path = :path');
    $existing->execute(['code' => $code, 'path' => $path]);

    if ($row = $existing->fetch(PDO::FETCH_ASSOC)) {
        // A retired category coming back keeps its id, and with it whatever the
        // audit log has to say about it.
        if ($row['deleted']) {
            $pdo->prepare('UPDATE file_categories SET deleted = FALSE, label = :label, updated_at = CURRENT_TIMESTAMP WHERE id = :id')
                ->execute(['label' => $label, 'id' => $row['id']]);

            return respondJson($response, _categoryRows($pdo), 200);
        }

        return respondJson($response, ['error' => "'$code' is already a category"], 409);
    }

    $next = (int) $pdo->query('SELECT coalesce(max(sort_order), 0) + 10 FROM file_categories')->fetchColumn();
    $pdo->prepare('INSERT INTO file_categories (code, label, path, sort_order) VALUES (:code, :label, :path, :sort_order)')
        ->execute(['code' => $code, 'label' => $label, 'path' => $path, 'sort_order' => $next]);

    // The folder is made now rather than on the first upload, so that a new
    // category is somewhere you can actually put something.
    $directory = catalogueRoot() . '/' . $path;
    if (!is_dir($directory)) {
        @mkdir($directory, 0755, true);
    }

    return respondJson($response, _categoryRows($pdo), 201);
})->add(responds(FileCategory::class, list: true))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

$app->put('/api/file-categories/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();
    $body = $request->getParsedBody() ?? [];

    $statement = $pdo->prepare('SELECT * FROM file_categories WHERE id = :id');
    $statement->execute(['id' => (int) $args['id']]);
    $category = $statement->fetch(PDO::FETCH_ASSOC);

    if (!$category) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }
    if ($category['is_system']) {
        return respondJson($response, ['error' => 'That one is where files with no category go, and cannot be changed'], 422);
    }

    $label = trim((string) ($body['label'] ?? $category['label']));
    $path = trim((string) ($body['path'] ?? $category['path']));

    if ($label === '') {
        return respondJson($response, ['error' => 'A category needs a name'], 422);
    }
    if (($refusal = _categoryPathRefusal($path)) !== null) {
        return respondJson($response, ['error' => $refusal], 422);
    }

    if ($path !== $category['path']) {
        $clash = $pdo->prepare('SELECT id FROM file_categories WHERE path = :path AND id <> :id');
        $clash->execute(['path' => $path, 'id' => $category['id']]);
        if ($clash->fetchColumn() !== false) {
            return respondJson($response, ['error' => "Another category already lives in '$path'"], 409);
        }

        // The row and the files move together, or the table describes a tree
        // that is not there.
        $pdo->beginTransaction();
        $pdo->prepare('UPDATE file_categories SET path = :path, label = :label, updated_at = CURRENT_TIMESTAMP WHERE id = :id')
            ->execute(['path' => $path, 'label' => $label, 'id' => $category['id']]);
        $moved = _categoryMoveFiles($pdo, $category, ['id' => $category['id'], 'path' => $path]);
        auditFile($pdo, 0, 'MOVE', [
            'category' => $category['code'],
            'from' => $category['path'],
            'to' => $path,
            'files' => $moved,
        ], _categoryActor($request));
        $pdo->commit();

        assetStatsForget();
        _assetFolderCacheClear();

        return respondJson($response, _categoryRows($pdo));
    }

    $pdo->prepare('UPDATE file_categories SET label = :label, updated_at = CURRENT_TIMESTAMP WHERE id = :id')
        ->execute(['label' => $label, 'id' => $category['id']]);

    return respondJson($response, _categoryRows($pdo));
})->add(responds(FileCategory::class, list: true))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

$app->delete('/api/file-categories/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();

    $statement = $pdo->prepare('SELECT * FROM file_categories WHERE id = :id');
    $statement->execute(['id' => (int) $args['id']]);
    $category = $statement->fetch(PDO::FETCH_ASSOC);

    if (!$category) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }
    if ($category['is_system']) {
        return respondJson($response, ['error' => 'That one is where files with no category go, and cannot be removed'], 422);
    }

    $unfiled = catalogueUnfiled(catalogueCategories($pdo));
    if ($unfiled === null) {
        return respondJson($response, ['error' => "There is no 'unfiled' category to move the files into"], 500);
    }

    // Soft, so a category that turns out to have been in use can come back -
    // but its files go now, because a folder nothing points at is how files
    // get forgotten.
    $pdo->beginTransaction();
    $moved = _categoryMoveFiles($pdo, $category, $unfiled);
    $pdo->prepare('UPDATE file_categories SET deleted = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = :id')
        ->execute(['id' => $category['id']]);
    auditFile($pdo, 0, 'DELETE', [
        'category' => $category['code'],
        'moved_to_unfiled' => $moved,
    ], _categoryActor($request));
    $pdo->commit();

    assetStatsForget();
    _assetFolderCacheClear();

    return respondJson($response, _categoryRows($pdo));
})->add(responds(FileCategory::class, list: true))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

// ── One file at a time ───────────────────────────────────────────────────────

// ── PUT /api/files/{id}/name ──────────────────────────────────────────────────
//
// Renaming is moving without changing category: the file's name *is* where it
// is, so the row and the file have to change together or the catalogue starts
// describing a tree that is not there.
//
// The extension is not part of it. It says what the file is, and letting it be
// edited would be offering to turn an AVIF into an OGG by typing.

$app->put('/api/files/{id:[0-9]+}/name', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();
    $body = $request->getParsedBody() ?? [];

    $statement = $pdo->prepare(
        'SELECT f.*, c.id AS cat_id, c.path AS category_path, c.code AS category_code
           FROM files f JOIN file_categories c ON c.id = f.category_id WHERE f.id = :id'
    );
    $statement->execute(['id' => (int) $args['id']]);
    $file = $statement->fetch(PDO::FETCH_ASSOC);

    if (!$file) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    $wanted = trim((string) ($body['name'] ?? ''));
    if ($wanted === '') {
        return respondJson($response, ['error' => 'A file needs a name'], 422);
    }
    if (strlen($wanted) > 255) {
        return respondJson($response, ['error' => 'That name is too long'], 422);
    }

    // A voice over's name carries the folders it sits in below its category, so
    // the separators stay and only the last part is being renamed.
    $within = strpos($file['name'], '/') === false ? '' : substr($file['name'], 0, strrpos($file['name'], '/') + 1);
    $leaf = _assetPathSegment($wanted);
    if ($leaf === null) {
        return respondJson($response, ['error' => "'$wanted' cannot be a file name"], 422);
    }

    $name = $within . $leaf;
    if ($name === $file['name']) {
        return respondJson($response, ['error' => 'It is already called that'], 409);
    }

    $suffix = $file['extension'] === '' ? '' : '.' . $file['extension'];
    $root = realpath(catalogueRoot());
    $source = $root . '/' . $file['category_path'] . '/' . $file['name'] . $suffix;
    $destination = $root . '/' . $file['category_path'] . '/' . $name . $suffix;

    // "Already there" has to mean something *else* is there. Windows and macOS
    // match filenames without regard to case, so renaming SNEZHNAYA to
    // Snezhnaya finds the file being renamed and refuses to rename it.
    $sameFile = is_file($source) && is_file($destination) && realpath($source) === realpath($destination);
    if (file_exists($destination) && !$sameFile) {
        return respondJson($response, ['error' => 'Something is already called that here'], 409);
    }

    $taken = $pdo->prepare('SELECT id FROM files WHERE category_id = ? AND name = ? AND extension = ?');
    $taken->execute([$file['cat_id'], $name, $file['extension']]);
    if ($taken->fetchColumn()) {
        return respondJson($response, ['error' => 'The catalogue already has that name here'], 409);
    }

    // A row whose file has already gone still renames, the same way moving one
    // does: the catalogue should say where the file would be.
    if (is_file($source) && !@rename($source, $destination)) {
        return respondJson($response, ['error' => 'The file could not be renamed'], 500);
    }

    $pdo->beginTransaction();
    $pdo->prepare('UPDATE files SET name = :name, updated_at = CURRENT_TIMESTAMP WHERE id = :id')
        ->execute(['name' => $name, 'id' => $file['id']]);

    auditFile($pdo, (int) $file['id'], 'UPDATE', [
        'renamed' => ['old' => $file['name'], 'new' => $name],
        'category' => $file['category_code'],
    ], _categoryActor($request));
    $pdo->commit();

    _assetFolderCacheClear();
    assetStatsForget();

    return respondJson($response, [
        'id' => (int) $file['id'],
        'name' => $name,
        'path' => $file['category_path'] . '/' . $name . $suffix,
    ]);
})->add(responds(FileRenamed::class))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

$app->put('/api/files/{id:[0-9]+}/category', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();
    $body = $request->getParsedBody() ?? [];

    $statement = $pdo->prepare(
        'SELECT f.*, c.path AS category_path, c.code AS category_code
         FROM files f JOIN file_categories c ON c.id = f.category_id WHERE f.id = :id'
    );
    $statement->execute(['id' => (int) $args['id']]);
    $file = $statement->fetch(PDO::FETCH_ASSOC);

    if (!$file) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    $categories = catalogueCategories($pdo);
    // No category chosen means unfiled, which is the whole reason it exists.
    $wanted = $body['category_id'] === null || ($body['category_id'] ?? '') === ''
        ? catalogueUnfiled($categories)
        : null;

    if ($wanted === null) {
        foreach ($categories as $category) {
            if ((int) $category['id'] === (int) $body['category_id']) {
                $wanted = $category;
            }
        }
    }

    if ($wanted === null) {
        return respondJson($response, ['error' => 'Unknown category'], 422);
    }
    if ((int) $wanted['id'] === (int) $file['category_id']) {
        return respondJson($response, ['error' => 'It is already there'], 409);
    }

    $pdo->beginTransaction();
    $moved = _categoryMoveOneFile($pdo, $file, $file['category_path'], $wanted);

    if (!$moved) {
        $pdo->rollBack();
        return respondJson($response, ['error' => 'The file could not be moved'], 500);
    }

    auditFile($pdo, (int) $file['id'], 'MOVE', [
        'from' => $file['category_code'],
        'to' => $wanted['code'],
        'file' => $file['name'] . '.' . $file['extension'],
    ], _categoryActor($request));
    $pdo->commit();

    assetStatsForget();
    _assetFolderCacheClear();

    // The move may have had to rename it: a category already holding a file of
    // that name gets a suffix rather than being written over. Saying so is the
    // difference between a name that looks corrupt and one that was explained.
    $landed = $pdo->prepare('SELECT name FROM files WHERE id = ?');
    $landed->execute([$file['id']]);
    $name = (string) $landed->fetchColumn();

    return respondJson($response, [
        'id' => (int) $file['id'],
        'category' => $wanted['code'],
        'path' => $wanted['path'],
        'name' => $name,
        'renamed' => $name !== $file['name'],
    ]);
})->add(responds(FileCategoryMove::class))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

/** Whoever pressed the button, for the entries that are somebody's doing. */
function _categoryActor(Request $request): ?int
{
    $user = $request->getAttribute('user');

    return isset($user['id']) ? (int) $user['id'] : null;
}
