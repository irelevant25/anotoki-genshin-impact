<?php

declare(strict_types=1);

/**
 * users/050 - the words moved into the anotoki library's shape - on a
 * database as its owner left it: built from this site's own migrations up to
 * users/049, then worded over the way the old admin panel, its import and the
 * old command line could (a string reworded in English and in Slovak, a
 * language's string cleared, blanks stored, a guide reworded and another
 * cleared, a language added and hidden, a key made in the panel, one scoped
 * to the Star Rail site that never came, a description edited, a key whose
 * English was cleared) - and then brought up to date by the site's own engine,
 * as Apply does: users/050, users/051 and the library's set - and everything
 * that came after them (anotoki-lib 0.4.1's sets, users/052, genshin_impact/
 * 028 and 029), which the same Apply brings to a database this old.
 *
 * What must hold: every string that was not blank is still there word for
 * word, with its writer and its time - a guide's body as a guide, the rest as
 * strings - and nothing else came in but the library's words, 051's, 055's
 * and 057's, nothing else went but 053's, 056's and 057's, and nothing else
 * was reworded but the footer's Feedback where it was still users/004's (057:
 * an owner's rewording of it stands); the
 * blanks went; the tables are in the library's shape, which its own 001
 * proved; the copies keep everything as it was. And 050 refuses, naming what
 * stops it, a database it cannot move: a language code that is no code, a
 * table that refers to the languages besides the strings.
 *
 * Also the order guard, which takes the library's sets around the two
 * folders (tests/library-tools-migration.test.php has the rest of it).
 */

require __DIR__ . '/lib.php';
require __DIR__ . '/db_lib.php';
require TEST_BACKEND . '/vendor/autoload.php';
require TEST_BACKEND . '/api/migration_runner.php';

// ── The sets and their order: no database ───────────────────────────────────

echo "The library's translations set comes after the site's two folders\n";

same('the sets, in the order they run', ['anotoki_admin', 'users', 'genshin_impact', 'anotoki_translations', 'anotoki_people'], migrationSetNames());
$sets = migrationSets();
same('the engine is given all five', ['anotoki_admin', 'users', 'genshin_impact', 'anotoki_translations', 'anotoki_people'], array_map(fn ($set) => $set->name, $sets));
check('the fourth is the library\'s, from vendor/', $sets[3]->library && str_contains(str_replace('\\', '/', $sets[3]->directory), '/vendor/anotoki/lib/'));
same('--folder=anotoki_translations is the library\'s set alone', ['anotoki_translations'], array_map(fn ($set) => $set->name, migrationSets('anotoki_translations')));
same('a folder of the site\'s own is still itself alone (merge-databases.php)', ['users'], array_map(fn ($set) => $set->name, migrationSets('users')));

$recorded = fn (array $users, array $genshin, array $library) => ['anotoki_admin' => ['001_audit_log.sql'], 'users' => $users, 'genshin_impact' => $genshin, 'anotoki_translations' => $library, 'anotoki_people' => []];
same('all three applied: in order', null, migrationsOrderRefusal($recorded(['001.sql'], ['001.sql'], ['001_languages_and_strings.sql'])));
same('the folders applied, the library\'s waiting: in order', null, migrationsOrderRefusal($recorded(['001.sql'], ['001.sql'], [])));
same('a fresh database: in order', null, migrationsOrderRefusal(array_fill_keys(migrationSetNames(), [])));
$refusal = migrationsOrderRefusal($recorded([], [], ['001_languages_and_strings.sql']));
check('the library\'s set recorded before users/: refused, naming both', $refusal !== null && str_contains($refusal, "the anotoki library's anotoki_translations") && str_contains($refusal, 'migrations/users/'), (string) $refusal);
$refusal = migrationsOrderRefusal($recorded(['001.sql'], [], []), 'anotoki_translations');
check('--folder=anotoki_translations before genshin_impact/ has run: refused', $refusal !== null && str_contains($refusal, 'migrations/genshin_impact/ comes before'), (string) $refusal);
$refusal = migrationsOrderRefusal($recorded([], ['001.sql'], []));
check('the content half alone: refused as before', $refusal !== null && str_contains($refusal, 'merge-databases.php'), (string) $refusal);

testNeedsDatabase();

// ── A database as its owner left it ─────────────────────────────────────────

echo "A database as its owner left it (users/001-049, genshin_impact/001-027)\n";

