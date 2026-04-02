<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

$app->get('/api/languages', function (Request $request, Response $response) {
    $stmt = genshinDb()->query('SELECT * FROM languages ORDER BY name ASC');
    return respondJson($response, $stmt->fetchAll());
});
