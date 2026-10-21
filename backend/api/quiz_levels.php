<?php

/**
 * The quizzes' levels - what each level of each quiz shows, try by try - as
 * data: the admin panel's Quiz levels page changes them (users/061, the
 * owner's decision of 2026-10-21), where they were only the frontend's code.
 *
 * No row is the built-in levels, the frontend's quiz-levels.ts (QUIZ_LEVELS):
 * what every page plays while nothing is saved, while it asks, and whenever
 * asking fails, so a quiz never breaks or waits on this. A saved row is the
 * six quizzes' three levels whole, held to the rules below before it is
 * written - and again as it is read: a row the rules no longer take (a later
 * release's stricter rule) is read as none, and the Quiz levels page says why.
 *
 * The rules (quizLevelsChecked()) - the server's; the page shows what they say
 * before anything is saved (POST /api/admin/quiz-levels/check):
 *
 *   - exactly the six quizzes, each with exactly the levels "1", "2" and "3";
 *     no other key anywhere, and every value of its type;
 *   - the five "which character is this?" quizzes: {triesMax, triesEffects} -
 *     triesMax 5 on every level (the owner's rule of 2026-10-19: the Profile
 *     counts tries and wins across levels), triesEffects five steps, `try` 0
 *     to 4 in order;
 *   - a step's `class` only the classes its quiz's CSS has, one of each kind:
 *     Banners and Dish a crop (shown-half, shown-quarter) and a filter
 *     (shown-grey, shown-grey-blurred, shown-grey-blurred-more) -
 *     quiz-question.scss -, Voice a cut of the line (half-text, quarter-text)
 *     and hidden-audio - voice.component.scss and .ts; Pixelate and Music none;
 *   - a step's `data` a number: Pixelate's grid, 3 to 60 blocks across, on
 *     every step; Music's seconds, 1 to 60, on every step but the last, which
 *     may leave it out for the whole track; Voice's seconds of the recording,
 *     0.25 to 10, never beside hidden-audio; Banners and Dish none;
 *   - each wrong guess shows more, never less - the guides say so: the grid
 *     finer and the seconds more with every step that has them, a picture or
 *     a line never cut or blurred more than the try before, the player never
 *     hidden again once shown, no seconds after the whole recording;
 *   - Mismatch: {choicesAmount}, 3 to 8 characters (two could never make a
 *     set with one odd one out; the grid wraps however many there are).
 *
 * Who changed them, and from what to what, is the audit log's (content.insert
 * | update | delete on quiz_levels); the routes are
 * routes/users/endpoints/quiz_levels.php.
 */

use Anotoki\Lib\Support\Refusal;

/** The quizzes, in the order the levels list them (quiz-levels.ts). */
const QUIZ_LEVEL_QUIZZES = ['banners', 'pixelate', 'mismatch', 'music', 'dish', 'voice'];

/** The levels, as their keys: 1 easy, 2 medium, 3 hard. */
const QUIZ_LEVEL_NAMES = ['1' => 'Easy', '2' => 'Medium', '3' => 'Hard'];

/** Every level's tries, the same everywhere (the owner's rule of 2026-10-19). */
const QUIZ_LEVEL_TRIES = 5;

/** How many characters a Mismatch question may show. */
const QUIZ_LEVEL_CHOICES = [3, 8];

/** The largest body a save or a check takes, in bytes - the six quizzes' levels take some 2.5 KB, written tight. */
const QUIZ_LEVELS_BODY_LIMIT = 16384;

/** At most this many problems are said of one set of levels; a page full of them says enough. */
const QUIZ_LEVEL_PROBLEMS_MAX = 50;

/**
 * What each quiz's steps are, for the rules: its name, which keys a step has,
 * its classes by kind (one of each kind a step), and its number - what it is,
 * its range, whether it is whole, and on which steps it is needed.
 */
