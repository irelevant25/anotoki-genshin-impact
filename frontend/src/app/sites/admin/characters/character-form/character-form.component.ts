import { Component, computed, ElementRef, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, Observable, of, switchMap } from 'rxjs';
import { ToastService } from '@anotoki/lib/ui/toast';
import { AbstractInputComponent } from '../../../../shared/local-lib/abstract-input.class';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { IconComponent } from '@anotoki/lib/ui/icon';
import { PageHeaderComponent } from '@anotoki/lib/ui/page-header';
import { SpinnerComponent } from '@anotoki/lib/ui/spinner';
import { TabsComponent } from '@anotoki/lib/ui/tabs';
import { BaseInfoTabComponent } from './base-info/base-info-tab.component';
import { VoiceOversTabComponent } from './voice-overs/voice-overs-tab.component';
import { ConstellationsTabComponent } from './constellations/constellations-tab.component';
import { AscensionsTabComponent } from './ascensions/ascensions-tab.component';
import { TalentsTabComponent } from './talents/talents-tab.component';
import { CharacterApiService, FileApiService, FoodApiService, LookupApiService, MaterialApiService, StatApiService, IdNameEntry } from '../../../../api';
import { AscensionCostFormData, CharacterFullPayload, RelationshipFormData, TalentCostFormData } from '../../../../sites/admin/shared/admin-form.model';
import { Audited, Material, toFormData } from '../../../../api';
import { PickedImage } from '../../shared/image-upload/image-upload.component';
import { PendingImage } from '../../shared/admin-form.class';
import { toAssetBaseName } from '../../shared/asset-name';
import {
  AscensionWrapper,
  characterImageName,
  CharacterImageField,
  CharacterWrapper,
  ConstellationWrapper,
  createUid,
  emptyCharacter,
  TalentWrapper,
  toBoolean,
  toNumber,
  toOptionalNumber,
  revokePicked,
  toStringArray,
  UNNAMED_CHARACTER_FILES,
  VOICE_OVER_LANGUAGES,
  VoiceOverWrapper,
} from './character-form.model';

@Component({
  selector: 'app-character-form',
  templateUrl: './character-form.component.html',
  styleUrls: ['./character-form.component.scss'],
  imports: [
    RouterLink,
    ButtonComponent,
    IconComponent,
    PageHeaderComponent,
    SpinnerComponent,
    TabsComponent,
    BaseInfoTabComponent,
    VoiceOversTabComponent,
    ConstellationsTabComponent,
    AscensionsTabComponent,
    TalentsTabComponent,
  ],
})
export class CharacterFormComponent implements OnInit, OnDestroy {
  /** The form's tabs (the kit's). */
  @ViewChild(TabsComponent) private _tabs?: TabsComponent;

  // Form state
  character = signal<CharacterWrapper>(emptyCharacter());
  voiceOvers = signal<VoiceOverWrapper[]>([]);
  constellations = signal<ConstellationWrapper[]>([]);
  ascensions = signal<AscensionWrapper[]>([]);
  talents = signal<TalentWrapper[]>([]);
  talentCost = signal<TalentCostFormData[]>([]);
  relationships = signal<RelationshipFormData[]>([]);
  selectedRoles = signal<string[]>([]);

  // Lookups
  regions = signal<string[]>([]);
  roles = signal<string[]>([]);
  talentTypes = signal<string[]>([]);
  relationshipTypes = signal<string[]>([]);
  stats = signal<string[]>([]);
  materials = signal<Audited<Material>[]>([]);
  elements = signal<string[]>([]);
  weaponTypes = signal<string[]>([]);
  models = signal<string[]>([]);
  characterStates = signal<string[]>([]);
  rarities = signal<string[]>([]);
  foods = signal<IdNameEntry[]>([]);

  isEdit = signal(false);
  characterId = signal<number | null>(null);
  loadingLookups = signal(true);
  loadingCharacter = signal(false);
  saving = signal(false);

