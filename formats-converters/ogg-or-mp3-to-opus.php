<?php

// Configuration
const ASSETS_FOLDER = '../assets'; // Relative to this script's location
const OPUS_BITRATE = '48k';          // Adjust quality: 32k, 48k, 64k, 96k, 128k
const DELETE_ORIGINAL = true;          // Set to false to keep originals after conversion

function getAllAudioFiles(string $dir): array
{
    $files = [];
    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir));
    foreach ($iterator as $file) {
        if (!$file->isFile())
            continue;
        $ext = strtolower($file->getExtension());
        if ($ext === 'mp3' || $ext === 'ogg') {
            $files[] = $file->getPathname();
        }
    }
    return $files;
}

function convertToOpus(string $inputPath, string $outputPath, string $bitrate): bool
{
    $cmd = sprintf(
        'ffmpeg -i %s -c:a libopus -b:a %s %s -y 2>&1',
        escapeshellarg($inputPath),
        escapeshellarg($bitrate),
        escapeshellarg($outputPath)
    );

    exec($cmd, $output, $exitCode);

    return $exitCode === 0;
}

// --- Main ---

$scriptDir = __DIR__;
$assetsPath = realpath($scriptDir . '/' . ASSETS_FOLDER);

if (!$assetsPath || !is_dir($assetsPath)) {
    echo "ERROR: Assets folder not found: $assetsPath\n";
    exit(1);
}

echo "Searching for MP3 and OGG files in: $assetsPath\n";

$files = getAllAudioFiles($assetsPath);
$total = count($files);
$successCount = 0;
$errorCount = 0;
$skippedCount = 0;

echo "Found $total file(s).\n\n";

foreach ($files as $index => $filePath) {
    $num = $index + 1;
    $basename = basename($filePath);
    $opusPath = preg_replace('/\.(mp3|ogg)$/i', '.opus', $filePath);

    echo "[$num/$total] Converting: $basename\n";

    if (file_exists($opusPath)) {
        echo "  → Skipped (opus already exists)\n\n";
        $skippedCount++;
        continue;
    }

    $ok = convertToOpus($filePath, $opusPath, OPUS_BITRATE);

    if ($ok) {
        $successCount++;
        echo "  ✓ Created: " . basename($opusPath) . "\n";

        if (DELETE_ORIGINAL) {
            if (unlink($filePath)) {
                echo "  ✓ Deleted original: $basename\n";
            } else {
                echo "  ⚠ Could not delete original: $basename\n";
            }
        }
    } else {
        $errorCount++;
        echo "  ✗ Conversion failed: $basename\n";
    }

    echo "\n";
}

echo str_repeat('=', 50) . "\n";
echo "Conversion complete!\n";
echo "✓ Successful : $successCount\n";
echo "✗ Failed     : $errorCount\n";
echo "→ Skipped    : $skippedCount\n";
echo str_repeat('=', 50) . "\n";
