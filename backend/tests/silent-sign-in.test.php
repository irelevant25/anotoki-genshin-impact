<?php

declare(strict_types=1);

/**
 * What a silent sign-in brings into an account - the owner's decision of
 * 2026-10-11: when the IAM's sign-in hint signed somebody in without a click
 * (the page says `silent: true`), what this browser played without an account
 * comes into it only when the account has nothing here yet; an account with
 * anything of its own here takes nothing in (`stayed: true`). A sign-in the
 * person makes brings it as ever. Both ways in:
 *
 *   - the move of this browser's visitor (POST /api/visitor/move): the
 *     visitor stays as it was, under its key;
 *   - the carry of the games the browser kept by itself (POST
 *     /api/quiz/progress/carry): nothing is written, the browser keeps them.
 *
 * Through the whole API (api/index.php) in this process, on a database and a
 * backend copy of the test's own (tests/db_lib.php), with a key pair standing
 * in for the IAM; the visitors are made the way a browser makes them - a
 * played save by nobody, its key in the answer's X-Visitor-Key.
 */

use Psr\Http\Message\ResponseInterface;
use Slim\Psr7\Factory\ServerRequestFactory;
use Slim\Psr7\Factory\StreamFactory;

require __DIR__ . '/lib.php';
require __DIR__ . '/db_lib.php';

testNeedsDatabase();

$database = testDatabase('silent_sign_in');
$iamDir = testTempDir('iam');
$iam = testIam($iamDir);
$applicationFile = "$iamDir/application.json";
$anonymizedFile = "$iamDir/anonymized.json";
// The site lets visitors in (the IAM's switch off), as genshin does.
file_put_contents($applicationFile, json_encode(['client_id' => 'genshin', 'name' => 'Genshin', 'login_required' => false]));
file_put_contents($anonymizedFile, json_encode(['accounts' => []]));
$backend = testBackendCopy($database, ['jwks_file' => $iam['jwks'], 'application_file' => $applicationFile, 'anonymized_file' => $anonymizedFile]);

define('ANOTOKI_ROUTES_ONLY', true);
require "$backend/api/index.php";

$built = siteMigrator(getDb())->apply();
check('a database built by every migration', $built['error'] === null, (string) $built['error']);

/** Here for the first time: nothing of theirs here yet. */
const NEWCOMER = 21;
/** Has played here before (on another device): a saved game of their own. */
const REGULAR = 22;
/** Only opened a quiz page here once: a fresh draw saved, nothing played. */
const LOOKER = 23;
/** The carry's: here for the first time, and one with a game of their own here. */
const CARRY_NEWCOMER = 31;
const CARRY_REGULAR = 32;
$tokens = [];
foreach ([NEWCOMER, REGULAR, LOOKER, CARRY_NEWCOMER, CARRY_REGULAR] as $sub) {
    $tokens[$sub] = $iam['token']($sub, ['MEMBER']);
}

/** One request through the whole app; $as is who sends it (a token), null for nobody. */
function send(string $method, string $path, ?int $as = null, mixed $json = null, array $headers = []): ResponseInterface
{
    global $app, $tokens;
    $request = (new ServerRequestFactory())->createServerRequest($method, 'http://localhost' . $path, ['REMOTE_ADDR' => '127.0.0.1']);
    if ($as !== null) {
        $request = $request->withHeader('Authorization', 'Bearer ' . $tokens[$as]);
    }
    if ($json !== null) {
        $request = $request->withHeader('Content-Type', 'application/json')->withBody((new StreamFactory())->createStream(is_string($json) ? $json : json_encode($json)));
    }
    foreach ($headers as $name => $value) {
        $request = $request->withHeader($name, $value);
    }

    return $app->handle($request);
}

function body(ResponseInterface $response): mixed
{
    return json_decode((string) $response->getBody(), true);
}

/** A played game: one try, not finished - what makes a visitor when nobody saves it. */
const PLAYED = ['state' => ['tries' => ['Amber'], 'isQuestionComplete' => false]];

/** A browser playing without signing in: its first played save makes the visitor; the answer hands back its key. */
function visitorWith(string $quiz): string
{
    $made = send('PUT', "/api/quiz/progress/$quiz", null, PLAYED);
    $key = $made->getHeaderLine('X-Visitor-Key');
    check("a visitor made by a played save of $quiz (200, its key in X-Visitor-Key)", $made->getStatusCode() === 200 && strlen($key) === 43, $made->getStatusCode() . ' ' . $made->getBody());

    return $key;
}

