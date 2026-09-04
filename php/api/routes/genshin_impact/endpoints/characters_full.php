<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

// ── File-saving helpers ───────────────────────────────────────────────────────

/**
 * Saves an icon/image file named after the character.
 * Returns the public path or null on failure.
 */
function _saveCharacterFile($file, string $folder, string $baseName): ?string
{
    // Extension allowlist and script-execution hardening live in full_resource.php.
    return _fullSaveUpload($file, $folder, $baseName);
}

/**
 * Saves an audio file keeping its original client filename.
 * Returns the public path or null on failure.
 */
function _saveAudioFile($file, string $folder): ?string
{
    if (!$file || $file->getError() !== UPLOAD_ERR_OK) {
        return null;
    }
    // Keep the original name, but rebuild it from a checked extension rather
    // than trusting whatever the client sent.
    $clientName = $file->getClientFilename() ?? '';
    $stem = preg_replace('/[^a-zA-Z0-9_-]/', '_', pathinfo($clientName, PATHINFO_FILENAME));
    return _fullSaveUpload($file, $folder, $stem);
}

/**
 * Applies uploaded files onto the parsed body data.
 * Character icons are named after the character; audio files keep their original name.
 */
function _applyUploads(array &$body, array $uploadedFiles): void
{
    $charName = preg_replace('/[^a-zA-Z0-9]/', '_', trim($body['character']['name'] ?? 'character'));

    // Character-level icons: fileKey => [field, folder, baseName]
    $charIconMap = [
        'char_icon' => ['icon', 'characters', $charName],
        'char_card_icon' => ['card_icon', 'characters/card', $charName],
        'char_card_icon_2' => ['card_icon_2', 'characters/card', $charName . '_2'],
        'char_wish_icon' => ['wish_icon', 'characters/wish', $charName],
        'char_ingame_icon' => ['ingame_icon', 'characters/ingame', $charName],
        'char_ingame_icon_2' => ['ingame_icon_2', 'characters/ingame', $charName . '_2'],
        'char_namecard_icon' => ['namecard_icon', 'namecards', $charName],
        'char_namecard_background' => ['namecard_background', 'namecards', $charName . '_bg'],
        'char_namecard_banner' => ['namecard_banner', 'namecards', $charName . '_banner'],
    ];
    foreach ($charIconMap as $fileKey => [$field, $folder, $name]) {
        if (!empty($uploadedFiles[$fileKey])) {
            $path = _saveCharacterFile($uploadedFiles[$fileKey], $folder, $name);
            if ($path)
                $body['character'][$field] = $path;
        }
    }

    // Voice over audio - per-language files
    foreach ($body['voice_overs'] ?? [] as $i => &$vo) {
        foreach (['english', 'japanese', 'chinese', 'korean'] as $lang) {
            $key = "vo_audio_{$i}_{$lang}";
            if (!empty($uploadedFiles[$key])) {
                $path = _saveAudioFile($uploadedFiles[$key], 'voice-overs');
                if ($path)
                    $vo["audio_{$lang}"] = $path;
            }
        }
    }
    unset($vo);

    // Constellation icons - named {CharName}_C{level}
    foreach ($body['constellations'] ?? [] as $i => &$co) {
        if (!empty($uploadedFiles["co_icon_$i"])) {
            $level = $co['level'] ?? ($i + 1);
            $path = _saveCharacterFile($uploadedFiles["co_icon_$i"], 'constellations', $charName . '_C' . $level);
            if ($path)
                $co['icon'] = $path;
        }
    }
    unset($co);

    // Talent icons - named {CharName}_{TalentType}
    foreach ($body['talents'] ?? [] as $i => &$ta) {
        if (!empty($uploadedFiles["ta_icon_$i"])) {
            $type = preg_replace('/[^a-zA-Z0-9]/', '_', $ta['type'] ?? ('talent_' . $i));
            $path = _saveCharacterFile($uploadedFiles["ta_icon_$i"], 'talents', $charName . '_' . $type);
            if ($path)
                $ta['icon'] = $path;
        }
    }
    unset($ta);
}

