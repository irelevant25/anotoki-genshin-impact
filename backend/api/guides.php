<?php

/**
 * The guides behind the question marks - a page of markup each, explaining
 * one quiz, one game or one part of the site - as content of their own
 * (guide_contents, users/050), no longer strings: the owner's decision when
 * the words moved into the anotoki library. A guide is longer than a string
 * may be (the minesweeper's runs to 2,154 characters, a string to 2,000) and
 * is markup, which the library's Translations page edits as one line of text.
 *
 * Read by the pages from GET /api/guides/{guide} in the reader's language,
 * English where that language has none, and drawn by <app-rich-text>, which
 * keeps only what its allow-list lets through (frontend
 * shared/local-lib/rich-html.ts) - so the markup is kept as the editor wrote
 * it. Edited on the admin panel's Guides page, around the HTML editor the
 * Translations page used to open for them, by ADMIN or EDITOR - who may
 * reword the strings. Guides are made by migrations, like the keys: the page
 * changes the ones there are. Their titles stay strings (guide.<guide>.title).
 *
 * The routes are routes/users/endpoints/guides.php; what is checked and kept
 * is here, the library's helpers doing what they do for the strings (Text,
 * LanguageCode, JsonBody).
 */

use Anotoki\Lib\Support\Refusal;
use Anotoki\Lib\Translations\LanguageCode;
use Anotoki\Lib\Translations\Text;
use Anotoki\Lib\Translations\Translations;

/** A guide's name: what its key had between `guide.` and `.content`. */
const GUIDE_NAME_PATTERN = '/^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/D';

/** The most a guide's markup may hold, in characters - ten times the longest there is. */
const GUIDE_HTML_MAX = 20000;

/** The largest body a save takes, in bytes: every language of one guide at its longest, and room. */
const GUIDE_BODY_LIMIT = 1024 * 1024;

/** Is the table there? Between the upload and users/050's Apply it is not; a query that cannot fail. */
function guidesReady(PDO $pdo): bool
{
    return (bool) $pdo->query("SELECT to_regclass('guide_contents') IS NOT NULL")->fetchColumn();
}

function guidesUnavailable(): Refusal
{
    return new Refusal(503, 'guides_unavailable', 'The guides are not in the database yet. An administrator applies the waiting database update on the Migrations page.');
}

function guideNotFound(): Refusal
{
    return new Refusal(404, 'not_found', 'There is no such guide');
}

/**
 * One guide, as a page reads it: in $code where it has markup in it, in
 * English otherwise - and a code the site does not offer (switched off, or
 * not there at all) reads English, as the strings do. `language` says which.
 * A guide is one that has English; 404 otherwise.
 *
 * @return array{guide: string, language: string, html: string}|Refusal
 */
function guideFor(PDO $pdo, string $guide, string $code): array|Refusal
{
    if (preg_match(GUIDE_NAME_PATTERN, $guide) !== 1 || !LanguageCode::ok($code)) {
        return guideNotFound();
    }
    if (!guidesReady($pdo)) {
        return guidesUnavailable();
    }

    $offered = array_map('strval', $pdo->query('SELECT code FROM languages WHERE enabled')->fetchAll(PDO::FETCH_COLUMN));
    $language = LanguageCode::resolve($code, $offered, Translations::FALLBACK);

    $statement = $pdo->prepare('SELECT language_code, html FROM guide_contents WHERE guide = ? AND language_code IN (?, ?)');
    $statement->execute([$guide, $language, Translations::FALLBACK]);
    $markup = $statement->fetchAll(PDO::FETCH_KEY_PAIR);

    if (!isset($markup[Translations::FALLBACK])) {
        return guideNotFound();
    }
    $in = isset($markup[$language]) ? $language : Translations::FALLBACK;

    return ['guide' => $guide, 'language' => $in, 'html' => (string) $markup[$in]];
}

/**
 * Every guide with its markup in every language that has some, and every
 * language - the hidden ones too, so a language's guides can be written
 * before it is offered: the admin Guides page.
 *
 * @return array{languages: list<array{code: string, name: string, native_name: string, enabled: bool}>, guides: list<array{guide: string, values: object}>}|Refusal
 */
function guidesGrid(PDO $pdo): array|Refusal
{
    if (!guidesReady($pdo)) {
        return guidesUnavailable();
    }

    $languages = array_map(
        static fn (array $row): array => [
            'code' => (string) $row['code'],
            'name' => (string) $row['name'],
            'native_name' => (string) $row['native_name'],
            'enabled' => $row['enabled'] === true || $row['enabled'] === 't' || $row['enabled'] === 1 || $row['enabled'] === '1',
        ],
        $pdo->query('SELECT code, name, native_name, enabled FROM languages ORDER BY sort_order, name, code')->fetchAll(PDO::FETCH_ASSOC)
    );

    $guides = [];
    foreach ($pdo->query('SELECT guide, language_code, html FROM guide_contents ORDER BY guide COLLATE "C", language_code COLLATE "C"')->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $guides[(string) $row['guide']][(string) $row['language_code']] = (string) $row['html'];
    }

    return [
        'languages' => $languages,
        'guides' => array_map(
            static fn (string $guide, array $values): array => ['guide' => $guide, 'values' => (object) $values],
            array_keys($guides),
            array_values($guides)
        ),
    ];
}

