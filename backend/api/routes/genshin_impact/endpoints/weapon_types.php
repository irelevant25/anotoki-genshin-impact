<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

$app->get('/api/weapon-types', function (Request $request, Response $response) {
    $stmt = genshinDb()->query('SELECT * FROM weapon_types ORDER BY name ASC');
    return respondJson($response, $stmt->fetchAll());
})->add(responds('weapon_types', list: true));
