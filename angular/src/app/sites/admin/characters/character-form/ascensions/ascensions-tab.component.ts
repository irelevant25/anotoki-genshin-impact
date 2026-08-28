import { Component, computed, input, model } from '@angular/core';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { NumberComponent } from '../../../../../shared/local-lib/components/number/number.component';
import { DropdownComponent } from '../../../../../shared/local-lib/components/dropdown/dropdown.component';
import { DropdownOption } from '../../../../../shared/local-lib/services/options-helper.service';
import { Material } from '../../../../../shared/models.generated';
import { AscensionCostFormData } from '../../../services/admin-api.service';
import { AscensionWrapper, emptyAscension, reorder, resequence } from '../character-form.model';

/** Phases 0 (base stats) through 6. */
const MAX_ASCENSIONS = 7;

@Component({
  selector: 'app-ascensions-tab',
  templateUrl: './ascensions-tab.component.html',
  styleUrls: ['./ascensions-tab.component.scss'],
  imports: [ButtonComponent, NumberComponent, DropdownComponent],
})
export class AscensionsTabComponent {
  ascensions = model<AscensionWrapper[]>([]);
  stats = input<string[]>([]);
  materials = input<Material[]>([]);

  readonly maxPhase = MAX_ASCENSIONS - 1;

  sorted = computed(() =>
    [...this.ascensions()]
      .sort((a, b) => a.ascension.phase - b.ascension.phase)
      .map((wrapper) => ({ wrapper, cost: [...wrapper.cost].sort((a, b) => a.order - b.order) }))
  );
  canAdd = computed(() => this.ascensions().length < MAX_ASCENSIONS);
  materialOptions = computed<DropdownOption[]>(() => this.materials().map((material) => ({ key: material.id ?? -1, value: material.name, data: material })));

  addAscension(): void {
    this.ascensions.update((ascensions) => {
      const nextPhase = ascensions.length === 0 ? 0 : Math.max(...ascensions.map((wrapper) => wrapper.ascension.phase)) + 1;
      return [...ascensions, emptyAscension(Math.min(nextPhase, this.maxPhase))];
    });
  }

  removeAscension(wrapper: AscensionWrapper): void {
    this.ascensions.update((ascensions) => ascensions.filter((ascension) => ascension !== wrapper));
  }

  addCost(wrapper: AscensionWrapper): void {
    this.ascensions.update((ascensions) => {
      wrapper.cost = [...wrapper.cost, { character_ascension_id: wrapper.ascension.id ?? -1, quantity: 1, order: wrapper.cost.length + 1 }];
      return [...ascensions];
    });
  }

  removeCost(wrapper: AscensionWrapper, cost: AscensionCostFormData): void {
    this.ascensions.update((ascensions) => {
      wrapper.cost = wrapper.cost.filter((current) => current !== cost);
      resequence(
        wrapper.cost,
        (current) => current.order,
        (current, order) => (current.order = order)
      );
      return [...ascensions];
    });
  }

  onCostOrderChange(wrapper: AscensionWrapper, cost: AscensionCostFormData, newOrder: number | string | null | undefined): void {
    this.ascensions.update((ascensions) => {
      const changed = reorder(
        wrapper.cost,
        cost,
        newOrder,
        (current) => current.order,
        (current, order) => (current.order = order)
      );
      return changed ? [...ascensions] : ascensions;
    });
  }
}
