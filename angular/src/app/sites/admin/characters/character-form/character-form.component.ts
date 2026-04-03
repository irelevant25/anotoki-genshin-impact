import { Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NotificationService } from '../../../../shared/local-lib/components/notification/notification.service';
import { ButtonComponent } from '../../../../shared/local-lib/components/button/button.component';
import { LoaderComponent } from '../../../../shared/local-lib/components/loader/loader.component';
import { TabsComponent } from '../../../../shared/local-lib/components/tabs/tabs.component';
import { TabComponent } from '../../../../shared/local-lib/components/tabs/tab/tab.component';
import { BaseInfoTabComponent } from './base-info/base-info-tab.component';
import { VoiceOversTabComponent } from './voice-overs/voice-overs-tab.component';
import { ConstellationsTabComponent } from './constellations/constellations-tab.component';
import { AscensionsTabComponent } from './ascensions/ascensions-tab.component';
import { TalentsTabComponent } from './talents/talents-tab.component';
import {
  AdminApiService,
  AscensionFormData,
  CharacterFull,
  CharacterFormData,
  ConstellationFormData,
  MaterialEntry,
  RelationshipFormData,
  TalentFormData,
  VoiceOverFormData,
} from '../../services/admin-api.service';

function emptyCharacter(): CharacterFormData {
  return {
    name: '',
    element: '',
    weapon_type: '',
    rarity: NaN,
    model: '',
    region: '',
    version: '',
    voice_actor_english: '',
    voice_actor_japanese: '',
    voice_actor_korean: '',
    voice_actor_chinese: '',
    namecard_description: '',
    namecard_icon: '',
    namecard_background: '',
    namecard_banner: '',
    card_icon: '',
    wish_icon: '',
    ingame_icon: '',
    icon: '',
    is_traveler: false,
  };
}

@Component({
  selector: 'app-character-form',
  templateUrl: './character-form.component.html',
  styleUrls: ['./character-form.component.scss'],
  providers: [],
  imports: [
    RouterLink,
    ButtonComponent,
    LoaderComponent,
    TabsComponent,
    TabComponent,
    BaseInfoTabComponent,
    VoiceOversTabComponent,
    ConstellationsTabComponent,
    AscensionsTabComponent,
    TalentsTabComponent,
  ],
})
export class CharacterFormComponent {
  // Form state
  character = signal<CharacterFormData>(emptyCharacter());
  voiceOvers = signal<VoiceOverFormData[]>([]);
  constellations = signal<ConstellationFormData[]>([]);
  ascensions = signal<AscensionFormData[]>([]);
  talents = signal<TalentFormData[]>([]);
  relationships = signal<RelationshipFormData[]>([]);
  selectedRoles = signal<string[]>([]);

  // Lookup signals
  regions = signal<string[]>([]);
  roles = signal<string[]>([]);
  talentTypes = signal<string[]>([]);
  relationshipTypes = signal<string[]>([]);
  stats = signal<string[]>([]);
  materials = signal<MaterialEntry[]>([]);
  elements = signal<string[]>([]);
  weaponTypes = signal<string[]>([]);
  models = signal<string[]>([]);
  voiceOverTypes = signal<string[]>([]);
  languages = signal<string[]>([]);
  characterStates = signal<string[]>([]);
  rarities = signal<string[]>([]);

  // File upload signals
  pendingCharFiles = signal<Record<string, File>>({});
  pendingVoAudio = signal<(File | null)[]>([]);
  pendingCoIcon = signal<(File | null)[]>([]);
  pendingTaIcon = signal<(File | null)[]>([]);
  charIconPreviews = signal<Record<string, string>>({});
  coIconPreviews = signal<(string | null)[]>([]);
  taIconPreviews = signal<(string | null)[]>([]);

  // Voice over accordion state
  voTypesOpen = signal<Set<string>>(new Set());
  voLangsOpen = signal<Set<string>>(new Set());

