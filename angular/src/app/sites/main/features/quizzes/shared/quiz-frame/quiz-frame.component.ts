import { Component, input, output } from '@angular/core';
import { AutocompleteComponent } from '../../../../../../shared/local-lib/components/autocomplete/autocomplete.component';
import { ButtonComponent } from '../../../../../../shared/local-lib/components/button/button.component';
import { TranslatePipe } from '../../../../../../shared/local-lib/i18n/translate.pipe';
import { MaterialIconDirective } from '../../../../../admin/shared/material-icon.directive';
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
  imports: [AutocompleteComponent, ButtonComponent, TranslatePipe, MaterialIconDirective],
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
}
