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
 * strings - and nothing else came in but the library's words, 051's, 055's,
 * 057's, 058's, 061's, 062's and 063's, nothing else went but 053's, 056's,
 * 057's, 060's, 062's, 063's and 064's, and
 * nothing else was reworded but the footer's Feedback where it was still
 * users/004's (057), the quizzes' cards and Mismatch's guide where they were
 * still users/005's and 028's (059), and 060's guides and Slovak where they
 * were still their earlier migrations' - an owner's rewording of any of them
 * stands; the
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
same('the engine is given all five', ['anotoki_admin', 'users', 'genshin_impact', 'anotoki_translations', 'anotoki_people'], array_map(fn($set) => $set->name, $sets));
check('the fourth is the library\'s, from vendor/', $sets[3]->library && str_contains(str_replace('\\', '/', $sets[3]->directory), '/vendor/anotoki/lib/'));
same('--folder=anotoki_translations is the library\'s set alone', ['anotoki_translations'], array_map(fn($set) => $set->name, migrationSets('anotoki_translations')));
same('a folder of the site\'s own is still itself alone (merge-databases.php)', ['users'], array_map(fn($set) => $set->name, migrationSets('users')));

$recorded = fn(array $users, array $genshin, array $library) => [
    'anotoki_admin' => ['001_audit_log.sql'],
    'users' => $users,
    'genshin_impact' => $genshin,
    'anotoki_translations' => $library,
    'anotoki_people' => [],
];
same('all three applied: in order', null, migrationsOrderRefusal($recorded(['001.sql'], ['001.sql'], ['001_languages_and_strings.sql'])));
same('the folders applied, the library\'s waiting: in order', null, migrationsOrderRefusal($recorded(['001.sql'], ['001.sql'], [])));
same('a fresh database: in order', null, migrationsOrderRefusal(array_fill_keys(migrationSetNames(), [])));
$refusal = migrationsOrderRefusal($recorded([], [], ['001_languages_and_strings.sql']));
check(
    'the library\'s set recorded before users/: refused, naming both',
    $refusal !== null && str_contains($refusal, "the anotoki library's anotoki_translations") && str_contains($refusal, 'migrations/users/'),
    (string) $refusal,
);
$refusal = migrationsOrderRefusal($recorded(['001.sql'], [], []), 'anotoki_translations');
check('--folder=anotoki_translations before genshin_impact/ has run: refused', $refusal !== null && str_contains($refusal, 'migrations/genshin_impact/ comes before'), (string) $refusal);
$refusal = migrationsOrderRefusal($recorded([], ['001.sql'], []));
check('the content half alone: refused as before', $refusal !== null && str_contains($refusal, 'merge-databases.php'), (string) $refusal);

testNeedsDatabase();

// ── A database as its owner left it ─────────────────────────────────────────

echo "A database as its owner left it (users/001-049, genshin_impact/001-027)\n";

// The library's translations set as anotoki-lib 0.8.0 brings it: 001-004 (the
// words' shape, the kit's, the sign-in page's and the feedback form's words),
// 005-009 (the legal pages', the top bar's, the kit's newer pieces', the tabs'
// and the inputs' words), 010-011 (the Privacy page's sentences made true),
// 012 (the family's footer's words), 013 (the About and Support pages' and
// the footer's two links to them), and anotoki-lib 0.11.0's 014 (the kit's
// pieces' of 0.11.0: the dates', the editor's and more) and 015 (the site
// settings': the closed sign's, the announcement bar's, the notice's).
const LIBRARY_WORDS_FILES = [
    '001_languages_and_strings.sql',
    '002_library_words.sql',
    '003_sign_in_words.sql',
    '004_feedback_words.sql',
    '005_legal_words.sql',
    '006_top_bar_words.sql',
    '007_kit_piece_words.sql',
    '008_tab_words.sql',
    '009_input_words.sql',
    '010_backups_where_words.sql',
    '011_privacy_words_made_true.sql',
    '012_footer_words.sql',
    '013_about_and_support_words.sql',
    '014_editor_and_piece_words.sql',
    '015_site_settings_words.sql',
];