  loading = computed(() => this.loadingLookups() || this.loadingCharacter());
  pageTitle = computed(() => (this.isEdit() ? 'Edit Character' : 'Create Character'));
  backLink = computed(() => (this.isEdit() ? '../..' : '..'));

  private readonly _characterApi = inject(CharacterApiService);
  private readonly _fileApi = inject(FileApiService);
  private readonly _foodApi = inject(FoodApiService);
  private readonly _lookupApi = inject(LookupApiService);
  private readonly _materialApi = inject(MaterialApiService);
  private readonly _statApi = inject(StatApiService);
  private readonly _notify = inject(ToastService);
  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);
  private readonly _elementRef = inject(ElementRef<HTMLElement>);

  ngOnInit(): void {
    this._loadLookups();

    const id = this._route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }
    this.isEdit.set(true);
    this.characterId.set(Number(id));
    this._loadCharacter(Number(id));
  }

  ngOnDestroy(): void {
    this._revokePreviews();
  }

  // ── Loading ─────────────────────────────────────────────────────────────────

  private _loadLookups(): void {
    this.loadingLookups.set(true);
    forkJoin({
      regions: this._lookupApi.getRegions(),
      roles: this._lookupApi.getRoles(),
      talentTypes: this._lookupApi.getTalentTypes(),
      relationshipTypes: this._lookupApi.getRelationshipTypes(),
      stats: this._statApi.getStats(),
      materials: this._materialApi.getMaterials(),
      elements: this._lookupApi.getElements(),
      weaponTypes: this._lookupApi.getWeaponTypes(),
      models: this._lookupApi.getCharacterModels(),
      characterStates: this._lookupApi.getCharacterStates(),
      rarities: this._lookupApi.getRarities(),
      foods: this._foodApi.getFoods(),
    }).subscribe({
      next: (result) => {
        // `rarities.name` is a SMALLINT, so this list is the one place a lookup
        // answers with numbers rather than text.
        const names = (entries: { name: string | number }[]) => entries.map((entry) => String(entry.name));
        this.regions.set(names(result.regions));
        this.roles.set(names(result.roles));
        this.talentTypes.set(names(result.talentTypes));
        this.relationshipTypes.set(names(result.relationshipTypes));
        this.stats.set(names(result.stats));
        this.materials.set(result.materials);
        this.elements.set(names(result.elements));
        this.weaponTypes.set(names(result.weaponTypes));
        this.models.set(names(result.models));
        this.characterStates.set(names(result.characterStates));
        this.rarities.set(names(result.rarities).sort().reverse());
        this.foods.set(result.foods);
        this.loadingLookups.set(false);
      },
      error: () => {
        this.loadingLookups.set(false);
        this._notify.error('Failed to load form options');
      },
    });
  }

  private _loadCharacter(id: number): void {
    this._revokePreviews();
    this.loadingCharacter.set(true);
    this._characterApi.getCharacterFull(id).subscribe({
      next: (data) => {
        this.character.set({
          data: {
            ...data.character,
            rarity: toNumber(data.character.rarity, 4),
            is_traveler: toBoolean(data.character.is_traveler),
            special_dish: toOptionalNumber(data.character.special_dish),
            how_to_obtain: toStringArray(data.character.how_to_obtain),
            affiliations: toStringArray(data.character.affiliations),
            namecard_sources: toStringArray(data.character.namecard_sources),
          },
          pending: {},
        });
        this.voiceOvers.set((data.voice_overs ?? []).map((voiceOver) => ({ uid: createUid(), data: voiceOver, audio: {} })));
        this.constellations.set((data.constellations ?? []).map((constellation) => ({ uid: createUid(), data: constellation })));
        this.ascensions.set(
          (data.ascensions ?? []).map((ascension) => ({
            uid: createUid(),
            ascension,
            cost: (data.ascension_cost ?? []).filter((cost) => cost.character_ascension_id === ascension.id),
          })),
        );
        this.talents.set((data.talents ?? []).map((talent) => ({ uid: createUid(), data: talent })));
        this.talentCost.set(data.talent_cost ?? []);
        this.relationships.set((data.relationships ?? []).map((relationship) => ({ ...relationship, is_biological: toBoolean(relationship.is_biological) })));
        this.selectedRoles.set(data.roles ?? []);
        this.loadingCharacter.set(false);
      },
      error: () => {
        this.loadingCharacter.set(false);
        this._notify.error('Failed to load character');
      },
    });
  }

  // ── Saving ──────────────────────────────────────────────────────────────────

  save(): void {
    if (!this._validate()) {
      return;
    }

    this.saving.set(true);

    // Picked images go up first, so the payload can carry the paths they
    // landed on and one save writes the row and its image columns together.
    this._uploadPendingImages()
      .pipe(
        switchMap(() => {
          const payload = this._buildFormData();
          const id = this.characterId();
          return this.isEdit() && id !== null ? this._characterApi.updateCharacterFull(id, payload) : this._characterApi.createCharacterFull(payload);
        }),
      )
      .subscribe({
        next: (result) => {
          this.saving.set(false);
          this._notify.success(this.isEdit() ? 'Character updated' : 'Character created');
          if (this.isEdit()) {
            this._loadCharacter(this.characterId()!);
          } else {
            this._router.navigate(['/admin/characters', result.id, 'edit']);
          }
        },
        error: (error) => {
          this.saving.set(false);
          this._notify.error(error?.error?.error ?? error?.error?.message ?? 'Failed to save character');
        },
      });
  }

  /** Sends every picked image and writes the stored path back onto the model. */
  private _uploadPendingImages(): Observable<unknown> {
    const pending = this._collectPendingImages();
    if (!pending.length) {
      return of(null);
    }
    return forkJoin(
      pending.map((entry) => {
        // An existing-catalogue pick already has an id — link it, do not upload.
        const existing = entry.picked.existing;
        if (existing) {
          entry.apply(existing.path, existing.name, existing.fileId);
          return of(null);
        }
        return this._fileApi.uploadEntityFile(entry.entity, entry.field, toFormData({ file: entry.picked.file!, name: entry.name })).pipe(
          switchMap((result) => {
            entry.apply(result.path, result.name, result.fileId);
            return of(result);
          }),
        );
      }),
    );
  }

  /** Touches every input in the form so errors become visible, then reports validity. */
  private _validate(): boolean {
    const root = this._elementRef.nativeElement as HTMLElement;
    const inputs = Array.from(AbstractInputComponent.registry).filter((input) => root.contains(input.elementRef.nativeElement));
    inputs.forEach((input) => input.markAsTouched());

    const invalid = inputs.filter((input) => !input.isValid());
    if (invalid.length > 0) {
      this._notify.error(`Please fix ${invalid.length} invalid field${invalid.length === 1 ? '' : 's'} before saving.`);
      this._revealInput(invalid[0].elementRef.nativeElement);
      return false;
    }

    // Image names are derived from what the row is called, so an unnamed row
    // has nowhere to put its picture.
    if (this._collectPendingImages().some((entry) => !entry.name)) {
      this._notify.error('Name the character, constellation or talent before uploading its image.');
      return false;
    }

    const duplicate = this._findDuplicateCost();
    if (duplicate) {
      this._notify.error(duplicate);
      return false;
    }
    return true;
  }

  /**
   * Costs are unique per material within an ascension phase and within a talent
   * level, so a duplicate would only surface as a constraint violation from the API.
   */
  private _findDuplicateCost(): string | undefined {
    for (const wrapper of this.ascensions()) {
      if (this._hasDuplicateMaterial(wrapper.cost)) {
        return `Ascension phase ${wrapper.ascension.phase} lists the same material twice.`;
      }
    }

    const costsByLevel = new Map<number, TalentCostFormData[]>();
    for (const cost of this.talentCost()) {
      costsByLevel.set(cost.level, [...(costsByLevel.get(cost.level) ?? []), cost]);
    }
    for (const [level, costs] of costsByLevel) {
      if (this._hasDuplicateMaterial(costs)) {
        return `Talent level ${level} lists the same material twice.`;
      }
    }
    return undefined;
  }

  private _hasDuplicateMaterial(costs: { material_id?: number }[]): boolean {
    const materialIds = costs.map((cost) => cost.material_id).filter((id) => id !== undefined);
    return new Set(materialIds).size !== materialIds.length;
  }

  /**
   * Opens the tab holding the given element - every panel stays in the page,
   * hidden but for the one chosen (`data-tab` names its tab) - and brings it
   * into view.
   */
  private _revealInput(element: HTMLElement): void {
    const tab = element.closest('[data-tab]')?.getAttribute('data-tab');
    if (tab && this._tabs) {
      this._tabs.active.set(tab);
    }
    setTimeout(() => element.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  }

  /**
   * Builds the multipart body: the whole character graph as JSON under `data`,
   * plus one part per picked file under the key the API looks for.
   */
  private _buildFormData(): FormData {
    const payload = new FormData();
    payload.append('data', JSON.stringify(this._buildPayload()));

    // Images already went up during save; only voice over audio still rides
    // along, since its folder depends on the row it belongs to.
    this.voiceOvers().forEach((voiceOver, index) => {
      for (const language of VOICE_OVER_LANGUAGES) {
        const file = voiceOver.audio[language];
        if (file) {
          payload.append(`vo_audio_${index}_${language}`, file, file.name);
        }
      }
    });

    return payload;
  }

  /** Every image picked on any tab, with where to write the result. */
  private _collectPendingImages(): PendingImage[] {
    const pending: PendingImage[] = [];
    const character = this.character();

    // Names are read now rather than when the file was picked, so renaming the
    // character (or a constellation) before saving still stores it correctly.
    for (const [field, picked] of Object.entries(character.pending) as [CharacterImageField, PickedImage][]) {
      pending.push({
        entity: 'character',
        field,
        picked,
        name: characterImageName(character.data.name, field),
        apply: (path: string, name: string, fileId: number | null) => {
          const data = character.data as unknown as Record<string, unknown>;
          data[field] = path;
          if (!UNNAMED_CHARACTER_FILES.has(field)) {
            data[`${field}_name`] = name;
          }
          data[`${field}_file_id`] = fileId;
        },
      });
    }

    for (const constellation of this.constellations()) {
      if (constellation.pending) {
        pending.push({
          entity: 'character-constellation',
          field: 'icon',
          picked: constellation.pending,
          name: toAssetBaseName(constellation.data.name),
          apply: (path: string, name: string, fileId: number | null) => {
            constellation.data.icon = path;
            constellation.data.icon_name = name;
            constellation.data.icon_file_id = fileId;
          },
        });
      }
    }

    for (const talent of this.talents()) {
      if (talent.pending) {
        pending.push({
          entity: 'character-talent',
          field: 'icon',
          picked: talent.pending,
          name: toAssetBaseName(talent.data.name),
          apply: (path: string, name: string, fileId: number | null) => {
            talent.data.icon = path;
            talent.data.icon_name = name;
            talent.data.icon_file_id = fileId;
          },
        });
      }
    }

    return pending;
  }

  /** The voice-over set picker chose a set; point the character at it (saved with the character). */
  onVoiceOverSetChosen(setId: number): void {
    this.character.update((wrapper) => ({ ...wrapper, data: { ...wrapper.data, voice_over_set_id: setId } }));
  }

  /** The ascension set picker chose a set; point the character at it (saved with the character). */
  onAscensionSetChosen(setId: number): void {
    this.character.update((wrapper) => ({ ...wrapper, data: { ...wrapper.data, ascension_set_id: setId } }));
  }

  /** The talent set picker chose a set; point the character at it (saved with the character). */
  onTalentSetChosen(setId: number): void {
    this.character.update((wrapper) => ({ ...wrapper, data: { ...wrapper.data, talent_set_id: setId } }));
  }

  /** The constellation set picker chose a set; point the character at it (saved with the character). */
  onConstellationSetChosen(setId: number): void {
    this.character.update((wrapper) => ({ ...wrapper, data: { ...wrapper.data, constellation_set_id: setId } }));
  }

  /**
   * A voice over with its texts' bold written as <b>. The HTML editor writes <strong>, while the
   * crawled texts keep a dialogue's speakers in <b> - without this, every edited line would drift
   * to the other tag.
   */
  private _withBoldTags<T extends object>(data: T): T {
    const copy = { ...data } as Record<string, unknown>;
    for (const key of ['text_english', 'text_japanese', 'text_chinese', 'text_korean']) {
      if (typeof copy[key] === 'string') {
        copy[key] = (copy[key] as string).replace(/<(\/?)strong>/g, '<$1b>');
      }
    }
    return copy as T;
  }

  private _buildPayload(): CharacterFullPayload {
    const character = this.character().data;

    return {
      character: {
        ...character,
        rarity: toNumber(character.rarity, 4),
        is_traveler: !!character.is_traveler,
        special_dish: toOptionalNumber(character.special_dish),
        how_to_obtain: toStringArray(character.how_to_obtain),
        affiliations: toStringArray(character.affiliations),
        namecard_sources: toStringArray(character.namecard_sources),
      },
      voice_overs: this.voiceOvers().map((voiceOver) => ({ ...this._withBoldTags(voiceOver.data), order: toNumber(voiceOver.data.order, 1) })),
      constellations: this.constellations().map((constellation) => ({ ...constellation.data, level: toNumber(constellation.data.level, 1) })),
      // The API nests ascension costs under their ascension and assigns the ids itself.
      ascensions: this.ascensions().map((wrapper) => ({
        ...wrapper.ascension,
        phase: toNumber(wrapper.ascension.phase),
        primary_stat_value: toNumber(wrapper.ascension.primary_stat_value),
        start_level_hp: toNumber(wrapper.ascension.start_level_hp),
        start_level_atk: toNumber(wrapper.ascension.start_level_atk),
        start_level_def: toNumber(wrapper.ascension.start_level_def),
        end_level_hp: toNumber(wrapper.ascension.end_level_hp),
        end_level_atk: toNumber(wrapper.ascension.end_level_atk),
        end_level_def: toNumber(wrapper.ascension.end_level_def),
        costs: wrapper.cost.map((cost) => this._normalizeCost(cost)),
      })),
      talents: this.talents().map((talent) => ({ ...talent.data, order: toNumber(talent.data.order, 1) })),
      talent_costs: this.talentCost().map((cost) => ({
        ...cost,
        level: toNumber(cost.level, 2),
        order: toNumber(cost.order, 1),
        material_id: toNumber(cost.material_id),
        quantity: toNumber(cost.quantity, 1),
      })),
      relationships: this.relationships().map((relationship) => ({ ...relationship, is_biological: !!relationship.is_biological })),
      roles: this.selectedRoles(),
    };
  }

  private _normalizeCost(cost: AscensionCostFormData): AscensionCostFormData {
    return {
      ...cost,
      order: toNumber(cost.order, 1),
      material_id: toNumber(cost.material_id),
      quantity: toNumber(cost.quantity, 1),
    };
  }

  private _revokePreviews(): void {
    Object.values(this.character().pending).forEach(revokePicked);
    this.constellations().forEach((constellation) => revokePicked(constellation.pending));
    this.talents().forEach((talent) => revokePicked(talent.pending));
  }
}
