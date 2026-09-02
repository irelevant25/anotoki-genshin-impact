/**
 * The asset tree on disk.
 *
 * Hand-written: none of this is in a database. The files are the record, and
 * these endpoints walk the folder rather than a table.
 */

export interface AssetFileQuery {
  folder: string;
  search?: string;
  page?: number;
}

/** One file, named the way the delete and restore endpoints want it. */
export interface AssetFileRef {
  folder: string;
  name: string;
}
