<?php

declare(strict_types=1);

/**
 * The throwaway site the pages' screenshot pass runs against
 * (frontend/scripts/screenshots.mjs): a database of its own with a little game
 * content in it, and a backend of its own to serve it - never your database,
 * your settings, your storage or your IAM.
 *
 *   php tests/tools/browser-env.php up <folder> <issuer>   prints {"database", "backend"} as JSON
 *   php tests/tools/browser-env.php down <database>        drops it (a genshin_test_* name only)
 *
 * `up` makes genshin_test_browser_<random> on the PostgreSQL server
 * config/database.local.php names (as tests/db_lib.php does: the server and
 * its user are borrowed, the database named there is never opened, and the
 * file is read where it is - the copy's database.local.php requires it, so the
 * password is written nowhere), copies the backend's code into <folder>/backend
 * with settings of its own - that database, a secret, the IAM at <issuer> (the
 * anotoki library's stand-in, which the screenshot pass starts) - applies
 * every migration with the copy's own migration.php, and puts a handful of
 * characters, weapons, materials, foods, banners, artifacts and enemies in, so
 * the pages have something to draw. No pictures: the asset tree is not there.
 *
 * The database lives until `down` drops it; the screenshot pass does that
 * whatever happens, and removes the folder.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit();
}

const BACKEND = __DIR__ . '/../..';
const DATABASE_CONFIG = BACKEND . '/config/database.local.php';

function fail(string $message): never
{
    fwrite(STDERR, "browser-env: $message\n");
    exit(1);
}

/** A connection to $database on the borrowed server. */
function serverPdo(string $database): PDO
{
    if (!is_file(DATABASE_CONFIG)) {
        fail('there is no config/database.local.php to borrow a PostgreSQL server from (setup.php writes it)');
    }
    $config = require DATABASE_CONFIG;
    if (!is_array($config) || !isset($config['host'], $config['username'])) {
        fail('config/database.local.php does not name a server');
    }
    $pdo = new PDO("pgsql:host={$config['host']};port=" . ($config['port'] ?? 5432) . ";dbname=$database", (string) $config['username'], (string) ($config['password'] ?? ''));
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    return $pdo;
}

function testDatabaseName(string $name): string
{
    if (preg_match('/^genshin_test_[a-z0-9_]+$/D', $name) !== 1) {
        fail("not a test database's name: $name");
    }

    return $name;
}

function copyTree(string $from, string $to): void
{
    if (is_dir($from)) {
        @mkdir($to, 0777, true);
        foreach (scandir($from) ?: [] as $entry) {
            if ($entry !== '.' && $entry !== '..') {
                copyTree("$from/$entry", "$to/$entry");
            }
        }

        return;
    }
    copy($from, $to);
}

// ─────────────────────────────────────────────────────────────────────────────
// The content: a row is what it names, and every other column that may not be
// empty gets a value of its type - a foreign key the first row it may point at -
// so the seed does not have to follow every column the schema has grown.
// ─────────────────────────────────────────────────────────────────────────────

/** @return array<string, array{type: string, nullable: bool, default: bool}> */
function columnsOf(PDO $pdo, string $table): array
{
    $statement = $pdo->prepare(
        'SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = ? ORDER BY ordinal_position',
    );
    $statement->execute([$table]);
    $columns = [];
    foreach ($statement as $row) {
        $columns[$row['column_name']] = ['type' => $row['data_type'], 'nullable' => $row['is_nullable'] === 'YES', 'default' => $row['column_default'] !== null];
    }

    return $columns;
}

/** @return array<string, array{table: string, column: string}> what each column of $table points at */
function foreignKeysOf(PDO $pdo, string $table): array
{
    $statement = $pdo->prepare(
        <<<'SQL'
        SELECT kcu.column_name, ccu.table_name AS ref_table, ccu.column_name AS ref_column
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON kcu.constraint_name = tc.constraint_name AND kcu.table_schema = tc.table_schema
        JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = current_schema() AND tc.table_name = ?
        SQL
        ,
    );
    $statement->execute([$table]);
    $keys = [];
    foreach ($statement as $row) {
        $keys[$row['column_name']] = ['table' => $row['ref_table'], 'column' => $row['ref_column']];
    }

    return $keys;
}

function quoteName(string $name): string
{
    return '"' . str_replace('"', '""', $name) . '"';
}

