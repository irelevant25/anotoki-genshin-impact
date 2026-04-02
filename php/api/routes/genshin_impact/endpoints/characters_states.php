<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

$app->get('/api/character-states', function (Request $request, Response $response) {
    $stmt = genshinDb()->query('SELECT * FROM character_states ORDER BY name ASC');
    return respondJson($response, $stmt->fetchAll());
});
