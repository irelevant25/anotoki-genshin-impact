<?php

function getAllFiles(string $dir): array
{
    $files = [];
    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir));
    foreach ($iterator as $file) {
        if ($file->isFile()) {
            $files[] = $file->getPathname();
        }
    }
    return $files;
}

function convertToAvif(string $inputPath, string $outputPath): bool
{
    // Try Imagick first
    if (extension_loaded('imagick')) {
        try {
            $img = new Imagick($inputPath);
            $img->setImageFormat('avif');
            $img->setImageCompressionQuality(60);
            $img->writeImage($outputPath);
            $img->destroy();
            return true;
        } catch (Exception $e) {
            echo "Imagick failed: " . $e->getMessage() . "\n";
        }
    }

    // Fall back to GD
    if (extension_loaded('gd') && function_exists('imageavif')) {
        $img = imagecreatefrompng($inputPath);
        if (!$img)
            return false;
        imagepalettetotruecolor($img);
        imagealphablending($img, true);
        imagesavealpha($img, true);
        $result = imageavif($img, $outputPath, 60); // quality 0-100
        imagedestroy($img);
        return $result;
    }

    echo "No AVIF-capable extension found (need Imagick or GD with AVIF support).\n";
    return false;
}

// --- Main ---
$rootDir = 'assets';
$allFiles = getAllFiles($rootDir);
echo "Found " . count($allFiles) . " files in '$rootDir'\n";

foreach ($allFiles as $file) {
    $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
    if ($ext !== 'png')
        continue;

    $avifPath = substr($file, 0, strrpos($file, '.')) . '.avif';
    if (file_exists($avifPath))
        continue; // skip if already converted

    echo "Converting $file → $avifPath ... ";
    $ok = convertToAvif($file, $avifPath);
    echo $ok ? "done\n" : "FAILED\n";
}

/* Before running it, check what's available on your WebSupport server by creating a quick info file:
<?php
echo "Imagick: " . (extension_loaded('imagick') ? 'YES' : 'NO') . "\n";
echo "GD AVIF: " . (function_exists('imageavif') ? 'YES' : 'NO') . "\n";
phpinfo();
*/