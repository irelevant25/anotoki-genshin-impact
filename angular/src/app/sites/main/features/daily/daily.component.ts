import { Component, computed, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LoaderComponent } from '../../../../shared/local-lib/components/loader/loader.component';
import { TranslatePipe } from '../../../../shared/local-lib/i18n/translate.pipe';
import { DailyStatus, dailyQuizzes, dailyStatus, todayString } from '../quizzes/shared/daily';
import { QuizProgressService } from '../quizzes/shared/quiz-progress.service';
import { DailyProgressService } from '../quizzes/shared/daily-progress.service';
import { QuizCard, quizCard } from '../quizzes/shared/quiz-catalog';
import { GuideIconComponent } from '../../common/guide/guide-icon.component';

interface DailyEntry {
  card: QuizCard;
  status: DailyStatus;
}

/**
 * Two quizzes a day, and how they went.
 *
 * The old site put two buttons here and rendered the chosen quiz underneath.
 * These are the same cards the Quizzes page shows, so a quiz looks like itself
 * wherever it is met, with a mark added once it has been started or finished.
 */
@Component({
  selector: 'app-daily',
  templateUrl: './daily.component.html',
  styleUrls: ['./daily.component.scss'],
  imports: [RouterModule, TranslatePipe, LoaderComponent, GuideIconComponent],
})
export class DailyComponent {
  private readonly _progress = inject(QuizProgressService);
  private readonly _daily = inject(DailyProgressService);

  readonly loading = signal(true);
  readonly today = todayString();

  readonly entries = computed<DailyEntry[]>(() => {
    // Recomputes when a saved game changes, so answering the second question
    // and coming back shows it finished.
    this._progress.version();

    return dailyQuizzes(this.today)
      .map((id) => quizCard(id))
      .filter((card): card is QuizCard => !!card)
      .map((card) => ({ card, status: dailyStatus(this._progress.get(card.id, true), this.today) }));
  });

  // The same reckoning the count on the menu uses - two answers to "how many
  // left?" would eventually disagree.
  readonly remaining = this._daily.remaining;
  readonly allDone = computed(() => this.entries().length > 0 && this.remaining() === 0);

  constructor() {
    // Signed in, the saved games come from the server, so the page waits for
    // them rather than drawing two untouched cards and correcting itself.
    this._progress.ready().subscribe({
      next: () => this.loading.set(false),
      error: () => this.loading.set(false),
    });
  }
}
