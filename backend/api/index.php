<?php

// The hosting prints PHP's warnings into the page (display_errors is on there),
// which puts the server's paths in front of an answer's JSON and breaks it for
// the frontend. Served by a web server, they go to the error log only; the
// command line and the development server keep showing them.
if (!in_array(PHP_SAPI, ['cli', 'cli-server'], true)) {
    ini_set('display_errors', '0');
}

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config/local.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/iam.php';
require_once __DIR__ . '/../config/secret.php';
require_once __DIR__ . '/../config/site.php';
require_once __DIR__ . '/../config/backup.php';
require_once __DIR__ . '/../config/visitors.php';
require_once __DIR__ . '/../config/cloudflare.php';
require_once __DIR__ . '/helpers.php';

// Nothing here needs the config/*.local.php files to load: without them the
// site is not set up, and the SiteGate below answers every request so
// (site_state.php) - the spec generator, which loads this file only to read
// the route table, needs none either.

// The audit log (the anotoki library's), before everything that writes it.
require_once __DIR__ . '/audit_log.php';
require_once __DIR__ . '/audit_scope.php';
require_once __DIR__ . '/db_query.php';
require_once __DIR__ . '/model.php';
require_once __DIR__ . '/response.php';
require_once __DIR__ . '/media_convert.php';
require_once __DIR__ . '/audit_file.php';
require_once __DIR__ . '/asset_columns.php';
require_once __DIR__ . '/upload_guard.php';
require_once __DIR__ . '/asset_naming.php';
require_once __DIR__ . '/asset_catalogue.php';
require_once __DIR__ . '/asset_stats.php';
require_once __DIR__ . '/explorer.php';
require_once __DIR__ . '/asset_cleanup.php';
require_once __DIR__ . '/full_resource.php';
// Who a request is, this site's record of people, and the admin tools: the
// anotoki library's modules, set up for this site.
require_once __DIR__ . '/admin_tools.php';
require_once __DIR__ . '/site_user.php';
// Visitors - playing without signing in, while the IAM does not require it:
// the address the limits count, the work done after the answer (the sweep),
// and the one file that makes, finds, locks and sweeps a visitor.
require_once __DIR__ . '/client_address.php';
require_once __DIR__ . '/after_response.php';
require_once __DIR__ . '/visitors.php';
require_once __DIR__ . '/site_settings.php';
require_once __DIR__ . '/site_routes.php';
// The words, through anotoki/lib's translations - this site's part of them -
// and the guides behind the question marks.
require_once __DIR__ . '/translations.php';
require_once __DIR__ . '/guides.php';
// The migrations (on anotoki/lib's engine), and where the site stands: not set
// up, a database update waiting, or ready.
require_once __DIR__ . '/migration_runner.php';
require_once __DIR__ . '/site_state.php';

use Anotoki\Lib\Audit\AuditContextMiddleware;
use Anotoki\Lib\Audit\Http\AuditRoutes;
use Anotoki\Lib\Auth\Http\Identify;
use Anotoki\Lib\Auth\Http\RequireRole;
use Anotoki\Lib\Backups\Http\BackupsRoutes;
use Anotoki\Lib\ErrorLog\ErrorLogMiddleware;
use Anotoki\Lib\ErrorLog\Http\ErrorLogRoutes;
use Anotoki\Lib\Feedback\Http\FeedbackRoutes;
use Anotoki\Lib\Files\Http\FilesRoutes;
use Anotoki\Lib\Migrations\Http\MigrationsRoutes;
use Anotoki\Lib\Migrations\Http\SiteGate;
use Anotoki\Lib\Migrations\Http\SiteState;
use Anotoki\Lib\Migrations\Migrator;
use Anotoki\Lib\People\Http\PeopleRoutes;
use Anotoki\Lib\People\Http\PeopleUpkeep;
use Slim\Factory\AppFactory;

$app = AppFactory::create();
$app->addBodyParsingMiddleware();

// What went wrong, written down for the admin panel's Error log (the anotoki
// library's, api/admin_tools.php) - made first, so it can name each line's
// route. PHP's own fatal errors and warnings too, while serving: the spec
// generator, which loads this file only to read the route table, has nothing
// to report.
$errorLog = siteErrorLog($app);
if (!defined('ANOTOKI_ROUTES_ONLY')) {
    $errorLog->installPhpHandlers();
}

