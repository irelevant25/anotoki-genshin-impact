import { Component, computed, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { SelectComponent, TextFieldComponent } from '@anotoki/lib/ui/forms';
import { LoaderComponent } from '../../../../../shared/local-lib/components/loader/loader.component';
import { TranslatePipe } from '@anotoki/lib/translations';
import { MaterialIconDirective } from '../../../../admin/shared/material-icon.directive';
import { buildValueOptions, buildVersionOptions, distinctValues, isChosen, matchesTerm, rarityValues } from '../shared/database-helpers';
import { asNumber, asText, asToggle, bindFiltersToUrl } from '../shared/filter-url';
import { CharacterApiService } from '../../../../../api';

@Component({
  selector: 'app-database-characters',
  templateUrl: './characters.component.html',
  styleUrls: ['./characters.component.scss'],
  imports: [RouterModule, ButtonComponent, SelectComponent, TextFieldComponent, LoaderComponent, TranslatePipe, MaterialIconDirective],
})
export class DatabaseCharactersComponent {
  private readonly _characterApi = inject(CharacterApiService);

  characters = signal<any[]>([]);
  loading = signal(true);

  // Toggles: clicking the one already on clears it, so null means "any".
  filterElement = signal<string | null>(null);
  filterWeaponType = signal<string | null>(null);
  filterRarity = signal<number | null>(null);

  filterRegion = signal('');
  filterVersion = signal('');
  filterName = signal('');

  elements = computed(() =>
    distinctValues(this.characters(), 'element')
      .filter((x) => x !== 'Adaptive')
      .sort((a, b) => a.localeCompare(b)),
  );
  weaponTypes = computed(() => distinctValues(this.characters(), 'weapon_type').sort((a, b) => a.localeCompare(b)));
  rarities = computed(() => rarityValues(this.characters()));
  regionOptions = computed(() => buildValueOptions(this.characters(), 'region'));
  versionOptions = computed(() => buildVersionOptions(this.characters()));

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
        return !name || matchesTerm(character.name, name);
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
    });

    this._characterApi.getCharacters().subscribe({
      next: (characters) => {
        this.characters.set(characters);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  toggleElement(element: string): void {
    this.filterElement.update((current) => (current === element ? null : element));
  }

  toggleWeaponType(weaponType: string): void {
    this.filterWeaponType.update((current) => (current === weaponType ? null : weaponType));
  }

  toggleRarity(rarity: number): void {
    this.filterRarity.update((current) => (current === rarity ? null : rarity));
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
