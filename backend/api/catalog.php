<?php

/**
 * The game catalog, for another program to read: every live character,
 * weapon and artifact set, each with the game's own id (`game_id`,
 * genshin_impact/030).
 *
 * Written 2026-10-20, at the owner's word, for another of the owner's sites,
 * the build analyzer (builder.anotoki.eu), which takes its catalog from here: it
 * matches what a player imports by these ids and what a build names by the
 * names. It reads them server to server - no browser asks - so the API still
 * sends no CORS header (api/index.php). The routes are
 * routes/genshin_impact/endpoints/catalog.php, the shapes
 * routes/genshin_impact/responses/catalog.php.
 *
 * What goes out is chosen here column by column, never a row as it is: no
 * editor's fields (who made or changed a row, and when), no `deleted` - a
 * deleted row is left out, unlike the older public lists (SEC-12) - and no
 * ids of this database's own. Each list goes by name, byte by byte (COLLATE
 * "C": the same order on every server, whatever its own collation), then by
 * id. A version goes out as the pages read it (api/game_versions.php), an
 * icon as an address another site can load.
 */

use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * The address the icons are built on: the request's own host, from its Host
 * header (which Slim reads into the request's URI). Over https - but http for
 * a loopback host, its port kept: development, where ng serve on 4200 keeps
 * the Host header and serves assets/ too. Another host gets no port: the site
 * answers on https's own, and a port its URI holds there is likelier the one a
 * proxy reached PHP on than one anybody asked for - Slim's Host header keeps
 * none, and its URI takes SERVER_PORT when the header names none. (The
 * server's own copy of the header is not read: nothing under api/ reads the
 * server's params itself, tests/addresses.test.php.) Null when the host is no
 * host name, IPv4 address or bracketed IPv6 address: nothing could be
 * addressed on it.
 */
function catalogOrigin(Request $request): ?string
{
    $uri = $request->getUri();
    $host = strtolower($uri->getHost());
    $label = '[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?';
    if (preg_match('/^' . $label . '(?:\.' . $label . ')*$/D', $host) !== 1 && preg_match('/^\[[0-9a-f:.]+\]$/D', $host) !== 1) {
        return null;
    }

    if ($host === 'localhost' || $host === '[::1]' || preg_match('/^127(?:\.\d{1,3}){3}$/D', $host) === 1) {
        $port = $uri->getPort();

        return 'http://' . $host . ($port === null || $port === 80 ? '' : ':' . $port);
    }

    return 'https://' . $host;
}

/**
 * An icon's address: resolveAssetRows() gives the file as a path from the
 * pages, `../assets/<folder>/<file>`, and the asset tree is served at
 * /assets/ beside the site (the switch's .htaccess on the host, ng serve in
 * development). Each part of the path is encoded on its own - a file is
 * called "Adventurer's Bandana.avif" as often as "HU_TAO.avif".
 */
function catalogIconUrl(string $origin, mixed $path): ?string
{
    if (!is_string($path) || !str_starts_with($path, '../assets/')) {
        return null;
    }

    return $origin . '/' . implode('/', array_map('rawurlencode', explode('/', substr($path, strlen('../')))));
}

/** A column PostgreSQL may hand back as a bool or as 't' / 'f', as a bool. */
function catalogBool(mixed $value): bool
{
    return $value === true || $value === 't' || $value === 1 || $value === '1';
}

/** A nullable whole number. */
function catalogInt(mixed $value): ?int
{
    return $value === null ? null : (int) $value;
}

/** A nullable text. */
function catalogText(mixed $value): ?string
{
    return $value === null ? null : (string) $value;
}

/** A version as its two parts (api/game_versions.php); none for none. */
function catalogVersion(mixed $value): array
{
    return gameVersionParts($value === null ? '' : (string) $value);
}

/** A number of the ascension tables (REAL columns), as the site typed it: two decimals at most. */
function catalogNumber(mixed $value): float
{
    return round((float) $value, 2);
}

/**
 * The base stats behind the stat targets the build analyzer works out (2026-10-26,
 * at the owner's word): per ascension set, the character's HP, ATK and DEF at
 * level 1 (phase 0's start) and at level 80 once ascended (phase 6's start),
 * and the stat the ascensions raise with its whole value (phase 6's). The level
 * 90 value is the reader's to work out from these with the game's growth
 * curve: the phases' end values are not it. A set without both phases has
 * none.
 *
 * @return array<int, array<string, mixed>> set id => stats
 */
function catalogCharacterStats(PDO $pdo): array
{
    $phases = [];
    foreach ($pdo->query('SELECT ascension_set_id, phase, primary_stat, primary_stat_value, start_level_hp, start_level_atk, start_level_def, end_level_hp, end_level_atk, end_level_def FROM characters_ascensions WHERE deleted = FALSE AND phase BETWEEN 0 AND 6 ORDER BY ascension_set_id, phase, id') as $row) {
        $phases[(int) $row['ascension_set_id']][(int) $row['phase']] ??= $row;
    }

    $stats = [];
    foreach ($phases as $set => $byPhase) {
        if (!isset($byPhase[0], $byPhase[6])) {
            continue;
        }
        $start = static fn(array $row): array => ['hp' => catalogNumber($row['start_level_hp']), 'atk' => catalogNumber($row['start_level_atk']), 'def' => catalogNumber($row['start_level_def'])];
        $end = static fn(array $row): array => ['hp' => catalogNumber($row['end_level_hp']), 'atk' => catalogNumber($row['end_level_atk']), 'def' => catalogNumber($row['end_level_def'])];
        // Every phase there is, in order: the stats at its first level (ascended) and at its last (before the next
        // ascension), and the ascension stat's value through it. The reader works a level inside a phase out from
        // these - and phase 6's last level, 90, from the growth curve, since that end value is not it.
        $list = [];
        foreach ($byPhase as $phase => $row) {
            $list[] = ['phase' => $phase, 'start' => $start($row), 'end' => $end($row), 'ascension' => catalogNumber($row['primary_stat_value'])];
        }
        $stats[$set] = [
            'base' => $start($byPhase[0]),
            'lv80' => $start($byPhase[6]),
            'ascension' => ['stat' => (string) $byPhase[6]['primary_stat'], 'value' => catalogNumber($byPhase[6]['primary_stat_value'])],
            'phases' => $list,
        ];
    }

    return $stats;
}

/**
 * The same for weapons: per weapon, its base ATK at level 1 (phase 0) and at
 * level 80 once ascended (phase 6's start - the level 90 value is the reader's
 * to work out), and its secondary stat's value at level 1. The stat's label is
 * the weapon row's (`weapons.secondary_stat`); a weapon without both phases
 * has none of this.
 *
 * @return array<int, array<string, float>> weapon id => base_atk, lv80_atk, secondary_value
 */
function catalogWeaponStats(PDO $pdo): array
{
    $phases = [];
    foreach ($pdo->query('SELECT weapon_id, phase, primary_stat_value, secondary_stat_value FROM weapons_ascensions WHERE deleted = FALSE AND phase BETWEEN 0 AND 6 ORDER BY weapon_id, phase, id') as $row) {
        $phases[(int) $row['weapon_id']][(int) $row['phase']] ??= $row;
    }

    $stats = [];
    foreach ($phases as $weapon => $byPhase) {
        if (!isset($byPhase[0], $byPhase[6])) {
            continue;
        }
        // Every phase there is, in order: the base ATK and the secondary stat at its first level (ascended).
        $list = [];
        foreach ($byPhase as $phase => $row) {
            $list[] = ['phase' => $phase, 'atk' => catalogNumber($row['primary_stat_value']), 'secondary' => catalogNumber($row['secondary_stat_value'])];
        }
        $stats[$weapon] = [
            'base_atk' => catalogNumber($byPhase[0]['primary_stat_value']),
            'lv80_atk' => catalogNumber($byPhase[6]['primary_stat_value']),
            'secondary_value' => catalogNumber($byPhase[0]['secondary_stat_value']),
            'phases' => $list,
        ];
    }

    return $stats;
}

/**
 * Every live character. The Travelers are rows like any other - a row per
 * element, each named Aether or Lumine, every one of a Traveler with the same
 * `game_id` - told apart by `is_traveler` and their element.
 *
 * @return list<array<string, mixed>>
 */
function catalogCharacters(PDO $pdo, string $origin): array
{
    $rows = $pdo
        ->query(
            'SELECT game_id, name, element, weapon_type, rarity, region, version, release_date, is_traveler, icon_file_id, ascension_set_id
               FROM characters
              WHERE deleted = FALSE
              ORDER BY name COLLATE "C", id',
        )
        ->fetchAll(PDO::FETCH_ASSOC);
    resolveAssetRows($pdo, 'characters', $rows);
    $stats = catalogCharacterStats($pdo);

    return array_map(
        static fn(array $row): array => [
            'game_id' => catalogInt($row['game_id']),
            'name' => (string) $row['name'],
            'element' => (string) $row['element'],
            'weapon_type' => (string) $row['weapon_type'],
            'rarity' => (int) $row['rarity'],
            'region' => catalogText($row['region']),
            ...catalogVersion($row['version']),
            'release_date' => catalogText($row['release_date']),
            'is_traveler' => catalogBool($row['is_traveler']),
            'icon' => catalogIconUrl($origin, $row['icon'] ?? null),
            'stats' => $row['ascension_set_id'] === null ? null : ($stats[(int) $row['ascension_set_id']] ?? null),
        ],
        $rows,
    );
}

/**
 * Every live weapon.
 *
 * @return list<array<string, mixed>>
 */
function catalogWeapons(PDO $pdo, string $origin): array
{
    $rows = $pdo
        ->query(
            'SELECT id, game_id, name, type, rarity, version, release_date, icon_file_id, secondary_stat
               FROM weapons
              WHERE deleted = FALSE
              ORDER BY name COLLATE "C", id',
        )
        ->fetchAll(PDO::FETCH_ASSOC);
    resolveAssetRows($pdo, 'weapons', $rows);
    $stats = catalogWeaponStats($pdo);

    return array_map(
        static function (array $row) use ($origin, $stats): array {
            $own = $stats[(int) $row['id']] ?? null;
            $label = catalogText($row['secondary_stat']);

            return [
                'game_id' => catalogInt($row['game_id']),
                'name' => (string) $row['name'],
                'type' => (string) $row['type'],
                'rarity' => (int) $row['rarity'],
                ...catalogVersion($row['version']),
                'release_date' => catalogText($row['release_date']),
                'icon' => catalogIconUrl($origin, $row['icon'] ?? null),
                'stats' => $own === null ? null : [
                    'base_atk' => $own['base_atk'],
                    'lv80_atk' => $own['lv80_atk'],
                    // No label, or nought at level 1: the weapon has no secondary stat (the 1- and 2-star ones).
                    'secondary' => $label === null || $own['secondary_value'] <= 0 ? null : ['stat' => $label, 'value' => $own['secondary_value']],
                    'phases' => $own['phases'],
                ],
            ];
        },
        $rows,
    );
}

/**
 * Every live artifact set, with the rarities it drops at, lowest first.
 *
 * @return list<array<string, mixed>>
 */
function catalogArtifacts(PDO $pdo, string $origin): array
{
    $rows = $pdo
        ->query(
            'SELECT game_id, name, two_piece, four_piece, has_rarity_1, has_rarity_2, has_rarity_3, has_rarity_4, has_rarity_5, version, icon_file_id
               FROM artifacts
              WHERE deleted = FALSE
              ORDER BY name COLLATE "C", id',
        )
        ->fetchAll(PDO::FETCH_ASSOC);
    resolveAssetRows($pdo, 'artifacts', $rows);

    return array_map(
        static fn(array $row): array => [
            'game_id' => catalogInt($row['game_id']),
            'name' => (string) $row['name'],
            'two_piece' => catalogText($row['two_piece']),
            'four_piece' => catalogText($row['four_piece']),
            'rarities' => array_values(array_filter([1, 2, 3, 4, 5], static fn(int $rarity): bool => catalogBool($row["has_rarity_$rarity"]))),
            ...catalogVersion($row['version']),
            'icon' => catalogIconUrl($origin, $row['icon'] ?? null),
        ],
        $rows,
    );
}
