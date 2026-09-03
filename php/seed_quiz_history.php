<?php

/**
 * seed_quiz_history.php - plausible quiz history, for looking at the profile page
 *
 *   php seed_quiz_history.php [--user=1] [--questions=1800] [--days=180]
 *                             [--seed=20260903] [--clear] [--dry-run]
 *
 * The profile page draws win rates per quiz and per character, a breakdown by
 * difficulty, an activity grid and a streak. All of that needs history, and an
 * account that has played four questions shows four numbers and a lot of white
 * space.
 *
 * WHY IT IS NOT UNIFORM
 *
 * Random data with one probability behind it makes every quiz look equally
 * popular, every character equally hard, and every day equally busy. That is
 * worse than no data: it hides exactly the differences the page exists to
 * show, and a page that always draws a flat line is a page nobody can tell is
 * working.
 *
 * So each quiz gets a popularity and a hardness of its own, each character a
 * recognisability, and each day a number of questions - all drawn from normal
 * distributions rather than picked flat. The result is what a real player's
 * history looks like: a couple of favourite quizzes, characters they always
 * get and characters they never do, busy weeks and quiet ones.
 *
 *   played per quiz      log-normal   a favourite, a few regulars, one or two
 *                                     barely touched
 *   characters met       log-normal   the ones that keep coming up
 *   winning a question   logistic     of recognisability, quiz hardness and
 *                                     the difficulty asked for
 *   attempts spent       normal       clamped at one, longer tails on a loss
 *   questions per day    normal       around a slowly drifting mean, with
 *                                     quiet days and gaps
 *
 * WHAT IT TOUCHES
 *
 *   user_quiz_history    one row per finished question - inserted
 *   quiz_stats_history   the lifetime totals - recomputed from the log
 *
 * quizzes_states is left alone: it holds a game in progress, which is not
 * history, and inventing one would put a half-finished game in front of
 * somebody who never started it.
 *
 * The totals are recomputed from the whole log rather than added up as it
 * goes, so anything already there is folded in and the two tables agree
 * afterwards - which is the one property the profile page relies on.
 *
 * Nothing is deleted without --clear, and --clear says what it is about to
 * remove before it removes it.
 */

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/config/db.php';

// ─── Options ─────────────────────────────────────────────────────────────────

$options = getopt('', ['user::', 'questions::', 'days::', 'seed::', 'clear', 'dry-run', 'help']);

if (isset($options['help'])) {
    echo file_get_contents(__FILE__, false, null, 0, 2400);
    exit(0);
}

$userId    = (int) ($options['user'] ?? 1);
$questions = (int) ($options['questions'] ?? 1800);
$days      = (int) ($options['days'] ?? 180);
$seed      = (int) ($options['seed'] ?? 20260903);
$clear     = isset($options['clear']);
$dryRun    = isset($options['dry-run']);

if ($questions < 1 || $days < 1) {
    fwrite(STDERR, "--questions and --days both have to be at least 1.\n");
    exit(1);
}

// Seeded, so two runs with the same arguments produce the same history. A
// bug that only shows up on one particular shape of data is worth being able
// to reproduce.
mt_srand($seed);

// ─── Drawing numbers ─────────────────────────────────────────────────────────

/** A uniform double in [0, 1), from the seeded generator. */
function uniform(): float
{
    return mt_rand() / (mt_getrandmax() + 1.0);
}

/**
 * One draw from a normal distribution, by Box-Muller.
 *
 * The transform gives two independent draws per pair of uniforms; the second
 * is kept for the next call rather than thrown away, which halves the work
 * over the tens of thousands of draws below.
 */
function gauss(float $mean = 0.0, float $sd = 1.0): float
{
    static $spare = null;

    if ($spare !== null) {
        $value = $spare;
        $spare = null;
        return $mean + $sd * $value;
    }

    // log(0) is undefined, and uniform() can return exactly 0.
    $u = max(uniform(), 1e-12);
    $v = uniform();
    $radius = sqrt(-2.0 * log($u));

    $spare = $radius * sin(2 * M_PI * $v);

    return $mean + $sd * $radius * cos(2 * M_PI * $v);
}

/** A positive draw whose logarithm is normal - for anything counted. */
function logNormal(float $mu, float $sigma): float
{
    return exp(gauss($mu, $sigma));
}

/** Turns a score into a probability, which is what a win is. */
function logistic(float $x): float
{
    return 1.0 / (1.0 + exp(-$x));
}

/**
 * Picks one index, in proportion to its weight.
 *
 * Linear over the weights, which is fine at these sizes and says plainly what
 * it does. Everything drawn this way is drawn tens of thousands of times from
 * a list of at most a few hundred.
 */
function pickWeighted(array $weights, float $total): int
{
    $target = uniform() * $total;

    foreach ($weights as $index => $weight) {
        $target -= $weight;
        if ($target <= 0) {
            return $index;
        }
    }

    return array_key_last($weights);
}

