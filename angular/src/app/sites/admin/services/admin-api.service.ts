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
  getLanguages(): Observable<NameEntry[]> { return this._http.get<NameEntry[]>('/api/languages'); }
  getRarities(): Observable<any[]> { return this._http.get<any[]>('/api/rarities'); }
  getArtifactPieceTypes(): Observable<NameEntry[]> { return this._http.get<NameEntry[]>('/api/artifact-piece-types'); }
  getMaterials(): Observable<Material[]> { return this._http.get<Material[]>('/api/materials'); }
  getMigrations(): Observable<any[]> { return this._http.get<any[]>('/api/migrations'); }
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

  createStat(name: string) { return this._nameCreate('/api/stats', name); }
  deleteStat(id: number) { return this._http.delete<any>(`/api/stats/${id}`); }
}
