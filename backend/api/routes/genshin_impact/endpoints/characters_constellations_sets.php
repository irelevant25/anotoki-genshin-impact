<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * Constellation sets - the wrapper several characters can share one set of
 * constellations through. Read-only: sets are made and pointed at by the
 * character form, not managed here. Mirrors characters_ascensions_sets.php.
 *
 *   GET /api/constellation-sets        every set, members + how many it holds
 *   GET /api/constellation-sets/{id}   one set's constellation rows, to preview it
 */

$app->get('/api/constellation-sets', function (Request $request, Response $response) {
    $pdo = genshinDb();

    $sets = $pdo
        ->query(
            'SELECT s.id, count(con.id) FILTER (WHERE con.deleted = FALSE) AS constellation_count
           FROM characters_constellations_sets s
           LEFT JOIN characters_constellations con ON con.constellation_set_id = s.id
          GROUP BY s.id
          ORDER BY s.id',
        )
        ->fetchAll(PDO::FETCH_ASSOC);

    $members = [];
    foreach ($pdo->query('SELECT id, name, constellation_set_id FROM characters WHERE constellation_set_id IS NOT NULL AND deleted = FALSE ORDER BY name') as $c) {
        $members[(int) $c['constellation_set_id']][] = ['id' => (int) $c['id'], 'name' => $c['name']];
    }

    $out = array_map(
        fn(array $s) => [
            'id' => (int) $s['id'],
            'constellation_count' => (int) $s['constellation_count'],
            'characters' => $members[(int) $s['id']] ?? [],
        ],
        $sets,
    );

    return respondJson($response, $out);
})
    ->add(responds(ConstellationSet::class, list: true))
    ->add(requireRole(...ROLES_CONTENT))
    ->add(requireAuth());

$app->get('/api/constellation-sets/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();

    $stmt = $pdo->prepare('SELECT * FROM characters_constellations WHERE constellation_set_id = ? AND deleted = FALSE ORDER BY level ASC, id ASC');
    $stmt->execute([(int) $args['id']]);
    $rows = $stmt->fetchAll();
    resolveAssetRows($pdo, 'characters_constellations', $rows); // constellations carry an icon

    return respondJson($response, $rows);
})
    ->add(responds('characters_constellations', list: true))
    ->add(requireRole(...ROLES_CONTENT))
    ->add(requireAuth());
