import { Component, model } from '@angular/core';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { CharacterFormData, RelationshipFormData } from '../../../services/admin-api.service';
import { TextComponent } from '../../../../../shared/local-lib/components/text/text.component';
import { DropdownComponent } from '../../../../../shared/local-lib/components/dropdown/dropdown.component';
import { CalendarComponent } from '../../../../../shared/local-lib/components/calendar/calendar.component';
import { CheckboxComponent } from '../../../../../shared/local-lib/components/checkbox/checkbox.component';
import { TextareaComponent } from '../../../../../shared/local-lib/components/textarea/textarea.component';
import { FileComponent } from '../../../../../shared/local-lib/components/file/file.component';
import { TextFieldContainerComponent } from '../../../../../shared/local-lib/components/text-field-container/text-field-container.component';
import { TooltipComponent } from '../../../../../shared/local-lib/components/tooltip/tooltip.component';
import { ChipsComponent } from "../../../../../shared/local-lib/components/chips/chips.component";

function emptyRelationship(): RelationshipFormData {
  return { type: '', name: '', state: '' };
}

@Component({
  selector: 'app-base-info-tab',
  templateUrl: './base-info-tab.component.html',
  styleUrls: ['./base-info-tab.component.scss'],
  imports: [ButtonComponent, TextComponent, DropdownComponent, CalendarComponent, CheckboxComponent, TextareaComponent, FileComponent, TextFieldContainerComponent, TooltipComponent, ChipsComponent],
})
export class BaseInfoTabComponent {
  character = model<CharacterFormData>({} as CharacterFormData);
  charIconPreviews = model<Record<string, string>>({});
  pendingCharFiles = model<Record<string, File>>({});
  relationships = model<RelationshipFormData[]>([]);
  selectedRoles = model<string[]>([]);

  // Lookup signals
  elements = model<string[]>([]);
  weaponTypes = model<string[]>([]);
  models = model<string[]>([]);
  rarities = model<string[]>([]);
  regions = model<string[]>([]);
  relationshipTypes = model<string[]>([]);
  roles = model<string[]>([]);
  characterStates = model<string[]>([]);

  // ── Character field ───────────────────────────────────────────────────────────
  setCharField(field: keyof CharacterFormData, value: any): void {
    this.character.update((c) => ({ ...c, [field]: value }));
  }

  onCharFileSelect(field: keyof CharacterFormData, event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const oldUrl = this.charIconPreviews()[field as string];
    if (oldUrl) URL.revokeObjectURL(oldUrl);
    const url = URL.createObjectURL(file);
    this.pendingCharFiles.update((m) => ({ ...m, [field]: file }));
    this.charIconPreviews.update((m) => ({ ...m, [field]: url }));
  }

  charIconPreview(field: keyof CharacterFormData): string | null {
    return this.charIconPreviews()[field as string] ?? (this.character() as any)[field] ?? null;
  }

  // ── Relationships ─────────────────────────────────────────────────────────────
  addRelationship(): void {
    this.relationships.update((r) => [...r, emptyRelationship()]);
  }
  removeRelationship(i: number): void {
    this.relationships.update((r) => r.filter((_, idx) => idx !== i));
  }
  setRelationship(i: number, field: keyof RelationshipFormData, value: any): void {
    this.relationships.update((r) => r.map((re, idx) => (idx === i ? { ...re, [field]: value } : re)));
  }
}
