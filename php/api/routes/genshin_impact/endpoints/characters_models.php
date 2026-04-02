<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

$app->get('/api/character-models', function (Request $request, Response $response) {
    $stmt = genshinDb()->query('SELECT * FROM character_models ORDER BY name ASC');
    return respondJson($response, $stmt->fetchAll());
});
