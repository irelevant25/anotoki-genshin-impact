<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * The site's own text, in one language, as a flat map.
 *
 * Two things are merged here. English goes underneath so a half-translated
 * language still renders a complete page - a missing string falls back rather
 * than showing a raw key. And only this site's keys are included: the shared
 * ones plus the ones scoped to it, never another site's. Doing both here
 * rather than in the browser keeps the client to one request and one path.
 */
function translationBundle(PDO $pdo, string $code): array
{
    $stmt = $pdo->prepare(
        "SELECT t.key_name, t.value
         FROM translations t
         JOIN translation_keys k ON k.name = t.key_name
         WHERE t.language_code IN (?, ?)
           AND k.site IN ('common', ?)
         ORDER BY CASE WHEN t.language_code = ? THEN 0 ELSE 1 END"
    );
    // Fallback first, then the requested language overwrites it.
    $stmt->execute([FALLBACK_LANGUAGE, $code, currentSite(), FALLBACK_LANGUAGE]);

    $bundle = [];
    foreach ($stmt as $row) {
        $bundle[$row['key_name']] = $row['value'];
    }
    return $bundle;
}

// ---------------------------------------------------------------------------
// GET /api/translations/{code}  — what the site loads at startup
//
// Public: the text is on the page anyway, and it has to be fetchable before
// anyone signs in. Tagged so a reload costs a 304 rather than the whole
// bundle, since this is on the critical path of every first paint.
// ---------------------------------------------------------------------------
$app->get('/api/translations/{code}', function (Request $request, Response $response, array $args) {
    $pdo  = usersDb();
    $code = strtolower($args['code']);

    $language = DbQuery::from($pdo, 'languages')->find(['code' => $code]);
    if (!$language || !$language['enabled']) {
        // Not an error worth failing a page load over: an unknown or retired
        // language reads in the fallback rather than not at all.
        $code = FALLBACK_LANGUAGE;
    }

    $bundle = translationBundle($pdo, $code);
    $body   = json_encode(['language' => $code, 'values' => $bundle]);
    $etag   = '"' . md5($body) . '"';

    if (trim($request->getHeaderLine('If-None-Match')) === $etag) {
        return $response->withStatus(304)->withHeader('ETag', $etag);
    }

    $response->getBody()->write($body);
    return $response
        ->withHeader('Content-Type', 'application/json')
        ->withHeader('ETag', $etag)
        ->withHeader('Cache-Control', 'no-cache');
});

// ---------------------------------------------------------------------------
// GET /api/translations/{code}/export  — one language, on its own
//
// No fallback merged in, so what comes out is what that language actually
// holds. Edit it in a text editor and post it back to /import.
// ---------------------------------------------------------------------------
$app->get('/api/translations/{code}/export', function (Request $request, Response $response, array $args) {
    $pdo  = usersDb();
    $code = strtolower($args['code']);

    if (!DbQuery::from($pdo, 'languages')->find(['code' => $code])) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    $stmt = $pdo->prepare('SELECT key_name, value FROM translations WHERE language_code = ? ORDER BY key_name ASC');
    $stmt->execute([$code]);

    $values = [];
    foreach ($stmt as $row) {
        $values[$row['key_name']] = $row['value'];
    }

    return respondJson($response, $values);
})->add(requireRole('ADMIN', 'EDITOR'))->add(requireAuth());

// ---------------------------------------------------------------------------
// GET /api/admin/translations  — every key against every language
//
// This is the editing grid, so it deliberately includes keys nothing has
// translated yet: those are the rows that need attention.
// ---------------------------------------------------------------------------
$app->get('/api/admin/translations', function (Request $request, Response $response) {
    $pdo = usersDb();

    $languages = $pdo->query(
        'SELECT code, name, native_name, enabled, sort_order FROM languages ORDER BY sort_order ASC, name ASC'
    )->fetchAll();
    foreach ($languages as &$language) {
        $language['enabled']    = (bool) $language['enabled'];
        $language['sort_order'] = (int) $language['sort_order'];
    }
    unset($language);

    $values = [];
    foreach ($pdo->query('SELECT key_name, language_code, value FROM translations') as $row) {
        $values[$row['key_name']][$row['language_code']] = $row['value'];
    }

    $keys = [];
    foreach ($pdo->query('SELECT name, description, site FROM translation_keys ORDER BY site ASC, name ASC') as $row) {
        $keys[] = [
            'name'        => $row['name'],
            'description' => $row['description'],
            'site'        => $row['site'],
            'values'      => (object) ($values[$row['name']] ?? []),
        ];
    }

    $sites = $pdo->query('SELECT code, name FROM sites ORDER BY sort_order ASC, name ASC')->fetchAll();

    return respondJson($response, [
        'languages'   => $languages,
        'keys'        => $keys,
        'sites'       => $sites,
        // Which site this deployment serves, so the editor can default to it
        // and show at a glance what its own visitors will actually see.
        'currentSite' => currentSite(),
    ]);
})->add(requireRole('ADMIN', 'EDITOR'))->add(requireAuth());

