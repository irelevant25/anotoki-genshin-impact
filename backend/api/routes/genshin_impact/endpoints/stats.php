<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * The stat names a build or an artifact can talk about: CRIT Rate, ATK%, and so
 * on. One column, `name`, which is the key - the same shape as regions and
 * every other lookup here.
 *
 * These used to select on `id`. There is no `id`, so four of the five routes
 * answered 500 to anything and the admin page's add and delete buttons were
 * dead. They key on the name now, which is what the table has.
 */

$app->get('/api/stats', function (Request $request, Response $response) {
    $stmt = genshinDb()->query('SELECT * FROM stats ORDER BY name ASC');
    return respondJson($response, $stmt->fetchAll());
})->add(responds('stats', list: true));

$app->get('/api/stats/{name}', function (Request $request, Response $response, array $args) {
    $stmt = genshinDb()->prepare('SELECT * FROM stats WHERE name = ?');
    $stmt->execute([$args['name']]);
    $item = $stmt->fetch();

    return $item
        ? respondJson($response, $item)
        : respondJson($response, ['error' => 'Not found'], 404);
})->add(responds('stats'));

$app->post('/api/stats', function (Request $request, Response $response) {
    $pdo = genshinDb();
    $body = $request->getParsedBody();

    $existing = $pdo->prepare('SELECT name FROM stats WHERE name = ?');
    $existing->execute([$body['name']]);
    if ($existing->fetch()) {
        return respondJson($response, ['error' => 'There is already a stat called that'], 409);
    }

    $pdo->prepare('INSERT INTO stats (name) VALUES (?)')->execute([$body['name']]);

    $stmt = $pdo->prepare('SELECT * FROM stats WHERE name = ?');
    $stmt->execute([$body['name']]);
    return respondJson($response, $stmt->fetch(), 201);
})->add(responds('stats'))->add(validateRequest(Stat::class))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

$app->delete('/api/stats/{name}', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();

    $stmt = $pdo->prepare('SELECT name FROM stats WHERE name = ?');
    $stmt->execute([$args['name']]);
    if (!$stmt->fetch()) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    $pdo->prepare('DELETE FROM stats WHERE name = ?')->execute([$args['name']]);
    return respondJson($response, ['message' => 'Deleted successfully']);
})->add(responds('stats'))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());
