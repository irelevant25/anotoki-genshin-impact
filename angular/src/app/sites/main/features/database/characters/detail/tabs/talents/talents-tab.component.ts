import { Component, computed, input, linkedSignal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '../../../../../../../../shared/local-lib/i18n/translate.pipe';
import { MaterialIconDirective } from '../../../../../../../admin/shared/material-icon.directive';
import { sumMaterials, toggleIn } from '../../../../shared/database-helpers';

@Component({
  selector: 'app-character-talents-tab',
  templateUrl: './talents-tab.component.html',
  styleUrls: ['./talents-tab.component.scss'],
  imports: [RouterModule, TranslatePipe, MaterialIconDirective],
})
export class CharacterTalentsTabComponent {
  talents = input<any[]>([]);
  levels = input<{ level: number; costs: any[] }[]>([]);

  /** All levels start ticked; see the ascensions tab for why this is linked. */
  selectedLevels = linkedSignal<{ level: number; costs: any[] }[], Set<number>>({
    source: this.levels,
    computation: (levels) => new Set(levels.map((level) => level.level)),
  });

  totals = computed(() => sumMaterials(this.levels().filter((level) => this.selectedLevels().has(level.level)).flatMap((level) => level.costs)));

  toggleLevel(level: number): void {
    this.selectedLevels.update((current) => toggleIn(current, level));
  }
}
