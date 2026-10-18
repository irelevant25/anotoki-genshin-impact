<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

// ---------------------------------------------------------------------------
// The move at sign-in
//
//   POST /api/visitor/move   Authorization: Bearer <token>   X-Visitor-Key: <key>
//                            {silent?: bool}
//                            -> {found, games: {moved, kept, stale}, results, stayed}
//
// Somebody who played without signing in has a visitor here - their games and
// statistics under a `users` row of its own, opened by the key their browser
// keeps (api/visitors.php). When they sign in, the page sends both: the token
// says whose account it is, the key whose visitor, and the visitor's games and
// statistics become the person's in one transaction (visitorMove()):
//
//   - a saved game both have (the same quiz, free or daily) stays the person's
//     - it is the one their other devices already show; the visitor's moves
//     where the person has none. A daily is today's (UTC) or nothing: the
//     visitor's of another day stays behind, the person's of another day is
//     replaced by the visitor's of today;
//   - every finished question moves into the person's log as it is, and the
//     totals are added to the person's, so they still add up;
//   - then the visitor is gone, and its key opens nothing.
//
// Unless the sign-in was a silent one - the IAM's sign-in hint signed the
// person in without a click, and the page says so (`silent: true`; the
// library's callback knows) - and the account already has something here: then
// nothing moves, the visitor stays as it was under its key on that browser,
// and the answer says `stayed: true` (the owner's decision of 2026-10-11: a
// browser's games come silently only into an account that is here for the
// first time). A sign-in the person makes moves them as above. `silent` other
// than true or false: 422 invalid.
//
// The one route that reads the key beside a token (requireVisitorKey()); the
// key is never who a request is here, the token is. It works whatever the
// IAM's "Sign-in required" says - the sign-in gate lets a verified token
// through, and switching it on stops a key from being somebody, not from
// coming into an account with its owner. Repeatable: a key nobody has (moved
// already by another tab, swept) is {found: false} with zeros. No key, or one
// that is not a key: 422 invalid. Another request on the same rows past the
// lock timeout: 503 visitor_move_retry with Retry-After (ask again). The
// person's own row gone meanwhile: 401 sign_in_required. users/045 not
// applied: 503 visitors_unavailable. Every answer past the token check is
// `Cache-Control: private, no-store` with `Vary: Authorization, X-Visitor-Key`.
// ---------------------------------------------------------------------------

$app->post('/api/visitor/move', function (Request $request, Response $response) {
    $body = $request->getParsedBody();
    $silent = is_array($body) ? $body['silent'] ?? false : false;
    if (!is_bool($silent)) {
        throw new ApiRefusal(422, 'invalid', 'silent is true or false: whether the sign-in was the IAM\'s silent one.', [], ['field' => 'silent']);
    }

    return respondJson($response, visitorMove($request->getAttribute('user'), $request->getAttribute('visitor_key'), $silent));
})
    ->add(responds(VisitorMoveResult::class))
    ->add(requireVisitorKey())
    ->add(requireAuth());
