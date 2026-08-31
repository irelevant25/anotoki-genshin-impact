import { Component, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { DropdownComponent } from '../../../../../shared/local-lib/components/dropdown/dropdown.component';
import { TextComponent } from '../../../../../shared/local-lib/components/text/text.component';
import { LoaderComponent } from '../../../../../shared/local-lib/components/loader/loader.component';
import { TranslatePipe } from '../../../../../shared/local-lib/i18n/translate.pipe';
import { MaterialIconDirective } from '../../../../admin/shared/material-icon.directive';
import { buildValueOptions, buildVersionOptions, isChosen, matchesTerm, rarityValues } from '../shared/database-helpers';
import { asNumber, asOption, asText, bindFiltersToUrl } from '../shared/filter-url';

@Component({
  selector: 'app-database-materials',
  templateUrl: './materials.component.html',
  styleUrls: ['./materials.component.scss'],
  imports: [RouterModule, ButtonComponent, DropdownComponent, TextComponent, LoaderComponent, TranslatePipe, MaterialIconDirective],
})
export class DatabaseMaterialsComponent {
  private readonly _httpClient = inject(HttpClient);

  materials = signal<any[]>([]);
  loading = signal(true);

  // Clicking the rarity already on clears it, so null means "any".
  filterRarity = signal<number | null>(null);

  filterCategory = signal<string | number | boolean | null | undefined>(undefined);
  filterRegion = signal<string | number | boolean | null | undefined>(undefined);
  filterVersion = signal<string | number | boolean | null | undefined>(undefined);
  filterName = signal<string | number | null | undefined>('');

  rarities = computed(() => rarityValues(this.materials()));
  // `type` is what the old site called the category; `group` has 108 values,
  // which is a list to scroll rather than a filter to use.
  categoryOptions = computed(() => buildValueOptions(this.materials(), 'type'));
  regionOptions = computed(() => buildValueOptions(this.materials(), 'region'));
  versionOptions = computed(() => buildVersionOptions(this.materials()));

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

  constructor() {
    // The filters go in the URL, so coming back from a detail page finds the
    // list as it was left and the address can be handed to somebody else.
    bindFiltersToUrl({
      rarity: [this.filterRarity, asNumber],
      category: [this.filterCategory, asOption],
      region: [this.filterRegion, asOption],
      version: [this.filterVersion, asOption],
      name: [this.filterName, asText],
    });

    this._httpClient.get<any[]>('/api/materials').subscribe({
      next: (materials) => {
        this.materials.set(materials.sort((a, b) => String(a.name).localeCompare(String(b.name))));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  toggleRarity(rarity: number): void {
    this.filterRarity.update((current) => (current === rarity ? null : rarity));
  }

  resetFilters(): void {
    this.filterRarity.set(null);
    this.filterCategory.set(undefined);
    this.filterRegion.set(undefined);
    this.filterVersion.set(undefined);
    this.filterName.set('');
  }
}
