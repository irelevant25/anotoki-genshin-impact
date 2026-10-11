import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '@anotoki/lib/translations';
import { QUIZ_CATALOG } from './shared/quiz-catalog';
import { GuideIconComponent } from '../../common/guide/guide-icon.component';
import { VisitorNoticeComponent } from '../../common/visitor-notice/visitor-notice.component';
import { VisitorKey } from '../../../../shared/local-lib/services/visitor-key.service';

@Component({
  selector: 'app-quizzes',
  templateUrl: './quizzes.component.html',
  styleUrls: ['./quizzes.component.scss'],
  imports: [RouterModule, TranslatePipe, GuideIconComponent, VisitorNoticeComponent],
  providers: []
})
export class QuizzesComponent {
  // The same list the Daily page draws from, so a card looks the same wherever
  // it appears.
  readonly QUIZZES = QUIZ_CATALOG;

  /** A visitor whose games the server keeps: the notice says for how long. */
  readonly visitorActive = inject(VisitorKey).active;
}
