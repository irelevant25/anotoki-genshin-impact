<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

$app->get('/api/elements', function (Request $request, Response $response) {
    $stmt = genshinDb()->query('SELECT * FROM elements ORDER BY name ASC');
    return respondJson($response, $stmt->fetchAll());
})->add(responds('elements', list: true));