/** Inserts one row of $table and answers its id (or null for a table without one). */
function seed(PDO $pdo, string $table, array $values): ?int
{
    static $known = [];
    $known[$table] ??= [columnsOf($pdo, $table), foreignKeysOf($pdo, $table)];
    [$columns, $keys] = $known[$table];

    foreach ($columns as $name => $column) {
        if (array_key_exists($name, $values) || $column['nullable'] || $column['default']) {
            continue;
        }
        if (isset($keys[$name])) {
            $ref = $keys[$name];
            $values[$name] = $pdo->query('SELECT ' . quoteName($ref['column']) . ' FROM ' . quoteName($ref['table']) . ' ORDER BY 1 LIMIT 1')->fetchColumn();
            continue;
        }
        $values[$name] = match (true) {
            str_contains($column['type'], 'int'), $column['type'] === 'numeric' => 1,
            $column['type'] === 'boolean' => 'false',
            $column['type'] === 'date' => '2024-01-01',
            str_starts_with($column['type'], 'timestamp') => '2024-01-01 00:00:00',
            $column['type'] === 'jsonb', $column['type'] === 'json' => '[]',
            default => 'Sample',
        };
    }
    foreach ($values as $name => $value) {
        if (!isset($columns[$name])) {
            fail("$table has no column $name");
        }
        if (is_array($value)) {
            $values[$name] = json_encode($value);
        } elseif (is_bool($value)) {
            $values[$name] = $value ? 'true' : 'false';
        }
    }

    $names = array_keys($values);
    $returning = isset($columns['id']) ? ' RETURNING id' : '';
    // A row of nothing but defaults (a set that is only an id) has no column to name.
    $statement = $pdo->prepare(
        'INSERT INTO ' .
            quoteName($table) .
            ($names === [] ? ' DEFAULT VALUES' : ' (' . implode(', ', array_map('quoteName', $names)) . ') VALUES (' . implode(', ', array_fill(0, count($names), '?')) . ')') .
            $returning,
    );
    $statement->execute(array_values($values));

    return $returning ? (int) $statement->fetchColumn() : null;
}

