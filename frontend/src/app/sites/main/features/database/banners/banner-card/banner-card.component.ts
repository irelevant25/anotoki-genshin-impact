import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@anotoki/lib/translations';
import { BadgeComponent } from '@anotoki/lib/ui/badge';
import { MaterialIconDirective } from '../../../../../admin/shared/material-icon.directive';
import { bannerKind, bannerLabel, BannerLike } from '../banner-groups';

/** A banner as the page merges it: the row, with the characters and weapons it features. */
export interface BannerWithItems extends BannerLike {
  name: string;
  icon_name: string | null;
  characters: readonly { id: number; name: string; icon_name: string | null; rarity: number | string | null }[];
  weapons: readonly { id: number; name: string; icon_name: string | null; rarity: number | string | null }[];
}

interface Featured {
  key: string;
  name: string;
  icon: string | null;
  folder: string;
  link: string[];
}

/**
 * One banner: its art, its kind as a badge, its name, and what it features -
 * the 5★ first and larger with a gold ring, the 4★ after a hairline, smaller,
 * with a purple one - each a link to its page.
 */
@Component({
  selector: 'app-banner-card',
  templateUrl: './banner-card.component.html',
  styleUrls: ['./banner-card.component.scss'],
  imports: [RouterLink, TranslatePipe, BadgeComponent, MaterialIconDirective],
})
export class BannerCardComponent {
  banner = input.required<BannerWithItems>();

  kind = computed(() => bannerKind(this.banner()));
  label = computed(() => bannerLabel(this.banner().name));

  private readonly _items = computed(() => {
    const banner = this.banner();
    const characters = banner.characters.map((character) => ({ rarity: Number(character.rarity), item: this._featured(character, 'character.icon', 'characters') }));
    const weapons = banner.weapons.map((weapon) => ({ rarity: Number(weapon.rarity), item: this._featured(weapon, 'weapons', 'weapons') }));
    return [...characters, ...weapons];
  });

  five = computed(() =>
    this._items()
      .filter((entry) => entry.rarity === 5)
      .map((entry) => entry.item),
  );
  four = computed(() =>
    this._items()
      .filter((entry) => entry.rarity !== 5)
      .map((entry) => entry.item),
  );

  private _featured(row: { id: number; name: string; icon_name: string | null }, folder: string, target: string): Featured {
    return { key: `${target}-${row.id}`, name: row.name, icon: row.icon_name, folder, link: ['../', target, String(row.id)] };
  }
}
