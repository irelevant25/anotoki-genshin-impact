import { Component, signal } from '@angular/core';
import { ButtonComponent } from '../../../../../shared/local-lib/components/button/button.component';
import { VoiceOverFormData } from '../../../services/admin-api.service';

function emptyVoiceOver(): VoiceOverFormData {
  return { order: 1, type: 'story', language: 'English', title: '', text: '' };
}

@Component({
  selector: 'app-voice-overs-tab',
  templateUrl: './voice-overs-tab.component.html',
  styleUrls: ['./voice-overs-tab.component.scss'],
  imports: [ButtonComponent],
})
export class VoiceOversTabComponent {
  voiceOvers = signal<VoiceOverFormData[]>([]);
  voTypesOpen = signal<Set<string>>(new Set());
  voLangsOpen = signal<Set<string>>(new Set());
  pendingVoAudio = signal<(File | null)[]>([]);
  voiceOverTypes = signal<string[]>([]);
  languages = signal<string[]>([]);

  vosByTypeLang(type: string, lang: string): { vo: VoiceOverFormData; index: number }[] {
    return this.voiceOvers()
      .map((vo, index) => ({ vo, index }))
      .filter(({ vo }) => vo.type === type && vo.language === lang);
  }

  toggleVoType(type: string): void {
    this.voTypesOpen.update(s => { const n = new Set(s); n.has(type) ? n.delete(type) : n.add(type); return n; });
  }
  toggleVoLang(type: string, lang: string): void {
    const key = `${type}:${lang}`;
    this.voLangsOpen.update(s => { const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }
  isVoTypeOpen(type: string): boolean { return this.voTypesOpen().has(type); }
  isVoLangOpen(type: string, lang: string): boolean { return this.voLangsOpen().has(`${type}:${lang}`); }

  addVoiceOver(type = 'story', language = 'English'): void {
    this.voiceOvers.update(v => [...v, { ...emptyVoiceOver(), order: v.length + 1, type, language }]);
    this.pendingVoAudio.update(f => [...f, null]);
  }
  removeVoiceOver(i: number): void {
    this.voiceOvers.update(v => v.filter((_, idx) => idx !== i));
    this.pendingVoAudio.update(f => f.filter((_, idx) => idx !== i));
  }
  setVoiceOver(i: number, field: keyof VoiceOverFormData, value: any): void {
    this.voiceOvers.update(v => v.map((vo, idx) => idx === i ? { ...vo, [field]: value } : vo));
  }
  onVoiceOverAudioSelect(i: number, event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.pendingVoAudio.update(f => f.map((x, idx) => idx === i ? file : x));
  }
}
