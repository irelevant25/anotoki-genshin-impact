<?php

declare(strict_types=1);

/**
 * users/069 - Mismatch's levels say what a question is about (properties) and how alike its odd one out looks
 * (blend), which the rules want on every level now (api/quiz_levels.php) - on a database built the way every test
 * builds one (the site's engine: the library's admin set whole, users/ to 068, the content half), its levels saved as
 * the owner's are on the host - the built-in levels (the frontend's quiz-levels.ts) with Pixelate's grid changed and
 * Mismatch's three levels {choicesAmount} alone, all the rules took before -, then brought up to date as Apply does,
 * read through the whole API (api/index.php) on a backend copy of its own (tests/db_lib.php):
 *
 *   - before it, those levels are none the rules take - the built-in ones are in force, the rules say why - and the
 *     site is closed for the update meanwhile;
 *   - after it, GET /api/quiz/levels answers them: Mismatch's levels given the built-in levels' properties and blend,
 *     Pixelate's grid and every other quiz as saved; the Quiz levels page has nothing to say of them, and the time
 *     they were saved has not moved;
 *   - a level's own properties or blend stay, only what it lacks is given; a row the rules did not take before it
 *     either (a level that is no object, Mismatch a list or missing) is left as it is; with nothing saved there is
 *     nothing to do;
 *   - its statements run again find nothing to do;
 *   - its gate notices a level left without them (its update skipped), the row changed otherwise (another quiz, a
 *     level's number, the time it was saved), the row gone - and nothing of a refused run is kept.
 */

use Anotoki\Lib\Migrations\Splitter;
use Psr\Http\Message\ResponseInterface;
use Slim\Psr7\Factory\ServerRequestFactory;

require __DIR__ . '/lib.php';
require __DIR__ . '/db_lib.php';

testNeedsDatabase();

const FILE_069 = 'users/069_mismatch_levels_properties.sql';
const EDITOR = 2;

$database = testDatabase('levels_069');
$iamDir = testTempDir('iam');
$iam = testIam($iamDir);
$applicationFile = "$iamDir/application.json";
file_put_contents($applicationFile, json_encode(['client_id' => 'genshin', 'name' => 'Genshin', 'login_required' => false]));
$backend = testBackendCopy($database, ['jwks_file' => $iam['jwks'], 'application_file' => $applicationFile]);

define('ANOTOKI_ROUTES_ONLY', true);
require "$backend/api/index.php";

$pdo = getDb();
$upTo068 = testMigrate($pdo, ['anotoki_admin' => '999', 'users' => '068_drop_multiselect_more_strings.sql']);
check('a database built up to users/068 by the site\'s engine', $upTo068['error'] === null, (string) $upTo068['error']);

/** One request through the whole app, as nobody - or, with a token, as somebody. */
function send(string $method, string $path, ?string $token = null): ResponseInterface
{
    global $app;
    $request = (new ServerRequestFactory())->createServerRequest($method, 'http://localhost' . $path, ['REMOTE_ADDR' => '127.0.0.1']);

    return $app->handle($token === null ? $request : $request->withHeader('Authorization', "Bearer $token"));
}

/** The answer's JSON, as arrays. */
function body(ResponseInterface $response): mixed
{
    return json_decode((string) $response->getBody(), true);
}

/**
 * QUIZ_LEVELS from frontend quiz-levels.ts, as JSON - objects as stdClass -, read as tests/quiz-levels.test.php
 * reads it: the object literal with its comments taken out, its keys and strings in double quotes and no comma
 * before a closing bracket.
 */
function builtInLevels(): stdClass
{
    $ts = (string) file_get_contents(dirname(TEST_BACKEND) . '/frontend/src/app/sites/main/features/quizzes/shared/quiz-levels.ts');
    if (preg_match('/^export const QUIZ_LEVELS[^=]*= (\{.*?)^\};/ms', $ts, $found) !== 1) {
        throw new RuntimeException('quiz-levels.ts has no QUIZ_LEVELS literal');
    }
    $literal = preg_replace('~//[^\n]*~', '', $found[1] . '}');
    $literal = preg_replace("/'([^']*)'/", '"$1"', $literal);
    $literal = preg_replace('/([{,]\s*)([A-Za-z0-9_]+)\s*:/', '$1"$2":', $literal);
    $literal = preg_replace('/,(\s*[}\]])/', '$1', $literal);

    return json_decode($literal, false, 64, JSON_THROW_ON_ERROR);
}

/** $value with every object's keys in one order: JSONB keeps them in an order of its own. */
function keySorted(mixed $value): mixed
{
    if (!is_array($value)) {
        return $value;
    }
    $value = array_map('keySorted', $value);
    if (!array_is_list($value)) {
        ksort($value, SORT_STRING);
    }

    return $value;
}

// ── The levels as the owner saved them ──────────────────────────────────────

echo "The levels saved before users/069, as the owner's are on the host\n";

