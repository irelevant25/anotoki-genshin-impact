<?php

/**
 * The built-in server, made to behave like the Apache the site runs on.
 *
 *     php -S localhost:8000 router.php
 *
 * Without this, `php -S` decides whether a request is for a file by looking at
 * the last path segment: anything with a dot in it is treated as a static file
 * and answered with 404 if there is none, without the API ever being reached.
 *
 * Almost every path is fine. Translation keys are not - they are all dots, so
 * `PUT /api/translation-keys/guide.banners.content` never arrived, and neither
 * did its CORS preflight, which is what the browser reported instead. Apache
 * has no such rule: api/.htaccess sends everything that is not a real file to
 * index.php, which is what this does.
 *
 * It also serves uploads, which live under public/ where Apache's document
 * root points. One document root cannot cover both those and the API, so the
 * file is handed over here rather than by the server.
 */

$path = urldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/');

// ─────────────────────────────────────────────────────────────────────────────
// Uploaded files
// ─────────────────────────────────────────────────────────────────────────────

if (str_starts_with($path, '/uploads/')) {
    $root = realpath(__DIR__ . '/public/uploads');
    $file = realpath(__DIR__ . '/public' . $path);

    // realpath resolves `..`, so comparing the resolved paths is what stops a
    // request climbing out of the uploads directory.
    if ($root !== false && $file !== false && is_file($file) && str_starts_with($file, $root . DIRECTORY_SEPARATOR)) {
        $type = @mime_content_type($file);
        header('Content-Type: ' . ($type ?: 'application/octet-stream'));
        header('Content-Length: ' . filesize($file));
        readfile($file);
        return true;
    }

    http_response_code(404);
    return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Everything else is the API
// ─────────────────────────────────────────────────────────────────────────────

require __DIR__ . '/api/index.php';