// Everything after users/049 and genshin_impact/027 came with this release or
// the ones after it: users/050 and 051 with the words, then anotoki-lib
// 0.4.1's sets, users/052-053 and genshin_impact/028-029, 0.5.0's users/054,
// 0.6's users/055-056 (the legal pages' facts, the multiselect's old
// summaries gone) with the library's words 005-013, users/057 (the
// public footer's words), users/058 (the quizzes' difficulty dialog's),
// users/059 (the quizzes' cards and Mismatch's guide reworded), users/060
// (words made true before the owner's usability test) and users/061 (the
// quizzes' levels' table; Voice's levels' seconds, 058's words, from the
// levels - tests/quiz-levels.test.php), users/062 (the detail pages' and the
// banners' new look's words), users/063 (the lists' new look's words) and
// users/064 (the account panel's date and clock words gone), users/065 (the
// Profile's new look's words), users/066 (genshin's site settings into the
// library's tables - anotoki-lib 0.11.0's anotoki_admin/003 - and the words of
// its old closed sign, bar and notice gone), users/067 (050's copies of the
// words gone, and the Privacy page's line for every old copy), users/068 (the
// old multiselect's last words gone, the library's multiselect in its place),
// users/069 (Mismatch's levels' properties and blend, in a saved row),
// users/070 (Mismatch's new sets' and Voice's languages' words, the Mismatch
// dialog's introduction and guide reworded), genshin_impact/033 (028's and
// 029's copies gone), genshin_impact/030-031 (the game's own ids, for the
// build analyzer's catalog), 032 (the lists the character form saved in one
// layer of JSON too many, unwrapped) and 034 (the affiliations' "(on profile)"
// notes off), which one Apply brings along.
const WORDS_AND_AFTER = [
    'anotoki_admin/001_audit_log.sql',
    'anotoki_admin/002_feedback.sql',
    'anotoki_admin/003_site_settings.sql',
    'users/050_translations_into_the_library.sql',
    'users/051_guide_strings.sql',
    'users/052_people.sql',
    'users/053_drop_old_feedback_and_callback_strings.sql',
    'users/054_visitor_starts_hashed.sql',
    'users/055_legal_pages.sql',
    'users/056_drop_multiselect_selected_strings.sql',
    'users/057_public_footer_strings.sql',
    'users/058_quiz_difficulty_strings.sql',
    'users/059_quiz_cards_and_mismatch_guide.sql',
    'users/060_words_made_true_for_the_usability_test.sql',
    'users/061_quiz_levels.sql',
    'users/062_database_pages_redesign_strings.sql',
    'users/063_database_lists_strings.sql',
    'users/064_drop_account_dates_and_clock_strings.sql',
    'users/065_profile_redesign_strings.sql',
    'users/066_site_settings_into_the_library.sql',
    'users/067_drop_the_old_copies.sql',
    'users/068_drop_multiselect_more_strings.sql',
    'users/069_mismatch_levels_properties.sql',
    'users/070_mismatch_and_voice_words.sql',
    'users/071_database_artifacts_and_food_strings.sql',
    'users/072_splash_and_constellation_strings.sql',
    'users/073_splash_and_constellation_levels.sql',
    'genshin_impact/028_audit_into_library.sql',
    'genshin_impact/029_feedback_into_library.sql',
    'genshin_impact/030_game_ids.sql',
    'genshin_impact/031_game_ids_filled.sql',
    'genshin_impact/032_lists_unwrapped.sql',
    'genshin_impact/033_drop_the_old_copies.sql',
    'genshin_impact/034_affiliations_cleaned.sql',
    'genshin_impact/035_splash_and_constellation_quizzes.sql',
    'anotoki_translations/001_languages_and_strings.sql',
    'anotoki_translations/002_library_words.sql',
    'anotoki_translations/003_sign_in_words.sql',
    'anotoki_translations/004_feedback_words.sql',
    'anotoki_translations/005_legal_words.sql',
    'anotoki_translations/006_top_bar_words.sql',
    'anotoki_translations/007_kit_piece_words.sql',
    'anotoki_translations/008_tab_words.sql',
    'anotoki_translations/009_input_words.sql',
    'anotoki_translations/010_backups_where_words.sql',
    'anotoki_translations/011_privacy_words_made_true.sql',
    'anotoki_translations/012_footer_words.sql',
    'anotoki_translations/013_about_and_support_words.sql',
    'anotoki_translations/014_editor_and_piece_words.sql',
    'anotoki_translations/015_site_settings_words.sql',
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
// What users/060 rewords where it is still its earlier migration's - the Quizzes', Daily's, Tournament's, Pixelate's and
// Mismatch's guides (Mismatch's Slovak is 059's, below), two guides' Slovak titles, the Slovak of the Database cards, the
// account panel and every other string that still said "vy", the wallpapers' window's one sentence - and takes away: the
// Database cards' help, the window's how-to. The Daily's Slovak guide is not among them: the owner reworded it, below,
// and it must stand.
const REWORDED_BY_060 = [
    'account.formats.failed|sk',
    'account.iamLead|sk',
    'account.manageNote|sk',
    'account.signOutNote|sk',
    'account.signedOutNote|sk',
    'admin.noAccess.text|sk',
    'auth.unavailable|sk',
    'backgrounds.whatText|en',
    'backgrounds.whatText|sk',
    'database.banners.info|sk',
    'database.characters.info|sk',
    'database.materials.info|sk',
    'database.weapons.info|sk',
    'guide.daily.content|en',
    'guide.mismatch.title|sk',
    'guide.pixelate.content|sk',
    'guide.pixelate.title|sk',
    'guide.quizzes.content|en',
    'guide.quizzes.content|sk',
    'guide.tournament.content|en',
    'guide.tournament.content|sk',
    'notFound.text|sk',
    'whatsNew.earlier|sk',
];
const GONE_BY_060 = [
    'backgrounds.availableText',
    'backgrounds.availableTitle',
    'backgrounds.howTitle',
    'backgrounds.note',
    'backgrounds.step1',
    'backgrounds.step2',
    'backgrounds.step3',
    'backgrounds.step4',
    'backgrounds.whatTitle',
    'database.banners.about',
    'database.characters.about',
    'database.materials.about',
    'database.weapons.about',
];
// What users/059 rewords, where it is still users/005's and 028's: Mismatch's card and guide, which said four characters
// in both languages, and the other five cards' Slovak, from "vy" to "ty".
const REWORDED_BY_059 = [
    'guide.mismatch.content|en',
    'guide.mismatch.content|sk',
    'quiz.banners.info|sk',
    'quiz.dish.info|sk',
    'quiz.mismatch.info|en',
    'quiz.mismatch.info|sk',
    'quiz.music.info|sk',
    'quiz.pixelate.info|sk',
    'quiz.voice.info|sk',
];
// What users/058 brings: the quizzes' difficulty badge's and dialog's words, and what each level shows.
const DIFFICULTY_NEW_KEYS = [
    'quiz.difficulty.button',
    'quiz.difficulty.cancel',
    'quiz.difficulty.choose',
    'quiz.difficulty.current',
    'quiz.difficulty.daily',
    'quiz.difficulty.fromNext',
    'quiz.difficulty.intro',
    'quiz.difficulty.introMismatch',
    'quiz.difficulty.next',
    'quiz.difficulty.save',
    'quiz.difficulty.title',
    'quiz.levelInfo.mismatch',
    'quiz.levelInfo.music',
    'quiz.levelInfo.musicWhole',
    'quiz.levelInfo.pictureEasy',
    'quiz.levelInfo.pictureHard',
    'quiz.levelInfo.pictureMedium',
    'quiz.levelInfo.pixelate',
    'quiz.levelInfo.voiceEasy',
    'quiz.levelInfo.voiceHard',
    'quiz.levelInfo.voiceMedium',
];
// What users/061 brings: Voice's general words, for a level playing fewer pieces than its sentence names.
const LEVELS_NEW_KEYS = ['quiz.levelInfo.voiceOther'];
// How many keys users/062 and 063 bring - the database pages' new look's words, 28 and 19 - and what they take away:
// the labels those pages no longer say.
const DATABASE_PAGES_KEYS = 28 + 19;
const GONE_BY_062_063 = ['database.detail.demoMusic', 'database.detail.releaseDate', 'database.detail.voiceActors', 'database.filters.name'];
// What users/064 takes away: the account panel's Dates and Clock rows' words - their labels, the orders' and clocks'
// names, the "Saved." after a change - which nothing reads since the owner's decision of 2026-10-22 (only the IAM's
// account page sets them). Kept: the panel's line under its choices, and its words for a choice not saved.
const GONE_BY_064 = [
    'account.dateFormat',
    'account.formats.auto',
    'account.formats.clock12',
    'account.formats.clock24',
    'account.formats.dmyDot',
    'account.formats.dmySlash',
    'account.formats.mdySlash',
    'account.formats.saved',
    'account.formats.ymdDash',
    'account.timeFormat',
];
// What users/065 brings and takes away: the Profile's new look's 32 words (its tabs, its Quizzes and
// Characters tabs, its sorts, its history and its empty page's), and the table of characters' column names and the
// sentence over the activity grid, which the new page no longer says.
const PROFILE_NEW_KEYS = [
    'profile.activity.days',
    'profile.activity.longest',
    'profile.characters.count.few',
    'profile.characters.count.one',
    'profile.characters.count.other',
    'profile.characters.lead',
    'profile.characters.listLead',
    'profile.characters.none',
    'profile.characters.search',
    'profile.characters.showMore',
    'profile.characters.sort',
    'profile.empty.preview',
    'profile.empty.previewLead',
    'profile.empty.start',
    'profile.empty.startLead',
    'profile.history.today',
    'profile.history.yesterday',
    'profile.overview.longestHint',
    'profile.overview.wonHint',
    'profile.quizzes.lead',
    'profile.quizzes.notPlayed',
    'profile.quizzes.play',
    'profile.quizzes.playedCount',
    'profile.quizzes.tries',
    'profile.sort.best',
    'profile.sort.name',
    'profile.sort.played',
    'profile.sort.toughest',
    'profile.tabs.characters',
    'profile.tabs.history',
    'profile.tabs.overview',
    'profile.tabs.quizzes',
];
const GONE_BY_065 = [
    'profile.activity.summary',
    'profile.characters.column.attempts',
    'profile.characters.column.character',
    'profile.characters.column.lost',
    'profile.characters.column.played',
    'profile.characters.column.winRate',
    'profile.characters.column.won',
    'profile.empty.action',
];
// What users/066 takes away with genshin's own site settings: the old closed sign's, bar's and notice's words (034's,
// 035's - all there before) and the Privacy page's two lines for the old bar's storage (055's, which came after).
const GONE_BY_066 = [
    'legal.storage.announcement.kept',
    'legal.storage.announcement.purpose',
    'route.audience.ADMIN',
    'route.audience.EDITOR',
    'route.audience.PUBLIC',
    'route.audience.USER',
    'route.blockedText',
    'route.blockedTitle',
    'route.restrictedText',
    'route.restrictedTitle',
    'site.announcement.hide',
    'site.maintenance.signIn',
    'site.maintenance.staffLead',
    'site.maintenance.text',
    'site.maintenance.title',
];
// What users/067 takes away with the old copies: the Privacy page's line for them (055's, which came after).
const GONE_BY_067 = ['legal.oldCopies.kept', 'legal.oldCopies.name', 'legal.oldCopies.what', 'legal.oldCopies.why'];
// What users/068 takes away: genshin's own multiselect's "+2 more", which the library's multiselect says in its words.
const GONE_BY_068 = ['multiselect.more.few', 'multiselect.more.one', 'multiselect.more.other'];
// What users/070 brings: Mismatch's new sets' words - the five properties' names, the dialog's sentence naming a
// level's, a version said as one, the keys that play it - and Voice's languages'. What it rewords is 058's and 059's
// (the Mismatch dialog's introduction, not there before; its guide, 059's already).
const MISMATCH_VOICE_NEW_KEYS = [
    'quiz.levelInfo.mismatchShared',
    'quiz.mismatch.eraValue',
    'quiz.mismatch.keys',
    'quiz.mismatch.property.affiliation',
    'quiz.mismatch.property.element',
    'quiz.mismatch.property.era',
    'quiz.mismatch.property.region',
    'quiz.mismatch.property.weapon',
    'quiz.voice.language',
    'quiz.voice.languageMissing',
    'quiz.voice.languages.chinese',
    'quiz.voice.languages.english',
    'quiz.voice.languages.japanese',
    'quiz.voice.languages.korean',
];
// How many keys users/071 brings - the Artifacts and Food pages' words, 27 - and users/072's, Splash's and
// Constellation's: their cards, their guides' titles and the difficulty dialog's six sentences.
const ARTIFACTS_FOOD_KEYS = 27;
const SPLASH_CONSTELLATION_KEYS = [
    'guide.constellation.title',
    'guide.splash.title',
    'quiz.constellation.info',
    'quiz.constellation.title',
    'quiz.levelInfo.constellationEasy',
    'quiz.levelInfo.constellationHard',
    'quiz.levelInfo.constellationMedium',
    'quiz.levelInfo.splashEasy',
    'quiz.levelInfo.splashHard',
    'quiz.levelInfo.splashMedium',
    'quiz.splash.info',
    'quiz.splash.title',
];

// What users/053 takes away with anotoki-lib 0.4.1: the old feedback form's
// words (its two buttons among them) and the old sign-in callback page's.
const OLD_FORM_KEYS = [
    'auth.callback.back',
    'auth.callback.cancelled',
    'auth.callback.code',
    'auth.callback.expired',
    'auth.callback.failed',
    'auth.callback.retry',
    'auth.callback.title',
    'common.cancel',
    'common.submit',
    'feedback.actual',
    'feedback.actualPlaceholder',
    'feedback.additional',
    'feedback.additionalPlaceholder',
    'feedback.anonymous',
    'feedback.anonymousNote',
    'feedback.details',
    'feedback.detailsPlaceholder',
    'feedback.emailHelp',
    'feedback.emailOptional',
    'feedback.emailPlaceholder',
    'feedback.failed',
    'feedback.incomplete',
    'feedback.message',
    'feedback.messagePlaceholder',
    'feedback.section',
    'feedback.sectionPlaceholder',
    'feedback.sending',
    'feedback.stepsPlaceholder',
    'feedback.subject',
    'feedback.subjectPlaceholder',
    'feedback.thanks',
    'feedback.title',
    'feedback.type',
    'feedback.typeBug',
    'feedback.typeOther',
    'feedback.typeSuggestion',
];
// ...and the keys of the same namespaces the pages still read, which it keeps.
const STILL_READ_KEYS = [
    'feedback.steps',
    'feedback.expected',
    'feedback.expectedPlaceholder',
    'feedback.browser',
    'feedback.browserPlaceholder',
    'feedback.whyImportant',
    'feedback.whyImportantPlaceholder',
    'footer.feedback',
    'common.close',
    'common.signIn',
    'auth.startFailed',
    'auth.unavailable',
];

$base = testDatabase('words_base');
$pdo = testPdo($base);
$built = testMigrate($pdo, ['users' => '049_drop_not_set_up_strings.sql', 'genshin_impact' => '027_visitor_history_index.sql']);
check('built by the site\'s engine', $built['error'] === null, (string) $built['error']);
same('the words wait: users/050 and 051, the library\'s sets, and what came after', WORDS_AND_AFTER, array_map(fn($file) => $file['set'] . '/' . $file['name'], siteMigrator($pdo)->applicable()));

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
same('what was applied, in order', WORDS_AND_AFTER, array_map(fn($file) => $file['set'] . '/' . $file['name'], $result['applied']));
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
    if (
        in_array($row['key_name'], OLD_FORM_KEYS, true) ||
        in_array($row['key_name'], MULTISELECT_SUMMARY_KEYS, true) ||
        in_array($row['key_name'], GONE_BY_062_063, true) ||
        in_array($row['key_name'], GONE_BY_064, true) ||
        in_array($row['key_name'], GONE_BY_065, true) ||
        in_array($row['key_name'], GONE_BY_066, true) ||
        in_array($row['key_name'], GONE_BY_068, true)
    ) {
        // users/053's, 056's, 062's, 063's, 064's, 065's, 066's and 068's to take away - looked at below.
        continue;
    }
    if (preg_match('/\S/', $row['value']) !== 1) {
        $blank++;
        if (isset($strings[$key]) || isset($guides[$key])) {
            $lost[] = "$key (blank, still there)";
        }
        continue;
    }
    if (
        in_array($row['key_name'], FOOTER_GONE_KEYS, true) ||
        in_array($row['key_name'], GONE_BY_060, true) ||
        $key === 'footer.feedback|en' ||
        in_array($key, REWORDED_BY_059, true) ||
        in_array($key, REWORDED_BY_060, true)
    ) {
        // users/057's and 060's to take away, and the strings 057, 059 and 060 reword - looked at below.
        continue;
    }
    $guide = $guides[$key] ?? null;
    $now = preg_match('/^guide\.[^.]+\.content$/', $row['key_name']) === 1 ? ($guide === null ? null : ['value' => $guide['html']] + $guide) : $strings[$key] ?? null;
    if ($now === null || $now['value'] !== $row['value'] || (string) $now['updated_by'] !== (string) $row['updated_by'] || $now['stamp'] !== $row['stamp']) {
        $lost[] = $key;
    }
}
same('every string that was not blank: word for word, with its writer and its time', [], $lost);
same('the three blanks are gone', 3, $blank);

