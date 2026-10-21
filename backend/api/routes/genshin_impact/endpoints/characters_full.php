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
            if ($path) {
                $body['character'][$field] = $path;
            }
        }
    }

    // Voice over audio - per-language files
    foreach ($body['voice_overs'] ?? [] as $i => &$vo) {
        foreach (['english', 'japanese', 'chinese', 'korean'] as $lang) {
            $key = "vo_audio_{$i}_{$lang}";
            if (!empty($uploadedFiles[$key])) {
                $path = _saveAudioFile($uploadedFiles[$key], 'voice-overs');
                if ($path) {
                    $vo["audio_{$lang}"] = $path;
                }
            }
        }
    }
    unset($vo);

    // Constellation icons - named {CharName}_C{level}
    foreach ($body['constellations'] ?? [] as $i => &$co) {
        if (!empty($uploadedFiles["co_icon_$i"])) {
            $level = $co['level'] ?? $i + 1;
            $path = _saveCharacterFile($uploadedFiles["co_icon_$i"], 'constellations', $charName . '_C' . $level);
            if ($path) {
                $co['icon'] = $path;
            }
        }
    }
    unset($co);

    // Talent icons - named {CharName}_{TalentType}
    foreach ($body['talents'] ?? [] as $i => &$ta) {
        if (!empty($uploadedFiles["ta_icon_$i"])) {
            $type = preg_replace('/[^a-zA-Z0-9]/', '_', $ta['type'] ?? 'talent_' . $i);
            $path = _saveCharacterFile($uploadedFiles["ta_icon_$i"], 'talents', $charName . '_' . $type);
            if ($path) {
                $ta['icon'] = $path;
            }
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

/** A fresh, empty voice-over set. The wrapper is just an id. */
function _newVoiceOverSet(PDO $pdo): int
{
    return (int) $pdo->query('INSERT INTO characters_voice_overs_sets DEFAULT VALUES RETURNING id')->fetchColumn();
}

/** A fresh, empty ascension set. The wrapper is just an id. */
function _newAscensionSet(PDO $pdo): int
{
    return (int) $pdo->query('INSERT INTO characters_ascensions_sets DEFAULT VALUES RETURNING id')->fetchColumn();
}

/** A fresh, empty talent set. The wrapper is just an id. */
function _newTalentSet(PDO $pdo): int
{
    return (int) $pdo->query('INSERT INTO characters_talents_sets DEFAULT VALUES RETURNING id')->fetchColumn();
}

/** A fresh, empty constellation set. The wrapper is just an id. */
function _newConstellationSet(PDO $pdo): int
{
    return (int) $pdo->query('INSERT INTO characters_constellations_sets DEFAULT VALUES RETURNING id')->fetchColumn();
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
        // A character with voice-overs needs a set to hold them, unless the body
        // already names one to share. The character carries the reference, so the
        // set is made before the character row.
        if (!empty($body['voice_overs']) && empty($body['character']['voice_over_set_id'])) {
            $body['character']['voice_over_set_id'] = _newVoiceOverSet($pdo);
        }
        // Same for ascensions - a set holds them, so the Traveler's variants can share.
        if (!empty($body['ascensions']) && empty($body['character']['ascension_set_id'])) {
            $body['character']['ascension_set_id'] = _newAscensionSet($pdo);
        }
        // Talents (and their costs) share one set; constellations their own.
        if ((!empty($body['talents']) || !empty($body['talent_costs'])) && empty($body['character']['talent_set_id'])) {
            $body['character']['talent_set_id'] = _newTalentSet($pdo);
        }
        if (!empty($body['constellations']) && empty($body['character']['constellation_set_id'])) {
            $body['character']['constellation_set_id'] = _newConstellationSet($pdo);
        }

        // 1. Character
        $charId = DbQuery::insert($pdo, 'characters', [...Character::fromBody($body['character'])->toDbArray(), 'created_by' => $user['id']]);

        // Everything below is logged against the character rather than against
        // whichever child table it lands in - see api/audit_scope.php.
        auditScope('characters', (string) $charId);

        // 2. Voice overs - into the character's set, not the character itself.
        $voiceSetId = $body['character']['voice_over_set_id'] ?? null;
        foreach ($body['voice_overs'] ?? [] as $vo) {
            $vo = [...$vo, 'voice_over_set_id' => $voiceSetId];
            resolveAssetBody($pdo, 'characters_voice_overs', $vo, $user['id']);
            DbQuery::insert($pdo, 'characters_voice_overs', [...CharacterVoiceOver::fromBody($vo)->toDbArray(), 'created_by' => $user['id']]);
        }

        // 3. Constellations - into the character's set.
        $conSetId = $body['character']['constellation_set_id'] ?? null;
        foreach ($body['constellations'] ?? [] as $c) {
            $c = [...$c, 'constellation_set_id' => $conSetId];
            resolveAssetBody($pdo, 'characters_constellations', $c, $user['id']);
            DbQuery::insert($pdo, 'characters_constellations', [...CharacterConstellation::fromBody($c)->toDbArray(), 'created_by' => $user['id']]);
        }

        // 4. Ascensions (with costs) - into the character's set, not the character.
        $ascSetId = $body['character']['ascension_set_id'] ?? null;
        foreach ($body['ascensions'] ?? [] as $a) {
            $ascId = DbQuery::insert($pdo, 'characters_ascensions', [...CharacterAscension::fromBody([...$a, 'ascension_set_id' => $ascSetId])->toDbArray(), 'created_by' => $user['id']]);
            foreach ($a['costs'] ?? [] as $cost) {
                DbQuery::insert($pdo, 'characters_ascensions_cost', [...CharacterAscensionCost::fromBody([...$cost, 'character_ascension_id' => $ascId])->toDbArray(), 'created_by' => $user['id']]);
            }
        }

        // 5. Talents and 6. their costs - into the character's talent set.
        $talentSetId = $body['character']['talent_set_id'] ?? null;
        foreach ($body['talents'] ?? [] as $t) {
            $t = [...$t, 'talent_set_id' => $talentSetId];
            resolveAssetBody($pdo, 'characters_talents', $t, $user['id']);
            DbQuery::insert($pdo, 'characters_talents', [...CharacterTalent::fromBody($t)->toDbArray(), 'created_by' => $user['id']]);
        }

        foreach ($body['talent_costs'] ?? [] as $cost) {
            DbQuery::insert($pdo, 'characters_talents_cost', [...CharacterTalentCost::fromBody([...$cost, 'talent_set_id' => $talentSetId])->toDbArray(), 'created_by' => $user['id']]);
        }

        // 6. Relationships
        foreach ($body['relationships'] ?? [] as $r) {
            DbQuery::insert($pdo, 'characters_relationships', [...CharacterRelationship::fromBody([...$r, 'character_id' => $charId])->toDbArray(), 'created_by' => $user['id']]);
        }

        // 7. Roles
        foreach ($body['roles'] ?? [] as $roleName) {
            $pdo->prepare('INSERT INTO characters_roles (character_id, role_name, created_by) VALUES (?, ?, ?)')->execute([$charId, $roleName, $user['id']]);
        }

        $pdo->commit();
    } catch (\Throwable $e) {
        $pdo->rollBack();
        throw $e;
    } finally {
        auditScope(clear: true);
    }

    $character = DbQuery::from($pdo, 'characters')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->find(['id' => $charId]);

    return respondJson($response, $character, 201);
})
    ->add(responds('characters'))
    ->add(requireRole(...ROLES_CONTENT))
    ->add(requireAuth());

