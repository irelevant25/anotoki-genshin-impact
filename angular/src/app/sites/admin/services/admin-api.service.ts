import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Material } from '../../../shared/models.generated';

/** Shape returned by GET /api/characters/{id}/full - sub-resource costs come back flat. */
export interface CharacterFull {
  character: CharacterFormData;
  voice_overs?: VoiceOverFormData[];
  constellations?: ConstellationFormData[];
  ascensions?: AscensionFormData[];
  ascension_cost?: AscensionCostFormData[];
  talents?: TalentFormData[];
  talent_cost?: TalentCostFormData[];
  relationships?: RelationshipFormData[];
  roles?: string[];
}

/**
 * Shape accepted by POST/PUT /api/characters[/{id}]/full.
 * The backend nests ascension costs under each ascension and expects `talent_costs`.
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

export interface CharacterFormData {
  name: string;
  element: string;
  weapon_type: string;
  rarity: number;
  title?: string;
  secondary_title?: string;
  region?: string;
  model: string;
  birthday?: string;
  is_traveler?: boolean;
  version: string;
  release_date?: string;
  introduced?: string;
  demo_music?: string;
  voice_actor_english: string;
  voice_actor_japanese: string;
  voice_actor_korean: string;
  voice_actor_chinese: string;
  how_to_obtain?: string[] | null;
  affiliations?: string[] | null;
  namecard_description: string;
  namecard_sources?: string[] | null;
  namecard_icon: string;
  namecard_background: string;
  namecard_banner: string;
  card_icon: string;
  card_icon_2?: string;
  wish_icon: string;
  ingame_icon: string;
  ingame_icon_name?: string;
  ingame_icon_2?: string;
  ingame_icon_2_name?: string;
  icon: string;
  special_dish?: number;
}

export interface VoiceOverFormData {
  id?: number;
  character_id?: number;
  order: number;
  type: string;
  title_english: string;
  title_japanese?: string;
  title_chinese?: string;
  title_chinese_traditional?: string;
  title_korean?: string;
  text_english?: string;
  text_japanese?: string;
  text_chinese?: string;
  text_chinese_traditional?: string;
  text_korean?: string;
  text_japanese_reading?: string;
  text_chinese_reading?: string;
  text_korean_reading?: string;
  audio_english?: string;
  audio_japanese?: string;
  audio_chinese?: string;
  audio_korean?: string;
}

export interface ConstellationFormData {
  id?: number;
  character_id?: number;
  name: string;
  level: number;
  icon: string;
  description?: string;
}

export interface AscensionCostFormData {
  character_ascension_id: number;
  order: number;
  /** Unset until a material is picked - unique per ascension phase. */
  material_id?: number;
  quantity: number;
}

export interface AscensionFormData {
  id?: number;
  character_id?: number;
  phase: number;
  primary_stat: string;
  primary_stat_value: number;
  start_level_hp: number;
  start_level_atk: number;
  start_level_def: number;
  end_level_hp: number;
  end_level_atk: number;
  end_level_def: number;
}

export interface TalentCostFormData {
  level: number;
  order: number;
  /** Unset until a material is picked - unique per talent level. */
  material_id?: number;
  quantity: number;
}

export interface TalentFormData {
  id?: number;
  character_id?: number;
  order: number;
  name: string;
  type: string;
  icon: string;
  description?: string;
}

export interface RelationshipFormData {
  id?: number;
  character_id?: number;
  type: string;
  name: string;
  state: string;
  is_biological?: boolean;
}

// ── Enemies ───────────────────────────────────────────────────────────────────

export interface EnemyFormData {
  id?: number;
  name: string;
  icon: string;
  description?: string | null;
  version?: string | null;
  interactive_map_link?: string | null;
}

export interface EnemyDamageTypeElementFormData {
  damage_type_element: string;
  order: number;
}

export interface EnemyPhaseFormData {
  id?: number;
  enemy_id?: number;
  title: string;
  secondary_title?: string | null;
  icon: string;
  art?: string | null;
  has_weakpoint?: boolean;
  living_being_type?: string | null;
  living_being_family?: string | null;
  living_being_group?: string | null;
  damage_type_elements?: EnemyDamageTypeElementFormData[];
}

export interface EnemyDropFormData {
  id?: number;
  enemy_id?: number;
  material_id?: number | null;
  artifact_id?: number | null;
  level_from?: number | null;
  level_to?: number | null;
  domain_level?: string | null;
  world_level?: number | null;
  quantity_from?: number | null;
  quantity_to?: number | null;
  drop_rate?: number | null;
  average?: number | null;
  rarity?: number | null;
}

