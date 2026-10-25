import { Component, computed, input, model, OnDestroy } from '@angular/core';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { TextFieldComponent } from '@anotoki/lib/ui/forms';
import { HtmlEditorComponent } from '@anotoki/lib/ui/html-editor';
import { EDITOR_FONTS, EDITOR_SWATCHES, RICH_TEXT_CLASSES } from '../../../../../../shared/rich-text';
import { FileComponent, FileItemType } from '../../../../../../shared/local-lib/components/file/file.component';
import { fieldText } from '../../../../../../shared/local-lib/fields/field-text';
import { AUDIO_EXTENSIONS, VoiceOverLanguage, VoiceOverWrapper } from '../../character-form.model';
import { VoiceOverFormData } from '../../../../../../sites/admin/shared/admin-form.model';

@Component({
  selector: 'app-voice-overs-tab-item',
  templateUrl: './tab.component.html',
  styleUrls: ['./tab.component.scss'],
  imports: [ButtonComponent, TextFieldComponent, HtmlEditorComponent, FileComponent],
})
export class VoiceOversTabItemComponent implements OnDestroy {
  entry = input.required<VoiceOverWrapper>();
  language = input.required<VoiceOverLanguage>();

  /** Owned by the parent tab so only one clip plays across the whole form. */
  audio = model.required<HTMLAudioElement | null>();
  playingKey = model.required<string | null>();

  readonly audioExtensions = AUDIO_EXTENSIONS;
  /** The text's editor (@anotoki/lib/ui/html-editor): the sizes, the fonts and the colours it always had, its HTML source, the guides' "tag". */
  readonly editorFonts = EDITOR_FONTS;
  readonly editorSwatches = EDITOR_SWATCHES;
  readonly richTextClasses = RICH_TEXT_CLASSES;

  titleKey = computed(() => `title_${this.language()}` as keyof VoiceOverFormData);
  textKey = computed(() => `text_${this.language()}` as keyof VoiceOverFormData);

  /** The line's title in this language, as its field shows it - read afresh, as typing writes it into the row. */
  titleText(): string {
    return fieldText(this.entry().data[this.titleKey()]);
  }

  onTitleChange(value: string): void {
    (this.entry().data as unknown as Record<string, unknown>)[this.titleKey()] = value;
  }

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
