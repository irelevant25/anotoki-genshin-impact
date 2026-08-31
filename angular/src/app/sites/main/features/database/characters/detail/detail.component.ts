import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of, switchMap } from 'rxjs';
import { LoaderComponent } from '../../../../../../shared/local-lib/components/loader/loader.component';
import { TranslatePipe } from '../../../../../../shared/local-lib/i18n/translate.pipe';
import { MaterialIconDirective } from '../../../../../admin/shared/material-icon.directive';
import { asList, versionLabel } from '../../shared/database-helpers';
import { CharacterAscensionsTabComponent } from './tabs/ascensions/ascensions-tab.component';
import { CharacterTalentsTabComponent } from './tabs/talents/talents-tab.component';
import { CharacterConstellationsTabComponent } from './tabs/constellations/constellations-tab.component';
import { CharacterBuildTabComponent } from './tabs/build/build-tab.component';
import { CharacterVoiceOversTabComponent } from './tabs/voice-overs/voice-overs-tab.component';

type CharacterTab = 'ascensions' | 'talents' | 'constellations' | 'build' | 'voiceOvers';

@Component({
  selector: 'app-database-character-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
  imports: [
    LoaderComponent,
    TranslatePipe,
    MaterialIconDirective,
    CharacterAscensionsTabComponent,
    CharacterTalentsTabComponent,
    CharacterConstellationsTabComponent,
    CharacterBuildTabComponent,
    CharacterVoiceOversTabComponent,
  ],
})
export class DatabaseCharacterDetailComponent {
  private readonly _httpClient = inject(HttpClient);
  private readonly _route = inject(ActivatedRoute);

  character = signal<any | null>(null);
  talents = signal<any[]>([]);
  constellations = signal<any[]>([]);
  ascensions = signal<any[]>([]);
  talentLevels = signal<{ level: number; costs: any[] }[]>([]);
  voiceOvers = signal<any[]>([]);
  roles = signal<string[]>([]);
  loading = signal(true);

  readonly tabs: { id: CharacterTab; label: string }[] = [
    { id: 'ascensions', label: 'database.detail.ascensions' },
    { id: 'talents', label: 'database.detail.talents' },
    { id: 'constellations', label: 'database.detail.constellations' },
    { id: 'build', label: 'database.detail.build' },
    { id: 'voiceOvers', label: 'database.detail.voiceOvers' },
  ];
  activeTab = signal<CharacterTab>('ascensions');

  versionLabel = versionLabel;

  rarityStars = computed(() => '★'.repeat(Number(this.character()?.rarity ?? 0)));
  elementClass = computed(() => String(this.character()?.element ?? '').toLowerCase());
  affiliations = computed(() => asList(this.character()?.affiliations));
  titles = computed(() => [this.character()?.title, this.character()?.secondary_title].filter((title) => !!title));

  voiceActors = computed(() => {
    const character = this.character();
    return [
      { language: 'English', actor: character?.voice_actor_english },
      { language: 'Japanese', actor: character?.voice_actor_japanese },
      { language: 'Korean', actor: character?.voice_actor_korean },
      { language: 'Chinese', actor: character?.voice_actor_chinese },
    ].filter((entry) => !!entry.actor);
  });

  /** The demo track is filed under the character, not the song title. */
  demoMusicUrl = computed(() => {
    const character = this.character();
    return character?.demo_music && character?.icon_name ? `assets/character/demo_music/${character.icon_name}.mp3` : null;
  });

  constructor() {
    this._route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id');
          this.loading.set(true);
          if (!id) {
            return of(null);
          }
          // Costs name a material by id only, so the material list comes along.
          return forkJoin({
            full: this._httpClient.get<any>(`/api/characters/${id}/full`),
            materials: this._httpClient.get<any[]>('/api/materials'),
          });
        }),
      )
      .subscribe({
        next: (result) => {
          if (!result) {
            this.loading.set(false);
            return;
          }
          const materialsById = new Map(result.materials.map((material) => [material.id, material]));
          const withMaterial = (row: any) => ({ ...row, material: materialsById.get(row.material_id) ?? null });

          const full = result.full;
          this.character.set(full.character ?? null);
          this.talents.set([...(full.talents ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
          this.constellations.set([...(full.constellations ?? [])].sort((a, b) => (a.level ?? 0) - (b.level ?? 0)));
          this.roles.set(full.roles ?? []);
          this.voiceOvers.set([...(full.voice_overs ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));

          const costsByAscension = new Map<number, any[]>();
          for (const cost of full.ascension_cost ?? []) {
            costsByAscension.set(cost.character_ascension_id, [...(costsByAscension.get(cost.character_ascension_id) ?? []), withMaterial(cost)]);
          }
          this.ascensions.set(
            [...(full.ascensions ?? [])]
              .sort((a, b) => (a.phase ?? 0) - (b.phase ?? 0))
              .map((ascension: any) => ({ ...ascension, costs: costsByAscension.get(ascension.id) ?? [] })),
          );

          const byLevel = new Map<number, any[]>();
          for (const cost of full.talent_cost ?? []) {
            byLevel.set(cost.level, [...(byLevel.get(cost.level) ?? []), withMaterial(cost)]);
          }
          this.talentLevels.set([...byLevel.entries()].sort(([a], [b]) => a - b).map(([level, costs]) => ({ level, costs })));

          this.activeTab.set('ascensions');
          this.loading.set(false);
        },
        error: () => {
          this.character.set(null);
          this.loading.set(false);
        },
      });
  }
}
