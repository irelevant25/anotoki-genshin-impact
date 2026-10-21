import { Component, computed, inject, signal } from '@angular/core';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { SelectComponent, TextFieldComponent } from '@anotoki/lib/ui/forms';
import { IconComponent } from '@anotoki/lib/ui/icon';
import { SegmentedComponent } from '@anotoki/lib/ui/segmented';
import { TranslatePipe, TranslationService } from '@anotoki/lib/translations';
import { LoaderComponent } from '../../../../../shared/local-lib/components/loader/loader.component';
import { MaterialIconDirective } from '../../../../admin/shared/material-icon.directive';
import { Expanded, Weapon } from '../../../../../api';
import { buildVersionOptions, distinctValues, isChosen, matchesTerm, pluralTail, rarityColour, rarityStars, rarityValues } from '../shared/database-helpers';
import { asNumber, asOneOf, asText, asToggle, bindFiltersToUrl } from '../shared/filter-url';
import { FacetOption, FacetTrackComponent } from '../shared/facet-track/facet-track.component';
import { ListTileComponent } from '../shared/list-tile/list-tile.component';
import { GroupKey, groupRows, inGameOrder, WEAPON_TYPE_ORDER } from '../shared/list-groups';
import { GameListsService } from '../../../game-lists.service';

type WeaponRow = Expanded<Weapon, 'created_by' | 'updated_by'>;

/** How this list can be grouped, the first the default. */
const GROUPINGS: readonly GroupKey[] = ['rarity', 'version', 'none'];

/**
 * The weapons list, in the characters list's system (the owner's choice "E"
 * of 2026-10-21): the types as a wide track with names and counts, the rarity
 * and the version under it, and the weapons as tiles in sections by rarity -
 * or by version, or in one grid - A to Z within each.
 */
@Component({
  selector: 'app-database-weapons',
  templateUrl: './weapons.component.html',
  styleUrls: ['./weapons.component.scss'],
  imports: [ButtonComponent, SelectComponent, TextFieldComponent, IconComponent, SegmentedComponent, LoaderComponent, TranslatePipe, MaterialIconDirective, FacetTrackComponent, ListTileComponent],
})
export class DatabaseWeaponsComponent {
  private readonly _lists = inject(GameListsService);
  private readonly _i18n = inject(TranslationService);

  weapons = signal<WeaponRow[]>([]);
  loading = signal(true);

  // Toggles: clicking the one already on clears it, so null means "any".
  filterType = signal<string | null>(null);
  filterRarity = signal<number | null>(null);

  filterVersion = signal('');
  filterName = signal('');

  groupBy = signal<GroupKey>(GROUPINGS[0]);

  rarityStars = rarityStars;

  /** The types in the game's order, each with its coin and its count. */
  typeOptions = computed<FacetOption[]>(() => {
    const rows = this.weapons();
    return inGameOrder(distinctValues(rows, 'type'), WEAPON_TYPE_ORDER).map((type) => ({
      value: type,
      label: type,
      picture: { name: type, folder: 'weapon_types' },
      count: rows.filter((weapon) => weapon.type === type).length,
    }));
  });

  rarityOptions = computed<FacetOption[]>(() => rarityValues(this.weapons()).map((rarity) => ({ value: rarity, label: `${rarity}★`, words: true, star: rarityColour(rarity) })));

  versionOptions = computed(() => buildVersionOptions(this.weapons()));

  groupChoices = computed(() => GROUPINGS.map((key) => ({ value: key, label: this._i18n.t(`database.filters.group.${key}`) })));

  filteredWeapons = computed(() => {
    const type = this.filterType();
    const rarity = this.filterRarity();
    const version = this.filterVersion();
    const name = String(this.filterName() ?? '')
      .trim()
      .toLowerCase();

    return this.weapons().filter((weapon) => {
      if (type && weapon.type !== type) {
        return false;
      }
      if (rarity !== null && Number(weapon.rarity) !== rarity) {
        return false;
      }
      if (isChosen(version) && weapon.version !== version) {
        return false;
      }
      return !name || matchesTerm(weapon.name, name);
    });
  });

  /** The filtered weapons in sections, by what the reader groups them by. */
  groups = computed(() => groupRows(this.filteredWeapons(), this.groupBy()));

  constructor() {
    // The filters go in the URL, so coming back from a detail page finds the
    // list as it was left and the address can be handed to somebody else.
    bindFiltersToUrl({
      type: [this.filterType, asToggle],
      rarity: [this.filterRarity, asNumber],
      version: [this.filterVersion, asText],
      name: [this.filterName, asText],
      group: [this.groupBy, asOneOf(GROUPINGS, GROUPINGS[0])],
    });

    this._lists.weapons().subscribe({
      next: (weapons) => {
        // A copy: the list is shared with every page that asked for it (GameListsService).
        this.weapons.set([...weapons].sort((a, b) => String(a.name).localeCompare(String(b.name))));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  /** The counted sentence for n weapons - one of its three forms, by the reader's language. */
  countKey(count: number): string {
    return `database.weapons.count.${pluralTail(count, this._i18n.language())}`;
  }

  setGroupBy(key: string): void {
    if ((GROUPINGS as readonly string[]).includes(key)) {
      this.groupBy.set(key as GroupKey);
    }
  }

  /** The line under a weapon's name: its stats, "ATK · CRIT DMG". */
  subtitle(weapon: WeaponRow): string | null {
    const stats = [weapon.primary_stat, weapon.secondary_stat].filter((stat) => !!stat);
    return stats.length ? stats.join(' · ') : null;
  }

  resetFilters(): void {
    this.filterType.set(null);
    this.filterRarity.set(null);
    this.filterVersion.set('');
    this.filterName.set('');
  }
}
