<?php

/**
 * Shared plumbing for "full resource" endpoints: one parent row plus its
 * children (and their children), read and written in a single request.
 *
 * A child spec is:
 *   key      - key in the JSON body and in the response
 *   table    - database table
 *   fk       - column pointing at the parent row
 *   model    - DbModel subclass, filters the payload down to real columns
 *   children - nested specs, hung off this child's own id
 *
 * Unlike the characters endpoint, children are nested under their parent on
 * the way out as well as in, so GET and PUT take the exact same shape.
 */

// ── Uploads ───────────────────────────────────────────────────────────────────

/** Extensions accepted for upload. Anything else is dropped, never written. */
const UPLOAD_ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'avif', 'webp', 'gif', 'ogg', 'mp3', 'wav', 'opus', 'm4a'];

/** Image extensions are additionally checked to actually decode as an image. */
const UPLOAD_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'avif', 'webp', 'gif'];

/** Raster uploads that are re-encoded to AVIF; the original is kept alongside. */
const UPLOAD_CONVERT_TO_AVIF = ['png', 'jpg', 'jpeg', 'webp'];

/** Audio uploads that are re-encoded to Opus; the original is kept alongside. */
const UPLOAD_CONVERT_TO_OPUS = ['mp3', 'ogg', 'wav', 'm4a'];

/**
 * Belt and braces: even with an extension allowlist, keep the web server from
 * ever executing anything under the uploads tree.
 */
function _fullHardenUploadDir(string $dir): void
{
    $htaccess = $dir . '/.htaccess';
    if (!file_exists($htaccess)) {
        file_put_contents($htaccess, implode("\n", [
            'php_flag engine off',
            'RemoveHandler .php .phtml .php3 .php4 .php5 .php7 .phps',
            'RemoveType .php .phtml .php3 .php4 .php5 .php7 .phps',
        ]) . "\n");
    }
}

/**
 * Saves one uploaded file as `{baseName}.{ext}` under `public/uploads/{folder}`.
 * Returns the public path, or null when nothing usable was sent.
 *
 * The extension comes from the client, so it is checked against an allowlist
 * before anything touches the disk - otherwise a `.php` upload landing in a
 * web-served directory is remote code execution.
 */
function _fullSaveUpload($file, string $folder, string $baseName): ?string
{
    if (!$file || $file->getError() !== UPLOAD_ERR_OK) {
        return null;
    }

    $ext = strtolower(pathinfo($file->getClientFilename() ?? '', PATHINFO_EXTENSION));
    if (!in_array($ext, UPLOAD_ALLOWED_EXTENSIONS, true)) {
        return null;
    }
    // A file claiming to be an image must decode as one.
    if (in_array($ext, UPLOAD_IMAGE_EXTENSIONS, true) && $ext !== 'avif') {
        $stream = $file->getStream();
        $stream->rewind();
        if (@getimagesizefromstring($stream->getContents()) === false) {
            return null;
        }
        $stream->rewind();
    }

    $safeName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $baseName);
    $dir = __DIR__ . '/../public/uploads/' . $folder;
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    _fullHardenUploadDir(__DIR__ . '/../public/uploads');

    $file->moveTo($dir . '/' . $safeName . '.' . $ext);

    // The site loads AVIF, so a raster upload is converted and the AVIF path is
    // what gets stored. The original stays on disk next to it.
    if (
        in_array($ext, UPLOAD_CONVERT_TO_AVIF, true)
        && mediaToAvif($dir . '/' . $safeName . '.' . $ext, $dir . '/' . $safeName . '.avif')
    ) {
        return '/uploads/' . $folder . '/' . $safeName . '.avif';
    }

    return '/uploads/' . $folder . '/' . $safeName . '.' . $ext;
}

/**
 * Applies uploaded files onto the parsed body.
 *
 * Part names are uniform so the client can build them mechanically:
 *   file_{field}                     for the parent row
 *   file_{childKey}_{index}_{field}  for a child row
 *
 * The upload spec maps those fields to a target folder:
 *   ['_parent' => ['icon' => 'enemies'], 'phases' => ['icon' => 'enemies', 'art' => 'enemies']]
 */
