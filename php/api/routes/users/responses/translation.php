<?php

/**
 * What /api/translations and /api/languages answer with.
 *
 * A bundle is assembled per language rather than read from a table, and the
 * admin grid is three tables joined into one view, so neither has a row shape
 * to be described by.
 */

/**
 * `GET /api/translations/{code}` - the strings, and which language they turned
 * out to be.
 *
 * An unknown or retired code answers in the fallback rather than failing, so
 * `language` is worth reading: it is not always the code that was asked for.
 * `values` is a flat key-to-string map with English merged underneath, so a key
 * with no string in this language still answers with something readable.
 */
class TranslationBundleResponse extends ResponseShape
{
    public function __construct(
        public readonly string $language,
        /** @var array<string, string> */
        public readonly array $values,
    ) {
    }
}

/** One of the sites sharing this database, plus the pseudo-site `common`. */
class TranslationSite extends ResponseShape
{
    public function __construct(
        public readonly string $code,
        public readonly string $name,
    ) {
    }
}

/** One key in the editing grid, with what every language has for it. */
class TranslationGridKey extends ResponseShape
{
    public function __construct(
        public readonly string $name,
        public readonly ?string $description,
        /** `common` when every site loads it, otherwise the site that owns it. */
        public readonly string $site,
        /** Markup rather than a sentence - edited in the HTML editor. */
        public readonly bool $is_html,
        /** @var array<string, string> */
        public readonly array $values,
    ) {
    }
}

/**
 * Everything the translation editor draws in one request.
 *
 * Deliberately includes keys nothing has translated yet: those are the rows
 * that need attention.
 */
class TranslationAdminView extends ResponseShape
{
    public function __construct(
        /** @var languages[] The rows, so a disabled language still lists its own settings. */
        public readonly array $languages,
        /** @var TranslationGridKey[] */
        public readonly array $keys,
        /** @var TranslationSite[] */
        public readonly array $sites,
        /** Which site this deployment serves. */
        public readonly string $currentSite,
    ) {
    }
}

class TranslationSaveResult extends ResponseShape
{
    public function __construct(
        public readonly int $written,
        public readonly int $cleared,
    ) {
    }
}

class TranslationImportResult extends ResponseShape
{
    public function __construct(
        public readonly int $written,
        public readonly int $cleared,
        public readonly int $keys_created,
    ) {
    }
}

/**
 * Deleting a language: the translations that went with it, and the accounts
 * that were reading in it and have been moved to the fallback.
 */
class LanguageDeleted extends ResponseShape
{
    public function __construct(
        public readonly string $message,
        public readonly int $translations_deleted,
        public readonly int $users_moved,
    ) {
    }
}

/** Deleting a key takes its translations with it, by cascade. */
class TranslationKeyDeleted extends ResponseShape
{
    public function __construct(
        public readonly string $message,
        public readonly int $translations_deleted,
    ) {
    }
}
