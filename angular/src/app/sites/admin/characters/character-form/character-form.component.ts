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
  RelationshipFormData,
  TalentFormData,
  VoiceOverFormData,
  TalentCostFormData,
  AscensionCostFormData,
} from '../../services/admin-api.service';
import { Material } from '../../../../shared/models.generated';

export interface ConstellationWrapper {
  data: ConstellationFormData;
  icon?: File;
}

export interface TalentWrapper {
  data: TalentFormData;
  icon?: File;
}

export interface AscensionWrapper {
  ascension: AscensionFormData;
  cost: AscensionCostFormData[];
}

export interface CharacterWrapper {
  data: CharacterFormData;
  namecard_icon?: File;
  namecard_background?: File;
  namecard_banner?: File;
  icon?: File;
  card_icon?: File;
  card_icon_2?: File;
  wish_icon?: File;
  ingame_icon?: File;
  ingame_icon_2?: File;
}

export interface VoiceOverWrapper {
  data: VoiceOverFormData;
  displayTitle?: string;
  audio_english?: File;
  audio_japanese?: File;
  audio_chinese?: File;
  audio_korean?: File;
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
  character = signal<CharacterWrapper>({ data: {} as CharacterFormData });
  voiceOvers = signal<VoiceOverWrapper[]>([]);
  constellations = signal<ConstellationWrapper[]>([]);
  ascensions = signal<AscensionWrapper[]>([]);
  talents = signal<TalentWrapper[]>([]);
  talentCost = signal<TalentCostFormData[]>([]);
  relationships = signal<RelationshipFormData[]>([]);
  selectedRoles = signal<string[]>([]);

  // Lookup signals
  regions = signal<string[]>([]);
  roles = signal<string[]>([]);
  talentTypes = signal<string[]>([]);
  relationshipTypes = signal<string[]>([]);
  stats = signal<string[]>([]);
  materials = signal<Material[]>([]);
  elements = signal<string[]>([]);
  weaponTypes = signal<string[]>([]);
  models = signal<string[]>([]);
  voiceOverTypes = signal<string[]>([]);
  characterStates = signal<string[]>([]);
  rarities = signal<string[]>([]);

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
          this.character.set({ data: data.character });
          this.voiceOvers.set(data.voice_overs?.map((x, index) => ({ data: x, index, displayTitle: '' })) ?? []);
          this.constellations.set(data.constellations?.map((c) => ({ data: c })) ?? []);
          this.ascensions.set(data.ascensions?.map((c) => ({ ascension: c, cost: data.ascension_cost?.filter((x) => x.character_ascension_id === c.id) ?? [] })) ?? []);
          this.talents.set(data.talents?.map((c) => ({ data: c })) ?? []);
          this.talentCost.set(data.talent_cost ?? []);
          this.relationships.set(data.relationships ?? []);
          this.selectedRoles.set(data.roles ?? []);