function fullResourceApplyUploads(array &$body, array $uploadedFiles, string $bodyKey, array $uploadSpec): void
{
    $baseName = preg_replace('/[^a-zA-Z0-9]+/', '_', trim($body[$bodyKey]['name'] ?? 'item'));

    foreach ($uploadSpec['_parent'] ?? [] as $field => $folder) {
        $path = _fullSaveUpload($uploadedFiles["file_$field"] ?? null, $folder, $baseName . '_' . $field);
        if ($path) {
            $body[$bodyKey][$field] = $path;
        }
    }

    foreach ($uploadSpec as $childKey => $fields) {
        if ($childKey === '_parent' || !isset($body[$childKey]) || !is_array($body[$childKey])) {
            continue;
        }
        foreach ($body[$childKey] as $index => &$child) {
            foreach ($fields as $field => $folder) {
                $path = _fullSaveUpload($uploadedFiles["file_{$childKey}_{$index}_{$field}"] ?? null, $folder, $baseName . '_' . $childKey . '_' . ($index + 1) . '_' . $field);
                if ($path) {
                    $child[$field] = $path;
                }
            }
        }
        unset($child);
    }
}

/** Parses multipart (JSON under `data`) or a plain JSON body. */
function fullResourceParseBody(\Psr\Http\Message\ServerRequestInterface $request): array
{
    $parsed = $request->getParsedBody() ?? [];
    if (is_array($parsed) && isset($parsed['data'])) {
        return json_decode($parsed['data'], true) ?? [];
    }
    return is_array($parsed) ? $parsed : [];
}

// ── Read ──────────────────────────────────────────────────────────────────────

function _fullFetchChildren(PDO $pdo, array $specs, int $parentId): array
{
    $result = [];
    foreach ($specs as $spec) {
        $stmt = $pdo->prepare("SELECT * FROM {$spec['table']} WHERE {$spec['fk']} = ? AND deleted = FALSE ORDER BY id ASC");
        $stmt->execute([$parentId]);
        $rows = $stmt->fetchAll();

        if (!empty($spec['children'])) {
            foreach ($rows as &$row) {
                $row = [...$row, ..._fullFetchChildren($pdo, $spec['children'], (int) $row['id'])];
            }
            unset($row);
        }

        $result[$spec['key']] = $rows;
    }
    return $result;
}

// ── Write ─────────────────────────────────────────────────────────────────────

function _fullInsertChildren(PDO $pdo, array $specs, array $body, int $parentId, int $userId): void
{
    foreach ($specs as $spec) {
        foreach ($body[$spec['key']] ?? [] as $item) {
            if (!is_array($item)) {
                continue;
            }
            $model = $spec['model'];
            $childId = (int) DbQuery::insert($pdo, $spec['table'], [
                ...$model::fromBody([...$item, $spec['fk'] => $parentId])->toDbArray(),
                'created_by' => $userId,
            ]);
            if (!empty($spec['children'])) {
                _fullInsertChildren($pdo, $spec['children'], $item, $childId, $userId);
            }
        }
    }
}

/** Soft-deletes grandchildren before children, so nothing is orphaned mid-way. */
function _fullDeleteChildren(PDO $pdo, array $specs, int $parentId): void
{
    foreach ($specs as $spec) {
        if (!empty($spec['children'])) {
            $stmt = $pdo->prepare("SELECT id FROM {$spec['table']} WHERE {$spec['fk']} = ? AND deleted = FALSE");
            $stmt->execute([$parentId]);
            foreach (array_column($stmt->fetchAll(), 'id') as $childId) {
                _fullDeleteChildren($pdo, $spec['children'], (int) $childId);
            }
        }
        $pdo->prepare("UPDATE {$spec['table']} SET deleted = TRUE WHERE {$spec['fk']} = ? AND deleted = FALSE")
            ->execute([$parentId]);
    }
}

