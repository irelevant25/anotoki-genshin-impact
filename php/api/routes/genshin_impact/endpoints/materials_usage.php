<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

// ── /api/materials/{id}/usage ─────────────────────────────────────────────────
//
// What a material is spent on, which is the question the database page exists to
// answer and the one thing the row itself cannot say.
//
// It is a reverse lookup: the cost tables point at the material, not the other
// way round. Doing it in the browser would mean pulling every character and
// weapon with all their children just to find the handful that mention this one
// material, so it lives here as four small joins instead.
//
// Public, like the rest of the game content.

// GET usage
$app->get('/api/materials/{id:[0-9]+}/usage', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();
    $id = (int) $args['id'];

    if (!DbQuery::from($pdo, 'materials')->find(['id' => $id, 'deleted' => false])) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    $query = function (string $sql) use ($pdo, $id): array {
        $statement = $pdo->prepare($sql);
        $statement->execute([$id]);
        return $statement->fetchAll(PDO::FETCH_ASSOC);
    };

    // A character can spend the same material in several phases, and a weapon in
    // several ascensions; the totals are summed so each one is listed once.
    $charactersAscension = $query(
        'SELECT c.id, c.name, c.icon_file_id, c.rarity, c.element, SUM(cost.quantity) AS quantity
           FROM characters_ascensions_cost cost
           JOIN characters_ascensions a ON a.id = cost.character_ascension_id AND a.deleted = FALSE
           JOIN characters c ON c.id = a.character_id AND c.deleted = FALSE
          WHERE cost.material_id = ? AND cost.deleted = FALSE
          GROUP BY c.id, c.name, c.icon_file_id, c.rarity, c.element
          ORDER BY c.name'
    );

    $charactersTalent = $query(
        'SELECT c.id, c.name, c.icon_file_id, c.rarity, c.element, SUM(cost.quantity) AS quantity
           FROM characters_talents_cost cost
           JOIN characters c ON c.id = cost.character_id AND c.deleted = FALSE
          WHERE cost.material_id = ? AND cost.deleted = FALSE
          GROUP BY c.id, c.name, c.icon_file_id, c.rarity, c.element
          ORDER BY c.name'
    );

    $weaponsAscension = $query(
        'SELECT w.id, w.name, w.icon_file_id, w.rarity, w.type, SUM(cost.quantity) AS quantity
           FROM weapons_ascensions_cost cost
           JOIN weapons_ascensions a ON a.id = cost.weapon_ascension_id AND a.deleted = FALSE
           JOIN weapons w ON w.id = a.weapon_id AND w.deleted = FALSE
          WHERE cost.material_id = ? AND cost.deleted = FALSE
          GROUP BY w.id, w.name, w.icon_file_id, w.rarity, w.type
          ORDER BY w.name'
    );

    $weaponsRefinement = $query(
        'SELECT w.id, w.name, w.icon_file_id, w.rarity, w.type, SUM(r.quantity) AS quantity
           FROM weapons_refinements r
           JOIN weapons w ON w.id = r.weapon_id AND w.deleted = FALSE
          WHERE r.material_id = ? AND r.deleted = FALSE
          GROUP BY w.id, w.name, w.icon_file_id, w.rarity, w.type
          ORDER BY w.name'
    );

    resolveAssetRows($pdo, 'characters', $charactersAscension);
    resolveAssetRows($pdo, 'characters', $charactersTalent);
    resolveAssetRows($pdo, 'weapons', $weaponsAscension);
    resolveAssetRows($pdo, 'weapons', $weaponsRefinement);

    return respondJson($response, [
        'characters_ascension' => $charactersAscension,
        'characters_talent' => $charactersTalent,
        'weapons_ascension' => $weaponsAscension,
        'weapons_refinement' => $weaponsRefinement,
    ]);
})->add(responds(MaterialUsage::class));
