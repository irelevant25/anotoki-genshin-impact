import { Component, computed, inject, input, signal } from '@angular/core';
import { TranslatePipe, TranslationService } from '@anotoki/lib/translations';
import { SegmentedComponent, SegmentedOption } from '@anotoki/lib/ui/segmented';
import { RichHtmlComponent } from '@anotoki/lib/ui/rich-html';
import { RICH_TEXT_CLASSES } from '../../../../../../../../shared/rich-text';
import { CharacterVoiceOver } from '../../../../../../../../api';

/** The four languages the voice-over columns are keyed by. */
const VOICE_LANGUAGES = [
  { code: 'en', column: 'english', name: 'English' },
  { code: 'ja', column: 'japanese', name: '日本語' },
  { code: 'ko', column: 'korean', name: '한국어' },
  { code: 'zh', column: 'chinese', name: '中文' },
] as const;

@Component({
  selector: 'app-character-voice-overs-tab',
  templateUrl: './voice-overs-tab.component.html',
  styleUrls: ['./voice-overs-tab.component.scss'],
  imports: [TranslatePipe, SegmentedComponent, RichHtmlComponent],
})
export class CharacterVoiceOversTabComponent {
  private readonly _i18n = inject(TranslationService);
  readonly richTextClasses = RICH_TEXT_CLASSES;

  voiceOvers = input<any[]>([]);

  language = signal<string>('en');
  type = signal<CharacterVoiceOver['type']>('story');

  /** The languages as the kit's segmented control takes them: the code shown, the language's own name heard. */
  readonly languageOptions: readonly SegmentedOption[] = VOICE_LANGUAGES.map((entry) => ({ value: entry.code, label: entry.code.toUpperCase(), name: entry.name, lang: entry.code }));
  /** Story and combat keep their own colours as marks, so the badge on a card and the choice are visibly the same thing. */
  readonly typeOptions = computed<SegmentedOption[]>(() => [
    { value: 'story', label: this._i18n.t('database.detail.story'), mark: 'var(--story-color)' },
    { value: 'combat', label: this._i18n.t('database.detail.combat'), mark: 'var(--combat-color)' },
  ]);

  pickType(value: string): void {
    this.type.set(value === 'combat' ? 'combat' : 'story');
  }

  lines = computed(() => {
    const column = VOICE_LANGUAGES.find((entry) => entry.code === this.language())?.column ?? 'english';
    return this.voiceOvers()
      .filter((line) => line.type === this.type())
      .map((line) => ({
        id: line.id,
        // A line may not be recorded in every language; English stands in so the
        // card still says what it is rather than showing an empty box.
        title: line[`title_${column}`] || line.title_english,
        text: line[`text_${column}`] || line.text_english,
        audio: line[`audio_${column}`] || null,
      }))
      .filter((line) => line.title || line.text);
  });
}
