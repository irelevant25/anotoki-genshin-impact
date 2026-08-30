<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * The language every other language falls back to, and the one the site is
 * guaranteed to be readable in. It cannot be switched off or deleted.
 */
const FALLBACK_LANGUAGE = 'en';

/** A code has to survive being put in a URL and an Accept-Language header. */
function languageCodeIsValid(string $code): bool
{
    return (bool) preg_match('/^[a-z]{2}(-[a-z]{2})?$/', $code);
}

// ---------------------------------------------------------------------------
// GET /api/languages  — the chooser on the site
//
// Only enabled languages, so switching one off hides it without losing its
// translations. `?all=1` returns the disabled ones too, for the admin list.
// ---------------------------------------------------------------------------
$app->get('/api/languages', function (Request $request, Response $response) {
    $all = ($request->getQueryParams()['all'] ?? '') === '1';

    $sql = 'SELECT code, name, native_name, enabled, sort_order FROM languages';
    if (!$all) {
        $sql .= ' WHERE enabled = TRUE';
    }
    $sql .= ' ORDER BY sort_order ASC, name ASC';

    $rows = usersDb()->query($sql)->fetchAll();
    foreach ($rows as &$row) {
        $row['enabled']    = (bool) $row['enabled'];
        $row['sort_order'] = (int) $row['sort_order'];
    }

    return respondJson($response, $rows);
});

// ---------------------------------------------------------------------------
// POST /api/languages
// ---------------------------------------------------------------------------
$app->post('/api/languages', function (Request $request, Response $response) {
    $body = $request->getParsedBody();
    $code = strtolower(trim((string) $body['code']));

    if (!languageCodeIsValid($code)) {
        return respondJson($response, ['error' => "'$code' is not a language code - expected something like 'en' or 'pt-br'"], 422);
    }

    $pdo = usersDb();
    if (DbQuery::from($pdo, 'languages')->find(['code' => $code])) {
        return respondJson($response, ['error' => "Language '$code' already exists"], 409);
    }
    if (DbQuery::from($pdo, 'languages')->find(['name' => $body['name']])) {
        return respondJson($response, ['error' => "A language named '{$body['name']}' already exists"], 409);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO languages (code, name, native_name, enabled, sort_order) VALUES (?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $code,
        $body['name'],
        $body['native_name'],
        $body['enabled'] ?? true,
        // New languages sort to the end rather than fighting over first place.
        $body['sort_order'] ?? (int) $pdo->query('SELECT COALESCE(MAX(sort_order), 0) + 1 FROM languages')->fetchColumn(),
    ]);

    $stmt = $pdo->prepare('SELECT code, name, native_name, enabled, sort_order FROM languages WHERE code = ?');
    $stmt->execute([$code]);
    return respondJson($response, $stmt->fetch(), 201);
})->add(validateRequest(User\Language::class))->add(requireRole('ADMIN', 'EDITOR'))->add(requireAuth());

// ---------------------------------------------------------------------------
// PUT /api/languages/{code}
//
// The code itself is not editable: it is the foreign key every translation and
// every user's preference points at, and renaming it is a migration, not an
// edit. Delete and re-create instead.
// ---------------------------------------------------------------------------
$app->put('/api/languages/{code}', function (Request $request, Response $response, array $args) {
    $pdo  = usersDb();
    $code = strtolower($args['code']);
    $body = $request->getParsedBody();

    $existing = DbQuery::from($pdo, 'languages')->find(['code' => $code]);
    if (!$existing) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    $enabled = array_key_exists('enabled', $body) ? (bool) $body['enabled'] : (bool) $existing['enabled'];
    if ($code === FALLBACK_LANGUAGE && !$enabled) {
        return respondJson($response, ['error' => 'English is the fallback language and cannot be switched off'], 409);
    }

    $stmt = $pdo->prepare('UPDATE languages SET name = ?, native_name = ?, enabled = ?, sort_order = ? WHERE code = ?');
    $stmt->execute([
        $body['name']        ?? $existing['name'],
        $body['native_name'] ?? $existing['native_name'],
        $enabled,
        $body['sort_order']  ?? $existing['sort_order'],
        $code,
    ]);

    $stmt = $pdo->prepare('SELECT code, name, native_name, enabled, sort_order FROM languages WHERE code = ?');
    $stmt->execute([$code]);
    return respondJson($response, $stmt->fetch());
})->add(validateRequest(User\Language::class, true))->add(requireRole('ADMIN', 'EDITOR'))->add(requireAuth());

// ---------------------------------------------------------------------------
// DELETE /api/languages/{code}
//
// This takes the language's translations with it, so anyone still reading in
// it is moved to the fallback first rather than being left pointing at a row
// that no longer exists.
// ---------------------------------------------------------------------------
$app->delete('/api/languages/{code}', function (Request $request, Response $response, array $args) {
    $pdo  = usersDb();
    $code = strtolower($args['code']);

    if ($code === FALLBACK_LANGUAGE) {
        return respondJson($response, ['error' => 'English is the fallback language and cannot be deleted'], 409);
    }
    if (!DbQuery::from($pdo, 'languages')->find(['code' => $code])) {
        return respondJson($response, ['error' => 'Not found'], 404);
    }

    $translations = (int) $pdo->query('SELECT count(*) FROM translations WHERE language_code = ' . $pdo->quote($code))->fetchColumn();

    $pdo->beginTransaction();
    try {
        $moved = $pdo->prepare('UPDATE users SET language = ? WHERE language = ?');
        $moved->execute([FALLBACK_LANGUAGE, $code]);
        $pdo->prepare('DELETE FROM languages WHERE code = ?')->execute([$code]);
        $pdo->commit();
    } catch (\Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }

    return respondJson($response, [
        'message'              => 'Deleted successfully',
        'translations_deleted' => $translations,
        'users_moved'          => $moved->rowCount(),
    ]);
})->add(requireRole('ADMIN', 'EDITOR'))->add(requireAuth());
