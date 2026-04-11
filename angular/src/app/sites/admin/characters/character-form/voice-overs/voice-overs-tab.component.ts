import { Component, computed, model } from '@angular/core';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { TextComponent } from '../../../../../shared/local-lib/components/text/text.component';
import { TextareaComponent } from '../../../../../shared/local-lib/components/textarea/textarea.component';
import { NumberComponent } from '../../../../../shared/local-lib/components/number/number.component';
import { FileComponent, FileItemType } from '../../../../../shared/local-lib/components/file/file.component';
import { AccordionComponent } from '../../../../../shared/local-lib/components/accordion/accordion.component';
import { AccordionItemComponent } from '../../../../../shared/local-lib/components/accordion/item/item.component';
import { TabsComponent } from '../../../../../shared/local-lib/components/tabs/tabs.component';
import { TabComponent } from '../../../../../shared/local-lib/components/tabs/tab/tab.component';
import { VoiceOverFormData } from '../../../services/admin-api.service';
import { TextFieldContainerComponent } from '../../../../../shared/local-lib/components/text-field-container/text-field-container.component';

function emptyVoiceOver(): VoiceOverFormData {
  return { order: 1, type: 'story', title_english: '' };
}

@Component({
  selector: 'app-voice-overs-tab',
  templateUrl: './voice-overs-tab.component.html',
  styleUrls: ['./voice-overs-tab.component.scss'],
  imports: [ButtonComponent, TextComponent, TextareaComponent, NumberComponent, FileComponent, AccordionComponent, AccordionItemComponent, TabsComponent, TabComponent, TextFieldContainerComponent],
})
export class VoiceOversTabComponent {
  voiceOvers = model<VoiceOverFormData[]>([]);
  pendingVoAudio = model<Record<string, File>>({});
  voiceOverTypes = model<string[]>([]);

  vosByType = computed(() => {
    const result: Record<string, { vo: VoiceOverFormData; index: number; displayTitle: string }[]> = {};
    this.voiceOvers().forEach((vo, index) => {
      if (!result[vo.type]) result[vo.type] = [];
      result[vo.type].push({ vo, index, displayTitle: '' });
    });
    for (const entries of Object.values(result)) {
      entries.sort((a, b) => a.vo.order - b.vo.order);
      const titleCounts = new Map<string, number>();
      for (const e of entries) {
        const title = e.vo.title_english || 'Untitled';
        titleCounts.set(title, (titleCounts.get(title) ?? 0) + 1);
      }
      for (const e of entries) {
        const title = e.vo.title_english || 'Untitled';
        const isDuplicate = titleCounts.get(title)! > 1;
        const text = isDuplicate && e.vo.text_english ? ` - ${e.vo.text_english.substring(0, 40)}${e.vo.text_english.length > 40 ? '...' : ''}` : '';
        e.displayTitle = title + text;
      }
    }
    return result;
  });

  onOrderChange(index: number, type: string, newOrder: number | string | null | undefined): void {
    const order = Number(newOrder);
    if (!order || isNaN(order)) return;
    const vos = this.voiceOvers();
    const oldOrder = vos[index].order;
    if (order === oldOrder) return;

    this.voiceOvers.update(list => {
      const updated = [...list];
      for (let i = 0; i < updated.length; i++) {
        if (updated[i].type !== type) continue;
        if (i === index) {
          updated[i] = { ...updated[i], order };
        } else if (oldOrder < order && updated[i].order > oldOrder && updated[i].order <= order) {
          updated[i] = { ...updated[i], order: updated[i].order - 1 };
        } else if (oldOrder > order && updated[i].order >= order && updated[i].order < oldOrder) {
          updated[i] = { ...updated[i], order: updated[i].order + 1 };
        }
      }
      return updated;
    });
  }

  addVoiceOver(type = 'story'): void {
    const typeCount = this.voiceOvers().filter(v => v.type === type).length;
    this.voiceOvers.update(v => [...v, { ...emptyVoiceOver(), order: typeCount + 1, type }]);
  }

  removeVoiceOver(i: number): void {
    const removed = this.voiceOvers()[i];
    this.voiceOvers.update(v => {
      const filtered = v.filter((_, idx) => idx !== i);
      // Re-sequence orders within the same type
      return filtered.map(vo => {
        if (vo.type === removed.type && vo.order > removed.order) {
          return { ...vo, order: vo.order - 1 };
        }
        return vo;
      });
    });
    // Clean up any pending audio for this index
    this.pendingVoAudio.update(f => {
      const updated = { ...f };
      for (const lang of ['english', 'japanese', 'chinese', 'korean']) {
        delete updated[`${i}_${lang}`];
      }
      return updated;
    });
  }

  onVoiceOverAudioSelect(i: number, lang: string, files: FileItemType[] | undefined | null): void {
    const file = files?.[0]?.file;
    if (!file) return;
    this.pendingVoAudio.update(f => ({ ...f, [`${i}_${lang}`]: file }));
  }
}