// The library's translations set as anotoki-lib 0.7.0 brings it: 001-004 (the
// words' shape, the kit's, the sign-in page's and the feedback form's words),
// 005-009 (the legal pages', the top bar's, the kit's newer pieces', the tabs'
// and the inputs' words), 010-011 (the Privacy page's sentences made true) and
// 012 (the family's footer's words).
const LIBRARY_WORDS_FILES = [
    '001_languages_and_strings.sql', '002_library_words.sql', '003_sign_in_words.sql', '004_feedback_words.sql',
    '005_legal_words.sql', '006_top_bar_words.sql', '007_kit_piece_words.sql', '008_tab_words.sql', '009_input_words.sql',
    '010_backups_where_words.sql', '011_privacy_words_made_true.sql', '012_footer_words.sql',
];

// Everything after users/049 and genshin_impact/027 came with this release or
// the ones after it: users/050 and 051 with the words, then anotoki-lib
// 0.4.1's sets, users/052-053 and genshin_impact/028-029, 0.5.0's users/054,
// 0.6's users/055-056 (the legal pages' facts, the multiselect's old
// summaries gone) with the library's words 005-012, and users/057 (the
// public footer's words), which one Apply brings along.
const WORDS_AND_AFTER = [
    'anotoki_admin/001_audit_log.sql', 'anotoki_admin/002_feedback.sql',
    'users/050_translations_into_the_library.sql', 'users/051_guide_strings.sql', 'users/052_people.sql',
    'users/053_drop_old_feedback_and_callback_strings.sql', 'users/054_visitor_starts_hashed.sql',
    'users/055_legal_pages.sql', 'users/056_drop_multiselect_selected_strings.sql', 'users/057_public_footer_strings.sql',
    'genshin_impact/028_audit_into_library.sql', 'genshin_impact/029_feedback_into_library.sql',
    'anotoki_translations/001_languages_and_strings.sql', 'anotoki_translations/002_library_words.sql',
    'anotoki_translations/003_sign_in_words.sql', 'anotoki_translations/004_feedback_words.sql',
    'anotoki_translations/005_legal_words.sql', 'anotoki_translations/006_top_bar_words.sql',
    'anotoki_translations/007_kit_piece_words.sql', 'anotoki_translations/008_tab_words.sql',
    'anotoki_translations/009_input_words.sql', 'anotoki_translations/010_backups_where_words.sql',
    'anotoki_translations/011_privacy_words_made_true.sql', 'anotoki_translations/012_footer_words.sql',
    'anotoki_people/001_people.sql',
];

// What users/056 takes away: the multiselect's old summaries, which nothing reads.
const MULTISELECT_SUMMARY_KEYS = ['multiselect.selected.few', 'multiselect.selected.none', 'multiselect.selected.one', 'multiselect.selected.other'];
// How many keys users/055 brings: the legal pages' facts in genshin's words and the footer's fan line.
const LEGAL_PAGE_KEYS = 44;
// What users/057 brings - the public footer's What's new, the account panel's Background row - and takes away: the
// footer's old GitHub and Backgrounds items, which nothing reads.
const FOOTER_NEW_KEYS = ['account.background', 'footer.whatsNew'];
const FOOTER_GONE_KEYS = ['footer.backgrounds', 'footer.github'];

// What users/053 takes away with anotoki-lib 0.4.1: the old feedback form's
// words (its two buttons among them) and the old sign-in callback page's.
const OLD_FORM_KEYS = [
    'auth.callback.back', 'auth.callback.cancelled', 'auth.callback.code', 'auth.callback.expired', 'auth.callback.failed',
    'auth.callback.retry', 'auth.callback.title', 'common.cancel', 'common.submit',
    'feedback.actual', 'feedback.actualPlaceholder', 'feedback.additional', 'feedback.additionalPlaceholder', 'feedback.anonymous',
    'feedback.anonymousNote', 'feedback.details', 'feedback.detailsPlaceholder', 'feedback.emailHelp', 'feedback.emailOptional',
    'feedback.emailPlaceholder', 'feedback.failed', 'feedback.incomplete', 'feedback.message', 'feedback.messagePlaceholder',
    'feedback.section', 'feedback.sectionPlaceholder', 'feedback.sending', 'feedback.stepsPlaceholder', 'feedback.subject',
    'feedback.subjectPlaceholder', 'feedback.thanks', 'feedback.title', 'feedback.type', 'feedback.typeBug', 'feedback.typeOther',
    'feedback.typeSuggestion',
];
// ...and the keys of the same namespaces the pages still read, which it keeps.
const STILL_READ_KEYS = [
    'feedback.steps', 'feedback.expected', 'feedback.expectedPlaceholder', 'feedback.browser', 'feedback.browserPlaceholder',
    'feedback.whyImportant', 'feedback.whyImportantPlaceholder', 'footer.feedback', 'common.close', 'common.signIn',
    'auth.startFailed', 'auth.unavailable',
];

