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
  namecard_icon_name?: string | null;
  namecard_background: string;
  namecard_background_name?: string | null;
  namecard_banner: string;
  namecard_banner_name?: string | null;
  card_icon: string;
  card_icon_2?: string;
  card_icon_2_name?: string | null;
  wish_icon: string;
  wish_icon_name?: string | null;
  ingame_icon: string;
  ingame_icon_name?: string;
  ingame_icon_2?: string;
  ingame_icon_2_name?: string;
  icon: string;
  icon_name?: string | null;
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
  icon_name?: string | null;
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
  icon_name?: string | null;
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
  icon_name?: string | null;
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
  icon_name?: string | null;
  art?: string | null;
  art_name?: string | null;
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
  icon?: string | null;
  icon_name?: string | null;
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
  icon_name?: string | null;
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
  icon_name?: string | null;
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
  icon_ascension_name?: string | null;
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
  icon_normal_name?: string | null;
  icon_delicious?: string | null;
  icon_delicious_name?: string | null;
  icon_suspicious?: string | null;
  icon_suspicious_name?: string | null;
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

// ── Asset files ───────────────────────────────────────────────────────────────

export interface AssetFolder {
  folder: string;
  files: number;
}

export interface AssetFile {
  name: string;
  extension: string;
  size: number;
  modified: string;
  /** Path the site loads it by, e.g. "assets/materials/Foo.avif". */
  url: string;
}

export interface AssetFilePage {
  folder: string;
  total: number;
  page: number;
  pageSize: number;
  files: AssetFile[];
}

export interface TrashedFile {
  folder: string;
  /** Stamped name on disk, used to restore it. */
  trashed: string;
  name: string;
  deleted_at: string;
  size: number;
}

// ── Banners ───────────────────────────────────────────────────────────────────

export interface BannerFormData {
  id?: number;
  name: string;
  icon?: string | null;
  icon_name?: string | null;
  version: string;
  duration_from: string;
  duration_to?: string | null;
}

export interface BannerEntryFormData {
  id?: number;
  banner_id?: number;
  character_id?: number;
  weapon_id?: number;
  order: number;
}

export interface BannerFull {
  banner: BannerFormData;
  characters: BannerEntryFormData[];
  weapons: BannerEntryFormData[];
}

// ── Backgrounds ───────────────────────────────────────────────────────────────

export interface BackgroundEntry {
  id: number;
  name: string;
  image?: string | null;
  image_name?: string | null;
  preview?: string | null;
  preview_name?: string | null;
}

// ── Audit logs ────────────────────────────────────────────────────────────────

export interface AuditLogEntry {
  id: number;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  changed_by: number | null;
  changed_by_username: string | null;
  changed_at: string;
  /** Column -> { old, new }; absent for inserts, which log the whole row. */
  changes: Record<string, unknown> | null;
}

export interface AuditLogPage {
  total: number;
  page: number;
  pageSize: number;
  items: AuditLogEntry[];
}

export interface AuditLogFilters {
  tables: string[];
  actions: string[];
  users: { id: number; username: string }[];
}

export interface AuditLogQuery {
  table?: string;
  action?: string;
  user?: string;
  recordId?: string;
  from?: string;
  to?: string;
  page: number;
}

export interface EntityUploadResult {
  entity: string;
  id: number;
  field: string;
  /** Base name the file was stored under, no folder and no extension. */
  name: string;
  /** Column the name went into, or null when the table has none. */
  nameColumn: string | null;
  path: string;
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
  // ── Asset files ──────────────────────────────────────────────────────────────

  getAssetFolders(): Observable<AssetFolder[]> { return this._http.get<AssetFolder[]>('/api/files/folders'); }

  getAssetFiles(folder: string, search: string, page: number): Observable<AssetFilePage> {
    return this._http.get<AssetFilePage>('/api/files', { params: { folder, search, page } });
  }

  /** Omit `name` to create; pass an existing name to replace that file. */
  uploadAssetFile(folder: string, file: File, name?: string): Observable<{ url: string }> {
    const form = new FormData();
    form.append('folder', folder);
    form.append('file', file, file.name);
    if (name) {
      form.append('name', name);
    }
    return this._http.post<{ url: string }>('/api/files', form);
  }