/**
 * Parses the request body - supports multipart (data field contains JSON)
 * and plain JSON bodies.
 */
function _parseBody(Request $request): array
{
    $parsed = $request->getParsedBody() ?? [];
    if (is_array($parsed) && isset($parsed['data'])) {
        return json_decode($parsed['data'], true) ?? [];
    }
    return is_array($parsed) ? $parsed : [];
}

// ── POST /api/characters/full ─────────────────────────────────────────────────

$app->post('/api/characters/full', function (Request $request, Response $response) {
    $user = $request->getAttribute('user');
    $pdo = genshinDb();
    $body = _parseBody($request);

    if (empty($body['character'])) {
        return respondJson($response, ['error' => 'Missing character data'], 400);
    }

    // Apply uploaded files (icon naming + audio naming)
    _applyUploads($body, $request->getUploadedFiles());

    resolveAssetBody($pdo, 'characters', $body['character'], $user['id']);

    $pdo->beginTransaction();
    try {
        // 1. Character
        $charId = DbQuery::insert($pdo, 'characters', [
            ...Character::fromBody($body['character'])->toDbArray(),
            'created_by' => $user['id'],
        ]);

        // 2. Voice overs
        foreach ($body['voice_overs'] ?? [] as $vo) {
            $vo = [...$vo, 'character_id' => $charId];
            resolveAssetBody($pdo, 'characters_voice_overs', $vo, $user['id']);
            DbQuery::insert($pdo, 'characters_voice_overs', [
                ...CharacterVoiceOver::fromBody($vo)->toDbArray(),
                'created_by' => $user['id'],
            ]);
        }

        // 3. Constellations
        foreach ($body['constellations'] ?? [] as $c) {
            $c = [...$c, 'character_id' => $charId];
            resolveAssetBody($pdo, 'characters_constellations', $c, $user['id']);
            DbQuery::insert($pdo, 'characters_constellations', [
                ...CharacterConstellation::fromBody($c)->toDbArray(),
                'created_by' => $user['id'],
            ]);
        }

        // 4. Ascensions (with costs)
        foreach ($body['ascensions'] ?? [] as $a) {
            $ascId = DbQuery::insert($pdo, 'characters_ascensions', [
                ...CharacterAscension::fromBody([...$a, 'character_id' => $charId])->toDbArray(),
                'created_by' => $user['id'],
            ]);
            foreach ($a['costs'] ?? [] as $cost) {
                DbQuery::insert($pdo, 'characters_ascensions_cost', [
                    ...CharacterAscensionCost::fromBody([...$cost, 'character_ascension_id' => $ascId])->toDbArray(),
                    'created_by' => $user['id'],
                ]);
            }
        }

        // 5. Talents
        foreach ($body['talents'] ?? [] as $t) {
            $t = [...$t, 'character_id' => $charId];
            resolveAssetBody($pdo, 'characters_talents', $t, $user['id']);
            DbQuery::insert($pdo, 'characters_talents', [
                ...CharacterTalent::fromBody($t)->toDbArray(),
                'created_by' => $user['id'],
            ]);
        }

        // 6. Talent costs
        foreach ($body['talent_costs'] ?? [] as $cost) {
            DbQuery::insert($pdo, 'characters_talents_cost', [
                ...CharacterTalentCost::fromBody([...$cost, 'character_id' => $charId])->toDbArray(),
                'created_by' => $user['id'],
            ]);
        }

        // 6. Relationships
        foreach ($body['relationships'] ?? [] as $r) {
            DbQuery::insert($pdo, 'characters_relationships', [
                ...CharacterRelationship::fromBody([...$r, 'character_id' => $charId])->toDbArray(),
                'created_by' => $user['id'],
            ]);
        }

        // 7. Roles
        foreach ($body['roles'] ?? [] as $roleName) {
            $pdo->prepare('INSERT INTO characters_roles (character_id, role_name, created_by) VALUES (?, ?, ?)')
                ->execute([$charId, $roleName, $user['id']]);
        }

        $pdo->commit();
    } catch (\Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }

    $character = DbQuery::from($pdo, 'characters')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->find(['id' => $charId]);

    return respondJson($response, $character, 201);
})->add(responds('characters'))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());


