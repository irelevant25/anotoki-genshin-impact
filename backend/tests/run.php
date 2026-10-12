<?php

declare(strict_types=1);

/**
 * Runs the backend's tests: every tests/*.test.php, each in a PHP process of
 * its own, under the PHP that runs this.
 *
 *   php tests/run.php                        every file
 *   php tests/run.php tests/uploads.test.php some of them
 *
 * The upload rules need nothing (tests/lib.php). The rest - the words'
 * migration and routes, the anotoki library's admin tools, people and sign-in
 * (anotoki-lib 0.5.0: the data moves of users/052, 054 and genshin_impact/
 * 028-029, every admin route's permissions, the gates, a restore doing again
 * what was deleted since its backup, the pages' error reports), where a
 * request comes from and what is kept of it (the Cloudflare rule, keyed
 * hashes only), what a silent sign-in brings in (the visitor's move, the
 * browser's games' carry), the command line - make
 * genshin_test_* databases of their own on the PostgreSQL server
 * config/database.local.php names, never its database, and run the API in a
 * backend copy of their own (tests/db_lib.php). Without that file they say
 * they are skipped. The rest of the API is checked by hand (DEV.md, Checking
 * your work). Run them on PHP 8.2 too: the hosts run 8.2 and up.
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