  /** Moves the file to the trash; it stays recoverable. */
  deleteAssetFile(folder: string, name: string): Observable<unknown> {
    return this._http.delete('/api/files', { params: { folder, name } });
  }

  getTrashedFiles(): Observable<TrashedFile[]> { return this._http.get<TrashedFile[]>('/api/files/trash'); }

  restoreAssetFile(folder: string, trashed: string): Observable<unknown> {
    const form = new FormData();
    form.append('folder', folder);
    form.append('trashed', trashed);
    return this._http.post('/api/files/restore', form);
  }

  getMigrationFile(database: string, filename: string): Observable<MigrationFile> {
    // Query parameters, not path segments: a URI ending in .sql is intercepted
    // by PHP's built-in server before it reaches the router.
    return this._http.get<MigrationFile>('/api/migrations/file', { params: { database, filename } });
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

  // ── Feedback ─────────────────────────────────────────────────────────────────

  getFeedback(params: Record<string, string | number>): Observable<FeedbackPage> {
    const clean: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== '' && value !== null && value !== undefined) {
        clean[key] = String(value);
      }
    }
    return this._http.get<FeedbackPage>('/api/feedback', { params: clean });
  }
  getFeedbackFilters(): Observable<FeedbackFilters> { return this._http.get<FeedbackFilters>('/api/feedback/filters'); }
  getFeedbackEntry(id: number): Observable<FeedbackEntry> { return this._http.get<FeedbackEntry>(`/api/feedback/${id}`); }
  setFeedbackStatus(id: number, status: string) { return this._http.put<any>(`/api/feedback/${id}/status`, { status }); }
  deleteFeedback(id: number) { return this._http.delete<any>(`/api/feedback/${id}`); }

  // ── Dashboard ────────────────────────────────────────────────────────────────

  getDashboardStats(): Observable<DashboardStats> { return this._http.get<DashboardStats>('/api/dashboard/stats'); }

  // ── Localization ─────────────────────────────────────────────────────────────

  /** `all` includes the ones switched off, which the site chooser does not show. */
  getLanguages(all = false): Observable<SiteLanguage[]> {
    return this._http.get<SiteLanguage[]>('/api/languages', all ? { params: { all: '1' } } : {});
  }
  createLanguage(language: Partial<SiteLanguage>) { return this._http.post<SiteLanguage>('/api/languages', language); }
  updateLanguage(code: string, language: Partial<SiteLanguage>) {
    return this._http.put<SiteLanguage>(`/api/languages/${encodeURIComponent(code)}`, language);
  }
  deleteLanguage(code: string) { return this._http.delete<any>(`/api/languages/${encodeURIComponent(code)}`); }

  getTranslationGrid(): Observable<TranslationGrid> { return this._http.get<TranslationGrid>('/api/admin/translations'); }

  /** A blank value clears the row, which reads as untranslated rather than empty. */
  saveTranslations(values: Record<string, Record<string, string>>) {
    return this._http.put<{ written: number; cleared: number }>('/api/admin/translations', { values });
  }

  exportTranslations(code: string): Observable<Record<string, string>> {
    return this._http.get<Record<string, string>>(`/api/translations/${encodeURIComponent(code)}/export`);
  }
  importTranslations(code: string, values: Record<string, string>, createMissingKeys = false) {
    return this._http.put<{ written: number; cleared: number; keys_created: number }>(
      `/api/translations/${encodeURIComponent(code)}/import`,
      { values, create_missing_keys: createMissingKeys },
    );
  }

  createTranslationKey(name: string, site: string, description?: string) {
    return this._http.post<TranslationKeyEntry>('/api/translation-keys', { name, site, description: description ?? null });
  }
  updateTranslationKey(name: string, changes: { description?: string | null; site?: string }) {
    return this._http.put<TranslationKeyEntry>(`/api/translation-keys/${encodeURIComponent(name)}`, changes);
  }
  deleteTranslationKey(name: string) {
    return this._http.delete<any>(`/api/translation-keys/${encodeURIComponent(name)}`);
  }

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

  getBanners(): Observable<any[]> { return this._http.get<any[]>('/api/banners'); }
  getBannerFull(id: number) { return this._getFull<BannerFull>('banners', id); }
  createBannerFull(data: FormData) { return this._createFull('banners', data); }
  updateBannerFull(id: number, data: FormData) { return this._updateFull('banners', id, data); }
  deleteBanner(id: number) { return this._http.delete<any>(`/api/banners/${id}`); }

  getBackgrounds(): Observable<BackgroundEntry[]> { return this._http.get<BackgroundEntry[]>('/api/backgrounds'); }
  createBackground(name: string) { return this._http.post<BackgroundEntry>('/api/backgrounds', { name }); }
  updateBackground(id: number, name: string) { return this._http.put<BackgroundEntry>(`/api/backgrounds/${id}`, { name }); }
  deleteBackground(id: number) { return this._http.delete<any>(`/api/backgrounds/${id}`); }

  getAuditLogFilters(): Observable<AuditLogFilters> { return this._http.get<AuditLogFilters>('/api/audit-logs/filters'); }
  getAuditLogs(query: AuditLogQuery): Observable<AuditLogPage> {
    const params: Record<string, string> = { page: String(query.page) };
    for (const key of ['table', 'action', 'user', 'recordId', 'from', 'to'] as const) {
      const value = query[key];
      if (value) {
        params[key] = value;
      }
    }
    return this._http.get<AuditLogPage>('/api/audit-logs', { params });
  }

  /**
   * Stores an image for an entity field without touching the database, and
   * returns where it landed. Used while saving a form, so a new entity and
   * re-inserted child rows can both have images.
   */
  uploadImage(entity: string, field: string, file: File, name: string): Observable<EntityUploadResult> {
    const form = new FormData();
    form.append('file', file, file.name);
    form.append('name', name);
    return this._http.post<EntityUploadResult>(`/api/uploads/${entity}/${field}`, form);
  }

  /**
   * Uploads a file for one entity field and writes it onto the row. The client
   * chooses the name; the server works out the folder.
   */
  uploadEntityFile(entity: string, id: number, field: string, file: File, name?: string): Observable<EntityUploadResult> {
    const form = new FormData();
    form.append('file', file, file.name);
    if (name) {
      form.append('name', name);
    }
    return this._http.post<EntityUploadResult>(`/api/uploads/${entity}/${id}/${field}`, form);
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

/** A language the site can be read in. */
export interface SiteLanguage {
  code: string;
  name: string;
  native_name: string;
  enabled: boolean;
  sort_order: number;
}

export interface TranslationKeyEntry {
  name: string;
  description: string | null;
  /** 'common' when every site loads it, otherwise the site that owns it. */
  site: string;
}

/** One of the sites sharing this database, plus the pseudo-site 'common'. */
export interface TranslationSite {
  code: string;
  name: string;
}

/** Every key against every language - what the translations editor renders. */
export interface TranslationGrid {
  languages: SiteLanguage[];
  keys: (TranslationKeyEntry & { values: Record<string, string> })[];
  sites: TranslationSite[];
  /** Which site this deployment serves. */
  currentSite: string;
}

/** One message from the site's contact form. */
export interface FeedbackEntry {
  id: number;
  type: string;
  status: string;
  section: string | null;
  title: string | null;
  /** Null when the message was sent anonymously, signed in or not. */
  user_id: number | null;
  username: string | null;
  email: string | null;
  message: string | null;
  steps_to_reproduce: string | null;
  expected_behavior: string | null;
  actual_behavior: string | null;
  browser_device_info: string | null;
  details: string | null;
  why_important: string | null;
  additional_info: string | null;
  page_url: string | null;
  user_agent: string | null;
  language: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface FeedbackPage {
  total: number;
  page: number;
  pageSize: number;
  items: FeedbackEntry[];
}

export interface FeedbackFilters {
  sections: string[];
  statuses: string[];
  types: string[];
  byStatus: Record<string, number>;
  byType: Record<string, number>;
}

export interface DashboardStats {
  content: { label: string; table: string; route: string; icon: string; total: number }[];
  /** Records missing something they ought to have, biggest job first. */
  gaps: { label: string; route: string; missing: number; total: number }[];
  feedback: {
    total: number;
    new: number;
    last7: number;
    last30: number;
    byType: { type: string; total: number }[];
  };
  activity: {
    today: number;
    last7: number;
    last30: number;
    recent: { id: number; table_name: string; record_id: string; action: string; changed_at: string; changed_by_username: string | null }[];
  };
  translations: {
    keys: number;
    languages: { code: string; name: string; native_name: string; enabled: boolean; translated: number }[];
  };
}
