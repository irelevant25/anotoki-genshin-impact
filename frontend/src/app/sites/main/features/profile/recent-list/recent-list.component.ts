import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BadgeComponent } from '@anotoki/lib/ui/badge';
import { IconComponent } from '@anotoki/lib/ui/icon';
import { TranslatePipe } from '@anotoki/lib/translations';
import { QuizRecentResult } from '../../../../../api';
import { AppDatePipe } from '../../../../../shared/local-lib/pipes/date.pipe';
import { MaterialIconDirective } from '../../../../admin/shared/material-icon.directive';
import { difficultyName } from '../../quizzes/shared/quiz.types';
import { cardFor, localToday, recentByDay } from '../profile-stats';

/**
 * The last finished questions on the Profile's History tab, newest first, in
 * groups of a day - today and yesterday by name, the rest by date - each row
 * the time, the quiz's picture, the character, whether it was won, at which
 * difficulty and in how many tries. The words that colour a result (Won, Lost)
 * come with a mark, so the colour is never the only thing that says it.
 */
@Component({
  selector: 'app-profile-recent-list',
  templateUrl: './recent-list.component.html',
  styleUrls: ['./recent-list.component.scss'],
  imports: [RouterLink, BadgeComponent, IconComponent, TranslatePipe, AppDatePipe, MaterialIconDirective],
})
export class ProfileRecentListComponent {
  readonly results = input.required<QuizRecentResult[]>();

  private readonly _today = localToday();

  readonly days = computed(() => recentByDay(this.results(), this._today));

  quizPicture(quiz: string): string | null {
    return cardFor(quiz)?.image ?? null;
  }

  quizTitle(quiz: string): string {
    return cardFor(quiz)?.title ?? quiz;
  }

  /** `quiz.difficulty.easy` and the rest, or the "before it was recorded" key. */
  difficultyLabel(difficulty: number | null): string {
    return difficulty === null ? 'profile.difficulty.unknown' : `quiz.difficulty.${difficultyName(difficulty)}`;
  }
}
