import { afterRenderEffect, Component, computed, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { ComboboxComponent, ComboboxOption } from '@anotoki/lib/ui/combobox';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { TranslatePipe } from '@anotoki/lib/translations';
import { MaterialIconDirective, materialIconCandidates } from '../../../../../admin/shared/material-icon.directive';
import { DropdownOption } from '../../../../../../shared/local-lib/services/options-helper.service';
import { QuizDifficultyBadgeComponent } from '../difficulty-badge/quiz-difficulty-badge.component';
import { FocusOnShowDirective, finePointer } from '../focus-on-show.directive';
import { QuizId } from '../quiz.types';

/**
 * Everything around the question in the five character quizzes: the difficulty
 * badge, the search box, the tries row, the next button and the answer.
 *
 * The question itself is projected, because that is the only part that differs -
 * a banner, a dish, a canvas, a player. On the old site this frame was copied
 * into all five templates, and drifted between them.
 *
 * It is played from the keyboard as well: a question starts with the focus in
 * the search box, and once it is over Enter moves on (FocusOnShowDirective).
 * On a touch screen only the box after a guess takes the focus, as it always
 * has: a question's first would open the keyboard over the question before it
 * was seen (finePointer()).
 */
@Component({
  selector: 'app-quiz-frame',
  templateUrl: './quiz-frame.component.html',
  styleUrls: ['./quiz-frame.component.scss'],
  imports: [ComboboxComponent, ButtonComponent, TranslatePipe, MaterialIconDirective, QuizDifficultyBadgeComponent, FocusOnShowDirective],
})
export class QuizFrameComponent {
  readonly quizId = input.required<QuizId>();
  /** The question's own level, and the one the next question is drawn at: 1 easy, 2 medium, 3 hard. */
  readonly difficulty = input<number>(1);
  readonly chosenDifficulty = input<number>(1);
  readonly isDaily = input<boolean>(false);
  readonly isQuestionComplete = input<boolean>(false);

  /** Every slot, filled or empty, so the guesses left can be seen at a glance. */
  readonly tries = input<(any | null)[]>([]);
  readonly triesCount = input<number>(0);
  readonly triesMax = input<number>(5);

  readonly options = input<DropdownOption[]>([]);

  /** The character to show once it is over, in their wish-banner art. */
  readonly answer = input<any>(null);

  readonly guess = output<DropdownOption | undefined>();
  readonly next = output<void>();
  /** A level chosen in the difficulty dialog. */
  readonly chooseDifficulty = output<number>();

  /** Whether the question has begun - a guess made, or over: then it keeps its level. */
  readonly started = computed(() => this.triesCount() > 0 || this.isQuestionComplete());

  /**
   * The search box's choices: each character by name, with their icon (the
   * converted copy in the asset tree, as the tries row draws it) - by name
   * alone, never by element or anything else a guess could be helped by. A
   * character with no icon file (`icon_name` null) has no picture: the kit
   * draws its picture as a plain image, so a guessed address that is not
   * there would show the browser's broken-picture mark, where the site's own
   * pictures (appMaterialIcon) hide themselves.
   */
  readonly choices = computed<ComboboxOption[]>(() =>
    this.options().map((option) => {
      const character = option.data as { name?: string; icon_name?: string | null } | undefined;
      return {
        value: String(option.key),
        label: String(character?.name ?? option.value),
        picture: character?.icon_name ? (materialIconCandidates(character.icon_name, 'character.icon')[0] ?? null) : null,
      };
    }),
  );

  /** One guess after another: the field is made anew for each (empty, the focus in it). */
  readonly round = signal(0);

  /** The search box on the page: a new one for each guess, none once the question is over. */
  private readonly _search = viewChild(ComboboxComponent, { read: ElementRef });

  constructor() {
    // Each search box takes the focus as it is drawn - a question's first, and
    // the next after every guess - so that typing goes into it at once. Where
    // the pointer is fine, without scrolling: the kit's `autofocus` focuses as
    // the browser does, scrolling a box below the fold of a short window into
    // view and the question off the top of it; left where it is, the box comes
    // into view by itself once somebody types in it. On a touch screen only
    // the box after a guess, as the kit's autofocus did it.
    let seen: HTMLElement | null = null;
    afterRenderEffect({
      write: () => {
        const host: HTMLElement | undefined = this._search()?.nativeElement;
        const field = host?.querySelector<HTMLInputElement>('input[role="combobox"]') ?? null;
        const afterGuess = this.round() > 0;
        if (field === seen) {
          return;
        }
        seen = field;
        if (field && finePointer()) {
          field.focus({ preventScroll: true });
        } else if (field && afterGuess) {
          field.focus();
        }
      },
    });
  }

  /** A character chosen in the search box: a guess - and the box is empty again for the next. */
  choose(value: string | null): void {
    if (value === null) {
      return;
    }
    this.guess.emit(this.options().find((option) => String(option.key) === value));
    this.round.update((round) => round + 1);
  }
}