// 002's 54, 003's nine (the sign-in page's), 004's 31 (the feedback form's), 005's 122 (the legal pages'), 006's
// one (the top bar's), 007's four (the kit's newer pieces'), 008's two (the tabs'), 009's 34 (the inputs'), 012's
// four (the footer's), 013's 27 (the About and Support pages' 23, the footer's two links to them, the feedback
// form's Clear and its name), 014's 49 (the kit's pieces of 0.11.0) and 015's 20 (the site settings'); 010 and 011
// reword only.
$libraryKeys = (int) $pdo->query("SELECT count(*) FROM translation_keys WHERE name LIKE 'anotoki.%'")->fetchColumn();
same('the library\'s own keys came, 357 of them', 357, $libraryKeys);
$guideBodies = count(array_filter(array_keys($keysBefore), fn($key) => preg_match('/^guide\.[^.]+\.content$/', $key) === 1));
$came =
    1 +
    LEGAL_PAGE_KEYS +
    count(FOOTER_NEW_KEYS) +
    count(DIFFICULTY_NEW_KEYS) +
    count(LEVELS_NEW_KEYS) +
    DATABASE_PAGES_KEYS +
    count(PROFILE_NEW_KEYS) +
    count(MISMATCH_VOICE_NEW_KEYS) +
    ARTIFACTS_FOOD_KEYS +
    count(SPLASH_CONSTELLATION_KEYS);
