import { Component, computed, input, linkedSignal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '../../../../../../../../shared/local-lib/i18n/translate.pipe';
import { MaterialIconDirective } from '../../../../../../../admin/shared/material-icon.directive';
import { sumMaterials, toggleIn } from '../../../../shared/database-helpers';

@Component({
  selector: 'app-character-ascensions-tab',
  templateUrl: './ascensions-tab.component.html',
  styleUrls: ['./ascensions-tab.component.scss'],
  imports: [RouterModule, TranslatePipe, MaterialIconDirective],
})
export class CharacterAscensionsTabComponent {
  ascensions = input<any[]>([]);

  /**
   * Every phase that costs something starts ticked; unticking one drops it from
   * the total below. Linked to the input so moving to another character starts
   * from all-ticked again rather than keeping the last one's choices.
   */
  selectedPhases = linkedSignal<any[], Set<number>>({
    source: this.ascensions,
    computation: (ascensions) => new Set(ascensions.filter((ascension) => ascension.phase > 0).map((ascension) => ascension.phase)),
  });

  primaryStat = computed(() => this.ascensions()[0]?.primary_stat);

  totals = computed(() => sumMaterials(this.ascensions().filter((ascension) => this.selectedPhases().has(ascension.phase)).flatMap((ascension) => ascension.costs ?? [])));

  togglePhase(phase: number): void {
    this.selectedPhases.update((current) => toggleIn(current, phase));
  }
}
