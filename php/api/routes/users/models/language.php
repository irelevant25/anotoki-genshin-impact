<?php

namespace User;

/**
 * A language the site can be read in.
 *
 * `code` is what everything else speaks (`en`, `sk`), `name` is the English
 * name used as the table's key, and `native_name` is how its own speakers
 * write it - which is what belongs in a chooser, since someone looking for
 * Slovak is looking for "Slovenčina", not "Slovak".
 */
class Language extends \DbModel
{
    public function __construct(
        public readonly string $code,
        public readonly string $name,
        public readonly string $native_name,
        public readonly ?bool $enabled = null,
        public readonly ?int $sort_order = null,
    ) {}
}

/**
 * A translatable string, independent of any translation of it, so it can be
 * listed as missing and can carry a note about where it appears.
 */
class TranslationKey extends \DbModel
{
    public function __construct(
        public readonly string $name,
        public readonly ?string $description = null,
        /** Which site owns it, or 'common' when every site shares it. */
        public readonly ?string $site = null,
    ) {}
}
