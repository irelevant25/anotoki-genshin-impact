import { Component, computed } from '@angular/core';
import { LoaderComponent } from '../../../../../shared/local-lib/components/loader/loader.component';
import { QuizAudioPlayerComponent } from '../shared/audio-player/audio-player.component';
import { CharacterQuizComponent } from '../shared/character-quiz.class';
import { QuizFrameComponent } from '../shared/quiz-frame/quiz-frame.component';
import { QuizId } from '../shared/quiz.types';

/**
 * Guess the character from their demo track.
 *
 * Each wrong guess buys a few more seconds: on easy five to start, up to
 * twenty and then the whole track, fewer on the harder levels (quiz-levels.ts),
 * and the whole piece once it is over.
 */
@Component({
  selector: 'app-quizzes-music',
  templateUrl: './music.component.html',
  styleUrls: ['./music.component.scss'],
  imports: [LoaderComponent, QuizAudioPlayerComponent, QuizFrameComponent],
})
export class QuizzesMusicComponent extends CharacterQuizComponent {
  protected readonly quizId: QuizId = 'music';

  /** Only a character with a demo track to play: `demo_music` is the track's path. */
  protected override canAsk(character: any): boolean {
    return !!character?.demo_music;
  }

  readonly trackUrl = computed(() => this.questionEntity()?.demo_music ?? '');

  /** Seconds the player may reveal. Undefined once it is over: play it all. */
  readonly limit = computed(() => (this.isQuestionComplete() ? undefined : this.currentEffect()?.data));

  constructor() {
    super();
    this.load();
  }
}
