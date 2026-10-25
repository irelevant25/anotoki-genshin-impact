<?php

declare(strict_types=1);

/**
 * The texts genshin keeps as HTML - the guides and the voice lines' texts -
 * kept through the anotoki family's allow-list (anotoki-lib 0.11.0,
 * RichHtml::clean(), api/rich_text.php), whoever sends them: through the
 * whole API (api/index.php), on a database of the test's own and a backend
 * copy of its own (tests/db_lib.php), with a key pair standing in for the IAM.
 *
 *   - what an EDITOR sends past the admin panel's editor, straight to the API -
 *     a script, an event handler, a javascript: link, a picture, a style that
 *     would leave the text's box, a class of nobody's - is never kept: the
 *     text keeps its words and what the pages show, the guides' "tag" with it;
 *   - a text with no words left (an emptied editor's <p><br></p>) is none: a
 *     guide's language is deleted (English refused), a voice line's text null;
 *   - every way a voice line is written - one line (POST, PUT), a character's
 *     whole set (characters_full.php, through the same model) - is cleaned.
 */

use Psr\Http\Message\ResponseInterface;
use Slim\Psr7\Factory\ServerRequestFactory;
use Slim\Psr7\Factory\StreamFactory;

require __DIR__ . '/lib.php';
require __DIR__ . '/db_lib.php';

testNeedsDatabase();

$database = testDatabase('rich_text');
$iamDir = testTempDir('iam');
$iam = testIam($iamDir);
$applicationFile = "$iamDir/application.json";
file_put_contents($applicationFile, json_encode(['client_id' => 'genshin', 'name' => 'Genshin', 'login_required' => false]));
$backend = testBackendCopy($database, ['jwks_file' => $iam['jwks'], 'application_file' => $applicationFile]);

define('ANOTOKI_ROUTES_ONLY', true);
require "$backend/api/index.php";

$built = siteMigrator(getDb())->apply();
check('a database built by every migration', $built['error'] === null, (string) $built['error']);

const EDITOR = 2;
$tokens = [EDITOR => $iam['token'](EDITOR, ['MEMBER', 'EDITOR'])];

/** One request through the whole app, as the EDITOR. */
function send(string $method, string $path, mixed $json = null): ResponseInterface
{
    global $app, $tokens;
    $request = (new ServerRequestFactory())->createServerRequest($method, 'http://localhost' . $path, ['REMOTE_ADDR' => '127.0.0.1'])->withHeader('Authorization', 'Bearer ' . $tokens[EDITOR]);
    if ($json !== null) {
        $request = $request->withHeader('Content-Type', 'application/json')->withBody((new StreamFactory())->createStream(json_encode($json)));
    }

    return $app->handle($request);
}

function body(ResponseInterface $response): mixed
{
    return json_decode((string) $response->getBody(), true);
}

$pdo = getDb();

/** What an editor never wrote: a script, a handler, a javascript: link, a picture, a fixed box, a class of nobody's - around the words. */
const HOSTILE = '<h4 onclick="steal()">What is the Daily?</h4><script>alert(1)</script><p>Two <b>quizzes</b> <a href="javascript:alert(1)">daily</a><img src="x" onerror="alert(1)"> <span class="tag big" style="position:fixed;color:#ff0000">Mora</span></p>';
/** ...and what the allow-list keeps of it: the words, the heading, the bold, the tag and its colour. */
const KEPT = '<h4>What is the Daily?</h4><p>Two <b>quizzes</b> daily <span class="tag" style="color: #ff0000;">Mora</span></p>';

// ── The guides ──────────────────────────────────────────────────────────────

echo "A guide, saved straight to the API\n";

