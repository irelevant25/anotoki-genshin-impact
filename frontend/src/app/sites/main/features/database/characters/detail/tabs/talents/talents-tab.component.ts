import { Component, computed, input, linkedSignal, signal } from '@angular/core';
import { TranslatePipe } from '@anotoki/lib/translations';
import { CardComponent } from '@anotoki/lib/ui/card';
import { BadgeComponent } from '@anotoki/lib/ui/badge';
import { MaterialIconDirective } from '../../../../../../../admin/shared/material-icon.directive';
import { MaterialTileComponent } from '../../../../shared/material-tile/material-tile.component';
import { sumMaterials, toggleIn } from '../../../../shared/database-helpers';

/** A description longer than this is folded to a few lines until the reader unfolds it. */
export const FOLD_FROM = 300;

@Component({
  selector: 'app-character-talents-tab',
  templateUrl: './talents-tab.component.html',
  styleUrls: ['./talents-tab.component.scss'],
  imports: [TranslatePipe, CardComponent, BadgeComponent, MaterialIconDirective, MaterialTileComponent],
})
export class CharacterTalentsTabComponent {
  talents = input<any[]>([]);
  levels = input<{ level: number; costs: any[] }[]>([]);

  /** The talents whose whole description the reader asked for. */
  unfolded = signal<Set<number>>(new Set());

  /** All levels start ticked; see the ascensions tab for why this is linked. */
  selectedLevels = linkedSignal<{ level: number; costs: any[] }[], Set<number>>({
    source: this.levels,
    computation: (levels) => new Set(levels.map((level) => level.level)),
  });

  totals = computed(() =>
    sumMaterials(
      this.levels()
        .filter((level) => this.selectedLevels().has(level.level))
        .flatMap((level) => level.costs),
    ),
  );

  toggleLevel(level: number): void {
    this.selectedLevels.update((current) => toggleIn(current, level));
  }

  isLong(text: unknown): boolean {
    return String(text ?? '').length > FOLD_FROM;
  }

  /** A passive reads quieter than the three combat talents. */
  isPassive(type: unknown): boolean {
    return /passive/i.test(String(type ?? ''));
  }

  toggleText(id: number): void {
    this.unfolded.update((current) => toggleIn(current, id));
  }
}
