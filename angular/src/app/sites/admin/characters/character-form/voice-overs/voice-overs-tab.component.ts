import { Component, computed, model, OnDestroy, signal } from '@angular/core';
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
import { FieldContainerComponent } from '../../../../../shared/local-lib/components/field-container/field-container.component';

function emptyVoiceOver(): VoiceOverFormData {
  return { order: 1, type: 'story', title_english: '' };
}

export interface VoiceOverWrapper {
  data: VoiceOverFormData;
  index: number;
  displayTitle: string;
  audio_english?: File;
  audio_japanese?: File;
  audio_chinese?: File;
  audio_korean?: File;
}

type languages = 'english' | 'japanese' | 'chinese' | 'korean';

@Component({
  selector: 'app-voice-overs-tab',
  templateUrl: './voice-overs-tab.component.html',
  styleUrls: ['./voice-overs-tab.component.scss'],
  imports: [ButtonComponent, TextComponent, TextareaComponent, NumberComponent, FileComponent, AccordionComponent, AccordionItemComponent, TabsComponent, TabComponent, FieldContainerComponent],
})
export class VoiceOversTabComponent implements OnDestroy {
  voiceOvers = model<VoiceOverFormData[]>([]);
  voiceOverTypes = model<string[]>([]);

  // Audio playback state
  private _audio: HTMLAudioElement | null = null;
  private _objectUrls = new Map<string, string>();
  playingKey = signal<string | null>(null);

  vosByType = computed(() => {
    const result: Record<string, VoiceOverWrapper[]> = {};
    this.voiceOvers().forEach((vo, index) => {
      if (!result[vo.type]) result[vo.type] = [];
      result[vo.type].push({ data: vo, index, displayTitle: '' });
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

  ngOnDestroy(): void {
    this.stopAudio();
    for (const url of this._objectUrls.values()) {
      URL.revokeObjectURL(url);
    }
    this._objectUrls.clear();
  }

  onOrderChange(item: VoiceOverFormData, newOrder: number | string | null | undefined): void {
    const order = Number(newOrder);
    if (!order || isNaN(order)) return;
    const oldOrder = item.order;
    if (order === oldOrder) return;

    this.voiceOvers.update(list => {
      const updated = [...list];
      for (let i = 0; i < updated.length; i++) {
        if (updated[i].type !== item.type) continue;
        if (updated[i] === item) {
          updated[i].order = order;
        } else if (oldOrder < order && updated[i].order > oldOrder && updated[i].order <= order) {
          updated[i].order = updated[i].order - 1;
        } else if (oldOrder > order && updated[i].order >= order && updated[i].order < oldOrder) {
          updated[i].order = updated[i].order + 1;
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
    this.stopAudio();
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
  }

  onVoiceOverAudioSelect(item: VoiceOverWrapper, lang: languages, files: FileItemType[] | undefined | null): void {
    this.stopAudio();
    const file = files?.[0]?.file;
    switch (lang) {
      case 'english':
        item.audio_english = file;
        item.data.audio_english = file?.name;
        break;
      case 'japanese':
        item.audio_japanese = file;
        item.data.audio_japanese = file?.name;
        break;
      case 'chinese':
        item.audio_chinese = file;
        item.data.audio_chinese = file?.name;
        break;
      case 'korean':
        item.audio_korean = file;
        item.data.audio_korean = file?.name;
        break;
    }
  }

  // ── Audio playback ──────────────────────────────────────────────────────────

  togglePlay(item: VoiceOverWrapper, lang: languages): void {
    const key = `${item.index}_${lang}`;
    if (this.playingKey() === key) {
      this.stopAudio();
      return;
    }
    this.stopAudio();
    const file = item[`audio_${lang}` as keyof VoiceOverWrapper] as File | undefined;
    const audioData = file ? URL.createObjectURL(file) : item.data[`audio_${lang}` as keyof VoiceOverFormData] as string | undefined;
    if (!audioData) {
      return;
    }
    this._audio = new Audio(audioData);
    this.playingKey.set(key);
    this._audio.addEventListener('ended', () => this.playingKey.set(null));
    this._audio.addEventListener('error', () => this.playingKey.set(null));
    this._audio.play();
  }

  stopAudio(): void {
    if (this._audio) {
      this._audio.pause();
      this._audio.currentTime = 0;
      this._audio = null;
    }
    this.playingKey.set(null);
  }
}
