import { Component, model } from '@angular/core';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { TextComponent } from '../../../../../shared/local-lib/components/text/text.component';
import { TextareaComponent } from '../../../../../shared/local-lib/components/textarea/textarea.component';
import { NumberComponent } from '../../../../../shared/local-lib/components/number/number.component';
import { FileComponent, FileItemType } from '../../../../../shared/local-lib/components/file/file.component';
import { TooltipComponent } from '../../../../../shared/local-lib/components/tooltip/tooltip.component';
import { ConstellationFormData } from '../../../services/admin-api.service';

function emptyConstellation(): ConstellationFormData {
  return { name: '', level: 1, icon: '', description: '' };
}

@Component({
  selector: 'app-constellations-tab',
  templateUrl: './constellations-tab.component.html',
  styleUrls: ['./constellations-tab.component.scss'],
  imports: [ButtonComponent, TextComponent, TextareaComponent, NumberComponent, FileComponent, TooltipComponent],
})
export class ConstellationsTabComponent {
  constellations = model<ConstellationFormData[]>([]);
  pendingCoIcon = model<(File | null)[]>([]);
  coIconPreviews = model<(string | null)[]>([]);

  addConstellation(): void {
    this.constellations.update(c => [...c, { ...emptyConstellation(), level: c.length + 1 }]);
    this.pendingCoIcon.update(f => [...f, null]);
    this.coIconPreviews.update(p => [...p, null]);
  }

  removeConstellation(i: number): void {
    const url = this.coIconPreviews()[i];
    if (url) URL.revokeObjectURL(url);
    this.constellations.update(c => c.filter((_, idx) => idx !== i));
    this.pendingCoIcon.update(f => f.filter((_, idx) => idx !== i));
    this.coIconPreviews.update(p => p.filter((_, idx) => idx !== i));
  }

  onConstellationIconSelect(i: number, files: FileItemType[] | undefined | null): void {
    const file = files?.[0]?.file;
    if (!file) return;
    const oldUrl = this.coIconPreviews()[i];
    if (oldUrl) URL.revokeObjectURL(oldUrl);
    const url = URL.createObjectURL(file);
    this.pendingCoIcon.update(f => f.map((x, idx) => idx === i ? file : x));
    this.coIconPreviews.update(p => p.map((x, idx) => idx === i ? url : x));
  }

  coIconPreview(i: number): string | null {
    return this.coIconPreviews()[i] ?? this.constellations()[i]?.icon ?? null;
  }
}
