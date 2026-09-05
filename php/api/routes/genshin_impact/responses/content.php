<?php

/**
 * The composite `/full` responses, feedback, and where a material is spent.
 *
 * A `/full` read is one parent row and its children in a single reply. The
 * parts are the models the same endpoints write, so a column added to a model
 * turns up here without this file being touched - only the nesting is declared.
 */

// ── /full ─────────────────────────────────────────────────────────────────────

/**
 * `GET /api/characters/{id}/full`
 *
 * The odd one out: characters predate registerFullResource(), so their costs
 * come back flat rather than nested under the phase or level they belong to.
 * The write side nests ascension costs and spells the talent costs
 * `talent_costs`, which is why the form rebuilds the body rather than putting
 * back what it was given.
 */
class CharacterFull extends ResponseShape
{
    public function __construct(
        /** @var Character */
        public readonly object $character,
        /** @var CharacterVoiceOver[] */
        public readonly array $voice_overs,
        /** @var CharacterConstellation[] */
        public readonly array $constellations,
        /** @var CharacterAscension[] */
        public readonly array $ascensions,
        /** @var CharacterAscensionCost[] */
        public readonly array $ascension_cost,
        /** @var CharacterTalent[] */
        public readonly array $talents,
        /** @var CharacterTalentCost[] */
        public readonly array $talent_cost,
        /** @var CharacterRelationship[] */
        public readonly array $relationships,
        /** @var string[] */
        public readonly array $roles,
    ) {
    }
}

/**
 * One ascension phase, with the materials it costs.
 *
 * registerFullResource() merges a child's own children in beside its columns
 * rather than nesting them under a key, so this is a WeaponAscension with one
 * more field - which is what `@merges` says.
 *
 * @merges WeaponAscension
 */
class WeaponAscensionFull extends ResponseShape
{
    public function __construct(
        /** @var WeaponAscensionCost[] */
        public readonly array $costs,
    ) {
    }
}

class WeaponFull extends ResponseShape
{
    public function __construct(
        /** @var Weapon */
        public readonly object $weapon,
        /** @var WeaponRefinement[] */
        public readonly array $refinements,
        /** @var WeaponAscensionFull[] */
        public readonly array $ascensions,
    ) {
    }
}

class ArtifactFull extends ResponseShape
{
    public function __construct(
        /** @var Artifact */
        public readonly object $artifact,
        /** @var ArtifactPiece[] */
        public readonly array $pieces,
    ) {
    }
}

class MaterialFull extends ResponseShape
{
    public function __construct(
        /** @var Material */
        public readonly object $material,
        /** @var MaterialGroupJoin[] */
        public readonly array $groups,
    ) {
    }
}

class FoodFull extends ResponseShape
{
    public function __construct(
        /** @var Food */
        public readonly object $food,
        /** @var FoodRecipe[] */
        public readonly array $recipe,
    ) {
    }
}

/**
 * One phase, with the elements it takes damage from merged in beside its own
 * columns.
 *
 * @merges EnemyPhase
 */
class EnemyPhaseFull extends ResponseShape
{
    public function __construct(
        /** @var EnemyDamageTypeElement[] */
        public readonly array $damage_type_elements,
    ) {
    }
}

class EnemyFull extends ResponseShape
{
    public function __construct(
        /** @var Enemy */
        public readonly object $enemy,
        /** @var EnemyPhaseFull[] */
        public readonly array $phases,
        /** @var EnemyDrop[] */
        public readonly array $drops,
    ) {
    }
}

class BannerFull extends ResponseShape
{
    public function __construct(
        /** @var Banner */
        public readonly object $banner,
        /** @var BannerCharacter[] */
        public readonly array $characters,
        /** @var BannerWeapon[] */
        public readonly array $weapons,
    ) {
    }
}

// ── /full, listed ─────────────────────────────────────────────────────────────
//
// `GET /api/{entity}/full` is not a list of the shapes above. Reading one
// resource nests the parent under its own key; listing them spreads the
// parent's columns at the top level and hangs the children off the same object.
// So these are the row, with the children merged in - which `@merges <table>`
// says, naming the table because what is spread is the row and not the model.

/** @merges weapons */
class WeaponFullRow extends ResponseShape
{
    public function __construct(
        /** @var WeaponRefinement[] */
        public readonly array $refinements,
        /** @var WeaponAscensionFull[] */
        public readonly array $ascensions,
    ) {
    }
}