// ── Route registration ────────────────────────────────────────────────────────

/**
 * Registers GET/POST/PUT `/api/{path}[/{id}]/full` for a parent table.
 *
 * @param string $bodyKey  key holding the parent row, e.g. 'enemy'
 * @param array  $children child specs, see the file header
 * @param array  $uploads  upload spec, see fullResourceApplyUploads()
 */
function registerFullResource($app, string $path, string $table, string $modelClass, string $bodyKey, array $children, array $uploads = []): void
{
    // GET one full resource
    $app->get("/api/$path/{id:[0-9]+}/full", function ($request, $response, array $args) use ($table, $bodyKey, $children) {
        $pdo = genshinDb();
        $id = (int) $args['id'];

        $parent = DbQuery::from($pdo, $table)
            ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
            ->includeExternal('updated_by', usersDb(), 'users', ['id', 'username'])
            ->find(['id' => $id]);

        if (!$parent) {
            return respondJson($response, ['error' => 'Not found'], 404);
        }

        return respondJson($response, [$bodyKey => $parent, ..._fullFetchChildren($pdo, $children, $id)]);
    });

    // GET ALL full resources
    $app->get("/api/$path/full", function ($request, $response) use ($table, $children) {
        $pdo = genshinDb();

        $parents = DbQuery::from($pdo, $table)
            ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
            ->includeExternal('updated_by', usersDb(), 'users', ['id', 'username'])
            ->fetchAll();

        foreach ($parents as &$parent) {
            $parent = [
                ...$parent,
                ..._fullFetchChildren($pdo, $children, (int) $parent['id']),
            ];
        }
        unset($parent);

        return respondJson($response, $parents);
    });

    $app->post("/api/$path/full", function ($request, $response) use ($table, $modelClass, $bodyKey, $children, $uploads) {
        $user = $request->getAttribute('user');
        $pdo = genshinDb();
        $body = fullResourceParseBody($request);

        if (empty($body[$bodyKey])) {
            return respondJson($response, ['error' => "Missing $bodyKey data"], 400);
        }
        fullResourceApplyUploads($body, $request->getUploadedFiles(), $bodyKey, $uploads);

        $pdo->beginTransaction();
        try {
            $id = (int) DbQuery::insert($pdo, $table, [
                ...$modelClass::fromBody($body[$bodyKey])->toDbArray(),
                'created_by' => $user['id'],
            ]);
            _fullInsertChildren($pdo, $children, $body, $id, $user['id']);
            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }

        return respondJson($response, DbQuery::from($pdo, $table)->find(['id' => $id]), 201);
    })->add(requireRole('ADMIN', 'EDITOR'))->add(requireAuth());

    $app->put("/api/$path/{id:[0-9]+}/full", function ($request, $response, array $args) use ($table, $modelClass, $bodyKey, $children, $uploads) {
        $user = $request->getAttribute('user');
        $pdo = genshinDb();
        $id = (int) $args['id'];
        $body = fullResourceParseBody($request);

        if (!DbQuery::from($pdo, $table)->find(['id' => $id])) {
            return respondJson($response, ['error' => 'Not found'], 404);
        }
        fullResourceApplyUploads($body, $request->getUploadedFiles(), $bodyKey, $uploads);

        $pdo->beginTransaction();
        try {
            if (!empty($body[$bodyKey])) {
                DbQuery::update($pdo, $table, [
                    ...$modelClass::partialToDbArray($body[$bodyKey]),
                    'updated_by' => $user['id'],
                ], $id);
            }
            // Only touch the collections the client actually sent.
            $present = array_values(array_filter($children, fn($spec) => isset($body[$spec['key']])));
            _fullDeleteChildren($pdo, $present, $id);
            _fullInsertChildren($pdo, $present, $body, $id, $user['id']);
            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }

        return respondJson($response, DbQuery::from($pdo, $table)->find(['id' => $id]));
    })->add(requireRole('ADMIN', 'EDITOR'))->add(requireAuth());
}
