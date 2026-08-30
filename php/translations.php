<?php

/**
 * translations.php — keeps the translation keys in the database in step with
 * the keys the Angular sources actually ask for.
 *
 * Translations live in the database so they can be edited from the admin
 * panel, which means nothing stops a template asking for a key nobody ever
 * created: it renders as the raw key and the mistake ships. This is the check
 * that catches it.
 *
 * Usage:
 *   php translations.php --status                 what the code uses vs what exists
 *   php translations.php --add-missing            create the keys the code uses
 *   php translations.php --export en [file.json]  one language out
 *   php translations.php --import en file.json    one language in
 *   php translations.php --seed-sql               a migration body for what exists
 *
 * `--status` is safe to run any time and is the one worth wiring into a build.
 */

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/site.php';

const SOURCE_ROOT = __DIR__ . '/../angular/src/app';

/**
 * Namespaces a key may start with. Keeping a list rather than matching any
 * dotted string is what stops import paths and asset filenames being reported
 * as missing translations. Add to it when a new area of the site is
 * translated.
 */
const KEY_NAMESPACES = [
    'common', 'nav', 'footer', 'account', 'theme',
    'login', 'feedback', 'backgrounds', 'changelog', 'notFound', 'quiz', 'database',
];

// ─── Key discovery ────────────────────────────────────────────────────────────

/** Every key the sources ask for, mapped to the files that ask for it. */
function keysUsedInSource(string $root): array
{
    $namespaces = implode('|', array_map('preg_quote', KEY_NAMESPACES));

    // A key is always a whole quoted string. Requiring the quotes is what
    // separates the key 'theme.light' from the property access
    // theme.currentTheme(), and the import './footer.component' from the
    // `footer` namespace - neither of those is a quoted string on its own.
    $pattern = "/['\"](($namespaces)\\.[A-Za-z0-9_]+(?:\\.[A-Za-z0-9_]+)*)['\"]/";

    // Filenames that are quoted strings in their own right, such as a bare
    // 'changelog.json' passed to a fetch.
    $fileExtensions = ['json', 'html', 'scss', 'css', 'ts', 'js', 'avif', 'png', 'svg', 'mp3'];

    $found = [];
    $files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS));

    foreach ($files as $file) {
        if (!in_array($file->getExtension(), ['ts', 'html'], true)) {
            continue;
        }
        // The i18n machinery documents the syntax it implements, and the
        // examples in those comments are not keys anybody defined.
        if (str_contains(str_replace('\\', '/', $file->getPathname()), '/local-lib/i18n/')) {
            continue;
        }

        // Comments explain keys at least as often as they use them.
        $contents = file_get_contents($file->getPathname());
        $contents = preg_replace('#/\*.*?\*/#s', '', $contents);
        $contents = preg_replace('#(^|\s)//[^\n]*#', '', $contents);

        if (!preg_match_all($pattern, $contents, $matches)) {
            continue;
        }
        $relative = str_replace('\\', '/', substr($file->getPathname(), strlen(dirname($root, 3)) + 1));
        foreach (array_unique($matches[1]) as $key) {
            $lastSegment = substr($key, strrpos($key, '.') + 1);
            if (in_array($lastSegment, $fileExtensions, true)) {
                continue;
            }
            $found[$key][] = $relative;
        }
    }

    ksort($found);
    return $found;
}

// ─── Commands ─────────────────────────────────────────────────────────────────

