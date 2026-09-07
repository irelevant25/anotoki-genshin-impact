<?php

// ---------------------------------------------------------------------------
// link-voice-over-audio.php — local content tool (production is shell-less)
// ---------------------------------------------------------------------------
// The admin "Import Voice Overs" modal only *links* audio: it points voice-over
// rows at assets/character/voice_overs/{Character}/{type}/{lang}/{Title}.opus and
// the backend refuses to catalogue a file that is not already on disk. The
// crawler leaves .ogg files under local/crawling/… instead, so that link step
// finds nothing.
//
// This does the missing half: convert a character's crawled .ogg voice-overs to
// .opus into the served asset tree (the same libopus @ 48k the rest of the audio
// uses), catalogue them in `files`, and set the character's voice-over rows'
// audio_*_file_id - matched to their lines exactly the way the modal matches
// (by the title the file is named after, with a " NN" suffix picking a repeat).
//
// Usage (from php/):
//   php link-voice-over-audio.php "Lumine" "../local/crawling/assets/character/voice_overs/lumine"
//
// Re-running is safe: an .opus already in place is left alone, and a files row
// already catalogued is reused rather than duplicated.
// ---------------------------------------------------------------------------

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$base = __DIR__;
$repo = dirname($base);

$cfg = require "$base/config/database.local.php";
require "$base/api/audit_scope.php";
require "$base/api/audit_file.php";
require "$base/api/asset_columns.php";

// asset_catalogue.php is not loaded (it drags in the whole API); catalogueRoot()
// is one stable line, and upsertCatalogueFile() only needs this one function.
if (!function_exists('catalogueRoot')) {
    function catalogueRoot(): string
    {
        return dirname(__DIR__) . '/assets';
    }
}

// ── Args ───────────────────────────────────────────────────────────────────
$who = $argv[1] ?? null; // character id, or name - a name can hit several Traveler variants
$sourceArg = $argv[2] ?? null;
if (!$who || !$sourceArg) {
    fwrite(STDERR, "Usage: php link-voice-over-audio.php \"<Character name or id>\" \"<source .ogg folder>\"\n");
    exit(1);
}
$sourceDir = realpath($sourceArg);
if ($sourceDir === false || !is_dir($sourceDir)) {
    fwrite(STDERR, "Source folder not found: $sourceArg\n");
    exit(1);
}

$ffmpeg = $repo . '/formats-converters/ffmpeg.exe';
if (!is_file($ffmpeg)) {
    // Fall back to a PATH ffmpeg on non-Windows checkouts.
    $ffmpeg = 'ffmpeg';
}

// ── Matching, mirrored from voice-over-import.model.ts ───────────────────────
const LANGUAGE_BY_FOLDER = ['en' => 'english', 'ja' => 'japanese', 'jp' => 'japanese', 'ko' => 'korean', 'kr' => 'korean', 'zh' => 'chinese', 'cn' => 'chinese'];
const TITLE_FIELDS = [
    'english' => ['title_english'],
    'japanese' => ['title_japanese'],
    'korean' => ['title_korean'],
    'chinese' => ['title_chinese', 'title_chinese_traditional'],
];

function normTitle(?string $value): string
{
    if ($value === null || $value === '') {
        return '';
    }
    if (class_exists('Normalizer')) {
        $value = Normalizer::normalize($value, Normalizer::FORM_C) ?: $value;
    }
    $value = str_replace(':', ' - ', $value);
    $value = preg_replace('#["*/:<>?\\\\|]#u', '', $value);
    $value = preg_replace('/\s+/u', ' ', $value);
    return mb_strtolower(trim($value));
}

/** The voice-over rows of $type whose title in $language is $title, in `order`. */
function candidateRows(array $rows, string $type, string $language, string $title, ?int $variant): array
{
    $wanted = normTitle($title);
    $wantedVariant = $variant !== null ? normTitle($title . ' ' . sprintf('%02d', $variant)) : null;

    $matches = array_filter($rows, function (array $row) use ($type, $language, $wanted, $wantedVariant) {
        if ($row['type'] !== $type) {
            return false;
        }
        foreach (TITLE_FIELDS[$language] as $field) {
            $title = normTitle($row[$field] ?? null);
            if ($title !== '' && ($title === $wanted || $title === $wantedVariant)) {
                return true;
            }
        }
        return false;
    });

    usort($matches, fn(array $a, array $b) => $a['ord'] <=> $b['ord']);
    return array_values($matches);
}

