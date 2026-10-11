<?php

/**
 * Noting what happened to the asset tree's catalogue.
 *
 * Its own file because both sides need it and neither can reach the other: the
 * API loads this through index.php, and assets.php is a CLI script that loads
 * nothing else from api/ but the audit log this writes to (api/audit_log.php,
 * the anotoki library's). Two copies of ten lines is exactly the kind of pair
 * that drifts, and this one records history - a version of it that quietly
 * stopped matching would be worse than useless.
 *
 * An actor of null is a real answer, not a missing one. Files arrive over FTP
 * and leave the same way, so a sweep that finds one cannot say who put it
 * there; writing down whoever pressed the button would be a guess recorded as
 * a fact. Anything a person actually chose passes their id.
 *
 * The entries are catalogue.insert|update|move|delete|reconcile on the files
 * table - the names genshin_impact/028 gave the old ones - kept apart from the
 * file explorer's own file.* entries, which are about the folders, not the
 * catalogue.
 */

require_once __DIR__ . '/audit_log.php';

/**
 * One entry against the `files` table. Pass 0 for something that is about the
 * whole catalogue. $pdo is the connection the change was made on - the site's
 * one (getDb()), which the log writes on too, so an entry inside a transaction
 * commits or rolls back with it.
 */
function auditFile(PDO $pdo, int $fileId, string $action, array $changes, ?int $by = null): void
{
    // A file is its own entity - nothing hangs off it - so what changed and
    // what it belongs to are the same row.
    siteAudit()->record(null, $by, 'catalogue.' . strtolower($action), 'files', (string) $fileId, $changes, ['files', (string) $fileId]);
}