/** The quizzes a player has a saved game of, by name - through the API, as their own page reads them. */
function gamesOf(?int $as, ?string $key = null): array|int
{
    $answer = send('GET', '/api/quiz/progress', $as, null, $key === null ? [] : ['X-Visitor-Key' => $key]);
    if ($answer->getStatusCode() !== 200) {
        return $answer->getStatusCode();
    }
    $names = array_column(body($answer), 'quiz');
    sort($names);

    return $names;
}

function move(int $as, string $key, mixed $json): ResponseInterface
{
    return send('POST', '/api/visitor/move', $as, $json, ['X-Visitor-Key' => $key]);
}

/** What a move answered, in the order the checks read it. */
function outcome(ResponseInterface $answer): array
{
    $body = body($answer);

    return [$answer->getStatusCode(), $body['found'] ?? null, $body['games']['moved'] ?? null, $body['games']['kept'] ?? null, $body['results'] ?? null, $body['stayed'] ?? null];
}

// ── Silent, into an account here for the first time: it moves ───────────────

echo "A silent sign-in into an account with nothing here: the visitor comes in\n";

$key = visitorWith('dish');
$moved = move(NEWCOMER, $key, ['silent' => true]);
same('POST /api/visitor/move {silent: true} for the newcomer: 200, found, the game moved, stayed false', [200, true, 1, 0, 0, false], outcome($moved));
same('...the account now has the visitor\'s game', ['dish'], gamesOf(NEWCOMER));
same('...and the visitor is gone: its key opens nothing (401)', 401, gamesOf(null, $key));
same('...the answer is private to the token and the key', ['private, no-store', 'Authorization, X-Visitor-Key'], [$moved->getHeaderLine('Cache-Control'), $moved->getHeaderLine('Vary')]);

// ── Silent, into an account that has its own here: nothing moves ───────────

echo "A silent sign-in into an account that has its own here: the visitor stays\n";

same('the regular has a game of their own here (another device)', 200, send('PUT', '/api/quiz/progress/pixelate', REGULAR, PLAYED)->getStatusCode());
$key = visitorWith('dish');
$visitorRows = static fn(): array => getDb()
    ->query('SELECT s.user_id, q.name, s.state::text AS state FROM quizzes_states s JOIN quizzes q ON q.id = s.quiz_id WHERE s.user_id < 0 ORDER BY s.user_id, q.name')
    ->fetchAll();
$before = $visitorRows();
$stayed = move(REGULAR, $key, ['silent' => true]);
same('POST /api/visitor/move {silent: true} for the regular: 200, found, nothing moved, stayed true', [200, true, 0, 0, 0, true], outcome($stayed));
same('...the account keeps only its own game', ['pixelate'], gamesOf(REGULAR));
same('...the visitor is as it was: its key still opens its game', ['dish'], gamesOf(null, $key));
same('...row for row (the same visitor, the same game, the same state)', $before, $visitorRows());
same('...the answer private all the same', 'private, no-store', $stayed->getHeaderLine('Cache-Control'));
same(
    'asked again (the next page load of the same silent session): the same answer, still nothing moved',
    [[200, true, 0, 0, 0, true], ['dish']],
    [outcome(move(REGULAR, $key, ['silent' => true])), gamesOf(null, $key)],
);

// ── A sign-in the person makes, into the same account: it moves ────────────

echo "A sign-in the person makes into that account: the visitor comes in, as ever\n";

$clicked = move(REGULAR, $key, ['silent' => false]);
same('POST /api/visitor/move {silent: false} for the regular: 200, found, the game moved, stayed false', [200, true, 1, 0, 0, false], outcome($clicked));
same('...the account has both games now', ['dish', 'pixelate'], gamesOf(REGULAR));
same('...and the visitor is gone (401)', 401, gamesOf(null, $key));

$key = visitorWith('music');
same('the body as the pages sent it before ({}): a sign-in the person made - it moves', [200, true, 1, 0, 0, false], outcome(move(REGULAR, $key, '{}')));
same('...into the account', ['dish', 'music', 'pixelate'], gamesOf(REGULAR));

// ── The edges ───────────────────────────────────────────────────────────────

echo "The edges: what counts as having something here, a key nobody has, a silent that is not a yes or no\n";

same(
    'the looker opened a quiz page once, signed in: a fresh draw saved',
    200,
    send('PUT', '/api/quiz/progress/banners', LOOKER, ['state' => ['tries' => [], 'isQuestionComplete' => false]])->getStatusCode(),
);
$key = visitorWith('voice');
same('a silent sign-in into that account: a saved game, even a fresh one, is something here - stayed', [200, true, 0, 0, 0, true], outcome(move(LOOKER, $key, ['silent' => true])));
same('...the visitor\'s game where it was', ['voice'], gamesOf(null, $key));

