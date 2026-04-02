import { Component, signal } from '@angular/core';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { AscensionCostFormData, AscensionFormData, MaterialEntry } from '../../../services/admin-api.service';

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
  imports: [ButtonComponent],
})
export class AscensionsTabComponent {
  ascensions = signal<AscensionFormData[]>([]);
  stats = signal<string[]>([]);
  materials = signal<MaterialEntry[]>([]);

  addAscension(): void {
    this.ascensions.update(a => [...a, { ...emptyAscension(), phase: a.length + 1 }]);
  }
  removeAscension(i: number): void {
    this.ascensions.update(a => a.filter((_, idx) => idx !== i));
  }
  setAscension(i: number, field: keyof AscensionFormData, value: any): void {
    this.ascensions.update(a => a.map((as, idx) => idx === i ? { ...as, [field]: value } : as));
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
