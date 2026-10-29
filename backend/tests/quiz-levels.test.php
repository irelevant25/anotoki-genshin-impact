<?php

declare(strict_types=1);

/**
 * The quizzes' levels on the admin panel (api/quiz_levels.php,
 * routes/users/endpoints/quiz_levels.php, users/061), through the whole API
 * (api/index.php) - every gate - run in this process against databases of the
 * test's own, on a backend copy of its own (tests/db_lib.php), with a key pair
 * standing in for the IAM:
 *
 *   - the built-in levels - read from the frontend's quiz-levels.ts itself -
 *     pass the rules, so the page's "Back to the defaults" and a first save
 *     of them always work: a change to them that the rules refuse fails here;
 *   - every rule refuses what it must, saying where (the quiz, the level, the
 *     try) and what - and a save refused for it keeps nothing;
 *   - who may: nobody without a token, no MEMBER; an EDITOR as an ADMIN;
 *   - a save and a reset: kept in the levels' own order, answered by the
 *     public read (its ETag moving), in the audit log with who and the
 *     levels before and after - a save of the same levels changes nothing;
 *   - the public read: null while nothing is saved, while what is saved
 *     breaks the rules and while the table is not there; ETag and 304,
 *     no-cache; under the site's switches like every quiz route;
 *   - users/061: the table (one row, an object), Voice's three sentences
 *     made to follow the seconds - only where they are still users/058's, a
 *     Slovak one only beside this file's English -, and its gate.
 *
 * users/069 - Mismatch's properties and blend given to the levels saved
 * before them - is tests/quiz-levels-migration.test.php's.
 */

use Psr\Http\Message\ResponseInterface;
use Slim\Psr7\Factory\ServerRequestFactory;
use Slim\Psr7\Factory\StreamFactory;

require __DIR__ . '/lib.php';
require __DIR__ . '/db_lib.php';

testNeedsDatabase();

$database = testDatabase('levels');
$iamDir = testTempDir('iam');
$iam = testIam($iamDir);
$applicationFile = "$iamDir/application.json";
file_put_contents($applicationFile, json_encode(['client_id' => 'genshin', 'name' => 'Genshin', 'login_required' => false]));
$backend = testBackendCopy($database, ['jwks_file' => $iam['jwks'], 'application_file' => $applicationFile]);

define('ANOTOKI_ROUTES_ONLY', true);
require "$backend/api/index.php";

$built = siteMigrator(getDb())->apply();
$applied = array_map(static fn(array $file): string => $file['set'] . '/' . $file['name'], $built['applied']);
check(
    'a database built by every migration, users/061 and 069 among them (069 with nothing saved: nothing to give, its gate content)',
    $built['error'] === null && in_array('users/061_quiz_levels.sql', $applied, true) && in_array('users/069_mismatch_levels_properties.sql', $applied, true),
    (string) $built['error'],
);

const ADMIN = 1;
const EDITOR = 2;
const MEMBER = 3;
$tokens = [
    ADMIN => $iam['token'](ADMIN, ['MEMBER', 'ADMIN']),
    EDITOR => $iam['token'](EDITOR, ['MEMBER', 'EDITOR']),
    MEMBER => $iam['token'](MEMBER, ['MEMBER']),
];

/**
 * One request through the whole app; $as is who sends it (a token), null for nobody; a string $json is sent as it is,
 * anything else as JSON with its numbers as written - 5.0 stays 5.0 on the wire, as a page's JSON may send it.
 */
function send(string $method, string $path, ?int $as = null, mixed $json = null, array $headers = []): ResponseInterface
{
    global $app, $tokens;
    $request = (new ServerRequestFactory())->createServerRequest($method, 'http://localhost' . $path, ['REMOTE_ADDR' => '127.0.0.1']);
    if ($as !== null) {
        $request = $request->withHeader('Authorization', 'Bearer ' . $tokens[$as]);
    }
    if ($json !== null) {
        $request = $request->withHeader('Content-Type', 'application/json')->withBody((new StreamFactory())->createStream(is_string($json) ? $json : json_encode($json, JSON_PRESERVE_ZERO_FRACTION)));
    }
    foreach ($headers as $name => $value) {
        $request = $request->withHeader($name, $value);
    }

    return $app->handle($request);
}

/** The answer's JSON, as arrays. */
function body(ResponseInterface $response): mixed
{
    return json_decode((string) $response->getBody(), true);
}

$pdo = getDb();

// ── The built-in levels, as the frontend has them ───────────────────────────

/**
 * QUIZ_LEVELS from frontend quiz-levels.ts, as JSON: the object literal with
 * its comments taken out, its keys and strings in double quotes and no comma
 * before a closing bracket - objects as stdClass, as a body's are read.
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

$builtIn = builtInLevels();
$canonical = json_decode(json_encode($builtIn), true);

/** The built-in levels with $change made to a copy of them. */
function variant(callable $change): stdClass
{
    global $builtIn;
    $copy = json_decode(json_encode($builtIn), false);
    $change($copy);

    return $copy;
}

/** What the rules say of $levels: the check route's problems, as an EDITOR asks. */
function problemsOf(mixed $levels): array
{
    $response = send('POST', '/api/admin/quiz-levels/check', EDITOR, ['levels' => $levels]);
    if ($response->getStatusCode() !== 200) {
        return [['status' => $response->getStatusCode()] + (body($response) ?? [])];
    }

    return body($response)['problems'];
}

/** Whether a problem is said at that place whose message holds $words. */
function said(array $problems, ?string $quiz, ?string $level, ?int $try, string $words): bool
{
    foreach ($problems as $problem) {
        $at = [array_key_exists('quiz', $problem) ? $problem['quiz'] : 'x', array_key_exists('level', $problem) ? $problem['level'] : 'x', array_key_exists('try', $problem) ? $problem['try'] : 'x'];
        if ($at === [$quiz, $level, $try] && str_contains($problem['message'] ?? '', $words)) {
            return true;
        }
    }

    return false;
}

