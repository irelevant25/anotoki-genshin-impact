<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * Talent sets - the wrapper several characters can share one set of talents
 * (and their costs) through. Read-only: sets are made and pointed at by the
 * character form, not managed here. Mirrors characters_ascensions_sets.php.
 *
 *   GET /api/talent-sets        every set, with the characters on it and how many
 *                               talents it holds - the picker's list
 *   GET /api/talent-sets/{id}   one set's talents and their costs, to preview it
 */

$app->get('/api/talent-sets', function (Request $request, Response $response) {
    $pdo = genshinDb();

    $sets = $pdo->query(
        'SELECT s.id, count(t.id) FILTER (WHERE t.deleted = FALSE) AS talent_count
           FROM characters_talents_sets s
           LEFT JOIN characters_talents t ON t.talent_set_id = s.id
          GROUP BY s.id
          ORDER BY s.id'
    )->fetchAll(PDO::FETCH_ASSOC);

    $members = [];
    foreach ($pdo->query('SELECT id, name, talent_set_id FROM characters WHERE talent_set_id IS NOT NULL AND deleted = FALSE ORDER BY name') as $c) {
        $members[(int) $c['talent_set_id']][] = ['id' => (int) $c['id'], 'name' => $c['name']];
    }

    $out = array_map(fn(array $s) => [
        'id' => (int) $s['id'],
        'talent_count' => (int) $s['talent_count'],
        'characters' => $members[(int) $s['id']] ?? [],
    ], $sets);

    return respondJson($response, $out);
})->add(responds(TalentSet::class, list: true))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

$app->get('/api/talent-sets/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();
    $setId = (int) $args['id'];

    $stmt = $pdo->prepare('SELECT * FROM characters_talents WHERE talent_set_id = ? AND deleted = FALSE ORDER BY "order" ASC, id ASC');
    $stmt->execute([$setId]);
    $talents = $stmt->fetchAll();
    resolveAssetRows($pdo, 'characters_talents', $talents); // talents carry an icon

    // Talent costs are a flat per-set list (not nested under a talent), so they
    // ride along beside the talents the same way the /full read hands them over.
    $stmt = $pdo->prepare('SELECT * FROM characters_talents_cost WHERE talent_set_id = ? AND deleted = FALSE ORDER BY level ASC, "order" ASC');
    $stmt->execute([$setId]);
    $talent_cost = $stmt->fetchAll();

    return respondJson($response, ['talents' => $talents, 'talent_cost' => $talent_cost]);
})->add(responds(TalentSetDetail::class))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());
