<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

// ---------------------------------------------------------------------------
// The signed-in reader, and how they like the site
//
//   GET /api/me            who the token names, as this site knows them
//   PUT /api/me/theme      light/dark, for the site or the admin panel
//   PUT /api/me/language   the site's reading language
//   PUT /api/me/formats    how dates and times are written
//
// Everything about the account itself - password, two-factor, Google,
// sessions - lives on the IAM's account page now. These are the preferences
// that are this site's own, so they stay here, on this site's record of the
// person. Anyone signed in may change their own; no wider rights are involved.
// ---------------------------------------------------------------------------

/** The reader as /api/me describes them. */
function siteUserPayload(array $user): array
{
    return [
        'id' => (int) $user['id'],
        'username' => $user['username'],
        'email' => $user['email'] ?? null,
        'role' => $user['role'],
        'roles' => $user['roles'] ?? [],
        'background' => $user['background'] ?? null,
        'theme_main' => $user['theme_main'],
        'theme_admin' => $user['theme_admin'],
        'language' => $user['language'],
        // Null means "however this device writes them" - see migration 029.
        'date_format' => $user['date_format'] ?? null,
        'time_format' => $user['time_format'] ?? null,
        'version' => $user['version'] ?? null,
        'created_at' => $user['created_at'] ?? null,
    ];
}

/** This site's record again after a write, with the token's role still on it. */
function siteUserReload(array $user): array
{
    $statement = usersDb()->prepare('SELECT * FROM users WHERE id = ?');
    $statement->execute([(int) $user['id']]);

    // array_replace: the token's role wins over any `role` column (see siteUserFromClaims()).
    return array_replace($statement->fetch() ?: [], ['role' => $user['role'], 'roles' => $user['roles'] ?? []]);
}

$app->get('/api/me', function (Request $request, Response $response) {
    return respondJson($response, siteUserPayload($request->getAttribute('user')));
})->add(responds(SiteUser::class))->add(requireAuth());

// One row per area: the site and the admin panel are remembered separately.
$app->put('/api/me/theme', function (Request $request, Response $response) {
    $body = $request->getParsedBody() ?? [];
    $area = $body['area'] ?? '';
    $theme = $body['theme'] ?? '';

    $columns = ['main' => 'theme_main', 'admin' => 'theme_admin'];
    if (!isset($columns[$area])) {
        return respondJson($response, ['error' => "Unknown area '$area'"], 400);
    }
    if (!in_array($theme, ['light', 'dark', 'auto'], true)) {
        return respondJson($response, ['error' => "Unknown theme '$theme'"], 400);
    }

    usersDb()->prepare("UPDATE users SET {$columns[$area]} = ? WHERE id = ?")
        ->execute([$theme, $request->getAttribute('user')['id']]);

    return respondJson($response, ['area' => $area, 'theme' => $theme]);
})->add(responds(ThemeChanged::class))->add(requireAuth());

// The site only. The admin panel is English, so there is nothing to remember
// for it.
$app->put('/api/me/language', function (Request $request, Response $response) {
    $body = $request->getParsedBody() ?? [];
    $code = strtolower(trim((string) ($body['language'] ?? '')));

    $pdo = usersDb();
    $language = DbQuery::from($pdo, 'languages')->find(['code' => $code]);

    if (!$language || !$language['enabled']) {
        return respondJson($response, ['error' => "Unknown or unavailable language '$code'"], 400);
    }

    $pdo->prepare('UPDATE users SET language = ? WHERE id = ?')->execute([$code, $request->getAttribute('user')['id']]);

    return respondJson($response, ['language' => $code]);
})->add(responds(LanguageChanged::class))->add(requireAuth());

// 1.3.2026 and 03/01/2026 are the same day written by two people who would
// each misread the other, so there is no single right answer to bake in. The
// device's own setting is the default and null is how that is stored. These
// columns are for the reader whose device disagrees with them.
$app->put('/api/me/formats', function (Request $request, Response $response) {
    $body = $request->getParsedBody() ?? [];
    $user = $request->getAttribute('user');
    $pdo = usersDb();

    // A short list rather than a format string: a free-typed pattern is a way
    // to produce a date nobody can read.
    $allowed = ['date_format' => ['dmy_dot', 'dmy_slash', 'mdy_slash', 'ymd_dash'], 'time_format' => ['24', '12']];

    foreach ($allowed as $column => $values) {
        // Absent leaves the setting alone; null clears it back to the device.
        if (!array_key_exists($column, $body)) {
            continue;
        }

        $value = $body[$column];
        $value = ($value === null || $value === '' || $value === 'auto') ? null : (string) $value;

        if ($value !== null && !in_array($value, $values, true)) {
            return respondJson($response, ['error' => "Unknown value '$value' for $column"], 400);
        }

        $pdo->prepare("UPDATE users SET $column = ? WHERE id = ?")->execute([$value, $user['id']]);
    }

    return respondJson($response, siteUserPayload(siteUserReload($user)));
})->add(responds(SiteUser::class))->add(requireAuth());
