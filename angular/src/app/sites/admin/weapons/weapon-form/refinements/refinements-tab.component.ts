import { Component, computed, input, model } from '@angular/core';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { TextareaComponent } from '../../../../../shared/local-lib/components/textarea/textarea.component';
import { NumberComponent } from '../../../../../shared/local-lib/components/number/number.component';
import { DropdownComponent } from '../../../../../shared/local-lib/components/dropdown/dropdown.component';
import { DropdownOption } from '../../../../../shared/local-lib/services/options-helper.service';
import { FieldContainerComponent } from '../../../../../shared/local-lib/components/field-container/field-container.component';
import { Audited, Material } from '../../../../../api';
import { emptyRefinement, RefinementWrapper } from '../weapon-form.model';

/** Weapons refine from R1 to R5. */
const MAX_REFINEMENTS = 5;

@Component({
  selector: 'app-weapon-refinements-tab',
  templateUrl: './refinements-tab.component.html',
  styleUrls: ['./refinements-tab.component.scss'],
  imports: [ButtonComponent, TextareaComponent, NumberComponent, DropdownComponent, FieldContainerComponent],
})
export class RefinementsTabComponent {
  refinements = model<RefinementWrapper[]>([]);
  materials = input<Audited<Material>[]>([]);

  materialOptions = computed<DropdownOption[]>(() => this.materials().map((material) => ({ key: material.id ?? -1, value: material.name })));
  canAdd = computed(() => this.refinements().length < MAX_REFINEMENTS);

  addRefinement(): void {
    this.refinements.update((refinements) => [...refinements, emptyRefinement()]);
  }

  removeRefinement(wrapper: RefinementWrapper): void {
    this.refinements.update((refinements) => refinements.filter((refinement) => refinement !== wrapper));
  }

  /** Refinement level is the row's position, so moving a row rewrites it. */
  move(wrapper: RefinementWrapper, offset: number): void {
    this.refinements.update((refinements) => {
      const index = refinements.indexOf(wrapper);
      const target = index + offset;
      if (index < 0 || target < 0 || target >= refinements.length) {
        return refinements;
      }
      const next = [...refinements];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  /** Copies the previous row, which usually only differs by the mora cost. */
  duplicateLast(): void {
    const last = this.refinements().at(-1);
    this.refinements.update((refinements) => [
      ...refinements,
      last ? { ...emptyRefinement(), data: { ...last.data, id: undefined } } : emptyRefinement(),
    ]);
  }
}
