import { Component, computed, input, model, OnDestroy } from '@angular/core';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { TextComponent } from '../../../../../../shared/local-lib/components/text/text.component';
import { HtmlEditorComponent } from '../../../../../../shared/local-lib/components/html-editor/html-editor.component';
import { FileComponent, FileItemType } from '../../../../../../shared/local-lib/components/file/file.component';
import { FieldContainerComponent } from '../../../../../../shared/local-lib/components/field-container/field-container.component';
import { AUDIO_EXTENSIONS, VoiceOverLanguage, VoiceOverWrapper } from '../../character-form.model';
import { VoiceOverFormData } from '../../../../../../sites/admin/shared/admin-form.model';

@Component({
  selector: 'app-voice-overs-tab-item',
  templateUrl: './tab.component.html',
  styleUrls: ['./tab.component.scss'],
  imports: [ButtonComponent, TextComponent, HtmlEditorComponent, FileComponent, FieldContainerComponent],
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

  /** The text as the HTML editor takes it - a string, where the form data's field union allows a number. */
  text = computed(() => (this.entry().data[this.textKey()] as string | null | undefined) ?? '');

  onTextChange(value: string | null | undefined): void {
    (this.entry().data as unknown as Record<string, unknown>)[this.textKey()] = value || null;
  }

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
