import { Component, computed, input, model } from '@angular/core';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { TextComponent } from '../../../../../shared/local-lib/components/text/text.component';
import { DropdownComponent } from '../../../../../shared/local-lib/components/dropdown/dropdown.component';
import { CheckboxComponent } from '../../../../../shared/local-lib/components/checkbox/checkbox.component';
import { ChipsComponent } from '../../../../../shared/local-lib/components/chips/chips.component';
import { FieldContainerComponent } from '../../../../../shared/local-lib/components/field-container/field-container.component';
import { EntityImageComponent } from '../../../shared/entity-image/entity-image.component';
import { PickedImage } from '../../../shared/image-upload/image-upload.component';
import { revokeAllPicked, revokePicked } from '../../../shared/admin-full-resource.model';
import { emptyPhase, phaseImageName, PhaseImageField, PhaseWrapper } from '../enemy-form.model';

@Component({
  selector: 'app-enemy-phases-tab',
  templateUrl: './phases-tab.component.html',
  styleUrls: ['./phases-tab.component.scss'],
  imports: [ButtonComponent, TextComponent, DropdownComponent, CheckboxComponent, ChipsComponent, FieldContainerComponent, EntityImageComponent],
})
export class PhasesTabComponent {
  phases = model<PhaseWrapper[]>([]);

  /** Phase art is named after the enemy, so the tab needs to know it. */
  enemyName = input<string>('');
  enemyTypes = input<string[]>([]);
  enemyFamilies = input<string[]>([]);
  enemyGroups = input<string[]>([]);
  elements = input<string[]>([]);

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