function seedContent(PDO $pdo): void
{
    $by = ['created_by' => 1];

    $foods = [];
    foreach (
        [
            ['Sweet Madame', 'Mondstadt', 2, 'Recovery Dish'],
            ['Jade Parcels', 'Liyue', 4, 'ATK-Boosting Dish'],
            ['Fontainian Onion Soup', 'Fontaine', 3, 'Recovery Dish'],
            // Hu Tao's and Xiangling's own dishes (characters.special_dish, below).
            ['Ghostly March', 'Liyue', 3, 'Recovery Dish'],
            ['Wanmin Restaurant\'s Boiled Fish', 'Liyue', 3, 'ATK-Boosting Dish'],
        ]
        as [$name, $region, $rarity, $type]
    ) {
        $foods[$name] = seed(
            $pdo,
            'foods',
            $by + [
                'name' => $name,
                'region' => $region,
                'rarity' => $rarity,
                'type' => typeOr($pdo, 'food_types', $type),
                'description_normal' => 'A dish that restores the spirits of whoever eats it.',
                'version' => '1.0',
            ],
        );
    }

    $characters = [];
    // A birthday as the site keeps one - a DATE in year 4, its year meaning nothing (the admin form's calendar
    // writes it so) -, Bennett's the 29th of February; a special dish for two of them, a food's id.
    foreach (
        [
            ['Hu Tao', 'Pyro', 'Polearm', 5, 'Liyue', 'Short Female', 'Fragrance in Thaw', '1.3', '0004-07-15', 'Ghostly March'],
            ['Xiangling', 'Pyro', 'Polearm', 4, 'Liyue', 'Short Female', 'Exquisite Delicacy', '1.0', '0004-11-02', 'Wanmin Restaurant\'s Boiled Fish'],
            ['Furina', 'Hydro', 'Sword', 5, 'Fontaine', 'Medium Female', 'Endless Solo of Solitude', '4.2', '0004-10-13', null],
            ['Bennett', 'Pyro', 'Sword', 4, 'Mondstadt', 'Medium Male', 'Trial by Fire', '1.0', '0004-02-29', null],
            ['Nahida', 'Dendro', 'Catalyst', 5, 'Sumeru', 'Short Female', 'Physic of Purity', '3.2', '0004-10-27', null],
            ['Kaeya', 'Cryo', 'Sword', 4, 'Mondstadt', 'Tall Male', 'Frostwind Swordsman', '1.0', '0004-11-30', null],
        ]
        as [$name, $element, $weapon, $rarity, $region, $model, $title, $version, $birthday, $dish]
    ) {
        $characters[$name] = seed(
            $pdo,
            'characters',
            $by + [
                'name' => $name,
                'element' => $element,
                'weapon_type' => $weapon,
                'rarity' => $rarity,
                'region' => $region,
                'model' => $model,
                'title' => $title,
                'version' => $version,
                'release_date' => '2024-01-01',
                'birthday' => $birthday,
                'special_dish' => $dish === null ? null : $foods[$dish],
                'namecard_description' => "$name's namecard.",
                'voice_actor_english' => 'Sample',
                'voice_actor_japanese' => 'Sample',
                'voice_actor_korean' => 'Sample',
                'voice_actor_chinese' => 'Sample',
                'affiliations' => ['Wangsheng Funeral Parlor'],
                'how_to_obtain' => ['Wish'],
            ],
        );
    }

    $weapons = [];
    foreach (
        [['Staff of Homa', 'Polearm', 5, '1.3'], ['The Catch', 'Polearm', 4, '2.1'], ['Mistsplitter Reforged', 'Sword', 5, '2.0'], ['Favonius Sword', 'Sword', 4, '1.0']]
        as [$name, $type, $rarity, $version]
    ) {
        $weapons[$name] = seed($pdo, 'weapons', $by + ['name' => $name, 'type' => $type, 'rarity' => $rarity, 'version' => $version, 'release_date' => '2024-01-01']);
    }

    $materials = [];
    foreach (
        [
            ['Mora', 'Currency', 3, 'Mondstadt'],
            ["Hero's Wit", 'Character EXP Material', 4, 'Mondstadt'],
            ['Silk Flower', 'Local Specialty', 1, 'Liyue'],
            ['Mystic Enhancement Ore', 'Weapon Enhancement Material', 3, 'Liyue'],
        ]
        as [$name, $type, $rarity, $region]
    ) {
        $materials[$name] = seed(
            $pdo,
            'materials',
            $by + ['name' => $name, 'type' => $type, 'rarity' => $rarity, 'region' => $region, 'description' => "$name, as the game describes it.", 'version' => '1.0'],
        );
    }

    $artifacts = [];
    foreach (["Gladiator's Finale", 'Noblesse Oblige'] as $name) {
        $artifacts[$name] = seed($pdo, 'artifacts', $by + ['name' => $name, 'version' => '1.0', 'two_piece' => 'ATK +18%.', 'four_piece' => 'Normal Attack DMG +35%.']);
    }

    $enemies = [];
    foreach (['Hilichurl', 'Abyss Mage'] as $name) {
        $enemies[$name] = seed($pdo, 'enemies', $by + ['name' => $name, 'description' => "$name, as the game describes it.", 'version' => '1.0']);
    }

    // Something for the parts of a page that fold: Hu Tao's voice-over set (two
    // story lines and a combat one) and what a Hilichurl drops (one group, a
    // material and an artifact). Every line's text carries what anybody who may
    // edit could have saved through the HTML source or the API straight - the
    // server keeps a text as it was written: an image whose onerror marks the
    // page. The screenshot run checks it never runs where a line is drawn (the
    // admin panel's HTML editor, the character page), as every stored text
    // reaches a live page through the allow-list (frontend rich-html.ts).
    $set = seed($pdo, 'characters_voice_overs_sets', []);
    $pdo->prepare('UPDATE characters SET voice_over_set_id = ? WHERE id = ?')->execute([$set, $characters['Hu Tao']]);
    $hostile = '<img src="data:," onerror="document.documentElement.dataset.storedScript=\'ran\'">';
    foreach ([['story', 1, 'Hello'], ['story', 2, 'Chat: Wangsheng Funeral Parlor'], ['combat', 1, 'Elemental Skill: I']] as [$type, $order, $name]) {
        seed($pdo, 'characters_voice_overs', $by + ['voice_over_set_id' => $set, 'type' => $type, 'order' => $order, 'name' => $name, 'text_english' => "$name, as Hu Tao says it.$hostile"]);
    }
    foreach ([['material_id' => $materials['Mora']], ['artifact_id' => $artifacts["Gladiator's Finale"]]] as $what) {
        seed(
            $pdo,
            'enemies_drops',
            $by +
                $what + ['enemy_id' => $enemies['Hilichurl'], 'level_from' => 1, 'level_to' => 40, 'world_level' => 0, 'quantity_from' => 1, 'quantity_to' => 2, 'drop_rate' => 0.5, 'average' => 0.75],
        );
    }

    $banner = seed($pdo, 'banners', $by + ['name' => 'Moment of Bloom', 'version' => '1.3', 'duration_from' => '2024-01-01 00:00:00', 'duration_to' => '2024-01-22 00:00:00']);
    foreach (['Hu Tao', 'Xiangling'] as $order => $name) {
        seed($pdo, 'banners_characters', $by + ['banner_id' => $banner, 'character_id' => $characters[$name], 'order' => $order + 1]);
    }
    unset($foods, $weapons, $materials, $artifacts, $enemies);
}