$base = testDatabase('words_base');
$pdo = testPdo($base);
$built = testMigrate($pdo, ['users' => '049_drop_not_set_up_strings.sql', 'genshin_impact' => '027_visitor_history_index.sql']);
check('built by the site\'s engine', $built['error'] === null, (string) $built['error']);
same('the words wait: users/050 and 051, the library\'s sets, and what came after', WORDS_AND_AFTER, array_map(fn ($file) => $file['set'] . '/' . $file['name'], siteMigrator($pdo)->applicable()));

// What the old admin panel did to a string: the value, who; the trigger stamps the time. The key was stamped too.
$pdo->exec("INSERT INTO users (id, username, email) VALUES (7, 'Owner', 'owner@example.test')");
$pdo->exec("UPDATE translations SET value = 'Today''s pair', updated_by = 7 WHERE key_name = 'nav.daily' AND language_code = 'en'");
$pdo->exec("UPDATE translations SET value = 'Dnešná dvojica', updated_by = 7 WHERE key_name = 'nav.daily' AND language_code = 'sk'");
$pdo->exec("UPDATE translation_keys SET updated_by = 7 WHERE name = 'nav.daily'");
// A Slovak string cleared in the grid: the old API deleted the row.
$pdo->exec("DELETE FROM translations WHERE key_name = 'footer.feedback' AND language_code = 'sk'");
// What the old command line's import could store: an empty string, and one of spaces.
$pdo->exec("UPDATE translations SET value = '' WHERE key_name = 'footer.backgrounds' AND language_code = 'sk'");
$pdo->exec("UPDATE translations SET value = '   ' WHERE key_name = 'footer.account' AND language_code = 'sk'");
// The guides: one reworded in Slovak in the HTML editor, one whose Slovak was cleared, one blanked by an import.
$pdo->exec("UPDATE translations SET value = '<h4>Môj návod</h4>\n<p>Slová majiteľa.</p>', updated_by = 7 WHERE key_name = 'guide.daily.content' AND language_code = 'sk'");
$pdo->exec("DELETE FROM translations WHERE key_name = 'guide.dish.content' AND language_code = 'sk'");
$pdo->exec("UPDATE translations SET value = ' ' WHERE key_name = 'guide.voice.content' AND language_code = 'sk'");
// A language added in the panel and left hidden, with a string and a guide of its own.
$pdo->exec("INSERT INTO languages (name, code, native_name, enabled, sort_order) VALUES ('German', 'de', 'Deutsch', FALSE, 3)");
$pdo->exec("INSERT INTO translations (key_name, language_code, value, created_by, updated_by) VALUES ('nav.daily', 'de', 'Täglich', 7, 7), ('guide.daily.content', 'de', '<p>Täglich</p>', 7, 7)");
// A key made in the panel (POST /api/translation-keys), one scoped to the Star Rail site, a description edited there.
$pdo->exec("INSERT INTO translation_keys (name, description, site, created_by, updated_by) VALUES ('nav.extra', 'Made in the panel', 'common', 7, 7)");
$pdo->exec("INSERT INTO translations (key_name, language_code, value, created_by, updated_by) VALUES ('nav.extra', 'en', 'Extra', 7, 7)");
$pdo->exec("INSERT INTO translation_keys (name, description, site) VALUES ('nav.starRail', 'Star Rail only', 'star_rail')");
$pdo->exec("INSERT INTO translations (key_name, language_code, value) VALUES ('nav.starRail', 'en', 'Trailblaze')");
$pdo->exec("UPDATE translation_keys SET description = 'Edited by the owner' WHERE name = 'nav.games'");
// A key flagged as markup by mistake (it is no guide), and one whose English was cleared in the grid.
$pdo->exec("UPDATE translation_keys SET is_html = TRUE WHERE name = 'notFound.text'");
$pdo->exec("DELETE FROM translations WHERE key_name = 'nav.quizzes' AND language_code = 'en'");

