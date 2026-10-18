import { Component, computed, input, output, signal } from '@angular/core';
import { ComboboxComponent, ComboboxOption } from '@anotoki/lib/ui/combobox';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { TranslatePipe } from '@anotoki/lib/translations';
import { MaterialIconDirective, materialIconCandidates } from '../../../../../admin/shared/material-icon.directive';
import { DropdownOption } from '../../../../../../shared/local-lib/services/options-helper.service';

/**
 * Everything around the question in the five character quizzes: the difficulty
 * badge, the search box, the tries row, the next button and the answer.
 *
 * The question itself is projected, because that is the only part that differs -
 * a banner, a dish, a canvas, a player. On the old site this frame was copied
 * into all five templates, and drifted between them.
 */
@Component({
  selector: 'app-quiz-frame',
  templateUrl: './quiz-frame.component.html',
  styleUrls: ['./quiz-frame.component.scss'],
  imports: [ComboboxComponent, ButtonComponent, TranslatePipe, MaterialIconDirective],
})
export class QuizFrameComponent {
  readonly difficulty = input<string>('easy');
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

  /** A character chosen in the search box: a guess - and the box is empty again for the next. */
  choose(value: string | null): void {
    if (value === null) {
      return;
    }
    this.guess.emit(this.options().find((option) => String(option.key) === value));
    this.round.update((round) => round + 1);
  }
}
