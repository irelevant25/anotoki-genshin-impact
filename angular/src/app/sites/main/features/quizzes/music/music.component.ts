import { Component, computed } from '@angular/core';
import { LoaderComponent } from '../../../../../shared/local-lib/components/loader/loader.component';
import { QuizAudioPlayerComponent } from '../shared/audio-player/audio-player.component';
import { CharacterQuizComponent } from '../shared/character-quiz.class';
import { QuizFrameComponent } from '../shared/quiz-frame/quiz-frame.component';
import { QuizId } from '../shared/quiz.types';

/**
 * Guess the character from their demo track.
 *
 * Each wrong guess buys a few more seconds: five to start, up to twenty, and
 * the whole piece once it is over.
 */
@Component({
  selector: 'app-quizzes-music',
  templateUrl: './music.component.html',
  styleUrls: ['./music.component.scss'],
  imports: [LoaderComponent, QuizAudioPlayerComponent, QuizFrameComponent],
})
export class QuizzesMusicComponent extends CharacterQuizComponent {
  protected readonly quizId: QuizId = 'music';

  /** 72 of the 111 non-traveller characters have a demo track. */
  protected override canAsk(character: any): boolean {
    return !!character?.demo_music;
  }

  /**
   * The track is filed under the same upper-cased name as the portrait, and
   * `demo_music` holds the piece's title rather than a path.
   */
  readonly trackUrl = computed(() => {
    const character = this.questionEntity();
    return character ? `assets/character/demo_music/${character.icon_name ?? character.name}.mp3` : '';
  });

  /** Seconds the player may reveal. Undefined once it is over: play it all. */
  readonly limit = computed(() => (this.isQuestionComplete() ? undefined : this.currentEffect()?.data));

  constructor() {
    super();
    this.load();
  }
}
