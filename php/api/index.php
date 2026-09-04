<?php

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';
require_once __DIR__ . '/../config/site.php';
require_once __DIR__ . '/../config/backup.php';
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/db_query.php';
require_once __DIR__ . '/model.php';
require_once __DIR__ . '/response.php';
require_once __DIR__ . '/media_convert.php';
require_once __DIR__ . '/audit_file.php';
require_once __DIR__ . '/asset_stats.php';
require_once __DIR__ . '/asset_cleanup.php';
require_once __DIR__ . '/full_resource.php';
require_once __DIR__ . '/mail.php';
require_once __DIR__ . '/one_time_token.php';
require_once __DIR__ . '/google_identity.php';
require_once __DIR__ . '/totp.php';
require_once __DIR__ . '/session.php';
require_once __DIR__ . '/trusted_device.php';
require_once __DIR__ . '/site_settings.php';
require_once __DIR__ . '/site_routes.php';

use Slim\Factory\AppFactory;

$app = AppFactory::create();
$app->addBodyParsingMiddleware();

// meddleware
require_once __DIR__ . '/meddleware/validation.php';
require_once __DIR__ . '/meddleware/auth.php';
require_once __DIR__ . '/meddleware/maintenance.php';
require_once __DIR__ . '/meddleware/route_gate.php';

///////////////////
// USERS
///////////////////

// models
require_once __DIR__ . '/routes/users/models/migration.php';
require_once __DIR__ . '/routes/users/models/user.php';
require_once __DIR__ . '/routes/users/models/role.php';
require_once __DIR__ . '/routes/users/models/language.php';

// responses
require_once __DIR__ . '/routes/users/responses/auth.php';
require_once __DIR__ . '/routes/users/responses/user.php';
require_once __DIR__ . '/routes/users/responses/backup.php';
require_once __DIR__ . '/routes/users/responses/translation.php';
require_once __DIR__ . '/routes/users/responses/setting.php';

// endpoints
require_once __DIR__ . '/routes/users/endpoints/auth.php';
require_once __DIR__ . '/routes/users/endpoints/users.php';
require_once __DIR__ . '/routes/users/endpoints/sessions.php';
require_once __DIR__ . '/routes/users/endpoints/settings.php';
require_once __DIR__ . '/routes/users/endpoints/routes.php';
require_once __DIR__ . '/routes/users/endpoints/languages.php';
require_once __DIR__ . '/routes/users/endpoints/translations.php';
require_once __DIR__ . '/routes/users/endpoints/backups.php';

///////////////////
// GENSHIN IMPACT
///////////////////

// models
require_once __DIR__ . '/routes/genshin_impact/models/lookup.php';
require_once __DIR__ . '/routes/genshin_impact/models/stat.php';
require_once __DIR__ . '/routes/genshin_impact/models/quiz.php';
require_once __DIR__ . '/routes/genshin_impact/models/background.php';
require_once __DIR__ . '/routes/genshin_impact/models/material.php';
require_once __DIR__ . '/routes/genshin_impact/models/food.php';
require_once __DIR__ . '/routes/genshin_impact/models/food_recipe.php';
require_once __DIR__ . '/routes/genshin_impact/models/role.php';
require_once __DIR__ . '/routes/genshin_impact/models/character.php';
require_once __DIR__ . '/routes/genshin_impact/models/character_role.php';
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
require_once __DIR__ . '/routes/genshin_impact/models/character_build_recommended_stat.php';
require_once __DIR__ . '/routes/genshin_impact/models/weapon.php';
require_once __DIR__ . '/routes/genshin_impact/models/weapon_stat.php';
require_once __DIR__ . '/routes/genshin_impact/models/weapon_refinement.php';
require_once __DIR__ . '/routes/genshin_impact/models/weapon_ascension.php';
require_once __DIR__ . '/routes/genshin_impact/models/weapon_ascension_cost.php';
require_once __DIR__ . '/routes/genshin_impact/models/artifact.php';
require_once __DIR__ . '/routes/genshin_impact/models/artifact_piece.php';
require_once __DIR__ . '/routes/genshin_impact/models/material_group_join.php';
require_once __DIR__ . '/routes/genshin_impact/models/enemy.php';
require_once __DIR__ . '/routes/genshin_impact/models/enemy_phase.php';
require_once __DIR__ . '/routes/genshin_impact/models/enemy_damage_type_element.php';
require_once __DIR__ . '/routes/genshin_impact/models/enemy_drop.php';
require_once __DIR__ . '/routes/genshin_impact/models/banner.php';
require_once __DIR__ . '/routes/genshin_impact/models/banner_character.php';
require_once __DIR__ . '/routes/genshin_impact/models/banner_weapon.php';
require_once __DIR__ . '/routes/genshin_impact/models/quiz_state.php';
require_once __DIR__ . '/routes/genshin_impact/models/quiz_stats_history.php';
require_once __DIR__ . '/routes/genshin_impact/models/user_quiz_history.php';

