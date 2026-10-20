<?php

declare(strict_types=1);

/**
 * A version read the way the pages read it (api/game_versions.php, the PHP
 * half of frontend sites/main/features/database/shared/database-helpers.ts's
 * versionNumber()): the cases that file names - Luna I is 6.0, `IX` -> 9,
 * `Luna III` -> `6.2`, a numbered version left alone, "1.10" no number to
 * round - and the edges its code decides (a Roman numeral in any case, the
 * blanks around it, no digits after "Luna", the prefix's own case). No
 * database: the file needs nothing else.
 *
 * And a tripwire: the page's file still says what this port copied - the
 * era, the prefix, the letters - so a change to one half fails here until
 * the other follows.
 */

require __DIR__ . '/lib.php';
require TEST_BACKEND . '/api/game_versions.php';

/** One case: what gameVersionParts() answers, as [version, version_name]. */
function parts(string $version): array
{
    $parts = gameVersionParts($version);

    return [$parts['version'], $parts['version_name']];
}

echo "Roman numerals, as the page's romanToNumber() reads them\n";

same('IX -> 9 (the page\'s own example)', 9, gameVersionRoman('IX'));
same('I, IV, VIII, X, XIV, XL', [1, 4, 8, 10, 14, 40], array_map('gameVersionRoman', ['I', 'IV', 'VIII', 'X', 'XIV', 'XL']));
same('any case, the blanks around it taken off', [3, 4], [gameVersionRoman(' iii '), gameVersionRoman('Iv')]);
same('a smaller digit before a larger one is taken off it, however it is written (the page does not check the form)', [4, 99], [gameVersionRoman('IIII'), gameVersionRoman('IC')]);
same('no letters, digits, other letters: no number', [null, null, null, null], array_map('gameVersionRoman', ['', '3', 'IIIa', 'I I']));

echo "A Luna release: version 6.(N-1), its name beside it\n";

same('Luna I is 6.0 (the page\'s own words)', ['6.0', 'Luna I'], parts('Luna I'));
same('Luna II is 6.1', ['6.1', 'Luna II'], parts('Luna II'));
same('Luna III -> 6.2 (the page\'s own example)', ['6.2', 'Luna III'], parts('Luna III'));
same('Luna VIII -> 6.7, the last on the live site', ['6.7', 'Luna VIII'], parts('Luna VIII'));
same('Luna IX -> 6.8 - derived, never looked up', ['6.8', 'Luna IX'], parts('Luna IX'));
same('Luna XI -> 6.10: the minor counts on, as on the page', ['6.10', 'Luna XI'], parts('Luna XI'));
same('the numeral in any case', ['6.2', 'Luna iii'], parts('Luna iii'));
same('blanks around the whole taken off, inside it kept', [['6.2', 'Luna III'], ['6.2', 'Luna  III']], [parts('  Luna III  '), parts('Luna  III')]);

echo "What the page cannot number: no version, the text as it is\n";

same('digits after "Luna" - the page reads none there', [null, 'Luna 3'], parts('Luna 3'));
same('"Luna" alone, or with a blank', [[null, 'Luna'], [null, 'Luna']], [parts('Luna'), parts('Luna ')]);
same('the prefix in another case - the page\'s startsWith() is exact', [[null, 'luna III'], [null, 'LUNA III']], [parts('luna III'), parts('LUNA III')]);
same('more after the numeral', [null, 'Luna III.'], parts('Luna III.'));
same('a name of its own', [null, 'Beta'], parts('Beta'));
same('a number that is not MAJOR.MINOR', [[null, '4'], [null, '1.0.1'], [null, 'v4.2']], [parts('4'), parts('1.0.1'), parts('v4.2')]);

echo "A plain version: the number alone\n";

same('a numbered version is left alone (the page\'s own words)', ['4.2', null], parts('4.2'));
same('"1.10" stays 1.10 - no rounding into 1.1', ['1.10', null], parts('1.10'));
same('1.0, and 7.1 after the Luna era', [['1.0', null], ['7.1', null]], [parts('1.0'), parts('7.1')]);
same('blanks around it taken off', ['1.0', null], parts(' 1.0 '));
same('nothing at all: neither', [[null, null], [null, null]], [parts(''), parts('   ')]);

echo "The page's half still says what this one copied\n";

$page = (string) file_get_contents(dirname(TEST_BACKEND) . '/frontend/src/app/sites/main/features/database/shared/database-helpers.ts');
check('the era: LUNA_ERA = 6', str_contains($page, 'const LUNA_ERA = ' . GAME_VERSION_LUNA_ERA . ';'));
check('the prefix: LUNA_PREFIX = \'Luna \'', str_contains($page, "const LUNA_PREFIX = '" . GAME_VERSION_LUNA_PREFIX . "';"));
check('the letters: /^[IVXLCDM]+$/ after trim() and toUpperCase()', str_contains($page, '/^[IVXLCDM]+$/') && str_contains($page, 'roman.trim().toUpperCase()'));
check('Luna N is the era and N - 1', str_contains($page, '`${LUNA_ERA}.${luna - 1}`'));
