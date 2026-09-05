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

/** Which recorded-but-gone rows to forget. Omitted means all of them. */
export interface MissingFileRef {
  /** Comma separated catalogue ids. */
  id?: string;
}

/** Which trashed file to remove for good. Omitted means the whole trash. */
export interface TrashedFileRef {
  trashed?: string;
}

/**
 * A batch of the conversion the Files page drives.
 *
 * `restart` builds the work list, which is the walk over the whole tree;
 * without it the next batch is taken off the list already there. That split is
 * what lets seven thousand files be converted behind a progress bar rather
 * than behind one request nobody can wait for.
 *
 * `limit` is a ceiling, not a promise: a batch also stops on a clock, so a
 * queue of voice lines does not run for a minute because a queue of icons
 * would have finished in fifty milliseconds.
 */
export interface AssetConvertRequest {
  restart?: boolean;
  limit?: number;
}

/**
 * Whether to walk the tree again rather than answer from the day-old cache.
 *
 * Its own flag rather than a separate endpoint, because "what is out there" and
 * "what is out there, now, really" are the same question asked with different
 * patience.
 */
export interface AssetStatsQuery {
  refresh?: boolean;
}

/** Which originals to list: the images or the audio. */
export interface AssetCleanupQuery {
  kind: 'image' | 'audio';
  page?: number;
}

/**
 * A batch of the cleanup the Files page drives.
 *
 * `keep` is what was deselected, not what to delete. The candidate list runs to
 * tens of thousands and the handful somebody took out of it is the part worth
 * sending; the server works out the rest against the catalogue as it is now
 * rather than as the modal saw it a minute ago.
 */
export interface AssetCleanupRequest {
  restart?: boolean;
  kind?: 'image' | 'audio';
  keep?: string[];
  limit?: number;
}

/**
 * A new kind of asset.
 *
 * `path` follows from the code unless one is given: `character.icon` means
 * `character/icon`, which is the whole convention and the reason a code is
 * dotted rather than free text.
 */
export interface FileCategoryCreateRequest {
  code: string;
  label?: string;
  path?: string;
}

/**
 * Renaming a category, or moving where it points.
 *
 * Changing `path` moves every file in it, because a category's path is where
 * its files are - a rename that left them behind would leave the table
 * describing a tree that is not there.
 */
export interface FileCategorySaveRequest {
  label?: string;
  path?: string;
}

/** Where one file should live. Null means unfiled, which is why it exists. */
export interface FileCategoryMoveRequest {
  category_id: number | null;
}
