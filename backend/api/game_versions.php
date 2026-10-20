<?php

/**
 * A row's `version` read the way the pages read it, for an answer that hands
 * it to another program - the catalog (api/catalog.php) - which wants a
 * number it can compare as well as the name a player knows.
 *
 * The pages' rule is frontend sites/main/features/database/shared/
 * database-helpers.ts (versionNumber(), romanToNumber()), ported here letter
 * for letter: the Nod-Krai releases shipped as "Luna" and a Roman numeral
 * rather than 6.x - Luna I is 6.0, Luna II 6.1 - and the numbering resumes at
 * 7.x for Snezhnaya, so "Luna N" is 6.(N-1). Derived, never looked up, as the
 * page derives it: a table would be one release behind the moment the next
 * Luna ships. Only a Roman numeral counts, in any case ("Luna iii" is 6.2) -
 * the page reads no digits there, so neither does this: "Luna 3" is a name
 * without a number, here as on the page. Change one, change the other
 * (tests/catalog-versions.test.php holds this half to the cases the page's
 * file names).
 *
 *   "Luna III"  ->  version "6.2", version_name "Luna III"
 *   "4.2"       ->  version "4.2", version_name null
 *   "Beta"      ->  version null,  version_name "Beta"
 *   ""          ->  version null,  version_name null
 */

/** The era the Luna releases belong to: database-helpers.ts's LUNA_ERA. */
const GAME_VERSION_LUNA_ERA = 6;

/** What a Luna release's name starts with, case and space as the page has them. */
const GAME_VERSION_LUNA_PREFIX = 'Luna ';

/** `IX` -> 9 - the page's romanToNumber(): null for anything that is not Roman numerals. */
function gameVersionRoman(string $roman): ?int
{
    $letters = strtoupper(trim($roman));
    if ($letters === '' || preg_match('/^[IVXLCDM]+$/D', $letters) !== 1) {
        return null;
    }

    $digits = ['I' => 1, 'V' => 5, 'X' => 10, 'L' => 50, 'C' => 100, 'D' => 500, 'M' => 1000];
    $total = 0;
    for ($i = 0, $length = strlen($letters); $i < $length; $i++) {
        $current = $digits[$letters[$i]];
        $next = $i + 1 < $length ? $digits[$letters[$i + 1]] : null;
        // A smaller digit before a larger one is taken off it (IV, IX), as the page does.
        $total += $next !== null && $next > $current ? -$current : $current;
    }

    return $total;
}

/**
 * A version as two parts: the number to compare ("6.2", "4.2") and the name
 * the game gave it ("Luna III"), each null where there is none. A plain
 * MAJOR.MINOR is the number alone; a Luna release both; anything else - a
 * name the page cannot number either - the text alone, as it was written
 * (its surrounding blanks aside).
 *
 * @return array{version: ?string, version_name: ?string}
 */
function gameVersionParts(string $version): array
{
    $text = trim($version);
    if ($text === '') {
        return ['version' => null, 'version_name' => null];
    }

    if (str_starts_with($text, GAME_VERSION_LUNA_PREFIX)) {
        $luna = gameVersionRoman(substr($text, strlen(GAME_VERSION_LUNA_PREFIX)));
        if ($luna !== null && $luna >= 1) {
            return ['version' => GAME_VERSION_LUNA_ERA . '.' . ($luna - 1), 'version_name' => $text];
        }
    }

    if (preg_match('/^\d+\.\d+$/D', $text) === 1) {
        return ['version' => $text, 'version_name' => null];
    }

    return ['version' => null, 'version_name' => $text];
}
