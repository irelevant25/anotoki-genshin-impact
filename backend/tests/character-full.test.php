<?php

declare(strict_types=1);

/**
 * GET /api/characters/{id}/full - what the public character page reads -
 * through the whole API (api/index.php), on a database of the test's own and a
 * backend copy of its own (tests/db_lib.php):
 *
 *   - the special dish comes along as itself (`dish`: its id, name and
 *     rarity), where the character row holds only its id (`special_dish`, the
 *     admin form's to set) - the page showed that bare number since it was
 *     built (2026-08-31), its "Special dish" an id;
 *   - a dish that is deleted, or none at all, is null;
 *   - the birthday comes as the site keeps it, a DATE in year 4: the page
 *     writes its day and month (database-helpers.ts, birthdayLabel()).
 */

use Psr\Http\Message\ResponseInterface;
use Slim\Psr7\Factory\ServerRequestFactory;

require __DIR__ . '/lib.php';
require __DIR__ . '/db_lib.php';

testNeedsDatabase();

$database = testDatabase('character_full');
$iamDir = testTempDir('iam');
$iam = testIam($iamDir);
$applicationFile = "$iamDir/application.json";
file_put_contents($applicationFile, json_encode(['client_id' => 'genshin', 'name' => 'Genshin', 'login_required' => false]));
$backend = testBackendCopy($database, ['jwks_file' => $iam['jwks'], 'application_file' => $applicationFile]);

define('ANOTOKI_ROUTES_ONLY', true);
require "$backend/api/index.php";

$built = siteMigrator(getDb())->apply();
check('a database built by every migration', $built['error'] === null, (string) $built['error']);

const ADMIN = 1;

/** One request through the whole app, as nobody (the character page is public). */
function send(string $method, string $path): ResponseInterface
{
    global $app;

    return $app->handle((new ServerRequestFactory())->createServerRequest($method, 'http://localhost' . $path, ['REMOTE_ADDR' => '127.0.0.1']));
}

function body(ResponseInterface $response): mixed
{
    return json_decode((string) $response->getBody(), true);
}

$pdo = getDb();

/** A row of $table with what it must have, and $row over it; its id. */
function made(string $table, array $row): int
{
    global $pdo;
    $defaults = [
        'characters' => [
            'element' => 'Pyro',
            'weapon_type' => 'Polearm',
            'rarity' => 5,
            'model' => 'Short Female',
            'namecard_description' => 'x',
            'version' => '1.3',
            'voice_actor_english' => 'x',
            'voice_actor_japanese' => 'x',
            'voice_actor_korean' => 'x',
            'voice_actor_chinese' => 'x',
        ],
        'foods' => [],
    ];
    $row = $row + $defaults[$table] + ['created_by' => ADMIN];
    $values = array_map(static fn(mixed $value): mixed => is_bool($value) ? ($value ? 'true' : 'false') : $value, array_values($row));
    $statement = $pdo->prepare("INSERT INTO $table (" . implode(', ', array_keys($row)) . ') VALUES (' . implode(', ', array_fill(0, count($row), '?')) . ') RETURNING id');
    $statement->execute($values);

    return (int) $statement->fetchColumn();
}

$ghostlyMarch = made('foods', ['name' => 'Ghostly March', 'rarity' => 3, 'region' => 'Liyue']);
$gone = made('foods', ['name' => 'A Dish Taken Away', 'rarity' => 2, 'deleted' => true]);
$huTao = made('characters', ['name' => 'Hu Tao', 'region' => 'Liyue', 'birthday' => '0004-07-15', 'special_dish' => $ghostlyMarch]);
$forgotten = made('characters', ['name' => 'Forgotten Cook', 'special_dish' => $gone]);
$noDish = made('characters', ['name' => 'Bennett', 'element' => 'Pyro', 'weapon_type' => 'Sword', 'birthday' => '0004-02-29']);

echo "The special dish, as the character page shows it\n";

$full = send('GET', "/api/characters/$huTao/full");
$answer = body($full);
same('200, for anybody', 200, $full->getStatusCode());
same('the dish itself beside the character: its id, its name, its rarity', ['id' => $ghostlyMarch, 'name' => 'Ghostly March', 'rarity' => 3], $answer['dish'] ?? 'missing');
same('...the character row still names it by id, as the admin form sets it', $ghostlyMarch, $answer['character']['special_dish'] ?? null);
same(
    'the answer\'s parts, the dish second',
    ['character', 'dish', 'voice_overs', 'constellations', 'relationships', 'talents', 'talent_cost', 'ascensions', 'ascension_cost', 'roles'],
    array_keys($answer),
);
same('a dish that is deleted: none', null, array_key_exists('dish', body(send('GET', "/api/characters/$forgotten/full"))) ? body(send('GET', "/api/characters/$forgotten/full"))['dish'] : 'missing');
same('no dish at all: none', null, array_key_exists('dish', body(send('GET', "/api/characters/$noDish/full"))) ? body(send('GET', "/api/characters/$noDish/full"))['dish'] : 'missing');
same('a character there is not: 404', 404, send('GET', '/api/characters/999999/full')->getStatusCode());

echo "The birthday, as the site keeps it\n";

same(
    'a DATE in year 4, which the page writes as a day and a month',
    ['0004-07-15', '0004-02-29'],
    [$answer['character']['birthday'] ?? null, body(send('GET', "/api/characters/$noDish/full"))['character']['birthday'] ?? null],
);

$pdo = null;
