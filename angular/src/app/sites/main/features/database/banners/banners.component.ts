import { Component, computed, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { OptionsHelperService } from '../../../../../shared/local-lib/services/options-helper.service';
import { HttpClient } from '@angular/common/http';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { TranslatePipe } from '../../../../../shared/local-lib/i18n/translate.pipe';
import { DropdownComponent } from "../../../../../shared/local-lib/components/dropdown/dropdown.component";
import { TextComponent } from "../../../../../shared/local-lib/components/text/text.component";
import { LoaderComponent } from '../../../../../shared/local-lib/components/loader/loader.component';
import { MaterialIconDirective } from '../../../../admin/shared/material-icon.directive';

/** Sorts version strings numerically ("1.10" after "1.9"), newest first. */
function compareVersionsDesc(a: string, b: string): number {
  const left = a.split('.').map(Number);
  const right = b.split('.').map(Number);
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    const diff = (right[i] ?? 0) - (left[i] ?? 0);
    if (diff) {
      return diff;
    }
  }
  return 0;
}

@Component({
  selector: 'app-database-banners',
  templateUrl: './banners.component.html',
  styleUrls: ['./banners.component.scss'],
  imports: [RouterModule, ButtonComponent, TranslatePipe, DropdownComponent, TextComponent, LoaderComponent, MaterialIconDirective],
  providers: []
})
export class DatabaseBannersComponent {
  banners = signal<any[]>([]);
  characters = signal<any[]>([]);
  weapons = signal<any[]>([]);
  loading = signal(true);

  filterVersions = signal<string | number | boolean | null | undefined>(undefined);
  filterCharacterName = signal<string | number | null | undefined>('');

  versionOptions = computed(() => this._distinct('version').sort(compareVersionsDesc));

  constructor(public readonly optionsHelperService: OptionsHelperService, private readonly _httpClient: HttpClient) {
    this._httpClient.get('/api/characters').subscribe((characters) => {
      this.characters.set(characters as any[]);
      this._httpClient.get('/api/weapons').subscribe((weapons) => {
        this.weapons.set(weapons as any[]);
        this._httpClient.get('/api/banners/full').subscribe((banners) => {
          (banners as any[]).forEach((banner) => {
            banner.characters.forEach((character: any) => {
              const characterData = this.characters().find((c) => c.id === character.character_id);
              if (characterData) {
                Object.assign(character, characterData);
              }
            });
            banner.weapons.forEach((weapon: any) => {
              const weaponData = this.weapons().find((w) => w.id === weapon.weapon_id);
              if (weaponData) {
                Object.assign(weapon, weaponData);
              }
            });
          });
          this.banners.set(banners as any[]);
          this.loading.set(false);
          console.log('banners', this.banners());
        });
      });
    });
  }

  resetFilters(): void {
    this.filterVersions.set(undefined);
    this.filterCharacterName.set('');
  }

  private _distinct(field: string): string[] {
    const values = this.banners()
      .map((banner) => banner[field])
      .filter((value) => value !== null && value !== undefined && value !== '')
      .map((value) => String(value));
    return [...new Set(values)].sort();
  }
}
