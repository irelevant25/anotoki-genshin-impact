<?php

/**
 * Re-encoding for uploads: raster images to AVIF, audio to Opus.
 *
 * Both follow the one-off scripts in /formats-converters, which were written
 * against the hosting this site runs on: Imagick where it exists and GD where
 * it does not, and ffmpeg through exec() for audio.
 *
 * Every entry point degrades quietly. If nothing on the box can encode the
 * target format the upload is still kept in the format it arrived in, and the
 * reason is logged once rather than on every request.
 */

/** AVIF is visually near-lossless well below the GD default of 30. */
const MEDIA_AVIF_QUALITY = 60;

/** Speech at 48k is transparent enough and a fraction of the original size. */
const MEDIA_OPUS_BITRATE = '48k';

/** Where ffmpeg tends to live when it is not on PATH. */
const MEDIA_FFMPEG_CANDIDATES = [
    'ffmpeg',
    '/usr/bin/ffmpeg',
    '/usr/local/bin/ffmpeg',
    '/opt/homebrew/bin/ffmpeg',
    'C:\\ffmpeg\\bin\\ffmpeg.exe',
];

/**
 * Copies of ffmpeg that live inside the repository rather than on the system.
 *
 * /formats-converters is where an ffmpeg ends up either way: dropped in by hand
 * beside the scripts that need it, or unpacked into node_modules by the
 * ffmpeg-static dependency those scripts already declare. Both are looked for,
 * because otherwise the answer to "why is audio not converting" is to install
 * ffmpeg again, globally, next to the copy already sitting on disk.
 *
 * A function rather than a const because a const expression cannot call
 * dirname(), and these are relative to wherever the repository is.
 */
function mediaRepoFfmpegCandidates(): array
{
    $converters = dirname(__DIR__, 2) . '/formats-converters';
    $suffix = DIRECTORY_SEPARATOR === '\\' ? '.exe' : '';

    return [
        $converters . '/ffmpeg' . $suffix,
        $converters . '/node_modules/ffmpeg-static/ffmpeg' . $suffix,
    ];
}

/**
 * Logs a message once per process. Conversion is unavailable for the whole life
 * of a request, not per file, so repeating it on every upload only adds noise.
 */
function _mediaLogOnce(string $key, string $message): void
{
    static $seen = [];
    if (!isset($seen[$key])) {
        $seen[$key] = true;
        error_log('[media] ' . $message);
    }
}

// ── Images ───────────────────────────────────────────────────────────────────

/** Whether anything on this box can write AVIF. */
function mediaCanWriteAvif(): bool
{
    return extension_loaded('imagick') || function_exists('imageavif');
}

/**
 * Writes an AVIF copy of a raster image. Returns false when nothing here can
 * encode it, in which case the caller keeps the original.
 */
function mediaToAvif(string $source, string $target): bool
{
    if (extension_loaded('imagick') && _mediaImagickToAvif($source, $target)) {
        return true;
    }

    if (function_exists('imageavif')) {
        return _mediaGdToAvif($source, $target);
    }

    if (!extension_loaded('imagick')) {
        _mediaLogOnce('avif', 'no AVIF encoder available - uploads keep their original format. Enable the imagick or gd extension.');
    }
    return false;
}

function _mediaImagickToAvif(string $source, string $target): bool
{
    try {
        $image = new Imagick($source);
        $image->setImageFormat('avif');
        $image->setImageCompressionQuality(MEDIA_AVIF_QUALITY);
        $ok = $image->writeImage($target);
        $image->clear();
        return $ok && is_file($target);
    } catch (Throwable $e) {
        // Imagick is often built without an AVIF delegate; fall through to GD.
        _mediaLogOnce('avif-imagick', 'Imagick could not write AVIF (' . $e->getMessage() . ') - trying GD.');
        return false;
    }
}

function _mediaGdToAvif(string $source, string $target): bool
{
    // From the bytes rather than a per-format loader, so any raster GD can read
    // is handled without switching on the extension.
    $image = @imagecreatefromstring((string) file_get_contents($source));
    if (!$image) {
        return false;
    }
    imagepalettetotruecolor($image);
    imagealphablending($image, false);
    imagesavealpha($image, true);
    $ok = @imageavif($image, $target, MEDIA_AVIF_QUALITY);
    imagedestroy($image);

    return $ok && is_file($target);
}

// ── Audio ────────────────────────────────────────────────────────────────────