// meddleware
require_once __DIR__ . '/meddleware/validation.php';
require_once __DIR__ . '/meddleware/auth.php';
require_once __DIR__ . '/meddleware/maintenance.php';
require_once __DIR__ . '/meddleware/sign_in.php';
require_once __DIR__ . '/meddleware/route_gate.php';

///////////////////
// USERS
///////////////////

// models
require_once __DIR__ . '/routes/users/models/migration.php';

// responses
require_once __DIR__ . '/routes/users/responses/me.php';
require_once __DIR__ . '/routes/users/responses/guide.php';
require_once __DIR__ . '/routes/users/responses/setting.php';
require_once __DIR__ . '/routes/users/responses/visitor.php';

// endpoints
require_once __DIR__ . '/routes/users/endpoints/me.php';
require_once __DIR__ . '/routes/users/endpoints/settings.php';
require_once __DIR__ . '/routes/users/endpoints/routes.php';
// The strings and the languages: the anotoki library's routes, behind this
// site's checks (api/translations.php is the site's part of them).
require_once __DIR__ . '/routes/users/endpoints/translations.php';
require_once __DIR__ . '/routes/users/endpoints/guides.php';
require_once __DIR__ . '/routes/users/endpoints/visitor.php';

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
require_once __DIR__ . '/routes/genshin_impact/endpoints/dashboard.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/uploads.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/files.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/file_categories.php';
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
require_once __DIR__ . '/routes/genshin_impact/endpoints/characters_constellations.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/characters_voice_overs.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/voice_over_sets.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/characters_ascensions_sets.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/characters_talents_sets.php';
require_once __DIR__ . '/routes/genshin_impact/endpoints/characters_constellations_sets.php';
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

///////////////////
// THE SITE'S STATE AND ITS MIGRATIONS (anotoki/lib)
///////////////////

// GET /api/site-status, for anybody: where the site stands - what the pages ask
// as they start. And the admin Migrations page's API: what has run and what
// waits (GET), a file's SQL (GET /file?set=&name=) and Apply (POST /apply) -
// for this site's ADMIN, judged by the token alone (the library's RequireRole),
// so nothing a waiting migration has yet to make stands between an
// administrator and Apply. Every Apply takes a backup of the database as it
// is first (the library's Backups); after one, the audit entries that waited
// for their table go in, and the Apply is written down itself.
MigrationsRoutes::status($app, siteState());
MigrationsRoutes::admin(
    $app,
    '/api/admin/migrations',
    fn (): Migrator => siteMigrator(getDb(), backups: siteBackups()),
    function (\Psr\Http\Message\ServerRequestInterface $request, array $result): void {
        siteAudit()->flushPending();
        $applied = array_map(static fn (array $file): string => $file['set'] . '/' . $file['name'], $result['applied'] ?? []);
        if ($applied !== [] || ($result['failed'] ?? null) !== null) {
            siteAudit()->record($request, Identify::person($request)?->sub, 'migrations.applied', null, null, array_filter([
                'files' => $applied,
                'failed' => isset($result['failed']) ? $result['failed']['set'] . '/' . $result['failed']['name'] : null,
            ], static fn (mixed $value): bool => $value !== null));
        }
    },
)->add(RequireRole::admin());

///////////////////
// THE ADMIN TOOLS (anotoki/lib)
///////////////////

// The anotoki library's admin tools, each an admin page of the library's own
// (api/admin_tools.php): the error log, the audit log, feedback, backups, the
// file explorer and the People page - for this site's ADMIN alone (the owner's
// decision: EDITORs see none of them). Every group asks the ADMIN check itself
// (from the token, through the AdminContext - 401 for nobody, 403 for anybody
// else), and this site's own check is added to each as well, which answers
// first. Both judge the token alone, so the error log and the backups work
// while an update waits (SITE_OPEN_WHILE_UPDATING) - restore aside. The
// people the pages name, they read from the context (peopleNamesById()).
ErrorLogRoutes::admin($app, '/api/admin/errors', $errorLog, siteAdminContext(), siteAudit())->add(RequireRole::admin());
AuditRoutes::admin($app, '/api/admin/audit', siteAudit(), siteAdminContext())->add(RequireRole::admin());
FeedbackRoutes::admin($app, '/api/admin/feedback', siteFeedback(), siteAdminContext(), siteAudit())->add(RequireRole::admin());
BackupsRoutes::admin($app, '/api/admin/backups', siteBackups(), siteAdminContext())->add(RequireRole::admin());
// The explorer's writes in the asset tree keep the catalogue's rows (same ids)
// and never take a file the site's content points at: explorerGuard() refuses
// that before the library acts, after the ADMIN check (added first, so it runs
// second); explorerAfterWrite() takes the rows along.
FilesRoutes::admin($app, '/api/admin/files', siteFileExplorer(), siteAdminContext(), siteAudit())
    ->add(explorerGuard($app->getResponseFactory()))
    ->add(RequireRole::admin());
