import { Component, computed, inject, input, output } from '@angular/core';
import { TranslatePipe, TranslationService } from '@anotoki/lib/translations';
import { AbstractModalComponent } from '../../../../../../shared/local-lib/abstract-modal.class';
import type { QuizDifficultyData } from '../difficulty-modal/quiz-difficulty-modal.component';
import { QuizId, difficultyName } from '../quiz.types';

/**
 * The badge on a quiz's top edge: the question's difficulty, in its colour.
 *
 * A button that opens the quiz's difficulty dialog (the owner's request of
 * 2026-10-19): every level of the quiz, what each one shows, the question's
 * own marked, and a choice for the questions drawn from then on - never for
 * one under way. While the next question is to be drawn at another level,
 * the line under the badge says which.
 *
 * In the daily run it is no button: the daily is the same for everybody, its
 * level too (DAILY_DIFFICULTY), and the line under the badge says so.
 */
@Component({
  selector: 'app-quiz-difficulty',
  templateUrl: './quiz-difficulty-badge.component.html',
  styleUrls: ['./quiz-difficulty-badge.component.scss'],
  imports: [TranslatePipe],
})
export class QuizDifficultyBadgeComponent extends AbstractModalComponent {
  readonly quizId = input.required<QuizId>();
  /** The question's own level: 1 easy, 2 medium, 3 hard. */
  readonly difficulty = input.required<number>();
  /** The level the next question is drawn at. */
  readonly chosen = input.required<number>();
  readonly isDaily = input(false);
  /** Whether the question on screen has begun - a guess made, or over: then it keeps its level. */
  readonly started = input(false);

  /** A level chosen in the dialog. */
  readonly choose = output<number>();

  private readonly _i18n = inject(TranslationService);

  /** easy, medium or hard: the badge's colour (`.level-*`, styles.scss) and its word's key. */
  readonly name = computed(() => difficultyName(this.difficulty()));

  /** What a screen reader says for the button: the word it shows, and what it is about. */
  readonly buttonName = computed(() => this._i18n.t('quiz.difficulty.button', { level: this._i18n.t(`quiz.difficulty.${this.name()}`) }));

  /** The line under the badge while the next question is to be drawn at another level. */
  readonly next = computed(() =>
    this.isDaily() || this.chosen() === this.difficulty() ? null : this._i18n.t('quiz.difficulty.next', { level: this._i18n.t(`quiz.difficulty.${difficultyName(this.chosen())}`) }),
  );

  /**
   * The dialog, loaded with the press: it brings the kit's choices
   * (@anotoki/lib/ui/forms), which nothing else on the public site draws. A
   * part of the site that could not be loaded - the network gone, a newer
   * build uploaded since this page loaded: nothing opens, and the badge is
   * there to press again.
   */
  open(): void {
    import('../difficulty-modal/quiz-difficulty-modal.component')
      .then((m) => {
        const data: QuizDifficultyData = { quizId: this.quizId(), current: this.difficulty(), chosen: this.chosen(), started: this.started() };
        // Narrow: the levels one under another, easy to hard, on every screen.
        const ref = this.openModal<number, QuizDifficultyData>(m.QuizDifficultyModalComponent, { size: 'sm', data });
        void ref.closed.then((level) => {
          if (typeof level === 'number') {
            this.choose.emit(level);
          }
        });
      })
      .catch((error: unknown) => console.error('This part of the site could not be loaded', error));
  }
}
