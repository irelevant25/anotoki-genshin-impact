<?php

declare(strict_types=1);

/**
 * genshin_impact/034 - the characters' affiliations, each name meaning the same on every character (the Mismatch
 * quiz's affiliation sets, 2026-10-29) - on a database built the way every test builds one (the site's engine, up
 * to 033), with the lists the host holds and the odd ones beside them, then brought up to date as Apply does:
 *
 *   - "(on profile)" comes off every name, in any case, in deleted rows too; a name met twice once it is off is kept
 *     once, where it first stood; "None" and blanks go; every other note - formerly, as Owl - stays;
 *   - Xiao's "Liyue Adeptus" is "Adepti" (only Xiao's, only where he is not among them already), and a former
 *     Harbinger with no Fatui said gains "Fatui (formerly)";
 *   - what is no list of names stays as it is: NULL, [], a lone string, a list of numbers, an object;
 *   - only the rows it changes are written: updated_at moves on them alone;
 *   - its statements run again find nothing to do, and its gate is content;
 *   - its gate notices a note left on (the cleaning skipped), a list changed otherwise, Xiao left out of the Adepti,
 *     a former Harbinger left without the Fatui - and nothing of any of them is kept.
 */

use Anotoki\Lib\Migrations\Splitter;

require __DIR__ . '/lib.php';
require __DIR__ . '/db_lib.php';
require TEST_BACKEND . '/vendor/autoload.php';
require TEST_BACKEND . '/api/migration_runner.php';

testNeedsDatabase();

/** A character with what a row must have, `$affiliations` (JSON text, or null) its list; its id. */
function character(PDO $pdo, string $name, ?string $affiliations, bool $deleted = false): int
{
    $statement = $pdo->prepare(
        'INSERT INTO characters (name, element, weapon_type, rarity, model, namecard_description, version,
                                 voice_actor_english, voice_actor_japanese, voice_actor_korean, voice_actor_chinese, created_by, deleted, affiliations)
         VALUES (?, \'Anemo\', \'Sword\', 4, \'Medium Female\', \'x\', \'1.0\', \'x\', \'x\', \'x\', \'x\', 1, ?, CAST(? AS jsonb)) RETURNING id',
    );
    $statement->execute([$name, $deleted ? 'true' : 'false', $affiliations]);

    return (int) $statement->fetchColumn();
}

/** Every character's list (as JSONB's text) and updated_at, by id: what a run may or may not change. */
function listsNow(PDO $pdo): array
{
    $now = [];
    foreach ($pdo->query('SELECT id, affiliations::text AS affiliations, updated_at FROM characters ORDER BY id')->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $now[(int) $row['id']] = $row;
    }

    return $now;
}

$pdo = testPdo(testDatabase('affiliations'));
$upTo033 = testMigrate($pdo, ['anotoki_admin' => '999', 'genshin_impact' => '033_drop_the_old_copies.sql']);
check('a database built up to 033', $upTo033['error'] === null, (string) $upTo033['error']);

// ── The rows ────────────────────────────────────────────────────────────────

echo "034 on a database with the host's kinds of lists, and odd ones\n";

// Each case a character of its own: its name, what its list holds, what it must hold after (null: NULL), whether deleted.
$cases = [
    'a note on one name' => ['Jean', '["Knights of Favonius (on profile)", "Four Winds", "Gunnhildr Clan"]', '["Knights of Favonius", "Four Winds", "Gunnhildr Clan"]'],
    'no note' => ['Amber', '["Knights of Favonius"]', '["Knights of Favonius"]'],
    'notes that say more, kept' => [
        'Diluc',
        '["Knights of Favonius (formerly)", "Dawn Winery (on profile)", "Northern Intelligence Network (as Owl)", "Ragnvindr Clan (head)"]',
        '["Knights of Favonius (formerly)", "Dawn Winery", "Northern Intelligence Network (as Owl)", "Ragnvindr Clan (head)"]',
    ],
    'a name twice once the note is off: kept where it first stood' => ['Lyney', '["Fatui", "Hotel Bouffes d\'ete (on profile)", "Fatui (on profile)"]', '["Fatui", "Hotel Bouffes d\'ete"]'],
    'the note in capitals' => ['Neuvillette', '["Court of Fontaine (On Profile)", "Palais Mermonia"]', '["Court of Fontaine", "Palais Mermonia"]'],
    'None, and a former Harbinger with no Fatui' => [
        'Wanderer',
        '["None (on profile)", "Eleven Fatui Harbingers (formerly)", "Vahumana (as Hat Guy)"]',
        '["Eleven Fatui Harbingers (formerly)", "Vahumana (as Hat Guy)", "Fatui (formerly)"]',
    ],
    'a former Harbinger who says a Fatui already' => ['Columbina', '["Eleven Fatui Harbingers (formerly)", "Fatui (collaborator)"]', '["Eleven Fatui Harbingers (formerly)", "Fatui (collaborator)"]'],
    'a Harbinger still: nothing added' => ['Tartaglia', '["Eleven Fatui Harbingers", "Fatui (on profile)"]', '["Eleven Fatui Harbingers", "Fatui"]'],
    'Xiao, the Adepti by the profile\'s word' => ['Xiao', '["Liyue Adeptus (on profile)", "Yakshas"]', '["Adepti", "Yakshas"]'],
    'somebody else\'s Liyue Adeptus' => ['Not Xiao', '["Liyue Adeptus"]', '["Liyue Adeptus"]'],
    'nothing but None: an empty list' => ['Nobody', '["None (on profile)", " "]', '[]'],
    'NULL' => ['Manekin', null, null],
    'an empty list' => ['Manekina', '[]', '[]'],
    'a lone string' => ['A String', '"Knights of Favonius (on profile)"', '"Knights of Favonius (on profile)"'],
    'a list of numbers' => ['Numbers', '[1, 1]', '[1, 1]'],
    'a list with a number among its names' => ['Mixed', '["Fatui (on profile)", 2]', '["Fatui (on profile)", 2]'],
    'an object' => ['An Object', '{"1": "Fatui (on profile)"}', '{"1": "Fatui (on profile)"}'],
];
$rows = [];
foreach ($cases as $case => [$name, $stored]) {
    $rows[$case] = character($pdo, $name, $stored);
}
$deleted = character($pdo, 'A deleted one', '["Adepti (on profile)", "Adepti"]', true);
$before = listsNow($pdo);

