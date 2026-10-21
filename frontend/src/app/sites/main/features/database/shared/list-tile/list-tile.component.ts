import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MaterialIconDirective } from '../../../../../admin/shared/material-icon.directive';

/** A picture by name, in a folder under assets/ the icon directive resolves (a stored path is taken as it is). */
export interface TilePicture {
  name: string;
  folder: string;
}

/**
 * A row of a database list as a landscape tile (the owner's choice "E" of
 * 2026-10-21 among the mockups): the picture on the rarity's ground at the
 * left, the name, a line under it and the facts the page projects, the
 * version it came in top right - and behind it all a character's namecard
 * veiled towards the surface, or a faint tint of the element or the rarity
 * where there is no namecard. Every colour a token, so the dark theme reads
 * as the light.
 */
@Component({
  selector: 'app-list-tile',
  templateUrl: './list-tile.component.html',
  styleUrls: ['./list-tile.component.scss'],
  imports: [RouterLink, MaterialIconDirective],
})
export class ListTileComponent {
  /** Where the tile leads, as routerLink commands. */
  link = input.required<unknown[]>();
  name = input.required<string>();
  subtitle = input<string | null>(null);
  picture = input.required<TilePicture>();
  rarity = input<number | string | null>(null);
  version = input<string | null>(null);
  /** A picture behind the tile - a character's namecard - veiled towards the surface. */
  backdrop = input<TilePicture | null>(null);
  /** Without a backdrop: the tint behind the tile, the element's or the rarity's. */
  tint = input<'element' | 'rarity'>('rarity');
  /** The element whose colour the tint and the projected element fact take. */
  element = input<string | null>(null);

  readonly rarityAttr = computed(() => {
    const rarity = Number(this.rarity() ?? 0);
    return Number.isFinite(rarity) && rarity > 0 ? String(rarity) : '0';
  });

  readonly elementAttr = computed(() => this.element()?.toLowerCase() ?? null);
}
