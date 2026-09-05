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
        /** Its row in the catalogue, or null while the catalogue has not caught up. */
        public readonly ?int $file_id,
        /** The category it is filed under, by code. */
        public readonly ?string $category,
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
        /** The catalogue row the file was filed as, or null if it could not be. */
        public readonly ?int $fileId,
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
        /** The catalogue row the file was filed as, or null if it could not be. */
        public readonly ?int $fileId,
    ) {
    }
}

/**
 * A catalogue row whose file is not on disk any more.
 *
 * The Files page counts these as "recorded but gone". Something removed the
 * file without telling the catalogue - a cleanup, an FTP client, a hand - and
 * the row is now a promise of a picture that cannot be shown.
 */
class MissingFile extends ResponseShape
{
    public function __construct(
        public readonly int $id,
        /** Where it would be, if it were there: `materials/Dandelion Seed.avif`. */
        public readonly string $path,
        public readonly string $name,
        public readonly string $extension,
        public readonly string $category,
        public readonly ?int $size,
        public readonly ?string $modified_at,
        /** How many entity rows still point at it - deleting the row clears those. */
        public readonly int $used_by,
    ) {
    }
}

/** What forgetting them did. */
class MissingForgotten extends ResponseShape
{
    public function __construct(
        public readonly int $forgotten,
        /** Entity columns set back to null because the row they named is gone. */
        public readonly int $unlinked,
    ) {
    }
}

/** What emptying the trash did. */
class TrashEmptied extends ResponseShape
{
    public function __construct(
        public readonly int $deleted,
        public readonly int $bytes,
        public readonly int $failed,
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
        /** @var AssetCatalogueCounts How far the `files` table has drifted from the disk. */
        public readonly object $catalogue,
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

// ── Taking the originals away ────────────────────────────────────────────────

/** One file that could go, and what it would give back. */
class AssetCleanupFile extends ResponseShape
{
    public function __construct(
        public readonly int $id,
        /** Relative to `assets/`, e.g. `character/icon/BAIZHU.png`. */
        public readonly string $path,
        public readonly int $size,
    ) {
    }
}

/**
 * A page of what a cleanup would remove.
 *
 * Paged because there are forty thousand of them and the point of showing the
 * list at all is that somebody can take things out of it before agreeing.
 */
class AssetCleanupPage extends ResponseShape
{
    public function __construct(
        /** `image` or `audio`. */
        public readonly string $kind,
        public readonly int $total,
        /** What the whole set would give back, not just this page. */
        public readonly int $bytes,
        public readonly int $page,
        public readonly int $pageSize,
        /** @var AssetCleanupFile[] */
        public readonly array $files,
    ) {
    }
}

/** How far a cleanup has got. Batched, like the conversion, for the same reason. */
class AssetCleanupProgress extends ResponseShape
{
    public function __construct(
        public readonly string $kind,
        public readonly string $started_at,
        public readonly int $total,
        public readonly int $bytes,
        public readonly int $trashed,
        public readonly int $failed,
        /** Deselected in the modal, and therefore never queued. */
        public readonly int $kept,
        public readonly int $remaining,
        public readonly bool $finished,
        /** @var string[] The first few that would not move. */
        public readonly array $failures,
    ) {
    }
}

// ── The catalogue ────────────────────────────────────────────────────────────

/**
 * How far the `files` table has drifted from the disk.
 *
 * `uncatalogued` is the number worth watching: files that turned up without
 * going through the API, which is what happens when somebody uses FTP.
 */
class AssetCatalogueCounts extends ResponseShape
{
    public function __construct(
        public readonly int $on_disk,
        public readonly int $catalogued,
        /** On disk with no row. The check button adopts these. */
        public readonly int $uncatalogued,
        /** Of those, the ones in a folder no category claims. */
        public readonly int $unfiled,
        /** Rows whose file has gone. Reported, never deleted automatically. */
        public readonly int $missing,
    ) {
    }
}

/** What one sweep did. */
class AssetReconcileResult extends ResponseShape
{
    public function __construct(
        public readonly int $adopted,
        public readonly int $moved_to_unfiled,
        public readonly int $resized,
        public readonly int $missing,
        public readonly int $on_disk,
    ) {
    }
}

/**
 * A kind of asset, and where that kind lives.
 *
 * `path` is the folder under `assets/`, and it is what a file's own path is
 * built from - so changing it moves files. `is_system` marks the one category
 * nothing may rename or remove, because every file with no category needs
 * somewhere to be.
 */
class FileCategory extends ResponseShape
{
    public function __construct(
        public readonly int $id,
        /** Dotted, the way the front end names asset folders: `character.icon`. */
        public readonly string $code,
        public readonly string $label,
        public readonly string $path,
        /** Retired rather than removed, so it can come back with its history. */
        public readonly bool $deleted,
        public readonly bool $is_system,
        public readonly int $sort_order,
        public readonly int $files,
        public readonly int $bytes,
    ) {
    }
}

/** Where a file ended up after being moved between categories. */
class FileCategoryMove extends ResponseShape
{
    public function __construct(
        public readonly int $id,
        public readonly string $category,
        public readonly string $path,
    ) {
    }
}