// ── PUT /api/characters/{id}/full ─────────────────────────────────────────────

$app->put('/api/characters/{id:[0-9]+}/full', function (Request $request, Response $response, array $args) {
    $user = $request->getAttribute('user');
    $pdo = genshinDb();
    $id = (int) $args['id'];
    $body = _parseBody($request);

    if (!DbQuery::from($pdo, 'characters')->find(['id' => $id])) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    // Apply uploaded files
    _applyUploads($body, $request->getUploadedFiles());

    if (!empty($body['character'])) {
        resolveAssetBody($pdo, 'characters', $body['character'], $user['id']);
    }

    $pdo->beginTransaction();
    try {
        // 1. Update character base data
        if (!empty($body['character'])) {
            DbQuery::update($pdo, 'characters', [
                ...Character::partialToDbArray($body['character']),
                'updated_by' => $user['id'],
            ], $id);
        }

        // Helper: soft-delete + re-insert (for resources without nested costs)
        $syncSubResource = function (string $table, string $fkCol, array $items, string $modelClass) use ($pdo, $id, $user) {
            $pdo->prepare("UPDATE $table SET deleted = TRUE WHERE $fkCol = ? AND deleted = FALSE")
                ->execute([$id]);
            foreach ($items as $item) {
                $item = [...$item, $fkCol => $id];
                resolveAssetBody($pdo, $table, $item, $user['id']);
                DbQuery::insert($pdo, $table, [
                    ...$modelClass::fromBody($item)->toDbArray(),
                    'created_by' => $user['id'],
                ]);
            }
        };

        if (isset($body['voice_overs'])) {
            $syncSubResource('characters_voice_overs', 'character_id', $body['voice_overs'], CharacterVoiceOver::class);
        }
        if (isset($body['constellations'])) {
            $syncSubResource('characters_constellations', 'character_id', $body['constellations'], CharacterConstellation::class);
        }
        if (isset($body['relationships'])) {
            $syncSubResource('characters_relationships', 'character_id', $body['relationships'], CharacterRelationship::class);
        }

        // Ascensions: sync with nested costs
        if (isset($body['ascensions'])) {
            $stmt = $pdo->prepare('SELECT id FROM characters_ascensions WHERE character_id = ? AND deleted = FALSE');
            $stmt->execute([$id]);
            $existingAscIds = array_column($stmt->fetchAll(), 'id');
            if (!empty($existingAscIds)) {
                $ph = implode(',', array_fill(0, count($existingAscIds), '?'));
                $pdo->prepare("UPDATE characters_ascensions_cost SET deleted = TRUE WHERE character_ascension_id IN ($ph) AND deleted = FALSE")
                    ->execute($existingAscIds);
            }
            $pdo->prepare('UPDATE characters_ascensions SET deleted = TRUE WHERE character_id = ? AND deleted = FALSE')
                ->execute([$id]);
            foreach ($body['ascensions'] as $a) {
                $ascId = DbQuery::insert($pdo, 'characters_ascensions', [
                    ...CharacterAscension::fromBody([...$a, 'character_id' => $id])->toDbArray(),
                    'created_by' => $user['id'],
                ]);
                foreach ($a['costs'] ?? [] as $cost) {
                    DbQuery::insert($pdo, 'characters_ascensions_cost', [
                        ...CharacterAscensionCost::fromBody([...$cost, 'character_ascension_id' => $ascId])->toDbArray(),
                        'created_by' => $user['id'],
                    ]);
                }
            }
        }

        // Talents: soft-delete and re-insert
        if (isset($body['talents'])) {
            $pdo->prepare('UPDATE characters_talents SET deleted = TRUE WHERE character_id = ? AND deleted = FALSE')
                ->execute([$id]);
            foreach ($body['talents'] as $t) {
                $t = [...$t, 'character_id' => $id];
                resolveAssetBody($pdo, 'characters_talents', $t, $user['id']);
                DbQuery::insert($pdo, 'characters_talents', [
                    ...CharacterTalent::fromBody($t)->toDbArray(),
                    'created_by' => $user['id'],
                ]);
            }
        }

        // Talent costs: soft-delete and re-insert
        if (isset($body['talent_costs'])) {
            $pdo->prepare('UPDATE characters_talents_cost SET deleted = TRUE WHERE character_id = ? AND deleted = FALSE')
                ->execute([$id]);
            foreach ($body['talent_costs'] as $cost) {
                DbQuery::insert($pdo, 'characters_talents_cost', [
                    ...CharacterTalentCost::fromBody([...$cost, 'character_id' => $id])->toDbArray(),
                    'created_by' => $user['id'],
                ]);
            }
        }

        // Roles: delete and re-insert
        if (isset($body['roles'])) {
            $pdo->prepare('DELETE FROM characters_roles WHERE character_id = ?')->execute([$id]);
            foreach ($body['roles'] as $roleName) {
                $pdo->prepare('INSERT INTO characters_roles (character_id, role_name, created_by) VALUES (?, ?, ?)')
                    ->execute([$id, $roleName, $user['id']]);
            }
        }

        $pdo->commit();
    } catch (\Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }

    $character = DbQuery::from($pdo, 'characters')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->includeExternal('updated_by', usersDb(), 'users', ['id', 'username'])
        ->find(['id' => $id]);

    return respondJson($response, $character);
})->add(responds('characters'))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());


