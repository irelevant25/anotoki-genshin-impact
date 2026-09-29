<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

$app->get('/api/artifact-piece-types', function (Request $request, Response $response) {
    $stmt = genshinDb()->query('SELECT * FROM artifact_piece_types ORDER BY name ASC');
    return respondJson($response, $stmt->fetchAll());
})->add(responds('artifact_piece_types', list: true));