PeopleRoutes::admin(
    $app,
    '/api/admin/people',
    sitePeople(),
    columns: peopleColumns(),
    visitors: peopleVisitors(...),
    delete: peopleDeleteGames(...),
    error: refusalResponse(...),
    audit: siteAudit(),
    context: siteAdminContext(),
)->add(RequireRole::admin());

// Two links the browser opens by itself, with no token to send - deliberately
// outside every admin check: a backup's download, its single-use ticket (handed
// to an ADMIN, by the route above, for one backup and a minute) the check; a
// file's preview, its five-minute signature the check. The gates leave both
// open (TOKENLESS_PATHS, MAINTENANCE_OPEN_PREFIXES, SIGN_IN_OPEN_PATHS).
BackupsRoutes::file($app, '/api/admin/backups', siteBackups(), siteAdminContext());
FilesRoutes::raw($app, '/api/admin/files/raw', siteFileExplorer(), siteAdminContext());

// The visitors' feedback form (the footer's): open to everybody - the gates
// apply to it as to any route, so while the IAM requires sign-in it is for
// people signed in. Who sent it comes from the token alone; nothing of where
// it came from is kept (Feedback, api/admin_tools.php).
FeedbackRoutes::public($app, '/api/feedback', siteFeedback(), siteAdminContext(), feedbackSender(...));

// The pages' own errors, into the error log (anotoki-lib 0.5.0, the owner's
// decision: every site's): what the browser's ErrorHandler reports
// (@anotoki/lib/error-report, app.config.ts) - JSON, 8 KB at most, scrubbed
// again here, at most 20 an hour from one sender (a person by their account,
// a visitor by their address bucket) and 500 a day from the visitors, as many
// from the people signed in. Behind every gate, as any route: while the site
// is closed, waits for an update or wants a sign-in, it takes none from whom
// those keep out.
ErrorLogRoutes::client($app, '/api/client-errors', $errorLog, siteAdminContext());

///////////////////
// THE GATES
///////////////////

// Added before the error and header middleware, which means they run inside
// both: a 503 or 401 from here still carries the security headers, and
// anything they throw is still handled. The last added runs first: where the
// site stands (site_state.php - not set up, or a database update waiting),
// then who the request is (the library's Identify, meddleware/auth.php - a
// token that does not verify is 401 invalid_token here), then the closed sign
// (maintenance.php), then sign-in required (sign_in.php), then the per-page
// locks (route_gate.php) - each file says what it leaves open.
//
// Inside the SiteGate, so a site that is not set up never runs them: the
// people's scrub (at most hourly, after an answer, while the site is ready),
// the day's backup (the first answer of a UTC day) and, once, the hashing of
// the addresses the site's old error log files kept (api/admin_tools.php).
// And the audit log holds who acts for as long as a request is answered (the
// person and their IAM session), so every entry it writes meanwhile names
// them.
$app->add(routeGate());
$app->add(signInGate());
$app->add(maintenanceGate());
$app->add(AuditContextMiddleware::fromRequest(siteAudit(), static function (\Psr\Http\Message\ServerRequestInterface $request): array {
    $person = Identify::person($request);

    return $person === null ? [] : ['actor' => $person->sub, 'session' => $person->sid];
}));
$app->add(identifyRequests(siteIdentify($app->getResponseFactory())));
$app->add(function (\Psr\Http\Message\ServerRequestInterface $request, \Psr\Http\Server\RequestHandlerInterface $handler): \Psr\Http\Message\ResponseInterface {
    $response = $handler->handle($request);
    siteBackups()->dailyIfDue();
    oldErrorLogAddressesForgetSoon();

    return $response;
});
$app->add(new PeopleUpkeep(sitePeople(), static fn (): bool => siteState()->state() === SiteState::READY, afterResponse(...)));
$app->add(new SiteGate(siteState(), $app->getResponseFactory(), SITE_OPEN_WHILE_UPDATING, setupPath: SETUP_PATH));

