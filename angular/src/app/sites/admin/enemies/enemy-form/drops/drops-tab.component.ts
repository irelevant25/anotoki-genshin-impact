import { Component, computed, input, model } from '@angular/core';
import { AccordionComponent } from '../../../../../shared/local-lib/components/accordion/accordion.component';
import { AccordionItemComponent } from '../../../../../shared/local-lib/components/accordion/item/item.component';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { NumberComponent } from '../../../../../shared/local-lib/components/number/number.component';
import { DropdownComponent } from '../../../../../shared/local-lib/components/dropdown/dropdown.component';
import { RadioComponent } from '../../../../../shared/local-lib/components/radio/radio.component';
import { DropdownOption } from '../../../../../shared/local-lib/services/options-helper.service';
import { Artifact, Audited, Material } from '../../../../../api';
import { ArtifactFormData } from '../../../../../sites/admin/shared/admin-form.model';
import { MaterialIconDirective } from '../../../shared/material-icon.directive';
import { DROP_KIND_OPTIONS, DropEntryWrapper, DropGroupWrapper, DropKind, emptyDropEntry, emptyDropGroup } from '../enemy-form.model';

@Component({
  selector: 'app-enemy-drops-tab',
  templateUrl: './drops-tab.component.html',
  styleUrls: ['./drops-tab.component.scss'],
  imports: [AccordionComponent, AccordionItemComponent, ButtonComponent, NumberComponent, DropdownComponent, RadioComponent, MaterialIconDirective],
})
export class DropsTabComponent {
  groups = model<DropGroupWrapper[]>([]);

  materials = input<Audited<Material>[]>([]);
  artifacts = input<Audited<Artifact>[]>([]);
  domainLevels = input<string[]>([]);

  readonly kindOptions = DROP_KIND_OPTIONS;

  materialOptions = computed<DropdownOption[]>(() => this.materials().map((material) => ({ key: material.id ?? -1, value: material.name })));
  artifactOptions = computed<DropdownOption[]>(() => this.artifacts().map((artifact) => ({ key: artifact.id ?? -1, value: artifact.name })));

  totalEntries = computed(() => this.groups().reduce((total, group) => total + group.entries.length, 0));

  /** Collapsed groups only show this, so it has to carry the conditions. */
  groupTitle(group: DropGroupWrapper, index: number): string {
    const level = group.level_from != null || group.level_to != null ? `Lv ${group.level_from ?? '?'}–${group.level_to ?? '∞'}` : 'Any level';
    const parts = [`Group ${index + 1}`, level];
    if (group.world_level != null) {
      parts.push(`World ${group.world_level}`);
    }
    if (group.domain_level) {
      parts.push(group.domain_level);
    }
    parts.push(`${group.entries.length} drop${group.entries.length === 1 ? '' : 's'}`);
    return parts.join(' · ');
  }

  private readonly _artifactIcons = computed(() => new Map(this.artifacts().map((artifact) => [artifact.id, artifact.icon])));

  // ── Groups ──────────────────────────────────────────────────────────────────

  addGroup(): void {
    this.groups.update((groups) => [...groups, emptyDropGroup()]);
  }

  removeGroup(group: DropGroupWrapper): void {
    this.groups.update((groups) => groups.filter((current) => current !== group));
  }

  /** Copies the conditions and every item, which is how drop tables scale by world level. */
  duplicateGroup(group: DropGroupWrapper): void {
    this.groups.update((groups) => {
      const index = groups.indexOf(group);
      const copy: DropGroupWrapper = {
        ...emptyDropGroup(),
        level_from: group.level_from,
        level_to: group.level_to,
        world_level: group.world_level,
        domain_level: group.domain_level,
        entries: group.entries.map((entry) => ({ ...emptyDropEntry(entry.kind), data: { ...entry.data, id: undefined } })),
      };
      return [...groups.slice(0, index + 1), copy, ...groups.slice(index + 1)];
    });
  }

  // ── Entries ─────────────────────────────────────────────────────────────────

  addEntry(group: DropGroupWrapper): void {
    this.groups.update((groups) => {
      group.entries = [...group.entries, emptyDropEntry()];
      return [...groups];
    });
  }

  removeEntry(group: DropGroupWrapper, entry: DropEntryWrapper): void {
    this.groups.update((groups) => {
      group.entries = group.entries.filter((current) => current !== entry);
      return [...groups];
    });
  }

  /** Switching kind clears the other side, so a row never points at both. */
  onKindChange(entry: DropEntryWrapper, kind: string | number | null | undefined): void {
    entry.kind = (kind as DropKind) === 'artifact' ? 'artifact' : 'material';
    if (entry.kind === 'material') {
      entry.data.artifact_id = null;
    } else {
      entry.data.material_id = null;
    }
    this.groups.update((groups) => [...groups]);
  }

  materialName(entry: DropEntryWrapper): string | undefined {
    return this.materialOptions().find((option) => option.key == entry.data.material_id)?.value as string | undefined;
  }

  artifactIcon(entry: DropEntryWrapper): string | undefined {
    return entry.data.artifact_id ? this._artifactIcons().get(entry.data.artifact_id) : undefined;
  }
}
