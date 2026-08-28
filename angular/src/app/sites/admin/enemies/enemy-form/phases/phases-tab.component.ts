import { Component, computed, input, model } from '@angular/core';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { TextComponent } from '../../../../../shared/local-lib/components/text/text.component';
import { DropdownComponent } from '../../../../../shared/local-lib/components/dropdown/dropdown.component';
import { CheckboxComponent } from '../../../../../shared/local-lib/components/checkbox/checkbox.component';
import { ChipsComponent } from '../../../../../shared/local-lib/components/chips/chips.component';
import { FileComponent, FileItemType } from '../../../../../shared/local-lib/components/file/file.component';
import { FieldContainerComponent } from '../../../../../shared/local-lib/components/field-container/field-container.component';
import { TooltipComponent } from '../../../../../shared/local-lib/components/tooltip/tooltip.component';
import { IMAGE_EXTENSIONS, imageSrc, revokeImages, setImage } from '../../../shared/admin-full-resource.model';
import { emptyPhase, PhaseImageField, PhaseWrapper } from '../enemy-form.model';

@Component({
  selector: 'app-enemy-phases-tab',
  templateUrl: './phases-tab.component.html',
  styleUrls: ['./phases-tab.component.scss'],
  imports: [ButtonComponent, TextComponent, DropdownComponent, CheckboxComponent, ChipsComponent, FileComponent, FieldContainerComponent, TooltipComponent],
})
export class PhasesTabComponent {
  phases = model<PhaseWrapper[]>([]);

  enemyTypes = input<string[]>([]);
  enemyFamilies = input<string[]>([]);
  enemyGroups = input<string[]>([]);
  elements = input<string[]>([]);

  readonly imageExtensions = IMAGE_EXTENSIONS;
  readonly imageFields: { field: PhaseImageField; label: string; required: boolean }[] = [
    { field: 'icon', label: 'Icon', required: true },
    { field: 'art', label: 'Art', required: false },
  ];

  canAdd = computed(() => this.phases().length < 10);

  addPhase(): void {
    this.phases.update((phases) => [...phases, emptyPhase()]);
  }

  removePhase(wrapper: PhaseWrapper): void {
    revokeImages(Object.values(wrapper.images));
    this.phases.update((phases) => phases.filter((phase) => phase !== wrapper));
  }

  /** Preview for a picked file, falling back to the path stored on the phase. */
  phaseImageSrc(wrapper: PhaseWrapper, field: PhaseImageField): string | undefined {
    return imageSrc(wrapper.images[field], wrapper.data[field]);
  }

  onImageSelect(wrapper: PhaseWrapper, field: PhaseImageField, files: FileItemType[] | undefined | null): void {
    const slot = wrapper.images[field] ?? {};
    setImage(slot, files?.[0]?.file);
    wrapper.images[field] = slot;
  }
}
