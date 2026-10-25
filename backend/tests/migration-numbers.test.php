<?php

declare(strict_types=1);

/**
 * No two migrations of a set share a number.
 *
 * The engine (anotoki-lib's Migrator) records a file by its whole name, so two
 * files numbered alike both run, in the order of their names - but "the next
 * free number" stops meaning anything, and a later migration can be written
 * against the wrong one. It happened once: users/064 was taken on 2026-10-22
 * by two sessions working from different copies of the site (the account
 * panel's date and clock words gone, and the Profile's new look's words); each
 * saw 064 free. The later became users/065 on 2026-10-25, its record on the
 * host renamed with it by hand - a file renamed without its record is a new
 * file to the engine, and would run again. Any pair fails here before it is
 * pushed.
 */

require __DIR__ . '/lib.php';

echo "Every migration's number is its own\n";

foreach (glob(TEST_BACKEND . '/migrations/*', GLOB_ONLYDIR) ?: [] as $folder) {
    $set = basename($folder);
    $byNumber = [];
    foreach (glob("$folder/*.sql") ?: [] as $file) {
        if (preg_match('/^(\d+)_/', basename($file), $m) === 1) {
            $byNumber[$m[1]][] = basename($file);
        }
    }
    $twice = array_map('strval', array_keys(array_filter($byNumber, fn(array $files) => count($files) > 1)));
    sort($twice);
    same("$set: no number taken by two files", [], $twice);
}
