/**
 * The `/full` endpoints: one parent row and its children, read and written in
 * a single request.
 *
 * Hand-written, because the composite exists only in the endpoint - there is no
 * table shaped like it. The parts, though, are the generated payloads, so a
 * column added to the backend model turns up here without anyone editing this
 * file. `Saved<T>` adds the id a child has once it has been stored.
 *
 * Every one of these is sent as multipart/form-data, not JSON: the body carries
 * the images alongside the fields. The generated services type those bodies as
 * FormData, and the shapes below describe what comes back out.
 */

import {
  ArtifactPayload,
  ArtifactPiecePayload,
  BannerCharacterPayload,
  BannerPayload,
  BannerWeaponPayload,
  CharacterAscensionCostPayload,
  CharacterAscensionPayload,
  CharacterConstellationPayload,
  CharacterPayload,
  CharacterRelationshipPayload,
  CharacterTalentCostPayload,
  CharacterTalentPayload,
  CharacterVoiceOverPayload,
  EnemyDamageTypeElementPayload,
  EnemyDropPayload,
  EnemyPayload,
  EnemyPhasePayload,
  FoodPayload,
  FoodRecipePayload,
  MaterialGroupJoinPayload,
  MaterialPayload,
  WeaponAscensionCostPayload,
  WeaponAscensionPayload,
  WeaponPayload,
  WeaponRefinementPayload,
} from '../models';
import { Saved } from './common.type';

/**
 * `GET /api/characters/{id}/full`
 *
 * The odd one out: characters were written before registerFullResource(), and
 * their costs come back flat rather than nested under the phase or level they
 * belong to. The write side nests ascension costs and renames talent costs to
 * `talent_costs`, which is why the form rebuilds the body rather than putting
 * back what it was given.
 */
export interface CharacterFull {
  character: Saved<CharacterPayload>;
  voice_overs?: Saved<CharacterVoiceOverPayload>[];
  constellations?: Saved<CharacterConstellationPayload>[];
  ascensions?: Saved<CharacterAscensionPayload>[];
  ascension_cost?: Saved<CharacterAscensionCostPayload>[];
  talents?: Saved<CharacterTalentPayload>[];
  talent_cost?: Saved<CharacterTalentCostPayload>[];
  relationships?: Saved<CharacterRelationshipPayload>[];
  roles?: string[];
}

export interface WeaponFull {
  weapon: Saved<WeaponPayload>;
  refinements: Saved<WeaponRefinementPayload>[];
  ascensions: (Saved<WeaponAscensionPayload> & { costs?: Saved<WeaponAscensionCostPayload>[] })[];
}

export interface ArtifactFull {
  artifact: Saved<ArtifactPayload>;
  pieces: Saved<ArtifactPiecePayload>[];
}

export interface MaterialFull {
  material: Saved<MaterialPayload>;
  groups: Saved<MaterialGroupJoinPayload>[];
}

export interface FoodFull {
  food: Saved<FoodPayload>;
  recipe: Saved<FoodRecipePayload>[];
}

export interface EnemyFull {
  enemy: Saved<EnemyPayload>;
  phases: (Saved<EnemyPhasePayload> & { damage_type_elements?: Saved<EnemyDamageTypeElementPayload>[] })[];
  drops: Saved<EnemyDropPayload>[];
}

export interface BannerFull {
  banner: Saved<BannerPayload>;
  characters: Saved<BannerCharacterPayload>[];
  weapons: Saved<BannerWeaponPayload>[];
}

/**
 * `GET /api/materials/{id}/usage` - everything that spends this material.
 *
 * Quantities are summed per character or weapon, so each one is listed once
 * however many phases or refinement steps it spends the material across. Note
 * that `quantity` comes back as a string: Postgres returns SUM() over an
 * integer column as `numeric`, which PDO hands over as text.
 */
export interface MaterialSpender {
  id: number;
  name: string;
  icon_name: string | null;
  rarity: number | null;
  quantity: string;
}

export interface MaterialUsage {
  characters_ascension: (MaterialSpender & { element: string })[];
  characters_talent: (MaterialSpender & { element: string })[];
  weapons_ascension: (MaterialSpender & { type: string })[];
  weapons_refinement: (MaterialSpender & { type: string })[];
}
