import { Component, computed, inject, signal } from '@angular/core';
import { TranslatePipe, TranslationService } from '@anotoki/lib/translations';
import { decodeReferences } from '@anotoki/lib/ui/rich-html';
import { SegmentedComponent, SegmentedOption } from '@anotoki/lib/ui/segmented';
import { LoaderComponent } from '../../../../../shared/local-lib/components/loader/loader.component';
import { QuizAudioPlayerComponent } from '../shared/audio-player/audio-player.component';
import { CharacterQuizComponent } from '../shared/character-quiz.class';
import { QuizFrameComponent } from '../shared/quiz-frame/quiz-frame.component';
import { QuizId } from '../shared/quiz.types';
import { QuizApiService } from '../../../../../api';

/**
 * The languages a line is recorded in - its audio_* columns, the round's and the voice-over's alike - in the picker's
 * order, the character page's voice-over tab's.
 */
const VOICE_LANGUAGES = ['english', 'japanese', 'korean', 'chinese'] as const;

type VoiceLanguage = (typeof VOICE_LANGUAGES)[number];

/** Each language's code, as the picker shows it - as the character page's voice-over tab does. */
const LANGUAGE_CODES: Readonly<Record<VoiceLanguage, string>> = { english: 'EN', japanese: 'JA', korean: 'KO', chinese: 'ZH' };

/** A line's recordings by language, each null (or not sent) where it has none. */
type VoiceRecordings = Partial<Record<`audio_${VoiceLanguage}`, string | null>>;

/** A language as the quiz knows it: anything else - none chosen yet, a value it does not know - is English. */
function knownVoiceLanguage(value: unknown): VoiceLanguage {
  return VOICE_LANGUAGES.find((language) => language === value) ?? 'english';
}

/**
 * Guess the character from one of their voice lines.
 *
 * On easy it opens with half a line of text and no player at all. The next
 * guess shows the whole line, the one after that unlocks a half-second of
 * audio, and from there the recording plays in full. The harder levels start
 * from less of the line and give the recording a second or two at most
 * (quiz-levels.ts).
 *
 * The recording plays in the language chosen beside the player - English,
 * Japanese, Korean or Chinese - while the line's words and title stay English.
 *
 * Unlike the other four, the question is not drawn from the character list:
 * there are around eight thousand lines, so the server picks one. That is also
 * why this overrides the saved-game handling - a line cannot be recovered from
 * a character's name the way a banner or a dish can.
 */
@Component({
  selector: 'app-quizzes-voice',
  templateUrl: './voice.component.html',
  styleUrls: ['./voice.component.scss'],
  imports: [LoaderComponent, QuizAudioPlayerComponent, QuizFrameComponent, SegmentedComponent, TranslatePipe],
})
export class QuizzesVoiceComponent extends CharacterQuizComponent {
  protected readonly quizId: QuizId = 'voice';

  /** The line drawn: the round the server picked, or the whole voice-over when a saved question is taken up again. */
  readonly voiceOver = signal<any>(null);

