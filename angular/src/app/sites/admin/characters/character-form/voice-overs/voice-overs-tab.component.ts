import { Component, computed, model, QueryList, ViewChildren } from '@angular/core';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { NumberComponent } from '../../../../../shared/local-lib/components/number/number.component';
import { AccordionComponent } from '../../../../../shared/local-lib/components/accordion/accordion.component';
import { AccordionItemComponent } from '../../../../../shared/local-lib/components/accordion/item/item.component';
import { TabsComponent } from '../../../../../shared/local-lib/components/tabs/tabs.component';
import { TabComponent } from '../../../../../shared/local-lib/components/tabs/tab/tab.component';
import { VoiceOverFormData } from '../../../services/admin-api.service';
import { VoiceOverWrapper } from '../character-form.component';
import { VoiceOversTabItemComponent } from './tab/tab.component';

@Component({
  selector: 'app-voice-overs-tab',
  templateUrl: './voice-overs-tab.component.html',
  styleUrls: ['./voice-overs-tab.component.scss'],
  imports: [ButtonComponent, NumberComponent, AccordionComponent, AccordionItemComponent, TabsComponent, TabComponent, VoiceOversTabItemComponent],
})
export class VoiceOversTabComponent {
  @ViewChildren(VoiceOversTabItemComponent) tabs?: QueryList<VoiceOversTabItemComponent>;
  voiceOvers = model<VoiceOverWrapper[]>([]);
  voiceOverTypes = model<string[]>([]);
  audio = model<HTMLAudioElement | null>(null);
  playingKey = model<string | null>(null);

  vosByType = computed(() => {
    const result: Record<string, VoiceOverWrapper[]> = {};
    this.voiceOvers().forEach(vo => {
      if (!result[vo.data.type]) result[vo.data.type] = [];
      result[vo.data.type].push(vo);
    });
    for (const entries of Object.values(result)) {
      entries.sort((a, b) => a.data.order - b.data.order);
      const titleCounts = new Map<string, number>();
      for (const e of entries) {
        const title = e.data.title_english || 'Untitled';
        titleCounts.set(title, (titleCounts.get(title) ?? 0) + 1);
      }
      for (const e of entries) {
        const title = e.data.title_english || 'Untitled';
        const isDuplicate = titleCounts.get(title)! > 1;
        const text = isDuplicate && e.data.text_english ? ` - ${e.data.text_english.substring(0, 40)}${e.data.text_english.length > 40 ? '...' : ''}` : '';
        e.displayTitle = `${e.data.order}. ${title} ${text}`;
      }
    }
    return result;
  });

  onOrderChange(item: VoiceOverFormData, newOrder: number | string | null | undefined): void {
    const order = Number(newOrder);
    if (!order || isNaN(order)) {
      return;
    }
    const oldOrder = item.order;
    if (order === oldOrder) {
      return;
    }

    this.voiceOvers.update(list => {
      const updated = [...list];
      for (let i = 0; i < updated.length; i++) {
        if (updated[i].data.type !== item.type) {
          continue;
        }
        if (updated[i].data === item) {
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

  addVoiceOver(type = 'story'): void {
    const typeCount = this.voiceOvers().filter(v => v.data.type === type).length;
    this.voiceOvers.update(v => [...v, { data: { order: typeCount + 1, type: 'story', title_english: '' } }]);
  }

  stopAudio(): void {
    this.tabs?.forEach(t => t.stopAudio());
  }

  removeVoiceOver(i: number): void {
    // this.stopAudio();
    const removed = this.voiceOvers()[i];
    this.voiceOvers.update(v => {
      const filtered = v.filter((_, idx) => idx !== i);
      // Re-sequence orders within the same type
      return filtered.map(vo => {
        if (vo.data.type === removed.data.type && vo.data.order > removed.data.order) {
          return { ...vo, order: vo.data.order - 1 };
        }
        return vo;
      });
    });
  }

}
