import { Component, computed, input, model } from '@angular/core';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { TextComponent } from '../../../../../shared/local-lib/components/text/text.component';
import { TextareaComponent } from '../../../../../shared/local-lib/components/textarea/textarea.component';
import { DropdownComponent } from '../../../../../shared/local-lib/components/dropdown/dropdown.component';
import { DropdownOption } from '../../../../../shared/local-lib/services/options-helper.service';
import { FileComponent, FileItemType } from '../../../../../shared/local-lib/components/file/file.component';
import { TabsComponent } from '../../../../../shared/local-lib/components/tabs/tabs.component';
import { TabComponent } from '../../../../../shared/local-lib/components/tabs/tab/tab.component';
import { FieldContainerComponent } from '../../../../../shared/local-lib/components/field-container/field-container.component';
import { TooltipComponent } from '../../../../../shared/local-lib/components/tooltip/tooltip.component';
import { NumberComponent } from '../../../../../shared/local-lib/components/number/number.component';
import { TalentCostFormData } from '../../../services/admin-api.service';
import { Material } from '../../../../../shared/models.generated';
import { emptyTalent, IMAGE_EXTENSIONS, reorder, replacePreview, resequence, TalentWrapper } from '../character-form.model';

interface TalentCostGroup {
  level: number;
  cost: TalentCostFormData[];
}

/** Talents level from 2 to 10, so a character has at most nine cost levels. */
const MIN_COST_LEVEL = 2;
const MAX_COST_LEVEL = 10;

@Component({
  selector: 'app-talents-tab',
  templateUrl: './talents-tab.component.html',
  styleUrls: ['./talents-tab.component.scss'],
  imports: [
    ButtonComponent,
    TextComponent,
    TextareaComponent,
    DropdownComponent,
    FileComponent,
    TabsComponent,
    TabComponent,
    FieldContainerComponent,
    TooltipComponent,
    NumberComponent,
  ],
})
export class TalentsTabComponent {
  talents = model<TalentWrapper[]>([]);
  talentCost = model<TalentCostFormData[]>([]);
  talentTypes = input<string[]>([]);
  materials = input<Material[]>([]);

  readonly imageExtensions = IMAGE_EXTENSIONS;
  readonly minCostLevel = MIN_COST_LEVEL;
  readonly maxCostLevel = MAX_COST_LEVEL;

  sortedTalents = computed(() => [...this.talents()].sort((a, b) => a.data.order - b.data.order));
  materialOptions = computed<DropdownOption[]>(() => this.materials().map((material) => ({ key: material.id ?? -1, value: material.name, data: material })));

  /** Costs grouped per talent level, which is how the tab presents them. */
  costGroups = computed<TalentCostGroup[]>(() => {
    const groups = new Map<number, TalentCostFormData[]>();
    for (const cost of this.talentCost()) {
      const group = groups.get(cost.level);
      if (group) {
        group.push(cost);
      } else {
        groups.set(cost.level, [cost]);
      }
    }
    return [...groups.entries()]
      .map(([level, cost]) => ({ level, cost: cost.sort((a, b) => a.order - b.order) }))
      .sort((a, b) => a.level - b.level);
  });

  canAddCostLevel = computed(() => this.costGroups().length < MAX_COST_LEVEL - MIN_COST_LEVEL + 1);

  // ── Talents ─────────────────────────────────────────────────────────────────

  addTalent(): void {
    this.talents.update((talents) => [...talents, emptyTalent(talents.length + 1, this.talentTypes()[0] ?? '')]);
  }

  removeTalent(wrapper: TalentWrapper): void {
    replacePreview(wrapper.preview, undefined);
    this.talents.update((talents) => {
      const remaining = talents.filter((talent) => talent !== wrapper);
      resequence(
        remaining,
        (talent) => talent.data.order,
        (talent, order) => (talent.data.order = order)
      );
      return remaining;
    });
  }

  /** Preview for a picked icon, falling back to the path already stored on the talent. */
  iconSrc(wrapper: TalentWrapper): string | undefined {
    return wrapper.preview ?? wrapper.data.icon ?? undefined;
  }

  onIconSelect(wrapper: TalentWrapper, files: FileItemType[] | undefined | null): void {
    const file = files?.[0]?.file;
    // The stored path stays untouched - the API rewrites it once the upload lands.
    wrapper.preview = replacePreview(wrapper.preview, file);
    wrapper.icon = file;
  }

  onTalentOrderChange(wrapper: TalentWrapper, newOrder: number | string | null | undefined): void {
    this.talents.update((talents) => {
      const changed = reorder(
        talents,
        wrapper,
        newOrder,
        (talent) => talent.data.order,
        (talent, order) => (talent.data.order = order)
      );
      return changed ? [...talents] : talents;
    });
  }

  // ── Costs ───────────────────────────────────────────────────────────────────

  addCostLevel(): void {
    const groups = this.costGroups();
    const nextLevel = groups.length > 0 ? Math.max(...groups.map((group) => group.level)) + 1 : MIN_COST_LEVEL;
    if (nextLevel > MAX_COST_LEVEL) {
      return;
    }
    this.talentCost.update((costs) => [...costs, { level: nextLevel, quantity: 1, order: 1 }]);
  }

  removeCostLevel(group: TalentCostGroup): void {
    this.talentCost.update((costs) => costs.filter((cost) => cost.level !== group.level));
  }

  addCostMaterial(group: TalentCostGroup): void {
    this.talentCost.update((costs) => [...costs, { level: group.level, quantity: 1, order: group.cost.length + 1 }]);
  }

  removeCostMaterial(group: TalentCostGroup, cost: TalentCostFormData): void {
    this.talentCost.update((costs) => {
      const remaining = costs.filter((current) => current !== cost);
      resequence(
        remaining.filter((current) => current.level === group.level),
        (current) => current.order,
        (current, order) => (current.order = order)
      );
      return remaining;
    });
  }

  onCostLevelChange(group: TalentCostGroup, newLevel: number | string | null | undefined): void {
    const level = Number(newLevel);
    if (!Number.isFinite(level) || level < MIN_COST_LEVEL || level > MAX_COST_LEVEL || level === group.level) {
      return;
    }

    this.talentCost.update((costs) => {
      const oldLevel = group.level;
      for (const cost of costs) {
        if (cost.level === oldLevel) {
          cost.level = level;
        } else if (oldLevel < level && cost.level > oldLevel && cost.level <= level) {
          cost.level -= 1;
        } else if (oldLevel > level && cost.level >= level && cost.level < oldLevel) {
          cost.level += 1;
        }
      }
      return [...costs];
    });
  }

  onCostOrderChange(group: TalentCostGroup, cost: TalentCostFormData, newOrder: number | string | null | undefined): void {
    this.talentCost.update((costs) => {
      const changed = reorder(
        group.cost,
        cost,
        newOrder,
        (current) => current.order,
        (current, order) => (current.order = order)
      );
      return changed ? [...costs] : costs;
    });
  }
}
