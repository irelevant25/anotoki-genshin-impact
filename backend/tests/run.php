<?php

declare(strict_types=1);

/**
 * Runs the backend's tests: every tests/*.test.php, each in a PHP process of
 * its own, under the PHP that runs this.
 *
 *   php tests/run.php                        every file
 *   php tests/run.php tests/uploads.test.php some of them
 *
 * They need no database, no server and no config/*.local.php (tests/lib.php):
 * what they cover is code that decides on its own - the upload rules so far.
 * The rest of the API is checked by hand (DEV.md, Checking your work).
 */

$root = dirname(__DIR__);
$files = array_slice($argv, 1) ?: (glob("$root/tests/*.test.php") ?: []);
$started = microtime(true);
echo 'PHP ' . PHP_VERSION . "\n";

$pass = $fail = 0;
foreach ($files as $file) {
    $relative = str_replace('\\', '/', substr((string) (realpath($file) ?: $file), strlen((string) realpath($root)) + 1));
    echo "> $relative\n";

    $output = [];
    exec(escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($file) . ' 2>&1', $output, $code);
    $output = implode("\n", $output) . "\n";

    // The file's own tally, which tests/lib.php prints last.
    if (preg_match('/^##genshin (.+)$/m', $output, $m)) {
        $counts = json_decode($m[1], true);
        $pass += (int) $counts['pass'];
        $fail += (int) $counts['fail'];
        $output = str_replace($m[0] . "\n", '', $output);
    } else {
        $fail++;
        $output .= "  FAIL the file did not finish\n";
    }
    echo $output;
}

printf("tests %d, pass %d, fail %d, %d ms\n", $pass + $fail, $pass, $fail, round((microtime(true) - $started) * 1000));
exit($fail ? 1 : 0);
