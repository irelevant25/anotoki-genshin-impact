import { Component, computed, model } from '@angular/core';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { TextComponent } from '../../../../../shared/local-lib/components/text/text.component';
import { TextareaComponent } from '../../../../../shared/local-lib/components/textarea/textarea.component';
import { NumberComponent } from '../../../../../shared/local-lib/components/number/number.component';
import { CheckboxComponent } from '../../../../../shared/local-lib/components/checkbox/checkbox.component';
import { FileComponent, FileItemType } from '../../../../../shared/local-lib/components/file/file.component';
import { AccordionComponent } from '../../../../../shared/local-lib/components/accordion/accordion.component';
import { AccordionItemComponent } from '../../../../../shared/local-lib/components/accordion/item/item.component';
import { VoiceOverFormData } from '../../../services/admin-api.service';
import { TextFieldContainerComponent } from "../../../../../shared/local-lib/components/text-field-container/text-field-container.component";

function emptyVoiceOver(): VoiceOverFormData {
  return { order: 1, type: 'story', language: 'English', title: '', text: '' };
}

@Component({
  selector: 'app-voice-overs-tab',
  templateUrl: './voice-overs-tab.component.html',
  styleUrls: ['./voice-overs-tab.component.scss'],
  imports: [ButtonComponent, TextComponent, TextareaComponent, NumberComponent, CheckboxComponent, FileComponent, AccordionComponent, AccordionItemComponent, TextFieldContainerComponent],
})
export class VoiceOversTabComponent {
  voiceOvers = model<VoiceOverFormData[]>([]);
  pendingVoAudio = model<(File | null)[]>([]);
  voiceOverTypes = model<string[]>([]);
  languages = model<string[]>([]);

  private readonly _vosByTypeLangMap = computed(() => {
    const map = new Map<string, { vo: VoiceOverFormData; index: number }[]>();
    this.voiceOvers().forEach((vo, index) => {
      const key = `${vo.type}:${vo.language}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({ vo, index });
    });
    return map;
  });

  vosByTypeLang(type: string, lang: string): { vo: VoiceOverFormData; index: number }[] {
    return this._vosByTypeLangMap().get(`${type}:${lang}`) ?? [];
  }

  addVoiceOver(type = 'story', language = 'English'): void {
    this.voiceOvers.update(v => [...v, { ...emptyVoiceOver(), order: v.length + 1, type, language }]);
    this.pendingVoAudio.update(f => [...f, null]);
  }

  removeVoiceOver(i: number): void {
    this.voiceOvers.update(v => v.filter((_, idx) => idx !== i));
    this.pendingVoAudio.update(f => f.filter((_, idx) => idx !== i));
  }

  onVoiceOverAudioSelect(i: number, files: FileItemType[] | undefined | null): void {
    const file = files?.[0]?.file;
    if (!file) return;
    this.pendingVoAudio.update(f => f.map((x, idx) => idx === i ? file : x));
  }
}