  private readonly _api = inject(AdminApiService);
  private readonly _notify = inject(NotificationService);
  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);

  isEdit = signal(false);
  characterId = signal<number | null>(null);
  loading = signal(false);
  saving = signal(false);

  pageTitle = computed(() => (this.isEdit() ? 'Edit Character' : 'Create Character'));
  backLink = computed(() => (this.isEdit() ? '../..' : '..'));

  constructor() {
    this._api.getRegions().subscribe((e) => this.regions.set(e.map((x) => x.name)));
    this._api.getRoles().subscribe((e) => this.roles.set(e.map((x) => x.name)));
    this._api.getTalentTypes().subscribe((e) => this.talentTypes.set(e.map((x) => x.name)));
    this._api.getRelationshipTypes().subscribe((e) => this.relationshipTypes.set(e.map((x) => x.name)));
    this._api.getStats().subscribe((e) => this.stats.set(e.map((x) => x.name)));
    this._api.getMaterials().subscribe((e) => this.materials.set(e));
    this._api.getElements().subscribe((e) => this.elements.set(e.map((x) => x.name)));
    this._api.getWeaponTypes().subscribe((e) => this.weaponTypes.set(e.map((x) => x.name)));
    this._api.getModels().subscribe((e) => this.models.set(e.map((x) => x.name)));
    this._api.getVoiceOverTypes().subscribe((e) => this.voiceOverTypes.set(e.map((x) => x.name)));
    this._api.getLanguages().subscribe((e) => this.languages.set(e.map((x) => x.name)));
    this._api.getCharacterStates().subscribe((e) => this.characterStates.set(e.map((x) => x.name)));
    this._api.getRarities().subscribe((e) =>
      this.rarities.set(
        e
          .map((x: any) => x.name)
          .sort()
          .reverse()
      )
    );
  }

  ngOnInit(): void {
    const id = this._route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.characterId.set(Number(id));
    }
    if (this.isEdit()) {
      this.loading.set(true);
      this._api.getCharacterFull(Number(id)).subscribe({
        next: (data) => {
          const c = { ...emptyCharacter() };
          Object.keys(c).forEach((k) => {
            if (data[k] !== undefined) (c as any)[k] = data[k];
          });
          this.character.set(c);

          const vos = data.voice_overs ?? [];
          const cos = data.constellations ?? [];
          const tas = data.talents ?? [];

          this.voiceOvers.set(vos);
          this.constellations.set(cos);
          this.ascensions.set(data.ascensions ?? []);
          this.talents.set(tas);
          this.relationships.set(data.relationships ?? []);
          this.selectedRoles.set(data.roles ?? []);

          this.pendingVoAudio.set(vos.map(() => null));
          this.pendingCoIcon.set(cos.map(() => null));
          this.coIconPreviews.set(cos.map(() => null));
          this.pendingTaIcon.set(tas.map(() => null));
          this.taIconPreviews.set(tas.map(() => null));

          this.loading.set(false)
        },
        error: () => {
          this.loading.set(false);
          this._notify.showError('Failed to load character');
        },
      });
    }
  }

  // ngOnDestroy(): void {
  //   this.cleanupUrls();
  // }

  // cleanupUrls(): void {
  //   Object.values(this.charIconPreviews()).forEach((u) => URL.revokeObjectURL(u));
  //   this.coIconPreviews().forEach((u) => {
  //     if (u) URL.revokeObjectURL(u);
  //   });
  //   this.taIconPreviews().forEach((u) => {
  //     if (u) URL.revokeObjectURL(u);
  //   });
  // }

  save(): void {
    this.saving.set(true);
    const op = this.isEdit() ? this._api.updateCharacterFull(this.characterId()!, this.buildFormData()) : this._api.createCharacterFull(this.buildFormData());

    op.subscribe({
      next: (res) => {
        this.saving.set(false);
        this._notify.showSuccess(this.isEdit() ? 'Character updated' : 'Character created');
        if (!this.isEdit()) {
          this._router.navigate(['/admin/characters', res.id, 'edit']);
        }
      },
      error: (e) => {
        this.saving.set(false);
        this._notify.showError(e?.error?.message ?? 'Failed to save character');
      },
    });
  }

  buildFormData(): FormData {
    const payload: CharacterFull = {
      character: this.character(),
      voice_overs: this.voiceOvers(),
      constellations: this.constellations(),
      ascensions: this.ascensions(),
      talents: this.talents(),
      relationships: this.relationships(),
      roles: this.selectedRoles(),
    };
    const fd = new FormData();
    fd.append('data', JSON.stringify(payload));
    Object.entries(this.pendingCharFiles()).forEach(([field, file]) => fd.append(`char_${field}`, file));
    this.pendingVoAudio().forEach((f, i) => {
      if (f) fd.append(`vo_audio_${i}`, f);
    });
    this.pendingCoIcon().forEach((f, i) => {
      if (f) fd.append(`co_icon_${i}`, f);
    });
    this.pendingTaIcon().forEach((f, i) => {
      if (f) fd.append(`ta_icon_${i}`, f);
    });
    return fd;
  }
}
