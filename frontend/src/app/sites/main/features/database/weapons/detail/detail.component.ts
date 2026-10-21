import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, of, switchMap } from 'rxjs';
import { LoaderComponent } from '../../../../../../shared/local-lib/components/loader/loader.component';
import { TranslatePipe, TranslationService } from '@anotoki/lib/translations';
import { CardComponent } from '@anotoki/lib/ui/card';
import { SegmentedComponent, SegmentedOption } from '@anotoki/lib/ui/segmented';
import { asList, versionLabel, withMaterialFrom } from '../../shared/database-helpers';
import { WeaponApiService } from '../../../../../../api';
import { GameListsService } from '../../../../game-lists.service';
import { DetailHeroComponent, HeroPicture, HeroStat } from '../../shared/detail-hero/detail-hero.component';
import { MaterialTileComponent } from '../../shared/material-tile/material-tile.component';

/**
 * A weapon's page: the hero in its rarity's colour with the art at the right
 * and the strip of facts, the Refinements and Effects cards, then the
 * ascension table - the same bones as the character's page (the owner's
 * choice of 2026-10-21 among the mockups, "Showcase").
 */
@Component({
  selector: 'app-database-weapon-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
  imports: [LoaderComponent, TranslatePipe, CardComponent, SegmentedComponent, DetailHeroComponent, MaterialTileComponent],
})
export class DatabaseWeaponDetailComponent {
  private readonly _weaponApi = inject(WeaponApiService);
  private readonly _lists = inject(GameListsService);
  private readonly _route = inject(ActivatedRoute);
  private readonly _i18n = inject(TranslationService);

  weapon = signal<any | null>(null);
  refinements = signal<any[]>([]);
  ascensions = signal<any[]>([]);
  loading = signal(true);

  /** Which refinement level the text under the chooser is showing. */
  selectedRefinement = signal(0);

  effects = computed(() => asList(this.weapon()?.effects));
  howToObtain = computed(() => asList(this.weapon()?.how_to_obtain));
  refinement = computed(() => this.refinements()[this.selectedRefinement()]);

  /** The levels as the kit's segmented control takes them. */
  refinementOptions = computed<SegmentedOption[]>(() => this.refinements().map((_, index) => ({ value: String(index), label: String(index + 1) })));
  refinementValue = computed(() => String(this.selectedRefinement()));

  /** The row of level 1, where the base stats are read. */
  baseRow = computed(() => this.ascensions().find((ascension) => ascension.phase === 0) ?? this.ascensions()[0] ?? null);

  splash = computed<HeroPicture | null>(() => {
    const weapon = this.weapon();
    return weapon ? { name: weapon.icon_name ?? weapon.name, folder: 'weapons' } : null;
  });

  /** The strip of tiles under the name: what identifies the weapon at a glance. */
  heroStats = computed<HeroStat[]>(() => {
    const weapon = this.weapon();
    if (!weapon) {
      return [];
    }
    const base = this.baseRow();
    const level = base?.start_level_from ?? 1;
    return [
      { label: 'database.detail.type', value: weapon.type, icon: weapon.type ? { name: weapon.type, folder: 'weapon_types', disc: true } : null },
      { label: 'database.detail.baseAtk', value: base?.primary_stat_value, hint: base ? this._i18n.t('database.detail.atLevel', { level }) : null },
      // The secondary stat is named by the weapon itself ("Crit DMG %"), not by a key of the site's.
      { labelText: weapon.secondary_stat ?? this._i18n.t('database.detail.secondaryStat'), value: base?.secondary_stat_value },
      { label: 'database.detail.released', date: weapon.release_date, hint: weapon.version ? versionLabel(weapon.version) : null },
      { label: 'database.detail.obtained', value: this.howToObtain()[0] ?? null },
    ];
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
          // The costs name a material by id only, so the material list comes
          // along to give each one a name and an icon - asked once a page life
          // (GameListsService), so the next weapon has it already.
          return forkJoin({
            full: this._weaponApi.getWeaponFull(Number(id)),
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

          this.weapon.set(result.full.weapon ?? null);
          this.refinements.set((result.full.refinements ?? []).map(withMaterial));
          // By phase: the rows come as they were saved, and a table read top to bottom wants level 1 first.
          this.ascensions.set(
            [...(result.full.ascensions ?? [])]
              .sort((a: any, b: any) => (a.phase ?? 0) - (b.phase ?? 0))
              .map((ascension: any) => ({
                ...ascension,
                costs: (ascension.costs ?? []).map(withMaterial),
              })),
          );
          this.selectedRefinement.set(0);
          this.loading.set(false);
        },
        error: () => {
          this.weapon.set(null);
          this.loading.set(false);
        },
      });
  }

  pickRefinement(value: string): void {
    this.selectedRefinement.set(Number(value) || 0);
  }
}