export interface EnemyFull {
  enemy: EnemyFormData;
  phases: EnemyPhaseFormData[];
  drops: EnemyDropFormData[];
}

// ── Materials ─────────────────────────────────────────────────────────────────

export interface MaterialFormData {
  id?: number;
  name: string;
  type?: string | null;
  group?: string | null;
  region?: string | null;
  rarity?: number | null;
  description?: string | null;
  how_to_obtain?: string[] | null;
  version?: string | null;
}

export interface MaterialGroupJoinFormData {
  id?: number;
  material_id?: number;
  group?: string | null;
}

export interface MaterialFull {
  material: MaterialFormData;
  groups: MaterialGroupJoinFormData[];
}

// ── Artifacts ─────────────────────────────────────────────────────────────────

export interface ArtifactFormData {
  id?: number;
  name: string;
  icon: string;
  version?: string | null;
  effects?: string[] | null;
  two_piece?: string | null;
  four_piece?: string | null;
  has_rarity_1?: boolean;
  has_rarity_2?: boolean;
  has_rarity_3?: boolean;
  has_rarity_4?: boolean;
  has_rarity_5?: boolean;
  how_to_obtain_quality_1?: string[] | null;
  how_to_obtain_quality_2?: string[] | null;
  how_to_obtain_quality_3?: string[] | null;
  how_to_obtain_quality_4?: string[] | null;
  how_to_obtain_quality_5?: string[] | null;
}

export interface ArtifactPieceFormData {
  id?: number;
  artifact_id?: number;
  name: string;
  type: string;
  icon: string;
}

export interface ArtifactFull {
  artifact: ArtifactFormData;
  pieces: ArtifactPieceFormData[];
}

// ── Weapons ───────────────────────────────────────────────────────────────────

export interface WeaponFormData {
  id?: number;
  name: string;
  type: string;
  rarity: number;
  icon: string;
  icon_name?: string | null;
  icon_2?: string | null;
  icon_2_name?: string | null;
  icon_ascension?: string | null;
  primary_stat?: string | null;
  secondary_stat?: string | null;
  how_to_obtain?: string[] | null;
  effects?: string[] | null;
  release_date?: string | null;
  version?: string | null;
  description?: string | null;
}

export interface WeaponRefinementFormData {
  id?: number;
  weapon_id?: number;
  material_id: number;
  quantity: number;
  description: string;
}

export interface WeaponAscensionCostFormData {
  id?: number;
  weapon_ascension_id?: number;
  material_id?: number;
  quantity: number;
}

export interface WeaponAscensionFormData {
  id?: number;
  weapon_id?: number;
  phase: number;
  primary_stat_value: number;
  secondary_stat_value: number;
  start_level_from?: number | null;
  start_level_to?: number | null;
  end_level_from?: number | null;
  end_level_to?: number | null;
  costs?: WeaponAscensionCostFormData[];
}

export interface WeaponFull {
  weapon: WeaponFormData;
  refinements: WeaponRefinementFormData[];
  ascensions: WeaponAscensionFormData[];
}

// ── Foods ─────────────────────────────────────────────────────────────────────

export interface FoodFormData {
  id?: number;
  name: string;
  type?: string | null;
  region?: string | null;
  rarity?: number | null;
  proficiency?: number | null;
  base_dish_id?: number | null;
  version?: string | null;
  effect?: string | null;
  icon_normal?: string | null;
  icon_delicious?: string | null;
  icon_suspicious?: string | null;
  description_normal?: string | null;
  description_delicious?: string | null;
  description_suspicious?: string | null;
  effect_normal?: string | null;
  effect_delicious?: string | null;
  effect_suspicious?: string | null;
  events?: string[] | null;
  how_to_obtain?: string[] | null;
  effects?: string[] | null;
}

export interface FoodRecipeFormData {
  id?: number;
  food_id?: number;
  material_id?: number;
  quantity: number;
}

export interface FoodFull {
  food: FoodFormData;
  recipe: FoodRecipeFormData[];
}

// ── Migrations ────────────────────────────────────────────────────────────────

export interface MigrationEntry {
  /** "{database}:{filename}" - migrations are only unique per database. */
  id: string;
  database: string;
  filename: string;
  applied_at: string | null;
  status: 'applied' | 'pending' | 'applied (file missing)';
  size: number | null;
}

export interface MigrationFile {
  database: string;
  filename: string;
  size: number;
  content: string;
}

export interface NameEntry { name: string; }
export interface IdNameEntry { id: number; name: string; }
export interface UploadResult { filename: string; path: string; }

