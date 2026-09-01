/**
 * Database dumps.
 *
 * Hand-written: a backup is a file on disk with a manifest beside it, not a
 * row anywhere, so nothing in the schema describes one.
 */

export interface BackupTableCount {
  name: string;
  rows: number;
}

export interface BackupDatabase {
  alias: string;
  name: string;
  /** The dump on disk, e.g. `genshin_impact.dump`. */
  file?: string;
  size: number | null;
  duration_ms?: number | null;
  /** Counted before the dump, so the number describes what went into it. */
  rows: number;
  tables: BackupTableCount[] | null;
  error?: string | null;
}

export interface BackupEntry {
  id: string;
  created_at: string;
  created_by: string | null;
  description: string | null;
  /** complete | partial | failed | incomplete */
  status: string;
  format?: string;
  pg_dump_version?: string | null;
  duration_ms: number | null;
  size: number;
  databases: BackupDatabase[];
  /** Only on a backup that never finished, explaining what it is. */
  note?: string;
}

export interface BackupRequest {
  description: string;
}

/** Whether this installation can take a backup at all, and what it has already. */
export interface BackupStatus {
  driver: string | null;
  supported: boolean;
  pg_dump: string | null;
  pg_dump_version: string | null;
  pg_restore: string | null;
  directory: string;
  writable: boolean;
  free_space: number | null;
  backup_count: number;
  stored_size: number;
  databases: { alias: string; name: string; size: number | null; tables: number | null; error: string | null }[];
}

export interface RestoreDifference {
  name: string;
  /** Null where the table is in one side only. */
  live: number | null;
  backup: number | null;
  /**
   * Rows that exist now and are not in the backup, so the ones a restore
   * loses. Meaningless for `kept`.
   */
  delta: number;
  /**
   * `changed` - in both, with different counts.
   * `created` - in the backup only, so the restore creates it.
   * `kept`    - here only. pg_restore --clean drops only what the dump
   *             contains, so a table made since the backup survives it.
   */
  kind: 'changed' | 'created' | 'kept';
}

/** What restoring this database would cost, counted table by table. */
export interface BackupPreview {
  id: string;
  alias: string;
  name: string;
  created_at: string | null;
  live: { rows: number; tables: number };
  backup: { rows: number; tables: number };
  /** Rows that exist now, are absent from the backup, and would be destroyed. */
  lost: number;
  differences: RestoreDifference[];
}

/**
 * Replacing a database with what is in a backup.
 *
 * `confirm` must be the database's own alias and `password` the caller's own.
 * Both are checked again on the server: the browser is not what decides whether
 * this is allowed.
 */
export interface RestoreRequest {
  password: string;
  confirm: string;
}

export interface RestoreResult {
  restored: string;
  from: string;
  /** The backup taken of the old state immediately before replacing it. */
  safety_backup: string;
  duration_ms: number;
  disconnected: number;
  rows: number;
  tables: BackupTableCount[];
  warnings: string[];
}
