<?php

declare(strict_types=1);

/**
 * robots.txt and sitemap.xml (anotoki-lib 0.11.0: the library's Robots, set up for this site in api/robots.php),
 * through the whole API (api/index.php) - every gate, the library's routes behind them - run in this process against
 * a database of the test's own, built by every migration, on a backend copy of its own (tests/db_lib.php) whose
 * config/app.local.php names the site's address:
 *
 *   - robots.txt: every robot kept out of /admin, /api, /auth and /staff; the sitemap named at the configured
 *     address - never the request's Host, which is anybody's to write; public, kept an hour;
 *   - sitemap.xml: valid XML, every public page and every live character, weapon, artifact set, food and material -
 *     each its own page, with the day it last changed - each once, absolute; a deleted row, the Profile, the daily's
 *     eight, /staff and the
 *     admin panel left out; what Page access hides left out, and made again at once when that changes (a :id row
 *     hiding every character's page); otherwise kept an hour;
 *   - both behind every gate: 503 while the site is closed for maintenance, 401 while the IAM requires signing in.
 *
 * Without app.local.php - a checkout's address, a release's - and with one passed over: tests/settings-files.test.php.
 */

use Psr\Http\Message\ResponseInterface;
use Slim\Psr7\Factory\ServerRequestFactory;
use Slim\Psr7\Factory\StreamFactory;

require __DIR__ . '/lib.php';
require __DIR__ . '/db_lib.php';

testNeedsDatabase();

const ADDRESS = 'https://genshin.example';

$database = testDatabase('robots');
$iamDir = testTempDir('iam');
$iam = testIam($iamDir);
$applicationFile = "$iamDir/application.json";
file_put_contents($applicationFile, json_encode(['client_id' => 'genshin', 'name' => 'Genshin', 'login_required' => false]));
$backend = testBackendCopy($database, ['jwks_file' => $iam['jwks'], 'application_file' => $applicationFile]);
// As an owner writes it by hand, a slash at its end and all: read as the origin.
file_put_contents("$backend/config/app.local.php", "<?php\n\nreturn ['url' => '" . ADDRESS . "/'];\n");

define('ANOTOKI_ROUTES_ONLY', true);
require "$backend/api/index.php";

$built = siteMigrator(getDb())->apply();
check('a database built by every migration', $built['error'] === null, (string) $built['error']);

$admin = $iam['token'](1, ['MEMBER', 'ADMIN']);

/** One request through the whole app, to $url (a path, or an address whose host the request names). */
function ask(string $method, string $url, ?string $token = null, ?array $json = null): ResponseInterface
{
    global $app;
    $request = (new ServerRequestFactory())->createServerRequest($method, str_starts_with($url, 'http') ? $url : 'http://localhost' . $url, ['REMOTE_ADDR' => '127.0.0.1']);
    if ($token !== null) {
        $request = $request->withHeader('Authorization', 'Bearer ' . $token);
    }
    if ($json !== null) {
        $request = $request->withHeader('Content-Type', 'application/json')->withBody((new StreamFactory())->createStream((string) json_encode($json)));
    }

    return $app->handle($request);
}

/** Whether the sitemap lists an address (its lastmod may be null). */
function listed(?array $urls, string $url): bool
{
    return $urls !== null && array_key_exists($url, $urls);
}

/** The sitemap's addresses, each with its lastmod (null for none), in its order - or null when it is no sitemap. */
function sitemapUrls(ResponseInterface $response): ?array
{
    $document = new DOMDocument();
    if (!@$document->loadXML((string) $response->getBody(), LIBXML_NONET)) {
        return null;
    }
    $root = $document->documentElement;
    if ($root === null || $root->localName !== 'urlset' || $root->namespaceURI !== 'http://www.sitemaps.org/schemas/sitemap/0.9') {
        return null;
    }
    $urls = [];
    foreach ($root->getElementsByTagName('url') as $url) {
        $lastmod = $url->getElementsByTagName('lastmod')->item(0);
        $urls[(string) $url->getElementsByTagName('loc')->item(0)?->textContent] = $lastmod?->textContent;
    }

    return $urls;
}

$pdo = getDb();

