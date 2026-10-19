<?php

declare(strict_types=1);

/**
 * anotoki-lib 0.4.1's data moves - users/052 (people: users.email dropped,
 * anonymized_at, created_at a moment), genshin_impact/028 (audit_logs into the
 * library's anotoki_audit_log) and 029 (feedback into anotoki_feedback) - and
 * 0.5.0's users/054 (the new visitors' count keeps no address) on a
 * database shaped like the one the owner has installed: users/ to 051,
 * genshin_impact/ to 027 and the library's anotoki_translations to 002, in a
 * database whose time zone is not UTC (as a server's own often is not), with
 * rows in every table that moves. Brought up to date by the site's own engine,
 * as Apply does.
 *
 * What must hold: every row came through under its own id, field for field by
 * the rules the files state - nothing lost, the ids kept, the next id past the
 * last - and where a message came from (ip, submitter_hash) is kept nowhere,
 * the copies included. A moment written in the server's zone is the same
 * moment after. And a file that cannot move what it finds stops, loudly, with
 * nothing of it applied.
 *
 * Also the order guard with the library's sets around the folders: the admin
 * set, which runs first, may be missing from a database that has everything
 * else - every database installed before 0.4 has it last.
 */

require __DIR__ . '/lib.php';
require __DIR__ . '/db_lib.php';
require TEST_BACKEND . '/vendor/autoload.php';
require TEST_BACKEND . '/api/migration_runner.php';

/** An object's keys in one order - jsonb keeps them by length, not as written. */
function keyed(mixed $value): mixed
{
    if (is_array($value)) {
        ksort($value);
    }

    return $value;
}

// ── The order, without a database ───────────────────────────────────────────

echo "The library's sets around the site's two folders\n";

$all = static fn(array $sets): array => array_replace(array_fill_keys(migrationSetNames(), []), $sets);
same(
    'installed before 0.4: everything but the admin set run - in order (it comes last to such a database)',
    null,
    migrationsOrderRefusal($all(['users' => ['001.sql'], 'genshin_impact' => ['001.sql'], 'anotoki_translations' => ['001_languages_and_strings.sql']])),
);
$refusal = migrationsOrderRefusal($all(['users' => ['001.sql'], 'genshin_impact' => ['001.sql']]), 'users');
check(
    '--folder=users while the admin set has not run: refused - the site\'s files move rows into its tables',
    $refusal !== null && str_contains($refusal, "the anotoki library's anotoki_admin comes before migrations/users/"),
    (string) $refusal,
);
$refusal = migrationsOrderRefusal($all(['anotoki_admin' => ['001_audit_log.sql'], 'users' => ['001.sql'], 'genshin_impact' => ['001.sql'], 'anotoki_people' => ['001_people.sql']]));
check(
    'the people set recorded before the translations set: refused, naming both',
    $refusal !== null && str_contains($refusal, "the anotoki library's anotoki_people") && str_contains($refusal, "the anotoki library's anotoki_translations"),
    (string) $refusal,
);
same(
    'everything run, the admin set first: in order',
    null,
    migrationsOrderRefusal(
        $all(['anotoki_admin' => ['001_audit_log.sql'], 'users' => ['001.sql'], 'genshin_impact' => ['001.sql'], 'anotoki_translations' => ['001.sql'], 'anotoki_people' => ['001_people.sql']]),
    ),
);

testNeedsDatabase();

// ── A database as the owner has it ──────────────────────────────────────────

echo "A database as the owner has it: users/ to 051, genshin_impact/ to 027, the words' set to 002, a zone of its own\n";