$saved = builtInLevels();
foreach (['1' => 3, '2' => 4, '3' => 5] as $level => $amount) {
    $saved->mismatch->{$level} = (object) ['choicesAmount' => $amount];
}
// Pixelate's first grid on each level, the owner's own.
foreach (['1' => 9, '2' => 8, '3' => 4] as $level => $blocks) {
    $saved->pixelate->{$level}->triesEffects[0]->data = $blocks;
}
$savedJson = json_encode($saved, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
$pdo->prepare("INSERT INTO quiz_levels (levels, updated_at) VALUES (CAST(? AS jsonb), '2026-10-25 09:30:00+00')")->execute([$savedJson]);

/** The saved row as the database writes it - the levels and the time -, or false while there is none. */
$row = static fn(): array|false => $pdo->query("SELECT levels::text AS levels, to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS') AS saved_at FROM quiz_levels")->fetch(PDO::FETCH_ASSOC);
$asSaved = $row();

same('before it, they are no levels the rules take: the built-in ones are in force', null, quizLevelsInForce($pdo));
same(
    '...the rules say why: no level of Mismatch has properties or blend, and nothing else is wrong',
    [
        'mismatch 1: properties is a list of what a question can be about',
        'mismatch 1: blend is a whole number from 1 to 30',
        'mismatch 2: properties is a list of what a question can be about',
        'mismatch 2: blend is a whole number from 1 to 30',
        'mismatch 3: properties is a list of what a question can be about',
        'mismatch 3: blend is a whole number from 1 to 30',
    ],
    array_map(static fn(array $problem): string => "{$problem['quiz']} {$problem['level']}: " . strtok($problem['message'], ':'), quizLevelsView($pdo)['problems']),
);
$waiting = send('GET', '/api/quiz/levels');
same('...and meanwhile the site is closed for the update: 503 update_pending', [503, 'update_pending'], [$waiting->getStatusCode(), body($waiting)['code'] ?? null]);

// ── Its gate ────────────────────────────────────────────────────────────────

echo "Its gate, on those levels\n";

$statements = Splitter::split((string) file_get_contents(TEST_BACKEND . '/migrations/' . FILE_069));
check(
    'the file\'s statements: the snapshot, the three levels\' updates, the gate',
    count($statements) === 5 && str_starts_with($statements[0], 'CREATE TEMPORARY TABLE') && str_starts_with($statements[4], 'DO $$'),
    (string) count($statements),
);

/**
 * 069's statements in a transaction, rolled back: $before made first, the statement holding $skip left out, $change
 * made just before the gate. What the gate says, and the levels as the statements left them (null: no row).
 *
 * @return array{0: string, 1: ?array<string, mixed>}
 */
$run069 = static function (string $skip = '', string $change = '', string $before = '') use ($pdo, $statements): array {
    $pdo->beginTransaction();
    try {
        if ($before !== '') {
            $pdo->exec($before);
        }
        foreach ($statements as $statement) {
            if ($skip !== '' && str_contains($statement, $skip)) {
                continue;
            }
            if ($change !== '' && str_starts_with($statement, 'DO $$')) {
                $pdo->exec($change);
            }
            $pdo->exec($statement);
        }
        $levels = $pdo->query('SELECT levels::text FROM quiz_levels')->fetchColumn();

        return ['no complaint', $levels === false ? null : json_decode((string) $levels, true)];
    } catch (PDOException $e) {
        return [$e->getMessage(), null];
    } finally {
        $pdo->rollBack();
    }
};

same('069 as it is: content', 'no complaint', $run069()[0]);
$said = $run069("'{mismatch,2}'")[0];
check('Medium left without them (its update skipped): refused, naming the level', str_contains($said, 'users/069: saved Mismatch levels still without properties or blend: 2'), $said);
$said = $run069('', "UPDATE quiz_levels SET levels = jsonb_set(levels, '{pixelate,1,triesEffects,0,data}', '12')")[0];
check('...another quiz changed beside them: refused, naming it', str_contains($said, 'users/069: the saved levels changed other than by what their Mismatch levels lacked: pixelate'), $said);
$said = $run069('', "UPDATE quiz_levels SET levels = jsonb_set(levels, '{mismatch,3,blend}', '7')")[0];
check('...a level given another blend than the built-in level\'s: refused, naming Mismatch', str_contains($said, 'lacked: mismatch'), $said);
$said = $run069('', "UPDATE quiz_levels SET levels = jsonb_set(levels, '{mismatch,1,choicesAmount}', '6')")[0];
check('...a level\'s own number changed: refused, naming Mismatch', str_contains($said, 'lacked: mismatch'), $said);
$said = $run069('', 'UPDATE quiz_levels SET updated_at = CURRENT_TIMESTAMP')[0];
check('...the time they were saved moved: refused, saying so', str_contains($said, 'users/069: the time the levels were saved moved, though nobody saved them'), $said);
$said = $run069('', 'DELETE FROM quiz_levels')[0];
check('...the row gone: refused, counting', str_contains($said, 'users/069: quiz_levels holds 0 rows, where it held 1'), $said);
same('...and nothing of any run was kept', $asSaved, $row());

// ── What it gives, and what it leaves ───────────────────────────────────────

echo "What it gives a level, and what it leaves as it is\n";

$builtInMismatch = [
    '1' => ['choicesAmount' => 3, 'properties' => ['element', 'weapon', 'region'], 'blend' => 1],
    '2' => ['choicesAmount' => 4, 'properties' => ['element', 'weapon', 'region', 'era'], 'blend' => 8],
    '3' => ['choicesAmount' => 5, 'properties' => ['region', 'era', 'affiliation'], 'blend' => 20],
];
[$said, $left] = $run069(
    '',
    '',
    'UPDATE quiz_levels SET levels = jsonb_set(levels, \'{mismatch}\', \'{"1": {"choicesAmount": 3, "properties": ["era"]}, "2": {"blend": 3, "choicesAmount": 4}, "3": {"choicesAmount": 5, "properties": ["affiliation", "element"], "blend": 30}}\')',
);
same(
    'a level\'s own properties or blend stay - only what it lacks is given, a list out of order kept as it is',
    [
        'no complaint',
        keySorted([
            '1' => ['choicesAmount' => 3, 'properties' => ['era'], 'blend' => 1],
            '2' => ['choicesAmount' => 4, 'properties' => ['element', 'weapon', 'region', 'era'], 'blend' => 3],
            '3' => ['choicesAmount' => 5, 'properties' => ['affiliation', 'element'], 'blend' => 30],
        ]),
    ],
    [$said, keySorted($left['mismatch'] ?? null)],
);
same(
    '...and the rules take them, the list in their order',
    ['element', 'affiliation'],
    quizLevelsChecked(json_decode((string) json_encode($left), false))['levels']['mismatch']['3']['properties'] ?? null,
);
[$said, $left] = $run069('', '', "UPDATE quiz_levels SET levels = jsonb_set(levels, '{mismatch,2}', '4')");
same(
    'a level that is no object: left as it is - the others given theirs, the gate content',
    ['no complaint', keySorted(['1' => $builtInMismatch['1'], '2' => 4, '3' => $builtInMismatch['3']])],
    [$said, keySorted($left['mismatch'] ?? null)],
);
[$said, $left] = $run069('', '', 'UPDATE quiz_levels SET levels = jsonb_set(levels, \'{mismatch}\', \'[{"choicesAmount": 3}, {"choicesAmount": 4}]\')');
same('Mismatch a list: left as it is, its items too', ['no complaint', [['choicesAmount' => 3], ['choicesAmount' => 4]]], [$said, $left['mismatch'] ?? null]);
[$said, $left] = $run069('', '', "UPDATE quiz_levels SET levels = levels - 'mismatch'");
same('Mismatch missing: left missing', ['no complaint', false], [$said, is_array($left) && array_key_exists('mismatch', $left)]);
same('nothing saved, as on a new installation: nothing to do, no row made', ['no complaint', null], $run069('', '', 'DELETE FROM quiz_levels'));
same('...and nothing of any run was kept', $asSaved, $row());

// ── Applied ─────────────────────────────────────────────────────────────────

echo "Applied, as Apply does\n";

$applied = siteMigrator($pdo)->apply();
check(
    'users/069 applied by the site\'s engine, its gate content',
    $applied['error'] === null && in_array(FILE_069, array_map(static fn(array $file): string => $file['set'] . '/' . $file['name'], $applied['applied']), true),
    (string) $applied['error'],
);

$expected = json_decode($savedJson, true);
$expected['mismatch'] = $builtInMismatch;
$read = send('GET', '/api/quiz/levels');
same(
    'GET /api/quiz/levels: 200, the levels saved in force - Mismatch\'s given the built-in properties and blend, Pixelate\'s grid as the owner left it',
    [200, $expected],
    [$read->getStatusCode(), body($read)['levels'] ?? null],
);
$others = $pdo->prepare("SELECT (levels - 'mismatch') = (CAST(? AS jsonb) - 'mismatch') FROM quiz_levels");
$others->execute([$savedJson]);
same('...every other quiz in the database as it was saved', true, $others->fetchColumn());
$view = body(send('GET', '/api/admin/quiz-levels', $iam['token'](EDITOR, ['MEMBER', 'EDITOR'])));
same(
    'the Quiz levels page: the same levels, nothing to say of them, saved when the owner saved them',
    [$expected, [], '2026-10-25T09:30:00Z'],
    [$view['levels'] ?? null, $view['problems'] ?? null, $view['updated_at'] ?? null],
);

$after = $row();
same('its statements again: nothing to do, its gate content', 'no complaint', $run069()[0]);
same('...and the row as the first run left it', $after, $row());