// ── Applied ─────────────────────────────────────────────────────────────────

$applied = siteMigrator($pdo)->apply();
check(
    '034 applied by the site\'s engine, its gate content',
    $applied['error'] === null && in_array('genshin_impact/034_affiliations_cleaned.sql', array_map(static fn(array $file): string => $file['set'] . '/' . $file['name'], $applied['applied']), true),
    (string) $applied['error'],
);

/** Whether character $id's list is $json (JSONB's equality - its order too; null for NULL). */
$holds = static function (int $id, ?string $json) use ($pdo): bool {
    $statement = $pdo->prepare('SELECT affiliations IS NOT DISTINCT FROM CAST(? AS jsonb) FROM characters WHERE id = ?');
    $statement->execute([$json, $id]);

    return $statement->fetchColumn() === true;
};
$after = listsNow($pdo);
foreach ($cases as $case => [, $stored, $wanted]) {
    $id = $rows[$case];
    $changes = $stored !== $wanted;
    check(
        "$case: " . ($changes ? 'cleaned - its row written' : 'as it was - its row not written'),
        $holds($id, $wanted) && ($after[$id]['updated_at'] !== null) === $changes,
        (string) $after[$id]['affiliations'],
    );
}
check('a deleted row: cleaned too', $holds($deleted, '["Adepti"]'), (string) $after[$deleted]['affiliations']);
$written = array_keys(array_filter($after, static fn(array $row, int $id): bool => $row !== $before[$id], ARRAY_FILTER_USE_BOTH));
$wanted = array_values(array_merge(array_map(static fn(string $case): int => $rows[$case], array_keys(array_filter($cases, static fn(array $case): bool => $case[1] !== $case[2]))), [$deleted]));
sort($written);
sort($wanted);
same('no other row was written', $wanted, $written);
same('...and its temporary functions went with the file', 0, (int) $pdo->query("SELECT count(*) FROM pg_proc WHERE proname IN ('affiliations_cleaned_034', 'affiliations_named_034')")->fetchColumn());

// ── Again ───────────────────────────────────────────────────────────────────

echo "Its statements again\n";

$statements = Splitter::split((string) file_get_contents(TEST_BACKEND . '/migrations/genshin_impact/034_affiliations_cleaned.sql'));
check('the file\'s statements: two functions, the snapshot, three updates, the gate, two drops', count($statements) === 9, (string) count($statements));

/**
 * 034's statements in a transaction: $first made before them, the statement holding $skip left out, $change made
 * before the gate; what the gate says.
 */
$run034 = static function (string $first = '', string $skip = '', string $change = '', bool $keep = false) use ($pdo, $statements): string {
    $pdo->beginTransaction();
    try {
        if ($first !== '') {
            $pdo->exec($first);
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
        $keep ? $pdo->commit() : $pdo->rollBack();

        return 'no complaint';
    } catch (PDOException $e) {
        $pdo->rollBack();

        return $e->getMessage();
    }
};
same('run again: its gate content', 'no complaint', $run034(keep: true));
same('...and nothing written: every list and updated_at as the first run left them', $after, listsNow($pdo));

// ── The gate ────────────────────────────────────────────────────────────────

echo "Its gate\n";

$marked = $run034("UPDATE characters SET affiliations = '[\"Knights of Favonius (on profile)\"]' WHERE name = 'Amber'", 'SET affiliations = pg_temp.affiliations_cleaned_034(affiliations)');
check('a note left on (the cleaning skipped): refused, naming the character', str_contains($marked, '034: affiliations still marked "(on profile)", blank or "None": Amber'), $marked);
$changed = $run034(change: "UPDATE characters SET affiliations = affiliations || '[\"Spark Knight\"]' WHERE name = 'Amber'");
check('a list changed otherwise: refused, naming it', str_contains($changed, '034: lists changed beyond their notes: Amber #' . $rows['no note']), $changed);
$adeptus = $run034("UPDATE characters SET affiliations = '[\"Liyue Adeptus (on profile)\", \"Yakshas\"]' WHERE name = 'Xiao'", "THEN 'Adepti'");
check('Xiao left out of the Adepti (his statement skipped): refused', str_contains($adeptus, '034: Xiao is not among the Adepti: Xiao #' . $rows['Xiao, the Adepti by the profile\'s word']), $adeptus);
$harbinger = $run034("UPDATE characters SET affiliations = '[\"Eleven Fatui Harbingers (formerly)\", \"Vahumana (as Hat Guy)\"]' WHERE name = 'Wanderer'", "'[\"Fatui (formerly)\"]'::jsonb");
check('a former Harbinger left without the Fatui (the statement skipped): refused', str_contains($harbinger, '034: former Harbingers with no Fatui said: Wanderer'), $harbinger);
same('...and nothing of any of them was kept', $after, listsNow($pdo));
