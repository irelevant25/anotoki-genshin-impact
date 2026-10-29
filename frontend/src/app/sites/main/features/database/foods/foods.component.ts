import { Component, computed, inject, signal } from '@angular/core';
import { catchError, forkJoin, of } from 'rxjs';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { SelectComponent, TextFieldComponent } from '@anotoki/lib/ui/forms';
import { IconComponent } from '@anotoki/lib/ui/icon';
import { SegmentedComponent } from '@anotoki/lib/ui/segmented';
import { TranslatePipe, TranslationService } from '@anotoki/lib/translations';
import { matchesSearch } from '@anotoki/lib/ui/search';
import { LoaderComponent } from '../../../../../shared/local-lib/components/loader/loader.component';
import { MaterialIconDirective } from '../../../../admin/shared/material-icon.directive';
import { Expanded, Food } from '../../../../../api';
import { buildValueOptions, buildVersionOptions, distinctValues, isChosen, pluralTail, rarityColour, rarityValues } from '../shared/database-helpers';
import { asNumber, asOneOf, asText, asToggle, bindFiltersToUrl } from '../shared/filter-url';
import { FacetOption, FacetTrackComponent } from '../shared/facet-track/facet-track.component';
import { ListTileComponent } from '../shared/list-tile/list-tile.component';
import { GroupKey, groupRows, inGameOrder } from '../shared/list-groups';
import { GameListsService } from '../../../game-lists.service';
import { byName, Cook, cooksByDish, FOOD_TYPE_ORDER, trackLabel } from './food-dishes';

/** A food as the list reads it, with the character whose special dish it is. */
type FoodRow = Expanded<Food, 'created_by' | 'updated_by'> & { cook: Cook | null };

/** How this list can be grouped, the first the default - the newest first, as the other lists open. */
const GROUPINGS: readonly GroupKey[] = ['version', 'region', 'rarity', 'none'];

/**
 * The food, in the characters list's system (the owner's choice "E" of
 * 2026-10-21): the types as a wide track with their pictures and counts, the
 * rarity, the region and the version under it, and the foods as tiles - the
 * normal dish's picture, a special dish's character - in sections by version,
 * or by region or rarity, or in one grid, A to Z within each. A deleted food
 * is not listed.
 */
@Component({
  selector: 'app-database-foods',
  templateUrl: './foods.component.html',
  styleUrls: ['./foods.component.scss'],
  imports: [ButtonComponent, SelectComponent, TextFieldComponent, IconComponent, SegmentedComponent, LoaderComponent, TranslatePipe, MaterialIconDirective, FacetTrackComponent, ListTileComponent],
})
export class DatabaseFoodsComponent {
  private readonly _lists = inject(GameListsService);
  private readonly _i18n = inject(TranslationService);

  foods = signal<FoodRow[]>([]);
  loading = signal(true);

  // Toggles: clicking the one already on clears it, so null means "any".
  filterType = signal<string | null>(null);
  filterRarity = signal<number | null>(null);

  filterRegion = signal('');
  filterVersion = signal('');
  filterName = signal('');

  groupBy = signal<GroupKey>(GROUPINGS[0]);

  /** The types in the game's order, each with its picture and its count - named without their "Dishes" (trackLabel). */
  typeOptions = computed<FacetOption[]>(() => {
    const rows = this.foods();
    return inGameOrder(distinctValues(rows, 'type'), FOOD_TYPE_ORDER).map((type) => ({
      value: type,
      label: trackLabel(type),
      picture: { name: type, folder: 'food_type' },
      count: rows.filter((food) => food.type === type).length,
    }));
  });

  rarityOptions = computed<FacetOption[]>(() => rarityValues(this.foods()).map((rarity) => ({ value: rarity, label: String(rarity), words: true, star: rarityColour(rarity) })));

  regionOptions = computed(() => buildValueOptions(this.foods(), 'region'));
  versionOptions = computed(() => buildVersionOptions(this.foods()));

  groupChoices = computed(() => GROUPINGS.map((key) => ({ value: key, label: this._i18n.t(`database.filters.group.${key}`) })));

  filteredFoods = computed(() => {
    const type = this.filterType();
    const rarity = this.filterRarity();
    const region = this.filterRegion();
    const version = this.filterVersion();
    const name = String(this.filterName() ?? '')
      .trim()
      .toLowerCase();

    return this.foods().filter((food) => {
      if (type && food.type !== type) {
        return false;
      }
      if (rarity !== null && Number(food.rarity) !== rarity) {
        return false;
      }
      if (isChosen(region) && food.region !== region) {
        return false;
      }
      if (isChosen(version) && food.version !== version) {
        return false;
      }
      return !name || matchesSearch(String(food.name ?? ''), name);
    });
  });

  /** The filtered foods in sections, by what the reader groups them by. */
  groups = computed(() => groupRows(this.filteredFoods(), this.groupBy()));

  constructor() {
    // The filters go in the URL, so coming back from a food's page finds the
    // list as it was left and the address can be handed to somebody else.
    bindFiltersToUrl({
      type: [this.filterType, asToggle],
      rarity: [this.filterRarity, asNumber],
      region: [this.filterRegion, asText],
      version: [this.filterVersion, asText],
      name: [this.filterName, asText],
      group: [this.groupBy, asOneOf(GROUPINGS, GROUPINGS[0])],
    });

    // The characters only mark the special dishes: a list that fails costs the
    // marks, never the foods.
    forkJoin({
      foods: this._lists.foods(),
      characters: this._lists.charactersMinimal().pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ foods, characters }) => {
        const cooks = cooksByDish(characters);
        // New rows, never the list's own: it is shared with every page that asked for it (GameListsService).
        this.foods.set(
          foods
            .filter((food) => !food.deleted)
            .map((food) => ({ ...food, cook: cooks.get(food.id) ?? null }))
            .sort(byName),
        );
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  /** The counted sentence for n foods - one of its three forms, by the reader's language. */
  countKey(count: number): string {
    return `database.foods.count.${pluralTail(count, this._i18n.language())}`;
  }

  setGroupBy(key: string): void {
    if ((GROUPINGS as readonly string[]).includes(key)) {
      this.groupBy.set(key as GroupKey);
    }
  }

  resetFilters(): void {
    this.filterType.set(null);
    this.filterRarity.set(null);
    this.filterRegion.set('');
    this.filterVersion.set('');
    this.filterName.set('');
  }
}
