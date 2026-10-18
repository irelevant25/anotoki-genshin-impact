<?php

declare(strict_types=1);

/**
 * php migration.php - the command line - on a database shaped like the one the
 * owner has installed (users/ to 051, genshin_impact/ to 027, the words' set to
 * 002, with an audit entry and a message to move), run as the owner runs it,
 * in a backend copy of the test's own pointed at a database of the test's own:
 *
 *   - --status says what waits, the library's sets among it, and changes nothing;
 *   - a run takes a backup of the database as it is first (the library's, in
 *     storage/backups), then applies everything in order - the admin set first;
 *   - the audit entries that waited for their table go in, with the run's own
 *     (migrations.applied, by nobody, via the command line);
 *   - run again: up to date, and no second backup;
 *   - on an empty database (a new checkout's first run): every set, and no
 *     backup - there is nothing to keep.
 */

require __DIR__ . '/lib.php';
require __DIR__ . '/db_lib.php';
require TEST_BACKEND . '/vendor/autoload.php';
require TEST_BACKEND . '/api/migration_runner.php';

testNeedsDatabase();

$database = testDatabase('cli');
$pdo = testPdo($database);
$built = testMigrate($pdo, ['users' => '051_guide_strings.sql', 'genshin_impact' => '027_visitor_history_index.sql', 'anotoki_translations' => '002_library_words.sql']);
check('a database as installed, built by the site\'s engine', $built['error'] === null, (string) $built['error']);
$pdo->exec("INSERT INTO audit_logs (table_name, record_id, action, changed_by, changes) VALUES ('regions', 'Liyue', 'UPDATE', 7, '{\"name\": {\"old\": \"Li Yue\", \"new\": \"Liyue\"}}')");
$pdo->exec("INSERT INTO feedback (type, title, message) VALUES ('Other', 'Hello', 'A message to move')");
$pdo = null;

$iamDir = testTempDir('iam');
$iam = testIam($iamDir);
$backend = testBackendCopy($database, ['jwks_file' => $iam['jwks']]);
copy(TEST_BACKEND . '/migration.php', "$backend/migration.php");

/** The command line in the copy, under the PHP running this. @return array{0: int, 1: string} */
function cli(string $backend, string $arguments = ''): array
{
    exec(escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg("$backend/migration.php") . ($arguments === '' ? '' : ' ' . $arguments) . ' 2>&1', $output, $code);

    return [$code, (string) preg_replace('/\e\[[0-9;]*m/', '', implode("\n", $output))];
}

echo "--status\n";

[$code, $out] = cli($backend, '--status');
same('answers, and says the library\'s sets are among what waits', [0, true, true, true], [$code, str_contains($out, "the anotoki library's anotoki_admin"), str_contains($out, '001_audit_log.sql   pending'), str_contains($out, '028_audit_into_library.sql   pending')]);
same('...and changes nothing: no backup made', [], glob("$backend/storage/backups/*.anotoki-backup") ?: []);

echo "A run\n";

[$code, $out] = cli($backend);
check('applies everything, without an error', $code === 0 && str_contains($out, 'Done.'), $out);
$backups = glob("$backend/storage/backups/*-before-migration-*.anotoki-backup") ?: [];
same('a backup of the database as it was, made before anything ran', 1, count($backups));
check('...and named in what it says', $backups !== [] && str_contains($out, basename($backups[0], '.anotoki-backup')), $out);
$pdo = testPdo($database);
same('nothing waits any more', [], siteMigrator($pdo)->applicable());
same('the entry and the message moved', [1, 1], [
    (int) $pdo->query("SELECT count(*) FROM anotoki_audit_log WHERE action = 'content.update' AND target_type = 'regions'")->fetchColumn(),
    (int) $pdo->query("SELECT count(*) FROM anotoki_feedback WHERE message = 'A message to move'")->fetchColumn(),
]);
same('the backup\'s own entry waited for the table, and went in after the run', 1, (int) $pdo->query("SELECT count(*) FROM anotoki_audit_log WHERE action = 'backup.created' AND actor_id IS NULL")->fetchColumn());
$run = json_decode((string) $pdo->query("SELECT details::text FROM anotoki_audit_log WHERE action = 'migrations.applied' ORDER BY id DESC LIMIT 1")->fetchColumn(), true);
// The admin set's two, users/052-057, genshin_impact/028-029, the library's words 003-012 and the people set's one.
same('the run written down: what it applied, via the command line, by nobody', [21, 'command line'], [count($run['files'] ?? []), $run['via'] ?? null]);
$pdo = null;

echo "Again\n";

[$code, $out] = cli($backend);
same('up to date: nothing to do, and no second backup', [0, 1], [$code, count(glob("$backend/storage/backups/*.anotoki-backup") ?: [])]);

echo "An empty database\n";

// A new checkout's first run, and every throwaway environment's: nothing to
// keep, so no backup - and the backup's rule must not stand in the way.
$empty = testDatabase('cli_empty');
$emptyBackend = testBackendCopy($empty, ['jwks_file' => $iam['jwks']]);
copy(TEST_BACKEND . '/migration.php', "$emptyBackend/migration.php");
[$code, $out] = cli($emptyBackend);
check('builds it whole, every set, without an error', $code === 0 && str_contains($out, 'Done.'), $out);
same('...and makes no backup: there was nothing to keep', [], glob("$emptyBackend/storage/backups/*.anotoki-backup") ?: []);
$pdo = testPdo($empty);
same('nothing waits, the library\'s sets included', [[], 5], [
    siteMigrator($pdo)->applicable(),
    (int) $pdo->query("SELECT count(DISTINCT folder) FROM migrations")->fetchColumn(),
]);
$pdo = null;
