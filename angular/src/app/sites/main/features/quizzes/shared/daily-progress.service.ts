import { Injectable, computed, inject } from '@angular/core';
import { QuizProgressService } from './quiz-progress.service';
import { SecurityService } from '../../../../../shared/local-lib/services/security.service';
import { dailyQuizzes, dailyStatus, todayString } from './daily';

/**
 * How much of today's daily is still to do.
 *
 * The Daily page worked this out for itself, which was fine while it was the
 * only thing that cared. The count on the menu has to say the same number from
 * anywhere on the site, so the reckoning moved here and the page reads it too -
 * two answers to "how many left?" would eventually disagree.
 *
 * It recomputes on its own: `version` changes whenever a saved game does, so
 * finishing the second daily turns the marker green without a reload.
 */
@Injectable({ providedIn: 'root' })
export class DailyProgressService {
  private readonly _progress = inject(QuizProgressService);

  /**
   * Recomputed each time rather than held.
   *
   * The day turns at 00:00 UTC and nothing here is listening for it, so reading
   * the date as part of the calculation is what stops a tab left open
   * overnight showing yesterday's two as finished.
   */
  readonly remaining = computed(() => {
    this._progress.version();
    const today = todayString();

    return dailyQuizzes(today).filter((id) => {
      const status = dailyStatus(this._progress.get(id, true), today);
      return status !== 'won' && status !== 'lost';
    }).length;
  });

  readonly allDone = computed(() => this.remaining() === 0);

  constructor() {
    // The count is shown on every page, so it cannot wait for the Daily page
    // to ask for the saved games. Signing in re-asks, because the games that
    // matter are then the account's rather than this browser's.
    inject(SecurityService).isLoggedIn$.subscribe(() => this._progress.ready().subscribe());
  }
}
