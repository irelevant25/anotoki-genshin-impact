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

/** Repo root, one level above php/. */
function _assetsRoot(): string
{
    return dirname(__DIR__, 5) . '/assets';
}

/**
 * One path segment, safe to join into a destination.
 *
 * Folder segments are built from database values a editor controls (a
 * character's name, a voice over's type), so they have to be stripped of
 * separators and traversal before they reach the filesystem. Returns null when
 * nothing usable is left.
 */
function _assetPathSegment(string $segment): ?string
{
    // `:` is written as " - " on disk, matching how the voice over files are
    // named, so an uploaded clip lands where the importer looks for it.
    // "Chat: Hobbies" has to come out as "Chat - Hobbies", not "Chat -  Hobbies".
    $segment = str_replace(':', ' - ', $segment);
    $segment = preg_replace('#[\\\\/*?"<>|\x00-\x1F]#', '', $segment);
    $segment = trim(preg_replace('/ {2,}/', ' ', $segment));
    if ($segment === '' || $segment === '.' || $segment === '..' || str_starts_with($segment, '.')) {
        return null;
    }
    return $segment;
}

/** Sanitises every segment of a relative folder path. */
function _assetFolder(string $folder): ?string
{
    $segments = [];
    foreach (explode('/', $folder) as $segment) {
        $clean = _assetPathSegment($segment);
        if ($clean === null) {
            return null;
        }
        $segments[] = $clean;
    }
    return $segments ? implode('/', $segments) : null;
}

/**
 * The asset naming used throughout the data: upper case, apostrophes, quotes
 * and hyphens dropped, every other run of non-alphanumerics collapsed to `_`.
 *
 *   "Hu Tao"             -> HU_TAO
 *   "Initiate's Feather" -> INITIATES_FEATHER
 *   "\"Pile 'Em Up\""    -> PILE_EM_UP
 */
function assetBaseName(string $name): string
{
    // Drop everything that is not a plain ASCII alphanumeric or whitespace.
    // Accents go too: "Consommé" is stored as CONSOMM.
    $name = preg_replace('/[^A-Za-z0-9\s]/u', '', $name);
    // ...then turn each remaining whitespace character into a single underscore.
    // Runs are deliberately not collapsed: dropping the separator in
    // "Fatui Skirmisher - Pyroslinger Bracer" is what leaves the double
    // underscore the stored paths already use.
    $name = preg_replace('/\s/u', '_', $name);
    return trim(mb_strtoupper($name), '_');
}

/**
 * Describes every upload the admin UI can make.
 *
 * Each entry resolves to the row that owns the column, the folder under
 * assets/, and how the file is named. `suffix` is appended as " - {suffix}",
 * `variant` directly ("HU_TAO2"), and `parent` names the row a child's file is
 * filed under.
 *
 * These are only the fallback names: the admin derives the same names on the
 * client and sends them with the upload. They matter when something posts
 * without one.
 */
function _uploadTargets(): array
{
    return [
        'character' => [
            'table' => 'characters',
            'fields' => [
                'icon' => ['folder' => 'character/icon'],
                'card_icon' => ['folder' => 'character/card_icon'],
                'card_icon_2' => ['folder' => 'character/card_icon', 'variant' => '2'],
                'wish_icon' => ['folder' => 'character/wish_icon'],
                'ingame_icon' => ['folder' => 'character/ingame_icon'],
                'ingame_icon_2' => ['folder' => 'character/ingame_icon', 'variant' => '2'],
                'namecard_icon' => ['folder' => 'character/namecard_icon'],
                'namecard_background' => ['folder' => 'character/namecard_background'],
                'namecard_banner' => ['folder' => 'character/namecard_banner'],
            ],
        ],
        'enemy' => [
            'table' => 'enemies',
            'fields' => ['icon' => ['folder' => 'enemies']],
        ],
        // A phase is filed under its enemy: an enemy's phases share a name, so
        // they are told apart by position and by what the picture shows.
        'enemy-phase' => [
            'table' => 'enemies_phases',
            'parent' => ['table' => 'enemies', 'key' => 'enemy_id'],
            'fields' => [
                'icon' => ['folder' => 'enemies', 'suffix' => 'phase#'],
                'art' => ['folder' => 'enemies', 'suffix' => 'full_art'],
            ],
        ],
        'character-constellation' => [
            'table' => 'characters_constellations',
            'fields' => ['icon' => ['folder' => 'character/constellations']],
        ],
        'character-talent' => [
            'table' => 'characters_talents',
            'fields' => ['icon' => ['folder' => 'character/talents']],
        ],
        'artifact' => [
            'table' => 'artifacts',
            'fields' => ['icon' => ['folder' => 'artifacts']],
        ],
        'artifact-piece' => [
            'table' => 'artifacts_pieces',
            'fields' => ['icon' => ['folder' => 'artifacts']],
        ],
        'weapon' => [
            'table' => 'weapons',
            'fields' => [
                'icon' => ['folder' => 'weapons'],
                'icon_2' => ['folder' => 'weapons', 'variant' => '2'],
                'icon_ascension' => ['folder' => 'weapons', 'suffix' => 'ascension'],
            ],
        ],
        'food' => [
            'table' => 'foods',
            'fields' => [
                'icon_normal' => ['folder' => 'foods', 'suffix' => 'normal'],
                'icon_delicious' => ['folder' => 'foods', 'suffix' => 'delicious'],
                'icon_suspicious' => ['folder' => 'foods', 'suffix' => 'suspicious'],
            ],
        ],
        'character-voice-over' => [
            'table' => 'characters_voice_overs',
            'resolver' => '_resolveVoiceOverTarget',
            'fields' => [
                'audio_english' => ['name_column' => null],
                'audio_japanese' => ['name_column' => null],
                'audio_chinese' => ['name_column' => null],
                'audio_korean' => ['name_column' => null],
            ],
        ],
        // Materials have no icon column; the site resolves art by display name.
        'material' => [
            'table' => 'materials',
            'literal_name' => true,
            'fields' => ['icon' => ['folder' => 'materials']],
        ],
        // Banner art is "{version} - {name}", also resolved by name.
        'banner' => [
            'table' => 'banners',
            'resolver' => '_resolveBannerTarget',
            'fields' => ['icon' => ['folder' => 'banners']],
        ],
        // A background is a full image plus a "- preview" thumbnail.
        'background' => [
            'table' => 'backgrounds',
            'literal_name' => true,
            'fields' => [
                'image' => ['folder' => 'backgrounds'],
                'preview' => ['folder' => 'backgrounds', 'suffix' => 'preview'],
            ],
        ],
    ];
}