$before = $pdo->query('SELECT key_name, language_code, value, updated_by, COALESCE(updated_at, created_at)::text AS stamp FROM translations ORDER BY key_name, language_code')->fetchAll();
$keysBefore = $pdo->query('SELECT name, description FROM translation_keys ORDER BY name')->fetchAll(PDO::FETCH_KEY_PAIR);
$pdo = null;

// A copy of it for each run below: the base stays as the owner left it.
$name = testDatabase('words', $base);
$pdo = testPdo($name);

echo "Apply, as the Migrations page does\n";

$result = siteMigrator($pdo)->apply();
check('applied without an error', $result['error'] === null, (string) $result['error']);
same('what was applied, in order', WORDS_AND_AFTER, array_map(fn ($file) => $file['set'] . '/' . $file['name'], $result['applied']));
same('nothing waits any more', [], siteMigrator($pdo)->applicable());
same('the library\'s files are recorded under its own name', LIBRARY_WORDS_FILES, recordedMigrations($pdo)['anotoki_translations']);

echo "Every word, where it belongs\n";

$strings = [];
foreach ($pdo->query('SELECT key_name, language_code, value, updated_by, updated_at::timestamp::text AS stamp FROM translations')->fetchAll() as $row) {
    $strings[$row['key_name'] . '|' . $row['language_code']] = $row;
}
$guides = [];
foreach ($pdo->query('SELECT guide, language_code, html, updated_by, updated_at::timestamp::text AS stamp FROM guide_contents')->fetchAll() as $row) {
    $guides['guide.' . $row['guide'] . '.content|' . $row['language_code']] = $row;
}

$lost = [];
$blank = 0;
foreach ($before as $row) {
    $key = $row['key_name'] . '|' . $row['language_code'];
    if (in_array($row['key_name'], OLD_FORM_KEYS, true) || in_array($row['key_name'], MULTISELECT_SUMMARY_KEYS, true)) {
        // users/053's and 056's to take away - looked at below.
        continue;
    }
    if (preg_match('/\S/', $row['value']) !== 1) {
        $blank++;
        if (isset($strings[$key]) || isset($guides[$key])) {
            $lost[] = "$key (blank, still there)";
        }
        continue;
    }
    if (in_array($row['key_name'], FOOTER_GONE_KEYS, true) || $key === 'footer.feedback|en') {
        // users/057's to take away, and the one string it rewords - looked at below.
        continue;
    }
    $guide = $guides[$key] ?? null;
    $now = preg_match('/^guide\.[^.]+\.content$/', $row['key_name']) === 1
        ? ($guide === null ? null : ['value' => $guide['html']] + $guide)
        : ($strings[$key] ?? null);
    if ($now === null || $now['value'] !== $row['value'] || (string) $now['updated_by'] !== (string) $row['updated_by'] || $now['stamp'] !== $row['stamp']) {
        $lost[] = $key;
    }
}
same('every string that was not blank: word for word, with its writer and its time', [], $lost);
same('the three blanks are gone', 3, $blank);

