<?php

use Anotoki\Lib\Translations\ETag;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

// ---------------------------------------------------------------------------
// The game catalog, for the build analyzer (api/catalog.php)
//
//   GET /api/catalog/characters   every live character: the game's id, name,
//                                 element, weapon type, rarity, region,
//                                 version, release date, Traveler or not, icon
//   GET /api/catalog/weapons      every live weapon: id, name, type, rarity,
//                                 version, release date, icon
//   GET /api/catalog/artifacts    every live artifact set: id, name, the 2- and
//                                 4-piece bonuses, its rarities, version, icon
//
// Each a bare JSON list, by name then id. Public and read-only, and under
// this site's switches as every route is: closed while the site is not set
// up or an update waits, for maintenance, while the IAM requires signing in,
// and when a page's row locks /api/catalog - the analyzer keeps what it last
// read meanwhile. ETag + no-cache, as the guides and the words answer: asked
// every time, a 304 while nothing changed.
//
//   400 invalid_host   the request names no host the icons could be addressed on
// ---------------------------------------------------------------------------

/** One list as each catalog route answers it, $list being the query that makes it. */
function catalogAnswer(Request $request, Response $response, callable $list): Response
{
    $origin = catalogOrigin($request);
    if ($origin === null) {
        return respondJson($response, ['error' => 'The request names no host its icons could be addressed on', 'code' => 'invalid_host'], 400);
    }

    $body = json_encode($list(genshinDb(), $origin), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    $etag = ETag::of($body);
    $response = $response->withHeader('ETag', $etag)->withHeader('Cache-Control', 'no-cache');
    // The library's reading of If-None-Match, as the guides' and the words':
    // W/ in front, or an Apache's -gzip inside the quotes, still the same tag.
    if (ETag::notModified($request->getHeaderLine('If-None-Match'), $etag)) {
        return $response->withStatus(304);
    }
    $response->getBody()->write($body);

    return $response->withHeader('Content-Type', 'application/json; charset=utf-8');
}

$app->get('/api/catalog/characters', function (Request $request, Response $response) {
    return catalogAnswer($request, $response, catalogCharacters(...));
})->add(responds(CatalogCharacter::class, list: true));

$app->get('/api/catalog/weapons', function (Request $request, Response $response) {
    return catalogAnswer($request, $response, catalogWeapons(...));
})->add(responds(CatalogWeapon::class, list: true));

$app->get('/api/catalog/artifacts', function (Request $request, Response $response) {
    return catalogAnswer($request, $response, catalogArtifacts(...));
})->add(responds(CatalogArtifact::class, list: true));
