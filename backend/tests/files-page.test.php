<?php

declare(strict_types=1);

/**
 * The Files page's routes through the whole API (api/index.php), on a database
 * of the test's own and a backend copy of its own (tests/db_lib.php), with
 * banner art in the copy's own asset tree:
 *
 * PUT /api/files/{id}/name, its Rename -
 *   - a name whose dots land on the file's own - "7.1 - X" typed for the file
 *     called "7-1 - X" (genshin, 2026-10-28) - is no rename, and says why: a
 *     file's name keeps only the dot before its extension (_assetUploadStem());
 *   - its own name typed back, dotted or not, is "It is already called that";
 *   - a name whose dots lead onto another file, on disk or only in the
 *     catalogue, says what it would have been;
 *   - a dotted name that is free lands dashed, and the file with it.
 *
 * GET /api/files/uncatalogued, its "not in the database" - each file on disk
 * with no row, with the category whose folder holds it, or none.
 *
 * POST /api/files/reconcile, its Add strays to database - what became of each
 * file (added where it is, moved into unfiled/ and added, its size brought up
 * to date), the rows it gave a picture to - a banner's found under the name an
 * upload gives it, "7-4 - ...", not "7.4 - ..." - and an audit entry of counts
 * alone.
 */

use Psr\Http\Message\ResponseInterface;
use Slim\Psr7\Factory\ServerRequestFactory;
use Slim\Psr7\Factory\StreamFactory;

require __DIR__ . '/lib.php';
require __DIR__ . '/db_lib.php';

testNeedsDatabase();

$database = testDatabase('files_page');
$iamDir = testTempDir('iam');
$iam = testIam($iamDir);
$applicationFile = "$iamDir/application.json";
file_put_contents($applicationFile, json_encode(['client_id' => 'genshin', 'name' => 'Genshin', 'login_required' => false]));
$backend = testBackendCopy($database, ['jwks_file' => $iam['jwks'], 'application_file' => $applicationFile]);

define('ANOTOKI_ROUTES_ONLY', true);
require "$backend/api/index.php";

$built = siteMigrator(getDb())->apply();
check('a database built by every migration', $built['error'] === null, (string) $built['error']);

// The copy keeps its tree in itself (it has no composer.json): never the checkout's.
$assets = str_replace('\\', '/', _assetsRoot());
if (!str_starts_with($assets, $backend . '/')) {
    check('the asset tree is the backend copy\'s own', false, $assets);
    exit(1);
}
$tree = "$assets/banners";
mkdir($tree, 0777, true);

const EDITOR = 2;
$editor = $iam['token'](EDITOR, ['MEMBER', 'EDITOR']);

/** One request as an EDITOR, as the Files page sends it. */
function send(string $method, string $path, ?array $json = null): ResponseInterface
{
    global $app, $editor;
    $request = (new ServerRequestFactory())->createServerRequest($method, "http://localhost$path", ['REMOTE_ADDR' => '127.0.0.1'])->withHeader('Authorization', "Bearer $editor");
    if ($json !== null) {
        $request = $request->withHeader('Content-Type', 'application/json')->withBody((new StreamFactory())->createStream((string) json_encode($json)));
    }

    return $app->handle($request);
}

function body(ResponseInterface $response): mixed
{
    return json_decode((string) $response->getBody(), true);
}

/** A rename's status, and the name it says or why it refused. */
function said(ResponseInterface $response): array
{
    $answer = body($response);

    return [$response->getStatusCode(), $answer['error'] ?? ($answer['name'] ?? null)];
}

$pdo = getDb();
$banners = (int) $pdo->query("SELECT id FROM file_categories WHERE code = 'banners'")->fetchColumn();

/** Banner art in the catalogue by its name without the extension - on disk too, but where it is not - and its row's id. */
function banner(string $name, bool $onDisk = true): int
{
    global $pdo, $banners, $tree;
    if ($onDisk) {
        file_put_contents("$tree/$name.avif", 'art');
    }
    $insert = $pdo->prepare("INSERT INTO files (category_id, name, extension, size) VALUES (?, ?, 'avif', 3) RETURNING id");
    $insert->execute([$banners, $name]);

    return (int) $insert->fetchColumn();
}

// ── The Rename ───────────────────────────────────────────────────────────────

$dashed = banner("7-1 - Void Star's Advent 2026-10-13");
$dotted = banner('7.0 - Astral Actuation 2026-09-01');
banner('7-2 - Surging Ballad 2026-09-23');
banner('7-3 - Only In The Catalogue', onDisk: false);

$rule = "A file's name keeps only the dot before its extension - every other dot becomes a dash - so";

