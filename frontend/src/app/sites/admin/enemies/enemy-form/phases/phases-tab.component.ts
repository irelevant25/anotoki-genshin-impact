import { Component, computed, input, model } from '@angular/core';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { CheckboxComponent, SelectComponent, TextFieldComponent } from '@anotoki/lib/ui/forms';
import { ChipGroupComponent, ChipOption } from '@anotoki/lib/ui/chips';
import { FieldCheckDirective } from '../../../../../shared/local-lib/fields/field-check';
import { fieldText } from '../../../../../shared/local-lib/fields/field-text';
import { ChoiceFieldDirective } from '../../../../../shared/local-lib/fields/choice-field.directive';
import { EntityImageComponent } from '../../../shared/entity-image/entity-image.component';
import { PickedImage } from '../../../shared/image-upload/image-upload.component';
import { revokeAllPicked, revokePicked } from '../../../shared/admin-full-resource.model';
import { emptyPhase, phaseImageName, PhaseImageField, PhaseWrapper } from '../enemy-form.model';

@Component({
  selector: 'app-enemy-phases-tab',
  templateUrl: './phases-tab.component.html',
  styleUrls: ['./phases-tab.component.scss'],
  imports: [ButtonComponent, TextFieldComponent, SelectComponent, CheckboxComponent, ChipGroupComponent, FieldCheckDirective, ChoiceFieldDirective, EntityImageComponent],
})
export class PhasesTabComponent {
  readonly fieldText = fieldText;

  phases = model<PhaseWrapper[]>([]);

  /** Phase art is named after the enemy, so the tab needs to know it. */
  enemyName = input<string>('');
  enemyTypes = input<string[]>([]);
  enemyFamilies = input<string[]>([]);
  enemyGroups = input<string[]>([]);
  elements = input<string[]>([]);

  /** The elements as the kit's chips take them. */
  readonly elementChips = computed<ChipOption[]>(() => this.elements().map((element) => ({ value: element, label: element })));

  readonly imageFields: { field: PhaseImageField; label: string; required: boolean }[] = [
    { field: 'icon', label: 'Icon', required: true },
    { field: 'art', label: 'Art', required: false },
  ];

  canAdd = computed(() => this.phases().length < 10);

  addPhase(): void {
    this.phases.update((phases) => [...phases, emptyPhase()]);
  }

  removePhase(wrapper: PhaseWrapper): void {
    revokeAllPicked(Object.values(wrapper.pending));
    this.phases.update((phases) => phases.filter((phase) => phase !== wrapper));
  }

  /** Stored path; the slot shows a pending pick when there is one. */
  imagePath(wrapper: PhaseWrapper, field: PhaseImageField): string | undefined {
    return wrapper.data[field] || undefined;
  }

  /** `{ENEMY} - phase2`, numbered by where the phase sits in the list. */
  imageName(wrapper: PhaseWrapper, field: PhaseImageField): string {
    return phaseImageName(this.enemyName(), field, this.phases().indexOf(wrapper));
  }

  onPicked(wrapper: PhaseWrapper, field: PhaseImageField, picked: PickedImage): void {
    revokePicked(wrapper.pending[field]);
    wrapper.pending[field] = picked;
  }

  onCleared(wrapper: PhaseWrapper, field: PhaseImageField): void {
    revokePicked(wrapper.pending[field]);
    delete wrapper.pending[field];
  }
}
