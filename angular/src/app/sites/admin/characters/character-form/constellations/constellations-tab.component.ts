import { Component, signal } from '@angular/core';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { ConstellationFormData } from '../../../services/admin-api.service';

function emptyConstellation(): ConstellationFormData {
  return { name: '', level: 1, icon: '', description: '' };
}

@Component({
  selector: 'app-constellations-tab',
  templateUrl: './constellations-tab.component.html',
  styleUrls: ['./constellations-tab.component.scss'],
  imports: [ButtonComponent],
})
export class ConstellationsTabComponent {
  constellations = signal<ConstellationFormData[]>([]);
  pendingCoIcon = signal<(File | null)[]>([]);
  coIconPreviews = signal<(string | null)[]>([]);

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
  setConstellation(i: number, field: keyof ConstellationFormData, value: any): void {
    this.constellations.update(c => c.map((co, idx) => idx === i ? { ...co, [field]: value } : co));
  }
  onConstellationIconSelect(i: number, event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
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
