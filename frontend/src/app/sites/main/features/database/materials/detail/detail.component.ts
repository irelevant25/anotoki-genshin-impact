import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { forkJoin, of, switchMap } from 'rxjs';
import { LoaderComponent } from '../../../../../../shared/local-lib/components/loader/loader.component';
import { TranslatePipe } from '../../../../../../shared/local-lib/i18n/translate.pipe';
import { MaterialIconDirective } from '../../../../../admin/shared/material-icon.directive';
import { asList, versionLabel } from '../../shared/database-helpers';
import { MaterialApiService, MaterialUsage } from '../../../../../../api';

type UsageSection = 'characters_ascension' | 'characters_talent' | 'weapons_ascension' | 'weapons_refinement';

/** Mora is spent by 111 characters and 230 weapons; the rest is behind a button. */
const USAGE_PAGE_SIZE = 20;

@Component({
  selector: 'app-database-material-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
  imports: [RouterModule, LoaderComponent, TranslatePipe, MaterialIconDirective],
})
export class DatabaseMaterialDetailComponent {
  private readonly _materialApi = inject(MaterialApiService);
  private readonly _route = inject(ActivatedRoute);

  material = signal<any | null>(null);
  groups = signal<any[]>([]);
  usage = signal<MaterialUsage | null>(null);
  loading = signal(true);

  readonly pageSize = USAGE_PAGE_SIZE;
  /** Sections the reader has asked to see in full. */
  expanded = signal<Set<UsageSection>>(new Set());

  readonly sections: { key: UsageSection; label: string; target: 'characters' | 'weapons'; folder: string }[] = [
    { key: 'characters_ascension', label: 'database.detail.charactersAscension', target: 'characters', folder: 'character.icon' },
    { key: 'characters_talent', label: 'database.detail.charactersTalent', target: 'characters', folder: 'character.icon' },
    { key: 'weapons_ascension', label: 'database.detail.weaponsAscension', target: 'weapons', folder: 'weapons' },
    { key: 'weapons_refinement', label: 'database.detail.weaponsRefinement', target: 'weapons', folder: 'weapons' },
  ];

  versionLabel = versionLabel;

  howToObtain = computed(() => asList(this.material()?.how_to_obtain));
  rarityStars = computed(() => '★'.repeat(Number(this.material()?.rarity ?? 0)));
  groupNames = computed(() => {
    const primary = this.material()?.group;
    return [...new Set([primary, ...this.groups().map((row) => row.group)].filter((name) => !!name))];
  });
  usedAnywhere = computed(() => {
    const usage = this.usage();
    return !!usage && Object.values(usage).some((list) => list.length > 0);
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
          return forkJoin({
            full: this._materialApi.getMaterialFull(Number(id)),
            usage: this._materialApi.getMaterialUsage(Number(id)),
          });
        }),
      )
      .subscribe({
        next: (result) => {
          if (!result) {
            this.loading.set(false);
            return;
          }
          this.material.set(result.full.material ?? null);
          this.groups.set(result.full.groups ?? []);
          this.usage.set(result.usage);
          this.expanded.set(new Set());
          this.loading.set(false);
        },
        error: () => {
          this.material.set(null);
          this.loading.set(false);
        },
      });
  }

  itemsFor(section: UsageSection): any[] {
    return this.usage()?.[section] ?? [];
  }

  visibleFor(section: UsageSection): any[] {
    const items = this.itemsFor(section);
    return this.expanded().has(section) ? items : items.slice(0, USAGE_PAGE_SIZE);
  }

  hiddenCount(section: UsageSection): number {
    return Math.max(0, this.itemsFor(section).length - USAGE_PAGE_SIZE);
  }

  toggleSection(section: UsageSection): void {
    this.expanded.update((current) => {
      const next = new Set(current);
      if (!next.delete(section)) {
        next.add(section);
      }
      return next;
    });
  }
}
