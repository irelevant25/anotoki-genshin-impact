<?php

/**
 * Where the site stands, for every request: not set up, a database update
 * waiting, the database out of reach, or ready - anotoki/lib's SiteState,
 * built from what this site knows, and its SiteGate in front of every route
 * (api/index.php). Every anotoki site behaves the same way here, the owner's
 * request of 2026-10-07:
 *
 * - not set up (a config/*.local.php file missing or unusable, see
 *   config/local.php): every API path answers 503 `not_set_up`, pointing at
 *   /setup.php only while the site was never installed - once its installer
 *   has finished on a host (storage/installed.lock) nobody is sent there again;
 * - an update waiting (a migration file the database has not run): every API
 *   path answers 503 `update_pending` with Retry-After, but for
 *   SITE_OPEN_WHILE_UPDATING - so people can still sign in, the pages have
 *   their words, and an administrator reaches the Migrations page and Apply;
 * - the database out of reach, or ready: everything passes, and the site's own
 *   error handling answers a dead database as it always did.
 *
 * GET /api/site-status says which, to anybody; the pages ask it as they start
 * (@anotoki/lib/migrations) and draw "The site is being updated" for everybody
 * but the site's ADMIN, who is shown the way to the Migrations page.
 */

use Anotoki\Lib\Backups\Http\BackupsRoutes;
use Anotoki\Lib\ErrorLog\Http\ErrorLogRoutes;
use Anotoki\Lib\Migrations\Http\SiteGate;
use Anotoki\Lib\Migrations\Http\SiteState;
use Anotoki\Lib\Migrations\Migrator;
use Anotoki\Lib\Translations\Http\TranslationsRoutes;
use Psr\Http\Message\ResponseFactoryInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * The paths that answer while a database update waits - and nothing else,
 * each because without it nobody could get to Apply. Exact paths, or a
 * pattern when it starts with `~` (matched against the decoded path, as the
 * router reads it).
 *
 * define() rather than const: the words' path is the library's to say
 * (TranslationsRoutes::openPath()), and a const cannot ask it.
 */
define('SITE_OPEN_WHILE_UPDATING', [
    // The boot: where the IAM is and whether it requires signing in, and
    // whether the site is closed for maintenance.
    '/api/settings/public',
    // Who is signed in - the pages' idea of who is an ADMIN. Only the users
    // table, which is there from users/001 on.
    '/api/me',
    // The pages' words in one language, with the languages on offer beside
    // them: /api/translations/{code} exactly, one segment and nothing after.
    TranslationsRoutes::openPath(),
    // The Migrations page: what has run and what waits, a file's SQL, and
    // Apply - for this site's ADMIN, judged by the token alone. Exactly those
    // three: a crafted path under them (dot segments, %2e%2e) stays held.
    '~^/api/admin/migrations(/file|/apply)?$~D',
    // The error log and the backups (the anotoki library's admin tools): they
    // need no table, so they work while the update waits - what failed, and a
    // backup taken just before Apply, are the point. Exactly their routes as
    // the library names them, a backup's restore never among them; for this
    // site's ADMIN, judged by the token alone.
    ...ErrorLogRoutes::openPaths(),
    ...BackupsRoutes::openPaths(),
]);

/** Whether the installer finished on a real host: it writes storage/installed.lock there - never on this computer. */
function siteInstalled(): bool
{
    return is_file(dirname(__DIR__) . '/storage/installed.lock');
}

/**
 * The site's state, asked afresh on every request (one PHP process may serve
 * many, and an update may be applied between two of them).
 */
function siteState(): SiteState
{
    static $state = null;

    return $state ??= new SiteState(
        // What setup.php would fix, the first thing it says - null when nothing.
        settingsProblem: fn (): ?string => localConfigProblems()[0] ?? null,
        installed: fn (): bool => siteInstalled(),
        // Only asked once the settings are complete. A database that does not
        // answer is `unavailable`, not an update.
        migrator: fn (): Migrator => siteMigrator(getDb()),
    );
}

/**
 * The SiteGate's own not_set_up answer, for a request that met a missing
 * setting after the gate had let it in (the default error handler, on a
 * NotSetUpException). The gate reads the same config files, once a request,
 * so this should never be needed - but if it is, the answer is the gate's,
 * word for word, and offers the setup page only while the site was never
 * installed.
 */
function siteNotSetUpResponse(ServerRequestInterface $request, ResponseFactoryInterface $responses): ResponseInterface
{
    $notSetUp = new SiteState(
        settingsProblem: fn (): string => 'a setting went missing during the request',
        installed: fn (): bool => siteInstalled(),
        migrator: fn (): Migrator => throw new LogicException('A site that is not set up has no migrations to ask.'),
    );

    // No status path ("\0" is no path's): whatever the request was for, it
    // gets the answer.
    $gate = new SiteGate($notSetUp, $responses, [], "\0", SETUP_PATH);

    return $gate->process($request, new class implements RequestHandlerInterface {
        public function handle(ServerRequestInterface $request): ResponseInterface
        {
            throw new LogicException('The not-set-up answer passes nothing on.');
        }
    });
}