// ---------------------------------------------------------------------------
// PUT /api/admin/translations  — save whatever the grid changed
//
// Body: { "values": { "some.key": { "en": "Text", "sk": "" } } }
//
// A blank value deletes the row rather than storing an empty string, so a
// cleared box reads as "not translated" and falls back, instead of rendering
// as nothing at all.
// ---------------------------------------------------------------------------
$app->put('/api/admin/translations', function (Request $request, Response $response) {
    $pdo   = usersDb();
    $body  = $request->getParsedBody() ?? [];
    $input = $body['values'] ?? null;

    if (!is_array($input)) {
        return respondJson($response, ['error' => 'values must be an object of key => { languageCode: text }'], 422);
    }

    $knownKeys      = $pdo->query('SELECT name FROM translation_keys')->fetchAll(PDO::FETCH_COLUMN);
    $knownLanguages = $pdo->query('SELECT code FROM languages')->fetchAll(PDO::FETCH_COLUMN);

    // Check the whole payload before writing any of it: a half-applied save
    // would leave the grid disagreeing with the database.
    $errors = [];
    foreach ($input as $key => $byLanguage) {
        if (!in_array($key, $knownKeys, true)) {
            $errors[] = "unknown key '$key'";
            continue;
        }
        if (!is_array($byLanguage)) {
            $errors[] = "'$key' must map language codes to text";
            continue;
        }
        foreach (array_keys($byLanguage) as $code) {
            if (!in_array($code, $knownLanguages, true)) {
                $errors[] = "unknown language '$code' on '$key'";
            }
        }
    }
    if ($errors) {
        return respondJson($response, ['errors' => $errors], 422);
    }

    $upsert = $pdo->prepare(
        'INSERT INTO translations (key_name, language_code, value) VALUES (?, ?, ?)
         ON CONFLICT (key_name, language_code) DO UPDATE SET value = EXCLUDED.value'
    );
    $delete = $pdo->prepare('DELETE FROM translations WHERE key_name = ? AND language_code = ?');

    $written = 0;
    $cleared = 0;
    $pdo->beginTransaction();
    try {
        foreach ($input as $key => $byLanguage) {
            foreach ($byLanguage as $code => $value) {
                if ($value === null || trim((string) $value) === '') {
                    $delete->execute([$key, $code]);
                    $cleared += $delete->rowCount();
                    continue;
                }
                $upsert->execute([$key, $code, (string) $value]);
                $written++;
            }
        }
        $pdo->commit();
    } catch (\Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }

    return respondJson($response, ['written' => $written, 'cleared' => $cleared]);
})->add(requireRole('ADMIN', 'EDITOR'))->add(requireAuth());

// ---------------------------------------------------------------------------
// PUT /api/translations/{code}/import  — a whole language from a JSON file
//
// Body: { "values": { "some.key": "Text" }, "create_missing_keys": false }
//
// Keys the site does not know about are reported rather than silently
// dropped, because a typo in an exported file otherwise looks like a save
// that worked.
// ---------------------------------------------------------------------------
$app->put('/api/translations/{code}/import', function (Request $request, Response $response, array $args) {
    $pdo  = usersDb();
    $code = strtolower($args['code']);
    $body = $request->getParsedBody() ?? [];

    if (!DbQuery::from($pdo, 'languages')->find(['code' => $code])) {
        return respondJson($response, ['error' => "Unknown language '$code'"], 404);
    }

    $values = $body['values'] ?? null;
    if (!is_array($values)) {
        return respondJson($response, ['error' => 'values must be an object of key => text'], 422);
    }

    $createMissing = (bool) ($body['create_missing_keys'] ?? false);
    $knownKeys     = $pdo->query('SELECT name FROM translation_keys')->fetchAll(PDO::FETCH_COLUMN);

    $unknown = array_values(array_diff(array_keys($values), $knownKeys));
    if ($unknown && !$createMissing) {
        return respondJson($response, [
            'error'   => 'The file contains keys the site does not have. Re-send with create_missing_keys to add them.',
            'unknown' => $unknown,
        ], 422);
    }

    $addKey = $pdo->prepare('INSERT INTO translation_keys (name) VALUES (?) ON CONFLICT (name) DO NOTHING');
    $upsert = $pdo->prepare(
        'INSERT INTO translations (key_name, language_code, value) VALUES (?, ?, ?)
         ON CONFLICT (key_name, language_code) DO UPDATE SET value = EXCLUDED.value'
    );
    $delete = $pdo->prepare('DELETE FROM translations WHERE key_name = ? AND language_code = ?');

    $written = 0;
    $cleared = 0;
    $pdo->beginTransaction();
    try {
        foreach ($unknown as $key) {
            $addKey->execute([$key]);
        }
        foreach ($values as $key => $value) {
            if ($value === null || trim((string) $value) === '') {
                $delete->execute([$key, $code]);
                $cleared += $delete->rowCount();
                continue;
            }
            $upsert->execute([$key, $code, (string) $value]);
            $written++;
        }
        $pdo->commit();
    } catch (\Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }

    return respondJson($response, [
        'written'      => $written,
        'cleared'      => $cleared,
        'keys_created' => $createMissing ? count($unknown) : 0,
    ]);
})->add(requireRole('ADMIN', 'EDITOR'))->add(requireAuth());

