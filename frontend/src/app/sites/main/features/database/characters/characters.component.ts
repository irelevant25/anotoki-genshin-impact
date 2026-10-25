import { Component, computed, inject, signal } from '@angular/core';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { SelectComponent, TextFieldComponent } from '@anotoki/lib/ui/forms';
import { IconComponent } from '@anotoki/lib/ui/icon';
import { SegmentedComponent } from '@anotoki/lib/ui/segmented';
import { TranslatePipe, TranslationService } from '@anotoki/lib/translations';
import { LoaderComponent } from '../../../../../shared/local-lib/components/loader/loader.component';
import { MaterialIconDirective } from '../../../../admin/shared/material-icon.directive';
import { Character, Expanded } from '../../../../../api';
import { buildValueOptions, buildVersionOptions, distinctValues, isChosen, pluralTail, rarityColour, rarityValues } from '../shared/database-helpers';
import { matchesSearch } from '@anotoki/lib/ui/search';
import { asNumber, asOneOf, asText, asToggle, bindFiltersToUrl } from '../shared/filter-url';
import { FacetOption, FacetTrackComponent } from '../shared/facet-track/facet-track.component';
import { ListTileComponent } from '../shared/list-tile/list-tile.component';
import { ELEMENT_ORDER, GroupKey, groupRows, inGameOrder, WEAPON_TYPE_ORDER } from '../shared/list-groups';
import { GameListsService } from '../../../game-lists.service';

type CharacterRow = Expanded<Character, 'created_by' | 'updated_by'>;

/** How this list can be grouped, the first the default. */
const GROUPINGS: readonly GroupKey[] = ['version', 'region', 'none'];

/**
 * The characters list (the owner's choice "E" of 2026-10-21 among the
 * mockups): the elements as a wide track with names and counts, the other
 * facets under it, and the characters as tiles in sections by region - or
 * by version, or in one grid - newest first within each.
 */
@Component({
  selector: 'app-database-characters',
  templateUrl: './characters.component.html',
  styleUrls: ['./characters.component.scss'],
  imports: [ButtonComponent, SelectComponent, TextFieldComponent, IconComponent, SegmentedComponent, LoaderComponent, TranslatePipe, MaterialIconDirective, FacetTrackComponent, ListTileComponent],
})
export class DatabaseCharactersComponent {
  private readonly _lists = inject(GameListsService);
  private readonly _i18n = inject(TranslationService);

  characters = signal<CharacterRow[]>([]);
  loading = signal(true);

  // Toggles: clicking the one already on clears it, so null means "any".
  filterElement = signal<string | null>(null);
  filterWeaponType = signal<string | null>(null);
  filterRarity = signal<number | null>(null);

  filterRegion = signal('');
  filterVersion = signal('');
  filterName = signal('');

  groupBy = signal<GroupKey>(GROUPINGS[0]);

  /** The elements in the game's order, each with its glyph, its count and its own colours; 'Adaptive' is the Traveler's placeholder, not an element. */
  elementOptions = computed<FacetOption[]>(() => {
    const rows = this.characters();
    const elements = inGameOrder(distinctValues(rows, 'element'), ELEMENT_ORDER).filter((element) => element !== 'Adaptive');
    return elements.map((element) => ({
      value: element,
      label: element,
      picture: { name: element, folder: 'elements' },
      count: rows.filter((character) => character.element === element).length,
      ring: `var(--${element.toLowerCase()}-secondary-white)`,
      ink: `var(--${element.toLowerCase()}-text)`,
    }));
  });

  weaponOptions = computed<FacetOption[]>(() =>
    inGameOrder(distinctValues(this.characters(), 'weapon_type'), WEAPON_TYPE_ORDER).map((type) => ({
      value: type,
      label: type,
      picture: { name: type, folder: 'weapon_types' },
    })),
  );

  rarityOptions = computed<FacetOption[]>(() => rarityValues(this.characters()).map((rarity) => ({ value: rarity, label: String(rarity), words: true, star: rarityColour(rarity) })));

  regionOptions = computed(() => buildValueOptions(this.characters(), 'region'));
  versionOptions = computed(() => buildVersionOptions(this.characters()));

  groupChoices = computed(() => GROUPINGS.map((key) => ({ value: key, label: this._i18n.t(`database.filters.group.${key}`) })));

  filteredCharacters = computed(() => {
    const element = this.filterElement();
    const weaponType = this.filterWeaponType();
    const rarity = this.filterRarity();
    const region = this.filterRegion();
    const version = this.filterVersion();
    const name = String(this.filterName() ?? '')
      .trim()
      .toLowerCase();

    return this.characters()
      .filter((character) => {
        if (element && character.element !== element) {
          return false;
        }
        if (weaponType && character.weapon_type !== weaponType) {
          return false;
        }
        if (rarity !== null && Number(character.rarity) !== rarity) {
          return false;
        }
        if (isChosen(region) && character.region !== region) {
          return false;
        }
        if (isChosen(version) && character.version !== version) {
          return false;
        }
        return !name || matchesSearch(String(character.name ?? ''), name);
      })
      .sort((a, b) => {
        const releasedA = a.release_date ?? '';
        const releasedB = b.release_date ?? '';
        if (releasedA !== releasedB) {
          if (!releasedA) {
            return 1;
          }
          if (!releasedB) {
            return -1;
          }
          return releasedB.localeCompare(releasedA);
        }
        return String(a.name).localeCompare(String(b.name));
      });
  });

  /** The filtered characters in sections, by what the reader groups them by. */
  groups = computed(() => groupRows(this.filteredCharacters(), this.groupBy()));

  constructor() {
    // The filters go in the URL, so coming back from a detail page finds the
    // list as it was left and the address can be handed to somebody else.
    bindFiltersToUrl({
      element: [this.filterElement, asToggle],
      weapon: [this.filterWeaponType, asToggle],
      rarity: [this.filterRarity, asNumber],
      region: [this.filterRegion, asText],
      version: [this.filterVersion, asText],
      name: [this.filterName, asText],
      group: [this.groupBy, asOneOf(GROUPINGS, GROUPINGS[0])],
    });

    this._lists.characters().subscribe({
      next: (characters) => {
        this.characters.set(characters);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  /** The counted sentence for n characters - one of its three forms, by the reader's language. */
  countKey(count: number): string {
    return `database.characters.count.${pluralTail(count, this._i18n.language())}`;
  }

  setGroupBy(key: string): void {
    if ((GROUPINGS as readonly string[]).includes(key)) {
      this.groupBy.set(key as GroupKey);
    }
  }

  resetFilters(): void {
    this.filterElement.set(null);
    this.filterWeaponType.set(null);
    this.filterRarity.set(null);
    this.filterRegion.set('');
    this.filterVersion.set('');
    this.filterName.set('');
  }
}
