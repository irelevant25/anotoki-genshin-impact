import { Component, computed, model } from '@angular/core';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { TextComponent } from '../../../../../shared/local-lib/components/text/text.component';
import { TextareaComponent } from '../../../../../shared/local-lib/components/textarea/textarea.component';
import { DropdownComponent } from '../../../../../shared/local-lib/components/dropdown/dropdown.component';
import { DropdownOption } from '../../../../../shared/local-lib/services/options-helper.service';
import { FileComponent, FileItemType } from '../../../../../shared/local-lib/components/file/file.component';
import { TooltipComponent } from '../../../../../shared/local-lib/components/tooltip/tooltip.component';
import { TalentCostFormData, TalentFormData } from '../../../services/admin-api.service';
import { Material } from '../../../../../shared/models.generated';

function emptyTalent(): TalentFormData {
  return { name: '', type: 'Normal Attack', icon: '', description: '', costs: [] };
}

@Component({
  selector: 'app-talents-tab',
  templateUrl: './talents-tab.component.html',
  styleUrls: ['./talents-tab.component.scss'],
  imports: [ButtonComponent, TextComponent, TextareaComponent, DropdownComponent, FileComponent, TooltipComponent],
})
export class TalentsTabComponent {
  talents = model<TalentFormData[]>([]);
  pendingTaIcon = model<(File | null)[]>([]);
  taIconPreviews = model<(string | null)[]>([]);
  talentTypes = model<string[]>([]);
  materials = model<Material[]>([]);

  materialOptions = computed<DropdownOption[]>(() => this.materials().map(m => ({ key: m.id ?? -1, value: m.name })));

  addTalent(): void {
    this.talents.update(t => [...t, emptyTalent()]);
    this.pendingTaIcon.update(f => [...f, null]);
    this.taIconPreviews.update(p => [...p, null]);
  }

  removeTalent(i: number): void {
    const url = this.taIconPreviews()[i];
    if (url) URL.revokeObjectURL(url);
    this.talents.update(t => t.filter((_, idx) => idx !== i));
    this.pendingTaIcon.update(f => f.filter((_, idx) => idx !== i));
    this.taIconPreviews.update(p => p.filter((_, idx) => idx !== i));
  }

  onTalentIconSelect(i: number, files: FileItemType[] | undefined | null): void {
    const file = files?.[0]?.file;
    if (!file) return;
    const oldUrl = this.taIconPreviews()[i];
    if (oldUrl) URL.revokeObjectURL(oldUrl);
    const url = URL.createObjectURL(file);
    this.pendingTaIcon.update(f => f.map((x, idx) => idx === i ? file : x));
    this.taIconPreviews.update(p => p.map((x, idx) => idx === i ? url : x));
  }

  taIconPreview(i: number): string | null {
    return this.taIconPreviews()[i] ?? this.talents()[i]?.icon ?? null;
  }

  talentCostLevels(i: number): number[] {
    const costs = this.talents()[i]?.costs ?? [];
    return [...new Set(costs.map(c => c.level))].sort((a, b) => a - b);
  }

  talentCostsByLevel(i: number, level: number): { cost: TalentCostFormData; ci: number }[] {
    return (this.talents()[i]?.costs ?? [])
      .map((cost, ci) => ({ cost, ci }))
      .filter(({ cost }) => cost.level === level);
  }

  addTalentLevel(i: number): void {
    const costs = this.talents()[i]?.costs ?? [];
    const nextLevel = costs.length > 0 ? Math.max(...costs.map(c => c.level)) + 1 : 2;
    this.talents.update(t => t.map((ta, idx) => idx === i
      ? { ...ta, costs: [...(ta.costs ?? []), { level: nextLevel, material_id: 0, quantity: 1 }] } : ta));
  }

  removeTalentLevel(i: number, level: number): void {
    this.talents.update(t => t.map((ta, idx) => idx === i
      ? { ...ta, costs: (ta.costs ?? []).filter(c => c.level !== level) } : ta));
  }

  addTalentCostToLevel(i: number, level: number): void {
    this.talents.update(t => t.map((ta, idx) => idx === i
      ? { ...ta, costs: [...(ta.costs ?? []), { level, material_id: 0, quantity: 1 }] } : ta));
  }

  removeTalentCost(talentIdx: number, costIdx: number): void {
    this.talents.update(t => t.map((ta, i) => i === talentIdx
      ? { ...ta, costs: (ta.costs ?? []).filter((_, ci) => ci !== costIdx) } : ta));
  }

  setTalentCost(talentIdx: number, costIdx: number, field: keyof TalentCostFormData, value: any): void {
    this.talents.update(t => t.map((ta, i) => i === talentIdx
      ? { ...ta, costs: (ta.costs ?? []).map((c, ci) => ci === costIdx ? { ...c, [field]: value } : c) } : ta));
  }
}
