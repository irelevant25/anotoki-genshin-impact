<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

$app->get('/api/rarities', function (Request $request, Response $response) {
    $stmt = genshinDb()->query('SELECT * FROM rarities ORDER BY name ASC');
    return respondJson($response, $stmt->fetchAll());
})->add(responds('rarities', list: true));
