import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '../../../../shared/local-lib/i18n/translate.pipe';
import { QUIZ_CATALOG } from './shared/quiz-catalog';

@Component({
  selector: 'app-quizzes',
  templateUrl: './quizzes.component.html',
  styleUrls: ['./quizzes.component.scss'],
  imports: [RouterModule, TranslatePipe],
  providers: []
})
export class QuizzesComponent {
  // The same list the Daily page draws from, so a card looks the same wherever
  // it appears.
  readonly QUIZZES = QUIZ_CATALOG;
}
