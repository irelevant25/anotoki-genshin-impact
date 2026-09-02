<?php

/**
 * What /api/backups answers with.
 *
 * None of this is in a database. A backup is a set of dump files with a
 * manifest beside them, so the manifest is the only place these shapes exist.
 */

class BackupTableCount extends ResponseShape
{
    public function __construct(
        public readonly string $name,
        public readonly int $rows,
    ) {
    }
}

class BackupDatabase extends ResponseShape
{
    public function __construct(
        public readonly string $alias,
        public readonly string $name,
        /** The dump on disk, e.g. `genshin_impact.dump`. */
        public readonly ?string $file,
        public readonly ?int $size,
        public readonly ?int $duration_ms,
        /** Counted before the dump, so the number describes what went into it. */
        public readonly int $rows,
        /** @var BackupTableCount[]|null */
        public readonly ?array $tables,
        public readonly ?string $error,
    ) {
    }
}

class BackupEntry extends ResponseShape
{
    public function __construct(
        public readonly string $id,
        public readonly string $created_at,
        public readonly ?string $created_by,
        public readonly ?string $description,
        /** complete | partial | failed | incomplete */
        public readonly string $status,
        public readonly ?string $format,
        public readonly ?string $pg_dump_version,
        public readonly ?int $duration_ms,
        public readonly int $size,
        /** @var BackupDatabase[] */
        public readonly array $databases,
        /** Only on a backup that never finished, explaining what it is. */
        public readonly ?string $note = null,
    ) {
    }
}

/** One database as the status page counts it, without reading any dump. */
class BackupStatusDatabase extends ResponseShape
{
    public function __construct(
        public readonly string $alias,
        public readonly string $name,
        public readonly ?int $size,
        public readonly ?int $tables,
        public readonly ?string $error,
    ) {
    }
}

/** Whether this installation can take a backup at all, and what it has already. */
class BackupStatus extends ResponseShape
{
    public function __construct(
        public readonly ?string $driver,
        public readonly bool $supported,
        public readonly ?string $pg_dump,
        public readonly ?string $pg_dump_version,
        public readonly ?string $pg_restore,
        public readonly string $directory,
        public readonly bool $writable,
        public readonly ?int $free_space,
        public readonly int $backup_count,
        public readonly int $stored_size,
        /** @var BackupStatusDatabase[] */
        public readonly array $databases,
    ) {
    }
}

/** Rows and tables on one side of a restore. */
class BackupSize extends ResponseShape
{
    public function __construct(
        public readonly int $rows,
        public readonly int $tables,
    ) {
    }
}

class RestoreDifference extends ResponseShape
{
    public function __construct(
        public readonly string $name,
        /** Null where the table is on one side only. */
        public readonly ?int $live,
        public readonly ?int $backup,
        /**
         * Rows that exist now and are not in the backup, so the ones a restore
         * loses. Meaningless for `kept`.
         */
        public readonly int $delta,
        /**
         * `changed` - in both, with different counts.
         * `created` - in the backup only, so the restore creates it.
         * `kept`    - here only. pg_restore --clean drops what the dump
         *             contains, so a table made since the backup survives it.
         */
        public readonly string $kind,
    ) {
    }
}

/** What restoring this database would cost, counted table by table. */
class BackupPreview extends ResponseShape
{
    public function __construct(
        public readonly string $id,
        public readonly string $alias,
        public readonly string $name,
        public readonly ?string $created_at,
        /** @var BackupSize */
        public readonly object $live,
        /** @var BackupSize */
        public readonly object $backup,
        /** Rows that exist now, are absent from the backup, and would be lost. */
        public readonly int $lost,
        /** @var RestoreDifference[] */
        public readonly array $differences,
    ) {
    }
}

class RestoreResult extends ResponseShape
{
    public function __construct(
        public readonly string $restored,
        public readonly string $from,
        /** The backup taken of the old state immediately before replacing it. */
        public readonly string $safety_backup,
        public readonly int $duration_ms,
        public readonly int $disconnected,
        public readonly int $rows,
        /** @var BackupTableCount[] */
        public readonly array $tables,
        /** @var string[] */
        public readonly array $warnings,
    ) {
    }
}
