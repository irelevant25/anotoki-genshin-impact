<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

$app->get('/api/voice-over-types', function (Request $request, Response $response) {
    $stmt = genshinDb()->query('SELECT * FROM voice_over_types ORDER BY name ASC');
    return respondJson($response, $stmt->fetchAll());
})->add(responds('voice_over_types', list: true));
