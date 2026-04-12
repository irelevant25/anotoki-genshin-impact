import { Component, computed, model } from '@angular/core';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { TextComponent } from '../../../../../shared/local-lib/components/text/text.component';
import { TextareaComponent } from '../../../../../shared/local-lib/components/textarea/textarea.component';
import { DropdownComponent } from '../../../../../shared/local-lib/components/dropdown/dropdown.component';
import { DropdownOption } from '../../../../../shared/local-lib/services/options-helper.service';
import { FileComponent, FileItemType } from '../../../../../shared/local-lib/components/file/file.component';
import { TabsComponent } from '../../../../../shared/local-lib/components/tabs/tabs.component';
import { TabComponent } from '../../../../../shared/local-lib/components/tabs/tab/tab.component';
import { TalentCostFormData, TalentFormData } from '../../../services/admin-api.service';
import { Material } from '../../../../../shared/models.generated';
import { FieldContainerComponent } from "../../../../../shared/local-lib/components/field-container/field-container.component";
import { TooltipComponent } from "../../../../../shared/local-lib/components/tooltip/tooltip.component";
import { TalentWrapper } from '../character-form.component';
import { NumberComponent } from "../../../../../shared/local-lib/components/number/number.component";

interface TalenCostGroup {
  level: number;
  cost: TalentCostFormData[];
}

@Component({
  selector: 'app-talents-tab',
  templateUrl: './talents-tab.component.html',
  styleUrls: ['./talents-tab.component.scss'],
  imports: [ButtonComponent, TextComponent, TextareaComponent, DropdownComponent, FileComponent, TabsComponent, TabComponent, FieldContainerComponent, TooltipComponent, NumberComponent],
})
export class TalentsTabComponent {
  talents = model<TalentWrapper[]>([]);
  talentsSorted = computed(() => {
    return this.talents().sort((a, b) => a.data.order - b.data.order)
  });

  talentTypes = model<string[]>([]);
  materials = model<Material[]>([]);
  materialOptions = computed<DropdownOption[]>(() => {
    return this.materials().map(m => ({ key: m.id ?? -1, value: m.name, data: m }))
  });

  talentCost = model<TalentCostFormData[]>([]);
  talentCostGroups = computed<TalenCostGroup[]>(() => {
    const talentCost = this.talentCost();
    const costLevels: TalenCostGroup[] = [];
    for (const cost of talentCost) {
      const costLevel = costLevels.find(x => x.level === cost.level);
      if (costLevel) {
        costLevel.cost.push(cost);
      } else {
        costLevels.push({ level: cost.level, cost: [cost] });
      }
    }
    costLevels.forEach(x => x.cost.sort((a, b) => a.order - b.order));
    return costLevels.sort((a, b) => a.level - b.level);
  });

  addTalent(): void {
    this.talents.update(t => [...t, { data: { name: '', type: 'Normal Attack', icon: '', description: '', order: t.length } }]);
  }

  removeTalent(i: number): void {
    this.talents.update(t => t.filter((_, idx) => idx !== i));
  }

  costsByLevel(level: number): { cost: TalentCostFormData; ci: number }[] {
    return this.talentCost()
      .map((cost, ci) => ({ cost, ci }))
      .filter(({ cost }) => cost.level === level);
  }

  onTalentIconSelect(item: TalentWrapper, files: FileItemType[] | undefined | null): void {
    const file = files?.[0]?.file;
    item.icon = file;
    item.data.icon = file ? URL.createObjectURL(file) : '';
  }

  onPhaseChange(index: number, newOrder: number | string | null | undefined): void {
    const order = Number(newOrder);
    if (!order || isNaN(order)) {
      return;
    }
    const talents = this.talents();
    const oldOrder = talents[index].data.order;
    if (order === oldOrder) {
      return;
    }

    this.talents.update(list => {
      const updated = [...list];
      for (let i = 0; i < updated.length; i++) {
        const updatingConstellation = updated[i];
        if (i === index) {
          updatingConstellation.data.order = order;
        } else if (oldOrder < order && updatingConstellation.data.order > oldOrder && updatingConstellation.data.order <= order) {
          updatingConstellation.data.order = updatingConstellation.data.order - 1;
        } else if (oldOrder > order && updatingConstellation.data.order >= order && updatingConstellation.data.order < oldOrder) {
          updatingConstellation.data.order = updatingConstellation.data.order + 1;
        }
      }
      return updated;
    });
  }

  addCostLevel(): void {
    const costs = this.talentCost();
    const nextLevel = costs.length > 0 ? Math.max(...costs.map(c => c.level)) + 1 : 2;
    this.talentCost.update(c => [...c, { level: nextLevel, material_id: 0, quantity: 1, order: c.length }]);
  }

  removeCostLevel(costGroup: TalenCostGroup): void {
    this.talentCost.update(c => c.filter(x => x.level !== costGroup.level));
  }

  addCostLevelMaterial(costGroup: TalenCostGroup): void {
    this.talentCost.update(c => [...c, { level: costGroup.level, material_id: 0, quantity: 0, order: c.length }]);
  }

  removeCostLevelMaterial(cost: TalentCostFormData): void {
    this.talentCost.update(c => c.filter(x => x !== cost));
    if (this.talentCost().length === 0) {
      this.addCostLevel();
    }
  }

  onOrderChange(item: TalentWrapper, newOrder: number | string | null | undefined): void {
    const order = Number(newOrder);
    if (!order || isNaN(order)) {
      return;
    }
    const oldOrder = item.data.order;
    if (order === oldOrder) {
      return;
    }

    this.talents.update(list => {
      const updated = [...list];
      for (let i = 0; i < updated.length; i++) {
        if (updated[i] === item) {
          updated[i].data.order = order;
        } else if (oldOrder < order && updated[i].data.order > oldOrder && updated[i].data.order <= order) {
          updated[i].data.order = updated[i].data.order - 1;
        } else if (oldOrder > order && updated[i].data.order >= order && updated[i].data.order < oldOrder) {
          updated[i].data.order = updated[i].data.order + 1;
        }
      }
      return updated;
    });
  }

  onLevelChange(costGroup: TalenCostGroup, newLevel: number | string | null | undefined): void {
    const level = Number(newLevel);
    if (!level || isNaN(level)) {
      return;
    }

    const oldLevel = costGroup.level;
    if (level === oldLevel) {
      return;
    }

    this.talentCost.update(list => {
      const updated = [...list];
      for (const cost of updated) {
        if (cost.level === oldLevel) {
          cost.level = level;
        } else if (oldLevel < level && cost.level > oldLevel && cost.level <= level) {
          cost.level -= 1;
        } else if (oldLevel > level && cost.level >= level && cost.level < oldLevel) {
          cost.level += 1;
        }
      }
      return updated;
    });
  }

  onCostOrderChange(array: TalentCostFormData[], cost: TalentCostFormData, newOrder: number | string | null | undefined): void {
    const order = Number(newOrder);
    if (!order || isNaN(order)) {
      return;
    }
    const oldOrder = cost.order;
    if (order === oldOrder) {
      return;
    }

    this.talentCost.update(list => {
      const talentCost = [...list];
      const updated = talentCost.filter(x => array.includes(x));
      for (let i = 0; i < updated.length; i++) {
        if (updated[i] === cost) {
          updated[i].order = order;
        } else if (oldOrder < order && updated[i].order > oldOrder && updated[i].order <= order) {
          updated[i].order = updated[i].order - 1;
        } else if (oldOrder > order && updated[i].order >= order && updated[i].order < oldOrder) {
          updated[i].order = updated[i].order + 1;
        }
      }
      return talentCost;
    });
  }
}