/**
 * Voice over clips live under the character, type and language, and are named
 * after the line's title in that language:
 *   assets/character/voice_overs/Amber/story/en/Hello.ogg
 */
function _resolveVoiceOverTarget(PDO $pdo, array $row, string $field): ?array
{
    $languages = ['audio_english' => ['en', 'title_english'], 'audio_japanese' => ['ja', 'title_japanese'], 'audio_chinese' => ['zh', 'title_chinese'], 'audio_korean' => ['ko', 'title_korean']];
    if (!isset($languages[$field])) {
        return null;
    }
    [$code, $titleColumn] = $languages[$field];

    $stmt = $pdo->prepare('SELECT name FROM characters WHERE id = ?');
    $stmt->execute([$row['character_id']]);
    $character = (string) $stmt->fetchColumn();

    $title = trim((string) ($row[$titleColumn] ?? ''));
    if ($title === '' || empty($row['type'])) {
        return null;
    }

    // Both of these are editor-supplied values that become folder names.
    $characterSegment = _assetPathSegment($character);
    $typeSegment = _assetPathSegment((string) $row['type']);
    if ($characterSegment === null || $typeSegment === null) {
        return null;
    }

    return ['folder' => 'character/voice_overs/' . $characterSegment . '/' . $typeSegment . '/' . $code, 'base' => $title, 'audio' => true];
}

/**
 * Banner art is named after the banner rather than snake-cased:
 *   assets/banners/1.0 - Ballad in Goblets 2020-09-28.avif
 */
function _resolveBannerTarget(PDO $pdo, array $row, string $field): ?array
{
    $version = trim((string) ($row['version'] ?? ''));
    $name = trim((string) ($row['name'] ?? ''));
    if ($version === '' || $name === '') {
        return null;
    }
    return ['folder' => 'banners', 'base' => $version . ' - ' . $name];
}

/** `phase#` becomes the phase's position among its enemy's phases. */
function _resolvePhaseSuffix(PDO $pdo, array $row): string
{
    $stmt = $pdo->prepare('SELECT id FROM enemies_phases WHERE enemy_id = ? AND deleted = FALSE ORDER BY id ASC');
    $stmt->execute([$row['enemy_id']]);
    $ids = array_column($stmt->fetchAll(), 'id');
    $position = array_search($row['id'], $ids, false);
    return 'phase' . (($position === false ? 0 : $position) + 1);
}

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
 * The name an upload gets when the client does not supply one: the old
 * convention of the entity's name plus the field's suffix.
 */
function _defaultUploadName(PDO $pdo, array $spec, array $fieldSpec, array $row): ?string
{
    // A child's file is named after its parent where the data does that.
    if (isset($spec['parent'])) {
        $stmt = $pdo->prepare("SELECT name FROM {$spec['parent']['table']} WHERE id = ?");
        $stmt->execute([$row[$spec['parent']['key']]]);
        $rawName = (string) $stmt->fetchColumn();
    } else {
        $rawName = (string) ($row[$spec['name_column'] ?? 'name'] ?? '');
    }
    $baseName = assetBaseName($rawName);

    if (!empty($spec['literal_name'])) {
        // Materials are looked up as "{name}.avif" first, so prefer the display
        // name - but only when it survives sanitising unchanged.
        $literal = _assetPathSegment($rawName);
        if ($literal !== null && $literal === trim($rawName)) {
            $baseName = $literal;
        }
    }
    if ($baseName === '') {
        return null;
    }

    // A variant is a second take on the same picture: HU_TAO -> HU_TAO2.
    if (!empty($fieldSpec['variant'])) {
        return $baseName . $fieldSpec['variant'];
    }

    $suffix = $fieldSpec['suffix'] ?? null;
    if ($suffix === 'phase#') {
        $suffix = _resolvePhaseSuffix($pdo, $row);
    }
    if ($suffix !== null && $suffix !== '') {
        $baseName .= ' - ' . $suffix;
    }

    return $baseName;
}

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
