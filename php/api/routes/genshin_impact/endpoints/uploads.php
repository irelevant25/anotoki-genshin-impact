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
 * assets/, and how the file is named. `suffix` is appended as " - {suffix}".
 */
function _uploadTargets(): array
{
    return [
        'character' => [
            'table' => 'characters',
            'fields' => [
                'icon' => ['folder' => 'character/icon'],
                'card_icon' => ['folder' => 'character/card_icon'],
                'card_icon_2' => ['folder' => 'character/card_icon', 'suffix' => '2'],
                'wish_icon' => ['folder' => 'character/wish_icon'],
                'ingame_icon' => ['folder' => 'character/ingame_icon', 'suffix_column' => 'ingame_icon_name'],
                'ingame_icon_2' => ['folder' => 'character/ingame_icon', 'suffix_column' => 'ingame_icon_2_name'],
                'namecard_icon' => ['folder' => 'character/namecard_icon'],
                'namecard_background' => ['folder' => 'character/namecard_background'],
                'namecard_banner' => ['folder' => 'character/namecard_banner'],
            ],
        ],
        'enemy' => [
            'table' => 'enemies',
            'fields' => ['icon' => ['folder' => 'enemies']],
        ],
        'enemy-phase' => [
            'table' => 'enemies_phases',
            'name_column' => 'title',
            'fields' => [
                'icon' => ['folder' => 'enemies', 'suffix' => 'phase#'],
                'art' => ['folder' => 'enemies', 'suffix' => 'full_art'],
            ],
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
                'icon_2' => ['folder' => 'weapons', 'suffix' => '2'],
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
                'audio_english' => [],
                'audio_japanese' => [],
                'audio_chinese' => [],
                'audio_korean' => [],
            ],
        ],
        // Materials have no icon column; the site resolves art by display name.
        'material' => [
            'table' => 'materials',
            'literal_name' => true,
            'fields' => ['icon' => ['folder' => 'materials', 'no_column' => true]],
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
    if ($character === '' || $title === '' || empty($row['type'])) {
        return null;
    }

    return ['folder' => 'character/voice_overs/' . $character . '/' . $row['type'] . '/' . $code, 'base' => $title];
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

    $row = DbQuery::from($pdo, $spec['table'])->find(['id' => (int) $args['id']]);
    if (!$row) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    $file = $request->getUploadedFiles()['file'] ?? null;
    if (!$file) {
        return respondJson($response, ['error' => 'No file sent under the "file" part'], 400);
    }

    // Some targets need more than a column lookup to place the file.
    if (isset($spec['resolver'])) {
        $resolved = ($spec['resolver'])($pdo, $row, $field);
        if (!$resolved) {
            return respondJson($response, ['error' => 'Row is missing the data needed to name this file'], 409);
        }
        $path = _saveAssetUpload($file, $resolved['folder'], $resolved['base'], true);
        if (!$path) {
            return respondJson($response, ['error' => 'Unsupported or unreadable file'], 415);
        }
        $user = $request->getAttribute('user');
        DbQuery::update($pdo, $spec['table'], [$field => $path, 'updated_by' => $user['id']], (int) $args['id']);
        return respondJson($response, ['entity' => $entity, 'id' => (int) $args['id'], 'field' => $field, 'path' => $path, 'stored' => true]);
    }

    // Build the file name from the row, exactly as the existing assets are named.
    $rawName = (string) ($row[$spec['name_column'] ?? 'name'] ?? '');
    $baseName = assetBaseName($rawName);
    if (!empty($spec['literal_name']) && preg_match('#^[^\\/:*?"<>|]+$#', $rawName)) {
        // Prefer the display name; the client looks for "{name}.avif" first.
        $baseName = trim($rawName);
    }
    if ($baseName === '') {
        return respondJson($response, ['error' => 'Row has no name to build a file name from'], 409);
    }

    $suffix = $fieldSpec['suffix'] ?? null;
    if ($suffix === 'phase#') {
        $suffix = _resolvePhaseSuffix($pdo, $row);
    } elseif (isset($fieldSpec['suffix_column'])) {
        $suffix = $row[$fieldSpec['suffix_column']] ?? null;
    }
    if ($suffix !== null && $suffix !== '') {
        $baseName .= ' - ' . $suffix;
    }

    $path = _saveAssetUpload($file, $fieldSpec['folder'], $baseName);
    if (!$path) {
        return respondJson($response, ['error' => 'Unsupported or unreadable file'], 415);
    }

    if (empty($fieldSpec['no_column'])) {
        $user = $request->getAttribute('user');
        DbQuery::update($pdo, $spec['table'], [$field => $path, 'updated_by' => $user['id']], (int) $args['id']);
    }

    return respondJson($response, [
        'entity' => $entity,
        'id' => (int) $args['id'],
        'field' => $field,
        'path' => $path,
        'stored' => empty($fieldSpec['no_column']),
    ]);
})->add(requireRole('ADMIN', 'EDITOR'))->add(requireAuth());

/**
 * Writes into the served asset tree rather than public/uploads, so the file is
 * reachable at the same path the rest of the data already uses. Reuses the
 * allowlist and AVIF conversion from full_resource.php.
 */
function _saveAssetUpload($file, string $folder, string $baseName, bool $audio = false): ?string
{
    if (!$file || $file->getError() !== UPLOAD_ERR_OK) {
        return null;
    }

    $ext = strtolower(pathinfo($file->getClientFilename() ?? '', PATHINFO_EXTENSION));
    $allowed = $audio ? array_diff(UPLOAD_ALLOWED_EXTENSIONS, UPLOAD_IMAGE_EXTENSIONS) : UPLOAD_IMAGE_EXTENSIONS;
    if (!in_array($ext, $allowed, true)) {
        return null;
    }
    if (!$audio && $ext !== 'avif') {
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
    $safeName = trim(preg_replace('#[\\/:*?"<>|]#', '', $baseName));
    if ($safeName === '') {
        return null;
    }
    $dir = _assetsRoot() . '/' . $folder;
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }

    $file->moveTo($dir . '/' . $safeName . '.' . $ext);

    // Voice over rows store a bare `assets/...` path; images use `../assets/...`.
    $prefix = $audio ? 'assets/' : '../assets/';

    if (!$audio && in_array($ext, UPLOAD_CONVERT_TO_AVIF, true)
        && _fullConvertToAvif($dir . '/' . $safeName . '.' . $ext, $dir . '/' . $safeName . '.avif')) {
        return $prefix . $folder . '/' . $safeName . '.avif';
    }

    return $prefix . $folder . '/' . $safeName . '.' . $ext;
}
