import { Component, computed, model } from '@angular/core';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { NumberComponent } from '../../../../../shared/local-lib/components/number/number.component';
import { DropdownComponent } from '../../../../../shared/local-lib/components/dropdown/dropdown.component';
import { DropdownOption } from '../../../../../shared/local-lib/services/options-helper.service';
import { Material } from '../../../../../shared/models.generated';
import { AscensionWrapper } from '../character-form.component';
import { AscensionCostFormData } from '../../../services/admin-api.service';

@Component({
  selector: 'app-ascensions-tab',
  templateUrl: './ascensions-tab.component.html',
  styleUrls: ['./ascensions-tab.component.scss'],
  imports: [ButtonComponent, NumberComponent, DropdownComponent],
})
export class AscensionsTabComponent {
  ascensions = model<AscensionWrapper[]>([]);
  ascensionsSorted = computed(() => {
    this.ascensions().forEach(x => x.cost.sort((a, b) => a.order - b.order));
    return this.ascensions().sort((a, b) => a.ascension.phase - b.ascension.phase);
  });
  stats = model<string[]>([]);
  materials = model<Material[]>([]);
  materialOptions = computed<DropdownOption[]>(() => this.materials().map(m => ({ key: m.id ?? -1, value: m.name, data: m })));

  addAscension(): void {
    this.ascensions.update(a => [...a, {
      ascension: {
        primary_stat: '', primary_stat_value: 0,
        start_level_hp: 0, start_level_atk: 0, start_level_def: 0,
        end_level_hp: 0, end_level_atk: 0, end_level_def: 0, phase: a.length
      },
      cost: []
    }]);
  }

  removeAscension(i: number): void {
    this.ascensions.update(a => a.filter((_, idx) => idx !== i));
  }

  addAscensionCost(ascIdx: number): void {
    this.ascensions.update(a => a.map((asc, i) => i === ascIdx
      ? { ...asc, cost: [...asc.cost, { character_ascension_id: asc.ascension.id ?? -1, material_id: 0, quantity: 0, order: asc.cost.length }] } : asc));
  }

  removeAscensionCost(ascIdx: number, costIdx: number): void {
    this.ascensions.update(a => a.map((asc, i) => i === ascIdx
      ? { ...asc, cost: (asc.cost ?? []).filter((_, ci) => ci !== costIdx) } : asc));
  }

  onOrderChange(item: AscensionWrapper, cost: AscensionCostFormData, newOrder: number | string | null | undefined): void {
    const order = Number(newOrder);
    if (!order || isNaN(order)) {
      return;
    }
    const oldOrder = cost.order;
    if (order === oldOrder) {
      return;
    }

    this.ascensions.update(list => {
      const ascensions = [...list];
      const updatedAscension = ascensions.find(x => x === item);
      const updated = updatedAscension?.cost ?? []
      for (let i = 0; i < updated.length; i++) {
        if (updated[i] === cost) {
          updated[i].order = order;
        } else if (oldOrder < order && updated[i].order > oldOrder && updated[i].order <= order) {
          updated[i].order = updated[i].order - 1;
        } else if (oldOrder > order && updated[i].order >= order && updated[i].order < oldOrder) {
          updated[i].order = updated[i].order + 1;
        }
      }
      return ascensions;
    });
  }
}