// ─── What there is to play ───────────────────────────────────────────────────

$pdo = genshinDb();
$users = usersDb();

$account = $users->prepare('SELECT id, username FROM users WHERE id = ?');
$account->execute([$userId]);
$account = $account->fetch();

if (!$account) {
    fwrite(STDERR, "No account with id {$userId}. Pick one with --user=<id>.\n");
    exit(1);
}

$quizzes = $pdo->query('SELECT id, name FROM quizzes WHERE deleted = FALSE ORDER BY id')->fetchAll();
$characters = $pdo->query('SELECT id, name FROM characters WHERE deleted = FALSE ORDER BY id')->fetchAll();

if (!$quizzes || !$characters) {
    fwrite(STDERR, "There are no quizzes or no characters to play them with.\n");
    exit(1);
}

printf(
    "Seeding %s (id %d): %d questions over %d days, across %d quizzes and %d characters.\n",
    $account['username'],
    $userId,
    $questions,
    $days,
    count($quizzes),
    count($characters)
);

// ─── The shape of this player ────────────────────────────────────────────────

// How good they are overall. One draw, so a run is one person rather than a
// crowd averaging out to 50%.
$skill = gauss(0.35, 0.45);

/**
 * Per quiz: how often it gets played, and how hard it is.
 *
 * Popularity is log-normal because playing is a choice made over and over -
 * a quiz that is slightly preferred gets played a lot more, not slightly more.
 * A sigma of 0.8 gives the favourite something like ten times the plays of the
 * one nobody likes, which is what a real list of favourites looks like.
 */
$quizPopularity = [];
$quizHardness = [];

foreach ($quizzes as $index => $quiz) {
    $quizPopularity[$index] = logNormal(0.0, 0.8);
    $quizHardness[$index] = gauss(0.0, 0.55);
}

$popularityTotal = array_sum($quizPopularity);

/**
 * Per character: how often they come up, and how well they are known.
 *
 * The two are correlated on purpose - a character seen often is a character
 * learnt - but only loosely, because the game has famous characters nobody can
 * name the voice of and obscure ones with an unmistakable silhouette.
 */
$characterWeight = [];
$recognisability = [];

foreach ($characters as $index => $character) {
    $fame = gauss(0.0, 1.0);
    $characterWeight[$index] = logNormal($fame * 0.55, 0.45);
    $recognisability[$index] = $fame * 0.5 + gauss(0.0, 0.9);
}

$characterTotal = array_sum($characterWeight);

/**
 * Per day: how many questions, if any.
 *
 * The mean drifts on a slow sine - interest in a game waxes and wanes over
 * months rather than staying flat - with a weekend bump on top. A day is quiet
 * outright about a third of the time, which is what gives the activity grid
 * its gaps and makes a streak worth counting.
 */
$dayWeights = [];

for ($day = 0; $day < $days; $day++) {
    // Two full cycles across the window, so a run of any length shows both a
    // busy stretch and a quiet one.
    $drift = 1.0 + 0.55 * sin(2 * M_PI * $day / max(1, $days) * 2.0);

    // 0 = today, counting backwards, so the weekday has to count back too.
    $weekday = (int) date('N', strtotime("-{$day} days"));
    $weekend = $weekday >= 6 ? 1.45 : 1.0;

    $quiet = uniform() < 0.3;

    $dayWeights[$day] = $quiet ? 0.0 : max(0.0, gauss($drift * $weekend, 0.5));
}

// A run of days near the end left deliberately busy, so there is a current
// streak to show rather than a grid that stops a fortnight ago.
$streak = min($days, 3 + (int) round(abs(gauss(4, 2))));
for ($day = 0; $day < $streak; $day++) {
    $dayWeights[$day] = max($dayWeights[$day], max(0.4, gauss(1.4, 0.4)));
}

$dayTotal = array_sum($dayWeights);

if ($dayTotal <= 0) {
    fwrite(STDERR, "Every day came out quiet - try a different --seed.\n");
    exit(1);
}

// ─── Playing them ────────────────────────────────────────────────────────────

$rows = [];

for ($n = 0; $n < $questions; $n++) {
    $quizIndex = pickWeighted($quizPopularity, $popularityTotal);
    $characterIndex = pickWeighted($characterWeight, $characterTotal);
    $dayIndex = pickWeighted($dayWeights, $dayTotal);

    // Easy, medium and hard in the proportions people actually pick them:
    // mostly the middle, and hard least of all.
    $roll = uniform();
    $difficulty = $roll < 0.34 ? 1 : ($roll < 0.79 ? 2 : 3);

    $score = $skill
        + $recognisability[$characterIndex]
        - $quizHardness[$quizIndex]
        // Each step up costs about the same, which is what makes the
        // difficulty breakdown on the profile page read as a slope.
        - ($difficulty - 1) * 0.85
        + gauss(0.0, 0.4);

    $win = uniform() < logistic($score);

    // Tries spent on the question. A win takes fewer, and a loss is a question
    // somebody kept at - so both are normal, with different means, clamped at
    // one because a finished question took at least one try.
    $attempts = (int) round($win ? gauss(1.6, 0.9) : gauss(3.2, 1.4));
    $attempts = max(1, min(9, $attempts));

    // Evening, mostly. A gaussian around eight, wrapped into the day.
    $hour = min(23, max(6, (int) round(gauss(20.0, 3.2))));
    $minute = mt_rand(0, 59);
    $second = mt_rand(0, 59);

    $timestamp = date('Y-m-d', strtotime("-{$dayIndex} days")) . sprintf(' %02d:%02d:%02d', $hour, $minute, $second);

    $rows[] = [
        $userId,
        $characters[$characterIndex]['id'],
        $quizzes[$quizIndex]['id'],
        $win ? 'true' : 'false',
        $attempts,
        $timestamp,
        $difficulty,
    ];
}

