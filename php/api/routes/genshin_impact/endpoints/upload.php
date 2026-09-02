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

    $allowedMimeTypes = [
        'image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif',
        'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm',
    ];

    $mime = $file->getClientMediaType();
    if (!in_array($mime, $allowedMimeTypes, true)) {
        return respondJson($response, ['error' => 'Invalid file type: ' . $mime], 400);
    }

    $folder = preg_replace('/[^a-z0-9_\-]/', '', strtolower($body['folder'] ?? 'uploads'));
    $ext = pathinfo($file->getClientFilename(), PATHINFO_EXTENSION);
    $filename = bin2hex(random_bytes(16)) . '.' . strtolower($ext);

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