// 002's 54, 003's nine (the sign-in page's), 004's 31 (the feedback form's), 005's 122 (the legal pages'), 006's
// one (the top bar's), 007's four (the kit's newer pieces'), 008's two (the tabs'), 009's 34 (the inputs') and 012's
// four (the footer's); 010 and 011 reword only.
$libraryKeys = (int) $pdo->query("SELECT count(*) FROM translation_keys WHERE name LIKE 'anotoki.%'")->fetchColumn();
same('the library\'s own keys came, 261 of them', 261, $libraryKeys);
$guideBodies = count(array_filter(array_keys($keysBefore), fn ($key) => preg_match('/^guide\.[^.]+\.content$/', $key) === 1));
same('and nothing else but 051\'s one key, 055\'s and 057\'s in, 053\'s, 056\'s and 057\'s out: the keys but the guides\' bodies, kept', count($keysBefore) - $guideBodies + 1 - count(OLD_FORM_KEYS) + LEGAL_PAGE_KEYS - count(MULTISELECT_SUMMARY_KEYS) + count(FOOTER_NEW_KEYS) - count(FOOTER_GONE_KEYS) + 261, (int) $pdo->query('SELECT count(*) FROM translation_keys')->fetchColumn());
$inList = "'" . implode("', '", MULTISELECT_SUMMARY_KEYS) . "'";
same('056: the multiselect\'s four old summaries, all there before, gone - with every string under one', [4, 0, 0], [
    count(array_intersect(MULTISELECT_SUMMARY_KEYS, array_keys($keysBefore))),
    (int) $pdo->query("SELECT count(*) FROM translation_keys WHERE name IN ($inList)")->fetchColumn(),
    (int) $pdo->query("SELECT count(*) FROM translations WHERE key_name IN ($inList)")->fetchColumn(),
]);
same('...multiselect.more.* kept, which the field still reads', 0, count(array_diff(
    array_values(array_filter(array_keys($keysBefore), fn ($key) => str_starts_with($key, 'multiselect.more.'))),
    $pdo->query("SELECT name FROM translation_keys WHERE name LIKE 'multiselect.more.%'")->fetchAll(PDO::FETCH_COLUMN),
)));
same('055: the legal pages\' facts and the footer\'s fan line, in English and Slovak', [LEGAL_PAGE_KEYS, LEGAL_PAGE_KEYS, LEGAL_PAGE_KEYS], [
    (int) $pdo->query("SELECT count(*) FROM translation_keys WHERE name LIKE 'legal.%' OR name = 'footer.fanDisclaimer'")->fetchColumn(),
    (int) $pdo->query("SELECT count(*) FROM translations WHERE language_code = 'en' AND (key_name LIKE 'legal.%' OR key_name = 'footer.fanDisclaimer')")->fetchColumn(),
    (int) $pdo->query("SELECT count(*) FROM translations WHERE language_code = 'sk' AND (key_name LIKE 'legal.%' OR key_name = 'footer.fanDisclaimer')")->fetchColumn(),
]);
$inList = "'" . implode("', '", FOOTER_GONE_KEYS) . "'";
same('057: the footer\'s GitHub and Backgrounds items, both there before, gone - with every string under them', [count(FOOTER_GONE_KEYS), 0, 0], [
    count(array_intersect(FOOTER_GONE_KEYS, array_keys($keysBefore))),
    (int) $pdo->query("SELECT count(*) FROM translation_keys WHERE name IN ($inList)")->fetchColumn(),
    (int) $pdo->query("SELECT count(*) FROM translations WHERE key_name IN ($inList)")->fetchColumn(),
]);
same('...the footer\'s What\'s new and the account panel\'s Background, in English and Slovak', ["What's new", 'Čo je nové', 'Background', 'Pozadie'], [
    $strings['footer.whatsNew|en']['value'] ?? null,
    $strings['footer.whatsNew|sk']['value'] ?? null,
    $strings['account.background|en']['value'] ?? null,
    $strings['account.background|sk']['value'] ?? null,
]);
same('...and the footer\'s Feedback alone, where users/004\'s "Feedback/Contact" stood', 'Feedback', $strings['footer.feedback|en']['value'] ?? null);

$inList = "'" . implode("', '", OLD_FORM_KEYS) . "'";
same('053: the old feedback form\'s and callback page\'s keys, all there before, gone - with every string under one, in every language', [count(OLD_FORM_KEYS), 0, 0], [
    count(array_intersect(OLD_FORM_KEYS, array_keys($keysBefore))),
    (int) $pdo->query("SELECT count(*) FROM translation_keys WHERE name IN ($inList)")->fetchColumn(),
    (int) $pdo->query("SELECT count(*) FROM translations WHERE key_name IN ($inList)")->fetchColumn(),
]);
same('...and every key of their namespaces the pages still read, kept', STILL_READ_KEYS, array_values(array_intersect(STILL_READ_KEYS, $pdo->query('SELECT name FROM translation_keys')->fetchAll(PDO::FETCH_COLUMN))));

