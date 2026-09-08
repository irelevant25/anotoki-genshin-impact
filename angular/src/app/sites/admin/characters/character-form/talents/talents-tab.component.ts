import { Component, computed, inject, input, model, output, signal } from '@angular/core';
import { takeUntil } from 'rxjs';
import { AbstractModalComponent } from '../../../../../shared/local-lib/abstract-modal.class';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { TextComponent } from '../../../../../shared/local-lib/components/text/text.component';
import { TextareaComponent } from '../../../../../shared/local-lib/components/textarea/textarea.component';
import { DropdownComponent } from '../../../../../shared/local-lib/components/dropdown/dropdown.component';
import { DropdownOption } from '../../../../../shared/local-lib/services/options-helper.service';
import { TabsComponent } from '../../../../../shared/local-lib/components/tabs/tabs.component';
import { TabComponent } from '../../../../../shared/local-lib/components/tabs/tab/tab.component';
import { FieldContainerComponent } from '../../../../../shared/local-lib/components/field-container/field-container.component';
import { NumberComponent } from '../../../../../shared/local-lib/components/number/number.component';
import { TalentCostFormData } from '../../../../../sites/admin/shared/admin-form.model';
import { Audited, Material, TalentSetApiService } from '../../../../../api';
import { MaterialIconDirective } from '../../../shared/material-icon.directive';
import { TalentSetSelectorComponent } from './set-selector/set-selector.component';
import { createUid, emptyTalent, reorder, revokePicked, resequence, TalentWrapper } from '../character-form.model';
import { EntityImageComponent } from '../../../shared/entity-image/entity-image.component';
import { PickedImage } from '../../../shared/image-upload/image-upload.component';
import { toAssetBaseName } from '../../../shared/asset-name';

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
    EntityImageComponent,
    ButtonComponent,
    TextComponent,
    TextareaComponent,
    DropdownComponent,
    TabsComponent,
    TabComponent,
    FieldContainerComponent,
    NumberComponent,
    MaterialIconDirective,
  ],
})
export class TalentsTabComponent extends AbstractModalComponent {
  talents = model<TalentWrapper[]>([]);
  talentCost = model<TalentCostFormData[]>([]);
  talentTypes = input<string[]>([]);
  materials = input<Audited<Material>[]>([]);
  /** The character's current talent set, marked in the picker. */
  talentSetId = input<number | null | undefined>();
  /** Emitted with the chosen set id, so the form points the character at it. */
  talentSetChosen = output<number>();

  private readonly _talentSetApi = inject(TalentSetApiService);

  readonly minCostLevel = MIN_COST_LEVEL;
  readonly maxCostLevel = MAX_COST_LEVEL;

  /**
   * Points this character at another talent set. Picks a set, loads its talents
   * and costs into the tab, and tells the form to save the new set on the
   * character. Mirrors the ascension "Choose set".
   */
  chooseSet(): void {
    const modal = this.modalService.open<TalentSetSelectorComponent, number | undefined>(TalentSetSelectorComponent, {
      size: '4',
      scrollable: true,
    });
    modal.componentInstance.currentSetId.set(this.talentSetId() ?? null);

    modal.closed.pipe(takeUntil(this.unsubscriber)).subscribe((setId) => {
      if (typeof setId !== 'number') {
        return;
      }
      this._talentSetApi.getTalentSet(setId).subscribe({
        next: (detail) => {
          this.talents.set((detail?.talents ?? []).map((data) => ({ uid: createUid(), data: data as unknown as TalentWrapper['data'] })));
          this.talentCost.set((detail?.talent_cost ?? []) as unknown as TalentCostFormData[]);
          this.talentSetChosen.emit(setId);
          this.notificationService.showSuccess(`Now using set #${setId} (${detail?.talents?.length ?? 0} talents).`);
        },
        error: () => this.notificationService.showError('Could not load that set’s talents.'),
      });
    });
  }

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

  /** Two-step clear of the whole set (talents and their costs), matching the voice-over tab. */
  deleteAllArmed = signal(false);

  deleteAll(): void {
    if (!this.deleteAllArmed()) {
      this.deleteAllArmed.set(true);
      return;
    }
    const count = this.talents().length;
    this.talents.set([]);
    this.talentCost.set([]);
    this.deleteAllArmed.set(false);
    this.notificationService.showSuccess(`${count} talents removed. They are deleted when you save.`);
  }

  cancelDeleteAll(): void {
    this.deleteAllArmed.set(false);
  }

  // ── Talents ─────────────────────────────────────────────────────────────────

  addTalent(): void {
    this.talents.update((talents) => [...talents, emptyTalent(talents.length + 1, this.talentTypes()[0] ?? '')]);
  }

  removeTalent(wrapper: TalentWrapper): void {
    revokePicked(wrapper.pending);
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

  /** Stored path; the slot shows a pending pick when there is one. */
  iconPath(wrapper: TalentWrapper): string | undefined {
    return wrapper.data.icon || undefined;
  }

  /** Talent art is named after the talent itself. */
  iconName(wrapper: TalentWrapper): string {
    return toAssetBaseName(wrapper.data.name);
  }

  onPicked(wrapper: TalentWrapper, picked: PickedImage): void {
    revokePicked(wrapper.pending);
    wrapper.pending = picked;
  }

  onCleared(wrapper: TalentWrapper): void {
    revokePicked(wrapper.pending);
    wrapper.pending = undefined;
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
