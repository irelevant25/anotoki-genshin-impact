import { Component, computed, inject, signal } from '@angular/core';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { SelectComponent, TextFieldComponent } from '@anotoki/lib/ui/forms';
import { IconComponent } from '@anotoki/lib/ui/icon';
import { SegmentedComponent } from '@anotoki/lib/ui/segmented';
import { TranslatePipe, TranslationService } from '@anotoki/lib/translations';
import { LoaderComponent } from '../../../../../shared/local-lib/components/loader/loader.component';
import { Expanded, Material } from '../../../../../api';
import { buildValueOptions, buildVersionOptions, isChosen, matchesTerm, pluralTail, rarityValues } from '../shared/database-helpers';
import { asNumber, asOneOf, asText, bindFiltersToUrl } from '../shared/filter-url';
import { FacetOption, FacetTrackComponent } from '../shared/facet-track/facet-track.component';
import { ListTileComponent } from '../shared/list-tile/list-tile.component';
import { GroupKey, groupRows } from '../shared/list-groups';
import { MaterialIconDirective } from '../../../../admin/shared/material-icon.directive';
import { GameListsService } from '../../../game-lists.service';

type MaterialRow = Expanded<Material, 'created_by' | 'updated_by'>;

/** How this list can be grouped, the first the default (never by category - the owner's word of 2026-10-21). */
const GROUPINGS: readonly GroupKey[] = ['version', 'region', 'none'];

/**
 * The materials list, in the characters list's system (the owner's choice
 * "E" of 2026-10-21): the rarities as a wide track with counts, the category,
 * the region and the version under it, and the materials as tiles in sections
 * by region - or by version, or in one grid - A to Z within each.
 */
@Component({
  selector: 'app-database-materials',
  templateUrl: './materials.component.html',
  styleUrls: ['./materials.component.scss'],
  imports: [ButtonComponent, SelectComponent, TextFieldComponent, IconComponent, SegmentedComponent, LoaderComponent, TranslatePipe, MaterialIconDirective, FacetTrackComponent, ListTileComponent],
})
export class DatabaseMaterialsComponent {
  private readonly _lists = inject(GameListsService);
  private readonly _i18n = inject(TranslationService);

  materials = signal<MaterialRow[]>([]);
  loading = signal(true);

  // Clicking the rarity already on clears it, so null means "any".
  filterRarity = signal<number | null>(null);

  filterCategory = signal('');
  filterRegion = signal('');
  filterVersion = signal('');
  filterName = signal('');

  groupBy = signal<GroupKey>(GROUPINGS[0]);

  /** The rarities present, the highest first, each as its stars with its count; a material without one counts under All alone. */
  rarityOptions = computed<FacetOption[]>(() => {
    const rows = this.materials();
    return rarityValues(rows).map((rarity) => ({
      value: rarity,
      label: `${rarity}★`,
      stars: rarity,
      words: false,
      count: rows.filter((material) => Number(material.rarity) === rarity).length,
    }));
  });

  // `type` is what the old site called the category; `group` has 108 values,
  // which is a list to scroll rather than a filter to use.
  categoryOptions = computed(() => buildValueOptions(this.materials(), 'type'));
  regionOptions = computed(() => buildValueOptions(this.materials(), 'region'));
  versionOptions = computed(() => buildVersionOptions(this.materials()));

  groupChoices = computed(() => GROUPINGS.map((key) => ({ value: key, label: this._i18n.t(`database.filters.group.${key}`) })));

  filteredMaterials = computed(() => {
    const rarity = this.filterRarity();
    const category = this.filterCategory();
    const region = this.filterRegion();
    const version = this.filterVersion();
    const name = String(this.filterName() ?? '')
      .trim()
      .toLowerCase();

    return this.materials().filter((material) => {
      if (rarity !== null && Number(material.rarity) !== rarity) {
        return false;
      }
      if (isChosen(category) && material.type !== category) {
        return false;
      }
      if (isChosen(region) && material.region !== region) {
        return false;
      }
      if (isChosen(version) && material.version !== version) {
        return false;
      }
      return !name || matchesTerm(material.name, name);
    });
  });

  /** The filtered materials in sections, by what the reader groups them by. */
  groups = computed(() => groupRows(this.filteredMaterials(), this.groupBy()));

  constructor() {
    // The filters go in the URL, so coming back from a detail page finds the
    // list as it was left and the address can be handed to somebody else.
    bindFiltersToUrl({
      rarity: [this.filterRarity, asNumber],
      category: [this.filterCategory, asText],
      region: [this.filterRegion, asText],
      version: [this.filterVersion, asText],
      name: [this.filterName, asText],
      group: [this.groupBy, asOneOf(GROUPINGS, GROUPINGS[0])],
    });

    this._lists.materials().subscribe({
      next: (materials) => {
        // A copy: the list is shared with every page that asked for it (GameListsService).
        this.materials.set([...materials].sort((a, b) => String(a.name).localeCompare(String(b.name))));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  /** The counted sentence for n materials - one of its three forms, by the reader's language. */
  countKey(count: number): string {
    return `database.materials.count.${pluralTail(count, this._i18n.language())}`;
  }

  setGroupBy(key: string): void {
    if ((GROUPINGS as readonly string[]).includes(key)) {
      this.groupBy.set(key as GroupKey);
    }
  }

  resetFilters(): void {
    this.filterRarity.set(null);
    this.filterCategory.set('');
    this.filterRegion.set('');
    this.filterVersion.set('');
    this.filterName.set('');
  }
}