$went =
    count(OLD_FORM_KEYS) +
    count(MULTISELECT_SUMMARY_KEYS) +
    count(FOOTER_GONE_KEYS) +
    count(GONE_BY_060) +
    count(GONE_BY_062_063) +
    count(GONE_BY_064) +
    count(GONE_BY_065) +
    count(GONE_BY_066) +
    count(GONE_BY_067) +
    count(GONE_BY_068);
same(
    'and nothing else but 051\'s one key, 055\'s, 057\'s, 058\'s, 061\'s, 062\'s, 063\'s, 065\'s, 070\'s, 071\'s and 072\'s in, 053\'s, 056\'s, 057\'s, 060\'s, 062\'s, 063\'s, 064\'s, 065\'s, 066\'s, 067\'s and 068\'s out: the keys but the guides\' bodies, kept',
    count($keysBefore) - $guideBodies + $came - $went + 357,
    (int) $pdo->query('SELECT count(*) FROM translation_keys')->fetchColumn(),
);
$inList = "'" . implode("', '", MISMATCH_VOICE_NEW_KEYS) . "'";
same(
    '070: Mismatch\'s new sets\' and Voice\'s languages\' words, none there before, each in English and Slovak',
    [0, count(MISMATCH_VOICE_NEW_KEYS), count(MISMATCH_VOICE_NEW_KEYS), count(MISMATCH_VOICE_NEW_KEYS)],
    [
        count(array_intersect(MISMATCH_VOICE_NEW_KEYS, array_keys($keysBefore))),
        (int) $pdo->query("SELECT count(*) FROM translation_keys WHERE name IN ($inList)")->fetchColumn(),
        (int) $pdo->query("SELECT count(*) FROM translations WHERE language_code = 'en' AND key_name IN ($inList)")->fetchColumn(),
        (int) $pdo->query("SELECT count(*) FROM translations WHERE language_code = 'sk' AND key_name IN ($inList)")->fetchColumn(),
    ],
);
$inList = "'" . implode("', '", DIFFICULTY_NEW_KEYS) . "'";
same(
    '058: the quizzes\' difficulty words, none there before, each in English and Slovak',
    [0, count(DIFFICULTY_NEW_KEYS), count(DIFFICULTY_NEW_KEYS), count(DIFFICULTY_NEW_KEYS)],
    [
        count(array_intersect(DIFFICULTY_NEW_KEYS, array_keys($keysBefore))),
        (int) $pdo->query("SELECT count(*) FROM translation_keys WHERE name IN ($inList)")->fetchColumn(),
        (int) $pdo->query("SELECT count(*) FROM translations WHERE language_code = 'en' AND key_name IN ($inList)")->fetchColumn(),
        (int) $pdo->query("SELECT count(*) FROM translations WHERE language_code = 'sk' AND key_name IN ($inList)")->fetchColumn(),
    ],
);
$inList = "'" . implode("', '", MULTISELECT_SUMMARY_KEYS) . "'";
same(
    '056: the multiselect\'s four old summaries, all there before, gone - with every string under one',
    [4, 0, 0],
    [
        count(array_intersect(MULTISELECT_SUMMARY_KEYS, array_keys($keysBefore))),
        (int) $pdo->query("SELECT count(*) FROM translation_keys WHERE name IN ($inList)")->fetchColumn(),
        (int) $pdo->query("SELECT count(*) FROM translations WHERE key_name IN ($inList)")->fetchColumn(),
    ],
);
same(
    '...multiselect.more.* kept by 056 - and taken away by 068, when the field became the library\'s: no multiselect word is left',
    [3, []],
    [
        count(array_filter(array_keys($keysBefore), fn($key) => str_starts_with($key, 'multiselect.more.'))),
        $pdo->query("SELECT name FROM translation_keys WHERE name LIKE 'multiselect.%'")->fetchAll(PDO::FETCH_COLUMN),
    ],
);
// Less the two lines for the old announcement bar's storage, which 066 took away (the library's preset says it now),
// and the four of the old copies, which 067 took away with the copies.
same(
    '055: the legal pages\' facts and the footer\'s fan line, in English and Slovak - but the two 066 and the four 067 took away',
    [LEGAL_PAGE_KEYS - 6, LEGAL_PAGE_KEYS - 6, LEGAL_PAGE_KEYS - 6],
    [
        (int) $pdo->query("SELECT count(*) FROM translation_keys WHERE name LIKE 'legal.%' OR name = 'footer.fanDisclaimer'")->fetchColumn(),
        (int) $pdo->query("SELECT count(*) FROM translations WHERE language_code = 'en' AND (key_name LIKE 'legal.%' OR key_name = 'footer.fanDisclaimer')")->fetchColumn(),
        (int) $pdo->query("SELECT count(*) FROM translations WHERE language_code = 'sk' AND (key_name LIKE 'legal.%' OR key_name = 'footer.fanDisclaimer')")->fetchColumn(),
    ],
);
$inList = "'" . implode("', '", FOOTER_GONE_KEYS) . "'";
same(
    '057: the footer\'s GitHub and Backgrounds items, both there before, gone - with every string under them',
    [count(FOOTER_GONE_KEYS), 0, 0],
    [
        count(array_intersect(FOOTER_GONE_KEYS, array_keys($keysBefore))),
        (int) $pdo->query("SELECT count(*) FROM translation_keys WHERE name IN ($inList)")->fetchColumn(),
        (int) $pdo->query("SELECT count(*) FROM translations WHERE key_name IN ($inList)")->fetchColumn(),
    ],
);
same(
    '...the footer\'s What\'s new and the account panel\'s Background, in English and Slovak',
    ["What's new", 'Čo je nové', 'Background', 'Pozadie'],
    [
        $strings['footer.whatsNew|en']['value'] ?? null,
        $strings['footer.whatsNew|sk']['value'] ?? null,
        $strings['account.background|en']['value'] ?? null,
        $strings['account.background|sk']['value'] ?? null,
    ],
);
same(
    '059: Mismatch\'s card for three to five characters, in English and Slovak, and the other cards\' Slovak says "ty"',
    [
        'Test your character knowledge by finding the "odd one out" among three to five character icons.',
        'Over si znalosti postáv a nájdi tú, ktorá medzi tri až päť ikon nepatrí.',
        'Skús spoznať postavy podľa silno pixelizovaných portrétov.',
        'Over si znalosti a spoznaj postavy podľa ich hlasu.',
    ],
    [
        $strings['quiz.mismatch.info|en']['value'] ?? null,
        $strings['quiz.mismatch.info|sk']['value'] ?? null,
        $strings['quiz.pixelate.info|sk']['value'] ?? null,
        $strings['quiz.voice.info|sk']['value'] ?? null,
    ],
);
same('...and the cards\' English but Mismatch\'s, as users/005 wrote it', 'Test your knowledge by identifying characters from their dish.', $strings['quiz.dish.info|en']['value'] ?? null);
same(
    '...and Mismatch\'s guide: three, four or five characters, in English and Slovak, no four left',
    [true, true, false, false],
    [
        str_contains($guides['guide.mismatch.content|en']['html'] ?? '', '<li>Three, four or five character icons are shown - more on a harder difficulty.</li>'),
        str_contains($guides['guide.mismatch.content|sk']['html'] ?? '', '<li>Zobrazia sa ikony troch, štyroch alebo piatich postáv - na ťažšej obtiažnosti viac.</li>'),
        str_contains($guides['guide.mismatch.content|en']['html'] ?? '', 'Four'),
        str_contains($guides['guide.mismatch.content|sk']['html'] ?? '', 'Štyri'),
    ],
);
same('...and the footer\'s Feedback alone, where users/004\'s "Feedback/Contact" stood', 'Feedback', $strings['footer.feedback|en']['value'] ?? null);

