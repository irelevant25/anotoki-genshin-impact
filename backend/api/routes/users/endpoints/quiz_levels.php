<?php

use Anotoki\Lib\Support\JsonBody;
use Anotoki\Lib\Support\JsonResponse;
use Anotoki\Lib\Support\Refusal;
use Anotoki\Lib\Translations\ETag;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

// ---------------------------------------------------------------------------
// The quizzes' levels (api/quiz_levels.php)
//
//   GET    /api/quiz/levels              the levels every quiz plays: {levels} - the saved
//                                        ones while the rules take them, null for the built-in
//                                        ones (the frontend's QUIZ_LEVELS). Public, asked once
//                                        a page load; ETag + no-cache, a 304 while nothing
//                                        changed. Under the quizzes' switches, as all of
//                                        /api/quiz is.
//   GET    /api/admin/quiz-levels        the Quiz levels page: {levels, updated_at, problems} -
//                                        what is saved, as saved, and what the rules say of it
//   POST   /api/admin/quiz-levels/check  {levels}: {problems} - what the rules say, nothing kept
//   PUT    /api/admin/quiz-levels        {levels}: kept, all of it - or 422 invalid_levels with
//                                        the problems, nothing kept
//   DELETE /api/admin/quiz-levels        back to the built-in levels
//
// The admin routes are ADMIN's or EDITOR's (ROLES_CONTENT): who may change the
// content may change how the quizzes play it. A save and a reset are audited
// (content.insert, update or delete on quiz_levels, the levels before and
// after). Refusals are this API's {error, code, ...}.
// ---------------------------------------------------------------------------

/** A refusal as every route here words one. */
function quizLevelsRefused(Response $response, Refusal $refusal): Response
{
    $response = translationsError($response, $refusal);

    return $refusal->status === 503 ? $response->withHeader('Retry-After', '60') : $response;
}

/**
 * What a save or a check sends - {levels}, and nothing else - held to the
 * rules; or why the body is not that. Read from the raw body, as the guides'
 * saves are: JSON only, {} kept apart from [], no larger than
 * QUIZ_LEVELS_BODY_LIMIT.
 *
 * @return array{levels: ?array<string, mixed>, problems: list<array<string, mixed>>}|Refusal
 */
function quizLevelsSent(Request $request): array|Refusal
{
    $body = JsonBody::read($request, QUIZ_LEVELS_BODY_LIMIT);
    if ($body instanceof Refusal) {
        return $body;
    }
    $fields = JsonBody::map($body);
    if ($fields === null || array_keys($fields) !== ['levels']) {
        return Refusal::invalid('invalid_body', 'Send {"levels": {...}}: the six quizzes\' levels, and nothing else.');
    }

    return quizLevelsChecked($fields['levels']);
}

$app->get('/api/quiz/levels', function (Request $request, Response $response) {
    $body = json_encode(['levels' => quizLevelsInForce(usersDb())], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    $etag = ETag::of($body);
    $response = $response->withHeader('ETag', $etag)->withHeader('Cache-Control', 'no-cache');
    if (ETag::notModified($request->getHeaderLine('If-None-Match'), $etag)) {
        return $response->withStatus(304);
    }
    $response->getBody()->write($body);

    return $response->withHeader('Content-Type', 'application/json; charset=utf-8');
})->add(responds(QuizLevelsInForce::class));

$app->get('/api/admin/quiz-levels', function (Request $request, Response $response) {
    $pdo = usersDb();

    return quizLevelsReady($pdo) ? JsonResponse::write($response, 200, quizLevelsView($pdo)) : quizLevelsRefused($response, quizLevelsUnavailable());
})
    ->add(responds(QuizLevelsEditorView::class))
    ->add(requireRole(...ROLES_CONTENT))
    ->add(requireAuth());

$app->post('/api/admin/quiz-levels/check', function (Request $request, Response $response) {
    $checked = quizLevelsSent($request);

    return $checked instanceof Refusal ? quizLevelsRefused($response, $checked) : JsonResponse::write($response, 200, ['problems' => $checked['problems']]);
})
    ->add(responds(QuizLevelsCheck::class))
    ->add(requireRole(...ROLES_CONTENT))
    ->add(requireAuth());

$app->put('/api/admin/quiz-levels', function (Request $request, Response $response) {
    $checked = quizLevelsSent($request);
    if ($checked instanceof Refusal) {
        return quizLevelsRefused($response, $checked);
    }
    if ($checked['levels'] === null) {
        return quizLevelsRefused($response, Refusal::invalid('invalid_levels', 'Not saved: the levels break the rules (problems says where).', ['problems' => $checked['problems']]));
    }
    $pdo = usersDb();
    if (!quizLevelsReady($pdo)) {
        return quizLevelsRefused($response, quizLevelsUnavailable());
    }

    $saved = quizLevelsSave($pdo, $checked['levels']);
    if ($saved['verb'] !== null) {
        auditContent('quiz_levels', 'levels', $saved['verb'], translationsActor($request), ['levels' => ['old' => $saved['old'], 'new' => $checked['levels']]]);
    }

    return JsonResponse::write($response, 200, quizLevelsView($pdo));
})
    ->add(responds(QuizLevelsEditorView::class))
    ->add(requireRole(...ROLES_CONTENT))
    ->add(requireAuth());

$app->delete('/api/admin/quiz-levels', function (Request $request, Response $response) {
    $pdo = usersDb();
    if (!quizLevelsReady($pdo)) {
        return quizLevelsRefused($response, quizLevelsUnavailable());
    }

    $old = quizLevelsReset($pdo);
    if ($old !== null) {
        auditContent('quiz_levels', 'levels', 'DELETE', translationsActor($request), ['levels' => ['old' => $old, 'new' => null]]);
    }

    return JsonResponse::write($response, 200, quizLevelsView($pdo));
})
    ->add(responds(QuizLevelsEditorView::class))
    ->add(requireRole(...ROLES_CONTENT))
    ->add(requireAuth());