// ── GET /api/characters/{id}/full ─────────────────────────────────────────────

$app->get('/api/characters/{id:[0-9]+}/full', function (Request $request, Response $response, array $args) {
    $pdo = genshinDb();
    $id = (int) $args['id'];

    $character = DbQuery::from($pdo, 'characters')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->includeExternal('updated_by', usersDb(), 'users', ['id', 'username'])
        ->find(['id' => $id]);

    if (!$character) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    $fetch = function (string $table, string $fkCol, array $ids) use ($pdo): array {
        if (empty($ids))
            return [];
        $ph = implode(',', array_fill(0, count($ids), '?'));
        $stmt = $pdo->prepare("SELECT * FROM $table WHERE $fkCol IN ($ph) AND deleted = FALSE ORDER BY id ASC");
        $stmt->execute($ids);
        $rows = $stmt->fetchAll();
        // Raw SQL, so DbQuery's own resolve step never runs on it - a no-op
        // for talent_cost, ascension_cost and the rest with nothing configured.
        resolveAssetRows($pdo, $table, $rows);
        return $rows;
    };

    $voice_overs = $fetch('characters_voice_overs', 'character_id', [$id]);
    $constellations = $fetch('characters_constellations', 'character_id', [$id]);
    $relationships = $fetch('characters_relationships', 'character_id', [$id]);
    $talents = $fetch('characters_talents', 'character_id', [$id]);
    $talentCost = $fetch('characters_talents_cost', 'character_id', [$id]);
    $ascensions = $fetch('characters_ascensions', 'character_id', [$id]);
    $ascensionCost = $fetch('characters_ascensions_cost', 'character_ascension_id', array_column($ascensions, 'id'));

    $rolesStmt = $pdo->prepare('SELECT role_name FROM characters_roles WHERE character_id = ?');
    $rolesStmt->execute([$id]);
    $roles = array_column($rolesStmt->fetchAll(), 'role_name');

    return respondJson($response, [
        'character' => $character,
        'voice_overs' => $voice_overs,
        'constellations' => $constellations,
        'relationships' => $relationships,
        'talents' => $talents,
        'talent_cost' => $talentCost,
        'ascensions' => $ascensions,
        'ascension_cost' => $ascensionCost,
        'roles' => $roles,
    ]);
})->add(responds(CharacterFull::class));