$unknown = str_repeat('A', 43);
same('a silent sign-in with a key nobody has: found false, stayed false (the page forgets the key)', [200, false, 0, 0, 0, false], outcome(move(REGULAR, $unknown, ['silent' => true])));

foreach (['yes', 1, null] as $silent) {
    $answer = move(LOOKER, $key, ['silent' => $silent]);
    if ($silent === null) {
        same('silent: null reads as no answer - a sign-in the person made: it moves', [200, true, 1, 0, 0, false], outcome($answer));
        continue;
    }
    same(
        'silent: ' . var_export($silent, true) . ' - 422 invalid (field silent), private',
        [422, 'invalid', 'silent', 'private, no-store'],
        [$answer->getStatusCode(), body($answer)['code'] ?? null, body($answer)['params']['field'] ?? null, $answer->getHeaderLine('Cache-Control')],
    );
}

// ── The carry of the games the browser kept by itself ──────────────────────

echo "The carry of the browser's own games after a silent sign-in: only into an account with nothing here\n";

/** The games a browser kept by itself (no visitor was made: the server kept none, or was full), as the carry takes them. */
function browserGames(string ...$quizzes): array
{
    return array_map(static fn(string $quiz): array => ['quiz' => $quiz, 'is_daily' => false, 'state' => PLAYED['state']], $quizzes);
}

function carry(?int $as, array $games, mixed $silent = 'absent'): ResponseInterface
{
    return send('POST', '/api/quiz/progress/carry', $as, $silent === 'absent' ? ['games' => $games] : ['games' => $games, 'silent' => $silent]);
}

/** What a carry answered, in the order the checks read it. */
function carried(ResponseInterface $answer): array
{
    $body = body($answer);
    $games = array_column($body['games'] ?? [], 'quiz');
    sort($games);

    return [$answer->getStatusCode(), $body['carried'] ?? null, $body['kept'] ?? null, $body['stayed'] ?? null, $games];
}

same(
    'silent, into an account here for the first time: 200, carried, stayed false, the account\'s games after it',
    [200, 1, 0, false, ['dish']],
    carried(carry(CARRY_NEWCOMER, browserGames('dish'), true)),
);
same('...written into the account', ['dish'], gamesOf(CARRY_NEWCOMER));

same('the carry\'s regular has a game of their own here', 200, send('PUT', '/api/quiz/progress/pixelate', CARRY_REGULAR, PLAYED)->getStatusCode());
$stayed = carry(CARRY_REGULAR, browserGames('music', 'pixelate'), true);
same('silent, into an account that has its own here: 200, nothing carried or counted kept, stayed true, the account\'s own games', [200, 0, 0, true, ['pixelate']], carried($stayed));
same('...nothing written (the browser keeps its games)', ['pixelate'], gamesOf(CARRY_REGULAR));
same('...the answer private', 'private, no-store', $stayed->getHeaderLine('Cache-Control'));

same(
    'a sign-in the person makes into that account ({silent: false}): carried as ever - the new quiz in, the account\'s own game kept',
    [200, 1, 1, false, ['music', 'pixelate']],
    carried(carry(CARRY_REGULAR, browserGames('music', 'pixelate'), false)),
);
same('...written into the account', ['music', 'pixelate'], gamesOf(CARRY_REGULAR));
same('the body as the pages sent it before (no silent): carried as ever', [200, 1, 0, false, ['music', 'pixelate', 'voice']], carried(carry(CARRY_REGULAR, browserGames('voice'))));

$made = carry(null, browserGames('banners'), true);
same(
    'nobody\'s carry saying silent: true - silent means nothing without an account: the visitor made as ever',
    [200, 1, 0, false, ['banners'], 43],
    [...carried($made), strlen($made->getHeaderLine('X-Visitor-Key'))],
);
same(
    '...and a visitor\'s own carry saying it: carried into the visitor',
    [200, 1, 0, false, ['banners', 'dish']],
    carried(send('POST', '/api/quiz/progress/carry', null, ['games' => browserGames('dish'), 'silent' => true], ['X-Visitor-Key' => $made->getHeaderLine('X-Visitor-Key')])),
);

$refused = carry(CARRY_REGULAR, browserGames('mismatch'), 'yes');
same(
    'silent: \'yes\' on the carry - 422 invalid (field silent), nothing written',
    [422, 'invalid', 'silent', ['music', 'pixelate', 'voice']],
    [$refused->getStatusCode(), body($refused)['code'] ?? null, body($refused)['params']['field'] ?? null, gamesOf(CARRY_REGULAR)],
);
