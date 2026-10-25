<?php

/**
 * The texts genshin keeps as HTML - the guides (guide_contents.html) and the
 * voice lines' texts (characters_voice_overs.text_*) - go into the database
 * through the anotoki family's allow-list (anotoki-lib 0.11.0,
 * Anotoki\Lib\RichHtml\RichHtml::clean()), whoever sent them: the admin
 * panel's editor (<anotoki-html-editor>, which writes the same allow-list's
 * HTML) or the API straight. What is kept is what the pages show
 * (<anotoki-rich-html>, the same rules, the same output for the same text):
 * paragraphs and lines, headings h2 to h4, lists, the words' formats, links to
 * the web and to a mail address, five inline styles - and the class names
 * below. Nothing in it can run, load anything or leave the text's box; what
 * the allow-list does not name is dropped, or unwrapped to its words.
 */

use Anotoki\Lib\RichHtml\RichHtml;

/**
 * The class names genshin's texts may carry beside the allow-list's own:
 * "tag", the guides' badge. The pages name the same (frontend
 * shared/rich-text.ts), and draw it (shared/local-lib/rich-text.scss).
 */
const RICH_TEXT_CLASSES = ['tag'];

/** A text through the allow-list; null when no words are left of it (an emptied editor's <p></p>, <p><br></p>). */
function cleanRichText(string $html): ?string
{
    $clean = RichHtml::clean($html, ['classes' => RICH_TEXT_CLASSES]);

    return RichHtml::isBlank($clean) ? null : $clean;
}
