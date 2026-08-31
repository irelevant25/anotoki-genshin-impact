import { Component, computed, input, signal } from '@angular/core';
import { TranslatePipe } from '../../../../../../../../shared/local-lib/i18n/translate.pipe';

/** The four languages the voice-over columns are keyed by. */
const VOICE_LANGUAGES = [
  { code: 'en', column: 'english' },
  { code: 'ja', column: 'japanese' },
  { code: 'ko', column: 'korean' },
  { code: 'zh', column: 'chinese' },
] as const;

@Component({
  selector: 'app-character-voice-overs-tab',
  templateUrl: './voice-overs-tab.component.html',
  styleUrls: ['./voice-overs-tab.component.scss'],
  imports: [TranslatePipe],
})
export class CharacterVoiceOversTabComponent {
  voiceOvers = input<any[]>([]);

  readonly languages = VOICE_LANGUAGES;
  language = signal<string>('en');
  type = signal<'story' | 'combat'>('story');

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