$inList = "'" . implode("', '", GONE_BY_060) . "'";
same(
    '060: the Database cards\' help and the wallpapers\' window\'s how-to, all there before, gone - with every string under them',
    [count(GONE_BY_060), 0, 0],
    [
        count(array_intersect(GONE_BY_060, array_keys($keysBefore))),
        (int) $pdo->query("SELECT count(*) FROM translation_keys WHERE name IN ($inList)")->fetchColumn(),
        (int) $pdo->query("SELECT count(*) FROM translations WHERE key_name IN ($inList)")->fetchColumn(),
    ],
);
same(
    '...the cards\' names in the Slovak guides\' titles, "ty" in the account panel and on the Database cards, the window\'s one sentence',
    [
        'O pixelácii',
        'O nesúlade',
        'Nie si prihlásený. Tvoje nastavenia sú uložené v tomto zariadení.',
        'Prihlasuješ sa účtom anotoki - tým istým pre všetky stránky anotoki.',
        'Prezri si postavy v hre a dozvieš sa o nich viac.',
        'Choose the wallpaper behind the site: it changes at once, and this browser keeps your choice.',
        'Vyber si tapetu za stránkou: zmení sa hneď a tento prehliadač si tvoju voľbu zapamätá.',
    ],
    [
        $strings['guide.pixelate.title|sk']['value'] ?? null,
        $strings['guide.mismatch.title|sk']['value'] ?? null,
        $strings['account.signedOutNote|sk']['value'] ?? null,
        $strings['account.iamLead|sk']['value'] ?? null,
        $strings['database.characters.info|sk']['value'] ?? null,
        $strings['backgrounds.whatText|en']['value'] ?? null,
        $strings['backgrounds.whatText|sk']['value'] ?? null,
    ],
);
same(
    '...and "ty" on the 404 page, in What\'s new, for the sign-in out of reach and on the admin panel\'s no-access page',
    [
        'Je nám ľúto, ale nemohli sme nájsť stránku, ktorú hľadáš. Skontroluj, či je adresa správna.',
        'Čakajú ťa aj staršie novinky - nájdeš ich v úplnom zozname.',
        'Stránka sa teraz nevie spojiť so službou prihlásenia. Skús to o chvíľu znova.',
        'Si prihlásený ako {username} a tento účet nemá na tejto stránke žiadnu rolu. Administrácia je určená jej editorom a administrátorom.',
    ],
    [
        $strings['notFound.text|sk']['value'] ?? null,
        $strings['whatsNew.earlier|sk']['value'] ?? null,
        $strings['auth.unavailable|sk']['value'] ?? null,
        $strings['admin.noAccess.text|sk']['value'] ?? null,
    ],
);
// The whole site says "ty" (the owner's decision): no Slovak string or guide of its own says "vy" - its pronouns, or a
// verb in the forms the site's Slovak used it in. The library's words (anotoki.*) are the library's.
$saysVy =
    '/(?<!\p{L})(ste|vás|vám|váš|vaša|vaše|vašej|vašu|vaším|vašich|vašim|môžete|máte|chcete|budete|nájdete|hľadáte|skúste|skontrolujte|' .
    'prihláste|prihlasujete|zvoľte|vyberte|kliknite|prezrite|prezerajte|prispôsobte|dozviete|zobrazíte|nastavíte|nájdite|overte)(?!\p{L})/iu';
