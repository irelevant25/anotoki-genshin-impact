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
