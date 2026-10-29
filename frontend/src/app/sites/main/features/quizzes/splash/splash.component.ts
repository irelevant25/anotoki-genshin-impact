import { Component } from '@angular/core';
import { LoaderComponent } from '../../../../../shared/local-lib/components/loader/loader.component';
import { MaterialIconDirective } from '../../../../admin/shared/material-icon.directive';
import { CharacterQuizComponent } from '../shared/character-quiz.class';
import { QuizFrameComponent } from '../shared/quiz-frame/quiz-frame.component';
import { QuizId } from '../shared/quiz.types';

/**
 * Guess the character from the silhouette of their wish art.
 *
 * The art is drawn black on every try - its colours would name the character
 * at once - and only its outline is the clue, the splash's flames, water and
 * petals with it; the harder levels start from its left half or quarter
 * (quiz-levels.ts). The colours come with the answer, when nothing is hidden
 * any more.
 */
@Component({
  selector: 'app-quizzes-splash',
  templateUrl: './splash.component.html',
  styleUrls: ['./splash.component.scss'],
  imports: [LoaderComponent, MaterialIconDirective, QuizFrameComponent],
})
export class QuizzesSplashComponent extends CharacterQuizComponent {
  protected readonly quizId: QuizId = 'splash';

  constructor() {
    super();
    this.load();
  }

  /** Every character has wish art today; one without it could not be asked. */
  protected override canAsk(character: any): boolean {
    return !!character?.wish_icon;
  }
}
