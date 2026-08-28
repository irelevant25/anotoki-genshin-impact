import { Component, computed, model } from '@angular/core';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { TextComponent } from '../../../../../shared/local-lib/components/text/text.component';
import { TextareaComponent } from '../../../../../shared/local-lib/components/textarea/textarea.component';
import { NumberComponent } from '../../../../../shared/local-lib/components/number/number.component';
import { FileComponent, FileItemType } from '../../../../../shared/local-lib/components/file/file.component';
import { TooltipComponent } from '../../../../../shared/local-lib/components/tooltip/tooltip.component';
import { FieldContainerComponent } from '../../../../../shared/local-lib/components/field-container/field-container.component';
import { ConstellationWrapper, emptyConstellation, IMAGE_EXTENSIONS, reorder, replacePreview, resequence } from '../character-form.model';

const MAX_CONSTELLATIONS = 6;

@Component({
  selector: 'app-constellations-tab',
  templateUrl: './constellations-tab.component.html',
  styleUrls: ['./constellations-tab.component.scss'],
  imports: [ButtonComponent, TextComponent, TextareaComponent, NumberComponent, FileComponent, TooltipComponent, FieldContainerComponent],
})
export class ConstellationsTabComponent {
  constellations = model<ConstellationWrapper[]>([]);

  readonly imageExtensions = IMAGE_EXTENSIONS;
  readonly maxConstellations = MAX_CONSTELLATIONS;

  sorted = computed(() => [...this.constellations()].sort((a, b) => a.data.level - b.data.level));
  canAdd = computed(() => this.constellations().length < MAX_CONSTELLATIONS);

  addConstellation(): void {
    this.constellations.update((constellations) => [...constellations, emptyConstellation(constellations.length + 1)]);
  }

  removeConstellation(wrapper: ConstellationWrapper): void {
    replacePreview(wrapper.preview, undefined);
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

  /** Preview for a picked icon, falling back to the path already stored on the constellation. */
  iconSrc(wrapper: ConstellationWrapper): string | undefined {
    return wrapper.preview ?? wrapper.data.icon ?? undefined;
  }

  onIconSelect(wrapper: ConstellationWrapper, files: FileItemType[] | undefined | null): void {
    const file = files?.[0]?.file;
    // The stored path stays untouched - the API rewrites it once the upload lands.
    wrapper.preview = replacePreview(wrapper.preview, file);
    wrapper.icon = file;
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