$formal = [];
foreach ($strings as $key => $row) {
    if (str_ends_with($key, '|sk') && !str_starts_with($key, 'anotoki.') && preg_match($saysVy, $row['value']) === 1) {
        $formal[] = $key;
    }
}
foreach ($guides as $key => $row) {
    if (str_ends_with($key, '|sk') && preg_match($saysVy, $row['html']) === 1) {
        $formal[] = $key;
    }
}
same('...and no Slovak string or guide of the site\'s own says "vy" any more', [], $formal);
same(
    '...and the guides: nothing timed, the cards\' names, the difficulty chosen, the Tournament\'s setup as the page has it',
    [false, false, false, true, true, true, true, true],
    [
        str_contains($guides['guide.daily.content|en']['html'] ?? '', 'timed'),
        str_contains($guides['guide.quizzes.content|en']['html'] ?? '', 'timed'),
        str_contains($guides['guide.quizzes.content|sk']['html'] ?? '', 'na čas') || str_contains($guides['guide.quizzes.content|sk']['html'] ?? '', 'votrelec'),
        str_contains($guides['guide.quizzes.content|en']['html'] ?? '', '<li>Every quiz has a difficulty - choose it with the button above the question.</li>'),
        str_contains($guides['guide.pixelate.content|sk']['html'] ?? '', '<h4>Čo je kvíz Pixelácia?</h4>'),
        str_contains($guides['guide.mismatch.content|sk']['html'] ?? '', '<h4>Čo je kvíz Nesúlad?</h4>'),
        str_contains(str_replace("\r", '', $guides['guide.tournament.content|en']['html'] ?? ''), "<li>Choose the format.</li>\n<li>Choose how many characters take part.</li>\n<li>Press Start.</li>"),
        str_contains($guides['guide.tournament.content|sk']['html'] ?? '', '<li>Stlač tlačidlo Začať.</li>') &&
        str_contains($guides['guide.tournament.content|sk']['html'] ?? '', '<span class="tag">Jednoduché vyraďovanie</span>'),
    ],
);

$inList = "'" . implode("', '", GONE_BY_062_063) . "'";
same(
    '062 and 063: the labels the database pages no longer say, all there before, gone - with every string under them',
    [count(GONE_BY_062_063), 0, 0],
    [
        count(array_intersect(GONE_BY_062_063, array_keys($keysBefore))),
        (int) $pdo->query("SELECT count(*) FROM translation_keys WHERE name IN ($inList)")->fetchColumn(),
        (int) $pdo->query("SELECT count(*) FROM translations WHERE key_name IN ($inList)")->fetchColumn(),
    ],
);

$inList = "'" . implode("', '", GONE_BY_065) . "'";
same(
    '065: the Profile\'s old table\'s column names and the activity grid\'s sentence, all there before, gone - with every string under them',
    [count(GONE_BY_065), 0, 0],
    [
        count(array_intersect(GONE_BY_065, array_keys($keysBefore))),
        (int) $pdo->query("SELECT count(*) FROM translation_keys WHERE name IN ($inList)")->fetchColumn(),
        (int) $pdo->query("SELECT count(*) FROM translations WHERE key_name IN ($inList)")->fetchColumn(),
    ],
);
$inList = "'" . implode("', '", GONE_BY_066) . "'";
same(
    '066: the old closed sign\'s, bar\'s and notice\'s words, 13 of them there before, and the Privacy page\'s two for the old bar\'s storage, gone - with every string under them; the menu\'s mark kept',
    [count(GONE_BY_066) - 2, 0, 0, true],
    [
        count(array_intersect(GONE_BY_066, array_keys($keysBefore))),
        (int) $pdo->query("SELECT count(*) FROM translation_keys WHERE name IN ($inList)")->fetchColumn(),
        (int) $pdo->query("SELECT count(*) FROM translations WHERE key_name IN ($inList)")->fetchColumn(),
        (bool) $pdo->query("SELECT 1 FROM translation_keys WHERE name = 'route.hiddenBadge'")->fetchColumn(),
    ],
);
$inList = "'" . implode("', '", GONE_BY_067) . "'";
same(
    '067: the Privacy page\'s line for the old copies, none of it there before, gone - with every string under it',
    [0, 0, 0],
    [
        count(array_intersect(GONE_BY_067, array_keys($keysBefore))),
        (int) $pdo->query("SELECT count(*) FROM translation_keys WHERE name IN ($inList)")->fetchColumn(),
        (int) $pdo->query("SELECT count(*) FROM translations WHERE key_name IN ($inList)")->fetchColumn(),
    ],
);
$inList = "'" . implode("', '", GONE_BY_068) . "'";
same(
    '068: the old multiselect\'s three "+2 more", all there before, gone - with every string under them',
    [count(GONE_BY_068), 0, 0],
    [
        count(array_intersect(GONE_BY_068, array_keys($keysBefore))),
        (int) $pdo->query("SELECT count(*) FROM translation_keys WHERE name IN ($inList)")->fetchColumn(),
        (int) $pdo->query("SELECT count(*) FROM translations WHERE key_name IN ($inList)")->fetchColumn(),
    ],
);
$inList = "'" . implode("', '", PROFILE_NEW_KEYS) . "'";
same(
    '...and its 32 new words, none there before, each in English and Slovak',
    [0, count(PROFILE_NEW_KEYS), count(PROFILE_NEW_KEYS), count(PROFILE_NEW_KEYS)],
    [
        count(array_intersect(PROFILE_NEW_KEYS, array_keys($keysBefore))),
        (int) $pdo->query("SELECT count(*) FROM translation_keys WHERE name IN ($inList)")->fetchColumn(),
        (int) $pdo->query("SELECT count(*) FROM translations WHERE language_code = 'en' AND key_name IN ($inList)")->fetchColumn(),
        (int) $pdo->query("SELECT count(*) FROM translations WHERE language_code = 'sk' AND key_name IN ($inList)")->fetchColumn(),
    ],
);

$inList = "'" . implode("', '", GONE_BY_064) . "'";
same(
    '064: the account panel\'s date and clock words, all there before, gone - with every string under them',
    [count(GONE_BY_064), 0, 0],
    [
        count(array_intersect(GONE_BY_064, array_keys($keysBefore))),
        (int) $pdo->query("SELECT count(*) FROM translation_keys WHERE name IN ($inList)")->fetchColumn(),
        (int) $pdo->query("SELECT count(*) FROM translations WHERE key_name IN ($inList)")->fetchColumn(),
    ],
);
same(
    '...the panel\'s line under its choices and its words for a choice not saved, kept - described without the dates and the clock',
    [
        'These settings belong to your anotoki account and apply on every anotoki site.',
        'That could not be saved. Try again in a moment.',
        'Line in the account panel, under the appearance and language choosers of somebody signed in, saying they are the anotoki account\'s and every anotoki site follows them',
        'Notification when a change to the appearance or the language could not be saved to the anotoki account',
    ],
    [
        $strings['account.preferencesNote|en']['value'] ?? null,
        $strings['account.formats.failed|en']['value'] ?? null,
        $pdo->query("SELECT description FROM translation_keys WHERE name = 'account.preferencesNote'")->fetchColumn(),
        $pdo->query("SELECT description FROM translation_keys WHERE name = 'account.formats.failed'")->fetchColumn(),
    ],
);

