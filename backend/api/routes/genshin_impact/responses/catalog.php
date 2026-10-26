<?php

/**
 * What the catalog's routes answer with (routes/genshin_impact/endpoints/
 * catalog.php, api/catalog.php): every live row of one list, each with the
 * game's own id - the build analyzer's catalog. Bare lists: no editor's
 * fields, no deleted rows, no ids of this database's own.
 */

/** `GET /api/catalog/characters` - one live character. */
class CatalogCharacter extends ResponseShape
{
    public function __construct(
        /** The game's own id, null until somebody knows it. Every row of one Traveler carries it: Aether 10000005, Lumine 10000007, a row per element. */
        public readonly ?int $game_id,
        public readonly string $name,
        /** As this site stores it: Anemo, Cryo, Dendro, Electro, Geo, Hydro, Pyro - or Adaptive, for a character whose element the player chooses. */
        public readonly string $element,
        /** Sword, Claymore, Polearm, Bow or Catalyst. */
        public readonly string $weapon_type,
        public readonly int $rarity,
        public readonly ?string $region,
        /** The version to compare, MAJOR.MINOR: "1.3", a Luna release as its number ("Luna III" is "6.2"). Null where the site's text is no version. */
        public readonly ?string $version,
        /** The version's name where it has one ("Luna III"), or the site's text where that is no version; null for a plain number. */
        public readonly ?string $version_name,
        /** YYYY-MM-DD. */
        public readonly ?string $release_date,
        /** A Traveler's row: one per element, named Aether or Lumine. */
        public readonly bool $is_traveler,
        /** The icon's absolute address, on the host the request was made to (https; http on a loopback host). */
        public readonly ?string $icon,
        /** The base stats behind the targets the analyzer works out; null for a character without both ascension phases. */
        public readonly ?CatalogCharacterStats $stats,
    ) {}
}

/** A character's HP, ATK and DEF at one level, as its ascension phases hold them. */
class CatalogBaseStats extends ResponseShape
{
    public function __construct(
        public readonly float $hp,
        public readonly float $atk,
        public readonly float $def,
    ) {}
}

/** The stat a character's ascensions raise, under the label this site stores ("Crit DMG %"), with its whole value once every ascension is done. */
class CatalogAscensionStat extends ResponseShape
{
    public function __construct(
        public readonly string $stat,
        public readonly float $value,
    ) {}
}

/** A character's base stats: at level 1, at level 80 once ascended (the last phase's start - level 90 is the reader's to work out with the game's growth curve), and the ascension stat. */
class CatalogCharacterStats extends ResponseShape
{
    public function __construct(
        public readonly CatalogBaseStats $base,
        public readonly CatalogBaseStats $lv80,
        public readonly CatalogAscensionStat $ascension,
    ) {}
}

/** A weapon's secondary stat at level 1, under the label this site stores ("Crit DMG %"). */
class CatalogWeaponSecondary extends ResponseShape
{
    public function __construct(
        public readonly string $stat,
        public readonly float $value,
    ) {}
}

/** A weapon's base ATK at level 1 and at level 80 once ascended (level 90 is the reader's to work out), and its secondary stat - null for a weapon without one. */
class CatalogWeaponStats extends ResponseShape
{
    public function __construct(
        public readonly float $base_atk,
        public readonly float $lv80_atk,
        public readonly ?CatalogWeaponSecondary $secondary,
    ) {}
}

/** `GET /api/catalog/weapons` - one live weapon. */
class CatalogWeapon extends ResponseShape
{
    public function __construct(
        /** The game's own id, null until somebody knows it. */
        public readonly ?int $game_id,
        public readonly string $name,
        /** Sword, Claymore, Polearm, Bow or Catalyst. */
        public readonly string $type,
        public readonly int $rarity,
        /** The version to compare, MAJOR.MINOR: "1.3", a Luna release as its number ("Luna III" is "6.2"). Null where the site's text is no version. */
        public readonly ?string $version,
        /** The version's name where it has one ("Luna III"), or the site's text where that is no version; null for a plain number. */
        public readonly ?string $version_name,
        /** YYYY-MM-DD. */
        public readonly ?string $release_date,
        /** The icon's absolute address, on the host the request was made to (https; http on a loopback host). */
        public readonly ?string $icon,
        /** The base stats behind the targets the analyzer works out; null for a weapon without both ascension phases. */
        public readonly ?CatalogWeaponStats $stats,
    ) {}
}

/** `GET /api/catalog/artifacts` - one live artifact set. */
class CatalogArtifact extends ResponseShape
{
    public function __construct(
        /** The game's own id for the set, null until somebody knows it. */
        public readonly ?int $game_id,
        public readonly string $name,
        /** The 2-piece bonus, as the site words it. */
        public readonly ?string $two_piece,
        /** The 4-piece bonus, as the site words it. */
        public readonly ?string $four_piece,
        /** @var int[] The rarities the set drops at, lowest first: [4, 5]. */
        public readonly array $rarities,
        /** The version to compare, MAJOR.MINOR: "1.3", a Luna release as its number ("Luna III" is "6.2"). Null where the site's text is no version. */
        public readonly ?string $version,
        /** The version's name where it has one ("Luna III"), or the site's text where that is no version; null for a plain number. */
        public readonly ?string $version_name,
        /** The icon's absolute address, on the host the request was made to (https; http on a loopback host). */
        public readonly ?string $icon,
    ) {}
}