same('the owner\'s English rewording, and who made it', ["Today's pair", 7], [$strings['nav.daily|en']['value'], (int) $strings['nav.daily|en']['updated_by']]);
same('the owner\'s Slovak rewording', 'Dnešná dvojica', $strings['nav.daily|sk']['value']);
check('the Slovak string cleared in the grid stays cleared (reads the English)', !isset($strings['footer.feedback|sk']));
same('the hidden language\'s string', 'Täglich', $strings['nav.daily|de']['value'] ?? null);
same('the owner\'s guide in Slovak, and who wrote it', ["<h4>Môj návod</h4>\n<p>Slová majiteľa.</p>", 7], [$guides['guide.daily.content|sk']['html'] ?? null, (int) ($guides['guide.daily.content|sk']['updated_by'] ?? 0)]);
check('the hidden language\'s guide', ($guides['guide.daily.content|de']['html'] ?? null) === '<p>Täglich</p>');
check('the guide cleared in Slovak, and the one blanked, read the English', !isset($guides['guide.dish.content|sk']) && !isset($guides['guide.voice.content|sk']) && isset($guides['guide.voice.content|en']));
same('every guide has its English', 11, (int) $pdo->query("SELECT count(*) FROM guide_contents WHERE language_code = 'en'")->fetchColumn());
check('the minesweeper\'s 2,154 characters, whole', mb_strlen($guides['guide.minesweeper.content|en']['html'] ?? '') > 2000);
same('no guide\'s body is a key any more; the titles are', [0, 11], [(int) $pdo->query("SELECT count(*) FROM translation_keys WHERE name LIKE 'guide.%.content'")->fetchColumn(), (int) $pdo->query("SELECT count(*) FROM translation_keys WHERE name LIKE 'guide.%.title'")->fetchColumn()]);
check('the key flagged as markup by mistake is still a string', isset($strings['notFound.text|en']));
same('the key made in the panel, and its description', ['Extra', 'Made in the panel'], [$strings['nav.extra|en']['value'] ?? null, $pdo->query("SELECT description FROM translation_keys WHERE name = 'nav.extra'")->fetchColumn()]);
check('the Star Rail key is this site\'s now, like every key', isset($strings['nav.starRail|en']));
same('the description edited in the panel, kept', 'Edited by the owner', $pdo->query("SELECT description FROM translation_keys WHERE name = 'nav.games'")->fetchColumn());
check('the key whose English was cleared: still without it, its Slovak kept', !isset($strings['nav.quizzes|en']) && isset($strings['nav.quizzes|sk']));
same('051: the guide that cannot be had, in English and Slovak', ['This guide could not be loaded. Close it and try again.', 'Tento návod sa nepodarilo načítať. Zavri ho a skús to znova.'], [$strings['guide.loadFailed|en']['value'] ?? null, $strings['guide.loadFailed|sk']['value'] ?? null]);
same('the library\'s words, in both languages', ['Language: {name} ({code})', 'Jazyk: {name} ({code})'], [$strings['anotoki.language.button|en']['value'] ?? null, $strings['anotoki.language.button|sk']['value'] ?? null]);

echo "The library's shape\n";

$columns = [];
foreach ($pdo->query("SELECT table_name, column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = current_schema() AND table_name IN ('languages', 'translation_keys', 'translations', 'guide_contents') ORDER BY table_name, ordinal_position")->fetchAll() as $row) {
    $columns[$row['table_name']][] = $row['column_name'] . ' ' . $row['data_type'] . ($row['is_nullable'] === 'NO' ? ' not null' : '');
}
same('languages', ['name character varying not null', 'code character varying not null', 'native_name character varying not null', 'enabled boolean not null', 'sort_order integer not null'], $columns['languages']);
same('translation_keys', ['name character varying not null', 'description text', 'created_at timestamp with time zone not null'], $columns['translation_keys']);
same('translations', ['key_name character varying not null', 'language_code character varying not null', 'value text not null', 'updated_at timestamp with time zone not null', 'updated_by integer'], $columns['translations']);
same('guide_contents', ['guide character varying not null', 'language_code character varying not null', 'html text not null', 'updated_at timestamp with time zone not null', 'updated_by integer'], $columns['guide_contents']);
same('languages is keyed by its code', 'PRIMARY KEY (code)', $pdo->query("SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'languages'::regclass AND contype = 'p'")->fetchColumn());
same('the hidden language kept its place and its switch', ['German', 'Deutsch', 'hidden', 3], array_values($pdo->query("SELECT name, native_name, CASE WHEN enabled THEN 'offered' ELSE 'hidden' END, sort_order FROM languages WHERE code = 'de'")->fetch()));
same('no scope table, no trigger on the words', [false, 0], [(bool) $pdo->query("SELECT to_regclass('sites') IS NOT NULL")->fetchColumn(), (int) $pdo->query("SELECT count(*) FROM pg_trigger WHERE NOT tgisinternal AND tgrelid IN ('languages'::regclass, 'translation_keys'::regclass, 'translations'::regclass)")->fetchColumn()]);