// ---------------------------------------------------------------------------
// POST /api/translation-keys
// ---------------------------------------------------------------------------
$app->post('/api/translation-keys', function (Request $request, Response $response) {
    $pdo  = usersDb();
    $body = $request->getParsedBody();
    $name = trim((string) $body['name']);

    if (!preg_match('/^[A-Za-z0-9][A-Za-z0-9._-]*$/', $name)) {
        return respondJson($response, ['error' => "'$name' is not a usable key - use letters, digits, dots, dashes and underscores"], 422);
    }
    if (DbQuery::from($pdo, 'translation_keys')->find(['name' => $name])) {
        return respondJson($response, ['error' => "Key '$name' already exists"], 409);
    }

    // Shared unless told otherwise: most strings are chrome, and a key that
    // should have been shared is a much cheaper mistake to notice than one
    // scoped to a site nobody is looking at.
    $site = $body['site'] ?? 'common';
    if (!DbQuery::from($pdo, 'sites')->find(['code' => $site])) {
        return respondJson($response, ['error' => "Unknown site '$site'"], 422);
    }

    $pdo->prepare('INSERT INTO translation_keys (name, description, site) VALUES (?, ?, ?)')
        ->execute([$name, $body['description'] ?? null, $site]);

    $stmt = $pdo->prepare('SELECT name, description, site FROM translation_keys WHERE name = ?');
    $stmt->execute([$name]);
    return respondJson($response, $stmt->fetch(), 201);
})->add(validateRequest(User\TranslationKey::class))->add(requireRole('ADMIN', 'EDITOR'))->add(requireAuth());

// ---------------------------------------------------------------------------
// PUT /api/translation-keys/{name}  — edit the note explaining where it appears
// ---------------------------------------------------------------------------
$app->put('/api/translation-keys/{name}', function (Request $request, Response $response, array $args) {
    $pdo  = usersDb();
    $body = $request->getParsedBody();

    if (!DbQuery::from($pdo, 'translation_keys')->find(['name' => $args['name']])) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    if (array_key_exists('site', $body)) {
        if (!DbQuery::from($pdo, 'sites')->find(['code' => $body['site']])) {
            return respondJson($response, ['error' => "Unknown site '{$body['site']}'"], 422);
        }
        $pdo->prepare('UPDATE translation_keys SET site = ? WHERE name = ?')
            ->execute([$body['site'], $args['name']]);
    }

    if (array_key_exists('description', $body)) {
        $pdo->prepare('UPDATE translation_keys SET description = ? WHERE name = ?')
            ->execute([$body['description'], $args['name']]);
    }

    $stmt = $pdo->prepare('SELECT name, description, site FROM translation_keys WHERE name = ?');
    $stmt->execute([$args['name']]);
    return respondJson($response, $stmt->fetch());
})->add(validateRequest(User\TranslationKey::class, true))->add(requireRole('ADMIN', 'EDITOR'))->add(requireAuth());

// ---------------------------------------------------------------------------
// DELETE /api/translation-keys/{name}  — and every translation of it
// ---------------------------------------------------------------------------
$app->delete('/api/translation-keys/{name}', function (Request $request, Response $response, array $args) {
    $pdo = usersDb();

    if (!DbQuery::from($pdo, 'translation_keys')->find(['name' => $args['name']])) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    $stmt = $pdo->prepare('SELECT count(*) FROM translations WHERE key_name = ?');
    $stmt->execute([$args['name']]);
    $translations = (int) $stmt->fetchColumn();

    // The foreign key cascades, so this clears the translations with it.
    $pdo->prepare('DELETE FROM translation_keys WHERE name = ?')->execute([$args['name']]);

    return respondJson($response, [
        'message'              => 'Deleted successfully',
        'translations_deleted' => $translations,
    ]);
})->add(requireRole('ADMIN', 'EDITOR'))->add(requireAuth());
