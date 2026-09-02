/**
 * Database dumps.
 *
 * Hand-written: a backup is a file on disk with a manifest beside it, not a
 * row anywhere, so nothing in the schema describes one.
 */

export interface BackupRequest {
  description: string;
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

