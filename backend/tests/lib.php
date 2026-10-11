<?php

declare(strict_types=1);

/**
 * What every test file loads first: check() and same(), temporary folders that
 * go when the file ends, and the tally tests/run.php reads.
 *
 * A test that needs no database and no server loads the code it tests and
 * nothing else, so nothing can reach your database, your settings or the
 * asset tree. Those that need a database (the words' migration and routes,
 * the library's data moves, admin tools and gates, migration.php) load
 * tests/db_lib.php beside this, which makes databases of their own and a
 * backend of its own to run the API in - never yours.
 */

define('TEST_BACKEND', dirname(__DIR__));

$GLOBALS['TEST_TALLY'] = ['pass' => 0, 'fail' => 0];
$GLOBALS['TEST_TEMP'] = [];
// What must be undone when the file ends, whatever happened - before the
// folders go and the tally is printed (a failed check ends the file there).
$GLOBALS['TEST_CLEANUP'] = [];

// What the code under test logs (a refusal it explains with error_log()) goes
// to a file of its own, so the output is the checks and nothing else.
$GLOBALS['TEST_LOG'] = tempnam(sys_get_temp_dir(), 'genshin-test-log-');
ini_set('error_log', $GLOBALS['TEST_LOG']);

/** One line in the output: `ok` or `FAIL`, and why. */
function check(string $what, bool $ok, string $detail = ''): void
{
    $GLOBALS['TEST_TALLY'][$ok ? 'pass' : 'fail']++;
    echo ($ok ? '  ok   ' : '  FAIL ') . $what . (!$ok && $detail !== '' ? " - $detail" : '') . "\n";
}

function same(string $what, mixed $expected, mixed $actual): void
{
    check($what, $expected === $actual, 'expected ' . var_export($expected, true) . ', got ' . var_export($actual, true));
}

/**
 * A folder of the test's own under the system's temporary one, by its full
 * name (realpath: no 8.3 short names on Windows), removed when the file ends.
 */
function testTempDir(string $label): string
{
    $base = (string) realpath(sys_get_temp_dir());
    $dir = str_replace('\\', '/', $base) . "/genshin-test-$label-" . getmypid() . '-' . bin2hex(random_bytes(3));
    mkdir($dir, 0777, true);
    $GLOBALS['TEST_TEMP'][] = $dir;

    return $dir;
}

/**
 * A link to a folder, for the checks that a link out of the tree is refused:
 * a symbolic link, or on Windows - where those need a privilege - a junction.
 * False when this computer can make neither; those checks then say so.
 */
function testLinkDir(string $target, string $link): bool
{
    if (@symlink($target, $link)) {
        return true;
    }
    if (PHP_OS_FAMILY !== 'Windows') {
        return false;
    }
    exec('cmd /c mklink /J ' . escapeshellarg(str_replace('/', '\\', $link)) . ' ' . escapeshellarg(str_replace('/', '\\', $target)) . ' 2>NUL', $output, $code);

    return $code === 0 && is_dir($link);
}

/** Removes a folder and what is in it; a link (or a junction) is removed, never followed. */
function testRemove(string $path): void
{
    $resolved = realpath($path);
    $isLink = is_link($path) || ($resolved !== false && str_replace('\\', '/', $resolved) !== str_replace('\\', '/', $path));
    if ($isLink) {
        @rmdir($path) || @unlink($path);
        return;
    }
    if (is_dir($path)) {
        foreach (scandir($path) ?: [] as $entry) {
            if ($entry !== '.' && $entry !== '..') {
                testRemove("$path/$entry");
            }
        }
        @rmdir($path);
    } elseif (file_exists($path)) {
        @unlink($path);
    }
}

register_shutdown_function(static function (): void {
    foreach (array_reverse($GLOBALS['TEST_CLEANUP']) as $cleanup) {
        try {
            $cleanup();
        } catch (\Throwable $e) {
            echo '  (cleaning up: ' . $e->getMessage() . ")\n";
        }
    }
    foreach ($GLOBALS['TEST_TEMP'] as $dir) {
        testRemove($dir);
    }
    @unlink($GLOBALS['TEST_LOG']);
    echo '##genshin ' . json_encode($GLOBALS['TEST_TALLY']) . "\n";
    if ($GLOBALS['TEST_TALLY']['fail'] > 0) {
        exit(1);
    }
});
