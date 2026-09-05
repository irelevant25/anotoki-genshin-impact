<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * POST /api/uploads/{entity}/{id}/{field}   multipart, one part named `file`
 *
 * Saves an upload straight into the site's asset tree, using the naming the
 * existing data already follows, and writes the resulting path back onto the
 * row. The client only says *what* it is uploading - never where it goes.
 *
 *   POST /api/uploads/character/12/icon        -> assets/character/icon/HU_TAO.avif
 *   POST /api/uploads/weapon/3/icon_ascension  -> assets/weapons/AQUILA_FAVONIA - ascension.avif
 *
 * Raster uploads are converted to AVIF (see full_resource.php); the original is
 * kept beside it.
 */

require_once __DIR__ . '/../../../asset_naming.php';

$app->post('/api/uploads/{entity}/{id}/{field}', function (Request $request, Response $response, array $args) {
    $targets = _uploadTargets();
    $entity = $args['entity'];
    $field = $args['field'];

    if (!isset($targets[$entity]['fields'][$field])) {
        return respondJson($response, ['error' => "Unknown upload target '$entity/$field'"], 400);
    }

    $spec = $targets[$entity];
    $fieldSpec = $spec['fields'][$field];
    $pdo = genshinDb();
    $id = (int) $args['id'];

    $row = DbQuery::from($pdo, $spec['table'])->find(['id' => $id]);
    if (!$row) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    $file = $request->getUploadedFiles()['file'] ?? null;
    if (!$file) {
        return respondJson($response, ['error' => 'No file sent under the "file" part'], 400);
    }

    // Voice over clips resolve their folder from the character, type and
    // language; everything else declares a fixed folder.
    $isAudio = false;
    $folder = $fieldSpec['folder'] ?? null;
    $suggested = null;
    if (isset($spec['resolver'])) {
        $resolved = ($spec['resolver'])($pdo, $row, $field);
        if (!$resolved) {
            return respondJson($response, ['error' => 'Row is missing the data needed to place this file'], 409);
        }
        $folder = $resolved['folder'];
        $suggested = $resolved['base'];
        $isAudio = !empty($resolved['audio']);
    }
    if (!$folder) {
        return respondJson($response, ['error' => "No folder configured for '$entity/$field'"], 500);
    }

    // The name comes from the client. When it is omitted the old convention is
    // used, so an upload without one still lands where the site expects.
    $body = $request->getParsedBody() ?? [];
    $requested = trim((string) ($body['name'] ?? ''));
    $baseName = $requested !== '' ? _assetPathSegment($requested) : ($suggested ?? _defaultUploadName($pdo, $spec, $fieldSpec, $row));

    if ($baseName === null || $baseName === '') {
        return respondJson($response, ['error' => 'A file name is required'], 422);
    }

    $path = _saveAssetUpload($file, $folder, $baseName, $isAudio);
    if (!$path) {
        return respondJson($response, ['error' => 'Unsupported or unreadable file'], 415);
    }

    // Through the same path-parsing every other write uses, rather than
    // assuming the catalogue name is just $baseName - a voice over's name is
    // the title *plus* the character, type and language folders above it, and
    // only the parser that already handles every other path gets that right.
    $user = $request->getAttribute('user');
    $toResolve = [$field => $path];
    resolveAssetBody($pdo, $spec['table'], $toResolve, (int) $user['id']);
    $fileId = $toResolve["{$field}_file_id"] ?? null;

    DbQuery::update($pdo, $spec['table'], [
        "{$field}_file_id" => $fileId,
        'updated_by' => $user['id'],
    ], $id);

    $nameColumn = array_key_exists('name_column', $fieldSpec) ? $fieldSpec['name_column'] : $field . '_name';

    return respondJson($response, [
        'entity' => $entity,
        'id' => $id,
        'field' => $field,
        'name' => $baseName,
        'nameColumn' => $nameColumn,
        'path' => $path,
        'fileId' => $fileId,
    ]);
})->add(responds(RecordUploadResult::class))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

// ── POST /api/uploads/{entity}/{field} ────────────────────────────────────────
//
// Stores a file without touching the database. The form holds the picked file
// until it is saved, then uploads here and puts the returned path and name into
// the payload it was going to send anyway.
//
// This is what lets a not-yet-created entity have images, and what lets child
// rows have them at all: children are re-inserted on every save, so their ids
// are not stable enough to upload against.