// The database's own pages: two live characters, one deleted; a weapon; an artifact set, and one deleted; a food; a
// material, and one deleted.
$character = static function (string $name, bool $deleted, string $created, ?string $updated) use ($pdo): int {
    $statement = $pdo->prepare(
        "INSERT INTO characters (name, element, weapon_type, rarity, model, namecard_description, version, voice_actor_english, voice_actor_japanese, voice_actor_korean, voice_actor_chinese, created_by, deleted, created_at, updated_at)
         VALUES (?, 'Anemo', 'Sword', 4, 'Medium Female', 'x', '1.0', 'x', 'x', 'x', 'x', 1, ?, ?, ?) RETURNING id",
    );
    $statement->execute([$name, $deleted ? 'true' : 'false', $created, $updated]);

    return (int) $statement->fetchColumn();
};
$amber = $character('Amber', false, '2026-01-02 10:00:00', null);
$hutao = $character('Hu Tao', false, '2026-01-02 10:00:00', '2026-03-04 05:06:07');
$gone = $character('Gone', true, '2026-01-02 10:00:00', null);
$weapon = (int) $pdo->query("INSERT INTO weapons (name, type, rarity, created_by, created_at) VALUES ('Dull Blade', 'Sword', 1, 1, '2026-02-03 00:00:00') RETURNING id")->fetchColumn();
$artifact = (int) $pdo->query("INSERT INTO artifacts (name, created_by, created_at) VALUES ('Adventurer', 1, '2026-02-05 00:00:00') RETURNING id")->fetchColumn();
$goneArtifact = (int) $pdo->query("INSERT INTO artifacts (name, created_by, deleted) VALUES ('Old Adventurer', 1, TRUE) RETURNING id")->fetchColumn();
$food = (int) $pdo->query("INSERT INTO foods (name, created_by, created_at, updated_at) VALUES ('Sweet Madame', 1, '2026-02-06 00:00:00', '2026-02-07 08:00:00') RETURNING id")->fetchColumn();
$material = (int) $pdo->query("INSERT INTO materials (name, created_by, created_at) VALUES ('Mora', 1, '2026-02-04 23:59:59') RETURNING id")->fetchColumn();
$goneMaterial = (int) $pdo->query("INSERT INTO materials (name, created_by, deleted) VALUES ('Old Mora', 1, TRUE) RETURNING id")->fetchColumn();

// ── robots.txt ──────────────────────────────────────────────────────────────

echo "robots.txt\n";

$robots = ask('GET', '/robots.txt');
$lines = array_values(array_filter(array_map('trim', explode("\n", (string) $robots->getBody())), static fn(string $line): bool => $line !== '' && !str_starts_with($line, '#')));
same(
    'every robot kept out of the admin panel, the API, the sign-in\'s way back and /staff; the sitemap at the configured address',
    ['User-agent: *', 'Disallow: /admin', 'Disallow: /api', 'Disallow: /auth', 'Disallow: /staff', 'Sitemap: ' . ADDRESS . '/sitemap.xml'],
    $lines,
);
same(
    '...200, plain text, public for an hour',
    [200, 'text/plain; charset=utf-8', 'public, max-age=3600'],
    [$robots->getStatusCode(), $robots->getHeaderLine('Content-Type'), $robots->getHeaderLine('Cache-Control')],
);
check(
    'asked under another name (its Host anybody\'s to write): the sitemap still the configured address',
    str_contains((string) ask('GET', 'https://evil.example/robots.txt')->getBody(), 'Sitemap: ' . ADDRESS . '/sitemap.xml') &&
        !str_contains((string) ask('GET', 'https://evil.example/robots.txt')->getBody(), 'evil.example'),
);
same('HEAD: 200', 200, ask('HEAD', '/robots.txt')->getStatusCode());

// ── sitemap.xml ─────────────────────────────────────────────────────────────

echo "sitemap.xml\n";

$cache = "$backend/storage/cache/anotoki-sitemap.json";
@unlink($cache);
$sitemap = ask('GET', '/sitemap.xml');
$urls = sitemapUrls($sitemap);
same(
    '200, XML, public for an hour',
    [200, 'application/xml; charset=utf-8', 'public, max-age=3600', true],
    [$sitemap->getStatusCode(), $sitemap->getHeaderLine('Content-Type'), $sitemap->getHeaderLine('Cache-Control'), $urls !== null],
);
$pages = array_map(static fn(string $path): string => ADDRESS . ($path === '/' ? '/' : $path), SITEMAP_PAGES);
same(
    'every public page, then every live character, weapon, artifact set, food and material - absolute, at the configured address',
    [
        ...$pages,
        ADDRESS . "/database/characters/$amber",
        ADDRESS . "/database/characters/$hutao",
        ADDRESS . "/database/weapons/$weapon",
        ADDRESS . "/database/artifacts/$artifact",
        ADDRESS . "/database/foods/$food",
        ADDRESS . "/database/materials/$material",
    ],
    array_keys($urls ?? []),
);
same(
    '...each entry with the day its row last changed (updated, else created); the pages with none',
    [null, '2026-01-02', '2026-03-04', '2026-02-03', '2026-02-05', '2026-02-07', '2026-02-04'],
    [
        listed($urls, ADDRESS . '/') ? $urls[ADDRESS . '/'] : 'missing',
        $urls[ADDRESS . "/database/characters/$amber"] ?? 'missing',
        $urls[ADDRESS . "/database/characters/$hutao"] ?? 'missing',
        $urls[ADDRESS . "/database/weapons/$weapon"] ?? 'missing',
        $urls[ADDRESS . "/database/artifacts/$artifact"] ?? 'missing',
        $urls[ADDRESS . "/database/foods/$food"] ?? 'missing',
        $urls[ADDRESS . "/database/materials/$material"] ?? 'missing',
    ],
);
same(
    'never a deleted row, the Profile, the daily\'s eight, /staff, the sign-in\'s way back or the admin panel',
    [],
    array_values(
        array_filter(
            array_keys($urls ?? []),
            static fn(string $url): bool => in_array(
                $url,
                [ADDRESS . "/database/characters/$gone", ADDRESS . "/database/artifacts/$goneArtifact", ADDRESS . "/database/materials/$goneMaterial", ADDRESS . '/profile', ADDRESS . '/staff'],
                true,
            ) || preg_match('~/(daily/|auth|admin)~', $url) === 1,
        ),
    ),
);
same('asked under another name: the same addresses', array_keys($urls ?? []), array_keys(sitemapUrls(ask('GET', 'https://evil.example/sitemap.xml')) ?? []));
check('kept in storage/cache for the next hour', is_file($cache));

