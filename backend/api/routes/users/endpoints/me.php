<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

// ---------------------------------------------------------------------------
// The signed-in reader
//
//   GET /api/me            who the token names, as this site knows them
//
// Everything about the account itself - password, two-factor, Google,
// sessions - lives on the IAM's account page. So do the theme, the dates, the
// clock and the language (the IAM's migration 015, the owner's decision of
// 2026-10-06): one choice every anotoki site follows, read from the IAM's
// tokens and saved to it by the pages, never through this API. The columns
// that kept this site's own copy - users.theme_main, theme_admin, language,
// date_format and time_format - went with users/048.
//
// The address is the one the person's token carries: this site keeps no copy
// of anybody's (users/052, the owner's decision of 2026-10-07).
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
        'version' => $user['version'] ?? null,
        'created_at' => meFirstSeen($user['created_at'] ?? null),
    ];
}

/**
 * When the person first came here, as ISO 8601 in UTC ("2026-10-11T08:00:00Z"),
 * which every browser reads as the moment it is: the column is a TIMESTAMPTZ
 * since users/052, and PostgreSQL writes it in the connection's zone with an
 * offset browsers do not all read ("2026-10-11 10:00:00+02").
 */
function meFirstSeen(mixed $value): ?string
{
    if (!is_string($value) || $value === '') {
        return null;
    }
    try {
        return (new DateTimeImmutable($value))->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d\TH:i:s\Z');
    } catch (\Exception) {
        return null;
    }
}

$app->get('/api/me', function (Request $request, Response $response) {
    return respondJson($response, siteUserPayload($request->getAttribute('user')));
})
    ->add(responds(SiteUser::class))
    ->add(requireAuth());