// ─── What that came to ───────────────────────────────────────────────────────

$byQuiz = [];
$byDifficulty = [];
$daysPlayed = [];
$wins = 0;

foreach ($rows as $row) {
    $quizName = '';
    foreach ($quizzes as $quiz) {
        if ($quiz['id'] === $row[2]) {
            $quizName = $quiz['name'];
            break;
        }
    }

    $byQuiz[$quizName] ??= ['played' => 0, 'wins' => 0];
    $byQuiz[$quizName]['played']++;
    $byQuiz[$quizName]['wins'] += $row[3] === 'true' ? 1 : 0;

    $byDifficulty[$row[6]] ??= ['played' => 0, 'wins' => 0];
    $byDifficulty[$row[6]]['played']++;
    $byDifficulty[$row[6]]['wins'] += $row[3] === 'true' ? 1 : 0;

    $daysPlayed[substr($row[5], 0, 10)] = true;
    $wins += $row[3] === 'true' ? 1 : 0;
}

echo "\n  overall      " . $wins . '/' . count($rows) . sprintf(' won (%.1f%%)', 100 * $wins / count($rows)) . "\n";
echo "  days played  " . count($daysPlayed) . " of {$days}\n\n";

arsort($byQuiz);
foreach ($byQuiz as $name => $totals) {
    printf("  %-12s %5d played  %5.1f%% won\n", $name, $totals['played'], 100 * $totals['wins'] / $totals['played']);
}

echo "\n";
ksort($byDifficulty);
foreach ($byDifficulty as $level => $totals) {
    printf("  difficulty %d %5d played  %5.1f%% won\n", $level, $totals['played'], 100 * $totals['wins'] / $totals['played']);
}

if ($dryRun) {
    echo "\n--dry-run: nothing was written.\n";
    exit(0);
}

// ─── Writing it ──────────────────────────────────────────────────────────────

if ($clear) {
    $existing = $pdo->prepare('SELECT count(*) FROM user_quiz_history WHERE user_id = ?');
    $existing->execute([$userId]);
    $existing = (int) $existing->fetchColumn();

    echo "\n--clear: removing all {$existing} existing rows for this account first.\n";
    $pdo->prepare('DELETE FROM user_quiz_history WHERE user_id = ?')->execute([$userId]);
}

$pdo->beginTransaction();

try {
    $insert = $pdo->prepare(
        'INSERT INTO user_quiz_history (user_id, character_id, quiz_id, win, attempts, created_at, difficulty)
              VALUES (?, ?, ?, ?, ?, ?, ?)'
    );

    foreach ($rows as $row) {
        $insert->execute($row);
    }

    // Recomputed from the log rather than added to, so anything that was
    // already there is folded in and the two tables cannot drift apart. This
    // is the same arithmetic /api/quiz/result does one question at a time.
    $pdo->prepare('DELETE FROM quiz_stats_history WHERE user_id = ?')->execute([$userId]);
    $pdo->prepare(
        "INSERT INTO quiz_stats_history (user_id, character_id, quiz_id, wins, losses, attempts, created_at)
         SELECT user_id, character_id, quiz_id,
                count(*) FILTER (WHERE win),
                count(*) FILTER (WHERE NOT win),
                COALESCE(sum(attempts), 0),
                min(created_at)
           FROM user_quiz_history
          WHERE user_id = ?
          GROUP BY user_id, character_id, quiz_id"
    )->execute([$userId]);

    $pdo->commit();
} catch (\Throwable $e) {
    $pdo->rollBack();
    fwrite(STDERR, "\nNothing was written: " . $e->getMessage() . "\n");
    exit(1);
}

$logged = $pdo->prepare('SELECT count(*) FROM user_quiz_history WHERE user_id = ?');
$logged->execute([$userId]);

$totals = $pdo->prepare('SELECT count(*) FROM quiz_stats_history WHERE user_id = ?');
$totals->execute([$userId]);

printf("\nDone. %d questions logged, %d lifetime rows.\n", (int) $logged->fetchColumn(), (int) $totals->fetchColumn());
