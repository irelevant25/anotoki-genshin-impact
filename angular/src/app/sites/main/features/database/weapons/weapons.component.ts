import { Component, computed, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { DropdownComponent } from '../../../../../shared/local-lib/components/dropdown/dropdown.component';
import { TextComponent } from '../../../../../shared/local-lib/components/text/text.component';
import { LoaderComponent } from '../../../../../shared/local-lib/components/loader/loader.component';
import { TranslatePipe } from '../../../../../shared/local-lib/i18n/translate.pipe';
import { MaterialIconDirective } from '../../../../admin/shared/material-icon.directive';
import { buildVersionOptions, distinctValues, isChosen, matchesTerm, rarityValues } from '../shared/database-helpers';
import { asNumber, asOption, asText, asToggle, bindFiltersToUrl } from '../shared/filter-url';
import { WeaponApiService } from '../../../../../api';

@Component({
  selector: 'app-database-weapons',
  templateUrl: './weapons.component.html',
  styleUrls: ['./weapons.component.scss'],
  imports: [RouterModule, ButtonComponent, DropdownComponent, TextComponent, LoaderComponent, TranslatePipe, MaterialIconDirective],
})
export class DatabaseWeaponsComponent {
  private readonly _weaponApi = inject(WeaponApiService);

  weapons = signal<any[]>([]);
  loading = signal(true);

  // Toggles: clicking the one already on clears it, so null means "any".
  filterType = signal<string | null>(null);
  filterRarity = signal<number | null>(null);

  filterVersion = signal<string | number | boolean | null | undefined>(undefined);
  filterName = signal<string | number | null | undefined>('');

  types = computed(() => distinctValues(this.weapons(), 'type').sort((a, b) => a.localeCompare(b)));
  rarities = computed(() => rarityValues(this.weapons()));
  versionOptions = computed(() => buildVersionOptions(this.weapons()));

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

  constructor() {
    // The filters go in the URL, so coming back from a detail page finds the
    // list as it was left and the address can be handed to somebody else.
    bindFiltersToUrl({
      type: [this.filterType, asToggle],
      rarity: [this.filterRarity, asNumber],
      version: [this.filterVersion, asOption],
      name: [this.filterName, asText],
    });

    this._weaponApi.getWeapons().subscribe({
      next: (weapons) => {
        this.weapons.set(weapons.sort((a, b) => String(a.name).localeCompare(String(b.name))));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  toggleType(type: string): void {
    this.filterType.update((current) => (current === type ? null : type));
  }

  toggleRarity(rarity: number): void {
    this.filterRarity.update((current) => (current === rarity ? null : rarity));
  }

  resetFilters(): void {
    this.filterType.set(null);
    this.filterRarity.set(null);
    this.filterVersion.set(undefined);
    this.filterName.set('');
  }
}
