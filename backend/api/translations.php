<?php

/**
 * The site's words - its languages, its keys and their strings - through the
 * anotoki sites' shared library (anotoki-lib 0.3.0, Anotoki\Lib\Translations,
 * vendor/anotoki/lib): one implementation of them for every anotoki site, in
 * one wire format (the IAM's, snake_case). The library does the work - the
 * bundle the pages read, the admin pages' grid and its checks of every
 * string, the languages, export and import, the command line - and this file
 * is what is this site's about it:
 *
 *   - its released languages: en and sk, which its migrations write strings
 *     for, so neither can be deleted (switching one off is always possible);
 *   - its error body, {error, code, ...}, as every answer of this API words a
 *     refusal; who is saving (the signed-in person, from the token); and its
 *     audit log, where every change of the words is kept (the library's
 *     anotoki_audit_log, api/audit_log.php);
 *   - what its own tables make of a language: the guides written in it
 *     (guide_contents, users/050), which go with it when it is deleted.
 *
 * Who may do what is not the library's to say: the routes
 * (routes/users/endpoints/translations.php) are behind this site's own checks,
 * ADMIN or EDITOR for the strings and the languages alike, as before the move -
 * the owner's decision when the words moved into the library. So are the
 * other two: keys are made by migrations only, and their descriptions are the
 * code's (users/050).
 *
 * The tables are the family's one shape since users/050; the library's own
 * migrations (the set anotoki_translations, api/migration_runner.php) prove
 * it, and add the library's words under anotoki.*.
 */

use Anotoki\Lib\Support\JsonResponse;
use Anotoki\Lib\Support\Refusal;
use Anotoki\Lib\Translations\LanguageUsage;

require_once __DIR__ . '/audit_log.php';
use Anotoki\Lib\Translations\Translations;
use Anotoki\Lib\Translations\TranslationsConfig;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

/**
 * The languages this site's migrations write strings for. The next migration
 * that brings strings would fail without one, so neither can be deleted - only
 * switched off.
 */
const TRANSLATION_RELEASED_LANGUAGES = ['en', 'sk'];

/** The library, set up for this site, on its one connection. Built when a request needs it. */
function siteTranslations(): Translations
{
    return new Translations(usersDb(), new TranslationsConfig(releasedLanguages: TRANSLATION_RELEASED_LANGUAGES, usage: new GuideLanguageUsage()));
}

/**
 * A refusal in this API's words: `{"error": sentence, "code": code}` and what
 * it is about beside them (`key`, `language`, `keys`, ...) - the same body
 * every other route refuses with, so the pages read it the one way. Never
 * cached, like the library's own answers.
 */
function translationsError(ResponseInterface $response, Refusal $refusal): ResponseInterface
{
    return JsonResponse::write($response, $refusal->status, ['error' => $refusal->message, 'code' => $refusal->code] + $refusal->extra);
}

/**
 * Who is saving: the person requireAuth() put on the request, from their
 * verified token - never anything a body says. Their row is in `users` by
 * then (siteUserOf(), api/site_user.php), which translations.updated_by
 * refers to.
 */
function translationsActor(ServerRequestInterface $request): ?int
{
    $user = $request->getAttribute('user');

    return is_array($user) && isset($user['id']) ? (int) $user['id'] : null;
}

/**
 * A change of the words, into the audit log the admin panel reads (the
 * library's Audit page): a language added, changed or deleted, strings saved
 * or imported - by whom, from which sign-in, and what changed - under the
 * library's own names (language.created|updated|deleted, translations.saved|
 * imported), as every anotoki site records them. It stands in for the stamps
 * the keys and strings carried before users/050: the library keeps who saved
 * each string last (translations.updated_by), and this keeps the history.
 * (Entries from before genshin_impact/028 say content.* on the tables
 * languages and translations.)
 *
 * The library calls it after a write that changed something, with its own
 * details: what a language is now, or a save's summary (the languages it
 * touched, how many strings, the first hundred keys). A save names no target
 * of its own; it is filed, as this site always filed it, under `translations`
 * and the languages it touched ("sk"), so the Audit page finds a language's
 * saves by what they were about. The command line's import is written by
 * nobody.
 */
function translationsAudit(ServerRequestInterface $request, string $action, ?string $type, ?string $id, array $details): void
{
    $languages = implode(', ', array_map('strval', is_array($details['languages'] ?? null) ? $details['languages'] : []));
    siteAudit()->record($request, translationsActor($request), $action, $type ?? 'translations', $id ?? ($languages === '' ? null : $languages), $details);
}

/**
 * What this site's own tables make of a language: the guides written in it.
 * The admin Languages page shows how many each language has, and deleting a
 * language takes its guides with it (guide_contents.language_code cascades,
 * users/050) - so the question before a delete names them, and its answer
 * and audit entry say how many went.
 */
final class GuideLanguageUsage implements LanguageUsage
{
    public function extras(PDO $pdo, array $codes): array
    {
        $extras = array_fill_keys($codes, ['guides' => 0]);
        // Before users/050 is applied there are no guides of their own; the
        // admin pages are closed then anyway (the site waits for the update).
        if ($codes === [] || !guidesReady($pdo)) {
            return $extras;
        }

        $counts = $pdo->query('SELECT language_code, count(*) AS n FROM guide_contents GROUP BY language_code')->fetchAll(PDO::FETCH_KEY_PAIR);
        foreach ($codes as $code) {
            $extras[$code] = ['guides' => (int) ($counts[$code] ?? 0)];
        }

        return $extras;
    }

    public function refuseDelete(PDO $pdo, string $code): ?Refusal
    {
        return null;
    }

    public function beforeDelete(PDO $pdo, string $code, array $strings): array
    {
        return [];
    }
}
