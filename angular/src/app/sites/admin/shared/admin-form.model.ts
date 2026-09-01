/**
 * What the admin forms hold while they are being edited.
 *
 * These are the names the forms have always used, but they are no longer
 * separate declarations: each one is now a slice of the matching `/full`
 * contract in src/app/api, which is itself built from the PHP models. A column
 * added to a model on the backend turns up here without anyone editing this
 * file, and a form can no longer disagree with the endpoint it posts to - which
 * is what the two hand-kept copies used to do.
 *
 * They are still the form's view of a resource rather than the wire's: `id` is
 * optional because a child being added on screen does not have one yet, and the
 * foreign key back to the parent is filled in on save.
 */

import {
  ArtifactFull,
  BannerFull,
  CharacterFull,
  EnemyFull,
  FoodFull,
  MaterialFull,
  WeaponFull,
} from '../../../api';

/** The element type of an array-valued property. */
type Item<T> = NonNullable<T> extends readonly (infer U)[] ? U : never;

// ── Characters ────────────────────────────────────────────────────────────────

export type CharacterFormData = CharacterFull['character'];
export type VoiceOverFormData = Item<CharacterFull['voice_overs']>;
export type ConstellationFormData = Item<CharacterFull['constellations']>;
export type AscensionFormData = Item<CharacterFull['ascensions']>;
export type AscensionCostFormData = Item<CharacterFull['ascension_cost']>;
export type TalentFormData = Item<CharacterFull['talents']>;
export type TalentCostFormData = Item<CharacterFull['talent_cost']>;
export type RelationshipFormData = Item<CharacterFull['relationships']>;

/**
 * Shape accepted by POST/PUT /api/characters[/{id}]/full.
 *
 * Not the same shape that comes back: the write side nests each ascension's
 * costs under the ascension and spells the talent costs `talent_costs`, while
 * the read side returns both flat. Characters predate registerFullResource(),
 * which is why they are the only resource where the two differ.
 */
export interface CharacterFullPayload {
  character: CharacterFormData;
  voice_overs: VoiceOverFormData[];
  constellations: ConstellationFormData[];
  ascensions: (AscensionFormData & { costs: AscensionCostFormData[] })[];
  talents: TalentFormData[];
  talent_costs: TalentCostFormData[];
  relationships: RelationshipFormData[];
  roles: string[];
}

// ── Weapons ───────────────────────────────────────────────────────────────────

export type WeaponFormData = WeaponFull['weapon'];
export type WeaponRefinementFormData = Item<WeaponFull['refinements']>;
export type WeaponAscensionFormData = Item<WeaponFull['ascensions']>;
export type WeaponAscensionCostFormData = Item<Item<WeaponFull['ascensions']>['costs']>;

// ── Artifacts ─────────────────────────────────────────────────────────────────

export type ArtifactFormData = ArtifactFull['artifact'];
export type ArtifactPieceFormData = Item<ArtifactFull['pieces']>;

// ── Materials ─────────────────────────────────────────────────────────────────

export type MaterialFormData = MaterialFull['material'];
export type MaterialGroupJoinFormData = Item<MaterialFull['groups']>;

// ── Foods ─────────────────────────────────────────────────────────────────────

export type FoodFormData = FoodFull['food'];
export type FoodRecipeFormData = Item<FoodFull['recipe']>;

// ── Enemies ───────────────────────────────────────────────────────────────────

export type EnemyFormData = EnemyFull['enemy'];
export type EnemyPhaseFormData = Item<EnemyFull['phases']>;
export type EnemyDropFormData = Item<EnemyFull['drops']>;
export type EnemyDamageTypeElementFormData = Item<Item<EnemyFull['phases']>['damage_type_elements']>;

// ── Banners ───────────────────────────────────────────────────────────────────

export type BannerFormData = BannerFull['banner'];
export type BannerEntryFormData = Item<BannerFull['characters']>;