$later = $character('Later', false, '2026-04-05 10:00:00', null);
check('a character added meanwhile: the kept sitemap answers, without it, for the hour', !listed(sitemapUrls(ask('GET', '/sitemap.xml')), ADDRESS . "/database/characters/$later"));

// Page access, through the admin Site settings page's routes: the rows users/066 brought from 035's seed - /games for
// people signed in, every character's page switched off.
$rows = [];
foreach (json_decode((string) ask('GET', '/api/admin/site-settings', $admin)->getBody(), true)['pages'] ?? [] as $row) {
    $rows[$row['path']] = $row['id'];
}
same(
    'Page access: /games for people signed in, every character\'s page switched off - saved',
    200,
    ask('PUT', '/api/admin/site-settings/pages', $admin, [
        'pages' => [['id' => $rows['/games'] ?? 0, 'visibility' => 'USER'], ['id' => $rows['/database/characters/:id'] ?? 0, 'blocked' => true]],
    ])->getStatusCode(),
);
$urls = sitemapUrls(ask('GET', '/sitemap.xml'));
same(
    '...made again at once, without what they hide: /games and every character\'s page gone - the character added meanwhile with them',
    [false, false, false, false],
    [
        listed($urls, ADDRESS . '/games'),
        listed($urls, ADDRESS . "/database/characters/$amber"),
        listed($urls, ADDRESS . "/database/characters/$hutao"),
        listed($urls, ADDRESS . "/database/characters/$later"),
    ],
);
same(
    '...the rest still there: /games/tournament (a row of its own), the characters\' list, the weapon, the material',
    [true, true, true, true],
    [
        listed($urls, ADDRESS . '/games/tournament'),
        listed($urls, ADDRESS . '/database/characters'),
        listed($urls, ADDRESS . "/database/weapons/$weapon"),
        listed($urls, ADDRESS . "/database/materials/$material"),
    ],
);
$pdo->exec('DELETE FROM anotoki_page_access');
same('every row removed: the characters back, the one added meanwhile among them', true, listed(sitemapUrls(ask('GET', '/sitemap.xml')), ADDRESS . "/database/characters/$later"));

// ── Behind the gates ────────────────────────────────────────────────────────

echo "Behind every gate, as any route\n";

$pdo->exec("INSERT INTO anotoki_site_settings (name, value) VALUES ('maintenance_mode', 'true') ON CONFLICT (name) DO UPDATE SET value = EXCLUDED.value");
$closedRobots = ask('GET', '/robots.txt');
same(
    'closed for maintenance: 503 maintenance with Retry-After, both - a robot keeps what it had',
    [503, 'maintenance', '300', 503],
    [$closedRobots->getStatusCode(), json_decode((string) $closedRobots->getBody(), true)['code'] ?? null, $closedRobots->getHeaderLine('Retry-After'), ask('GET', '/sitemap.xml')->getStatusCode()],
);
same('...the ADMIN reads them as they are', [200, 200], [ask('GET', '/robots.txt', $admin)->getStatusCode(), ask('GET', '/sitemap.xml', $admin)->getStatusCode()]);
$pdo->exec("UPDATE anotoki_site_settings SET value = 'false' WHERE name = 'maintenance_mode'");

file_put_contents($applicationFile, json_encode(['client_id' => 'genshin', 'name' => 'Genshin', 'login_required' => true]));
same(
    'the IAM requiring signing in: 401 sign_in_required, as every path but what the sign-in card needs',
    [401, 401],
    [ask('GET', '/robots.txt')->getStatusCode(), ask('GET', '/sitemap.xml')->getStatusCode()],
);
file_put_contents($applicationFile, json_encode(['client_id' => 'genshin', 'name' => 'Genshin', 'login_required' => false]));