  /**
   * The line as a question, without any markup - and without what the markup wraps: a dialogue
   * keeps its speakers as `<b>Ifa:</b>`, which would give the answer away. A `<br>` becomes a
   * space so the words on either side of it stay apart. The text is HTML (kept through the
   * family's allow-list, backend api/rich_text.php), so its character references are read as
   * the words they stand for: "Berry &amp; Mint" is "Berry & Mint".
   */
  readonly questionText = computed(() =>
    decodeReferences(((this.voiceOver()?.text_english as string | null | undefined) ?? '').replace(/<([a-z][a-z0-9]*)\b[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<[^>]*>/g, ' '))
      .replace(/\s+/g, ' ')
      .trim(),
  );

  /**
   * The language the recording plays in, chosen beside the player and kept in
   * this browser (StateService) - English until another is chosen. Only the
   * sound changes with it: the words shown are what the question is about.
   */
  readonly language = signal<VoiceLanguage>(knownVoiceLanguage(this.stateService.getVoiceLanguage()));

  /**
   * The picker's choices: each language by its code, so that the four fit one row on a phone (their names wrapped),
   * its name in the reader's language heard - with the code, as it is seen - and shown on hover.
   */
  readonly languageChoices = computed<SegmentedOption[]>(() =>
    VOICE_LANGUAGES.map((language) => {
      const name = this._i18n.t(`quiz.voice.languages.${language}`);
      return { value: language, label: LANGUAGE_CODES[language], name: `${name} (${LANGUAGE_CODES[language]})`, hint: name };
    }),
  );

  /** The chosen language's name, for the note under the picker. */
  readonly languageName = computed(() => this._i18n.t(`quiz.voice.languages.${this.language()}`));

  /** The line's recording in the language chosen; null where it has none. */
  private readonly _chosenRecording = computed(() => (this.voiceOver() as VoiceRecordings | null)?.[`audio_${this.language()}`] || null);

  /**
   * Whether the line has no recording in the language chosen - a few have not
   * all four - and plays the English one instead, which the page says under
   * the picker.
   */
  readonly languageMissing = computed(() => !!this.voiceOver() && this.language() !== 'english' && this._chosenRecording() === null);

  readonly audioUrl = computed(() => this._chosenRecording() ?? this.voiceOver()?.audio_english ?? '');

  /** Whether the player is on the page at all - it is not, for the first two tries. */
  readonly isAudioHidden = computed(() => this.effectClasses().includes('hidden-audio'));

  /** Seconds the player may reveal. Undefined once it is over: play it all. */
  readonly limit = computed(() => (this.isQuestionComplete() ? undefined : this.currentEffect()?.data));

  private readonly _quizApi = inject(QuizApiService);
  private readonly _i18n = inject(TranslationService);

  constructor() {
    super();
    this.load();
  }

  /**
   * A language chosen beside the player: the recording changes at once - from
   * its start, as any new clip does, within the seconds the question allows -
   * and the choice is kept for the questions after.
   */
  chooseLanguage(value: string): void {
    const language = knownVoiceLanguage(value);
    this.language.set(language);
    this.stateService.saveVoiceLanguage(language);
  }

  /**
   * The server has already excluded the travellers and the unanswerable lines.
   * The new question's level is taken as its line arrives: until then the
   * question on screen is still the last one, at its own.
   */
  protected override newQuestion(): void {
    this._quizApi.getRandomVoiceOverRound().subscribe({
      next: (voiceOver) => {
        this.drawLevel();
        this.voiceOver.set(voiceOver);
        this.questionEntity.set(this.characters().find((character) => character.name === voiceOver.character_name) ?? null);
        this.tries.set([]);
        this.isQuestionComplete.set(false);
        this.saveState();
      },
      // A failed draw leaves the previous question up rather than a blank page.
      error: () => this.loading.set(false),
    });
  }

  protected override restoreOrStart(): void {
    const saved = this.progress.get(this.quizId, this.isDaily());
    const character = saved?.questionEntity ? this.characters().find((x) => x.name === saved.questionEntity) : undefined;

    if (!saved?.voiceOverId || !character || !this.isForToday(saved) || !this.keepsItsLevel(saved)) {
      this.newQuestion();
      return;
    }

    // The line itself has to come back from the server; only its id was kept.
    this.characterApi.getCharacterVoiceOver(saved.voiceOverId).subscribe({
      next: (voiceOver) => {
        this.voiceOver.set(voiceOver);
        this.difficulty.set(saved.difficulty);
        this.questionEntity.set(character);
        this.tries.set(saved.tries.map((name) => this.characters().find((x) => x.name === name)).filter(Boolean));
        this.isQuestionComplete.set(saved.isQuestionComplete);
      },
      error: () => this.newQuestion(),
    });
  }

  protected override saveState(): void {
    // Everything the others write, plus the line that was drawn.
    this.progress.save(this.quizId, { ...this.buildState(), voiceOverId: this.voiceOver()?.id }, this.isDaily(), this.ticket);
  }
}