function quizLevelKinds(): array
{
    $picture = [
        'keys' => ['try', 'class'],
        'classes' => [
            // A kind's classes from the most hidden to the least: a step never hides more than the try before.
            'crop' => ['shown-quarter', 'shown-half'],
            'filter' => ['shown-grey-blurred-more', 'shown-grey-blurred', 'shown-grey'],
        ],
        'kinds' => ['crop' => 'crop the picture', 'filter' => 'grey or blur the picture'],
        'example' => 'shown-half shown-grey',
        'without' => 'has no data: its steps hide the picture by their classes',
        'data' => null,
    ];

    return [
        'banners' => ['name' => 'Banners'] + $picture,
        'dish' => ['name' => 'Dish'] + $picture,
        'pixelate' => [
            'name' => 'Pixelate',
            'keys' => ['try', 'data'],
            'classes' => [],
            'without' => 'has no classes: its steps draw the portrait in a grid, their data',
            'data' => ['what' => 'blocks across', 'min' => 3, 'max' => 60, 'whole' => true, 'needed' => 'always', 'finer' => 'the grid is finer with each wrong guess'],
        ],
        'music' => [
            'name' => 'Music',
            'keys' => ['try', 'data'],
            'classes' => [],
            'without' => 'has no classes: its steps play seconds of the track, their data',
            'data' => ['what' => 'seconds', 'min' => 1, 'max' => 60, 'whole' => false, 'needed' => 'but-last', 'finer' => 'more of the track with each wrong guess'],
        ],
        'voice' => [
            'name' => 'Voice',
            'keys' => ['try', 'class', 'data'],
            'classes' => [
                'text' => ['quarter-text', 'half-text'],
                'audio' => ['hidden-audio'],
            ],
            'kinds' => ['text' => 'cut the line'],
            'example' => 'half-text hidden-audio',
            'data' => ['what' => 'seconds', 'min' => 0.25, 'max' => 10, 'whole' => false, 'needed' => 'never', 'finer' => 'more of the recording with each wrong guess'],
        ],
    ];
}

/** Is the table there? Between the upload and users/061's Apply it is not; a query that cannot fail. */
function quizLevelsReady(PDO $pdo): bool
{
    return (bool) $pdo->query("SELECT to_regclass('quiz_levels') IS NOT NULL")->fetchColumn();
}

function quizLevelsUnavailable(): Refusal
{
    return new Refusal(503, 'quiz_levels_unavailable', 'The quiz levels are not in the database yet. An administrator applies the waiting database update on the Migrations page.');
}

