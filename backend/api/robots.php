<?php

/**
 * robots.txt and sitemap.xml - the owner's request of 2026-10-25: every anotoki
 * site answers both from its PHP, through the anotoki library's Robots
 * (anotoki-lib 0.11.0), never from a static file of the app, which knows
 * neither the site's address nor what Page access hides. Their routes are put
 * up in api/index.php (the library's RobotsRoutes), and the front controller
 * is given both beside /api (backend/composer.json's extra["anotoki-deploy"]
 * routes; frontend/proxy.conf.json and router.php in development).
 *
 * - robots.txt keeps every robot out of the admin panel, the API and the
 *   sign-in's way back (the library's /admin, /api, /auth) and out of /staff,
 *   the administrators' sign-in; then names the sitemap at this site's own
 *   address (config/app.php: config/app.local.php's url, else where the code
 *   runs - a release's https://genshin.anotoki.eu, a checkout's
 *   http://localhost:4200; never the request's Host).
 * - sitemap.xml lists the public pages below and every character, weapon,
 *   artifact set, food and material the database pages show (each has a page
 *   of its own), with the
 *   day it last changed - leaving out a deleted row, what Page access hides (a
 *   page for people signed in, editors or administrators, or one switched off,
 *   matched as the guard matches: a /database/characters/:id row hides every
 *   character) and what robots.txt keeps out. Kept an hour in storage/cache,
 *   made again at once when what Page access hides or the address changes.
 *
 * Both answer behind every gate, as any route: while the site is not set up,
 * waits for an update or is closed for maintenance a robot is told 503 with
 * Retry-After and keeps what it had; while the IAM requires signing in, 401.
 */

use Anotoki\Lib\Robots\Robots;

/**
 * The public pages a robot is pointed at - every one anybody reads without
 * signing in, whose words are worth finding. Not /profile (a reader's own
 * games, empty for a robot), the daily's eight (today's question of the quizzes
 * below, under another address), /staff or the sign-in's way back.
 */
const SITEMAP_PAGES = [
    '/',
    '/daily',
    '/quizzes',
    '/quizzes/banners',
    '/quizzes/constellation',
    '/quizzes/dish',
    '/quizzes/mismatch',
    '/quizzes/music',
    '/quizzes/pixelate',
    '/quizzes/splash',
    '/quizzes/voice',
    '/games',
    '/games/tournament',
    '/games/minesweeper',
    '/database',
    '/database/characters',
    '/database/weapons',
    '/database/artifacts',
    '/database/foods',
    '/database/materials',
    '/database/banners',
    '/about',
    '/support',
    '/terms',
    '/privacy',
    '/contact',
];

/**
 * The database's own pages: a table each, the path its rows' pages have
 * (sites/main/main.routes.ts: /database/{list}/:id, the row's id). Enemies
 * and banners have no page of their own (the Banners page is one timeline).
 * $table is one of these literals, never a request's.
 */
const SITEMAP_ENTRY_TABLES = [
    'characters' => '/database/characters/',
    'weapons' => '/database/weapons/',
    'artifacts' => '/database/artifacts/',
    'foods' => '/database/foods/',
    'materials' => '/database/materials/',
];

function siteRobots(): Robots
{
    static $robots = null;

    return $robots ??= new Robots(
        address: static fn(): string => siteAddress(),
        // The administrators' sign-in, which the closed sign's Sign in stands at: nothing there to find.
        disallow: ['/staff'],
        pages: SITEMAP_PAGES,
        entries: sitemapEntries(...),
        settings: siteSettings(),
        cacheFile: siteStorageDir() . '/cache/anotoki-sitemap.json',
    );
}

/**
 * Every live character, weapon, artifact set, food and material, its page's path and the day it
 * last changed (its row's updated_at, or created_at for a row never changed -
 * the day alone: the stamps are the database server's zone, and a day is all
 * a sitemap needs). A deleted row has no page anybody is led to.
 *
 * @return iterable<array{path: string, lastmod: ?string}>
 */
function sitemapEntries(): iterable
{
    $pdo = genshinDb();
    foreach (SITEMAP_ENTRY_TABLES as $table => $base) {
        $rows = $pdo->query("SELECT id, to_char(COALESCE(updated_at, created_at), 'YYYY-MM-DD') AS lastmod FROM $table WHERE deleted = FALSE ORDER BY id");
        foreach ($rows->fetchAll(PDO::FETCH_ASSOC) as $row) {
            yield ['path' => $base . (int) $row['id'], 'lastmod' => $row['lastmod']];
        }
    }
}
