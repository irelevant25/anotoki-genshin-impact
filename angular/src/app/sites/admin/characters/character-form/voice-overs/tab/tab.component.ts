import { Component, computed, input, model, OnDestroy } from '@angular/core';
import { ButtonComponent } from '../../../../../../shared/local-lib/components/button/button.component';
import { TextComponent } from '../../../../../../shared/local-lib/components/text/text.component';
import { TextareaComponent } from '../../../../../../shared/local-lib/components/textarea/textarea.component';
import { FileComponent, FileItemType } from '../../../../../../shared/local-lib/components/file/file.component';
import { FieldContainerComponent } from '../../../../../../shared/local-lib/components/field-container/field-container.component';
import { AUDIO_EXTENSIONS, VoiceOverLanguage, VoiceOverWrapper } from '../../character-form.model';
import { VoiceOverFormData } from '../../../../services/admin-api.service';

@Component({
  selector: 'app-voice-overs-tab-item',
  templateUrl: './tab.component.html',
  styleUrls: ['./tab.component.scss'],
  imports: [ButtonComponent, TextComponent, TextareaComponent, FileComponent, FieldContainerComponent],
})
export class VoiceOversTabItemComponent implements OnDestroy {
  entry = input.required<VoiceOverWrapper>();
  language = input.required<VoiceOverLanguage>();

  /** Owned by the parent tab so only one clip plays across the whole form. */
  audio = model.required<HTMLAudioElement | null>();
  playingKey = model.required<string | null>();

  readonly audioExtensions = AUDIO_EXTENSIONS;

  titleKey = computed(() => `title_${this.language()}` as keyof VoiceOverFormData);
  textKey = computed(() => `text_${this.language()}` as keyof VoiceOverFormData);
  textReadingKey = computed(() => `text_${this.language()}_reading` as keyof VoiceOverFormData);
  hasReading = computed(() => this.language() !== 'english');

  /** Unique across the form, so play/stop never targets the wrong clip. */
  playbackKey = computed(() => `${this.entry().uid}_${this.language()}`);
  isPlaying = computed(() => this.playingKey() === this.playbackKey());

  /** Name of the picked file, or the path already stored on the voice over. */
  audioLabel = computed(() => {
    const entry = this.entry();
    return entry.audio[this.language()]?.name ?? (entry.data[`audio_${this.language()}`] as string | undefined);
  });

  private _objectUrl?: string;

  ngOnDestroy(): void {
    if (this.isPlaying()) {
      this.stopAudio();
    }
    this._revokeObjectUrl();
  }

  onAudioSelect(files: FileItemType[] | undefined | null): void {
    if (this.isPlaying()) {
      this.stopAudio();
    }
    this._revokeObjectUrl();

    const file = files?.[0]?.file;
    const entry = this.entry();
    if (file) {
      entry.audio[this.language()] = file;
    } else {
      delete entry.audio[this.language()];
    }
  }

  togglePlay(): void {
    if (this.isPlaying()) {
      this.stopAudio();
      return;
    }

    const source = this._audioSource();
    if (!source) {
      return;
    }

    const audio = new Audio(source);
    audio.addEventListener('ended', () => this.playingKey.set(null));
    audio.addEventListener('error', () => this.playingKey.set(null));
    this.audio.set(audio);
    this.playingKey.set(this.playbackKey());
    audio.play().catch(() => this.playingKey.set(null));
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

  private _audioSource(): string | undefined {
    const entry = this.entry();
    const file = entry.audio[this.language()];
    if (file) {
      this._revokeObjectUrl();
      this._objectUrl = URL.createObjectURL(file);
      return this._objectUrl;
    }
    return entry.data[`audio_${this.language()}`] as string | undefined;
  }

  private _revokeObjectUrl(): void {
    if (this._objectUrl) {
      URL.revokeObjectURL(this._objectUrl);
      this._objectUrl = undefined;
    }
  }
}
