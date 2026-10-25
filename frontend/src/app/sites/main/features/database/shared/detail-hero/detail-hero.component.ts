import { booleanAttribute, Component, computed, inject, input } from '@angular/core';
import { TranslationService } from '@anotoki/lib/translations';
import { MaterialIconDirective } from '../../../../../admin/shared/material-icon.directive';
import { AnotokiDatePipe } from '@anotoki/lib/ui/dates';
import { rarityStars } from '../database-helpers';

/** A picture of the asset tree: its name - or a stored path, which names its own folder - and the folder to look in. */
export interface HeroPicture {
  name: string;
  folder: string;
}

/**
 * One tile of the hero's strip: a label (a translation key) and what it says -
 * words, a date written the reader's way, a picture, stars - with a quieter
 * word after it ("· 4.2").
 */
export interface HeroStat {
  /** The label as a translation key - or, `labelText`, a word shown as it is (a weapon's own stat name). */
  label?: string;
  labelText?: string;
  value?: string | number | null;
  date?: string | null;
  hint?: string | null;
  icon?: (HeroPicture & { disc?: boolean }) | null;
  stars?: number | null;
}

/**
 * The top of a detail page (the owner's choice of 2026-10-21 among the
 * mockups, "Showcase"): a picture behind the header - a character's namecard,
 * or the rarity's colour for a weapon or a material - fading into the card's
 * own ground, the art at the right, a portrait overlapping the picture where
 * there is one, then the name in the element's colour, the stars, a subtitle,
 * and the facts that identify the thing as a strip of tiles, the way the game's
 * own character screen puts them.
 */
@Component({
  selector: 'app-detail-hero',
  templateUrl: './detail-hero.component.html',
  styleUrls: ['./detail-hero.component.scss'],
  imports: [AnotokiDatePipe, MaterialIconDirective],
})
export class DetailHeroComponent {
  private readonly _i18n = inject(TranslationService);

  name = input.required<string>();
  /** The rarity: the ground's colour without a backdrop, the tint at the left, and - with `showStars` - the stars under the name. */
  rarity = input<number | null>(null);
  /** Off where the rarity colours the hero but is not the thing's own (the Profile's, borrowed from a character). */
  showStars = input(true, { transform: booleanAttribute });
  /** The line under the name: a character's title, a weapon's type. */
  subtitle = input<string | null>(null);
  /** The element whose colour the name and the backdrop's tint take ("Hydro"); none for a weapon or a material. */
  element = input<string | null>(null);
  /** The picture behind the header; without one the ground is the rarity's colour. */
  backdrop = input<HeroPicture | null>(null);
  /** The art at the right: a character's splash art, or an item's icon (`splashKind` "item": smaller and lower). */
  splash = input<HeroPicture | null>(null);
  splashKind = input<'art' | 'item'>('art');
  /** The card that overlaps the backdrop - a character's card art. */
  portrait = input<HeroPicture | null>(null);
  stats = input<HeroStat[]>([]);

  elementKey = computed(() => this.element()?.toLowerCase() ?? null);
  stars = computed(() => (this.showStars() ? rarityStars(this.rarity()) : ''));
  /** The tiles that say something, each with its label in the reader's language; one with nothing to say is not drawn. */
  tiles = computed(() =>
    this.stats()
      .filter((stat) => stat.date || stat.stars || stat.icon || (stat.value !== null && stat.value !== undefined && stat.value !== ''))
      .map((stat) => ({ ...stat, text: stat.labelText ?? (stat.label ? this._i18n.t(stat.label) : '') })),
  );

  starsOf(count: number | null | undefined): string {
    return rarityStars(count);
  }
}
