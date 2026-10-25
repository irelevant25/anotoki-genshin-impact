import { Component, computed, inject, input, model, output, signal } from '@angular/core';
import { AbstractModalComponent } from '../../../../../shared/local-lib/abstract-modal.class';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { TooltipDirective } from '@anotoki/lib/ui/tooltip';
import { SelectComponent } from '@anotoki/lib/ui/forms';
import { DropdownOption } from '../../../../../shared/local-lib/services/options-helper.service';
import { NumberFieldComponent } from '@anotoki/lib/ui/number-field';
import { NumberFieldDirective } from '../../../../../shared/local-lib/fields/number-field.directive';
import { ChoiceFieldDirective } from '../../../../../shared/local-lib/fields/choice-field.directive';
import { AscensionSetApiService, Audited, Material } from '../../../../../api';
import { AscensionCostFormData } from '../../../../../sites/admin/shared/admin-form.model';
import { MaterialIconDirective } from '../../../shared/material-icon.directive';
import { AscensionSetSelectorComponent } from './set-selector/set-selector.component';
import { AscensionWrapper, createUid, emptyAscension, reorder, resequence } from '../character-form.model';

/** Phases 0 (base stats) through 6. */
const MAX_ASCENSIONS = 7;

@Component({
  selector: 'app-ascensions-tab',
  templateUrl: './ascensions-tab.component.html',
  styleUrls: ['./ascensions-tab.component.scss'],
  imports: [TooltipDirective, ButtonComponent, SelectComponent, NumberFieldComponent, NumberFieldDirective, ChoiceFieldDirective, MaterialIconDirective],
})
export class AscensionsTabComponent extends AbstractModalComponent {
  ascensions = model<AscensionWrapper[]>([]);
  stats = input<string[]>([]);
  materials = input<Audited<Material>[]>([]);
  /** The character's current ascension set, marked in the picker. */
  ascensionSetId = input<number | null | undefined>();
  /** Emitted with the chosen set id, so the form points the character at it. */
  ascensionSetChosen = output<number>();

  private readonly _ascensionSetApi = inject(AscensionSetApiService);

  readonly maxPhase = MAX_ASCENSIONS - 1;

  sorted = computed(() => [...this.ascensions()].sort((a, b) => a.ascension.phase - b.ascension.phase).map((wrapper) => ({ wrapper, cost: [...wrapper.cost].sort((a, b) => a.order - b.order) })));
  canAdd = computed(() => this.ascensions().length < MAX_ASCENSIONS);
  materialOptions = computed<DropdownOption[]>(() => this.materials().map((material) => ({ key: material.id ?? -1, value: material.name, data: material })));

  /**
   * Points this character at another ascension set. Picks a set, loads its
   * ascensions (and their costs) into the tab, and tells the form to save the new
   * set on the character. Mirrors the voice-over "Choose set".
   */
  chooseSet(): void {
    const modal = this.dialogs.open<AscensionSetSelectorComponent, number | undefined>(AscensionSetSelectorComponent, {
      heading: 'Choose an ascension set',
      size: 'lg',
      data: this.ascensionSetId() ?? null,
    });

    void modal.closed.then((setId) => {
      if (typeof setId !== 'number') {
        return;
      }
      this._ascensionSetApi.getAscensionSet(setId).subscribe({
        next: (detail) => {
          const costs = detail?.ascension_cost ?? [];
          this.ascensions.set(
            (detail?.ascensions ?? []).map((ascension) => ({
              uid: createUid(),
              ascension: ascension as unknown as AscensionWrapper['ascension'],
              cost: costs.filter((cost) => cost.character_ascension_id === ascension.id) as unknown as AscensionWrapper['cost'],
            })),
          );
          this.ascensionSetChosen.emit(setId);
          this.notificationService.success(`Now using set #${setId} (${detail?.ascensions?.length ?? 0} ascensions).`);
        },
        error: () => this.notificationService.error('Could not load that set’s ascensions.'),
      });
    });
  }

  /** Two-step clear of the whole set, matching the voice-over tab. */
  deleteAllArmed = signal(false);

  deleteAll(): void {
    if (!this.deleteAllArmed()) {
      this.deleteAllArmed.set(true);
      return;
    }
    const count = this.ascensions().length;
    this.ascensions.set([]);
    this.deleteAllArmed.set(false);
    this.notificationService.success(`${count} ascensions removed. They are deleted when you save.`);
  }

  cancelDeleteAll(): void {
    this.deleteAllArmed.set(false);
  }

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
        (current, order) => (current.order = order),
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
        (current, order) => (current.order = order),
      );
      return changed ? [...ascensions] : ascensions;
    });
  }
}
