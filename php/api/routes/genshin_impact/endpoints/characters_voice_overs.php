<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

// GET all character voice overs
$app->get('/api/characters-voice-overs', function (Request $request, Response $response) {
    $items = DbQuery::from(genshinDb(), 'characters_voice_overs')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->includeExternal('updated_by', usersDb(), 'users', ['id', 'username'])
        ->fetchAll();
    return respondJson($response, $items);
})->add(responds('characters_voice_overs', list: true));

// GET single character voice over
$app->get('/api/characters-voice-overs/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $item = DbQuery::from(genshinDb(), 'characters_voice_overs')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->includeExternal('updated_by', usersDb(), 'users', ['id', 'username'])
        ->find(['id' => $args['id']]);
    return $item
        ? respondJson($response, $item)
        : respondJson($response, ['error' => 'Not found'], 404);
})->add(responds('characters_voice_overs'));

// POST create character voice over
$app->post('/api/characters-voice-overs', function (Request $request, Response $response) {
    $user = $request->getAttribute('user');
    $pdo = genshinDb();
    $body = $request->getParsedBody() ?? [];
    resolveAssetBody($pdo, 'characters_voice_overs', $body, $user['id']);
    $id = DbQuery::insert($pdo, 'characters_voice_overs', [
        ...CharacterVoiceOver::fromBody($body)->toDbArray(),
        'created_by' => $user['id'],
    ]);
    $result = DbQuery::from($pdo, 'characters_voice_overs')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->find(['id' => $id]);
    return respondJson($response, $result, 201);
})->add(responds('characters_voice_overs'))->add(validateRequest(CharacterVoiceOver::class))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

// PUT update character voice over
$app->put('/api/characters-voice-overs/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $user = $request->getAttribute('user');
    $pdo = genshinDb();
    if (!DbQuery::from($pdo, 'characters_voice_overs')->find(['id' => $args['id'], 'deleted' => false])) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }
    $body = $request->getParsedBody() ?? [];
    resolveAssetBody($pdo, 'characters_voice_overs', $body, $user['id']);
    DbQuery::update($pdo, 'characters_voice_overs', [
        ...CharacterVoiceOver::partialToDbArray($body),
        'updated_by' => $user['id'],
    ], $args['id']);
    $result = DbQuery::from($pdo, 'characters_voice_overs')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->includeExternal('updated_by', usersDb(), 'users', ['id', 'username'])
        ->find(['id' => $args['id']]);
    return respondJson($response, $result);
})->add(responds('characters_voice_overs'))->add(validateRequest(CharacterVoiceOver::class, true))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

// DELETE character voice over
$app->delete('/api/characters-voice-overs/{id:[0-9]+}', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();
    if (!DbQuery::from($pdo, 'characters_voice_overs')->find(['id' => $args['id'], 'deleted' => false])) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }
    DbQuery::update($pdo, 'characters_voice_overs', ['deleted' => true], $args['id']);
    return respondJson($response, ['message' => 'Deleted successfully']);
})->add(responds('characters_voice_overs'))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());
