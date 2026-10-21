import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationService } from '@anotoki/lib/translations';
import { TooltipDirective } from '@anotoki/lib/ui/tooltip';
import { MaterialIconDirective } from '../../../../../admin/shared/material-icon.directive';

/**
 * A picture on its rarity's ground with a count on its corner - a material a
 * phase costs, a weapon a material goes into - small in a table's row, where
 * its name is a tooltip, or large in a grid, with its name under it. One piece
 * for the five places that drew their own: both character tabs, the weapon
 * page and the material page.
 */
@Component({
  selector: 'app-material-tile',
  templateUrl: './material-tile.component.html',
  styleUrls: ['./material-tile.component.scss'],
  imports: [RouterLink, TooltipDirective, MaterialIconDirective],
})
export class MaterialTileComponent {
  private readonly _i18n = inject(TranslationService);

  name = input.required<string>();
  /** The picture's name in `folder` - or a stored path, which names its own folder; the name itself when there is none. */
  icon = input<string | null | undefined>(null);
  folder = input<string>('materials');
  rarity = input<number | string | null | undefined>(null);
  quantity = input<number | null | undefined>(null);
  /** Where the tile leads: a router link's commands, relative to the page it is on. */
  link = input<any[] | null>(null);
  /** `sm` in a table's row, the name as a tooltip; `lg` in a grid, the name under the picture. */
  size = input<'sm' | 'lg'>('sm');

  /** The count written the reader's way ("×420 000"), or nothing for a tile that is not a cost. */
  count = computed(() => {
    const quantity = this.quantity();
    return quantity === null || quantity === undefined ? null : `×${Number(quantity).toLocaleString(this._i18n.locale())}`;
  });

  tooltip = computed(() => (this.size() === 'sm' ? this.name() : null));
  label = computed(() => (this.count() ? `${this.name()} ${this.count()}` : this.name()));
}
