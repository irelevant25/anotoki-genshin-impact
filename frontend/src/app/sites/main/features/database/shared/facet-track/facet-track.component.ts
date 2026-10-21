import { booleanAttribute, Component, input, model } from '@angular/core';
import { MaterialIconDirective } from '../../../../../admin/shared/material-icon.directive';
import { rarityStars } from '../database-helpers';

/** One segment of a facet track. */
export interface FacetOption {
  value: string | number;
  /** The words - shown on a wide track and on a segment without a picture, said to a screen reader otherwise. */
  label: string;
  /** A picture on the segment: a name and the folder under assets/ the icon directive resolves it in. */
  picture?: { name: string; folder: string };
  /** The rarity's stars, in gold, before the words. */
  stars?: number;
  /** One star after the words, in this CSS colour - a rarity's own. */
  star?: string;
  /** How many rows carry the value, in quieter figures after the words. */
  count?: number;
  /** The ring round the segment while it is chosen, a CSS colour; the site's primary without. */
  ring?: string;
  /** The ink of the chosen segment's count, a CSS colour; the site's primary without. */
  ink?: string;
  /** Whether the words are drawn; by default on a wide track and wherever there is no picture. */
  words?: boolean;
}

let nextTrackId = 0;

/**
 * A facet of a list page as a track of segments (the owner's choice "E" of
 * 2026-10-21 among the mockups): the kit's segmented control's look - a
 * bordered pill, the chosen segment raised on the surface - carrying the
 * site's pictures, which the kit's pieces cannot (their icons are the
 * registry's drawings). One choice at a time, and clicking the chosen one
 * clears it, so the group needs no "any" entry: the toggles the pages had.
 * A wide track - the list's main facet - says every value's name and count
 * and offers "All" with the total.
 */
@Component({
  selector: 'app-facet-track',
  templateUrl: './facet-track.component.html',
  styleUrls: ['./facet-track.component.scss'],
  imports: [MaterialIconDirective],
})
export class FacetTrackComponent {
  /** The small label above the track, already in the reader's words. */
  label = input.required<string>();
  options = input.required<readonly FacetOption[]>();
  /** Names and counts on every segment, the track as wide as its row. */
  wide = input(false, { transform: booleanAttribute });
  /** The "All" segment's words; with them, a wide track starts with All and the total. */
  allLabel = input<string | null>(null);
  allTotal = input<number>(0);
  /**
   * The chosen value, null for none. Loosely typed on purpose: a page binds the
   * signal it compares against its rows (a string, a number), and keeps its type.
   */
  value = model<any>(null);

  readonly labelId = `facet-track-${nextTrackId++}`;

  stars = rarityStars;

  choose(value: string | number): void {
    this.value.set(this.value() === value ? null : value);
  }

  showsWords(option: FacetOption): boolean {
    return option.words ?? (this.wide() || !option.picture);
  }
}
