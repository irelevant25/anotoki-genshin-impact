<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * POST /api/upload
 *
 * Accepts multipart/form-data with a single file field named "file".
 * Optional field "folder" to specify subfolder (characters, icons, etc.).
 * Returns { "filename": "...", "path": "..." }
 */
$app->post('/api/upload', function (Request $request, Response $response) {
    $uploadedFiles = $request->getUploadedFiles();
    $body = $request->getParsedBody();

    if (empty($uploadedFiles['file'])) {
        return respondJson($response, ['error' => 'No file uploaded'], 400);
    }

    $file = $uploadedFiles['file'];

    if ($file->getError() !== UPLOAD_ERR_OK) {
        return respondJson($response, ['error' => 'Upload error: ' . $file->getError()], 400);
    }

    // The extension the file is stored under is decided here, from an
    // allowlist - never taken from the client filename. The client's declared
    // Content-Type is not trusted either: it is set by the caller and says
    // nothing about the bytes. Both are only the first gate; the real one is
    // that nothing outside this list is ever written with an executable or
    // markup extension, so a .php or .html cannot be uploaded whatever it
    // claims to be.
    $allowedExtensions = [
        'jpg' => 'image', 'jpeg' => 'image', 'png' => 'image', 'webp' => 'image',
        'avif' => 'image', 'gif' => 'image',
        'mp3' => 'audio', 'ogg' => 'audio', 'wav' => 'audio', 'webm' => 'audio',
    ];

    $ext = strtolower(pathinfo($file->getClientFilename() ?? '', PATHINFO_EXTENSION));
    if (!isset($allowedExtensions[$ext])) {
        return respondJson($response, ['error' => 'Unsupported file type: .' . $ext], 415);
    }

    // For an image, confirm the bytes actually are one. getimagesize reads the
    // header and returns false for anything that is not a real image, so a
    // script renamed to .png does not get through even if the extension passes.
    $stream = $file->getStream();
    if ($allowedExtensions[$ext] === 'image') {
        $peek = (string) $stream->read(65536);
        $stream->rewind();
        if (@getimagesizefromstring($peek) === false) {
            return respondJson($response, ['error' => 'That file is not a valid image'], 415);
        }
    }

    $folder = preg_replace('/[^a-z0-9_\-]/', '', strtolower($body['folder'] ?? 'uploads'));
    $filename = bin2hex(random_bytes(16)) . '.' . $ext;

    $uploadDir = __DIR__ . '/../../../../public/uploads/' . $folder . '/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $file->moveTo($uploadDir . $filename);

    return respondJson($response, [
        'filename' => $filename,
        'path' => '/uploads/' . $folder . '/' . $filename,
    ], 201);
})->add(responds(UploadResult::class))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());
