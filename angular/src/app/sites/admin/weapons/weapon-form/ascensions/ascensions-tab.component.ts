import { Component, computed, input, model } from '@angular/core';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { NumberComponent } from '../../../../../shared/local-lib/components/number/number.component';
import { DropdownComponent } from '../../../../../shared/local-lib/components/dropdown/dropdown.component';
import { DropdownOption } from '../../../../../shared/local-lib/services/options-helper.service';
import { Material } from '../../../../../shared/models.generated';
import { WeaponAscensionCostFormData } from '../../../services/admin-api.service';
import { MaterialIconDirective } from '../../../shared/material-icon.directive';
import { AscensionWrapper, emptyAscension, MAX_WEAPON_ASCENSIONS } from '../weapon-form.model';

@Component({
  selector: 'app-weapon-ascensions-tab',
  templateUrl: './ascensions-tab.component.html',
  styleUrls: ['./ascensions-tab.component.scss'],
  imports: [ButtonComponent, NumberComponent, DropdownComponent, MaterialIconDirective],
})
export class AscensionsTabComponent {
  ascensions = model<AscensionWrapper[]>([]);
  materials = input<Material[]>([]);

  readonly maxPhase = MAX_WEAPON_ASCENSIONS - 1;

  sorted = computed(() => [...this.ascensions()].sort((a, b) => a.data.phase - b.data.phase));
  canAdd = computed(() => this.ascensions().length < MAX_WEAPON_ASCENSIONS);
  materialOptions = computed<DropdownOption[]>(() => this.materials().map((material) => ({ key: material.id ?? -1, value: material.name })));

  addAscension(): void {
    this.ascensions.update((ascensions) => {
      const nextPhase = ascensions.length === 0 ? 0 : Math.max(...ascensions.map((wrapper) => wrapper.data.phase)) + 1;
      return [...ascensions, emptyAscension(Math.min(nextPhase, this.maxPhase))];
    });
  }

  removeAscension(wrapper: AscensionWrapper): void {
    this.ascensions.update((ascensions) => ascensions.filter((ascension) => ascension !== wrapper));
  }

  addCost(wrapper: AscensionWrapper): void {
    this.ascensions.update((ascensions) => {
      wrapper.costs = [...wrapper.costs, { quantity: 1 }];
      return [...ascensions];
    });
  }

  removeCost(wrapper: AscensionWrapper, cost: WeaponAscensionCostFormData): void {
    this.ascensions.update((ascensions) => {
      wrapper.costs = wrapper.costs.filter((current) => current !== cost);
      return [...ascensions];
    });
  }
}