$inList = "'" . implode("', '", OLD_FORM_KEYS) . "'";
same(
    '053: the old feedback form\'s and callback page\'s keys, all there before, gone - with every string under one, in every language',
    [count(OLD_FORM_KEYS), 0, 0],
    [
        count(array_intersect(OLD_FORM_KEYS, array_keys($keysBefore))),
        (int) $pdo->query("SELECT count(*) FROM translation_keys WHERE name IN ($inList)")->fetchColumn(),
        (int) $pdo->query("SELECT count(*) FROM translations WHERE key_name IN ($inList)")->fetchColumn(),
    ],
);
same(
    '...and every key of their namespaces the pages still read, kept',
    STILL_READ_KEYS,
    array_values(array_intersect(STILL_READ_KEYS, $pdo->query('SELECT name FROM translation_keys')->fetchAll(PDO::FETCH_COLUMN))),
);

same('the owner\'s English rewording, and who made it', ["Today's pair", 7], [$strings['nav.daily|en']['value'], (int) $strings['nav.daily|en']['updated_by']]);
same('the owner\'s Slovak rewording', 'Dnešná dvojica', $strings['nav.daily|sk']['value']);
check('the Slovak string cleared in the grid stays cleared (reads the English)', !isset($strings['footer.feedback|sk']));
same('the hidden language\'s string', 'Täglich', $strings['nav.daily|de']['value'] ?? null);
same(
    'the owner\'s guide in Slovak, and who wrote it',
    ["<h4>Môj návod</h4>\n<p>Slová majiteľa.</p>", 7],
    [$guides['guide.daily.content|sk']['html'] ?? null, (int) ($guides['guide.daily.content|sk']['updated_by'] ?? 0)],
);
check('the hidden language\'s guide', ($guides['guide.daily.content|de']['html'] ?? null) === '<p>Täglich</p>');
check(
    'the guide cleared in Slovak, and the one blanked, read the English',
    !isset($guides['guide.dish.content|sk']) && !isset($guides['guide.voice.content|sk']) && isset($guides['guide.voice.content|en']),
);
same('every guide has its English - Splash\'s and Constellation\'s too (users/072)', 13, (int) $pdo->query("SELECT count(*) FROM guide_contents WHERE language_code = 'en'")->fetchColumn());
check('the minesweeper\'s 2,154 characters, whole', mb_strlen($guides['guide.minesweeper.content|en']['html'] ?? '') > 2000);
same(
    'no guide\'s body is a key any more; the titles are',
    [0, 13],
    [
        (int) $pdo->query("SELECT count(*) FROM translation_keys WHERE name LIKE 'guide.%.content'")->fetchColumn(),
        (int) $pdo->query("SELECT count(*) FROM translation_keys WHERE name LIKE 'guide.%.title'")->fetchColumn(),
    ],
);
check('the key flagged as markup by mistake is still a string', isset($strings['notFound.text|en']));
same(
    'the key made in the panel, and its description',
    ['Extra', 'Made in the panel'],
    [$strings['nav.extra|en']['value'] ?? null, $pdo->query("SELECT description FROM translation_keys WHERE name = 'nav.extra'")->fetchColumn()],
);
check('the Star Rail key is this site\'s now, like every key', isset($strings['nav.starRail|en']));
same('the description edited in the panel, kept', 'Edited by the owner', $pdo->query("SELECT description FROM translation_keys WHERE name = 'nav.games'")->fetchColumn());
check('the key whose English was cleared: still without it, its Slovak kept', !isset($strings['nav.quizzes|en']) && isset($strings['nav.quizzes|sk']));
same(
    '051: the guide that cannot be had, in English and Slovak',
    ['This guide could not be loaded. Close it and try again.', 'Tento návod sa nepodarilo načítať. Zavri ho a skús to znova.'],
    [$strings['guide.loadFailed|en']['value'] ?? null, $strings['guide.loadFailed|sk']['value'] ?? null],
);
same(
    'the library\'s words, in both languages',
    ['Language: {name} ({code})', 'Jazyk: {name} ({code})'],
    [$strings['anotoki.language.button|en']['value'] ?? null, $strings['anotoki.language.button|sk']['value'] ?? null],
);

echo "The library's shape\n";

$columns = [];
foreach (
    $pdo
        ->query(
            "SELECT table_name, column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = current_schema() AND table_name IN ('languages', 'translation_keys', 'translations', 'guide_contents') ORDER BY table_name, ordinal_position",
        )
        ->fetchAll()
    as $row
) {
    $columns[$row['table_name']][] = $row['column_name'] . ' ' . $row['data_type'] . ($row['is_nullable'] === 'NO' ? ' not null' : '');
}
same(
    'languages',
    ['name character varying not null', 'code character varying not null', 'native_name character varying not null', 'enabled boolean not null', 'sort_order integer not null'],
    $columns['languages'],
);
same('translation_keys', ['name character varying not null', 'description text', 'created_at timestamp with time zone not null'], $columns['translation_keys']);
same(
    'translations',
    ['key_name character varying not null', 'language_code character varying not null', 'value text not null', 'updated_at timestamp with time zone not null', 'updated_by integer'],
    $columns['translations'],
);
same(
    'guide_contents',
    ['guide character varying not null', 'language_code character varying not null', 'html text not null', 'updated_at timestamp with time zone not null', 'updated_by integer'],
    $columns['guide_contents'],
);
same(
    'languages is keyed by its code',
    'PRIMARY KEY (code)',
    $pdo->query("SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'languages'::regclass AND contype = 'p'")->fetchColumn(),
);
same(
    'the hidden language kept its place and its switch',
    ['German', 'Deutsch', 'hidden', 3],
    array_values($pdo->query("SELECT name, native_name, CASE WHEN enabled THEN 'offered' ELSE 'hidden' END, sort_order FROM languages WHERE code = 'de'")->fetch()),
);
same(
    'no scope table, no trigger on the words',
    [false, 0],
    [
        (bool) $pdo->query("SELECT to_regclass('sites') IS NOT NULL")->fetchColumn(),
        (int) $pdo->query("SELECT count(*) FROM pg_trigger WHERE NOT tgisinternal AND tgrelid IN ('languages'::regclass, 'translation_keys'::regclass, 'translations'::regclass)")->fetchColumn(),
    ],
);

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
same(
    'deleting a language takes its guides with it',
    0,
    (function () use ($pdo): int {
        $pdo->exec("DELETE FROM languages WHERE code = 'de'");
        return (int) $pdo->query("SELECT count(*) FROM guide_contents WHERE language_code = 'de'")->fetchColumn();
    })(),
);

echo "The copies, kept for one release - and gone with users/067\n";

