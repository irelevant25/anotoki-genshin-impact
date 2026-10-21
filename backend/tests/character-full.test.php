<?php

declare(strict_types=1);

/**
 * GET /api/characters/{id}/full - what the public character page reads -
 * through the whole API (api/index.php), on a database of the test's own and a
 * backend copy of its own (tests/db_lib.php):
 *
 *   - the special dish comes on the character beside its id (`special_dish`,
 *     the admin form's to set - the page showed that bare number from
 *     2026-08-31 to 2026-10-21) as the page shows it: its name, and its
 *     picture the way the character's own pictures come - the food's normal
 *     icon as a path and the file's name, never a file named after the dish
 *     (`special_dish_name`, `special_dish_icon`, `special_dish_icon_name`);
 *   - a dish that is deleted, or none at all, is null in all three; a dish
 *     with no normal icon keeps its name and has no picture;
 *   - nothing else carries the dish: no `dish` beside the character (the
 *     answer of 10275e936, gone the same day);
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

/** A row of the files catalogue in $category (a file_categories code); its id. */
function catalogued(string $category, string $name, string $extension): int
{
    global $pdo;
    $statement = $pdo->prepare('INSERT INTO files (category_id, name, extension) SELECT id, ?, ? FROM file_categories WHERE code = ? RETURNING id');
    $statement->execute([$name, $extension, $category]);

    return (int) $statement->fetchColumn();
}

/** The special dish's three fields off a character's answer, each `missing` where the answer has no such field. */
function dishOf(array $answer): array
{
    $character = $answer['character'] ?? [];

    return array_map(static fn(string $field): mixed => array_key_exists($field, $character) ? $character[$field] : 'missing', [
        'name' => 'special_dish_name',
        'icon' => 'special_dish_icon',
        'icon_name' => 'special_dish_icon_name',
    ]);
}

// The foods folder files each dish's pictures by quality, as the admin form names them ("<DISH> - normal"); the
// character page and the dish quiz once asked for a file named after the dish itself ("Ghostly March.avif"),
// which is catalogued here too, beside the dish's own icon, so that an answer naming it is told apart.
$ghostlyMarchIcon = catalogued('foods', 'GHOSTLY_MARCH - normal', 'avif');
catalogued('foods', 'Ghostly March', 'avif');
$ghostlyMarch = made('foods', ['name' => 'Ghostly March', 'rarity' => 3, 'region' => 'Liyue', 'icon_normal_file_id' => $ghostlyMarchIcon]);
$gone = made('foods', ['name' => 'A Dish Taken Away', 'rarity' => 2, 'deleted' => true, 'icon_normal_file_id' => catalogued('foods', 'A_DISH_TAKEN_AWAY - normal', 'avif')]);
$unpictured = made('foods', ['name' => 'A Dish Without A Picture', 'rarity' => 1]);
$huTao = made('characters', ['name' => 'Hu Tao', 'region' => 'Liyue', 'birthday' => '0004-07-15', 'special_dish' => $ghostlyMarch]);
$forgotten = made('characters', ['name' => 'Forgotten Cook', 'special_dish' => $gone]);
$plainCook = made('characters', ['name' => 'Plain Cook', 'special_dish' => $unpictured]);
$noDish = made('characters', ['name' => 'Bennett', 'element' => 'Pyro', 'weapon_type' => 'Sword', 'birthday' => '0004-02-29']);

echo "The special dish, as the character page shows it\n";

$full = send('GET', "/api/characters/$huTao/full");
$answer = body($full);
same('200, for anybody', 200, $full->getStatusCode());
same(
    'the dish on the character, by its name and its own normal icon: a path and the file\'s name, as every picture comes',
    ['name' => 'Ghostly March', 'icon' => '../assets/foods/GHOSTLY_MARCH - normal.avif', 'icon_name' => 'GHOSTLY_MARCH - normal'],
    dishOf($answer),
);
same('...the character row still names it by id, as the admin form sets it', $ghostlyMarch, $answer['character']['special_dish'] ?? null);
same(
    'the answer\'s parts: no `dish` beside the character any more',
    ['character', 'voice_overs', 'constellations', 'relationships', 'talents', 'talent_cost', 'ascensions', 'ascension_cost', 'roles'],
    array_keys($answer),
);
same('a dish that is deleted: none, its picture neither', ['name' => null, 'icon' => null, 'icon_name' => null], dishOf(body(send('GET', "/api/characters/$forgotten/full"))));
same('...while the row still names it, as it was saved', $gone, body(send('GET', "/api/characters/$forgotten/full"))['character']['special_dish'] ?? null);
same('a dish with no normal icon: its name, and no picture', ['name' => 'A Dish Without A Picture', 'icon' => null, 'icon_name' => null], dishOf(body(send('GET', "/api/characters/$plainCook/full"))));
same('no dish at all: none', ['name' => null, 'icon' => null, 'icon_name' => null], dishOf(body(send('GET', "/api/characters/$noDish/full"))));
same('a character there is not: 404', 404, send('GET', '/api/characters/999999/full')->getStatusCode());

echo "The birthday, as the site keeps it\n";

same(
    'a DATE in year 4, which the page writes as a day and a month',
    ['0004-07-15', '0004-02-29'],
    [$answer['character']['birthday'] ?? null, body(send('GET', "/api/characters/$noDish/full"))['character']['birthday'] ?? null],
);

$pdo = null;
