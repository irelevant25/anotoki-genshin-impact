import { Component, computed, signal } from '@angular/core';
import { LoaderComponent } from '../../../../../shared/local-lib/components/loader/loader.component';
import { QuizAudioPlayerComponent } from '../shared/audio-player/audio-player.component';
import { CharacterQuizComponent } from '../shared/character-quiz.class';
import { QuizFrameComponent } from '../shared/quiz-frame/quiz-frame.component';
import { QuizId, QuizState } from '../shared/quiz.types';

/**
 * Guess the character from one of their voice lines.
 *
 * It opens with half a line of text and no player at all. The next guess shows
 * the whole line, the one after that unlocks a half-second of audio, and from
 * there the recording plays in full.
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
  imports: [LoaderComponent, QuizAudioPlayerComponent, QuizFrameComponent],
})
export class QuizzesVoiceComponent extends CharacterQuizComponent {
  protected readonly quizId: QuizId = 'voice';

  readonly voiceOver = signal<any>(null);

  readonly questionText = computed(() => this.voiceOver()?.text_english ?? '');
  readonly audioUrl = computed(() => this.voiceOver()?.audio_english ?? '');

  /** Whether the player is on the page at all - it is not, for the first two tries. */
  readonly isAudioHidden = computed(() => this.effectClasses().includes('hidden-audio'));

  /** Seconds the player may reveal. Undefined once it is over: play it all. */
  readonly limit = computed(() => (this.isQuestionComplete() ? undefined : this.currentEffect()?.data));

  constructor() {
    super();
    this.load();
  }

  /** The server has already excluded the travellers and the unanswerable lines. */
  protected override newQuestion(): void {
    this.httpClient.get<any>('/api/quiz/voice-over/random').subscribe({
      next: (voiceOver) => {
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

    if (!saved?.voiceOverId || !character || !this.isForToday(saved)) {
      this.newQuestion();
      return;
    }

    // The line itself has to come back from the server; only its id was kept.
    this.httpClient.get<any>(`/api/characters-voice-overs/${saved.voiceOverId}`).subscribe({
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
    this.progress.save(this.quizId, { ...this.buildState(), voiceOverId: this.voiceOver()?.id }, this.isDaily());
  }
}
