import { Component, computed, model } from '@angular/core';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { TextComponent } from '../../../../../shared/local-lib/components/text/text.component';
import { TextareaComponent } from '../../../../../shared/local-lib/components/textarea/textarea.component';
import { NumberComponent } from '../../../../../shared/local-lib/components/number/number.component';
import { FieldContainerComponent } from '../../../../../shared/local-lib/components/field-container/field-container.component';
import { ConstellationWrapper, emptyConstellation, reorder, revokePicked, resequence } from '../character-form.model';
import { EntityImageComponent } from '../../../shared/entity-image/entity-image.component';
import { PickedImage } from '../../../shared/image-upload/image-upload.component';

const MAX_CONSTELLATIONS = 6;

@Component({
  selector: 'app-constellations-tab',
  templateUrl: './constellations-tab.component.html',
  styleUrls: ['./constellations-tab.component.scss'],
  imports: [ButtonComponent, TextComponent, TextareaComponent, NumberComponent, EntityImageComponent, FieldContainerComponent],
})
export class ConstellationsTabComponent {
  constellations = model<ConstellationWrapper[]>([]);

  readonly maxConstellations = MAX_CONSTELLATIONS;

  sorted = computed(() => [...this.constellations()].sort((a, b) => a.data.level - b.data.level));
  canAdd = computed(() => this.constellations().length < MAX_CONSTELLATIONS);

  addConstellation(): void {
    this.constellations.update((constellations) => [...constellations, emptyConstellation(constellations.length + 1)]);
  }

  removeConstellation(wrapper: ConstellationWrapper): void {
    revokePicked(wrapper.pending);
    this.constellations.update((constellations) => {
      const remaining = constellations.filter((constellation) => constellation !== wrapper);
      resequence(
        remaining,
        (constellation) => constellation.data.level,
        (constellation, level) => (constellation.data.level = level)
      );
      return remaining;
    });
  }

  /** Stored path; the slot shows a pending pick when there is one. */
  iconPath(wrapper: ConstellationWrapper): string | undefined {
    return wrapper.data.icon || undefined;
  }

  onPicked(wrapper: ConstellationWrapper, picked: PickedImage): void {
    revokePicked(wrapper.pending);
    wrapper.pending = picked;
  }

  onCleared(wrapper: ConstellationWrapper): void {
    revokePicked(wrapper.pending);
    wrapper.pending = undefined;
  }

  onLevelChange(wrapper: ConstellationWrapper, newLevel: number | string | null | undefined): void {
    this.constellations.update((constellations) => {
      const changed = reorder(
        constellations,
        wrapper,
        newLevel,
        (constellation) => constellation.data.level,
        (constellation, level) => (constellation.data.level = level)
      );
      return changed ? [...constellations] : constellations;
    });
  }
}