// ── PUT /api/characters/{id}/full ─────────────────────────────────────────────

$app->put('/api/characters/{id:[0-9]+}/full', function (Request $request, Response $response, array $args) {
    $user = $request->getAttribute('user');
    $pdo = genshinDb();
    $id = (int) $args['id'];
    $body = _parseBody($request);

    $existing = DbQuery::from($pdo, 'characters')->find(['id' => $id]);
    if (!$existing) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }
    // The sets the character was on before this save, to tell "repointed to a
    // shared set" (leave its rows) from "editing its own rows" (replace them).
    $originalVoiceSet = (int) ($existing['voice_over_set_id'] ?? 0);
    $originalAscensionSet = (int) ($existing['ascension_set_id'] ?? 0);
    $originalTalentSet = (int) ($existing['talent_set_id'] ?? 0);
    $originalConstellationSet = (int) ($existing['constellation_set_id'] ?? 0);

    // Apply uploaded files
    _applyUploads($body, $request->getUploadedFiles());

    if (!empty($body['character'])) {
        resolveAssetBody($pdo, 'characters', $body['character'], $user['id']);
    }

    $pdo->beginTransaction();
    auditScope('characters', (string) $id);
    try {
        // 1. Update character base data
        if (!empty($body['character'])) {
            DbQuery::update($pdo, 'characters', [...Character::partialToDbArray($body['character']), 'updated_by' => $user['id']], $id);
        }

        // Helper: soft-delete + re-insert (for resources without nested costs)
        $syncSubResource = function (string $table, string $fkCol, array $items, string $modelClass) use ($pdo, $id, $user) {
            $pdo->prepare("UPDATE $table SET deleted = TRUE WHERE $fkCol = ? AND deleted = FALSE")->execute([$id]);
            foreach ($items as $item) {
                $item = [...$item, $fkCol => $id];
                resolveAssetBody($pdo, $table, $item, $user['id']);
                DbQuery::insert($pdo, $table, [...$modelClass::fromBody($item)->toDbArray(), 'created_by' => $user['id']]);
            }
        };

        if (isset($body['voice_overs'])) {
            // Voice-overs hang off the character's set, not the character. Give
            // it a set if it has none yet, then replace that set's lines. This is
            // shared editing: any other character pointing at the set sees it too.
            $stmt = $pdo->prepare('SELECT voice_over_set_id FROM characters WHERE id = ?');
            $stmt->execute([$id]);
            $voiceSetId = (int) ($stmt->fetchColumn() ?: 0);

            // Moved onto a different, existing set (the "use another set" picker)?
            // Then leave that set's lines as they are - it is shared, and
            // replacing them would churn every character that points at it. Only
            // fill/replace when the set is the character's own (unchanged, or
            // just created for it).
            $repointed = $voiceSetId !== 0 && $voiceSetId !== $originalVoiceSet;

            if (!$voiceSetId && $body['voice_overs']) {
                $voiceSetId = _newVoiceOverSet($pdo);
                $pdo->prepare('UPDATE characters SET voice_over_set_id = ? WHERE id = ?')->execute([$voiceSetId, $id]);
                $repointed = false;
            }
            if ($voiceSetId && !$repointed) {
                $pdo->prepare('UPDATE characters_voice_overs SET deleted = TRUE WHERE voice_over_set_id = ? AND deleted = FALSE')->execute([$voiceSetId]);
                foreach ($body['voice_overs'] as $vo) {
                    $vo = [...$vo, 'voice_over_set_id' => $voiceSetId];
                    resolveAssetBody($pdo, 'characters_voice_overs', $vo, $user['id']);
                    DbQuery::insert($pdo, 'characters_voice_overs', [...CharacterVoiceOver::fromBody($vo)->toDbArray(), 'created_by' => $user['id']]);
                }
            }
        }
        // Constellations hang off the character's set (mirrors ascensions): give
        // it a set if it has none, then replace that set's rows - unless the
        // character was just repointed at a different, shared set.
        if (isset($body['constellations'])) {
            $stmt = $pdo->prepare('SELECT constellation_set_id FROM characters WHERE id = ?');
            $stmt->execute([$id]);
            $conSetId = (int) ($stmt->fetchColumn() ?: 0);
            $repointed = $conSetId !== 0 && $conSetId !== $originalConstellationSet;

            if (!$conSetId && $body['constellations']) {
                $conSetId = _newConstellationSet($pdo);
                $pdo->prepare('UPDATE characters SET constellation_set_id = ? WHERE id = ?')->execute([$conSetId, $id]);
                $repointed = false;
            }
            if ($conSetId && !$repointed) {
                $pdo->prepare('UPDATE characters_constellations SET deleted = TRUE WHERE constellation_set_id = ? AND deleted = FALSE')->execute([$conSetId]);
                foreach ($body['constellations'] as $c) {
                    $c = [...$c, 'constellation_set_id' => $conSetId];
                    resolveAssetBody($pdo, 'characters_constellations', $c, $user['id']);
                    DbQuery::insert($pdo, 'characters_constellations', [...CharacterConstellation::fromBody($c)->toDbArray(), 'created_by' => $user['id']]);
                }
            }
        }
        if (isset($body['relationships'])) {
            $syncSubResource('characters_relationships', 'character_id', $body['relationships'], CharacterRelationship::class);
        }

        // Ascensions hang off the character's set (with nested costs), the same
        // way voice-overs do. Give it a set if it has none, then replace that
        // set's ascensions - unless the character was just repointed at a
        // different, shared set, in which case its rows are left as they are.
        if (isset($body['ascensions'])) {
            $stmt = $pdo->prepare('SELECT ascension_set_id FROM characters WHERE id = ?');
            $stmt->execute([$id]);
            $ascSetId = (int) ($stmt->fetchColumn() ?: 0);
            $repointed = $ascSetId !== 0 && $ascSetId !== $originalAscensionSet;

            if (!$ascSetId && $body['ascensions']) {
                $ascSetId = _newAscensionSet($pdo);
                $pdo->prepare('UPDATE characters SET ascension_set_id = ? WHERE id = ?')->execute([$ascSetId, $id]);
                $repointed = false;
            }
            if ($ascSetId && !$repointed) {
                // Soft-delete the set's ascension costs first, then its ascensions.
                $stmt = $pdo->prepare('SELECT id FROM characters_ascensions WHERE ascension_set_id = ? AND deleted = FALSE');
                $stmt->execute([$ascSetId]);
                $existingAscIds = array_column($stmt->fetchAll(), 'id');
                if (!empty($existingAscIds)) {
                    $ph = implode(',', array_fill(0, count($existingAscIds), '?'));
                    $pdo->prepare("UPDATE characters_ascensions_cost SET deleted = TRUE WHERE character_ascension_id IN ($ph) AND deleted = FALSE")->execute($existingAscIds);
                }
                $pdo->prepare('UPDATE characters_ascensions SET deleted = TRUE WHERE ascension_set_id = ? AND deleted = FALSE')->execute([$ascSetId]);
                foreach ($body['ascensions'] as $a) {
                    $ascId = DbQuery::insert($pdo, 'characters_ascensions', [...CharacterAscension::fromBody([...$a, 'ascension_set_id' => $ascSetId])->toDbArray(), 'created_by' => $user['id']]);
                    foreach ($a['costs'] ?? [] as $cost) {
                        DbQuery::insert($pdo, 'characters_ascensions_cost', [
                            ...CharacterAscensionCost::fromBody([...$cost, 'character_ascension_id' => $ascId])->toDbArray(),
                            'created_by' => $user['id'],
                        ]);
                    }
                }
            }
        }

        // Talents and their costs share one set; resolve it once, then replace
        // whichever of the two the body carries - unless the character was just
        // repointed at a different, shared talent set (then leave its rows alone).
        if (isset($body['talents']) || isset($body['talent_costs'])) {
            $stmt = $pdo->prepare('SELECT talent_set_id FROM characters WHERE id = ?');
            $stmt->execute([$id]);
            $talentSetId = (int) ($stmt->fetchColumn() ?: 0);
            $repointed = $talentSetId !== 0 && $talentSetId !== $originalTalentSet;

            if (!$talentSetId && (!empty($body['talents']) || !empty($body['talent_costs']))) {
                $talentSetId = _newTalentSet($pdo);
                $pdo->prepare('UPDATE characters SET talent_set_id = ? WHERE id = ?')->execute([$talentSetId, $id]);
                $repointed = false;
            }
            if ($talentSetId && !$repointed) {
                if (isset($body['talents'])) {
                    $pdo->prepare('UPDATE characters_talents SET deleted = TRUE WHERE talent_set_id = ? AND deleted = FALSE')->execute([$talentSetId]);
                    foreach ($body['talents'] as $t) {
                        $t = [...$t, 'talent_set_id' => $talentSetId];
                        resolveAssetBody($pdo, 'characters_talents', $t, $user['id']);
                        DbQuery::insert($pdo, 'characters_talents', [...CharacterTalent::fromBody($t)->toDbArray(), 'created_by' => $user['id']]);
                    }
                }
                if (isset($body['talent_costs'])) {
                    $pdo->prepare('UPDATE characters_talents_cost SET deleted = TRUE WHERE talent_set_id = ? AND deleted = FALSE')->execute([$talentSetId]);
                    foreach ($body['talent_costs'] as $cost) {
                        DbQuery::insert($pdo, 'characters_talents_cost', [...CharacterTalentCost::fromBody([...$cost, 'talent_set_id' => $talentSetId])->toDbArray(), 'created_by' => $user['id']]);
                    }
                }
            }
        }

        // Roles: delete and re-insert
        if (isset($body['roles'])) {
            $pdo->prepare('DELETE FROM characters_roles WHERE character_id = ?')->execute([$id]);
            foreach ($body['roles'] as $roleName) {
                $pdo->prepare('INSERT INTO characters_roles (character_id, role_name, created_by) VALUES (?, ?, ?)')->execute([$id, $roleName, $user['id']]);
            }
        }

        $pdo->commit();
    } catch (\Throwable $e) {
        $pdo->rollBack();
        throw $e;
    } finally {
        auditScope(clear: true);
    }

    $character = DbQuery::from($pdo, 'characters')
        ->includeExternal('created_by', usersDb(), 'users', ['id', 'username'])
        ->includeExternal('updated_by', usersDb(), 'users', ['id', 'username'])
        ->find(['id' => $id]);

    return respondJson($response, $character);
})
    ->add(responds('characters'))
    ->add(requireRole(...ROLES_CONTENT))
    ->add(requireAuth());

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
        if (empty($ids)) {
            return [];
        }
        $ph = implode(',', array_fill(0, count($ids), '?'));
        $stmt = $pdo->prepare("SELECT * FROM $table WHERE $fkCol IN ($ph) AND deleted = FALSE ORDER BY id ASC");
        $stmt->execute($ids);
        $rows = $stmt->fetchAll();
        // Raw SQL, so DbQuery's own resolve step never runs on it - a no-op
        // for talent_cost, ascension_cost and the rest with nothing configured.
        resolveAssetRows($pdo, $table, $rows);
        return $rows;
    };

    // Voice-overs come through the character's set, so several characters can
    // share one set of lines (the Traveler's variants).
    $voiceSetId = $character['voice_over_set_id'] ?? null;
    $voice_overs = $voiceSetId ? $fetch('characters_voice_overs', 'voice_over_set_id', [$voiceSetId]) : [];
    // Constellations and talents (with their costs) come through their sets too.
    $conSetId = $character['constellation_set_id'] ?? null;
    $constellations = $conSetId ? $fetch('characters_constellations', 'constellation_set_id', [$conSetId]) : [];
    $relationships = $fetch('characters_relationships', 'character_id', [$id]);
    $talentSetId = $character['talent_set_id'] ?? null;
    $talents = $talentSetId ? $fetch('characters_talents', 'talent_set_id', [$talentSetId]) : [];
    $talentCost = $talentSetId ? $fetch('characters_talents_cost', 'talent_set_id', [$talentSetId]) : [];
    // Ascensions come through the character's set too, so the Traveler's variants
    // can share one set of ascension stats.
    $ascSetId = $character['ascension_set_id'] ?? null;
    $ascensions = $ascSetId ? $fetch('characters_ascensions', 'ascension_set_id', [$ascSetId]) : [];
    $ascensionCost = $fetch('characters_ascensions_cost', 'character_ascension_id', array_column($ascensions, 'id'));

    $rolesStmt = $pdo->prepare('SELECT role_name FROM characters_roles WHERE character_id = ?');
    $rolesStmt->execute([$id]);
    $roles = array_column($rolesStmt->fetchAll(), 'role_name');

    // The special dish is only a food's id on the character (special_dish, as
    // the admin form sets it), and the character page shows the dish itself -
    // its name, and its picture, which is filed under that name. So it comes
    // along: a live dish, or none.
    $dish = null;
    if (($character['special_dish'] ?? null) !== null) {
        $dishStmt = $pdo->prepare('SELECT id, name, rarity FROM foods WHERE id = ? AND deleted = FALSE');
        $dishStmt->execute([$character['special_dish']]);
        $row = $dishStmt->fetch(PDO::FETCH_ASSOC);
        $dish = $row === false ? null : ['id' => (int) $row['id'], 'name' => (string) $row['name'], 'rarity' => $row['rarity'] === null ? null : (int) $row['rarity']];
    }

    return respondJson($response, [
        'character' => $character,
        'dish' => $dish,
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
