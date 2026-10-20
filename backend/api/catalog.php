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
            'SELECT game_id, name, element, weapon_type, rarity, region, version, release_date, is_traveler, icon_file_id
               FROM characters
              WHERE deleted = FALSE
              ORDER BY name COLLATE "C", id',
        )
        ->fetchAll(PDO::FETCH_ASSOC);
    resolveAssetRows($pdo, 'characters', $rows);

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
            'SELECT game_id, name, type, rarity, version, release_date, icon_file_id
               FROM weapons
              WHERE deleted = FALSE
              ORDER BY name COLLATE "C", id',
        )
        ->fetchAll(PDO::FETCH_ASSOC);
    resolveAssetRows($pdo, 'weapons', $rows);

    return array_map(
        static fn(array $row): array => [
            'game_id' => catalogInt($row['game_id']),
            'name' => (string) $row['name'],
            'type' => (string) $row['type'],
            'rarity' => (int) $row['rarity'],
            ...catalogVersion($row['version']),
            'release_date' => catalogText($row['release_date']),
            'icon' => catalogIconUrl($origin, $row['icon'] ?? null),
        ],
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