/**
 * Keeps a guide's markup in the languages sent - {language: html}, only the
 * ones that changed - all of it or none. A blank one in another language
 * deletes that language's (the guide then reads in English there); English
 * cannot be left blank. Markup sent as it already is keeps its writer and
 * time. Only a guide there is (one with English) can be changed.
 *
 *   404 not_found          no such guide
 *   422 invalid_value      not {language: text}, or markup longer than GUIDE_HTML_MAX
 *   422 unknown_language   a language the site does not have
 *   422 fallback_required  English sent blank
 *
 * @return array{guide: string, changed: array<string, array{old: ?string, new: ?string}>}|Refusal
 */
function guideSave(PDO $pdo, string $guide, mixed $values, ?int $userId): array|Refusal
{
    if (preg_match(GUIDE_NAME_PATTERN, $guide) !== 1) {
        return guideNotFound();
    }
    if (!is_array($values) || ($values !== [] && array_is_list($values))) {
        return Refusal::invalid('invalid_value', 'Send the markup as {values: {language: html}}');
    }

    $changed = [];
    $pdo->beginTransaction();
    try {
        // FOR SHARE: no language is deleted between the check and the writing.
        $languages = array_map('strval', $pdo->query('SELECT code FROM languages FOR SHARE')->fetchAll(PDO::FETCH_COLUMN));

        // The guide's English, held: two saves of one guide go one after the other.
        $english = $pdo->prepare('SELECT html FROM guide_contents WHERE guide = ? AND language_code = ? FOR UPDATE');
        $english->execute([$guide, Translations::FALLBACK]);
        if ($english->fetchColumn() === false) {
            $pdo->rollBack();

            return guideNotFound();
        }

        $writes = [];
        foreach ($values as $code => $html) {
            $code = (string) $code;
            if (!in_array($code, $languages, true)) {
                $pdo->rollBack();

                return Refusal::invalid('unknown_language', "There is no language \"$code\"", ['language' => $code]);
            }
            $clean = Text::clean($html);
            if ($clean === null) {
                $pdo->rollBack();

                return Refusal::invalid('invalid_value', "The markup for \"$code\" is not text", ['language' => $code]);
            }
            $blank = Text::blank($clean);
            if ($blank && $code === Translations::FALLBACK) {
                $pdo->rollBack();

                return Refusal::invalid('fallback_required', 'A guide needs its English: every other language falls back to it', ['language' => $code]);
            }
            if (!$blank && Text::length($clean) > GUIDE_HTML_MAX) {
                $pdo->rollBack();

                return Refusal::invalid('invalid_value', 'A guide holds at most ' . GUIDE_HTML_MAX . " characters of markup; the one for \"$code\" holds more", ['language' => $code]);
            }
            $writes[$code] = $blank ? null : $clean;
        }

        $stored = $pdo->prepare('SELECT html FROM guide_contents WHERE guide = ? AND language_code = ? FOR UPDATE');
        $delete = $pdo->prepare('DELETE FROM guide_contents WHERE guide = ? AND language_code = ?');
        $upsert = $pdo->prepare(
            'INSERT INTO guide_contents (guide, language_code, html, updated_by) VALUES (?, ?, ?, ?)
             ON CONFLICT (guide, language_code) DO UPDATE
                SET html = EXCLUDED.html, updated_at = CURRENT_TIMESTAMP, updated_by = EXCLUDED.updated_by
              WHERE guide_contents.html IS DISTINCT FROM EXCLUDED.html'
        );
        // One order for every save, so two at once never wait on each other's rows.
        ksort($writes, SORT_STRING);
        foreach ($writes as $code => $html) {
            $stored->execute([$guide, $code]);
            $old = $stored->fetchColumn();
            $old = $old === false ? null : (string) $old;
            if ($old === $html) {
                continue;
            }
            if ($html === null) {
                $delete->execute([$guide, $code]);
            } else {
                $upsert->execute([$guide, $code, $html, $userId]);
            }
            $changed[$code] = ['old' => $old, 'new' => $html];
        }

        $pdo->commit();
    } catch (\Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }

    return ['guide' => $guide, 'changed' => $changed];
}

/** One guide as the Guides page holds it: its markup in every language that has some. */
function guideEntry(PDO $pdo, string $guide): array
{
    $statement = $pdo->prepare('SELECT language_code, html FROM guide_contents WHERE guide = ? ORDER BY language_code COLLATE "C"');
    $statement->execute([$guide]);

    return ['guide' => $guide, 'values' => (object) $statement->fetchAll(PDO::FETCH_KEY_PAIR)];
}