/** One rule's case: the built-in levels changed by $change, refused at that place with those words, and nothing else said. */
function refuses(string $what, callable $change, ?string $quiz, ?string $level, ?int $try, string $words): void
{
    $problems = problemsOf(variant($change));
    check($what, said($problems, $quiz, $level, $try, $words), json_encode($problems, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
}

/** One rule's case the rules take. */
function takes(string $what, callable $change): void
{
    same($what, [], problemsOf(variant($change)));
}

echo "The built-in levels pass the rules\n";

same('quiz-levels.ts\'s QUIZ_LEVELS: the six quizzes, three levels each', ['banners', 'pixelate', 'mismatch', 'music', 'dish', 'voice'], array_keys($canonical));
same('...and nothing the rules say of them', [], problemsOf($builtIn));

// ── Who may ─────────────────────────────────────────────────────────────────

echo "Who may: an ADMIN or an EDITOR\n";

same(
    'GET /api/admin/quiz-levels: nobody 401, a MEMBER 403, an EDITOR and an ADMIN 200',
    [401, 403, 200, 200],
    [
        send('GET', '/api/admin/quiz-levels')->getStatusCode(),
        send('GET', '/api/admin/quiz-levels', MEMBER)->getStatusCode(),
        send('GET', '/api/admin/quiz-levels', EDITOR)->getStatusCode(),
        send('GET', '/api/admin/quiz-levels', ADMIN)->getStatusCode(),
    ],
);
foreach (
    [['POST', '/api/admin/quiz-levels/check', ['levels' => $builtIn]], ['PUT', '/api/admin/quiz-levels', ['levels' => $builtIn]], ['DELETE', '/api/admin/quiz-levels', null]]
    as [$method, $path, $body]
) {
    same("$method $path: nobody 401, a MEMBER 403", [401, 403], [send($method, $path, null, $body)->getStatusCode(), send($method, $path, MEMBER, $body)->getStatusCode()]);
}
same(
    '...and nothing they sent was kept, nor audited',
    [0, 0],
    [(int) $pdo->query('SELECT count(*) FROM quiz_levels')->fetchColumn(), (int) $pdo->query("SELECT count(*) FROM anotoki_audit_log WHERE target_type = 'quiz_levels'")->fetchColumn()],
);

// ── The public read, nothing saved ──────────────────────────────────────────

echo "GET /api/quiz/levels, nothing saved: the built-in levels\n";

$first = send('GET', '/api/quiz/levels');
same('200, {"levels": null}, JSON in UTF-8', [200, '{"levels":null}', 'application/json; charset=utf-8'], [$first->getStatusCode(), (string) $first->getBody(), $first->getHeaderLine('Content-Type')]);
check('ETag, and asked every time (no-cache)', preg_match('/^"[0-9a-f]{32}"$/', $first->getHeaderLine('ETag')) === 1 && $first->getHeaderLine('Cache-Control') === 'no-cache');
$again = send('GET', '/api/quiz/levels', headers: ['If-None-Match' => $first->getHeaderLine('ETag')]);
same('the same again: 304, nothing in it', [304, ''], [$again->getStatusCode(), (string) $again->getBody()]);
same('a signed-in reader reads the same', '{"levels":null}', (string) send('GET', '/api/quiz/levels', MEMBER)->getBody());
same('the Quiz levels page: nothing saved, nothing to say', ['levels' => null, 'updated_at' => null, 'problems' => []], body(send('GET', '/api/admin/quiz-levels', EDITOR)));

// ── The rules ───────────────────────────────────────────────────────────────

echo "The rules: the shape\n";

same('not an object: said once, of the whole', 1, count(problemsOf([])));
check('...as the six quizzes and their levels', said(problemsOf([]), null, null, null, 'The levels are one object of the six quizzes'));
check('...nor a text', said(problemsOf('levels'), null, null, null, 'The levels are one object'));
refuses(
    'a quiz missing',
    static function (stdClass $l): void {
        unset($l->voice);
    },
    'voice',
    null,
    null,
    'Missing',
);
refuses(
    'a quiz there is not',
    static function (stdClass $l): void {
        $l->trivia = $l->banners;
    },
    null,
    null,
    null,
    'There is no quiz "trivia"',
);
refuses(
    'a quiz that is no object of levels',
    static function (stdClass $l): void {
        $l->dish = [1, 2, 3];
    },
    'dish',
    null,
    null,
    'A quiz is one object of its three levels',
);
refuses(
    'a level missing',
    static function (stdClass $l): void {
        unset($l->music->{'3'});
    },
    'music',
    '3',
    null,
    'Missing',
);
refuses(
    'a level there is not ("4")',
    static function (stdClass $l): void {
        $l->music->{'4'} = $l->music->{'3'};
    },
    'music',
    null,
    null,
    'There is no level "4"',
);
refuses(
    '...nor "01"',
    static function (stdClass $l): void {
        $l->music->{'01'} = $l->music->{'1'};
    },
    'music',
    null,
    null,
    'There is no level "01"',
);
refuses(
    'a level that is no object',
    static function (stdClass $l): void {
        $l->banners->{'2'} = 'easy';
    },
    'banners',
    '2',
    null,
    'A level is one object',
);
refuses(
    'a key a level does not have',
    static function (stdClass $l): void {
        $l->banners->{'2'}->lives = 3;
    },
    'banners',
    '2',
    null,
    'Unknown "lives"',
);

echo "The rules: five tries, five steps\n";

refuses(
    'triesMax 4',
    static function (stdClass $l): void {
        $l->pixelate->{'3'}->triesMax = 4;
    },
    'pixelate',
    '3',
    null,
    'triesMax is 5 on every level of every quiz',
);
refuses(
    '...nor 6',
    static function (stdClass $l): void {
        $l->voice->{'1'}->triesMax = 6;
    },
    'voice',
    '1',
    null,
    'triesMax is 5',
);
refuses(
    '...nor "5", a text',
    static function (stdClass $l): void {
        $l->dish->{'1'}->triesMax = '5';
    },
    'dish',
    '1',
    null,
    'triesMax is 5',
);
refuses(
    '...nor left out',
    static function (stdClass $l): void {
        unset($l->dish->{'1'}->triesMax);
    },
    'dish',
    '1',
    null,
    'triesMax is 5',
);
takes('...5.0 is 5', static function (stdClass $l): void {
    $l->dish->{'1'}->triesMax = 5.0;
});
refuses(
    'four steps',
    static function (stdClass $l): void {
        array_pop($l->banners->{'1'}->triesEffects);
    },
    'banners',
    '1',
    null,
    'triesEffects is a list of 5 steps',
);
refuses(
    '...six',
    static function (stdClass $l): void {
        $l->banners->{'1'}->triesEffects[] = (object) ['try' => 5];
    },
    'banners',
    '1',
    null,
    'triesEffects is a list of 5 steps',
);
refuses(
    '...an object of steps, not a list',
    static function (stdClass $l): void {
        $l->banners->{'1'}->triesEffects = (object) $l->banners->{'1'}->triesEffects;
    },
    'banners',
    '1',
    null,
    'triesEffects is a list of 5 steps',
);
refuses(
    'a step out of order',
    static function (stdClass $l): void {
        $l->music->{'2'}->triesEffects[0]->try = 1;
    },
    'music',
    '2',
    0,
    'try is 0 here',
);
refuses(
    'a step that is no object',
    static function (stdClass $l): void {
        $l->music->{'2'}->triesEffects[3] = 3;
    },
    'music',
    '2',
    3,
    'A step is one object',
);
refuses(
    'a key a step does not have',
    static function (stdClass $l): void {
        $l->music->{'2'}->triesEffects[1]->hint = 'a melody';
    },
    'music',
    '2',
    1,
    'Unknown "hint": a Music step has try and data',
);

echo "The rules: the classes\n";

refuses(
    'a class Banners has not',
    static function (stdClass $l): void {
        $l->banners->{'1'}->triesEffects[0]->class = 'shown-everything';
    },
    'banners',
    '1',
    0,
    '"shown-everything" is no class of Banners: they are shown-quarter, shown-half, shown-grey-blurred-more, shown-grey-blurred and shown-grey',
);
refuses(
    'Voice\'s class on a picture',
    static function (stdClass $l): void {
        $l->dish->{'1'}->triesEffects[0]->class = 'half-text';
    },
    'dish',
    '1',
    0,
    '"half-text" is no class of Dish',
);
refuses(
    'a picture\'s class on Voice',
    static function (stdClass $l): void {
        $l->voice->{'1'}->triesEffects[0]->class = 'shown-half';
    },
    'voice',
    '1',
    0,
    '"shown-half" is no class of Voice: they are quarter-text, half-text and hidden-audio',
);
refuses(
    'a class on Pixelate',
    static function (stdClass $l): void {
        $l->pixelate->{'1'}->triesEffects[0]->class = 'shown-half';
    },
    'pixelate',
    '1',
    0,
    'Pixelate has no classes',
);
refuses(
    '...on Music',
    static function (stdClass $l): void {
        $l->music->{'1'}->triesEffects[4]->class = 'hidden-audio';
    },
    'music',
    '1',
    4,
    'Music has no classes',
);
refuses(
    'two spaces between classes',
    static function (stdClass $l): void {
        $l->banners->{'2'}->triesEffects[0]->class = 'shown-half  shown-grey-blurred';
    },
    'banners',
    '2',
    0,
    'class is class names with one space between them',
);
refuses(
    '...a class that is no text',
    static function (stdClass $l): void {
        $l->banners->{'2'}->triesEffects[0]->class = 5;
    },
    'banners',
    '2',
    0,
    'class is class names with one space between them',
);
refuses(
    '...an empty one',
    static function (stdClass $l): void {
        $l->banners->{'2'}->triesEffects[3]->class = '';
    },
    'banners',
    '2',
    3,
    'class is class names with one space between them',
);
refuses(
    'two crops in a step',
    static function (stdClass $l): void {
        $l->banners->{'3'}->triesEffects[0]->class = 'shown-quarter shown-half shown-grey-blurred-more';
    },
    'banners',
    '3',
    0,
    'shown-quarter and shown-half both crop the picture: a step names one of them',
);
refuses(
    'two filters in a step',
    static function (stdClass $l): void {
        $l->dish->{'2'}->triesEffects[1]->class = 'shown-grey shown-grey-blurred';
    },
    'dish',
    '2',
    1,
    'shown-grey-blurred and shown-grey both grey or blur the picture',
);
refuses(
    'a class named twice',
    static function (stdClass $l): void {
        $l->dish->{'2'}->triesEffects[2]->class = 'shown-grey shown-grey';
    },
    'dish',
    '2',
    2,
    '"shown-grey" is named twice',
);
refuses(
    'two cuts of the line',
    static function (stdClass $l): void {
        $l->voice->{'3'}->triesEffects[0]->class = 'quarter-text half-text hidden-audio';
    },
    'voice',
    '3',
    0,
    'quarter-text and half-text both cut the line',
);
refuses(
    'a picture cropped more than the try before',
    static function (stdClass $l): void {
        $l->banners->{'3'}->triesEffects[2]->class = 'shown-quarter shown-grey-blurred';
    },
    'banners',
    '3',
    2,
    'shown-quarter hides more than the try before: each wrong guess shows more, never less',
);
refuses(
    '...blurred more than the try before',
    static function (stdClass $l): void {
        $l->dish->{'2'}->triesEffects[3]->class = 'shown-grey-blurred';
    },
    'dish',
    '2',
    3,
    'shown-grey-blurred hides more than the try before',
);
refuses(
    '...the line cut more than the try before',
    static function (stdClass $l): void {
        $l->voice->{'1'}->triesEffects[1]->class = 'quarter-text hidden-audio';
    },
    'voice',
    '1',
    1,
    'quarter-text hides more than the try before',
);
refuses(
    'the player hidden again',
    static function (stdClass $l): void {
        $l->voice->{'2'}->triesEffects[3] = (object) ['try' => 3, 'class' => 'hidden-audio'];
    },
    'voice',
    '2',
    3,
    'hidden-audio hides the player a try before showed',
);
same(
    'a step whose classes cannot be read says nothing of the steps after it',
    1,
    count(
        problemsOf(
            variant(static function (stdClass $l): void {
                $l->banners->{'3'}->triesEffects[0]->class = 'shown-quarterr shown-grey-blurred-more';
            }),
        ),
    ),
);
takes('a picture shown whole from the start', static function (stdClass $l): void {
    foreach ($l->banners->{'3'}->triesEffects as $step) {
        unset($step->class);
    }
});

echo "The rules: the numbers\n";

refuses(
    'data on a picture',
    static function (stdClass $l): void {
        $l->banners->{'1'}->triesEffects[1]->data = 3;
    },
    'banners',
    '1',
    1,
    'Banners has no data: its steps hide the picture by their classes',
);
refuses(
    'Pixelate without a grid',
    static function (stdClass $l): void {
        unset($l->pixelate->{'2'}->triesEffects[4]->data);
    },
    'pixelate',
    '2',
    4,
    'data is missing: every Pixelate step has its grid',
);
refuses(
    '...a grid of 2',
    static function (stdClass $l): void {
        $l->pixelate->{'1'}->triesEffects[0]->data = 2;
    },
    'pixelate',
    '1',
    0,
    'data is from 3 to 60 blocks across',
);
refuses(
    '...of 61',
    static function (stdClass $l): void {
        $l->pixelate->{'1'}->triesEffects[4]->data = 61;
    },
    'pixelate',
    '1',
    4,
    'data is from 3 to 60 blocks across',
);
refuses(
    '...of 7.5',
    static function (stdClass $l): void {
        $l->pixelate->{'1'}->triesEffects[0]->data = 7.5;
    },
    'pixelate',
    '1',
    0,
    'data is a whole number of blocks across',
);
refuses(
    '...of "7", a text',
    static function (stdClass $l): void {
        $l->pixelate->{'1'}->triesEffects[0]->data = '7';
    },
    'pixelate',
    '1',
    0,
    'data is a whole number of blocks across',
);
refuses(
    '...no finer than the try before',
    static function (stdClass $l): void {
        $l->pixelate->{'3'}->triesEffects[2]->data = 8;
    },
    'pixelate',
    '3',
    2,
    'data is more than the try before\'s 8: the grid is finer with each wrong guess',
);
takes('...3 and 60 themselves', static function (stdClass $l): void {
    $l->pixelate->{'3'}->triesEffects[0]->data = 3;
    $l->pixelate->{'3'}->triesEffects[4]->data = 60;
});
refuses(
    'Music without seconds before its last try',
    static function (stdClass $l): void {
        unset($l->music->{'2'}->triesEffects[3]->data);
    },
    'music',
    '2',
    3,
    'data is missing: tries 0 to 3 play some seconds of the track',
);
takes('...on its last try: the whole track', static function (stdClass $l): void {
    unset($l->music->{'3'}->triesEffects[4]->data);
});
refuses(
    '...half a second',
    static function (stdClass $l): void {
        $l->music->{'3'}->triesEffects[0]->data = 0.5;
    },
    'music',
    '3',
    0,
    'data is from 1 to 60 seconds',
);
refuses(
    '...fewer than the try before',
    static function (stdClass $l): void {
        $l->music->{'2'}->triesEffects[2]->data = 5;
    },
    'music',
    '2',
    2,
    'data is more than the try before\'s 6: more of the track with each wrong guess',
);
refuses(
    '...seconds in a text',
    static function (stdClass $l): void {
        $l->music->{'2'}->triesEffects[2]->data = 'nine';
    },
    'music',
    '2',
    2,
    'data is a number of seconds',
);
refuses(
    'Voice\'s seconds where the player is hidden',
    static function (stdClass $l): void {
        $l->voice->{'1'}->triesEffects[1]->data = 0.5;
    },
    'voice',
    '1',
    1,
    'A step with hidden-audio has no data',
);
refuses(
    '...after the whole recording',
    static function (stdClass $l): void {
        $l->voice->{'1'}->triesEffects[4]->data = 2;
    },
    'voice',
    '1',
    4,
    'data after a try that played the whole recording',
);
refuses(
    '...a tenth of a second',
    static function (stdClass $l): void {
        $l->voice->{'2'}->triesEffects[2]->data = 0.1;
    },
    'voice',
    '2',
    2,
    'data is from 0.25 to 10 seconds',
);
refuses(
    '...eleven',
    static function (stdClass $l): void {
        $l->voice->{'2'}->triesEffects[4]->data = 11;
    },
    'voice',
    '2',
    4,
    'data is from 0.25 to 10 seconds',
);
refuses(
    '...no more than the try before',
    static function (stdClass $l): void {
        $l->voice->{'2'}->triesEffects[4]->data = 1;
    },
    'voice',
    '2',
    4,
    'data is more than the try before\'s 1: more of the recording with each wrong guess',
);
takes('...a quarter of a second, and ten', static function (stdClass $l): void {
    $l->voice->{'2'}->triesEffects[2]->data = 0.25;
    $l->voice->{'2'}->triesEffects[4]->data = 10;
});

echo "The rules: Mismatch\n";

refuses(
    'two characters',
    static function (stdClass $l): void {
        $l->mismatch->{'1'}->choicesAmount = 2;
    },
    'mismatch',
    '1',
    null,
    'choicesAmount is a whole number from 3 to 8',
);
refuses(
    '...nine',
    static function (stdClass $l): void {
        $l->mismatch->{'3'}->choicesAmount = 9;
    },
    'mismatch',
    '3',
    null,
    'choicesAmount is a whole number from 3 to 8',
);
refuses(
    '...four and a half',
    static function (stdClass $l): void {
        $l->mismatch->{'2'}->choicesAmount = 4.5;
    },
    'mismatch',
    '2',
    null,
    'choicesAmount is a whole number from 3 to 8',
);
refuses(
    '...left out',
    static function (stdClass $l): void {
        unset($l->mismatch->{'2'}->choicesAmount);
    },
    'mismatch',
    '2',
    null,
    'choicesAmount is a whole number from 3 to 8',
);
refuses(
    '...tries on Mismatch',
    static function (stdClass $l): void {
        $l->mismatch->{'2'}->triesMax = 5;
    },
    'mismatch',
    '2',
    null,
    'Unknown "triesMax": a Mismatch level has choicesAmount, properties and blend, and nothing else',
);
refuses(
    '...a level that is no object',
    static function (stdClass $l): void {
        $l->mismatch->{'2'} = 4;
    },
    'mismatch',
    '2',
    null,
    'A Mismatch level is one object',
);
$nothing = problemsOf(
    variant(static function (stdClass $l): void {
        $l->mismatch->{'2'} = new stdClass();
    }),
);
check(
    '...a level of nothing: each of the three said',
    count($nothing) === 3 && said($nothing, 'mismatch', '2', null, 'choicesAmount is') && said($nothing, 'mismatch', '2', null, 'properties is') && said($nothing, 'mismatch', '2', null, 'blend is'),
    json_encode($nothing, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
);
takes('...three and eight', static function (stdClass $l): void {
    $l->mismatch->{'1'}->choicesAmount = 3;
    $l->mismatch->{'3'}->choicesAmount = 8;
});

refuses(
    'properties left out',
    static function (stdClass $l): void {
        unset($l->mismatch->{'1'}->properties);
    },
    'mismatch',
    '1',
    null,
    'properties is a list of what a question can be about: one or more of element, weapon, region, era and affiliation, each once',
);
refuses(
    '...an empty list',
    static function (stdClass $l): void {
        $l->mismatch->{'2'}->properties = [];
    },
    'mismatch',
    '2',
    null,
    'properties is a list of what a question can be about',
);
refuses(
    '...one name, not a list of them',
    static function (stdClass $l): void {
        $l->mismatch->{'3'}->properties = 'region';
    },
    'mismatch',
    '3',
    null,
    'properties is a list of what a question can be about',
);
refuses(
    '...an object of names, not a list',
    static function (stdClass $l): void {
        $l->mismatch->{'3'}->properties = (object) ['first' => 'region'];
    },
    'mismatch',
    '3',
    null,
    'properties is a list of what a question can be about',
);
refuses(
    '...a number in the list',
    static function (stdClass $l): void {
        $l->mismatch->{'1'}->properties = ['element', 3];
    },
    'mismatch',
    '1',
    null,
    'properties is a list of what a question can be about',
);
refuses(
    '...a property there is not',
    static function (stdClass $l): void {
        $l->mismatch->{'2'}->properties = ['element', 'colour'];
    },
    'mismatch',
    '2',
    null,
    'Unknown property "colour": the properties are element, weapon, region, era and affiliation',
);
refuses(
    '...one named twice',
    static function (stdClass $l): void {
        $l->mismatch->{'3'}->properties = ['region', 'era', 'region'];
    },
    'mismatch',
    '3',
    null,
    'properties names "region" more than once: each property is named once',
);
same(
    '...said once, however many times it is named',
    1,
    count(
        problemsOf(
            variant(static function (stdClass $l): void {
                $l->mismatch->{'3'}->properties = ['era', 'era', 'era'];
            }),
        ),
    ),
);
takes('...a single one', static function (stdClass $l): void {
    $l->mismatch->{'1'}->properties = ['affiliation'];
});
takes('...all five', static function (stdClass $l): void {
    $l->mismatch->{'2'}->properties = ['element', 'weapon', 'region', 'era', 'affiliation'];
});
takes('...given out of their order (answered in it: A save, below)', static function (stdClass $l): void {
    $l->mismatch->{'3'}->properties = ['affiliation', 'era', 'region'];
});

refuses(
    'blend 0',
    static function (stdClass $l): void {
        $l->mismatch->{'1'}->blend = 0;
    },
    'mismatch',
    '1',
    null,
    'blend is a whole number from 1 to 30: how many sets are drawn for a question, the one whose odd one out looks most like the others kept - 1 is the first set drawn',
);
refuses(
    '...31',
    static function (stdClass $l): void {
        $l->mismatch->{'3'}->blend = 31;
    },
    'mismatch',
    '3',
    null,
    'blend is a whole number from 1 to 30',
);
refuses(
    '...two and a half',
    static function (stdClass $l): void {
        $l->mismatch->{'2'}->blend = 2.5;
    },
    'mismatch',
    '2',
    null,
    'blend is a whole number from 1 to 30',
);
refuses(
    '..."8", a text',
    static function (stdClass $l): void {
        $l->mismatch->{'2'}->blend = '8';
    },
    'mismatch',
    '2',
    null,
    'blend is a whole number from 1 to 30',
);
refuses(
    '...left out',
    static function (stdClass $l): void {
        unset($l->mismatch->{'1'}->blend);
    },
    'mismatch',
    '1',
    null,
    'blend is a whole number from 1 to 30',
);
takes('...1 and 30', static function (stdClass $l): void {
    $l->mismatch->{'2'}->blend = 1;
    $l->mismatch->{'3'}->blend = 30;
});
takes('...8.0 is 8', static function (stdClass $l): void {
    $l->mismatch->{'2'}->blend = 8.0;
});

echo "The rules: how much is said, and the body\n";

$broken = variant(static function (stdClass $l): void {
    foreach (['banners', 'dish', 'pixelate', 'music', 'voice'] as $quiz) {
        foreach (['1', '2', '3'] as $level) {
            foreach ($l->$quiz->$level->triesEffects as $step) {
                $step->try = 9;
            }
        }
    }
});
$many = problemsOf($broken);
same('75 problems: the first 50 said, and how many more', [51, 'And 25 more: mend these first.'], [count($many), end($many)['message']]);
$long = str_repeat('x', 200);
check(
    'a key quoted cut short',
    said(
        problemsOf(
            variant(static function (stdClass $l) use ($long): void {
                $l->$long = 1;
            }),
        ),
        null,
        null,
        null,
        'There is no quiz "' . str_repeat('x', 40) . '…"',
    ),
);
foreach (
    [
        'something besides the levels' => json_encode(['levels' => $builtIn, 'note' => 'x']),
        'a list' => '[]',
        'no levels' => '{}',
    ]
    as $what => $sent
) {
    $refused = send('POST', '/api/admin/quiz-levels/check', EDITOR, $sent);
    same("$what: 422 invalid_body", [422, 'invalid_body'], [$refused->getStatusCode(), body($refused)['code'] ?? null]);
}
same(
    'not JSON: 400 invalid_json',
    [400, 'invalid_json'],
    (function (): array {
        $response = send('POST', '/api/admin/quiz-levels/check', EDITOR, '{"levels":');
        return [$response->getStatusCode(), body($response)['code'] ?? null];
    })(),
);
same('a form: 415', 415, send('PUT', '/api/admin/quiz-levels', EDITOR, null, ['Content-Type' => 'application/x-www-form-urlencoded'])->getStatusCode());
same(
    'more than ' . QUIZ_LEVELS_BODY_LIMIT . ' bytes: 413 too_large',
    [413, 'too_large'],
    (function (): array {
        $response = send('PUT', '/api/admin/quiz-levels', EDITOR, '{"levels":' . json_encode($GLOBALS['builtIn']) . str_repeat(' ', QUIZ_LEVELS_BODY_LIMIT) . '}');
        return [$response->getStatusCode(), body($response)['code'] ?? null];
    })(),
);

// ── A save ──────────────────────────────────────────────────────────────────

echo "A save refused keeps nothing\n";

$refusedSave = send('PUT', '/api/admin/quiz-levels', EDITOR, [
    'levels' => variant(static function (stdClass $l): void {
        $l->voice->{'2'}->triesMax = 3;
    }),
]);
same(
    '422 invalid_levels, with the problems the check says',
    [422, 'invalid_levels', true],
    [$refusedSave->getStatusCode(), body($refusedSave)['code'] ?? null, said(body($refusedSave)['problems'] ?? [], 'voice', '2', null, 'triesMax is 5')],
);
same(
    '...nothing kept, nothing audited',
    [0, 0],
    [(int) $pdo->query('SELECT count(*) FROM quiz_levels')->fetchColumn(), (int) $pdo->query("SELECT count(*) FROM anotoki_audit_log WHERE target_type = 'quiz_levels'")->fetchColumn()],
);

echo "A save, by an EDITOR\n";

// Sent in another order - the quizzes backwards, a step's keys too, a Mismatch level's keys and the properties in it -
// and with numbers written as 5.0, 8.0 and 15.0.
$sent = variant(static function (stdClass $l): void {
    $l->pixelate->{'1'}->triesEffects[0]->data = 9;
    $l->music->{'2'}->triesEffects[4]->data = 15.0;
    $l->voice->{'2'}->triesMax = 5.0;
    $l->mismatch->{'2'}->blend = 8.0;
});
$expected = json_decode(json_encode($sent), true);
$backwards = new stdClass();
foreach (array_reverse(get_object_vars(json_decode(json_encode($sent, JSON_PRESERVE_ZERO_FRACTION), false))) as $quiz => $levels) {
    $backwards->$quiz = $levels;
}
$backwards->voice->{'2'}->triesEffects[2] = (object) ['data' => 0.5, 'try' => 2];
$medium = $backwards->mismatch->{'2'};
$backwards->mismatch->{'2'} = (object) ['blend' => $medium->blend, 'properties' => array_reverse($medium->properties), 'choicesAmount' => $medium->choicesAmount];

/** $value with every object's keys in one order: the audit log keeps details as JSONB, which orders them its own way. */
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

/** The levels before and after in an audit entry's details - 'missing' where it has no such key. */
function beforeAndAfter(array $details): array
{
    $levels = $details['levels'] ?? [];

    return [array_key_exists('old', $levels) ? keySorted($levels['old']) : 'missing', array_key_exists('new', $levels) ? keySorted($levels['new']) : 'missing'];
}

$saved = send('PUT', '/api/admin/quiz-levels', EDITOR, ['levels' => $backwards]);
$view = body($saved);
same('200: the Quiz levels page\'s view', [200, ['levels', 'updated_at', 'problems']], [$saved->getStatusCode(), array_keys($view)]);
same('...the levels in their own order - a Mismatch level\'s keys and its properties too -, 5.0, 8.0 and 15.0 kept as 5, 8 and 15', $expected, $view['levels']);
same('...Medium\'s properties as the rules list them, whatever order they came in', ['element', 'weapon', 'region', 'era'], $view['levels']['mismatch']['2']['properties'] ?? null);
check('...a time, ISO 8601 in UTC', preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/', (string) $view['updated_at']) === 1, (string) $view['updated_at']);
same('...nothing the rules say', [], $view['problems']);
$read = send('GET', '/api/quiz/levels');
same('the pages read them now', $expected, body($read)['levels']);
same('...as JSON in that order, word for word', '{"levels":' . json_encode($expected, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . '}', (string) $read->getBody());
check(
    '...under another ETag: the old one is no 304',
    $read->getHeaderLine('ETag') !== $first->getHeaderLine('ETag') && send('GET', '/api/quiz/levels', headers: ['If-None-Match' => $first->getHeaderLine('ETag')])->getStatusCode() === 200,
);
$entry = $pdo->query("SELECT action, actor_id, target_id, details FROM anotoki_audit_log WHERE target_type = 'quiz_levels' ORDER BY id DESC LIMIT 1")->fetch();
$details = json_decode((string) ($entry['details'] ?? '{}'), true);
same(
    '...in the audit log: content.insert by the EDITOR, nothing before, the levels after',
    ['content.insert', EDITOR, 'levels', [null, keySorted($expected)]],
    [$entry['action'] ?? null, (int) ($entry['actor_id'] ?? 0), $entry['target_id'] ?? null, beforeAndAfter($details)],
);

$same = send('PUT', '/api/admin/quiz-levels', ADMIN, ['levels' => $sent]);
same(
    'the same levels again: 200, nothing written - the time as it was, no entry',
    [200, $view['updated_at'], 1],
    [$same->getStatusCode(), body($same)['updated_at'], (int) $pdo->query("SELECT count(*) FROM anotoki_audit_log WHERE target_type = 'quiz_levels'")->fetchColumn()],
);

$changed = variant(static function (stdClass $l): void {
    $l->mismatch->{'1'}->choicesAmount = 4;
});
same('a change, by an ADMIN: 200', 200, send('PUT', '/api/admin/quiz-levels', ADMIN, ['levels' => $changed])->getStatusCode());
$entry = $pdo->query("SELECT action, actor_id, details FROM anotoki_audit_log WHERE target_type = 'quiz_levels' ORDER BY id DESC LIMIT 1")->fetch();
$details = json_decode((string) ($entry['details'] ?? '{}'), true);
same(
    '...content.update by the ADMIN, the levels before and after',
    ['content.update', ADMIN, [keySorted($expected), keySorted(json_decode(json_encode($changed), true))]],
    [$entry['action'] ?? null, (int) ($entry['actor_id'] ?? 0), beforeAndAfter($details)],
);
same('...one row still', 1, (int) $pdo->query('SELECT count(*) FROM quiz_levels')->fetchColumn());

// ── Back to the defaults ────────────────────────────────────────────────────

echo "Back to the built-in levels\n";

$reset = send('DELETE', '/api/admin/quiz-levels', EDITOR);
same('DELETE by an EDITOR: 200, nothing saved', [200, ['levels' => null, 'updated_at' => null, 'problems' => []]], [$reset->getStatusCode(), body($reset)]);
same('...the pages read the built-in levels', '{"levels":null}', (string) send('GET', '/api/quiz/levels')->getBody());
$entry = $pdo->query("SELECT action, actor_id, details FROM anotoki_audit_log WHERE target_type = 'quiz_levels' ORDER BY id DESC LIMIT 1")->fetch();
$details = json_decode((string) ($entry['details'] ?? '{}'), true);
same(
    '...content.delete by the EDITOR, the levels before, nothing after',
    ['content.delete', EDITOR, [keySorted(json_decode(json_encode($changed), true)), null]],
    [$entry['action'] ?? null, (int) ($entry['actor_id'] ?? 0), beforeAndAfter($details)],
);
same(
    'again, with nothing saved: 200, no entry',
    [200, 3],
    [send('DELETE', '/api/admin/quiz-levels', EDITOR)->getStatusCode(), (int) $pdo->query("SELECT count(*) FROM anotoki_audit_log WHERE target_type = 'quiz_levels'")->fetchColumn()],
);

// ── What the rules no longer take ───────────────────────────────────────────

echo "Levels saved that the rules no longer take: read as none\n";

$pdo->exec("INSERT INTO quiz_levels (levels) VALUES ('{\"banners\": {\"1\": {\"triesMax\": 3}}}')");
same('the pages read the built-in levels', '{"levels":null}', (string) send('GET', '/api/quiz/levels')->getBody());
$view = body(send('GET', '/api/admin/quiz-levels', EDITOR));
same(
    'the Quiz levels page shows them as saved, and why they are not in force',
    [['banners' => ['1' => ['triesMax' => 3]]], true, true],
    [$view['levels'], said($view['problems'], 'pixelate', null, null, 'Missing'), said($view['problems'], 'banners', '1', null, 'triesMax is 5')],
);
same('a save over them: content.update, what was saved before kept in the entry', 200, send('PUT', '/api/admin/quiz-levels', EDITOR, ['levels' => $builtIn])->getStatusCode());
$details = json_decode((string) $pdo->query("SELECT details FROM anotoki_audit_log WHERE target_type = 'quiz_levels' ORDER BY id DESC LIMIT 1")->fetchColumn(), true);
same('...as it was', [['banners' => ['1' => ['triesMax' => 3]]], keySorted($canonical)], beforeAndAfter($details));
same('...and the built-in levels saved are the pages\' levels', $canonical, body(send('GET', '/api/quiz/levels'))['levels']);
send('DELETE', '/api/admin/quiz-levels', EDITOR);

// ── The table not there ─────────────────────────────────────────────────────

echo "Before users/061 is applied (the table not there)\n";

$pdo->exec('ALTER TABLE quiz_levels RENAME TO quiz_levels_away');
same('the pages read the built-in levels', [200, '{"levels":null}'], [send('GET', '/api/quiz/levels')->getStatusCode(), (string) send('GET', '/api/quiz/levels')->getBody()]);
$away = send('GET', '/api/admin/quiz-levels', EDITOR);
same(
    'the Quiz levels page: 503 quiz_levels_unavailable, Retry-After',
    [503, 'quiz_levels_unavailable', '60'],
    [$away->getStatusCode(), body($away)['code'] ?? null, $away->getHeaderLine('Retry-After')],
);
same(
    '...a save and a reset too',
    [503, 503],
    [send('PUT', '/api/admin/quiz-levels', EDITOR, ['levels' => $builtIn])->getStatusCode(), send('DELETE', '/api/admin/quiz-levels', EDITOR)->getStatusCode()],
);
same('...a check needs no table', [200, []], [send('POST', '/api/admin/quiz-levels/check', EDITOR, ['levels' => $builtIn])->getStatusCode(), problemsOf($builtIn)]);
$pdo->exec('ALTER TABLE quiz_levels_away RENAME TO quiz_levels');

// ── The site's switches ─────────────────────────────────────────────────────

echo "The public read under the site's switches, as every quiz route\n";

$pdo->exec("INSERT INTO anotoki_site_settings (name, value) VALUES ('maintenance_mode', 'true') ON CONFLICT (name) DO UPDATE SET value = EXCLUDED.value");
same(
    'closed for maintenance: 503 maintenance - an ADMIN past it',
    [503, 'maintenance', 200],
    [send('GET', '/api/quiz/levels')->getStatusCode(), body(send('GET', '/api/quiz/levels'))['code'] ?? null, send('GET', '/api/quiz/levels', ADMIN)->getStatusCode()],
);
$pdo->exec("UPDATE anotoki_site_settings SET value = 'false' WHERE name = 'maintenance_mode'");

file_put_contents($applicationFile, json_encode(['client_id' => 'genshin', 'name' => 'Genshin', 'login_required' => true]));
same(
    'sign-in required: 401 sign_in_required for nobody - a signed-in reader reads them',
    [401, 'sign_in_required', 200],
    [send('GET', '/api/quiz/levels')->getStatusCode(), body(send('GET', '/api/quiz/levels'))['code'] ?? null, send('GET', '/api/quiz/levels', MEMBER)->getStatusCode()],
);
file_put_contents($applicationFile, json_encode(['client_id' => 'genshin', 'name' => 'Genshin', 'login_required' => false]));

$route = (int) $pdo->query("INSERT INTO anotoki_page_access (path, visibility, blocked, api_paths) VALUES ('/levels-locked', 'PUBLIC', TRUE, '{/api/quiz/levels}') RETURNING id")->fetchColumn();
same(
    'a page\'s row locking it: 423 page_locked - its ADMIN past it',
    [423, 'page_locked', 200],
    [send('GET', '/api/quiz/levels')->getStatusCode(), body(send('GET', '/api/quiz/levels'))['code'] ?? null, send('GET', '/api/quiz/levels', ADMIN)->getStatusCode()],
);
$pdo->exec("DELETE FROM anotoki_page_access WHERE id = $route");

file_put_contents("$backend/migrations/users/999_test_waiting.sql", "SELECT 1;\n");
same('an update waiting: 503 update_pending', [503, 'update_pending'], [send('GET', '/api/quiz/levels')->getStatusCode(), body(send('GET', '/api/quiz/levels'))['code'] ?? null]);
unlink("$backend/migrations/users/999_test_waiting.sql");

// ── users/061 ───────────────────────────────────────────────────────────────

echo "users/061: the table\n";

/** The SQLSTATE a statement fails with, or null when it does not. */
function refusedWith(PDO $pdo, string $sql): ?string
{
    try {
        $pdo->exec($sql);

        return null;
    } catch (PDOException $e) {
        return (string) $e->getCode();
    }
}

same('one row at most: a key but 1 refused (the CHECK)', '23514', refusedWith($pdo, "INSERT INTO quiz_levels (id, levels) VALUES (2, '{}')"));
same('...a second row 1 refused', '23505', refusedWith($pdo, "INSERT INTO quiz_levels (levels) VALUES ('{}'); INSERT INTO quiz_levels (levels) VALUES ('{}')"));
$pdo->exec('DELETE FROM quiz_levels');
same('the levels are an object: a list refused', '23514', refusedWith($pdo, "INSERT INTO quiz_levels (levels) VALUES ('[]')"));
same(
    'no person in it: the columns',
    ['id smallint', 'levels jsonb', 'updated_at timestamp with time zone'],
    $pdo->query("SELECT column_name || ' ' || data_type FROM information_schema.columns WHERE table_name = 'quiz_levels' ORDER BY ordinal_position")->fetchAll(PDO::FETCH_COLUMN),
);

echo "users/061: Voice's seconds, from the levels\n";

$voice = [];
foreach ($pdo->query("SELECT key_name || '|' || language_code AS k, value FROM translations WHERE key_name LIKE 'quiz.levelInfo.voice%'")->fetchAll() as $row) {
    $voice[$row['k']] = $row['value'];
}
ksort($voice);
same(
    'English and Slovak, the seconds as placeholders',
    [
        'quiz.levelInfo.voiceEasy|en' => 'Half the line to start, then all of it, then {first} s of the recording, then the whole recording.',
        'quiz.levelInfo.voiceEasy|sk' => 'Na začiatok polovica hlášky, potom celá, potom {first} s z nahrávky a potom celá nahrávka.',
        'quiz.levelInfo.voiceHard|en' => 'A quarter of the line to start, then half, then all of it, then {first} s of the recording, then {second} s.',
        'quiz.levelInfo.voiceHard|sk' => 'Na začiatok štvrtina hlášky, potom polovica, potom celá, potom {first} s z nahrávky a potom {second} s.',
        'quiz.levelInfo.voiceMedium|en' => 'Half the line to start, then all of it, then {first} s of the recording, then {second} s, then {third} s.',
        'quiz.levelInfo.voiceMedium|sk' => 'Na začiatok polovica hlášky, potom celá, potom {first} s z nahrávky, potom {second} s a potom {third} s.',
        // Its general words, new: a level playing fewer pieces than its sentence names (a key keeps its placeholders).
        'quiz.levelInfo.voiceOther|en' => 'Part of the line or of its recording to start, and more with each wrong guess.',
        'quiz.levelInfo.voiceOther|sk' => 'Na začiatok časť hlášky alebo jej nahrávky a s každým zlým tipom viac.',
    ],
    $voice,
);
check(
    '...the six keys\' descriptions point at the Quiz levels page',
    (int) $pdo->query("SELECT count(*) FROM translation_keys WHERE name ~ '^quiz\\.levelInfo\\.(picture|voice)' AND description LIKE '%Quiz levels page warns%'")->fetchColumn() === 6,
);

$sql061 = (string) file_get_contents("$backend/migrations/users/061_quiz_levels.sql");
$gate061 = substr($sql061, (int) strrpos($sql061, 'DO $$'));
same('061\'s gate, run again over what it made: content', null, refusedWith($pdo, $gate061));
/** 061's gate after $break, rolled back: what it says. */
$gateAfter = static function (string $break) use ($pdo, $gate061): string {
    $pdo->beginTransaction();
    try {
        $pdo->exec($break);
        $pdo->exec($gate061);

        return 'no complaint';
    } catch (PDOException $e) {
        return $e->getMessage();
    } finally {
        $pdo->rollBack();
    }
};
check('...a row in the table: it says so', str_contains($gateAfter("INSERT INTO quiz_levels (levels) VALUES ('{}')"), 'quiz_levels holds a row'));
check(
    '...a Slovak string naming a number its English does not: it says which',
    str_contains(
        $gateAfter("UPDATE translations SET value = 'Half the line, then all of it, then the recording.' WHERE key_name = 'quiz.levelInfo.voiceHard' AND language_code = 'en'"),
        'quiz.levelInfo.voiceHard {first}',
    ),
);
check(
    '...an English string still users/058\'s: it says which',
    str_contains(
        $gateAfter(
            "UPDATE translations SET value = 'Half the line to start, then all of it, then half a second of the recording, then the whole recording.' WHERE key_name = 'quiz.levelInfo.voiceEasy' AND language_code = 'en'",
        ),
        'quiz.levelInfo.voiceEasy|en',
    ),
);
check('...a key the dialog reads gone: it says which', str_contains($gateAfter("DELETE FROM translation_keys WHERE name = 'quiz.levelInfo.musicWhole'"), 'quiz.levelInfo.musicWhole'));
check(
    '...Voice\'s general words without their Slovak: it says so',
    str_contains($gateAfter("DELETE FROM translations WHERE key_name = 'quiz.levelInfo.voiceOther' AND language_code = 'sk'"), 'quiz.levelInfo.voiceOther has no English or no Slovak'),
);

echo "users/061 rewords only where the words are still users/058's\n";

$owners = testPdo(testDatabase('levels_owner'));
$upTo060 = testMigrate($owners, ['anotoki_admin' => '999', 'users' => '060_words_made_true_for_the_usability_test.sql']);
check('a database built up to users/060', $upTo060['error'] === null, (string) $upTo060['error']);
$owners->exec("INSERT INTO users (id, username) VALUES (7, 'Owner')");
$owners->exec(
    "UPDATE translations SET value = 'Half the line, all of it, then a moment of the recording, more and more.', updated_by = 7 WHERE key_name = 'quiz.levelInfo.voiceMedium' AND language_code = 'en'",
);
$owners->exec("UPDATE translations SET value = 'Štvrtina hlášky, potom viac a potom nahrávka.', updated_by = 7 WHERE key_name = 'quiz.levelInfo.voiceHard' AND language_code = 'sk'");
$result = siteMigrator($owners)->apply();
check(
    'the rest applied without an error, 061 among it',
    $result['error'] === null && in_array('users/061_quiz_levels.sql', array_map(static fn(array $file): string => $file['set'] . '/' . $file['name'], $result['applied']), true),
    (string) $result['error'],
);
$words = [];
foreach ($owners->query("SELECT key_name || '|' || language_code AS k, value, updated_by FROM translations WHERE key_name LIKE 'quiz.levelInfo.voice%'")->fetchAll() as $row) {
    $words[$row['k']] = [$row['value'], $row['updated_by'] === null ? null : (int) $row['updated_by']];
}
same(
    'the owner\'s English for Medium stands, and so does its Slovak, users/058\'s - no number its English does not name',
    [['Half the line, all of it, then a moment of the recording, more and more.', 7], ['Na začiatok polovica hlášky, potom celá, potom pol sekundy z nahrávky, potom sekunda a potom dve.', null]],
    [$words['quiz.levelInfo.voiceMedium|en'] ?? null, $words['quiz.levelInfo.voiceMedium|sk'] ?? null],
);
same(
    '...the owner\'s Slovak for Hard stands, its English takes the seconds',
    [['Štvrtina hlášky, potom viac a potom nahrávka.', 7], ['A quarter of the line to start, then half, then all of it, then {first} s of the recording, then {second} s.', null]],
    [$words['quiz.levelInfo.voiceHard|sk'] ?? null, $words['quiz.levelInfo.voiceHard|en'] ?? null],
);
same(
    '...and Easy, nobody\'s rewording, takes them in both',
    [
        'Half the line to start, then all of it, then {first} s of the recording, then the whole recording.',
        'Na začiatok polovica hlášky, potom celá, potom {first} s z nahrávky a potom celá nahrávka.',
    ],
    [$words['quiz.levelInfo.voiceEasy|en'][0] ?? null, $words['quiz.levelInfo.voiceEasy|sk'][0] ?? null],
);
$owners = null;