$base = testDatabase('tools_base');
// The server's zone, not UTC: every naive stamp below is a moment in it.
testPdo('postgres')->exec('ALTER DATABASE "' . $base . '" SET timezone TO \'Europe/Bratislava\'');
$pdo = testPdo($base);
$built = testMigrate($pdo, ['users' => '051_guide_strings.sql', 'genshin_impact' => '027_visitor_history_index.sql', 'anotoki_translations' => '002_library_words.sql']);
check('built by the site\'s engine', $built['error'] === null, (string) $built['error']);
same(
    'what waits: the admin set, users/052-059, genshin_impact/028-029, the words\' 003-013, the people set',
    [
        'anotoki_admin/001_audit_log.sql',
        'anotoki_admin/002_feedback.sql',
        'users/052_people.sql',
        'users/053_drop_old_feedback_and_callback_strings.sql',
        'users/054_visitor_starts_hashed.sql',
        'users/055_legal_pages.sql',
        'users/056_drop_multiselect_selected_strings.sql',
        'users/057_public_footer_strings.sql',
        'users/058_quiz_difficulty_strings.sql',
        'users/059_quiz_cards_and_mismatch_guide.sql',
        'genshin_impact/028_audit_into_library.sql',
        'genshin_impact/029_feedback_into_library.sql',
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
        'anotoki_people/001_people.sql',
    ],
    array_map(fn($file) => $file['set'] . '/' . $file['name'], siteMigrator($pdo)->applicable()),
);
same('...and the guard lets it run, though the admin set comes first', null, migrationsOrderRefusal(recordedMigrations($pdo)));