// responses
require_once __DIR__ . '/routes/genshin_impact/responses/common.php';
require_once __DIR__ . '/routes/genshin_impact/responses/file.php';
require_once __DIR__ . '/routes/genshin_impact/responses/admin.php';
require_once __DIR__ . '/routes/genshin_impact/responses/quiz.php';
require_once __DIR__ . '/routes/genshin_impact/responses/content.php';

// endpoints
require_once __DIR__ . '/routes/genshin_impact/endpoints/characters.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/characters_full.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/roles.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/elements.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/weapon_types.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/voice_over_types.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/relationship_types.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/characters_states.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/characters_models.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/talent_types.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/food_types.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/material_types.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/material_groups.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/rarities.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/regions.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/artifact_piece_types.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/enemy_types.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/domain_levels.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/enemy_families.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/enemy_groups.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/stats.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/migrations.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/audit_logs.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/feedback.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/dashboard.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/upload.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/uploads.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/files.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/affiliations.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/weapons.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/weapons_refinements.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/weapons_ascensions.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/weapons_ascensions_cost.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/weapons_full.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/artifacts.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/artifact_pieces.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/artifacts_full.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/materials.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/materials_groups_join.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/materials_full.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/materials_usage.php';
// The four below have existed since the schema was written but were never
// required here, so none of their routes were ever registered - which is why
// nothing a quiz sent could be saved.
require_once __DIR__ . '/routes/genshin_impact/endpoints/quizzes.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/quiz_states.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/quiz_stats_history.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/user_quiz_history.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/quiz_voice_over.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/quiz_progress.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/backgrounds.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/foods.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/foods_recipe.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/foods_full.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/enemies.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/enemies_phases.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/enemies_damage_types_elements.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/enemies_drops.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/enemies_full.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/banners.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/banners_characters.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/banners_weapons.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/banners_full.php';
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
require_once __DIR__ . '/routes/genshin_impact/endpoints/characters_builds_recommended_stats.php';

// Added before the error and CORS middleware, which means it runs inside both:
// a 503 from here is still a CORS-headed JSON response, and anything it throws
// is still handled. See meddleware/maintenance.php for what stays open.
$app->add(routeGate());
$app->add(maintenanceGate());

$errorMiddleware = $app->addErrorMiddleware(false, true, true);
$errorMiddleware->setDefaultErrorHandler(function (\Psr\Http\Message\ServerRequestInterface $request, \Throwable $exception, bool $displayErrorDetails) use ($app) {
    $statusCode = 500;
    $message = 'Internal server error';

    // Slim signals unknown routes and methods as exceptions; without this they
    // all surface as an opaque 500.
    if ($exception instanceof \Slim\Exception\HttpNotFoundException) {
        $statusCode = 404;
        $message = 'Not found';
    } elseif ($exception instanceof \Slim\Exception\HttpMethodNotAllowedException) {
        $statusCode = 405;
        $message = 'Method not allowed';
    } elseif ($exception instanceof \Slim\Exception\HttpUnauthorizedException) {
        $statusCode = 401;
        $message = 'Unauthorized';
    } elseif ($exception instanceof \PDOException) {
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

// The API-client generator loads this file purely to read the route table, and
// must not serve a request while doing it.
if (!defined('ANOTOKI_ROUTES_ONLY')) {
    $app->run();
}