/** $wanted when the lookup has it, else whatever it has first. */
function typeOr(PDO $pdo, string $lookup, string $wanted): string
{
    $statement = $pdo->prepare('SELECT name FROM ' . quoteName($lookup) . ' WHERE name = ?');
    $statement->execute([$wanted]);

    return (string) ($statement->fetchColumn() ?: $pdo->query('SELECT name FROM ' . quoteName($lookup) . ' ORDER BY 1 LIMIT 1')->fetchColumn());
}

// ─────────────────────────────────────────────────────────────────────────────

$command = $argv[1] ?? '';

if ($command === 'down') {
    $database = testDatabaseName((string) ($argv[2] ?? ''));
    $server = serverPdo('postgres');
    $server->exec("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$database' AND pid <> pg_backend_pid()");
    $server->exec('DROP DATABASE IF EXISTS "' . $database . '"');
    echo "dropped $database\n";
    exit(0);
}

if ($command !== 'up' || !isset($argv[2], $argv[3])) {
    fail('usage: browser-env.php up <folder> <issuer> | down <database>');
}

$folder = rtrim(str_replace('\\', '/', $argv[2]), '/');
$issuer = rtrim($argv[3], '/');
if (!preg_match('#^http://(localhost|127\.0\.0\.1):\d+$#', $issuer)) {
    fail("the issuer is the stand-in IAM on this computer, http://localhost:<port>: $issuer");
}

$database = testDatabaseName('genshin_test_browser_' . bin2hex(random_bytes(4)));
serverPdo('postgres')->exec('CREATE DATABASE "' . $database . '"');

$backend = "$folder/backend";
foreach (['api', 'vendor', 'migrations', 'public'] as $part) {
    copyTree(BACKEND . "/$part", "$backend/$part");
}
@mkdir("$backend/config", 0777, true);
foreach (glob(BACKEND . '/config/*.php') ?: [] as $file) {
    if (!str_ends_with($file, '.local.php') && basename($file) !== 'google.php') {
        copy($file, "$backend/config/" . basename($file));
    }
}
foreach (['router.php', 'migration.php'] as $file) {
    copy(BACKEND . "/$file", "$backend/$file");
}
@mkdir("$backend/storage/cache", 0777, true);

$borrowed = (string) realpath(DATABASE_CONFIG);
file_put_contents(
    "$backend/config/database.local.php",
    "<?php\n\n\$borrowed = require " .
        var_export($borrowed, true) .
        ";\nunset(\$borrowed['databases']);\n\nreturn array_replace(\$borrowed, " .
        var_export(['database' => $database, 'persistent' => false], true) .
        ");\n",
);
file_put_contents("$backend/config/secret.local.php", "<?php\n\nreturn " . var_export(bin2hex(random_bytes(32)), true) . ";\n");
file_put_contents("$backend/config/iam.local.php", "<?php\n\nreturn " . var_export(['issuer' => $issuer, 'client_id' => 'genshin', 'cache_dir' => "$backend/storage/cache"], true) . ";\n");
touch("$backend/storage/installed.lock");

exec(escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg("$backend/migration.php") . ' 2>&1', $output, $code);
if ($code !== 0) {
    fail("the migrations did not apply:\n" . implode("\n", $output));
}

seedContent(serverPdo($database));

echo json_encode(['database' => $database, 'backend' => $backend], JSON_UNESCAPED_SLASHES) . "\n";
