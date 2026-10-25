<?php

declare(strict_types=1);

/**
 * users/068 - the old multiselect's last words go (anotoki-lib 0.11.0: the admin lists' filters and the material
 * form's groups are the library's <anotoki-multiselect>, which says "+2 more" in its own words) - on a database built
 * the way every test builds one (the site's engine: the library's admin set whole, users/ to 067, genshin_impact/ to
 * 033), then brought up to date as Apply does:
 *
 *   - its three keys (multiselect.more.one, .few, .other) go, with every string under them - one the owner reworded
 *     too;
 *   - nothing else goes;
 *   - its statements run again find nothing to do, and its gate is content;
 *   - the gate notices a word it was to take away and did not, and nothing of a refused run is kept.
 */

use Anotoki\Lib\Migrations\Splitter;

require __DIR__ . '/lib.php';
require __DIR__ . '/db_lib.php';
require TEST_BACKEND . '/vendor/autoload.php';
require TEST_BACKEND . '/api/migration_runner.php';

testNeedsDatabase();

const MORE_KEYS = ['multiselect.more.few', 'multiselect.more.one', 'multiselect.more.other'];
const FILE = 'users/068_drop_multiselect_more_strings.sql';

$pdo = testPdo(testDatabase('multiselect_words'));
$built = testMigrate($pdo, ['anotoki_admin' => '999', 'users' => '067_drop_the_old_copies.sql', 'genshin_impact' => '033_drop_the_old_copies.sql']);
check('a database built up to users/067 and genshin_impact/033', $built['error'] === null, (string) $built['error']);

$in = implode(', ', array_map(static fn(string $key): string => $pdo->quote($key), MORE_KEYS));
$words = static fn(): array => [
    (int) $pdo->query("SELECT count(*) FROM translation_keys WHERE name IN ($in)")->fetchColumn(),
    (int) $pdo->query("SELECT count(*) FROM translations WHERE key_name IN ($in)")->fetchColumn(),
];

same('the three are there, as users/015 left them, each in English and Slovak', [3, 6], $words());
// The owner's own wording of one of them: it goes too.
$pdo->exec("UPDATE translations SET value = '(a {count} ďalších)' WHERE key_name = 'multiselect.more.other' AND language_code = 'sk'");
/** The site's own keys and strings - not the library's (anotoki.*), which its sets bring as Apply runs them. */
$siteWords = static fn(): array => [
    (int) $pdo->query("SELECT count(*) FROM translation_keys WHERE name NOT LIKE 'anotoki.%'")->fetchColumn(),
    (int) $pdo->query("SELECT count(*) FROM translations WHERE key_name NOT LIKE 'anotoki.%'")->fetchColumn(),
];
[$keysBefore, $stringsBefore] = $siteWords();

// ── The gate, before anything is applied ────────────────────────────────────

echo "Its gate\n";

/** The file's statements in a transaction, rolled back: the statement starting with $skip left out; what its gate says. */
$run = static function (string $skip = '') use ($pdo): string {
    $pdo->beginTransaction();
    try {
        foreach (Splitter::split((string) file_get_contents(TEST_BACKEND . '/migrations/' . FILE)) as $statement) {
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

same('users/068 as it is: content', 'no complaint', $run());
$said = $run('DELETE FROM translation_keys');
check(
    'with the words left (their delete skipped): refused, naming them',
    str_contains($said, "users/068: the old multiselect's words are still here: multiselect.more.few, multiselect.more.one, multiselect.more.other"),
    $said,
);
same('...and nothing of either run was kept', [3, 6], $words());

// ── Applied ─────────────────────────────────────────────────────────────────

echo "Applied, as Apply does\n";

$applied = siteMigrator($pdo)->apply();
$names = array_map(static fn(array $file): string => $file['set'] . '/' . $file['name'], $applied['applied']);
check('users/068 applied by the site\'s engine, its gate content', $applied['error'] === null && in_array(FILE, $names, true), (string) $applied['error']);
same('the three are gone, every string under them - the owner\'s wording too', [0, 0], $words());
same('nothing else of the site\'s went: its other keys and strings as they were', [$keysBefore - 3, $stringsBefore - 6], $siteWords());

$pdo->beginTransaction();
$again = 'no complaint';
try {
    foreach (Splitter::split((string) file_get_contents(TEST_BACKEND . '/migrations/' . FILE)) as $statement) {
        $pdo->exec($statement);
    }
} catch (PDOException $e) {
    $again = $e->getMessage();
}
$pdo->rollBack();
same('its statements again: nothing to do, its gate content', 'no complaint', $again);
