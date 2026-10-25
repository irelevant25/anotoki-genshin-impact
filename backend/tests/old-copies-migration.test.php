<?php

declare(strict_types=1);

/**
 * users/067 and genshin_impact/033 - the old copies go (the owner's request of 2026-10-25: no leftover tables) - on
 * a database built the way every test builds one (the site's engine: the library's admin set whole, users/ to 066,
 * genshin_impact/ to 032), with the copies as the moves left them and a deleted person's message in the feedback's,
 * then brought up to date as Apply does:
 *
 *   - users/067 drops users/050's two copies of the words and deletes the Privacy page's "Older copies" words
 *     (legal.oldCopies.*), every string under them; genshin_impact/033 drops 028's and 029's copies of the audit log
 *     and feedback - a file of the content half, as those copies are made after every users/ file on a new
 *     installation;
 *   - nothing else goes: the library's tables and their rows, the other words of the Privacy page;
 *   - their statements run again find nothing to do, and their gates are content;
 *   - each gate notices what it was to take away and did not - a copy left, a word left - and nothing of a refused
 *     run is kept.
 */

use Anotoki\Lib\Migrations\Splitter;

require __DIR__ . '/lib.php';
require __DIR__ . '/db_lib.php';
require TEST_BACKEND . '/vendor/autoload.php';
require TEST_BACKEND . '/api/migration_runner.php';

testNeedsDatabase();

const COPIES = ['translations_before_library', 'translation_keys_before_library', 'audit_logs_before_library', 'feedback_before_library'];
const OLD_COPIES_KEYS = ['legal.oldCopies.kept', 'legal.oldCopies.name', 'legal.oldCopies.what', 'legal.oldCopies.why'];

$pdo = testPdo(testDatabase('old_copies'));
$built = testMigrate($pdo, ['anotoki_admin' => '999', 'users' => '066_site_settings_into_the_library.sql', 'genshin_impact' => '032_lists_unwrapped.sql']);
check('a database built up to users/066 and genshin_impact/032', $built['error'] === null, (string) $built['error']);

/** Which of the four copies are there. */
$there = static fn(): array => array_values(array_filter(COPIES, static fn(string $table): bool => $pdo->query("SELECT to_regclass('$table') IS NOT NULL")->fetchColumn() === true));
$in = implode(', ', array_map(static fn(string $key): string => $pdo->quote($key), OLD_COPIES_KEYS));
$words = static fn(): array => [
    (int) $pdo->query("SELECT count(*) FROM translation_keys WHERE name IN ($in)")->fetchColumn(),
    (int) $pdo->query("SELECT count(*) FROM translations WHERE key_name IN ($in)")->fetchColumn(),
];

same('the four copies are there, as 050, 028 and 029 left them', COPIES, $there());
same('...the Privacy page\'s words for them too, each in English and Slovak', [4, 8], $words());
// A message from before the move by a person since deleted, as the scrub left it: the copy holds the row.
$pdo->exec("INSERT INTO feedback_before_library (id, type, message, user_id, username) VALUES (77, 'Other', 'old words', 7, 'deleted-7')");
check('...the words\' copy holds every string 050 copied', (int) $pdo->query('SELECT count(*) FROM translations_before_library')->fetchColumn() > 0);
$feedbackBefore = (int) $pdo->query('SELECT count(*) FROM anotoki_feedback')->fetchColumn();
$legalBefore = (int) $pdo->query("SELECT count(*) FROM translation_keys WHERE name LIKE 'legal.%'")->fetchColumn();

// ── The gates, before anything is applied ───────────────────────────────────

echo "Their gates\n";

/** A file's statements in a transaction, rolled back: the statement starting with $skip left out; what its gate says. */
$run = static function (string $file, string $skip = '') use ($pdo): string {
    $pdo->beginTransaction();
    try {
        foreach (Splitter::split((string) file_get_contents(TEST_BACKEND . "/migrations/$file")) as $statement) {
            if ($skip !== '' && str_starts_with($statement, $skip)) {
                continue;
            }
            $pdo->exec($statement);
        }
        $pdo->rollBack();

        return 'no complaint';
    } catch (PDOException $e) {
        $pdo->rollBack();

        return $e->getMessage();
    }
};

same('users/067 as it is: content', 'no complaint', $run('users/067_drop_the_old_copies.sql'));
$said = $run('users/067_drop_the_old_copies.sql', 'DROP TABLE IF EXISTS translation_keys_before_library');
check('users/067 with a copy left (its drop skipped): refused', str_contains($said, 'users/067: the old copies of the words are still here'), $said);
$said = $run('users/067_drop_the_old_copies.sql', 'DELETE FROM translation_keys');
check(
    'users/067 with the words left (their delete skipped): refused, naming them',
    str_contains($said, 'users/067: the Privacy page\'s words for the old copies are still here: legal.oldCopies.kept, legal.oldCopies.name'),
    $said,
);
same('genshin_impact/033 as it is: content', 'no complaint', $run('genshin_impact/033_drop_the_old_copies.sql'));
$said = $run('genshin_impact/033_drop_the_old_copies.sql', 'DROP TABLE IF EXISTS feedback_before_library');
check('genshin_impact/033 with a copy left (its drop skipped): refused', str_contains($said, 'genshin_impact/033: the old copies of the audit log and feedback are still here'), $said);
same('...and nothing of any of them was kept: the four copies and the words as they were', [COPIES, [4, 8]], [$there(), $words()]);

// ── Applied ─────────────────────────────────────────────────────────────────

echo "Applied, as Apply does\n";

$applied = siteMigrator($pdo)->apply();
$names = array_map(static fn(array $file): string => $file['set'] . '/' . $file['name'], $applied['applied']);
check(
    'users/067 and genshin_impact/033 applied by the site\'s engine, in that order, their gates content',
    $applied['error'] === null &&
        array_search('users/067_drop_the_old_copies.sql', $names, true) !== false &&
        array_search('users/067_drop_the_old_copies.sql', $names, true) < array_search('genshin_impact/033_drop_the_old_copies.sql', $names, true),
    (string) $applied['error'],
);
same('the four copies are gone, the deleted person\'s old message with them', [], $there());
same('...and the Privacy page\'s four words, every string under them', [0, 0], $words());
same(
    'nothing else went: the library\'s feedback as it was, the Privacy page\'s other words',
    [$feedbackBefore, $legalBefore - 4],
    [(int) $pdo->query('SELECT count(*) FROM anotoki_feedback')->fetchColumn(), (int) $pdo->query("SELECT count(*) FROM translation_keys WHERE name LIKE 'legal.%'")->fetchColumn()],
);

$pdo->beginTransaction();
$again = 'no complaint';
try {
    foreach (['users/067_drop_the_old_copies.sql', 'genshin_impact/033_drop_the_old_copies.sql'] as $file) {
        foreach (Splitter::split((string) file_get_contents(TEST_BACKEND . "/migrations/$file")) as $statement) {
            $pdo->exec($statement);
        }
    }
} catch (PDOException $e) {
    $again = $e->getMessage();
}
$pdo->rollBack();
same('their statements again: nothing to do, their gates content', 'no complaint', $again);
