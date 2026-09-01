import { Component, computed, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { OptionsHelperService } from '../../../../../shared/local-lib/services/options-helper.service';
import { forkJoin } from 'rxjs';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { TranslatePipe } from '../../../../../shared/local-lib/i18n/translate.pipe';
import { DropdownComponent } from '../../../../../shared/local-lib/components/dropdown/dropdown.component';
import { TextComponent } from '../../../../../shared/local-lib/components/text/text.component';
import { LoaderComponent } from '../../../../../shared/local-lib/components/loader/loader.component';
import { MaterialIconDirective } from '../../../../admin/shared/material-icon.directive';
import { buildVersionOptions, isChosen, matchesTerm } from '../shared/database-helpers';
import { asOption, asText, bindFiltersToUrl } from '../shared/filter-url';
import { BannerApiService, CharacterApiService, WeaponApiService } from '../../../../../api';

@Component({
  selector: 'app-database-banners',
  templateUrl: './banners.component.html',
  styleUrls: ['./banners.component.scss'],
  imports: [RouterModule, ButtonComponent, TranslatePipe, DropdownComponent, TextComponent, LoaderComponent, MaterialIconDirective],
  providers: [],
})
export class DatabaseBannersComponent {
  banners = signal<any[]>([]);
  characters = signal<any[]>([]);
  weapons = signal<any[]>([]);
  loading = signal(true);

  filterVersions = signal<string | number | boolean | null | undefined>(undefined);
  filterCharacterName = signal<string | number | null | undefined>('');
  filterWeaponName = signal<string | number | null | undefined>('');

  // The key stays the raw `version` off the banner, so it can be compared
  // straight against the data; only the label gets the Luna number added.
  versionOptions = computed(() => buildVersionOptions(this.banners()));

  filteredBanners = computed(() => {
    const version = this.filterVersions();
    const characterName = String(this.filterCharacterName() ?? '')
      .trim()
      .toLowerCase();
    const weaponName = String(this.filterWeaponName() ?? '')
      .trim()
      .toLowerCase();

    return this.banners().filter((banner) => {
      if (isChosen(version) && banner.version !== version) {
        return false;
      }
      if (characterName && !(banner.characters ?? []).some((character: any) => matchesTerm(character.name, characterName))) {
        return false;
      }
      if (weaponName && !(banner.weapons ?? []).some((weapon: any) => matchesTerm(weapon.name, weaponName))) {
        return false;
      }
      return true;
    });
  });

  readonly optionsHelperService = inject(OptionsHelperService);
  private readonly _bannerApi = inject(BannerApiService);
  private readonly _characterApi = inject(CharacterApiService);
  private readonly _weaponApi = inject(WeaponApiService);

  constructor() {
    // The filters go in the URL, so coming back from a detail page finds the
    // list as it was left and the address can be handed to somebody else.
    bindFiltersToUrl({
      version: [this.filterVersions, asOption],
      character: [this.filterCharacterName, asText],
      weapon: [this.filterWeaponName, asText],
    });

    // The three lists do not depend on one another - only the merge below does -
    // so they go out together rather than one after the next.
    forkJoin({
      characters: this._characterApi.getCharacters(),
      weapons: this._weaponApi.getWeapons(),
      banners: this._bannerApi.getBannersFull(),
    }).subscribe({
      next: ({ characters, weapons, banners }) => {
        this.characters.set(characters);
        this.weapons.set(weapons);

        const charactersById = new Map(characters.map((character) => [character.id, character]));
        const weaponsById = new Map(weapons.map((weapon) => [weapon.id, weapon]));

        banners.forEach((banner) => {
          banner.characters.forEach((character: any) => {
            Object.assign(character, charactersById.get(character.character_id) ?? {});
          });
          banner.weapons.forEach((weapon: any) => {
            Object.assign(weapon, weaponsById.get(weapon.weapon_id) ?? {});
          });
        });

        this.banners.set(banners);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  resetFilters(): void {
    this.filterVersions.set(undefined);
    this.filterCharacterName.set('');
    this.filterWeaponName.set('');
  }
}
