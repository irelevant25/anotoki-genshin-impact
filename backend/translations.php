<?php

/**
 * translations.php - the site's words from the command line, through the
 * anotoki library (anotoki-lib 0.3.0, Anotoki\Lib\Translations\Cli): the keys
 * the frontend asks for against the database's, and a language's strings out
 * and back in.
 *
 *   php translations.php [--status]            what the frontend asks for against the database: a key it
 *                                              asks for and the database lacks, a key without English, or
 *                                              a key put together from a prefix shared/dynamic-keys.ts does
 *                                              not declare fails (exit 1); keys nothing asks for any more,
 *                                              and stored strings a save would refuse, are listed; and how
 *                                              far each language is
 *   php translations.php --export sk [file]    a language's own strings as flat JSON, to the file or the screen
 *   php translations.php --import sk file      and back in: checked as a save in the admin panel is, all or
 *                                              nothing; an empty string is passed over, an unknown key refused
 *
 * Strings live in the database so the admin panel can reword them, which
 * means nothing stops a template asking for a key no migration ever wrote:
 * it shows as the key itself, and the mistake ships. --status is what catches
 * it. Keys come from migrations only (users/050): there is no command that
 * makes one any more (the old --add-missing), nor one that writes the
 * database out as a migration (--seed-sql) - a migration is written by hand,
 * with the key's description, its English and its Slovak.
 *
 * It refuses while the database waits for a migration: those strings are not
 * the release's yet. An import is written by nobody (as a migration's
 * strings are) and kept in the audit log, `via: command line`.
 *
 * A tool for a computer with the whole repository and a shell - never
 * uploaded (build-dist.php leaves it out); on the host the admin panel's
 * Translations page exports and imports.
 */

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/api/migration_runner.php';
require_once __DIR__ . '/api/guides.php';
require_once __DIR__ . '/api/translations.php';

use Anotoki\Lib\Translations\Cli\KeyScanner;
use Anotoki\Lib\Translations\Cli\TranslationsCommand;

$command = $argv[1] ?? '--status';
if (in_array($command, ['--add-missing', '--seed-sql'], true)) {
    fwrite(
        STDERR,
        "$command is gone: keys come from migrations only now (backend/migrations/users/050_translations_into_the_library.sql)." .
            " Write a users/ migration with the key, its description, its English and its Slovak - the db-migration skill says how.\n",
    );
    exit(1);
}

$scanner = new KeyScanner(
    root: dirname(__DIR__) . '/frontend/src/app',
    // The generated API client holds paths and types, never a key.
    exclude: ['api/**'],
    // The keys put together at run time ('account.roleName.' + role), written out.
    dynamicKeys: 'shared/dynamic-keys.ts',
);

exit(
    (new TranslationsCommand(
        translations: siteTranslations(...),
        scanner: $scanner,
        // The library's names for it (translations.imported), by nobody - the
        // audit log is the anotoki library's (api/audit_log.php).
        audit: static fn(string $action, ?string $type, ?string $id, array $details) => siteAudit()->record(null, null, $action, $type, $id, $details),
        pending: static fn(): array => array_map(static fn(array $file): string => $file['set'] . '/' . $file['name'], siteMigrator(getDb())->applicable()),
        title: 'genshin: the site\'s own strings',
    ))->run($argv)
);
