import { Component, computed, model } from '@angular/core';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { TextComponent } from '../../../../../shared/local-lib/components/text/text.component';
import { TextareaComponent } from '../../../../../shared/local-lib/components/textarea/textarea.component';
import { NumberComponent } from '../../../../../shared/local-lib/components/number/number.component';
import { FileComponent, FileItemType } from '../../../../../shared/local-lib/components/file/file.component';
import { TooltipComponent } from '../../../../../shared/local-lib/components/tooltip/tooltip.component';
import { FieldContainerComponent } from "../../../../../shared/local-lib/components/field-container/field-container.component";
import { ConstellationWrapper } from '../character-form.component';

@Component({
  selector: 'app-constellations-tab',
  templateUrl: './constellations-tab.component.html',
  styleUrls: ['./constellations-tab.component.scss'],
  imports: [ButtonComponent, TextComponent, TextareaComponent, NumberComponent, FileComponent, TooltipComponent, FieldContainerComponent, FieldContainerComponent],
})
export class ConstellationsTabComponent {
  constellations = model<ConstellationWrapper[]>([]);
  constellationSorted = computed(() => {
    return this.constellations().sort((a, b) => a.data.level - b.data.level)
  });

  addConstellation(): void {
    this.constellations.update(c => [...c, { data: { name: '', icon: '', description: '', level: c.length + 1 } }]);
  }

  removeConstellation(i: number): void {
    this.constellations.update(c => c.filter((_, idx) => idx !== i));
  }

  onConstellationIconSelect(item: ConstellationWrapper, files: FileItemType[] | undefined | null): void {
    const file = files?.[0]?.file;
    item.icon = file;
    item.data.icon = file ? URL.createObjectURL(file) : '';
  }

  onLevelChange(index: number, newLevel: number | string | null | undefined): void {
    const level = Number(newLevel);
    if (!level || isNaN(level)) {
      return;
    }
    const constellations = this.constellations();
    const oldLevel = constellations[index].data.level;
    if (level === oldLevel) {
      return;
    }

    this.constellations.update(list => {
      const updated = [...list];
      for (let i = 0; i < updated.length; i++) {
        const updatingConstellation = updated[i];
        if (i === index) {
          updatingConstellation.data.level = level;
        } else if (oldLevel < level && updatingConstellation.data.level > oldLevel && updatingConstellation.data.level <= level) {
          updatingConstellation.data.level = updatingConstellation.data.level - 1;
        } else if (oldLevel > level && updatingConstellation.data.level >= level && updatingConstellation.data.level < oldLevel) {
          updatingConstellation.data.level = updatingConstellation.data.level + 1;
        }
      }
      return updated;
    });
  }
}
