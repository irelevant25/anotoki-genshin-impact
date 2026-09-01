/**
 * The asset tree on disk.
 *
 * Hand-written: none of this is in a database. The files are the record, and
 * these endpoints walk the folder rather than a table.
 */

export interface AssetFolder {
  folder: string;
  files: number;
}

export interface AssetFile {
  name: string;
  extension: string;
  size: number;
  modified: string;
  /** The path the site loads it by, e.g. `assets/materials/Foo.avif`. */
  url: string;
}

export interface AssetFileQuery {
  folder: string;
  search?: string;
  page?: number;
}

export interface AssetFilePage {
  folder: string;
  total: number;
  page: number;
  pageSize: number;
  files: AssetFile[];
}

/** One file, named the way the delete and restore endpoints want it. */
export interface AssetFileRef {
  folder: string;
  name: string;
}

export interface TrashedFile {
  folder: string;
  /** The stamped name on disk, which is what restores it. */
  trashed: string;
  name: string;
  deleted_at: string;
  size: number;
}

export interface AssetUploadResult {
  folder: string;
  path: string;
  /** Same as `path`, relative to the site root. */
  url: string;
}

/** Deleting moves the file to the trash, under a stamped name; nothing is lost. */
export interface AssetTrashResult {
  folder: string;
  name: string;
  trashed: string;
}

export interface AssetRestoreResult {
  folder: string;
  name: string;
}

/** `POST /api/upload` - a file dropped into a folder, with nothing else touched. */
export interface UploadResult {
  filename: string;
  path: string;
}

/**
 * `POST /api/uploads/{entity}/{field}` - stored in the right place for that
 * field, but written onto no row. Used while a form is still being filled in.
 */
export interface EntityUploadResult {
  entity: string;
  field: string;
  /** The base name it was stored under: no folder, no extension. */
  name: string;
  path: string;
}

/**
 * `POST /api/uploads/{entity}/{id}/{field}` - the same, and the resulting path
 * written back onto the row.
 */
export interface RecordUploadResult extends EntityUploadResult {
  id: number;
  /** The column the base name went into, or null where the table has none. */
  nameColumn: string | null;
}