          this.loading.set(false)
        },
        error: () => {
          this.loading.set(false);
          this._notify.showError('Failed to load character');
        },
      });
    }
  }

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

  // buildFormData(): FormData {
  //   const data: CharacterFull = {
  //     character: this.character().data,
  //     voice_overs: this.voiceOvers().map((x) => x.data),
  //     constellations: this.constellations().map((c) => c.data),
  //     ascensions: this.ascensions().map(x => x.ascension),
  //     ascension_cost: this.ascensions().flatMap(x => x.cost),
  //     talents: this.talents().map((c) => c.data),
  //     talent_cost: this.talentCost(),
  //     relationships: this.relationships(),
  //     roles: this.selectedRoles(),
  //   };
  //   const payload = new FormData();
  //   payload.append('data', JSON.stringify(data));
  //   // this.pendingCoIcon().forEach((f, i) => {
  //   //   if (f) fd.append(`co_icon_${i}`, f);
  //   // });
  //   // this.pendingTaIcon().forEach((f, i) => {
  //   //   if (f) fd.append(`ta_icon_${i}`, f);
  //   // });
  //   return payload;
  // }

  buildFormData(): FormData {
    const data: CharacterFull = {
      character: this.character().data,
      voice_overs: this.voiceOvers().map((x) => x.data),
      constellations: this.constellations().map((c) => c.data),
      ascensions: this.ascensions().map(x => x.ascension),
      ascension_cost: this.ascensions().flatMap(x => x.cost),
      talents: this.talents().map((c) => c.data),
      talent_cost: this.talentCost(),
      relationships: this.relationships(),
      roles: this.selectedRoles(),
    };
    const payload = new FormData();
    payload.append('data', JSON.stringify(data));

    // base info
    const baseInfoWrapper: CharacterWrapper = JSON.parse(JSON.stringify(this.character()));
    baseInfoWrapper.data.namecard_icon = `../assets/character/namecard_icon/${baseInfoWrapper.data.name.toUpperCase()}.png`;
    baseInfoWrapper.data.namecard_background = `../assets/character/namecard_background/${baseInfoWrapper.data.name.toUpperCase()}.png`;
    baseInfoWrapper.data.namecard_banner = `../assets/character/namecard_banner/${baseInfoWrapper.data.name.toUpperCase()}.png`;
    baseInfoWrapper.data.icon = `../assets/character/icon/${baseInfoWrapper.data.name.toUpperCase()}.png`;
    baseInfoWrapper.data.card_icon = `../assets/character/card_icon/${baseInfoWrapper.data.name.toUpperCase()}.png`;
    baseInfoWrapper.data.card_icon_2 = baseInfoWrapper.data.card_icon_2 ? `../assets/character/card_icon/${baseInfoWrapper.data.name.toUpperCase()}.png` : undefined;
    baseInfoWrapper.data.wish_icon = `../assets/character/wish_icon/${baseInfoWrapper.data.name.toUpperCase()}.png`;
    baseInfoWrapper.data.ingame_icon = `../assets/character/ingame_icon/${baseInfoWrapper.data.name.toUpperCase()}${baseInfoWrapper.data.ingame_icon_name ? ' - ' + baseInfoWrapper.data.ingame_icon_name : ''}.png`;
    baseInfoWrapper.data.ingame_icon_2 = baseInfoWrapper.data.ingame_icon_2 ? `../assets/character/ingame_icon/${baseInfoWrapper.data.name.toUpperCase()}${baseInfoWrapper.data.ingame_icon_2_name ? ' - ' + baseInfoWrapper.data.ingame_icon_2_name : ''}.png` : undefined;

    if (baseInfoWrapper.namecard_icon) {
      payload.append(baseInfoWrapper.data.namecard_icon, baseInfoWrapper.namecard_icon);
    }
    if (baseInfoWrapper.namecard_background) {
      payload.append(baseInfoWrapper.data.namecard_background, baseInfoWrapper.namecard_background);
    }
    if (baseInfoWrapper.namecard_banner) {
      payload.append(baseInfoWrapper.data.namecard_banner, baseInfoWrapper.namecard_banner);
    }
    if (baseInfoWrapper.icon) {
      payload.append(baseInfoWrapper.data.icon, baseInfoWrapper.icon);
    }
    if (baseInfoWrapper.card_icon) {
      payload.append(baseInfoWrapper.data.card_icon, baseInfoWrapper.card_icon);
    }
    if (baseInfoWrapper.card_icon_2 && baseInfoWrapper.data.card_icon_2) {
      payload.append(baseInfoWrapper.data.card_icon_2, baseInfoWrapper.card_icon_2);
    }
    if (baseInfoWrapper.wish_icon) {
      payload.append(baseInfoWrapper.data.wish_icon, baseInfoWrapper.wish_icon);
    }
    if (baseInfoWrapper.ingame_icon) {
      payload.append(baseInfoWrapper.data.ingame_icon, baseInfoWrapper.ingame_icon);
    }
    if (baseInfoWrapper.ingame_icon_2 && baseInfoWrapper.data.ingame_icon_2) {
      payload.append(baseInfoWrapper.data.ingame_icon_2, baseInfoWrapper.ingame_icon_2);
    }

    // voice overs


    // constellations

    // talents

    return payload;
  }
}
