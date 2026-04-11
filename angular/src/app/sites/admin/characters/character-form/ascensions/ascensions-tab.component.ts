import { Component, computed, model } from '@angular/core';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { NumberComponent } from '../../../../../shared/local-lib/components/number/number.component';
import { DropdownComponent } from '../../../../../shared/local-lib/components/dropdown/dropdown.component';
import { DropdownOption } from '../../../../../shared/local-lib/services/options-helper.service';
import { AscensionCostFormData, AscensionFormData } from '../../../services/admin-api.service';
import { Material } from '../../../../../shared/models.generated';

function emptyAscension(): AscensionFormData {
  return {
    phase: 1, primary_stat: '', primary_stat_value: 0,
    start_level_hp: 0, start_level_atk: 0, start_level_def: 0,
    end_level_hp: 0, end_level_atk: 0, end_level_def: 0,
    costs: [],
  };
}

@Component({
  selector: 'app-ascensions-tab',
  templateUrl: './ascensions-tab.component.html',
  styleUrls: ['./ascensions-tab.component.scss'],
  imports: [ButtonComponent, NumberComponent, DropdownComponent],
})
export class AscensionsTabComponent {
  ascensions = model<AscensionFormData[]>([]);
  stats = model<string[]>([]);
  materials = model<Material[]>([]);
  ascensionsSorted = computed(() => this.ascensions().sort((a, b) => a.phase - b.phase));
  materialOptions = computed<DropdownOption[]>(() => this.materials().map(m => ({ key: m.id ?? -1, value: m.name, data: m })));

  addAscension(): void {
    this.ascensions.update(a => [...a, { ...emptyAscension(), phase: a.length }]);
  }

  removeAscension(i: number): void {
    this.ascensions.update(a => a.filter((_, idx) => idx !== i));
  }

  addAscensionCost(ascIdx: number): void {
    this.ascensions.update(a => a.map((asc, i) => i === ascIdx
      ? { ...asc, costs: [...(asc.costs ?? []), { material_id: 0, quantity: 1 }] } : asc));
  }

  removeAscensionCost(ascIdx: number, costIdx: number): void {
    this.ascensions.update(a => a.map((asc, i) => i === ascIdx
      ? { ...asc, costs: (asc.costs ?? []).filter((_, ci) => ci !== costIdx) } : asc));
  }

  setAscensionCost(ascIdx: number, costIdx: number, field: keyof AscensionCostFormData, value: any): void {
    this.ascensions.update(a => a.map((asc, i) => i === ascIdx
      ? { ...asc, costs: (asc.costs ?? []).map((c, ci) => ci === costIdx ? { ...c, [field]: value } : c) } : asc));
  }
}
