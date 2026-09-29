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
 * `confirm` must be the database's own alias, checked again on the server. There
 * is no password to retype any more - this site has none - so the server asks
 * instead for a sign-in at the IAM from the last ten minutes, and answers
 * `reauth_required` without one.
 */
export interface RestoreRequest {
  confirm: string;
}

