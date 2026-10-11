<?php

use Anotoki\Lib\Support\JsonBody;
use Anotoki\Lib\Support\JsonResponse;
use Anotoki\Lib\Support\Refusal;
use Anotoki\Lib\Translations\ETag;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

// ---------------------------------------------------------------------------
// The guides behind the question marks (api/guides.php)
//
//   GET /api/guides/{guide}?language=sk   one guide, for the page: {guide, language, html} - in
//                                         that language where it has markup in it, English
//                                         otherwise, and `language` says which. Public, like
//                                         the strings; 404 for a guide there is not (or a
//                                         language that is no code). ETag + no-cache: a
//                                         question mark pressed again costs a 304.
//   GET /api/admin/guides                 every guide in every language, and every language
//   PUT /api/admin/guides/{guide}         {values: {language: html}}, only what changed: a
//                                         blank one goes (English never), all or nothing
//
// The admin routes are ADMIN's or EDITOR's (ROLES_CONTENT): who may reword the
// strings may reword the guides. Refusals are this API's {error, code, ...}.
// The public one is not among the paths open while the site is closed or
// requires signing in: the guides belong to the quizzes and games, which are
// not drawn then.
// ---------------------------------------------------------------------------

/** A refusal as every route here words one, never cached. */
function guideRefused(Response $response, Refusal $refusal): Response
{
    $response = translationsError($response, $refusal);

    return $refusal->status === 503 ? $response->withHeader('Retry-After', '60') : $response;
}

$app->get('/api/guides/{guide}', function (Request $request, Response $response, array $args) {
    $language = $request->getQueryParams()['language'] ?? 'en';
    $guide = guideFor(usersDb(), (string) $args['guide'], is_string($language) ? $language : '');
    if ($guide instanceof Refusal) {
        return guideRefused($response, $guide);
    }

    $body = json_encode($guide, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    $etag = ETag::of($body);
    $response = $response->withHeader('ETag', $etag)->withHeader('Cache-Control', 'no-cache');
    if (ETag::notModified($request->getHeaderLine('If-None-Match'), $etag)) {
        return $response->withStatus(304);
    }
    $response->getBody()->write($body);

    return $response->withHeader('Content-Type', 'application/json; charset=utf-8');
})->add(responds(GuideResponse::class));

$app->get('/api/admin/guides', function (Request $request, Response $response) {
    $grid = guidesGrid(usersDb());

    return $grid instanceof Refusal ? guideRefused($response, $grid) : JsonResponse::write($response, 200, $grid);
})->add(responds(GuideEditorView::class))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());

$app->put('/api/admin/guides/{guide}', function (Request $request, Response $response, array $args) {
    // Read from the raw body, as the library reads a save of the strings: JSON
    // only, {} kept apart from [], and no larger than GUIDE_BODY_LIMIT.
    $body = JsonBody::read($request, GUIDE_BODY_LIMIT);
    if ($body instanceof Refusal) {
        return guideRefused($response, $body);
    }
    $pdo = usersDb();
    if (!guidesReady($pdo)) {
        return guideRefused($response, guidesUnavailable());
    }

    $guide = (string) $args['guide'];
    $result = guideSave($pdo, $guide, JsonBody::map(JsonBody::map($body)['values'] ?? null), translationsActor($request));
    if ($result instanceof Refusal) {
        return guideRefused($response, $result);
    }
    if ($result['changed'] !== []) {
        auditContent('guide_contents', $guide, 'UPDATE', translationsActor($request), $result['changed']);
    }

    return JsonResponse::write($response, 200, guideEntry($pdo, $guide));
})->add(responds(GuideEditorEntry::class))->add(requireRole(...ROLES_CONTENT))->add(requireAuth());
