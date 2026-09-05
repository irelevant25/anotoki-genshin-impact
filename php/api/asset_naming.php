<?php

/**
 * Where a file for a given row belongs, and what it should be called.
 *
 * This was the top half of the uploads endpoint, and it was only ever reachable
 * from there - which meant the one place that knew a banner's picture is called
 * "{version} - {name}" was a file that cannot be loaded without a router. The
 * reconcile sweep needs the same answer to work out which catalogue row an
 * entity ought to be pointing at, and so does anything run from the command
 * line, so it lives on its own now.
 *
 * Nothing here writes: it decides names and folders. Putting a file where these
 * say is still uploads.php's job.
 */

/** Repo root, one level above php/. */
function _assetsRoot(): string
{
    return dirname(__DIR__, 2) . '/assets';
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

    $folder = 'character/voice_overs/' . $characterSegment . '/' . $typeSegment . '/' . $code;

    // Replacing the clip this row already has keeps its name, so a re-upload
    // overwrites the file instead of leaving the old one orphaned beside it.
    $current = $row[$field] ?? null;
    if (is_string($current) && $current !== '') {
        return ['folder' => $folder, 'base' => pathinfo($current, PATHINFO_FILENAME), 'audio' => true];
    }

    return ['folder' => $folder, 'base' => _freeVoiceOverName($folder, $title), 'audio' => true];
}

/**
 * A name for a new clip that is not already taken.
 *
 * A character has nine lines called "Elemental Skill", so the title on its own
 * is not a filename - saving the second one under it would quietly write over
 * the first. Everything already on disk is numbered (`Elemental Skill 01`), and
 * this carries that on by taking the first number nothing is using.
 *
 * The numbering the asset dump came with does not follow from anything in the
 * database - it is the order the clips were scraped in - so this does not try
 * to reproduce it, only to avoid colliding with it.
 */
function _freeVoiceOverName(string $folder, string $title): string
{
    $safeFolder = _assetFolder($folder);
    if ($safeFolder === null) {
        return $title;
    }

    $directory = _assetsRoot() . '/' . $safeFolder;
    $taken = fn(string $base) => (bool) glob($directory . '/' . _globEscape($base) . '.*');

    if (!is_dir($directory) || (!$taken($title) && !$taken($title . ' 01'))) {
        return $title;
    }

    for ($n = 1; $n <= 99; $n++) {
        $candidate = $title . ' ' . str_pad((string) $n, 2, '0', STR_PAD_LEFT);
        if (!$taken($candidate)) {
            return $candidate;
        }
    }

    return $title . ' ' . substr(bin2hex(random_bytes(3)), 0, 6);
}

/** glob() treats these as patterns, and voice over titles contain all of them. */
function _globEscape(string $value): string
{
    return str_replace(['[', ']', '*', '?'], ['[[]', '[]]', '[*]', '[?]'], $value);
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
