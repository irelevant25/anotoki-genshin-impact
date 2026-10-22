import { DecimalPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { IconComponent } from '@anotoki/lib/ui/icon';
import { ProgressBarComponent } from '@anotoki/lib/ui/progress';
import { TranslatePipe } from '@anotoki/lib/translations';
import { MaterialIconDirective } from '../../../../admin/shared/material-icon.directive';
import { difficultyName } from '../../quizzes/shared/quiz.types';
import { DifficultyBreakdown, QuizReport, isQuizId } from '../profile-stats';

/** One difficulty's bar on the card: its share of the quiz's busiest difficulty, so the three compare within the card. */
interface LevelBar {
  readonly entry: DifficultyBreakdown;
  readonly share: number;
  /** The translation key of its name. */
  readonly label: string;
  readonly key: string;
}

/**
 * One quiz on the Profile's Quizzes tab (the owner's choice "D" of 2026-10-22
 * among the mockups): its picture and title, how often the question was got
 * as a figure and a meter, how much was played, the three difficulties as
 * thin bars of how much was played at each with the win rate beside them, and
 * the character the player does best and worst against in this quiz alone.
 * A quiz never played says so and offers the way in.
 */
@Component({
  selector: 'app-profile-quiz-card',
  templateUrl: './quiz-card.component.html',
  styleUrls: ['./quiz-card.component.scss'],
  imports: [DecimalPipe, RouterLink, ButtonComponent, IconComponent, ProgressBarComponent, TranslatePipe, MaterialIconDirective],
})
export class ProfileQuizCardComponent {
  readonly report = input.required<QuizReport>();

  readonly played = computed(() => this.report().totals.played > 0);

  /** The quiz's own page, or null for a name the site cannot place. */
  readonly link = computed<string[] | null>(() => {
    const report = this.report();
    return report.card && isQuizId(report.id) ? ['/', 'quizzes', report.card.path] : null;
  });

  /** The title's key - or, for a quiz the catalog does not know, its bare name. */
  readonly title = computed(() => this.report().card?.title ?? this.report().id);

  readonly levels = computed<LevelBar[]>(() => {
    const entries = this.report().difficulties;
    const busiest = Math.max(1, ...entries.map((entry) => entry.totals.played));
    return entries.map((entry) => ({
      entry,
      share: (entry.totals.played / busiest) * 100,
      label: entry.difficulty === null ? 'profile.difficulty.unknown' : `quiz.difficulty.${difficultyName(entry.difficulty)}`,
      key: String(entry.difficulty),
    }));
  });
}
