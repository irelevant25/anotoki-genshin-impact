import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '../../../../shared/local-lib/i18n/translate.pipe';
import { QUIZ_CATALOG } from './shared/quiz-catalog';
import { GuideIconComponent } from '../../common/guide/guide-icon.component';

@Component({
  selector: 'app-quizzes',
  templateUrl: './quizzes.component.html',
  styleUrls: ['./quizzes.component.scss'],
  imports: [RouterModule, TranslatePipe, GuideIconComponent],
  providers: []
})
export class QuizzesComponent {
  // The same list the Daily page draws from, so a card looks the same wherever
  // it appears.
  readonly QUIZZES = QUIZ_CATALOG;
}