same(
    'a dotted name that lands on the file\'s own says why it is no rename',
    [409, "$rule \"7.1 - Void Star's Advent 2026-10-13\" is \"7-1 - Void Star's Advent 2026-10-13\", the name it has already"],
    said(send('PUT', "/api/files/$dashed/name", ['name' => "7.1 - Void Star's Advent 2026-10-13"])),
);
same('its own name typed back', [409, 'It is already called that'], said(send('PUT', "/api/files/$dashed/name", ['name' => "7-1 - Void Star's Advent 2026-10-13"])));
same('a dotted file\'s own name typed back, no order to dash it', [409, 'It is already called that'], said(send('PUT', "/api/files/$dotted/name", ['name' => '7.0 - Astral Actuation 2026-09-01'])));
same(
    'a dotted name that leads onto another file says what it would be',
    [409, "$rule \"7.2 - Surging Ballad 2026-09-23\" would be \"7-2 - Surging Ballad 2026-09-23\", and something is already called that here"],
    said(send('PUT', "/api/files/$dotted/name", ['name' => '7.2 - Surging Ballad 2026-09-23'])),
);
same(
    'and onto a name only the catalogue has',
    [409, "$rule \"7.3 - Only In The Catalogue\" would be \"7-3 - Only In The Catalogue\", and the catalogue already has that name here"],
    said(send('PUT', "/api/files/$dotted/name", ['name' => '7.3 - Only In The Catalogue'])),
);
check('nothing was renamed meanwhile', is_file("$tree/7-1 - Void Star's Advent 2026-10-13.avif") && is_file("$tree/7.0 - Astral Actuation 2026-09-01.avif"));

same('a dotted name that is free lands dashed', [200, '7-9 - Astral Actuation 2026-09-01'], said(send('PUT', "/api/files/$dotted/name", ['name' => '7.9 - Astral Actuation 2026-09-01'])));
check('and the file with it', is_file("$tree/7-9 - Astral Actuation 2026-09-01.avif") && !is_file("$tree/7.0 - Astral Actuation 2026-09-01.avif"));

// ── Not in the database, and Add strays to database ──────────────────────────

// Art that came over FTP for a banner row made without it, a picture in a
// folder no category claims, and a row whose size is not the file's.
file_put_contents("$tree/7-4 - Arrived Over FTP.avif", 'new art');
mkdir("$assets/stray-folder");
file_put_contents("$assets/stray-folder/Loose.png", 'loose');
$pdo->prepare('UPDATE files SET size = 1 WHERE id = ?')->execute([$dashed]);
$pdo->exec("INSERT INTO banners (version, name, duration_from, created_by) VALUES ('7.4', 'Arrived Over FTP', '2026-10-28', 1)");

$listed = send('GET', '/api/files/uncatalogued');
same(
    'not in the database: each file by its path, with the category whose folder holds it, or none',
    [['banners/7-4 - Arrived Over FTP.avif', 'banners', 7], ['stray-folder/Loose.png', null, 5]],
    array_map(static fn(array $file): array => [$file['path'], $file['category'], $file['size']], body($listed) ?? []),
);

$swept = body(send('POST', '/api/files/reconcile', []));
same(
    'the sweep, file by file: a size brought up to date, a file added where it is, a stray moved into unfiled and added',
    [
        ["banners/7-1 - Void Star's Advent 2026-10-13.avif", 'resized', null, 'banners'],
        ['banners/7-4 - Arrived Over FTP.avif', 'added', null, 'banners'],
        ['unfiled/Loose.png', 'unfiled', 'stray-folder/Loose.png', 'unfiled'],
    ],
    array_map(static fn(array $file): array => [$file['path'], $file['outcome'], $file['from'], $file['category']], $swept['files'] ?? []),
);
same('and in counts', [2, 1, 1, 1, 3], [$swept['adopted'] ?? null, $swept['moved_to_unfiled'] ?? null, $swept['resized'] ?? null, $swept['missing'] ?? null, $swept['files_total'] ?? null]);
same('the banner row made without its art is given it, found as an upload names it ("7-4", not "7.4")', [['field' => 'banners.icon', 'rows' => 1]], $swept['linked'] ?? null);
same('that row points at the file the sweep added', '7-4 - Arrived Over FTP', $pdo->query("SELECT f.name FROM banners b JOIN files f ON f.id = b.icon_file_id WHERE b.version = '7.4'")->fetchColumn());
$audited = json_decode((string) $pdo->query("SELECT details FROM anotoki_audit_log WHERE action = 'catalogue.reconcile' ORDER BY id DESC LIMIT 1")->fetchColumn(), true);
check('the audit entry keeps the counts alone, never the list', is_array($audited) && ($audited['adopted'] ?? null) === 2 && !array_key_exists('files', $audited), json_encode($audited));
same('afterwards, nothing is left out of the database', [], body(send('GET', '/api/files/uncatalogued')));