// ── Database ─────────────────────────────────────────────────────────────────
$dsn = "pgsql:host={$cfg['host']};port={$cfg['port']};dbname={$cfg['databases']['genshin_impact']}";
$pdo = new PDO($dsn, $cfg['username'], $cfg['password'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

// Resolve the character. A bare name can match several rows - the Traveler has
// one per element (six "Lumine", six "Aether") - so when it does, link the one
// that actually carries the lines (the row with a set). An id is unambiguous.
if (ctype_digit((string) $who)) {
    $stmt = $pdo->prepare('SELECT id, name, voice_over_set_id FROM characters WHERE id = ? AND deleted = FALSE');
    $stmt->execute([(int) $who]);
} else {
    $stmt = $pdo->prepare('SELECT id, name, voice_over_set_id FROM characters WHERE name = ? AND deleted = FALSE ORDER BY id');
    $stmt->execute([$who]);
}
$candidates = $stmt->fetchAll(PDO::FETCH_ASSOC);
if (!$candidates) {
    fwrite(STDERR, "No character matching \"$who\".\n");
    exit(1);
}

$character = null;
if (count($candidates) === 1) {
    $character = $candidates[0];
} else {
    $withSet = array_values(array_filter($candidates, fn(array $c) => !empty($c['voice_over_set_id'])));
    if (count($withSet) === 1) {
        $character = $withSet[0];
    } else {
        fwrite(STDERR, "\"$who\" matches several characters:\n");
        foreach ($candidates as $c) {
            fwrite(STDERR, "  id {$c['id']}  set " . ($c['voice_over_set_id'] ?? '-') . "\n");
        }
        fwrite(STDERR, "Pass the id of the one to link.\n");
        exit(1);
    }
}

$characterName = $character['name'];
$setId = (int) ($character['voice_over_set_id'] ?? 0);
if (!$setId) {
    fwrite(STDERR, "\"$characterName\" (id {$character['id']}) has no voice_over_set_id - import the lines first, then run this.\n");
    exit(1);
}

$rowStmt = $pdo->prepare(
    'SELECT id, "order" AS ord, type, title_english, title_japanese, title_chinese, title_chinese_traditional, title_korean
     FROM characters_voice_overs WHERE voice_over_set_id = ? AND deleted = FALSE'
);
$rowStmt->execute([$setId]);
$rows = $rowStmt->fetchAll(PDO::FETCH_ASSOC);
echo "Character \"$characterName\" (id {$character['id']}), set $setId, " . count($rows) . " voice-over lines.\n";

// ── 1. Convert every source .ogg into the asset tree as .opus ────────────────
$iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($sourceDir, FilesystemIterator::SKIP_DOTS));
$oggFiles = [];
foreach ($iterator as $file) {
    if ($file->isFile() && strtolower($file->getExtension()) === 'ogg') {
        $oggFiles[] = str_replace('\\', '/', $file->getPathname());
    }
}
sort($oggFiles);
echo count($oggFiles) . " source .ogg files.\n";

$assetBase = catalogueRoot() . '/character/voice_overs/' . $characterName;
$source = str_replace('\\', '/', $sourceDir);

$converted = 0;
$skipped = 0;
$convertFailed = 0;
$placed = []; // [type, langFolder, stemWithVariant]

foreach ($oggFiles as $i => $ogg) {
    $relative = ltrim(substr($ogg, strlen($source)), '/'); // {type}/{lang}/{file}.ogg
    $segments = explode('/', $relative);
    if (count($segments) < 3) {
        continue; // not laid out as type/lang/file
    }
    [$type, $langFolder, $fileName] = array_slice($segments, -3);
    $stem = preg_replace('/\.[^.]+$/', '', $fileName);

    $targetDir = "$assetBase/$type/$langFolder";
    $target = "$targetDir/$stem.opus";
    $placed[] = [$type, $langFolder, $stem];

    if (is_file($target)) {
        $skipped++;
        continue;
    }
    if (!is_dir($targetDir)) {
        @mkdir($targetDir, 0775, true);
    }

    $cmd = sprintf('"%s" -nostdin -loglevel error -y -i "%s" -c:a libopus -b:a 48k "%s"', $ffmpeg, $ogg, $target);
    exec($cmd . ' 2>&1', $out, $code);
    if ($code === 0 && is_file($target)) {
        $converted++;
    } else {
        $convertFailed++;
        fwrite(STDERR, "  convert failed: $relative\n");
    }
    if (($i + 1) % 200 === 0) {
        echo "  …converted " . ($i + 1) . "/" . count($oggFiles) . "\n";
    }
}
echo "Converted $converted, already present $skipped, failed $convertFailed.\n";

// ── 2. Catalogue + link each placed .opus onto its voice-over row ────────────
$variantRe = '/^(.*?)[ _](\d{2})$/u';
$linked = ['english' => 0, 'japanese' => 0, 'korean' => 0, 'chinese' => 0];
$unmatched = [];

$pdo->beginTransaction();
try {
    foreach ($placed as [$type, $langFolder, $stem]) {
        $language = LANGUAGE_BY_FOLDER[strtolower($langFolder)] ?? null;
        if (!$language) {
            $unmatched[] = "$type/$langFolder/$stem (unknown language folder)";
            continue;
        }

        $title = $stem;
        $variant = null;
        if (preg_match($variantRe, $stem, $m)) {
            $title = $m[1];
            $variant = (int) $m[2];
        }

        $candidates = candidateRows($rows, $type, $language, $title, $variant);
        $target = $variant !== null ? ($candidates[$variant - 1] ?? null) : (count($candidates) === 1 ? $candidates[0] : null);
        if (!$target) {
            $unmatched[] = "$type/$langFolder/$stem";
            continue;
        }

        $name = "$characterName/$type/$langFolder/$stem";
        $fileId = upsertCatalogueFile($pdo, 'character.voice_overs', $name, 'opus', null);
        if (!$fileId) {
            $unmatched[] = "$type/$langFolder/$stem (not catalogued - missing on disk?)";
            continue;
        }

        $column = "audio_{$language}_file_id";
        $pdo->prepare("UPDATE characters_voice_overs SET $column = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
            ->execute([$fileId, $target['id']]);
        $linked[$language]++;
    }
    $pdo->commit();
} catch (\Throwable $e) {
    $pdo->rollBack();
    throw $e;
}

echo "Linked: en {$linked['english']}, ja {$linked['japanese']}, ko {$linked['korean']}, zh {$linked['chinese']}.\n";
echo "Unmatched: " . count($unmatched) . "\n";
foreach (array_slice($unmatched, 0, 15) as $u) {
    echo "  - $u\n";
}
echo "Done.\n";
