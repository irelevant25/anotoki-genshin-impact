<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * Voice-over sets - the wrapper several characters can share one set of lines
 * through (the Traveler's variants). Read-only: sets are made and pointed at by
 * the character form, not managed here.
 *
 *   GET /api/voice-over-sets        every set, with the characters on it and how
 *                                   many lines it holds - the picker's list
 *   GET /api/voice-over-sets/{id}   one set's voice-over lines, to preview it
 */

$app->get('/api/voice-over-sets', function (Request $request, Response $response) {
    $pdo = genshinDb();

    $sets = $pdo->query(
        'SELECT s.id, count(vo.id) FILTER (WHERE vo.deleted = FALSE) AS voice_over_count
           FROM characters_voice_overs_sets s
           LEFT JOIN characters_voice_overs vo ON vo.voice_over_set_id = s.id
          GROUP BY s.id
          ORDER BY s.id'
    )->fetchAll(PDO::FETCH_ASSOC);

    // The characters on each set, gathered in one pass - a set is identified by
    // who points at it, since the table itself is only an id.
    $members = [];
    foreach ($pdo->query('SELECT id, name, voice_over_set_id FROM characters WHERE voice_over_set_id IS NOT NULL AND deleted = FALSE ORDER BY name') as $c) {
        $members[(int) $c['voice_over_set_id']][] = ['id' => (int) $c['id'], 'name' => $c['name']];
    }

    $out = array_map(fn(array $s) => [
        'id' => (int) $s['id'],
        'voice_over_count' => (int) $s['voice_over_count'],
        'characters' => $members[(int) $s['id']] ?? [],
    ], $sets);

    return respondJson($response, $out);
})->add(responds(VoiceOverSet::class, list: true))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

$app->get('/api/voice-over-sets/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();

    $stmt = $pdo->prepare('SELECT * FROM characters_voice_overs WHERE voice_over_set_id = ? AND deleted = FALSE ORDER BY id ASC');
    $stmt->execute([(int) $args['id']]);
    $rows = $stmt->fetchAll();
    resolveAssetRows($pdo, 'characters_voice_overs', $rows);

    return respondJson($response, $rows);
})->add(responds('characters_voice_overs', list: true))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());
