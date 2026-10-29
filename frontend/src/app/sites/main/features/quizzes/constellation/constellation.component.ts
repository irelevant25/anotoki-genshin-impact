import { Component } from '@angular/core';
import { LoaderComponent } from '../../../../../shared/local-lib/components/loader/loader.component';
import { MaterialIconDirective } from '../../../../admin/shared/material-icon.directive';
import { CharacterQuizComponent } from '../shared/character-quiz.class';
import { QuizFrameComponent } from '../shared/quiz-frame/quiz-frame.component';
import { QuizId } from '../shared/quiz.types';

/**
 * Guess the character from their constellation - the figure of stars drawn on
 * a sky in their element's colour.
 *
 * The picture is opaque, so it is never a silhouette: it is drawn in grey,
 * which hides the element, and cropped to its left half or quarter on the
 * first tries; easy ends in its own colours, hard in a misleading one
 * (quiz-levels.ts). The constellation's name comes with the answer.
 */
@Component({
  selector: 'app-quizzes-constellation',
  templateUrl: './constellation.component.html',
  styleUrls: ['./constellation.component.scss'],
  imports: [LoaderComponent, MaterialIconDirective, QuizFrameComponent],
})
export class QuizzesConstellationComponent extends CharacterQuizComponent {
  protected readonly quizId: QuizId = 'constellation';

  constructor() {
    super();
    this.load();
  }

  /** Manekin and Manekina have no constellation; a character without its picture cannot be asked. */
  protected override canAsk(character: any): boolean {
    return !!character?.constellation;
  }
}