/** @merges artifacts */
class ArtifactFullRow extends ResponseShape
{
    public function __construct(
        /** @var ArtifactPiece[] */
        public readonly array $pieces,
    ) {
    }
}

/** @merges materials */
class MaterialFullRow extends ResponseShape
{
    public function __construct(
        /** @var MaterialGroupJoin[] */
        public readonly array $groups,
    ) {
    }
}

/** @merges foods */
class FoodFullRow extends ResponseShape
{
    public function __construct(
        /** @var FoodRecipe[] */
        public readonly array $recipe,
    ) {
    }
}

/** @merges enemies */
class EnemyFullRow extends ResponseShape
{
    public function __construct(
        /** @var EnemyPhaseFull[] */
        public readonly array $phases,
        /** @var EnemyDrop[] */
        public readonly array $drops,
    ) {
    }
}

/** @merges banners */
class BannerFullRow extends ResponseShape
{
    public function __construct(
        /** @var BannerCharacter[] */
        public readonly array $characters,
        /** @var BannerWeapon[] */
        public readonly array $weapons,
    ) {
    }
}

// ── Feedback ──────────────────────────────────────────────────────────────────

class FeedbackPage extends ResponseShape
{
    public function __construct(
        public readonly int $total,
        public readonly int $page,
        public readonly int $pageSize,
        /** @var feedback[] */
        public readonly array $items,
    ) {
    }
}

class FeedbackFilters extends ResponseShape
{
    public function __construct(
        /** @var string[] */
        public readonly array $sections,
        /** @var string[] */
        public readonly array $statuses,
        /** @var string[] */
        public readonly array $types,
        /** @var array<string, int> */
        public readonly array $byStatus,
        /** @var array<string, int> */
        public readonly array $byType,
    ) {
    }
}

/** Echoed back after a status change, so the list can update in place. */
class FeedbackStatusChanged extends ResponseShape
{
    public function __construct(
        public readonly int $id,
        public readonly string $status,
    ) {
    }
}

// ── Material usage ────────────────────────────────────────────────────────────

/**
 * A character that spends a material, and how much of it.
 *
 * `quantity` is a string: Postgres returns SUM() over an integer column as
 * `numeric`, which PDO hands over as text.
 */
class MaterialCharacterSpender extends ResponseShape
{
    public function __construct(
        public readonly int $id,
        public readonly string $name,
        public readonly ?string $icon_name,
        public readonly ?int $rarity,
        public readonly string $quantity,
        public readonly string $element,
    ) {
    }
}

/** A weapon that spends a material. Carries its type where a character has an element. */
class MaterialWeaponSpender extends ResponseShape
{
    public function __construct(
        public readonly int $id,
        public readonly string $name,
        public readonly ?string $icon_name,
        public readonly ?int $rarity,
        public readonly string $quantity,
        public readonly string $type,
    ) {
    }
}

/**
 * Everything that spends one material.
 *
 * Summed per character or weapon, so each is listed once however many phases
 * or refinement steps it spends the material across.
 */
class MaterialUsage extends ResponseShape
{
    public function __construct(
        /** @var MaterialCharacterSpender[] */
        public readonly array $characters_ascension,
        /** @var MaterialCharacterSpender[] */
        public readonly array $characters_talent,
        /** @var MaterialWeaponSpender[] */
        public readonly array $weapons_ascension,
        /** @var MaterialWeaponSpender[] */
        public readonly array $weapons_refinement,
    ) {
    }
}

/**
 * A page of voice over rows.
 *
 * There are eight and a half thousand of them carrying five translations each,
 * which unpaged came to forty-seven megabytes in a single response.
 */
class CharacterVoiceOverPage extends ResponseShape
{
    public function __construct(
        public readonly int $total,
        public readonly int $page,
        /** Rows asked for. Zero means the caller asked for all of them. */
        public readonly int $pageSize,
        /** @var characters_voice_overs[] */
        public readonly array $items,
    ) {
    }
}

/** A page of what enemies drop. */
class EnemyDropPage extends ResponseShape
{
    public function __construct(
        public readonly int $total,
        public readonly int $page,
        public readonly int $pageSize,
        /** @var enemies_drops[] */
        public readonly array $items,
    ) {
    }
}
