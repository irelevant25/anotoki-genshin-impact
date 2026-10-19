<?php

/**
 * The site's audit log: the anotoki library's (Anotoki\Lib\Audit\AuditLog,
 * anotoki-lib 0.4.1), set up for this site - its own file because both sides
 * write it: the API (DbQuery's content writes, the words, the guides, the
 * catalogue, and the library's admin tools) and assets.php, a command line
 * that loads nothing else of api/.
 *
 * The table is the library's, anotoki_audit_log (its set anotoki_admin, which
 * runs first); genshin_impact/028 moved audit_logs into it, every row with its
 * id. Until that file has run here, entries wait in
 * storage/logs/audit-pending.jsonl (`ready` below) - the Apply that runs it
 * flushes them - so none takes an id a moved row needs.
 *
 * What this site writes, by the names 028 gave the old rows:
 *   content.insert|update|delete        a row of the site's content (target:
 *                                       its table and id; scope: what it
 *                                       belongs to - api/audit_scope.php)
 *   catalogue.insert|update|move|delete|reconcile   the files catalogue
 *                                       (api/audit_file.php)
 *   language.created|updated|deleted, translations.saved|imported   the words
 *                                       (the library's names, api/translations.php)
 * and the library's modules their own (errors.cleared, backup.*, feedback.*,
 * file.*, folder.created, person.data_deleted, people.synced) and
 * migrations.applied (api/index.php). Who acted is the person the request's
 * token names; the session is held for the request by the library's
 * AuditContextMiddleware (api/index.php), so code deep in the work records
 * without being handed the request. record() never throws, and inside a
 * transaction it writes behind a savepoint: a failed entry never undoes the
 * change it records (this site's old writer swallowed the error and left the
 * transaction refusing everything after it).
 *
 * No address is kept (the site never kept one), and the log is the site's
 * ADMIN's to read alone (the admin panel's Audit page).
 */

use Anotoki\Lib\Audit\AuditLog;

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config/db.php';

/** The log, made once per process; it asks for the connection only when it writes or reads. */
function siteAudit(): AuditLog
{
    static $audit = null;

    return $audit ??= new AuditLog(fn(): PDO => getDb(), [
        'pendingFile' => siteStateRoot() . '/storage/logs/audit-pending.jsonl',
        'ready' => auditMovedToLibrary(...),
        'actorIds' => auditActorIds(...),
    ]);
}

/**
 * Whether entries may go into the library's table yet: once genshin_impact/028
 * has moved the old log in (audit_logs is gone then). Asked afresh for every
 * entry - one process may serve a request before an Apply and one after it. A
 * database without the content half yet (a fresh install, before
 * genshin_impact/001) has no old log to wait for.
 */
function auditMovedToLibrary(PDO $pdo): bool
{
    $moved = $pdo->query("SELECT to_regclass('audit_logs') IS NULL")->fetchColumn();

    return $moved === true || $moved === 't' || $moved === 1 || $moved === '1';
}

/**
 * The people a name typed into the Audit page's "who" filter may mean: every
 * person here whose name holds it, any case. Never a visitor.
 *
 * @return list<int>
 */
function auditActorIds(string $name): array
{
    $statement = usersDb()->prepare("SELECT id FROM users WHERE id > 0 AND username ILIKE ? ESCAPE '!' ORDER BY id LIMIT 200");
    $statement->execute(['%' . addcslashes($name, '!%_') . '%']);

    return array_map('intval', $statement->fetchAll(PDO::FETCH_COLUMN));
}

/**
 * The names of people by id, for the admin pages that show who did something
 * (the Audit and Feedback pages): this site's own record of them, so an
 * account the IAM deleted shows its placeholder (deleted-{id}). Visitors have
 * no name to show.
 *
 * @param list<int> $ids
 * @return array<int, string>
 */
function peopleNamesById(array $ids): array
{
    $ids = array_values(array_filter(array_map('intval', $ids), static fn(int $id): bool => $id > 0));
    if ($ids === []) {
        return [];
    }
    $statement = usersDb()->prepare('SELECT id, username FROM users WHERE id = ANY (CAST(? AS bigint[]))');
    $statement->execute(['{' . implode(',', $ids) . '}']);

    $names = [];
    foreach ($statement->fetchAll(PDO::FETCH_NUM) as [$id, $name]) {
        $names[(int) $id] = (string) $name;
    }

    return $names;
}

/**
 * One change to the site's content - a row inserted, updated or deleted (a
 * soft delete is an update that sets `deleted`) - as content.insert|update|
 * delete: the row's table and id, by whom, what changed, and the entity it
 * belongs to, which is the row itself unless a save said otherwise
 * (api/audit_scope.php). For DbQuery's writes and the few that do not go
 * through it (a guide's text).
 *
 * @param array<string, mixed> $changes
 * @param ?array{0: string, 1: string} $scope
 */
function auditContent(string $table, string $recordId, string $verb, ?int $by, array $changes, ?array $scope = null): void
{
    siteAudit()->record(null, $by, 'content.' . strtolower($verb), $table, $recordId, $changes, $scope ?? [$table, $recordId]);
}