function commandStatus(PDO $pdo): int
{
    $site = currentSite();
    $used = keysUsedInSource(SOURCE_ROOT);

    // Only what this site can actually load: the shared keys and its own.
    // Another site's keys are neither missing nor unused as seen from here.
    $definedStmt = $pdo->prepare("SELECT name FROM translation_keys WHERE site IN ('common', ?)");
    $definedStmt->execute([$site]);
    $defined = $definedStmt->fetchAll(PDO::FETCH_COLUMN);

    $missing  = array_diff(array_keys($used), $defined);
    $unused   = array_diff($defined, array_keys($used));

    colorLine('cyan', "\n── Translation keys ──────────────────────────");
    echo "  site:           $site (plus shared)\n";
    echo '  used in source: ' . count($used) . "\n";
    echo '  visible here:   ' . count($defined) . "\n";

    if ($missing) {
        colorLine('red', "\n  Used but not in the database (these render as the raw key):");
        foreach ($missing as $key) {
            echo "    $key\n";
            foreach (array_unique($used[$key]) as $where) {
                echo "        $where\n";
            }
        }
    }

    if ($unused) {
        colorLine('yellow', "\n  In the database but not used anywhere:");
        foreach ($unused as $key) {
            echo "    $key\n";
        }
        echo "    (harmless, but they are dead weight in the editor)\n";
    }

    // Every key needs the fallback, or it renders as itself in every language.
    $noEnglishStmt = $pdo->prepare(
        "SELECT k.name FROM translation_keys k
         LEFT JOIN translations t ON t.key_name = k.name AND t.language_code = 'en'
         WHERE t.value IS NULL AND k.site IN ('common', ?) ORDER BY k.name"
    );
    $noEnglishStmt->execute([$site]);
    $noEnglish = $noEnglishStmt->fetchAll(PDO::FETCH_COLUMN);

    if ($noEnglish) {
        colorLine('red', "\n  No English value, so nothing to fall back to:");
        foreach ($noEnglish as $key) {
            echo "    $key\n";
        }
    }

    colorLine('cyan', "\n── Coverage ──────────────────────────────────");
    // Against what this site can load, not against every site's keys at once.
    $total = count($defined);
    $stmt  = $pdo->prepare(
        "SELECT l.code, l.name, count(t.key_name) AS translated
         FROM languages l
         LEFT JOIN translations t ON t.language_code = l.code
         LEFT JOIN translation_keys k ON k.name = t.key_name AND k.site IN ('common', ?)
         WHERE t.key_name IS NULL OR k.name IS NOT NULL
         GROUP BY l.code, l.name, l.sort_order ORDER BY l.sort_order"
    );
    $stmt->execute([$site]);
    foreach ($stmt as $row) {
        $percent = $total ? round(100 * $row['translated'] / $total) : 0;
        printf("  %-4s %-12s %3d/%-3d  %d%%\n", $row['code'], $row['name'], $row['translated'], $total, $percent);
    }
    echo "\n";

    if ($missing || $noEnglish) {
        colorLine('red', 'Not clean.');
        return 1;
    }
    colorLine('green', 'Clean.');
    return 0;
}

function commandAddMissing(PDO $pdo): int
{
    $used = keysUsedInSource(SOURCE_ROOT);
    // Every key, not just this site's: a name is globally unique, so a key
    // owned by another site is a name clash rather than something to create.
    $defined = $pdo->query('SELECT name FROM translation_keys')->fetchAll(PDO::FETCH_COLUMN);
    $missing = array_diff(array_keys($used), $defined);

    if (!$missing) {
        colorLine('green', 'Nothing missing.');
        return 0;
    }

    // Shared by default. Most strings are chrome, and a key that should have
    // been scoped to one site is easier to spot than one hidden from the sites
    // that needed it.
    $insert = $pdo->prepare(
        "INSERT INTO translation_keys (name, description, site) VALUES (?, ?, 'common') ON CONFLICT (name) DO NOTHING"
    );
    foreach ($missing as $key) {
        // The file it came from is a better starting note than nothing, and
        // whoever translates it can replace it from the admin panel.
        $insert->execute([$key, 'Used in ' . implode(', ', array_unique($used[$key]))]);
        echo "  + $key\n";
    }

    colorLine('green', count($missing) . ' key(s) created as shared. Add their values in the admin panel, and move any that belong to one site only.');
    return 0;
}