same(
    '050\'s full copies of the words, translations_before_library and translation_keys_before_library, dropped by users/067: no leftover tables',
    [false, false],
    [
        (bool) $pdo->query("SELECT to_regclass('translations_before_library') IS NOT NULL")->fetchColumn(),
        (bool) $pdo->query("SELECT to_regclass('translation_keys_before_library') IS NOT NULL")->fetchColumn(),
    ],
);
$pdo = null;

// ── Words reworded by their owner ───────────────────────────────────────────

echo "users/057, 059, 060 and 064 reword only where the words are still those migrations' own\n";

$reworded = testDatabase('words_feedback', $base);
$pdo = testPdo($reworded);
$pdo->exec("UPDATE translations SET value = 'Write to us', updated_by = 7 WHERE key_name = 'footer.feedback' AND language_code = 'en'");
$pdo->exec("UPDATE translations SET value = 'Nájdi votrelca.', updated_by = 7 WHERE key_name = 'quiz.mismatch.info' AND language_code = 'sk'");
$pdo->exec("UPDATE translations SET value = '<p>The owner''s own guide.</p>', updated_by = 7 WHERE key_name = 'guide.mismatch.content' AND language_code = 'en'");
$pdo->exec("UPDATE translations SET value = 'Prihlasuj sa účtom anotoki.', updated_by = 7 WHERE key_name = 'account.iamLead' AND language_code = 'sk'");
$pdo->exec("UPDATE translations SET value = '<p>Vlastný návod o kvízoch.</p>', updated_by = 7 WHERE key_name = 'guide.quizzes.content' AND language_code = 'sk'");
// A description the old admin panel let its owner write, before users/050 made them the code's.
$pdo->exec("UPDATE translation_keys SET description = 'The owner''s own description' WHERE name = 'account.preferencesNote'");
$result = siteMigrator($pdo)->apply();
check('applied without an error', $result['error'] === null, (string) $result['error']);
$feedback = $pdo->query("SELECT value, updated_by FROM translations WHERE key_name = 'footer.feedback' AND language_code = 'en'")->fetch();
same('the owner\'s English rewording stands, with who made it', ['Write to us', 7], [$feedback['value'] ?? null, (int) ($feedback['updated_by'] ?? 0)]);
$card = $pdo->query("SELECT value, updated_by FROM translations WHERE key_name = 'quiz.mismatch.info' AND language_code = 'sk'")->fetch();
$guide = $pdo->query("SELECT html, updated_by FROM guide_contents WHERE guide = 'mismatch' AND language_code = 'en'")->fetch();
same(
    '...so do the owner\'s Mismatch card in Slovak and Mismatch guide in English, with who made them',
    ['Nájdi votrelca.', 7, "<p>The owner's own guide.</p>", 7],
    [$card['value'] ?? null, (int) ($card['updated_by'] ?? 0), $guide['html'] ?? null, (int) ($guide['updated_by'] ?? 0)],
);
same(
    '...while the card and the guide nobody reworded are 059\'s',
    [true, true],
    [
        ($pdo->query("SELECT value FROM translations WHERE key_name = 'quiz.mismatch.info' AND language_code = 'en'")->fetchColumn() ?: '') ===
        'Test your character knowledge by finding the "odd one out" among three to five character icons.',
        str_contains((string) $pdo->query("SELECT html FROM guide_contents WHERE guide = 'mismatch' AND language_code = 'sk'")->fetchColumn(), 'troch, štyroch alebo piatich postáv'),
    ],
);
$lead = $pdo->query("SELECT value, updated_by FROM translations WHERE key_name = 'account.iamLead' AND language_code = 'sk'")->fetch();
$quizzes = $pdo->query("SELECT html, updated_by FROM guide_contents WHERE guide = 'quizzes' AND language_code = 'sk'")->fetch();
same(
    '...so do the owner\'s account panel line and Quizzes guide in Slovak, with who made them, through 060',
    ['Prihlasuj sa účtom anotoki.', 7, '<p>Vlastný návod o kvízoch.</p>', 7],
    [$lead['value'] ?? null, (int) ($lead['updated_by'] ?? 0), $quizzes['html'] ?? null, (int) ($quizzes['updated_by'] ?? 0)],
);
same(
    '...while the account panel\'s other lines and the Quizzes guide in English, nobody\'s rewording, are 060\'s',
    [true, true],
    [
        ($pdo->query("SELECT value FROM translations WHERE key_name = 'account.signOutNote' AND language_code = 'sk'")->fetchColumn() ?: '') ===
        'Odhlásenie ťa odhlási zo všetkých stránok anotoki naraz.',
        !str_contains((string) $pdo->query("SELECT html FROM guide_contents WHERE guide = 'quizzes' AND language_code = 'en'")->fetchColumn(), 'timed'),
    ],
);
same(
    '...and the description of the account panel\'s line its owner wrote stands through 064, which describes only 047\'s anew',
    ["The owner's own description", 'Notification when a change to the appearance or the language could not be saved to the anotoki account'],
    [
        $pdo->query("SELECT description FROM translation_keys WHERE name = 'account.preferencesNote'")->fetchColumn(),
        $pdo->query("SELECT description FROM translation_keys WHERE name = 'account.formats.failed'")->fetchColumn(),
    ],
);
$pdo = null;

// ── What 050 will not move ──────────────────────────────────────────────────

echo "What users/050 refuses, naming it\n";

$odd = testDatabase('words_odd', $base);
$pdo = testPdo($odd);
$pdo->exec("INSERT INTO languages (name, code, native_name) VALUES ('Klingon', 'tlh', 'tlhIngan Hol')");
$result = siteMigrator($pdo)->apply();
check(
    'a language code that is no code: 050 fails, saying which',
    ($result['failed']['name'] ?? '') === '050_translations_into_the_library.sql' && str_contains((string) $result['error'], "'tlh'"),
    (string) $result['error'],
);
check(
    '...and nothing of it is applied: the old shape stands, no copy was kept',
    (bool) $pdo->query("SELECT 1 FROM information_schema.columns WHERE table_name = 'translation_keys' AND column_name = 'site'")->fetchColumn() &&
        !$pdo->query("SELECT to_regclass('translations_before_library') IS NOT NULL")->fetchColumn(),
);
same(
    '...nor anything after it - only the library\'s admin set, which runs first',
    ['anotoki_admin/001_audit_log.sql', 'anotoki_admin/002_feedback.sql', 'anotoki_admin/003_site_settings.sql'],
    array_map(fn($file) => $file['set'] . '/' . $file['name'], $result['applied']),
);
$pdo = null;

$referring = testDatabase('words_ref', $base);
$pdo = testPdo($referring);
$pdo->exec('CREATE TABLE notes (id SERIAL PRIMARY KEY, language_code VARCHAR(10) REFERENCES languages (code))');
$result = siteMigrator($pdo)->apply();
check(
    'a table that refers to the languages besides the strings: 050 fails, naming it',
    ($result['failed']['name'] ?? '') === '050_translations_into_the_library.sql' && str_contains((string) $result['error'], 'notes'),
    (string) $result['error'],
);
$pdo = null;
