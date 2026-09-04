<?php

/**
 * Noting what happened to the asset tree.
 *
 * Its own file because both sides need it and neither can reach the other: the
 * API loads this through index.php, and assets.php is a CLI script that loads
 * nothing else from api/. Two copies of ten lines is exactly the kind of pair
 * that drifts, and this one records history - a version of it that quietly
 * stopped matching would be worse than useless.
 *
 * `changed_by` being null is a real answer, not a missing one. Files arrive
 * over FTP and leave the same way, so a sweep that finds one cannot say who put
 * it there; writing down whoever pressed the button would be a guess recorded
 * as a fact. Anything a person actually chose passes their id.
 */

/** One entry against the `files` table. Pass 0 for something that is about the whole catalogue. */
function auditFile(PDO $pdo, int $fileId, string $action, array $changes, ?int $by = null): void
{
    $statement = $pdo->prepare(
        'INSERT INTO audit_logs (table_name, record_id, action, changed_by, changed_at, changes)
         VALUES (:table_name, :record_id, :action, :changed_by, CURRENT_TIMESTAMP, :changes)'
    );

    $statement->execute([
        'table_name' => 'files',
        'record_id' => (string) $fileId,
        'action' => $action,
        'changed_by' => $by,
        'changes' => json_encode($changes, JSON_UNESCAPED_UNICODE),
    ]);
}
