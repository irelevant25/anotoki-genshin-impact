<?php

/**
 * What /api/files and the upload endpoints answer with.
 *
 * None of this is in a database. The files on disk are the record, and these
 * endpoints walk the folder rather than a table.
 */

class AssetFolder extends ResponseShape
{
    public function __construct(
        public readonly string $folder,
        public readonly int $files,
    ) {
    }
}

class AssetFile extends ResponseShape
{
    public function __construct(
        public readonly string $name,
        public readonly string $extension,
        public readonly int $size,
        public readonly string $modified,
        /** The path the site loads it by, e.g. `assets/materials/Foo.avif`. */
        public readonly string $url,
    ) {
    }
}

class AssetFilePage extends ResponseShape
{
    public function __construct(
        public readonly string $folder,
        public readonly int $total,
        public readonly int $page,
        public readonly int $pageSize,
        /** @var AssetFile[] */
        public readonly array $files,
    ) {
    }
}

class TrashedFile extends ResponseShape
{
    public function __construct(
        public readonly string $folder,
        /** The stamped name on disk, which is what restores it. */
        public readonly string $trashed,
        public readonly string $name,
        public readonly string $deleted_at,
        public readonly int $size,
    ) {
    }
}

class AssetUploadResult extends ResponseShape
{
    public function __construct(
        public readonly string $folder,
        public readonly string $path,
        /** Same as `path`, relative to the site root. */
        public readonly string $url,
    ) {
    }
}

/** Deleting moves the file to the trash under a stamped name; nothing is lost. */
class AssetTrashResult extends ResponseShape
{
    public function __construct(
        public readonly string $folder,
        public readonly string $name,
        public readonly string $trashed,
    ) {
    }
}

class AssetRestoreResult extends ResponseShape
{
    public function __construct(
        public readonly string $folder,
        public readonly string $name,
    ) {
    }
}

/** `POST /api/upload` - a file dropped into a folder, with nothing else touched. */
class UploadResult extends ResponseShape
{
    public function __construct(
        public readonly string $filename,
        public readonly string $path,
    ) {
    }
}

/**
 * `POST /api/uploads/{entity}/{field}` - stored where that field's files go,
 * but written onto no row. Used while a form is still being filled in.
 */
class EntityUploadResult extends ResponseShape
{
    public function __construct(
        public readonly string $entity,
        public readonly string $field,
        /** The base name it was stored under: no folder, no extension. */
        public readonly string $name,
        public readonly string $path,
    ) {
    }
}

/**
 * `POST /api/uploads/{entity}/{id}/{field}` - the same, and the resulting path
 * written back onto the row.
 */
class RecordUploadResult extends ResponseShape
{
    public function __construct(
        public readonly string $entity,
        public readonly int $id,
        public readonly string $field,
        public readonly string $name,
        /** The column the base name went into, or null where there is none. */
        public readonly ?string $nameColumn,
        public readonly string $path,
    ) {
    }
}

// ── What is in the tree, and what is missing from it ──────────────────────────

class AssetFormatCount extends ResponseShape
{
    public function __construct(
        /** Lower case, with no dot. `(none)` for a file with no extension. */
        public readonly string $extension,
        public readonly int $files,
        public readonly int $bytes,
    ) {
    }
}

/**
 * One medium's conversion health.
 *
 * `missing` is work an encoder can do. `converted_only` is not: a PNG decoded
 * back out of an AVIF is a bigger copy of the lossy one, not the original, so
 * those are reported and left alone.
 */
class AssetConversionCount extends ResponseShape
{
    public function __construct(
        /** Groups holding a source this medium can be converted from. */
        public readonly int $sources,
        public readonly int $missing,
        public readonly int $converted_only,
        /** False when nothing on this box can write the target format. */
        public readonly bool $can_convert,
    ) {
    }
}

class AssetStats extends ResponseShape
{
    public function __construct(
        public readonly string $generated_at,
        /** Seconds since the survey was walked, so the page can say how stale it is. */
        public readonly int $age,
        public readonly int $total_files,
        public readonly int $total_bytes,
        /** @var AssetFormatCount[] */
        public readonly array $formats,
        /** @var AssetConversionCount */
        public readonly object $images,
        /** @var AssetConversionCount */
        public readonly object $audio,
    ) {
    }
}

/**
 * How far the conversion has got.
 *
 * The work is a queue on disk worked through a batch per request, so this is
 * both the answer to "convert some more" and to "where are we".
 */
class AssetConvertProgress extends ResponseShape
{
    public function __construct(
        public readonly string $started_at,
        public readonly int $total,
        public readonly int $converted,
        public readonly int $failed,
        /** Already there, or gone, by the time its turn came. */
        public readonly int $skipped,
        public readonly int $remaining,
        public readonly bool $finished,
        /** @var AssetBlockedCount Left out of the queue because this box cannot write that format. */
        public readonly object $blocked,
        /** @var string[] The first few that would not convert, to see a pattern by. */
        public readonly array $failures,
    ) {
    }
}

class AssetBlockedCount extends ResponseShape
{
    public function __construct(
        public readonly int $images,
        public readonly int $audio,
    ) {
    }
}
