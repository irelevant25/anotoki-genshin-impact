<?php

use Anotoki\Lib\Translations\Http\TranslationsRoutes;

/**
 * The site's words, on the anotoki sites' shared library's routes
 * (anotoki-lib 0.3.0, TranslationsRoutes; the site's own part of it is
 * api/translations.php). One wire format for every anotoki site - the IAM's,
 * snake_case - and the library's Angular half (@anotoki/lib/translations) is
 * their client, so they are not in the generated one (api-config.mjs,
 * SKIP_PREFIXES).
 *
 *   GET    /api/translations/{code}               the pages' words in one language: {language, languages,
 *                                                 values, english?} - public, and open while the site waits for
 *                                                 an update, is closed for maintenance or requires signing in
 *   GET    /api/admin/languages                   every language, the hidden ones too
 *   GET    /api/admin/translations                every key with its strings in every language
 *   PUT    /api/admin/translations                {values: {key: {language: text}}}, only what changed
 *   GET    /api/admin/translations/{code}/export  a language's own strings, as a file
 *   PUT    /api/admin/translations/{code}/import  {key: text}: a language's strings back in
 *   POST   /api/admin/languages                   {code, name, native_name, enabled?}
 *   PUT    /api/admin/languages/{code}            {name?, native_name?, enabled?, sort_order?}
 *   DELETE /api/admin/languages/{code}            -> {strings, guides}: what went with it
 *
 * Every admin route is ADMIN's or EDITOR's (ROLES_CONTENT), the languages'
 * writes too - as before the move. No route makes, renames or deletes a key
 * any more, nor edits its description: keys come from migrations, with the
 * code's descriptions (users/050). The guides are routes/users/endpoints/guides.php.
 */

// The library is built when a request needs it: siteTranslations(), a
// closure the routes call.
TranslationsRoutes::bundle($app, siteTranslations(...), translationsError(...));

TranslationsRoutes::strings($app, '/api/admin', siteTranslations(...), translationsActor(...), translationsError(...), translationsAudit(...))
    ->add(requireRole(...ROLES_CONTENT))
    ->add(requireAuth());

TranslationsRoutes::languages($app, '/api/admin', siteTranslations(...), translationsError(...), translationsAudit(...))
    ->add(requireRole(...ROLES_CONTENT))
    ->add(requireAuth());
