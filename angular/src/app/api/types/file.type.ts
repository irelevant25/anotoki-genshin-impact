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
