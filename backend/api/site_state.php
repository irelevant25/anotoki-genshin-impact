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
 * - closed for maintenance (anotoki-lib 0.11.0, the site settings' Getting in:
 *   a ready site its administrators closed on the admin Site settings page):
 *   every API path answers 503 `maintenance` with Retry-After and what they
 *   wrote, but for SITE_OPEN_WHILE_UPDATING, the site settings' reserved API
 *   paths (SITE_RESERVED_API_PATHS and the library's own) and the two links an
 *   ADMIN's browser opens by itself (MAINTENANCE_SIGNED_LINKS) - and to this
 *   site's ADMIN, judged by the token (maintenanceExempt()), who uses the site
 *   as it is;
 * - the database out of reach, or ready: everything passes, and the site's own
 *   error handling answers a dead database as it always did.
 *
 * GET /api/site-status says which, to anybody; the pages ask it as they start
 * (@anotoki/lib/migrations) and draw "The site is being updated" for everybody
 * but the site's ADMIN, who is shown the way to the Migrations page - and,
 * while the site is closed, the library's closed sign for everybody but its
 * ADMIN (Sign in at /staff alone).
 */

use Anotoki\Lib\Auth\Http\AuthRoutes;
use Anotoki\Lib\Backups\Backups;
use Anotoki\Lib\Backups\Http\BackupsRoutes;
use Anotoki\Lib\ErrorLog\Http\ErrorLogRoutes;
use Anotoki\Lib\Migrations\Http\SiteGate;
use Anotoki\Lib\Migrations\Http\SiteState;
use Anotoki\Lib\Migrations\Migrator;
use Anotoki\Lib\SiteSettings\SiteSettings;
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
    // The boot: where the IAM is and whether it requires signing in.
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

/**
 * The API paths no row of Page access may claim, and that answer while the
 * site is closed for maintenance, each itself and everything under it -
 * beside the ones the library reserves by itself (the site's status, the
 * words' bundles, the site settings' own two): who the reader is (/api/me),
 * and the boot's answer - where the IAM is and whether it requires signing in,
 * this site's sign-in configuration (/api/settings/public) - with the
 * library's own path for that besides (AuthRoutes::openPath(), which this site
 * does not answer: no row may claim it either). Checked both ways by the
 * library: '/api' covers /api/me and '/api/me/x' is inside it, so neither may
 * be saved - the paths genshin's own page table refused (/api/me,
 * /api/settings, /api/site-routes, /api/site-status, /api/translations), the
 * old settings' and routes' paths now the library's /api/site-settings and
 * /api/admin/site-settings.
 */
define('SITE_RESERVED_API_PATHS', ['/api/me', '/api/settings/public', AuthRoutes::openPath()]);

/**
 * The two links an ADMIN's browser opens by itself, with no token to send - a
 * backup's download (its single-use ticket its only check) and a file's
 * preview in the file explorer (signed for five minutes): open while the site
 * is closed for maintenance, as they were behind this site's own maintenance
 * gate. Only an ADMIN gets either link, from routes nobody else reaches while
 * the site is closed, so opening them opens nothing. (The backups' download
 * is among SITE_OPEN_WHILE_UPDATING's paths too.)
 */
define('MAINTENANCE_SIGNED_LINKS', ['~^/api/admin/backups/' . Backups::ID_PATTERN . '/file$~D', '~^/api/admin/files/raw$~D']);

/**
 * The site settings - the switches this site's administrators throw without a
 * deploy, on the admin panel's Site settings page (anotoki-lib 0.11.0: genshin's
 * own, made the family's) - all three of the library's parts: Getting in (the
 * site closed for maintenance to everybody but its ADMIN, and what the
 * maintenance page says), the Announcement (a bar above every page) and Page
 * access (who sees each page, a page switched off, the API paths refused with
 * it). In the library's tables (anotoki_admin/003; users/066 brought genshin's
 * own rows across), read afresh for every question.
 */
function siteSettings(): SiteSettings
{
    static $settings = null;

    return $settings ??= new SiteSettings(
        // Asked only when a question needs the tables: a site that is not set up has no connection to give.
        pdo: static fn(): PDO => getDb(),
        parts: SiteSettings::PARTS,
        reservedApiPaths: SITE_RESERVED_API_PATHS,
    );
}

/**
 * Who the SiteGate lets past while the site is closed for maintenance: this
 * site's ADMIN, by the token - the gate runs before the site identifies the
 * request (meddleware/auth.php), so it checks the token itself, with the same
 * key set and rules as Identify; a token that does not verify is nobody -
 * and the two links an ADMIN's browser opens by itself (MAINTENANCE_SIGNED_LINKS).
 * Whoever closed the site must be able to use it and open it again: no lockout.
 */
function maintenanceExempt(ServerRequestInterface $request): bool
{
    return gatePathOpen(gatePath($request), MAINTENANCE_SIGNED_LINKS) || (siteAccessTokens()->personOf($request)?->isAdmin() ?? false);
}

/** Whether the installer finished on a real host: it writes storage/installed.lock there - never on this computer. */
function siteInstalled(): bool
{
    return is_file(siteStateRoot() . '/storage/installed.lock');
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
        settingsProblem: fn(): ?string => localConfigProblems()[0] ?? null,
        installed: fn(): bool => siteInstalled(),
        // Only asked once the settings are complete. A database that does not
        // answer is `unavailable`, not an update.
        migrator: fn(): Migrator => siteMigrator(getDb()),
        // Closed for maintenance: a ready site whose administrators closed it
        // (the status path says `maintenance`, the SiteGate answers 503).
        settings: siteSettings(),
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
        settingsProblem: fn(): string => 'a setting went missing during the request',
        installed: fn(): bool => siteInstalled(),
        migrator: fn(): Migrator => throw new LogicException('A site that is not set up has no migrations to ask.'),
    );

    // No status path ("\0" is no path's): whatever the request was for, it
    // gets the answer.
    $gate = new SiteGate($notSetUp, $responses, [], "\0", SETUP_PATH);

    return $gate->process(
        $request,
        new class implements RequestHandlerInterface {
            public function handle(ServerRequestInterface $request): ResponseInterface
            {
                throw new LogicException('The not-set-up answer passes nothing on.');
            }
        },
    );
}