function commandExport(PDO $pdo, string $code, ?string $path): int
{
    $stmt = $pdo->prepare('SELECT key_name, value FROM translations WHERE language_code = ? ORDER BY key_name');
    $stmt->execute([$code]);

    $values = [];
    foreach ($stmt as $row) {
        $values[$row['key_name']] = $row['value'];
    }
    if (!$values) {
        colorLine('red', "Nothing stored for '$code'.");
        return 1;
    }

    $json = json_encode($values, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($path === null) {
        echo $json . "\n";
        return 0;
    }
    file_put_contents($path, $json . "\n");
    colorLine('green', count($values) . " string(s) written to $path");
    return 0;
}

function commandImport(PDO $pdo, string $code, string $path): int
{
    if (!file_exists($path)) {
        colorLine('red', "No such file: $path");
        return 1;
    }
    $values = json_decode(file_get_contents($path), true);
    if (!is_array($values)) {
        colorLine('red', "$path is not a JSON object of key => text.");
        return 1;
    }

    $stmt = $pdo->prepare('SELECT code FROM languages WHERE code = ?');
    $stmt->execute([$code]);
    if (!$stmt->fetch()) {
        colorLine('red', "Unknown language '$code'. Add it in the admin panel first.");
        return 1;
    }

    $defined = $pdo->query('SELECT name FROM translation_keys')->fetchAll(PDO::FETCH_COLUMN);
    $unknown = array_diff(array_keys($values), $defined);
    if ($unknown) {
        colorLine('red', 'The file has keys the site does not know about:');
        foreach ($unknown as $key) {
            echo "    $key\n";
        }
        colorLine('red', 'Run --add-missing if the code uses them, or fix the file.');
        return 1;
    }

    $upsert = $pdo->prepare(
        'INSERT INTO translations (key_name, language_code, value) VALUES (?, ?, ?)
         ON CONFLICT (key_name, language_code) DO UPDATE SET value = EXCLUDED.value'
    );
    foreach ($values as $key => $value) {
        $upsert->execute([$key, $code, (string) $value]);
    }

    colorLine('green', count($values) . " string(s) imported for '$code'.");
    return 0;
}

/**
 * The current contents as a migration body, so what has been edited in the
 * admin panel can be committed rather than living only on one server.
 */
function commandSeedSql(PDO $pdo): int
{
    $quote = fn(string $text): string => str_contains($text, "\n")
        ? "E'" . str_replace(["\\", "'", "\n"], ["\\\\", "''", '\n'], $text) . "'"
        : "'" . str_replace("'", "''", $text) . "'";

    $rows = [];
    foreach ($pdo->query('SELECT name, description FROM translation_keys ORDER BY name') as $row) {
        $rows[] = '    (' . $quote($row['name']) . ', ' . $quote((string) $row['description']) . ')';
    }
    echo "INSERT INTO translation_keys (name, description) VALUES\n" . implode(",\n", $rows) . "\nON CONFLICT (name) DO NOTHING;\n\n";

    foreach ($pdo->query('SELECT code FROM languages ORDER BY sort_order') as $language) {
        $code = $language['code'];
        $stmt = $pdo->prepare('SELECT key_name, value FROM translations WHERE language_code = ? ORDER BY key_name');
        $stmt->execute([$code]);

        $rows = [];
        foreach ($stmt as $row) {
            $rows[] = '    (' . $quote($row['key_name']) . ', ' . $quote($row['value']) . ')';
        }
        if (!$rows) {
            continue;
        }
        echo "INSERT INTO translations (key_name, language_code, value)\n";
        echo "SELECT v.key_name, '$code', v.value FROM (VALUES\n" . implode(",\n", $rows) . "\n";
        echo ") AS v(key_name, value)\nON CONFLICT (key_name, language_code) DO NOTHING;\n\n";
    }
    return 0;
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

function colorLine(string $color, string $text): void
{
    $codes = ['red' => '31', 'green' => '32', 'yellow' => '33', 'cyan' => '36'];
    echo "\033[{$codes[$color]}m{$text}\033[0m\n";
}

$args    = array_slice($argv, 1);
$command = $args[0] ?? '--status';
$pdo     = usersDb();

exit(match ($command) {
    '--status'      => commandStatus($pdo),
    '--add-missing' => commandAddMissing($pdo),
    '--export'      => isset($args[1])
        ? commandExport($pdo, $args[1], $args[2] ?? null)
        : (colorLine('red', 'Usage: --export <code> [file.json]') ?? 1),
    '--import'      => isset($args[1], $args[2])
        ? commandImport($pdo, $args[1], $args[2])
        : (colorLine('red', 'Usage: --import <code> <file.json>') ?? 1),
    '--seed-sql'    => commandSeedSql($pdo),
    default         => (colorLine('red', "Unknown command '$command'. Try --status.") ?? 1),
});
