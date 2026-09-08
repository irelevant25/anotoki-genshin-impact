<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * Ascension sets - the wrapper several characters can share one set of ascension
 * stats through (the Traveler's variants). Read-only: sets are made and pointed
 * at by the character form, not managed here. Mirrors voice_over_sets.php.
 *
 *   GET /api/ascension-sets        every set, with the characters on it and how
 *                                  many ascension phases it holds - the picker's list
 *   GET /api/ascension-sets/{id}   one set's ascensions and their costs, to preview it
 */

$app->get('/api/ascension-sets', function (Request $request, Response $response) {
    $pdo = genshinDb();

    $sets = $pdo->query(
        'SELECT s.id, count(a.id) FILTER (WHERE a.deleted = FALSE) AS ascension_count
           FROM characters_ascensions_sets s
           LEFT JOIN characters_ascensions a ON a.ascension_set_id = s.id
          GROUP BY s.id
          ORDER BY s.id'
    )->fetchAll(PDO::FETCH_ASSOC);

    // The characters on each set, gathered in one pass - a set is identified by
    // who points at it, since the table itself is only an id.
    $members = [];
    foreach ($pdo->query('SELECT id, name, ascension_set_id FROM characters WHERE ascension_set_id IS NOT NULL AND deleted = FALSE ORDER BY name') as $c) {
        $members[(int) $c['ascension_set_id']][] = ['id' => (int) $c['id'], 'name' => $c['name']];
    }

    $out = array_map(fn(array $s) => [
        'id' => (int) $s['id'],
        'ascension_count' => (int) $s['ascension_count'],
        'characters' => $members[(int) $s['id']] ?? [],
    ], $sets);

    return respondJson($response, $out);
})->add(responds(AscensionSet::class, list: true))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

$app->get('/api/ascension-sets/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();
    $setId = (int) $args['id'];

    $stmt = $pdo->prepare('SELECT * FROM characters_ascensions WHERE ascension_set_id = ? AND deleted = FALSE ORDER BY phase ASC, id ASC');
    $stmt->execute([$setId]);
    $ascensions = $stmt->fetchAll();

    // Costs hang off the ascension rows, so they ride along - the form rebuilds a
    // wrapper per ascension with its costs, the same way the /full read does.
    $ascension_cost = [];
    $ascIds = array_column($ascensions, 'id');
    if ($ascIds) {
        $ph = implode(',', array_fill(0, count($ascIds), '?'));
        $stmt = $pdo->prepare("SELECT * FROM characters_ascensions_cost WHERE character_ascension_id IN ($ph) AND deleted = FALSE ORDER BY \"order\" ASC");
        $stmt->execute($ascIds);
        $ascension_cost = $stmt->fetchAll();
    }

    return respondJson($response, ['ascensions' => $ascensions, 'ascension_cost' => $ascension_cost]);
})->add(responds(AscensionSetDetail::class))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());