/** A key as a message quotes it: JSON's quotes, cut short - it is whatever a body said. */
function quizLevelKey(string|int $key): string
{
    $key = (string) $key;
    if (mb_strlen($key) > 40) {
        $key = mb_substr($key, 0, 40) . '…';
    }

    return json_encode($key, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
}

/** A whole number, as JSON may write one (7 or 7.0), or null. */
function quizLevelWhole(mixed $value): ?int
{
    if (is_int($value)) {
        return $value;
    }
    if (is_float($value) && is_finite($value) && floor($value) === $value && abs($value) < PHP_INT_MAX) {
        return (int) $value;
    }

    return null;
}

/** A number in seconds, as a message writes it: 0.5, 10. */
function quizLevelNumber(int|float $value): string
{
    return is_int($value) ? (string) $value : rtrim(rtrim(sprintf('%.4F', $value), '0'), '.');
}

/**
 * The levels held to the rules: the problems found - where each is (the quiz,
 * the level, the try; null where it is about more than one) and what is wrong
 * - and, with none, the levels in their own order (the quizzes, the levels,
 * each object's keys), as they are kept and answered.
 *
 * $levels is JSON as decoded with its objects as stdClass (JsonBody::read(),
 * json_decode($text, false)), so that an object and a list are told apart.
 *
 * @return array{levels: ?array<string, mixed>, problems: list<array{quiz: ?string, level: ?string, try: ?int, message: string}>}
 */
function quizLevelsChecked(mixed $levels): array
{
    $problems = [];
    $say = static function (?string $quiz, ?string $level, ?int $try, string $message) use (&$problems): void {
        $problems[] = ['quiz' => $quiz, 'level' => $level, 'try' => $try, 'message' => $message];
    };

    $quizzes = $levels instanceof stdClass ? get_object_vars($levels) : null;
    if ($quizzes === null) {
        $say(null, null, null, 'The levels are one object of the six quizzes - banners, pixelate, mismatch, music, dish and voice -, each with its levels "1", "2" and "3".');

        return ['levels' => null, 'problems' => $problems];
    }

    foreach (array_keys($quizzes) as $key) {
        if (!in_array((string) $key, QUIZ_LEVEL_QUIZZES, true)) {
            $say(null, null, null, 'There is no quiz ' . quizLevelKey($key) . ': the quizzes are banners, pixelate, mismatch, music, dish and voice.');
        }
    }

    $kinds = quizLevelKinds();
    $checked = [];
    foreach (QUIZ_LEVEL_QUIZZES as $quiz) {
        if (!array_key_exists($quiz, $quizzes)) {
            $say($quiz, null, null, 'Missing: every quiz has its three levels here.');
            continue;
        }
        $byLevel = $quizzes[$quiz] instanceof stdClass ? get_object_vars($quizzes[$quiz]) : null;
        if ($byLevel === null) {
            $say($quiz, null, null, 'A quiz is one object of its three levels: "1" (Easy), "2" (Medium) and "3" (Hard).');
            continue;
        }
        foreach (array_keys($byLevel) as $key) {
            if (!array_key_exists((string) $key, QUIZ_LEVEL_NAMES)) {
                $say($quiz, null, null, 'There is no level ' . quizLevelKey($key) . ': the levels are "1" (Easy), "2" (Medium) and "3" (Hard).');
            }
        }
        foreach (array_keys(QUIZ_LEVEL_NAMES) as $level) {
            $level = (string) $level;
            if (!array_key_exists($level, $byLevel)) {
                $say($quiz, $level, null, 'Missing: every quiz has the three levels.');
                continue;
            }
            $kept = $quiz === 'mismatch' ? quizLevelChoices($byLevel[$level], $level, $say) : quizLevelSteps($byLevel[$level], $quiz, $level, $kinds[$quiz], $say);
            if ($kept !== null) {
                $checked[$quiz][$level] = $kept;
            }
        }
    }

    if (count($problems) > QUIZ_LEVEL_PROBLEMS_MAX) {
        $more = count($problems) - QUIZ_LEVEL_PROBLEMS_MAX;
        $problems = array_slice($problems, 0, QUIZ_LEVEL_PROBLEMS_MAX);
        $problems[] = ['quiz' => null, 'level' => null, 'try' => null, 'message' => "And $more more: mend these first."];
    }

    return ['levels' => $problems === [] ? $checked : null, 'problems' => $problems];
}

/**
 * A Mismatch level: {choicesAmount}, a whole number of characters a question
 * shows. Null when something is wrong, said through $say.
 *
 * @return ?array{choicesAmount: int}
 */
function quizLevelChoices(mixed $value, string $level, callable $say): ?array
{
    $fields = $value instanceof stdClass ? get_object_vars($value) : null;
    if ($fields === null) {
        $say('mismatch', $level, null, 'A Mismatch level is one object: {"choicesAmount": 4}.');

        return null;
    }
    $fine = true;
    foreach (array_keys($fields) as $key) {
        if ((string) $key !== 'choicesAmount') {
            $say('mismatch', $level, null, 'Unknown ' . quizLevelKey($key) . ': a Mismatch level has choicesAmount, and nothing else.');
            $fine = false;
        }
    }
    [$min, $max] = QUIZ_LEVEL_CHOICES;
    $amount = quizLevelWhole($fields['choicesAmount'] ?? null);
    if ($amount === null || $amount < $min || $amount > $max) {
        $say('mismatch', $level, null, "choicesAmount is a whole number from $min to $max: how many characters a question shows.");

        return null;
    }

    return $fine ? ['choicesAmount' => $amount] : null;
}

/**
 * A level of one of the five "which character is this?" quizzes:
 * {triesMax, triesEffects}, its steps held to the quiz's rules (quizLevelKinds()).
 * Null when something is wrong, said through $say.
 *
 * @return ?array{triesMax: int, triesEffects: list<array<string, mixed>>}
 */
function quizLevelSteps(mixed $value, string $quiz, string $level, array $kind, callable $say): ?array
{
    $fields = $value instanceof stdClass ? get_object_vars($value) : null;
    if ($fields === null) {
        $say($quiz, $level, null, 'A level is one object: {"triesMax": 5, "triesEffects": [five steps]}.');

        return null;
    }
    $fine = true;
    foreach (array_keys($fields) as $key) {
        if (!in_array((string) $key, ['triesMax', 'triesEffects'], true)) {
            $say($quiz, $level, null, 'Unknown ' . quizLevelKey($key) . ': a level has triesMax and triesEffects, and nothing else.');
            $fine = false;
        }
    }
    if (quizLevelWhole($fields['triesMax'] ?? null) !== QUIZ_LEVEL_TRIES) {
        $say($quiz, $level, null, 'triesMax is ' . QUIZ_LEVEL_TRIES . ' on every level of every quiz: the Profile counts tries and wins across the levels.');
        $fine = false;
    }
    $steps = $fields['triesEffects'] ?? null;
    if (!is_array($steps) || count($steps) !== QUIZ_LEVEL_TRIES) {
        $say($quiz, $level, null, 'triesEffects is a list of ' . QUIZ_LEVEL_TRIES . ' steps, one a try: try 0 (before any wrong guess) to try ' . (QUIZ_LEVEL_TRIES - 1) . '.');

        return null;
    }

    $name = $kind['name'];
    $data = $kind['data'];
    $kept = [];
    // What the tries before showed, so that no step shows less: each kind's
    // rank (its classes from the most hidden; none is the least), the last
    // number, whether the player was shown, whether the whole recording was.
    $ranks = [];
    $lastNumber = null;
    $playerShown = false;
    $wholeHeard = false;

    foreach (array_values($steps) as $try => $step) {
        $at = static fn(string $message) => $say($quiz, $level, $try, $message);
        $stepFields = $step instanceof stdClass ? get_object_vars($step) : null;
        if ($stepFields === null) {
            $at('A step is one object: {"try": ' . $try . '} and what it hides.');
            $fine = false;
            continue;
        }
        foreach (array_keys($stepFields) as $key) {
            if (in_array((string) $key, $kind['keys'], true)) {
                continue;
            }
            // A class or a number where this quiz has none is said so; anything else is a key nobody reads.
            $at(
                in_array((string) $key, ['class', 'data'], true)
                    ? "$name " . $kind['without'] . '.'
                    : 'Unknown ' . quizLevelKey($key) . ": a $name step has " . implode(' and ', $kind['keys']) . ', and nothing else.',
            );
            $fine = false;
        }
        if (quizLevelWhole($stepFields['try'] ?? null) !== $try) {
            $at("try is $try here: the steps go in order, try 0 to try " . (QUIZ_LEVEL_TRIES - 1) . '.');
            $fine = false;
        }
        $kept[$try] = ['try' => $try];

        // The classes: only the quiz's own, one of each kind, none hiding more than the try before.
        $classes = [];
        if (array_key_exists('class', $stepFields) && in_array('class', $kind['keys'], true)) {
            $class = $stepFields['class'];
            if (!is_string($class) || preg_match('/^[a-z-]+( [a-z-]+)*$/D', $class) !== 1) {
                $at('class is class names with one space between them, such as "' . $kind['example'] . '".');
                $fine = false;
            } else {
                $classes = explode(' ', $class);
                $kept[$try]['class'] = $class;
            }
        }
        $known = array_merge(...array_values($kind['classes'] ?: [[]]));
        $seen = [];
        foreach ($classes as $class) {
            if (!in_array($class, $known, true)) {
                $at(quizLevelKey($class) . " is no class of $name: they are " . quizLevelList($known) . '.');
            } elseif (in_array($class, $seen, true)) {
                $at(quizLevelKey($class) . ' is named twice.');
            }
            $seen[] = $class;
        }
        $unreadable = array_key_exists('class', $stepFields) && in_array('class', $kind['keys'], true) && !isset($kept[$try]['class']);
        if ($unreadable || count(array_unique($classes)) !== count($classes) || array_diff($classes, $known) !== []) {
            // A step whose classes cannot be read says nothing about what it shows: the steps after it are
            // not held to it, nor its number to the steps before - its classes are mended first.
            $fine = false;
            continue;
        }
        foreach ($kind['classes'] as $group => $members) {
            $named = array_values(array_intersect($members, array_unique($classes)));
            if (count($named) > 1) {
                $at(quizLevelList($named) . ' both ' . ($kind['kinds'][$group] ?? 'do one thing') . ': a step names one of them.');
                $fine = false;
                continue;
            }
            // From the most hidden (0) to nothing hidden (count): never lower than the try before.
            $rank = $named === [] ? count($members) : (int) array_search($named[0], $members, true);
            if ($group === 'audio') {
                if ($named !== [] && $playerShown) {
                    $at('hidden-audio hides the player a try before showed: each wrong guess shows more, never less.');
                    $fine = false;
                }
                $playerShown = $playerShown || $named === [];
            } elseif (isset($ranks[$group]) && $rank < $ranks[$group]) {
                $at($named[0] . ' hides more than the try before: each wrong guess shows more, never less.');
                $fine = false;
            }
            $ranks[$group] = max($rank, $ranks[$group] ?? 0);
        }

        // The number: the grid, or the seconds (a picture's step has none - said above).
        if ($data === null) {
            continue;
        }
        $hasData = array_key_exists('data', $stepFields);
        $last = $try === QUIZ_LEVEL_TRIES - 1;
        $hidesPlayer = in_array('hidden-audio', $classes, true);
        if (!$hasData) {
            if ($data['needed'] === 'always') {
                $at("data is missing: every $name step has its grid - how many " . $data['what'] . '.');
                $fine = false;
            } elseif ($data['needed'] === 'but-last' && !$last) {
                $at('data is missing: tries 0 to ' . (QUIZ_LEVEL_TRIES - 2) . ' play some seconds of the track - only the last may leave it out, for the whole track.');
                $fine = false;
            } elseif ($data['needed'] === 'never' && !$hidesPlayer) {
                // A step with the player and no seconds plays the whole recording.
                $wholeHeard = true;
            }
            continue;
        }
        $number = $stepFields['data'];
        if ($data['whole'] ? quizLevelWhole($number) === null : !is_int($number) && !is_float($number)) {
            $at($data['whole'] ? 'data is a whole number of ' . $data['what'] . '.' : 'data is a number of seconds.');
            $fine = false;
            continue;
        }
        // 10.0 kept as 10, as JSON gives it back: the same levels saved again are the same.
        $number = quizLevelWhole($number) ?? $number;
        if ($number < $data['min'] || $number > $data['max']) {
            $at('data is from ' . quizLevelNumber($data['min']) . ' to ' . quizLevelNumber($data['max']) . ' ' . $data['what'] . '.');
            $fine = false;
            continue;
        }
        if ($hidesPlayer) {
            $at('A step with hidden-audio has no data: the player is not there to play it.');
            $fine = false;
            continue;
        }
        if ($wholeHeard) {
            $at('data after a try that played the whole recording: each wrong guess shows more, never less.');
            $fine = false;
            continue;
        }
        if ($lastNumber !== null && $number <= $lastNumber) {
            $at('data is more than the try before\'s ' . quizLevelNumber($lastNumber) . ': ' . $data['finer'] . '.');
            $fine = false;
        }
        $lastNumber = $number;
        $kept[$try]['data'] = $number;
    }

    return $fine ? ['triesMax' => QUIZ_LEVEL_TRIES, 'triesEffects' => array_values($kept)] : null;
}

/** "a, b and c". */
function quizLevelList(array $words): string
{
    $words = array_values($words);
    $last = array_pop($words);

    return $words === [] ? (string) $last : implode(', ', $words) . ' and ' . $last;
}

/**
 * What is saved, as it was saved: the levels (objects as stdClass, as the
 * rules read them), when, and what the rules say of them now. Null when
 * nothing is - the built-in levels.
 *
 * @return ?array{levels: mixed, updated_at: string}
 */
function quizLevelsStored(PDO $pdo, bool $forUpdate = false): ?array
{
    $row = $pdo
        ->query(
            "SELECT levels::text AS levels, to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"') AS updated_at FROM quiz_levels WHERE id = 1" . ($forUpdate ? ' FOR UPDATE' : ''),
        )
        ->fetch(PDO::FETCH_ASSOC);
    if ($row === false) {
        return null;
    }

    return ['levels' => json_decode((string) $row['levels'], false, 64), 'updated_at' => (string) $row['updated_at']];
}

/**
 * The levels in force: what is saved, while the rules take it - otherwise, as
 * when nothing is saved or the table is not there yet, null: the built-in
 * levels (the frontend's QUIZ_LEVELS).
 *
 * @return ?array<string, mixed>
 */
function quizLevelsInForce(PDO $pdo): ?array
{
    if (!quizLevelsReady($pdo)) {
        return null;
    }
    $stored = quizLevelsStored($pdo);

    return $stored === null ? null : quizLevelsChecked($stored['levels'])['levels'];
}

/**
 * The Quiz levels page's view: what is saved (null: nothing - the built-in
 * levels are in force), when, and what the rules say of it now (none while it
 * is in force).
 *
 * @return array{levels: mixed, updated_at: ?string, problems: list<array<string, mixed>>}
 */
function quizLevelsView(PDO $pdo): array
{
    $stored = quizLevelsStored($pdo);
    if ($stored === null) {
        return ['levels' => null, 'updated_at' => null, 'problems' => []];
    }
    $checked = quizLevelsChecked($stored['levels']);

    return ['levels' => $checked['levels'] ?? $stored['levels'], 'updated_at' => $stored['updated_at'], 'problems' => $checked['problems']];
}

/**
 * Keeps the levels - already held to the rules (quizLevelsChecked()'s) - in
 * place of what was saved. Levels saved as they already are change nothing,
 * nor its time.
 *
 * @param array<string, mixed> $levels
 * @return array{verb: ?string, old: mixed}  verb: INSERT, UPDATE, or null when nothing changed
 */
function quizLevelsSave(PDO $pdo, array $levels): array
{
    $pdo->beginTransaction();
    try {
        $stored = quizLevelsStored($pdo, true);
        $old = $stored === null ? null : quizLevelsChecked($stored['levels'])['levels'] ?? $stored['levels'];
        if ($old === $levels) {
            $pdo->commit();

            return ['verb' => null, 'old' => $old];
        }
        $statement = $pdo->prepare(
            'INSERT INTO quiz_levels (id, levels) VALUES (1, CAST(? AS jsonb))
             ON CONFLICT (id) DO UPDATE SET levels = EXCLUDED.levels, updated_at = CURRENT_TIMESTAMP',
        );
        $statement->execute([json_encode($levels, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)]);
        $pdo->commit();
    } catch (\Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }

    return ['verb' => $stored === null ? 'INSERT' : 'UPDATE', 'old' => $old];
}

/**
 * Back to the built-in levels: what was saved goes. Null when nothing was.
 */
function quizLevelsReset(PDO $pdo): mixed
{
    $pdo->beginTransaction();
    try {
        $stored = quizLevelsStored($pdo, true);
        if ($stored !== null) {
            $pdo->exec('DELETE FROM quiz_levels WHERE id = 1');
        }
        $pdo->commit();
    } catch (\Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }

    return $stored === null ? null : quizLevelsChecked($stored['levels'])['levels'] ?? $stored['levels'];
}
