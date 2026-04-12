import { Component, computed, model } from '@angular/core';
import { ButtonComponent } from '../../../../../../shared/local-lib/components/button/button.component';
import { TextComponent } from '../../../../../../shared/local-lib/components/text/text.component';
import { TextareaComponent } from '../../../../../../shared/local-lib/components/textarea/textarea.component';
import { FileComponent, FileItemType } from '../../../../../../shared/local-lib/components/file/file.component';
import { FieldContainerComponent } from '../../../../../../shared/local-lib/components/field-container/field-container.component';
import { VoiceOverWrapper } from '../../character-form.component';
import { VoiceOverFormData } from '../../../../services/admin-api.service';

type languages = 'english' | 'japanese' | 'chinese' | 'korean';

@Component({
  selector: 'app-voice-overs-tab-item',
  templateUrl: './tab.component.html',
  styleUrls: ['./tab.component.scss'],
  imports: [ButtonComponent, TextComponent, TextareaComponent, FileComponent, FieldContainerComponent],
})
export class VoiceOversTabItemComponent {
  entry = model.required<VoiceOverWrapper>();
  index = model.required<number>();
  language = model.required<languages>();
  audio = model.required<HTMLAudioElement | null>();
  playingKey = model.required<string | null>();
  titleKey = computed(() => {
    return `title_${this.language()}` as keyof VoiceOverFormData;
  });
  textKey = computed(() => {
    return `text_${this.language()}` as keyof VoiceOverFormData;
  });
  textReadingKey = computed(() => {
    return `text_${this.language()}_reading` as keyof VoiceOverFormData;
  });
  audioKey = computed(() => {
    return `audio_${this.language()}` as keyof VoiceOverFormData;
  });
  hasReading = computed(() => {
    return this.language() === 'chinese' || this.language() === 'korean' || this.language() === 'japanese';
  });

  // Audio playback state
  private _objectUrls = new Map<string, string>();

  ngOnDestroy(): void {
    this.stopAudio();
    for (const url of this._objectUrls.values()) {
      URL.revokeObjectURL(url);
    }
    this._objectUrls.clear();
  }

  onVoiceOverAudioSelect(files: FileItemType[] | undefined | null): void {
    const item = this.entry();
    if (!item) {
      return;
    }
    this.stopAudio();
    const file = files?.[0]?.file;
    switch (this.language()) {
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

  togglePlay(): void {
    const item = this.entry();
    const index = this.index();
    const lang = this.language();
    if (!item) {
      return;
    }
    const key = `${index}_${lang}`;
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
    this.audio.set(new Audio(audioData));
    this.playingKey.set(key);
    this.audio()?.addEventListener('ended', () => this.playingKey.set(null));
    this.audio()?.addEventListener('error', () => this.playingKey.set(null));
    this.audio()?.play();
  }

  stopAudio(): void {
    const audio = this.audio();
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      this.audio.set(null);
    }
    this.playingKey.set(null);
  }
}
