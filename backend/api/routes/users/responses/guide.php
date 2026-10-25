<?php

/**
 * What the guides' routes answer with (routes/users/endpoints/guides.php).
 * The words themselves - the strings and the languages - are the anotoki
 * library's routes, whose client is the library's own, so they have no shapes
 * here.
 */

/**
 * `GET /api/guides/{guide}` - one guide, as a page draws it.
 *
 * `language` is the language the markup is in: the one asked for where the
 * guide has it, English otherwise - worth reading, like a bundle's.
 */
class GuideResponse extends ResponseShape
{
    public function __construct(
        public readonly string $guide,
        public readonly string $language,
        /** Markup, kept through the family's allow-list (api/rich_text.php) and drawn through it again (<anotoki-rich-html>). */
        public readonly string $html,
    ) {}
}

/** A language the guides may be written in, offered to readers or not yet. */
class GuideEditorLanguage extends ResponseShape
{
    public function __construct(
        public readonly string $code,
        /** In English: "Slovak". */
        public readonly string $name,
        /** As its own speakers write it: "Slovenčina". */
        public readonly string $native_name,
        /** Offered to readers. A guide in a hidden language is written ahead and read once it is offered. */
        public readonly bool $enabled,
    ) {}
}

/** One guide on the admin Guides page: its markup in every language that has some. */
class GuideEditorEntry extends ResponseShape
{
    public function __construct(
        public readonly string $guide,
        /** @var array<string, string> Language code to markup; a language without one reads the English. */
        public readonly array $values,
    ) {}
}

/** `GET /api/admin/guides` - every guide, and every language, the hidden ones too. */
class GuideEditorView extends ResponseShape
{
    public function __construct(
        /** @var GuideEditorLanguage[] */
        public readonly array $languages,
        /** @var GuideEditorEntry[] */
        public readonly array $guides,
    ) {}
}
