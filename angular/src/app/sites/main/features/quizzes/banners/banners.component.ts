import { Component } from '@angular/core';
import { LoaderComponent } from '../../../../../shared/local-lib/components/loader/loader.component';
import { MaterialIconDirective } from '../../../../admin/shared/material-icon.directive';
import { CharacterQuizComponent } from '../shared/character-quiz.class';
import { QuizFrameComponent } from '../shared/quiz-frame/quiz-frame.component';
import { QuizId } from '../shared/quiz.types';

/**
 * Guess the character from their namecard banner.
 *
 * The banner is revealed in stages by CSS - cropped, blurred and drained of
 * colour on the first try, one of those lifted with each wrong guess. That is
 * how the old site did it and what the difficulty config describes: the levels
 * for this quiz name classes, not numbers.
 */
@Component({
  selector: 'app-quizzes-banners',
  templateUrl: './banners.component.html',
  styleUrls: ['./banners.component.scss'],
  imports: [LoaderComponent, MaterialIconDirective, QuizFrameComponent],
})
export class QuizzesBannersComponent extends CharacterQuizComponent {
  protected readonly quizId: QuizId = 'banners';

  constructor() {
    super();
    this.load();
  }
}