/**
 * Which of the two ways of starting a program this box allows, or null.
 *
 * Shared hosting disables one or both, and which one it leaves is not something
 * to guess at. proc_open is preferred wherever it exists - see _mediaRun().
 */
function _mediaRunner(): ?string
{
    $disabled = array_map('trim', explode(',', (string) ini_get('disable_functions')));

    foreach (['proc_open', 'exec'] as $runner) {
        if (function_exists($runner) && !in_array($runner, $disabled, true)) {
            return $runner;
        }
    }

    return null;
}

/**
 * Runs a program and returns its exit code and output.
 *
 * The arguments are an array, and proc_open is given that array rather than a
 * string, because escapeshellarg() on Windows does not escape `!` and `%` - it
 * *replaces them with a space*. A voice line filed as "Chat - Look!.ogg" was
 * being handed to ffmpeg as "Chat - Look .ogg", which does not exist, and the
 * conversion of that one file failed while 21,309 others went through. An
 * argument array reaches CreateProcess with the name intact.
 *
 * exec() is kept as the fallback for hosting that allows only that. It carries
 * the same flaw, but only on Windows, and the servers that disable proc_open
 * are not Windows.
 */
function _mediaRun(array $command): array
{
    $runner = _mediaRunner();

    if ($runner === 'proc_open') {
        $descriptors = [1 => ['pipe', 'w'], 2 => ['pipe', 'w']];
        $process = @proc_open($command, $descriptors, $pipes);

        if (!is_resource($process)) {
            return ['code' => -1, 'output' => 'could not start ' . ($command[0] ?? '?')];
        }

        $output = (string) stream_get_contents($pipes[1]) . (string) stream_get_contents($pipes[2]);
        fclose($pipes[1]);
        fclose($pipes[2]);

        return ['code' => proc_close($process), 'output' => trim($output)];
    }

    if ($runner === 'exec') {
        $line = implode(' ', array_map('escapeshellarg', $command)) . ' 2>&1';
        $lines = [];
        $code = -1;
        @exec($line, $lines, $code);

        return ['code' => $code, 'output' => trim(implode("\n", $lines))];
    }

    return ['code' => -1, 'output' => 'no way to start a program'];
}

/**
 * The ffmpeg binary, or null when it cannot be run here. Resolved once: the
 * lookup starts a process, and hosting either has it or does not.
 */
function mediaFfmpegBinary(): ?string
{
    static $resolved = false;
    static $binary = null;

    if ($resolved) {
        return $binary;
    }
    $resolved = true;

    if (_mediaRunner() === null) {
        _mediaLogOnce('ffmpeg', 'proc_open() and exec() are both unavailable - audio uploads keep their original format.');
        return null;
    }

    // The repository's own copies first: a checkout that carries one is saying
    // which ffmpeg it means, and that should beat whatever the system happens
    // to have on PATH.
    foreach ([...mediaRepoFfmpegCandidates(), ...MEDIA_FFMPEG_CANDIDATES] as $candidate) {
        if (_mediaRun([$candidate, '-version'])['code'] === 0) {
            $binary = $candidate;
            return $binary;
        }
    }

    _mediaLogOnce(
        'ffmpeg',
        'ffmpeg not found on PATH, in the usual places, or in /formats-converters - audio uploads keep '
            . 'their original format. Put an ffmpeg binary in /formats-converters, or run `npm i` there.'
    );
    return null;
}

/** Whether audio can be re-encoded here. */
function mediaCanWriteOpus(): bool
{
    return mediaFfmpegBinary() !== null;
}

/**
 * Writes an Opus copy of an audio file. Returns false when ffmpeg is not
 * available or the encode fails, in which case the caller keeps the original.
 */
function mediaToOpus(string $source, string $target, string $bitrate = MEDIA_OPUS_BITRATE): bool
{
    $ffmpeg = mediaFfmpegBinary();
    if ($ffmpeg === null) {
        return false;
    }

    $result = _mediaRun([$ffmpeg, '-i', $source, '-c:a', 'libopus', '-b:a', $bitrate, '-y', $target]);

    if ($result['code'] !== 0) {
        // A partial file left behind would be served as if it were sound.
        if (is_file($target)) {
            @unlink($target);
        }
        $lines = array_slice(explode("\n", $result['output']), -3);
        error_log('[media] ffmpeg failed on ' . basename($source) . ': ' . trim(implode(' ', $lines)));
        return false;
    }

    return is_file($target) && filesize($target) > 0;
}
