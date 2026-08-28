import { Component, computed, input, model } from '@angular/core';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { NumberComponent } from '../../../../../shared/local-lib/components/number/number.component';
import { DropdownComponent } from '../../../../../shared/local-lib/components/dropdown/dropdown.component';
import { DropdownOption } from '../../../../../shared/local-lib/services/options-helper.service';
import { Material } from '../../../../../shared/models.generated';
import { DropWrapper, emptyDrop } from '../enemy-form.model';

@Component({
  selector: 'app-enemy-drops-tab',
  templateUrl: './drops-tab.component.html',
  styleUrls: ['./drops-tab.component.scss'],
  imports: [ButtonComponent, NumberComponent, DropdownComponent],
})
export class DropsTabComponent {
  drops = model<DropWrapper[]>([]);

  materials = input<Material[]>([]);
  artifacts = input<{ id: number; name: string }[]>([]);
  domainLevels = input<string[]>([]);
  rarities = input<string[]>([]);

  materialOptions = computed<DropdownOption[]>(() => this.materials().map((material) => ({ key: material.id ?? -1, value: material.name })));
  artifactOptions = computed<DropdownOption[]>(() => this.artifacts().map((artifact) => ({ key: artifact.id, value: artifact.name })));

  addDrop(): void {
    this.drops.update((drops) => [...drops, emptyDrop()]);
  }

  removeDrop(wrapper: DropWrapper): void {
    this.drops.update((drops) => drops.filter((drop) => drop !== wrapper));
  }

  /** Copies the last row's level/world settings, which is how drop tables repeat. */
  duplicateDrop(wrapper: DropWrapper): void {
    this.drops.update((drops) => {
      const index = drops.indexOf(wrapper);
      const copy = { ...emptyDrop(), data: { ...wrapper.data, id: undefined } };
      return [...drops.slice(0, index + 1), copy, ...drops.slice(index + 1)];
    });
  }
}