$errorMiddleware = $app->addErrorMiddleware(false, true, true);
// The site's answer to what was thrown, and the line in the error log for it
// (the library's wrapHandler: with the status and code of this answer, and a
// trace without any call's arguments).
$errorMiddleware->setDefaultErrorHandler($errorLog->wrapHandler(function (\Psr\Http\Message\ServerRequestInterface $request, \Throwable $exception, bool $displayErrorDetails) use ($app) {
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
    } elseif ($exception instanceof NotSetUpException) {
        // A config file that went missing after the SiteGate let the request
        // in. The same answer as the gate's, rather than a bare 500.
        return siteNotSetUpResponse($request, $app->getResponseFactory());
    } elseif ($exception instanceof ApiRefusal) {
        // An answer the work decided on (helpers.php), not a failure: no PHP
        // log line, no trace in the error log (siteErrorLog()'s
        // ignoreExceptions) - the answer's own line below records it as it
        // would any answer a route returns, when the error log's rule takes
        // its status. (The owner routes answer their own, in requireOwner(),
        // with ownerPrivate()'s headers.)
        return apiRefusalResponse($exception);
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
}));

// Many answers never reach the handler above, because a route returns them
// rather than throwing - a row that is not there, a 503 a store could not
// keep. The error log reads those off the answer instead (the library's outer
// middleware: an answer its rule takes - every 5xx, and 404, 405, 413, 415,
// 429, the family's - that no exception's line said already; its code and
// sentence, never its body). A refused token or role, a 409 or a 422 is the
// API doing its job, and is not written, nor an answer that says a state the
// site is in - closed, an update or a table waiting (SITE_EXPECTED_ANSWERS,
// siteErrorLog()). Outside the error middleware, so it sees what that
// answered too; the log's own routes are never written into it.
$app->add(ErrorLogMiddleware::outer($errorLog));

// No CORS: the pages and the API are one origin everywhere - the web root in
// production, ng serve's proxy (frontend/proxy.conf.json) in development - and
// no other site calls this API from a browser. A cross-origin caller gets no
// CORS header, and its browser keeps the answer from it.

// Baseline security headers on every response. None of these is load-bearing on
// its own; together they are the cheap layer that turns a small mistake into a
// non-event - nosniff stops content-type guessing, the frame headers stop the
// admin panel being framed, HSTS pins HTTPS once the connection is already on it.
$app->add(function ($request, $handler) {
    $response = $handler->handle($request);

    // A route that already set one of these knows its own needs better - the
    // raw-file route, for instance, sets a sandbox CSP that this must not
    // clobber - so each header is only filled in where it is missing.
    $ensure = function ($response, $name, $value) {
        return $response->hasHeader($name) ? $response : $response->withHeader($name, $value);
    };

    $response = $ensure($response, 'X-Content-Type-Options', 'nosniff');
    $response = $ensure($response, 'X-Frame-Options', 'DENY');
    $response = $ensure($response, 'Referrer-Policy', 'strict-origin-when-cross-origin');
    // A JSON API loads nothing, so it can afford the strictest policy; this
    // does not govern the Angular app, which is served separately.
    $response = $ensure($response, 'Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");

    // Only meaningful over HTTPS, and setting it over plain HTTP is pointless
    // rather than harmful - so it is sent only when the request already arrived
    // securely.
    if ($request->getUri()->getScheme() === 'https') {
        $response = $ensure($response, 'Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    return $response;
});

// Let a POST stand in for a PUT/PATCH when the client asks (X-Http-Method-Override).
// PHP only populates $_POST/$_FILES for POST multipart, not for PUT or PATCH, so
// a multipart update sent as a real PUT arrives with an empty body and silently
// does nothing. The front end sends those updates as POST with this header; added
// last so it runs first and the true method is set before anything routes on it.
$app->add(new \Slim\Middleware\MethodOverrideMiddleware());

// The API-client generator loads this file purely to read the route table, and
// must not serve a request while doing it. What a request queued for after its
// answer (the visitors' sweep, the people's scrub, the day's backup, feedback's
// pruning - after_response.php) runs once the answer is out.
if (!defined('ANOTOKI_ROUTES_ONLY')) {
    $app->run();
    afterResponseRun();
}