$refused = static function (PDO $pdo, string $sql, string $code): string {
    try {
        $pdo->exec($sql);
        return 'stored';
    } catch (PDOException $e) {
        return $e->getCode() === $code ? 'refused' : 'refused otherwise: ' . $e->getCode();
    }
};
same('an empty string can no longer be stored', 'refused', $refused($pdo, "INSERT INTO translations (key_name, language_code, value) VALUES ('nav.games', 'de', '')", '23514'));
same('a code that is no code cannot become a language', 'refused', $refused($pdo, "INSERT INTO languages (code, name, native_name) VALUES ('EN_gb', 'Odd', 'Odd')", '23514'));
same('deleting a language takes its guides with it', 0, (function () use ($pdo): int {
    $pdo->exec("DELETE FROM languages WHERE code = 'de'");
    return (int) $pdo->query("SELECT count(*) FROM guide_contents WHERE language_code = 'de'")->fetchColumn();
})());

echo "The copies, for one release\n";

same('translations_before_library: every string as it was, blanks and guides included', count($before), (int) $pdo->query('SELECT count(*) FROM translations_before_library')->fetchColumn());
same('translation_keys_before_library: every key, with its scope and flag', count($keysBefore), (int) $pdo->query('SELECT count(*) FROM translation_keys_before_library')->fetchColumn());
same('...the Star Rail scope and the mistaken flag among them', ['star_rail', 'flagged'], array_values($pdo->query("SELECT (SELECT site FROM translation_keys_before_library WHERE name = 'nav.starRail'), (SELECT CASE WHEN is_html THEN 'flagged' END FROM translation_keys_before_library WHERE name = 'notFound.text')")->fetch()));
$pdo = null;

// ── The footer's Feedback, reworded by its owner ────────────────────────────

echo "users/057 rewords the footer's Feedback only where it is still users/004's\n";

$reworded = testDatabase('words_feedback', $base);
$pdo = testPdo($reworded);
$pdo->exec("UPDATE translations SET value = 'Write to us', updated_by = 7 WHERE key_name = 'footer.feedback' AND language_code = 'en'");
$result = siteMigrator($pdo)->apply();
check('applied without an error', $result['error'] === null, (string) $result['error']);
$feedback = $pdo->query("SELECT value, updated_by FROM translations WHERE key_name = 'footer.feedback' AND language_code = 'en'")->fetch();
same('the owner\'s English rewording stands, with who made it', ['Write to us', 7], [$feedback['value'] ?? null, (int) ($feedback['updated_by'] ?? 0)]);
$pdo = null;

// ── What 050 will not move ──────────────────────────────────────────────────

echo "What users/050 refuses, naming it\n";

$odd = testDatabase('words_odd', $base);
$pdo = testPdo($odd);
$pdo->exec("INSERT INTO languages (name, code, native_name) VALUES ('Klingon', 'tlh', 'tlhIngan Hol')");
$result = siteMigrator($pdo)->apply();
check('a language code that is no code: 050 fails, saying which', ($result['failed']['name'] ?? '') === '050_translations_into_the_library.sql' && str_contains((string) $result['error'], "'tlh'"), (string) $result['error']);
check('...and nothing of it is applied: the old shape stands, no copy was kept', (bool) $pdo->query("SELECT 1 FROM information_schema.columns WHERE table_name = 'translation_keys' AND column_name = 'site'")->fetchColumn() && !$pdo->query("SELECT to_regclass('translations_before_library') IS NOT NULL")->fetchColumn());
same('...nor anything after it - only the library\'s admin set, which runs first', ['anotoki_admin/001_audit_log.sql', 'anotoki_admin/002_feedback.sql'], array_map(fn ($file) => $file['set'] . '/' . $file['name'], $result['applied']));
$pdo = null;

$referring = testDatabase('words_ref', $base);
$pdo = testPdo($referring);
$pdo->exec('CREATE TABLE notes (id SERIAL PRIMARY KEY, language_code VARCHAR(10) REFERENCES languages (code))');
$result = siteMigrator($pdo)->apply();
check('a table that refers to the languages besides the strings: 050 fails, naming it', ($result['failed']['name'] ?? '') === '050_translations_into_the_library.sql' && str_contains((string) $result['error'], 'notes'), (string) $result['error']);
$pdo = null;