$app->post('/api/uploads/{entity}/{field}', function (Request $request, Response $response, array $args) {
    $targets = _uploadTargets();
    $entity = $args['entity'];
    $field = $args['field'];

    if (!isset($targets[$entity]['fields'][$field])) {
        return respondJson($response, ['error' => "Unknown upload target '$entity/$field'"], 400);
    }

    $fieldSpec = $targets[$entity]['fields'][$field];
    $folder = $fieldSpec['folder'] ?? null;
    if (!$folder) {
        // Voice over clips need the row to know their folder.
        return respondJson($response, ['error' => "'$entity/$field' needs an existing record to upload against"], 400);
    }

    $file = $request->getUploadedFiles()['file'] ?? null;
    if (!$file) {
        return respondJson($response, ['error' => 'No file sent under the "file" part'], 400);
    }

    $body = $request->getParsedBody() ?? [];
    $baseName = _assetPathSegment(trim((string) ($body['name'] ?? '')));
    if ($baseName === null) {
        return respondJson($response, ['error' => 'A file name is required'], 422);
    }

    $path = _saveAssetUpload($file, $folder, $baseName);
    if (!$path) {
        return respondJson($response, ['error' => 'Unsupported or unreadable file'], 415);
    }

    // Catalogued here rather than when the form finally saves, so the id comes
    // back with the path and the row that stores it has something to point at.
    // Saving with the path alone still works - resolveAssetBody() finds this
    // same row rather than making a second one - but the id is the direct way.
    $user = $request->getAttribute('user');
    $toResolve = [$field => $path];
    resolveAssetBody(genshinDb(), $targets[$entity]['table'], $toResolve, (int) $user['id']);

    return respondJson($response, [
        'entity' => $entity,
        'field' => $field,
        'name' => $baseName,
        'path' => $path,
        'fileId' => $toResolve["{$field}_file_id"] ?? null,
    ]);
})->add(responds(EntityUploadResult::class))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());


/**
 * Writes into the served asset tree rather than public/uploads, so the file is
 * reachable at the same path the rest of the data already uses. Reuses the
 * allowlist and the conversion from full_resource.php.
 *
 * `$audio` says what the caller will accept, not what the file is. An entity
 * field knows which of the two it holds - a character's demo music is never a
 * picture - so it passes true or false and anything else is refused. The Files
 * page has no such opinion: it browses the whole tree, voice overs included,
 * and passing null lets it add anything the allowlist permits. Which of the two
 * a file actually *is* comes from its extension either way.
 */
function _saveAssetUpload($file, string $folder, string $baseName, ?bool $audio = false): ?string
{
    if (!$file || $file->getError() !== UPLOAD_ERR_OK) {
        return null;
    }

    $ext = strtolower(pathinfo($file->getClientFilename() ?? '', PATHINFO_EXTENSION));
    $audioExtensions = array_values(array_diff(UPLOAD_ALLOWED_EXTENSIONS, UPLOAD_IMAGE_EXTENSIONS));

    $allowed = match ($audio) {
        true => $audioExtensions,
        false => UPLOAD_IMAGE_EXTENSIONS,
        null => UPLOAD_ALLOWED_EXTENSIONS,
    };
    if (!in_array($ext, $allowed, true)) {
        return null;
    }

    $isAudio = in_array($ext, $audioExtensions, true);

    if (!$isAudio && $ext !== 'avif') {
        $stream = $file->getStream();
        $stream->rewind();
        if (@getimagesizefromstring($stream->getContents()) === false) {
            return null;
        }
        $stream->rewind();
    }

    // The name comes from the database, but keep it filesystem-safe regardless.
    // Only the characters Windows forbids are stripped - voice over titles are
    // Japanese, Chinese and Korean, and must survive intact.
    $safeName = _assetPathSegment($baseName);
    $safeFolder = _assetFolder($folder);
    if ($safeName === null || $safeFolder === null) {
        return null;
    }

    $dir = _assetsRoot() . '/' . $safeFolder;
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }

    // Segments are already free of separators and traversal, so this can only
    // fail if something upstream changes - refuse rather than write blind.
    $root = realpath(_assetsRoot());
    $resolved = realpath($dir);
    if ($root === false || $resolved === false || !str_starts_with($resolved, $root)) {
        error_log('[upload] refusing to write outside the assets root: ' . $dir);
        return null;
    }

    $stored = $dir . '/' . $safeName . '.' . $ext;
    $file->moveTo($stored);
    // The Files page counts what is on disk, so its cache is now out of date.
    _assetFolderCacheClear();

    // Voice over rows store a bare `assets/...` path; images use `../assets/...`.
    $prefix = $isAudio ? 'assets/' : '../assets/';

    // The site serves AVIF and Opus, so an upload is re-encoded and the
    // converted path is what gets stored. The original stays beside it, and
    // when nothing here can encode, the original is what is stored instead.
    $converted = _convertAssetUpload($stored, $dir . '/' . $safeName, $ext, $isAudio);

    return $prefix . $folder . '/' . $safeName . '.' . ($converted ?? $ext);
}

/**
 * Re-encodes an upload into the format the site serves. Returns the new
 * extension, or null when the file is kept as it arrived.
 */
function _convertAssetUpload(string $stored, string $targetStem, string $ext, bool $audio): ?string
{
    if ($audio) {
        return in_array($ext, UPLOAD_CONVERT_TO_OPUS, true) && mediaToOpus($stored, $targetStem . '.opus')
            ? 'opus'
            : null;
    }

    return in_array($ext, UPLOAD_CONVERT_TO_AVIF, true) && mediaToAvif($stored, $targetStem . '.avif')
        ? 'avif'
        : null;
}