$put = send('PUT', '/api/admin/guides/daily', ['values' => ['sk' => HOSTILE]]);
same('200, the guide as it is now: the allow-list\'s HTML', [200, KEPT], [$put->getStatusCode(), body($put)['values']['sk'] ?? null]);
same(
    '...kept so, and read so by the pages',
    [KEPT, KEPT],
    [(string) $pdo->query("SELECT html FROM guide_contents WHERE guide = 'daily' AND language_code = 'sk'")->fetchColumn(), body(send('GET', '/api/guides/daily?language=sk'))['html'] ?? null],
);
$audit = $pdo->query("SELECT details FROM anotoki_audit_log WHERE target_type = 'guide_contents' ORDER BY id DESC LIMIT 1")->fetchColumn();
same('...and the audit log keeps what was kept, not what was sent', KEPT, json_decode((string) $audit, true)['sk']['new'] ?? null);
$cr = send('PUT', '/api/admin/guides/daily', ['values' => ['sk' => "<h4>Denný kvíz</h4>\r\n<p>Dva kvízy</p>"]]);
same('a text with Windows line ends: kept with HTML\'s own', "<h4>Denný kvíz</h4>\n<p>Dva kvízy</p>", body($cr)['values']['sk'] ?? null);
$emptied = send('PUT', '/api/admin/guides/daily', ['values' => ['sk' => '<p><br></p>']]);
same(
    'an emptied editor\'s <p><br></p> in Slovak: no words, so the language goes - the guide reads in English there',
    [200, false, 'en'],
    [$emptied->getStatusCode(), isset(body($emptied)['values']['sk']), body(send('GET', '/api/guides/daily?language=sk'))['language'] ?? null],
);
$english = send('PUT', '/api/admin/guides/daily', ['values' => ['en' => '<p><br></p>']]);
same(
    '...in English: 422 fallback_required, English kept',
    [422, 'fallback_required', true],
    [$english->getStatusCode(), body($english)['code'] ?? null, (bool) $pdo->query("SELECT 1 FROM guide_contents WHERE guide = 'daily' AND language_code = 'en'")->fetchColumn()],
);
$scriptOnly = send('PUT', '/api/admin/guides/daily', ['values' => ['en' => '<script>alert(1)</script>']]);
same('...nor a script with nothing else: no words are left of it', [422, 'fallback_required'], [$scriptOnly->getStatusCode(), body($scriptOnly)['code'] ?? null]);

// ── The voice lines ─────────────────────────────────────────────────────────

echo "A voice line, saved straight to the API\n";

$set = (int) $pdo->query('INSERT INTO characters_voice_overs_sets DEFAULT VALUES RETURNING id')->fetchColumn();
$made = send('POST', '/api/characters-voice-overs', [
    'voice_over_set_id' => $set,
    'order' => 1,
    'type' => 'story',
    'title_english' => 'Hello',
    'text_english' => HOSTILE,
    'text_japanese' => '<b>Ifa:</b> Hello & goodbye<br><i onmouseover="x()">Cat</i>',
    'text_korean' => '<p><br></p>',
]);
$line = (int) (body($made)['id'] ?? 0);
same('201', 201, $made->getStatusCode());
$row = $pdo->query("SELECT text_english, text_japanese, text_korean, text_chinese FROM characters_voice_overs WHERE id = $line")->fetch(PDO::FETCH_ASSOC);
same(
    'kept through the allow-list: the hostile text\'s words, a dialogue\'s speaker in <b> and its "&" as HTML writes it, an emptied editor\'s none, one not sent none',
    ['text_english' => KEPT, 'text_japanese' => '<b>Ifa:</b> Hello &amp; goodbye<br><i>Cat</i>', 'text_korean' => null, 'text_chinese' => null],
    $row,
);
$changed = send('PUT', "/api/characters-voice-overs/$line", ['text_english' => '<p onclick="x()">Changed</p>', 'text_japanese' => '<p></p>']);
same('a change (PUT): 200', 200, $changed->getStatusCode());
same(
    '...kept through it too: the handler gone, the emptied text none, the text not sent as it was',
    ['text_english' => '<p>Changed</p>', 'text_japanese' => null, 'title_english' => 'Hello'],
    $pdo->query("SELECT text_english, text_japanese, title_english FROM characters_voice_overs WHERE id = $line")->fetch(PDO::FETCH_ASSOC),
);
same(
    'a character\'s whole set (characters_full.php) writes each line through the same model: cleaned the same way',
    ['title_english' => '<b>Kept as typed</b>', 'text_english' => KEPT, 'text_chinese' => null],
    array_intersect_key(
        CharacterVoiceOver::fromBody([
            'voice_over_set_id' => $set,
            'order' => 2,
            'type' => 'combat',
            'title_english' => '<b>Kept as typed</b>',
            'text_english' => HOSTILE,
            'text_chinese' => ' ',
        ])->toDbArray(),
        ['title_english' => true, 'text_english' => true, 'text_chinese' => true],
    ),
);
