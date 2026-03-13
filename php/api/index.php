<?php

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/db_query.php';
require_once __DIR__ . '/model.php';

use Slim\Factory\AppFactory;

$app = AppFactory::create();
$app->addBodyParsingMiddleware();

// meddleware
require_once __DIR__ . '/meddleware/validation.php';
require_once __DIR__ . '/meddleware/auth.php';

///////////////////
// USERS
///////////////////

// models
require_once __DIR__ . '/routes/users/models/migration.php';
require_once __DIR__ . '/routes/users/models/user.php';
require_once __DIR__ . '/routes/users/models/role.php';

// endpoints
require_once __DIR__ . '/routes/users/endpoints/auth.php';
require_once __DIR__ . '/routes/users/endpoints/users.php';

///////////////////
// GENSHIN IMPACT
///////////////////

// models
require_once __DIR__ . '/routes/genshin_impact/models/stat.php';
require_once __DIR__ . '/routes/genshin_impact/models/quiz.php';
require_once __DIR__ . '/routes/genshin_impact/models/background.php';
require_once __DIR__ . '/routes/genshin_impact/models/material.php';
require_once __DIR__ . '/routes/genshin_impact/models/food.php';
require_once __DIR__ . '/routes/genshin_impact/models/food_recipe.php';
require_once __DIR__ . '/routes/genshin_impact/models/affiliation.php';
require_once __DIR__ . '/routes/genshin_impact/models/role.php';
require_once __DIR__ . '/routes/genshin_impact/models/character.php';
require_once __DIR__ . '/routes/genshin_impact/models/character_role.php';
require_once __DIR__ . '/routes/genshin_impact/models/character_affiliation.php';
require_once __DIR__ . '/routes/genshin_impact/models/character_constellation.php';
require_once __DIR__ . '/routes/genshin_impact/models/character_voice_over.php';
require_once __DIR__ . '/routes/genshin_impact/models/character_relationship.php';
require_once __DIR__ . '/routes/genshin_impact/models/character_talent.php';
require_once __DIR__ . '/routes/genshin_impact/models/character_talent_cost.php';
require_once __DIR__ . '/routes/genshin_impact/models/character_ascension.php';
require_once __DIR__ . '/routes/genshin_impact/models/character_ascension_cost.php';
require_once __DIR__ . '/routes/genshin_impact/models/character_build.php';
require_once __DIR__ . '/routes/genshin_impact/models/character_build_weapon.php';
require_once __DIR__ . '/routes/genshin_impact/models/character_build_artifact.php';
require_once __DIR__ . '/routes/genshin_impact/models/character_build_talent.php';
require_once __DIR__ . '/routes/genshin_impact/models/character_build_main_stat.php';
require_once __DIR__ . '/routes/genshin_impact/models/character_build_sub_stat.php';
require_once __DIR__ . '/routes/genshin_impact/models/character_build_team.php';
require_once __DIR__ . '/routes/genshin_impact/models/character_build_team_character.php';
require_once __DIR__ . '/routes/genshin_impact/models/weapon.php';
require_once __DIR__ . '/routes/genshin_impact/models/weapon_stat.php';
require_once __DIR__ . '/routes/genshin_impact/models/artifact.php';
require_once __DIR__ . '/routes/genshin_impact/models/artifact_piece.php';
require_once __DIR__ . '/routes/genshin_impact/models/enemy.php';
require_once __DIR__ . '/routes/genshin_impact/models/enemy_drop.php';
require_once __DIR__ . '/routes/genshin_impact/models/banner.php';
require_once __DIR__ . '/routes/genshin_impact/models/banner_character.php';
require_once __DIR__ . '/routes/genshin_impact/models/banner_weapon.php';
require_once __DIR__ . '/routes/genshin_impact/models/quiz_state.php';
require_once __DIR__ . '/routes/genshin_impact/models/quiz_stats_history.php';
require_once __DIR__ . '/routes/genshin_impact/models/user_quiz_history.php';

// endpoints
require_once __DIR__ . '/routes/genshin_impact/endpoints/characters.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/roles.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/affiliations.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/weapons.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/artifacts.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/artifact_pieces.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/materials.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/foods.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/foods_recipe.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/enemies.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/enemies_drops.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/banners.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/banners_characters.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/banners_weapons.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/characters_roles.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/characters_affiliations.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/characters_constellations.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/characters_voice_overs.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/characters_relationships.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/characters_talents.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/characters_talents_cost.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/characters_ascensions.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/characters_ascensions_cost.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/characters_builds.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/characters_builds_weapons.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/characters_builds_artifacts.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/characters_builds_talents.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/characters_builds_main_stats.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/characters_builds_sub_stats.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/characters_builds_teams.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/characters_builds_teams_characters.php';

$errorMiddleware = $app->addErrorMiddleware(false, true, true);
$errorMiddleware->setDefaultErrorHandler(function (\Psr\Http\Message\ServerRequestInterface $request, \Throwable $exception, bool $displayErrorDetails) use ($app) {
    $statusCode = 500;
    $message = 'Internal server error';

    if ($exception instanceof \PDOException) {
        $sqlState = $exception->getCode();
        // Data errors (22xxx) → 400 Bad Request
        if (is_string($sqlState) && str_starts_with($sqlState, '22')) {
            $statusCode = 400;
            $message = 'Invalid data: ' . $exception->getMessage();
        } elseif (is_string($sqlState) && str_starts_with($sqlState, '23')) {
            // Integrity constraint violations → 409 Conflict
            $statusCode = 409;
            $message = 'Conflict: ' . $exception->getMessage();
        }
    }

    error_log('[' . get_class($exception) . '] ' . $exception->getMessage() . ' in ' . $exception->getFile() . ':' . $exception->getLine());

    $response = $app->getResponseFactory()->createResponse($statusCode);
    $response->getBody()->write(json_encode(['error' => $message]));
    return $response->withHeader('Content-Type', 'application/json');
});

$app->add(function ($request, $handler) {
    if ($request->getMethod() === 'OPTIONS') {
        $response = new \Slim\Psr7\Response();
        return $response
            ->withHeader('Access-Control-Allow-Origin', 'http://localhost:4200')
            ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
            ->withStatus(200);
    }

    $response = $handler->handle($request);
    return $response
        ->withHeader('Access-Control-Allow-Origin', 'http://localhost:4200')
        ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
});

$app->run();
