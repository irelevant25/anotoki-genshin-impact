import { Component, computed, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LoaderComponent } from '../../../../shared/local-lib/components/loader/loader.component';
import { TranslatePipe } from '../../../../shared/local-lib/i18n/translate.pipe';
import { DailyStatus, dailyQuizzes, dailyStatus, todayString } from '../quizzes/shared/daily';
import { QuizProgressService } from '../quizzes/shared/quiz-progress.service';
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

  readonly loading = signal(true);
  readonly today = todayString();

  /** Bumped once the saved games are in, so the statuses recompute. */
  private readonly _progressLoaded = signal(false);

  readonly entries = computed<DailyEntry[]>(() => {
    this._progressLoaded();

    return dailyQuizzes(this.today)
      .map((id) => quizCard(id))
      .filter((card): card is QuizCard => !!card)
      .map((card) => ({ card, status: dailyStatus(this._progress.get(card.id, true), this.today) }));
  });

  readonly remaining = computed(() => this.entries().filter((entry) => entry.status !== 'won' && entry.status !== 'lost').length);
  readonly allDone = computed(() => this.entries().length > 0 && this.remaining() === 0);

  constructor() {
    // Signed in, the saved games come from the server, so the page waits for
    // them rather than drawing two untouched cards and correcting itself.
    this._progress.ready().subscribe({
      next: () => {
        this._progressLoaded.set(true);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
