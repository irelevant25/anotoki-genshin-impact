import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, of, switchMap } from 'rxjs';
import { LoaderComponent } from '../../../../../../shared/local-lib/components/loader/loader.component';
import { AudioPlayerComponent } from '@anotoki/lib/ui/audio-player';
import { TranslatePipe, TranslationService } from '@anotoki/lib/translations';
import { TabsComponent } from '@anotoki/lib/ui/tabs';
import { CardComponent } from '@anotoki/lib/ui/card';
import { asList, birthdayLabel, versionLabel, withMaterialFrom } from '../../shared/database-helpers';
import { CharacterApiService } from '../../../../../../api';
import { GameListsService } from '../../../../game-lists.service';
import { DetailHeroComponent, HeroPicture, HeroStat } from '../../shared/detail-hero/detail-hero.component';
import { DetailFactsComponent, FactRow } from '../../shared/detail-facts/detail-facts.component';
import { CharacterAscensionsTabComponent } from './tabs/ascensions/ascensions-tab.component';
import { CharacterTalentsTabComponent } from './tabs/talents/talents-tab.component';
import { CharacterConstellationsTabComponent } from './tabs/constellations/constellations-tab.component';
import { CharacterBuildTabComponent } from './tabs/build/build-tab.component';
import { CharacterVoiceOversTabComponent } from './tabs/voice-overs/voice-overs-tab.component';

type CharacterTab = 'ascensions' | 'talents' | 'constellations' | 'build' | 'voiceOvers';

/**
 * A character's page: the hero (its namecard behind the header, its splash
 * art, its card art overlapping, the six facts that identify it as a strip),
 * the About and Voice & music cards, then the tabs - the owner's choice of
 * 2026-10-21 among the mockups ("Showcase"), the same bones as the weapon's
 * and the material's pages.
 */
@Component({
  selector: 'app-database-character-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
  imports: [
    LoaderComponent,
    TabsComponent,
    CardComponent,
    TranslatePipe,
    AudioPlayerComponent,
    DetailHeroComponent,
    DetailFactsComponent,
    CharacterAscensionsTabComponent,
    CharacterTalentsTabComponent,
    CharacterConstellationsTabComponent,
    CharacterBuildTabComponent,
    CharacterVoiceOversTabComponent,
  ],
})
export class DatabaseCharacterDetailComponent {
  private readonly _characterApi = inject(CharacterApiService);
  private readonly _lists = inject(GameListsService);
  private readonly _route = inject(ActivatedRoute);
  private readonly _i18n = inject(TranslationService);

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
  /** The tabs as the kit's row takes them, in the reader's language. */
  readonly tabItems = computed(() => this.tabs.map((tab) => ({ id: tab.id, label: this._i18n.t(tab.label) })));

  affiliations = computed(() => asList(this.character()?.affiliations));
  titles = computed(() => [this.character()?.title, this.character()?.secondary_title].filter((title) => !!title));
  /** The day and month, in the reader's language - the stored date's year means nothing. */
  birthday = computed(() => birthdayLabel(this.character()?.birthday, this._i18n.locale()));

  /** The namecard's picture behind the header, by its own file name - the icon's where it has none. */
  backdrop = computed<HeroPicture | null>(() => this._picture('namecard_background_name', 'character.namecard_background'));
  /** The splash art at the hero's right. */
  splash = computed<HeroPicture | null>(() => this._picture('wish_icon_name', 'character.wish_icon'));
  /** The card art overlapping the picture. */
  portrait = computed<HeroPicture | null>(() => this._picture('card_icon_name', 'character.card_icon'));

  /** The strip of tiles under the name: what identifies the character at a glance. */
  heroStats = computed<HeroStat[]>(() => {
    const character = this.character();
    if (!character) {
      return [];
    }
    return [
      { label: 'database.filters.element', value: character.element, icon: character.element ? { name: character.element, folder: 'elements' } : null },
      { label: 'database.filters.weaponType', value: character.weapon_type, icon: character.weapon_type ? { name: character.weapon_type, folder: 'weapon_types', disc: true } : null },
      { label: 'database.filters.region', value: character.region, icon: character.region ? { name: character.region, folder: 'regions', disc: true } : null },
      { label: 'database.filters.rarity', stars: Number(character.rarity) || null },
      { label: 'database.detail.released', date: character.release_date, hint: character.version ? versionLabel(character.version) : null },
      { label: 'database.detail.birthday', value: this.birthday() },
    ];
  });

  /** The About card: the facts the strip does not carry. */
  aboutRows = computed<FactRow[]>(() => {
    const character = this.character();
    if (!character) {
      return [];
    }
    return [
      { label: 'database.detail.titles', chips: this.titles() },
      { label: 'database.detail.affiliations', chips: this.affiliations() },
      { label: 'database.detail.model', value: character.model },
      { label: 'database.detail.constellation', value: character.constellation_name },
      { label: 'database.detail.arkhe', value: character.arkhe },
      // The dish itself, as the old site showed it: its picture - the food's own
      // normal icon, never a file named after the dish - and its name, both beside
      // special_dish, which is only its id.
      { label: 'database.detail.specialDish', value: character.special_dish_name, icon: character.special_dish_icon ? { name: character.special_dish_icon } : null },
    ];
  });

  /** The voice actors, each language a row; the languages' names are shown as they are. */
  voiceRows = computed<FactRow[]>(() => {
    const character = this.character();
    return [
      { labelText: 'English', value: character?.voice_actor_english },
      { labelText: 'Japanese', value: character?.voice_actor_japanese },
      { labelText: 'Korean', value: character?.voice_actor_korean },
      { labelText: 'Chinese', value: character?.voice_actor_chinese },
    ].filter((row) => !!row.value);
  });

  /** The demo track is a file of its own; `demo_music` is its path, `demo_music_name` its title. */
  demoMusicUrl = computed(() => this.character()?.demo_music ?? null);

  constructor() {
    this._route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id');
          this.loading.set(true);
          if (!id) {
            return of(null);
          }
          // Costs name a material by id only, so the material list comes along -
          // asked once a page life (GameListsService), so the next character,
          // and the Materials page, have it already.
          return forkJoin({
            full: this._characterApi.getCharacterFull(Number(id)),
            materials: this._lists.materials(),
          });
        }),
      )
      .subscribe({
        next: (result) => {
          if (!result) {
            this.loading.set(false);
            return;
          }
          const withMaterial = withMaterialFrom(result.materials);

          const full = result.full;
          this.character.set(full.character ?? null);
          this.talents.set([...(full.talents ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
          this.constellations.set([...(full.constellations ?? [])].sort((a, b) => (a.level ?? 0) - (b.level ?? 0)));
          this.roles.set(full.roles ?? []);
          this.voiceOvers.set([...(full.voice_overs ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));

          const costsByAscension = new Map<number, any[]>();
          for (const cost of full.ascension_cost ?? []) {
            const phase = cost.character_ascension_id;
            if (phase === undefined) {
              continue;
            }
            costsByAscension.set(phase, [...(costsByAscension.get(phase) ?? []), withMaterial(cost)]);
          }
          this.ascensions.set(
            [...(full.ascensions ?? [])].sort((a, b) => (a.phase ?? 0) - (b.phase ?? 0)).map((ascension: any) => ({ ...ascension, costs: costsByAscension.get(ascension.id) ?? [] })),
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

  /** One of the character's pictures by the column naming its file, the icon's name standing in for a missing one. */
  private _picture(column: string, folder: string): HeroPicture | null {
    const character = this.character();
    const name = character?.[column] ?? character?.icon_name;
    return name ? { name, folder } : null;
  }
}