/** Character columns stored as JSONB - PDO hands them back as raw JSON strings. */
const CHARACTER_JSON_FIELDS = ['how_to_obtain', 'affiliations', 'namecard_sources'] as const;

function parseJsonColumn(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}


@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly _http = inject(HttpClient);

  // ── Characters ──────────────────────────────────────────────────────────────

  getCharacters(): Observable<any[]> {
    return this._http.get<any[]>('/api/characters');
  }

  getCharacterFull(id: number): Observable<CharacterFull> {
    return this._http.get<CharacterFull>(`/api/characters/${id}/full`).pipe(
      map((full) => {
        const character = { ...full.character } as Record<string, unknown>;
        for (const field of CHARACTER_JSON_FIELDS) {
          character[field] = parseJsonColumn(character[field]);
        }
        return { ...full, character: character as unknown as CharacterFormData };
      })
    );
  }

  createCharacterFull(data: FormData): Observable<any> {
    return this._http.post<any>('/api/characters/full', data);
  }

  updateCharacterFull(id: number, data: FormData): Observable<any> {
    return this._http.put<any>(`/api/characters/${id}/full`, data);
  }

  deleteCharacter(id: number): Observable<any> {
    return this._http.delete<any>(`/api/characters/${id}`);
  }

  // ── File upload ──────────────────────────────────────────────────────────────

  uploadFile(file: File, folder = 'characters'): Observable<UploadResult> {
    const form = new FormData();
    form.append('file', file);
    form.append('folder', folder);
    return this._http.post<UploadResult>('/api/upload', form);
  }

  // ── Lookup tables (read-only) ────────────────────────────────────────────────

  getElements(): Observable<NameEntry[]> { return this._http.get<NameEntry[]>('/api/elements'); }
  getWeaponTypes(): Observable<NameEntry[]> { return this._http.get<NameEntry[]>('/api/weapon-types'); }
  getModels(): Observable<NameEntry[]> { return this._http.get<NameEntry[]>('/api/character-models'); }
  getVoiceOverTypes(): Observable<NameEntry[]> { return this._http.get<NameEntry[]>('/api/voice-over-types'); }
  getCharacterStates(): Observable<NameEntry[]> { return this._http.get<NameEntry[]>('/api/character-states'); }
  getRarities(): Observable<any[]> { return this._http.get<any[]>('/api/rarities'); }
  getArtifactPieceTypes(): Observable<NameEntry[]> { return this._http.get<NameEntry[]>('/api/artifact-piece-types'); }
  getMaterials(): Observable<Material[]> { return this._http.get<Material[]>('/api/materials'); }
  getMigrations(): Observable<MigrationEntry[]> { return this._http.get<MigrationEntry[]>('/api/migrations'); }
  getMigrationFile(database: string, filename: string): Observable<MigrationFile> {
    return this._http.get<MigrationFile>(`/api/migrations/${encodeURIComponent(database)}/${encodeURIComponent(filename)}`);
  }
  getFoods(): Observable<IdNameEntry[]> { return this._http.get<IdNameEntry[]>('/api/foods'); }
  getStats(): Observable<any[]> { return this._http.get<any[]>('/api/stats'); }

  // ── Lookup tables (CRUD) ─────────────────────────────────────────────────────

  private _nameList(path: string): Observable<NameEntry[]> { return this._http.get<NameEntry[]>(path); }
  private _nameCreate(path: string, name: string): Observable<NameEntry> {
    return this._http.post<NameEntry>(path, { name });
  }
  private _nameDelete(path: string, name: string): Observable<any> {
    return this._http.delete<any>(`${path}/${encodeURIComponent(name)}`);
  }

  getRelationshipTypes() { return this._nameList('/api/relationship-types'); }
  createRelationshipType(name: string) { return this._nameCreate('/api/relationship-types', name); }
  deleteRelationshipType(name: string) { return this._nameDelete('/api/relationship-types', name); }

  getTalentTypes() { return this._nameList('/api/talent-types'); }
  createTalentType(name: string) { return this._nameCreate('/api/talent-types', name); }
  deleteTalentType(name: string) { return this._nameDelete('/api/talent-types', name); }

  getFoodTypes() { return this._nameList('/api/food-types'); }
  createFoodType(name: string) { return this._nameCreate('/api/food-types', name); }
  deleteFoodType(name: string) { return this._nameDelete('/api/food-types', name); }

  getMaterialTypes() { return this._nameList('/api/material-types'); }
  createMaterialType(name: string) { return this._nameCreate('/api/material-types', name); }
  deleteMaterialType(name: string) { return this._nameDelete('/api/material-types', name); }

  getMaterialGroups() { return this._nameList('/api/material-groups'); }
  createMaterialGroup(name: string) { return this._nameCreate('/api/material-groups', name); }
  deleteMaterialGroup(name: string) { return this._nameDelete('/api/material-groups', name); }

  getRegions() { return this._nameList('/api/regions'); }
  createRegion(name: string) { return this._nameCreate('/api/regions', name); }
  deleteRegion(name: string) { return this._nameDelete('/api/regions', name); }

  getRoles() { return this._nameList('/api/roles'); }
  createRole(name: string) { return this._nameCreate('/api/roles', name); }
  deleteRole(name: string) { return this._nameDelete('/api/roles', name); }

  getEnemyTypes() { return this._nameList('/api/enemy-types'); }
  createEnemyType(name: string) { return this._nameCreate('/api/enemy-types', name); }
  deleteEnemyType(name: string) { return this._nameDelete('/api/enemy-types', name); }

  getDomainLevels() { return this._nameList('/api/domain-levels'); }
  createDomainLevel(name: string) { return this._nameCreate('/api/domain-levels', name); }
  deleteDomainLevel(name: string) { return this._nameDelete('/api/domain-levels', name); }

  getEnemyFamilies() { return this._nameList('/api/enemy-families'); }
  createEnemyFamily(name: string) { return this._nameCreate('/api/enemy-families', name); }
  deleteEnemyFamily(name: string) { return this._nameDelete('/api/enemy-families', name); }

  getEnemyGroups() { return this._nameList('/api/enemy-groups'); }
  createEnemyGroup(name: string) { return this._nameCreate('/api/enemy-groups', name); }
  deleteEnemyGroup(name: string) { return this._nameDelete('/api/enemy-groups', name); }

  // ── Full resources ───────────────────────────────────────────────────────────

  private _getFull<T>(path: string, id: number): Observable<T> {
    return this._http.get<T>(`/api/${path}/${id}/full`);
  }
  private _createFull(path: string, data: FormData): Observable<any> {
    return this._http.post<any>(`/api/${path}/full`, data);
  }
  private _updateFull(path: string, id: number, data: FormData): Observable<any> {
    return this._http.put<any>(`/api/${path}/${id}/full`, data);
  }

  getEnemies(): Observable<any[]> { return this._http.get<any[]>('/api/enemies'); }
  getEnemyFull(id: number) { return this._getFull<EnemyFull>('enemies', id); }
  createEnemyFull(data: FormData) { return this._createFull('enemies', data); }
  updateEnemyFull(id: number, data: FormData) { return this._updateFull('enemies', id, data); }
  deleteEnemy(id: number) { return this._http.delete<any>(`/api/enemies/${id}`); }

  getArtifacts(): Observable<any[]> { return this._http.get<any[]>('/api/artifacts'); }
  getArtifactFull(id: number) { return this._getFull<ArtifactFull>('artifacts', id); }
  createArtifactFull(data: FormData) { return this._createFull('artifacts', data); }
  updateArtifactFull(id: number, data: FormData) { return this._updateFull('artifacts', id, data); }
  deleteArtifact(id: number) { return this._http.delete<any>(`/api/artifacts/${id}`); }

  getWeapons(): Observable<any[]> { return this._http.get<any[]>('/api/weapons'); }
  getWeaponFull(id: number) { return this._getFull<WeaponFull>('weapons', id); }
  createWeaponFull(data: FormData) { return this._createFull('weapons', data); }
  updateWeaponFull(id: number, data: FormData) { return this._updateFull('weapons', id, data); }
  deleteWeapon(id: number) { return this._http.delete<any>(`/api/weapons/${id}`); }

  getFoodFull(id: number) { return this._getFull<FoodFull>('foods', id); }
  createFoodFull(data: FormData) { return this._createFull('foods', data); }
  updateFoodFull(id: number, data: FormData) { return this._updateFull('foods', id, data); }
  deleteFood(id: number) { return this._http.delete<any>(`/api/foods/${id}`); }

  getMaterialFull(id: number) { return this._getFull<MaterialFull>('materials', id); }
  createMaterialFull(data: FormData) { return this._createFull('materials', data); }
  updateMaterialFull(id: number, data: FormData) { return this._updateFull('materials', id, data); }
  deleteMaterial(id: number) { return this._http.delete<any>(`/api/materials/${id}`); }

  createStat(name: string) { return this._nameCreate('/api/stats', name); }
  deleteStat(id: number) { return this._http.delete<any>(`/api/stats/${id}`); }
}