// People: two with an address, one whose first visit was in summer (another
// offset), one with no stamp at all, and a visitor.
$pdo->exec("INSERT INTO users (id, username, email, created_at) VALUES
    (7, 'Owner', 'owner@example.test', '2026-01-15 10:00:00'),
    (8, 'Ayaka', 'ayaka@example.test', '2026-07-01 12:30:00'),
    (9, 'NoStamp', NULL, NULL)");
$pdo->exec("INSERT INTO users (id, username, visitor_key_hash, last_seen_at) VALUES (-1, 'visitor', repeat('a', 64), now())");
// The new visitors of the last hour, as users/045's code counted them: by the
// address itself (an IPv6 one by its /64, '?' where the server gave none).
$pdo->exec("INSERT INTO visitor_starts (address, started_at) VALUES
    ('203.0.113.9', now() - interval '10 minutes'), ('203.0.113.9', now() - interval '5 minutes'),
    ('2001:db8:1:2::/64', now() - interval '3 minutes'), ('?', now() - interval '1 minute')");

// The audit log: content (an entity's child under its root), the catalogue
// (every verb it has), the words, nobody's, a session, details with every kind
// of value - and ids with gaps, so keeping them is seen.
$pdo->exec("INSERT INTO audit_logs (id, table_name, record_id, action, changed_by, changed_at, changes, entity_table, entity_id, session_id) VALUES
    (3,   'characters',             '42', 'INSERT',    7,    '2026-01-15 10:01:00', '{\"name\": \"Amber\", \"rarity\": 4}', 'characters', '42', 'sid-owner'),
    (4,   'characters_talents_cost','900','UPDATE',    7,    '2026-01-15 10:02:00', '{\"cost\": {\"old\": 1, \"new\": 2}}', 'characters_talents_sets', '5', 'sid-owner'),
    (10,  'weapons',                '12', 'DELETE',    8,    '2026-07-01 12:31:00', '{\"deleted\": {\"old\": false, \"new\": true}}', 'weapons', '12', NULL),
    (11,  'files',                  '77', 'INSERT',    7,    '2026-01-16 08:00:00', '{\"category\": \"character.icon\", \"name\": \"AMBER\", \"extension\": \"avif\"}', 'files', '77', 'sid-owner'),
    (12,  'files',                  '77', 'UPDATE',    7,    '2026-01-16 08:01:00', '{\"name\": {\"old\": \"AMBER\", \"new\": \"AMBER_2\"}}', 'files', '77', NULL),
    (13,  'files',                  '77', 'MOVE',      7,    '2026-01-16 08:02:00', '{\"from\": \"character/icon\", \"to\": \"unfiled\"}', 'files', '77', NULL),
    (14,  'files',                  '0',  'RECONCILE', NULL, '2026-01-16 08:03:00', '{\"adopted\": 3, \"missing\": []}', 'files', '0', NULL),
    (15,  'files',                  '0',  'DELETE',    NULL, '2026-01-16 08:04:00', '{\"forgotten\": 1}', 'files', '0', NULL),
    (20,  'translations',           'sk', 'UPDATE',    8,    '2026-07-02 09:00:00', '{\"languages\": [\"sk\"], \"count\": 1, \"keys\": [\"nav.daily\"]}', 'translations', 'sk', 'sid-ayaka'),
    (21,  'languages',              'de', 'INSERT',    7,    '2026-07-02 09:05:00', '{\"code\": \"de\", \"name\": \"Deutsch – Ünïcode\"}', 'languages', 'de', NULL),
    (500, 'banners',                '3',  'UPDATE',    7,    '2026-07-03 18:00:00', NULL, NULL, NULL, NULL)");
$pdo->exec("SELECT setval('audit_logs_id_seq', 500)");

// Feedback: each kind the old form sent, every field it had, an anonymous one,
// a signed-in one with everything of where it came from, a page with a query,
// a browser longer than the library keeps, an address longer than it keeps, a
// message of spaces, every status.
$longAgent = 'Mozilla/5.0 ' . str_repeat('(very long; ', 40) . ') Gecko';
$longEmail = str_repeat('a', 242) . '@example.test'; // 255: the old column holds it, the library keeps 254
$insert = $pdo->prepare("INSERT INTO feedback (id, type, status, section, title, user_id, username, email, message, steps_to_reproduce, expected_behavior,
        actual_behavior, browser_device_info, details, why_important, additional_info, page_url, user_agent, language, submitter_hash, ip, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
foreach (
    [
        [
            5,
            'Bug',
            'new',
            'Quiz - Music',
            'Music stops',
            7,
            'Owner',
            'owner@example.test',
            null,
            '1. open the quiz',
            'it plays',
            'it stops',
            'Firefox 140',
            null,
            null,
            'only on Sundays',
            '/quiz/music?round=3',
            'Mozilla/5.0 Firefox/140',
            'sk',
            str_repeat('b', 64),
            '203.0.113.9',
            '2026-01-20 20:00:00',
            '2026-01-21 08:00:00',
        ],
        [
            6,
            'Suggestion',
            'read',
            'Database',
            'More weapons',
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            'Add the new bows',
            'I play a bow user',
            'thanks!',
            '/database/weapons',
            'Mozilla/5.0 Chrome/150',
            'en',
            str_repeat('c', 64),
            '198.51.100.4',
            '2026-07-05 11:00:00',
            null,
        ],
        [
            9,
            'Other',
            'resolved',
            null,
            null,
            8,
            'Ayaka',
            'ayaka@example.test',
            'Lovely site – ďakujem',
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            '/',
            null,
            'sk',
            str_repeat('d', 64),
            '2001:db8::1',
            '2026-07-06 07:00:00',
            '2026-07-06 09:00:00',
        ],
        [
            40,
            'Bug',
            'spam',
            'Other',
            'Spam',
            null,
            null,
            $longEmail,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            'https://evil.example/x',
            $longAgent,
            'en',
            null,
            null,
            '2026-07-07 07:00:00',
            null,
        ],
        [41, 'Other', 'new', 'Versions', 'Only spaces', null, null, null, '   ', null, null, 'it broke', null, null, null, null, null, null, null, null, null, null, null],
    ]
    as $row
) {
    $insert->execute($row);
}
$pdo->exec("SELECT setval('feedback_id_seq', 41)");

$auditBefore = $pdo->query('SELECT * FROM audit_logs ORDER BY id')->fetchAll();
$feedbackBefore = $pdo->query('SELECT * FROM feedback ORDER BY id')->fetchAll();
$usersBefore = $pdo->query('SELECT id, username, created_at::text AS created_at FROM users ORDER BY id')->fetchAll();
// Every handle on the connection goes, or the copies below find the base in use.
$insert = null;
$pdo = null;

// ── Apply ───────────────────────────────────────────────────────────────────

echo "Apply, as the Migrations page does\n";

$name = testDatabase('tools', $base);
$pdo = testPdo($name);
$result = siteMigrator($pdo)->apply();
check('applied without an error', $result['error'] === null, (string) $result['error']);
same('everything that waited ran, the admin set first and the people set last', 24, count($result['applied']));
same('nothing waits any more', [], siteMigrator($pdo)->applicable());
same(
    'the library\'s files are recorded under their sets\' names',
    [['001_audit_log.sql', '002_feedback.sql'], ['001_people.sql']],
    [recordedMigrations($pdo)['anotoki_admin'], recordedMigrations($pdo)['anotoki_people']],
);

// ── users/052 ───────────────────────────────────────────────────────────────

echo "users/052: the people as the library reads them\n";

$columns = $pdo
    ->query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'users' ORDER BY ordinal_position")
    ->fetchAll(PDO::FETCH_KEY_PAIR);
check('no copy of anybody\'s address any more', !isset($columns['email']));
same('anonymized_at and created_at are moments (TIMESTAMPTZ)', ['timestamp with time zone', 'timestamp with time zone'], [$columns['anonymized_at'] ?? null, $columns['created_at'] ?? null]);
same(
    'every row still here, the visitor too, nobody anonymized',
    [array_column($usersBefore, 'username', 'id'), 0],
    [$pdo->query('SELECT id, username FROM users ORDER BY id')->fetchAll(PDO::FETCH_KEY_PAIR), (int) $pdo->query('SELECT count(*) FROM users WHERE anonymized_at IS NOT NULL')->fetchColumn()],
);
same(
    'a winter first visit, read in the server\'s zone: 10:00 in Bratislava is 09:00 UTC',
    '2026-01-15 09:00:00',
    $pdo->query("SELECT (created_at AT TIME ZONE 'UTC')::text FROM users WHERE id = 7")->fetchColumn(),
);
same('a summer one: 12:30 there is 10:30 UTC', '2026-07-01 10:30:00', $pdo->query("SELECT (created_at AT TIME ZONE 'UTC')::text FROM users WHERE id = 8")->fetchColumn());
same('no stamp stays no stamp', null, $pdo->query('SELECT created_at FROM users WHERE id = 9')->fetchColumn());
same(
    'the visitors\' check still holds every row',
    0,
    (int) $pdo->query('SELECT count(*) FROM users WHERE NOT (id <> 0 AND (id < 0) = (visitor_key_hash IS NOT NULL) AND (id > 0 OR last_seen_at IS NOT NULL))')->fetchColumn(),
);

// ── users/054 ───────────────────────────────────────────────────────────────

echo "users/054: the new visitors' count keeps no address\n";

same(
    'the addresses the count kept are gone - every one of them, nothing else of the visitors\'',
    [0, 1],
    [(int) $pdo->query('SELECT count(*) FROM visitor_starts')->fetchColumn(), (int) $pdo->query('SELECT count(*) FROM users WHERE id < 0')->fetchColumn()],
);
$check = $pdo->query("SELECT convalidated, pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conrelid = 'visitor_starts'::regclass AND conname = 'visitor_starts_address_hashed'")->fetch();
check(
    '...and the column takes a keyed hash alone (64 hex), its check validated',
    ($check['convalidated'] ?? false) === true && str_contains((string) ($check['def'] ?? ''), "address ~ '^[0-9a-f]{64}$'"),
    json_encode($check),
);
$refused = null;
try {
    $pdo->exec("INSERT INTO visitor_starts (address) VALUES ('198.51.100.7')");
} catch (PDOException $e) {
    $refused = (string) $e->getCode();
}
same('an address written by a build from before: refused (23514, the check)', '23514', $refused);
$pdo->exec("INSERT INTO visitor_starts (address) VALUES ('" . hash('sha256', 'a hash, as the code writes one') . "')");
same('a hash, as the code writes it now: kept', 1, (int) $pdo->query('SELECT count(*) FROM visitor_starts')->fetchColumn());

// ── genshin_impact/028 ──────────────────────────────────────────────────────

echo "genshin_impact/028: the audit log in the library's table, every row under its id\n";

$moved = [];
foreach (
    $pdo
        ->query(
            "SELECT id, (created_at AT TIME ZONE 'UTC')::text AS at, actor_id, actor_session, action, target_type, target_id, scope_type, scope_id, details::text AS details, ip FROM anotoki_audit_log ORDER BY id",
        )
        ->fetchAll()
    as $row
) {
    $moved[(int) $row['id']] = $row;
}
same('every id kept, none added', array_map('intval', array_column($auditBefore, 'id')), array_keys($moved));
$verbs = [];
foreach ($auditBefore as $old) {
    $verbs[(int) $old['id']] = $moved[(int) $old['id']]['action'] ?? null;
}
same(
    'content.* for the content and the words, catalogue.* for the files catalogue - every verb kept',
    [
        3 => 'content.insert',
        4 => 'content.update',
        10 => 'content.delete',
        11 => 'catalogue.insert',
        12 => 'catalogue.update',
        13 => 'catalogue.move',
        14 => 'catalogue.reconcile',
        15 => 'catalogue.delete',
        20 => 'content.update',
        21 => 'content.insert',
        500 => 'content.update',
    ],
    $verbs,
);
$mismatch = [];
foreach ($auditBefore as $old) {
    $new = $moved[(int) $old['id']] ?? [];
    $sameDetails = $old['changes'] === null ? $new['details'] === null : json_decode((string) $new['details'], true) === json_decode((string) $old['changes'], true);
    if (
        ($new['actor_id'] ?? null) !== ($old['changed_by'] === null ? null : (int) $old['changed_by']) ||
        ($new['actor_session'] ?? null) !== $old['session_id'] ||
        ($new['target_type'] ?? null) !== $old['table_name'] ||
        ($new['target_id'] ?? null) !== $old['record_id'] ||
        ($new['scope_type'] ?? null) !== $old['entity_table'] ||
        ($new['scope_id'] ?? null) !== $old['entity_id'] ||
        !$sameDetails ||
        !array_key_exists('ip', $new) ||
        $new['ip'] !== null
    ) {
        $mismatch[] = $old['id'];
    }
}
same('who, from which sign-in, what, what it belongs to, the details word for word (Ünïcode too) - and no address', [], $mismatch);
same(
    'the moments, read in the server\'s zone: 10:01 in January is 09:01 UTC, 12:31 in July 10:31',
    ['2026-01-15 09:01:00', '2026-07-01 10:31:00'],
    [$moved[3]['at'] ?? null, $moved[10]['at'] ?? null],
);
same('the next entry after the last one moved', 501, (int) $pdo->query("INSERT INTO anotoki_audit_log (action) VALUES ('test.next') RETURNING id")->fetchColumn());
same(
    'audit_logs kept as audit_logs_before_library, whole, for one release',
    [false, count($auditBefore)],
    [(bool) $pdo->query("SELECT to_regclass('audit_logs') IS NOT NULL")->fetchColumn(), (int) $pdo->query('SELECT count(*) FROM audit_logs_before_library')->fetchColumn()],
);

// ── genshin_impact/029 ──────────────────────────────────────────────────────

echo "genshin_impact/029: feedback in the library's table, every message under its id\n";

$messages = [];
foreach (
    $pdo
        ->query(
            "SELECT id, kind, status, section, subject, message, details::text AS details, contact_email, user_id, page, language, user_agent,
        (created_at AT TIME ZONE 'UTC')::text AS created, (updated_at AT TIME ZONE 'UTC')::text AS updated, handled_by FROM anotoki_feedback ORDER BY id",
        )
        ->fetchAll()
    as $row
) {
    $row['details'] = keyed(json_decode((string) $row['details'], true));
    $messages[(int) $row['id']] = $row;
}
same('every id kept, none added', [5, 6, 9, 40, 41], array_keys($messages));
same('the kinds: Bug, Suggestion, Other are bug, idea, other', [5 => 'bug', 6 => 'idea', 9 => 'other', 40 => 'bug', 41 => 'other'], array_column($messages, 'kind', 'id'));
same(
    'statuses, sections, subjects, senders, languages as they were',
    [['new', 'Quiz - Music', 'Music stops', 7, 'sk'], ['read', 'Database', 'More weapons', null, 'en'], ['resolved', null, null, 8, 'sk']],
    [
        [$messages[5]['status'], $messages[5]['section'], $messages[5]['subject'], (int) $messages[5]['user_id'], $messages[5]['language']],
        [$messages[6]['status'], $messages[6]['section'], $messages[6]['subject'], $messages[6]['user_id'], $messages[6]['language']],
        [$messages[9]['status'], $messages[9]['section'], $messages[9]['subject'], (int) $messages[9]['user_id'], $messages[9]['language']],
    ],
);
same(
    'a bug: its steps are the message, the rest of what it said under the new form\'s names',
    [
        '1. open the quiz',
        keyed([
            'actual_behavior' => 'it stops',
            'expected_behavior' => 'it plays',
            'additional_info' => 'only on Sundays',
            'browser_device_info' => 'Firefox 140',
            'page_url' => '/quiz/music?round=3',
        ]),
    ],
    [$messages[5]['message'], $messages[5]['details']],
);
same(
    'a suggestion: its details are the message, why it matters and the rest beside it',
    ['Add the new bows', keyed(['why_important' => 'I play a bow user', 'additional_info' => 'thanks!'])],
    [$messages[6]['message'], $messages[6]['details']],
);
same('an Other message: word for word, nothing beside it', ['Lovely site – ďakujem', []], [$messages[9]['message'], $messages[9]['details']]);
same('a message of spaces: the first words there were are the message, the spaces kept beside them', ['it broke', ['message' => '   ']], [$messages[41]['message'], $messages[41]['details']]);
same('the page: the path, never its query - the address as sent kept whole in details', ['/quiz/music', '/quiz/music?round=3'], [$messages[5]['page'], $messages[5]['details']['page_url'] ?? null]);
same('a page that is no path of the site: none, the address kept in details', [null, 'https://evil.example/x'], [$messages[40]['page'], $messages[40]['details']['page_url'] ?? null]);
same(
    'a browser longer than the library keeps: its first 300 characters, whole in details',
    [300, $longAgent],
    [mb_strlen((string) $messages[40]['user_agent']), $messages[40]['details']['user_agent'] ?? null],
);
same('an address longer than the library keeps: none as the address, whole in details', [null, $longEmail], [$messages[40]['contact_email'], $messages[40]['details']['email'] ?? null]);
same('the addresses given, as they were', ['owner@example.test', null, 'ayaka@example.test'], [$messages[5]['contact_email'], $messages[6]['contact_email'], $messages[9]['contact_email']]);
same(
    'the moments, read in the server\'s zone; an untouched message updated when it was made',
    ['2026-01-20 19:00:00', '2026-01-21 07:00:00', '2026-07-05 09:00:00', '2026-07-05 09:00:00'],
    [$messages[5]['created'], $messages[5]['updated'], $messages[6]['created'], $messages[6]['updated']],
);
same('nobody has handled them yet', [null, null, null, null, null], array_column($messages, 'handled_by'));
same(
    'where they came from is kept nowhere: no ip, no submitter_hash, in either table',
    0,
    (int) $pdo
        ->query(
            "SELECT count(*) FROM information_schema.columns WHERE table_schema = current_schema() AND table_name IN ('anotoki_feedback', 'feedback_before_library') AND column_name IN ('ip', 'submitter_hash')",
        )
        ->fetchColumn(),
);
same(
    'feedback kept as feedback_before_library, every message, without them',
    [false, 5, ['Owner', null, 'Ayaka']],
    [
        (bool) $pdo->query("SELECT to_regclass('feedback') IS NOT NULL")->fetchColumn(),
        (int) $pdo->query('SELECT count(*) FROM feedback_before_library')->fetchColumn(),
        $pdo->query('SELECT username FROM feedback_before_library WHERE id IN (5, 6, 9) ORDER BY id')->fetchAll(PDO::FETCH_COLUMN),
    ],
);
same('the next message after the last one moved', 42, (int) $pdo->query("INSERT INTO anotoki_feedback (kind, message) VALUES ('other', 'next') RETURNING id")->fetchColumn());

echo "The library's other sets\n";

same(
    'the words: 003 to 009, 012 and 013 brought the sign-in page\'s, the feedback form\'s, the legal pages\', the top bar\'s, the kit\'s newer pieces\', the tabs\', the inputs\', the footer\'s and the About and Support pages\' (010 and 011 reword some), 288 library keys in all',
    288,
    (int) $pdo->query("SELECT count(*) FROM translation_keys WHERE name LIKE 'anotoki.%'")->fetchColumn(),
);
same(
    'the people: the scrub\'s tables, its one row',
    [true, 1],
    [(bool) $pdo->query("SELECT to_regclass('anotoki_people_anonymized') IS NOT NULL")->fetchColumn(), (int) $pdo->query('SELECT count(*) FROM anotoki_people_sync')->fetchColumn()],
);
$pdo = null;

// ── What they refuse ────────────────────────────────────────────────────────

echo "A move that would lose something stops, with nothing of it applied\n";

$taken = testDatabase('tools_taken', $base);
$pdo = testPdo($taken);
// Something wrote the library's table before the move (it never does: the
// writers hold their entries back until 028 has run) - under an id an old row needs.
foreach (['001_audit_log.sql'] as $file) {
    $pdo->exec((string) file_get_contents(libraryMigrationSet('anotoki_admin')->directory . '/' . $file));
}
$pdo->exec("INSERT INTO anotoki_audit_log (id, action) VALUES (3, 'test.early')");
$result = siteMigrator($pdo)->apply();
check('028 fails, saying why', ($result['failed']['name'] ?? '') === '028_audit_into_library.sql' && str_contains((string) $result['error'], 'already holds entries'), (string) $result['error']);
same(
    '...and nothing of it is applied: audit_logs stands as it was, nothing after it ran',
    [true, count($auditBefore), true],
    [
        (bool) $pdo->query("SELECT to_regclass('audit_logs') IS NOT NULL")->fetchColumn(),
        (int) $pdo->query('SELECT count(*) FROM audit_logs')->fetchColumn(),
        (bool) $pdo->query("SELECT to_regclass('feedback') IS NOT NULL")->fetchColumn(),
    ],
);
$pdo = null;

$tooLong = testDatabase('tools_long', $base);
$pdo = testPdo($tooLong);
// A message longer than the library's table holds (the old API capped it at
// 5,000; the column never did): moved whole or not at all.
$pdo->exec("INSERT INTO feedback (id, type, message) VALUES (60, 'Other', repeat('x', 10001))");
$result = siteMigrator($pdo)->apply();
check('029 fails on it, rather than cut it', ($result['failed']['name'] ?? '') === '029_feedback_into_library.sql', (string) $result['error']);
same(
    '...and feedback stands as it was, every message, with where they came from',
    [true, count($feedbackBefore) + 1, 3],
    [
        (bool) $pdo->query("SELECT to_regclass('feedback') IS NOT NULL")->fetchColumn(),
        (int) $pdo->query('SELECT count(*) FROM feedback')->fetchColumn(),
        (int) $pdo->query('SELECT count(*) FROM feedback WHERE ip IS NOT NULL')->fetchColumn(),
    ],
);
same(
    '...while 028 before it stands applied',
    [false, true],
    [(bool) $pdo->query("SELECT to_regclass('audit_logs') IS NOT NULL")->fetchColumn(), (bool) $pdo->query("SELECT to_regclass('audit_logs_before_library') IS NOT NULL")->fetchColumn()],
);
$pdo = null;

// ── A new installation ──────────────────────────────────────────────────────

echo "A new installation: every set in one go\n";

$fresh = testDatabase('tools_fresh');
$pdo = testPdo($fresh);
$result = siteMigrator($pdo)->apply();
check('built without an error', $result['error'] === null, (string) $result['error']);
same('the admin set first, the people set last', ['anotoki_admin', 'anotoki_people'], [$result['applied'][0]['set'] ?? null, end($result['applied'])['set'] ?? null]);
same(
    'the old tables only as their empty copies; the library\'s in their place',
    [0, 0, false, false, true, true],
    [
        (int) $pdo->query('SELECT count(*) FROM audit_logs_before_library')->fetchColumn(),
        (int) $pdo->query('SELECT count(*) FROM feedback_before_library')->fetchColumn(),
        (bool) $pdo->query("SELECT to_regclass('audit_logs') IS NOT NULL")->fetchColumn(),
        (bool) $pdo->query("SELECT to_regclass('feedback') IS NOT NULL")->fetchColumn(),
        (bool) $pdo->query("SELECT to_regclass('anotoki_audit_log') IS NOT NULL")->fetchColumn(),
        (bool) $pdo->query("SELECT to_regclass('anotoki_feedback') IS NOT NULL")->fetchColumn(),
    ],
);
same(
    'the first entry and the first message take id 1',
    [1, 1],
    [
        (int) $pdo->query("INSERT INTO anotoki_audit_log (action) VALUES ('test.first') RETURNING id")->fetchColumn(),
        (int) $pdo->query("INSERT INTO anotoki_feedback (kind, message) VALUES ('other', 'first') RETURNING id")->fetchColumn(),
    ],
);
$pdo = null;
