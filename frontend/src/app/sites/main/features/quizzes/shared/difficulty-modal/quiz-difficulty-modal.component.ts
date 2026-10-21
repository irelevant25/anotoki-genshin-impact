import { Component, computed, inject, signal } from '@angular/core';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { ANOTOKI_DIALOG_DATA, DialogFooterDirective } from '@anotoki/lib/ui/dialog';
import { RadioGroupComponent, type RadioOption } from '@anotoki/lib/ui/forms';
import { TranslatePipe, TranslationService, type TranslationParams } from '@anotoki/lib/translations';
import { AbstractModalComponent } from '../../../../../../shared/local-lib/abstract-modal.class';
import { quizCard } from '../quiz-catalog';
import { levelWords } from '../quiz-levels';
import { QuizLevelsService } from '../quiz-levels.service';
import { QUIZ_DIFFICULTIES, QuizId, difficultyName } from '../quiz.types';

/** What the badge hands over when it opens this. */
export interface QuizDifficultyData {
  quizId: QuizId;
  /** The question's own level. */
  current: number;
  /** The level the next question is drawn at. */
  chosen: number;
  /** Whether the question on screen has begun - a guess made, or over: then it keeps its level. */
  started: boolean;
}

/**
 * A quiz's difficulties, one to choose: every level of the quiz with what it
 * shows (quiz-levels.ts, levelWords - the levels in force, their numbers
 * written as the reader's language writes them), the question's own marked,
 * and the one the next question is drawn at chosen. The kit's choices - a fieldset of
 * radios drawn as cards, the arrow keys moving the choice - in the kit's
 * dialog: the focus inside, Escape and the backdrop closing it, the focus back
 * on the badge afterwards.
 *
 * Choose closes it with the level, which the quiz keeps for this browser and
 * draws its next question at (CharacterQuizComponent.chooseDifficulty); a
 * question already begun keeps its own level, and the dialog says so before
 * the choice is made. Cancel, Escape or the backdrop change nothing.
 */
@Component({
  selector: 'app-quiz-difficulty-modal',
  templateUrl: './quiz-difficulty-modal.component.html',
  styleUrls: ['./quiz-difficulty-modal.component.scss'],
  imports: [ButtonComponent, DialogFooterDirective, RadioGroupComponent, TranslatePipe],
})
export class QuizDifficultyModalComponent extends AbstractModalComponent {
  private readonly _i18n = inject(TranslationService);
  private readonly _levels = inject(QuizLevelsService);
  private readonly _data = inject<QuizDifficultyData | null>(ANOTOKI_DIALOG_DATA, { optional: true }) ?? { quizId: 'banners', current: 1, chosen: 1, started: false };

  /** The level picked, as the radios hold it. */
  readonly selected = signal(String(this._data.chosen));

  /** What changes from level to level: what is shown, or - in mismatch, which has no tries - how many to choose from. */
  readonly intro = this._data.quizId === 'mismatch' ? 'quiz.difficulty.introMismatch' : 'quiz.difficulty.intro';

  readonly options = computed<RadioOption[]>(() =>
    QUIZ_DIFFICULTIES.map((difficulty) => {
      const name = this._levelName(difficulty);
      const words = levelWords(this._data.quizId, difficulty, this._levels.level(this._data.quizId, difficulty));
      return {
        value: String(difficulty),
        label: difficulty === this._data.current ? this._i18n.t('quiz.difficulty.current', { level: name }) : name,
        hint: this._i18n.t(words.key, this._numbers(words.params)),
      };
    }),
  );

  /** Said under the choices once another level is picked while the question on screen has begun: it keeps its own. */
  readonly stays = computed(() =>
    this._data.started && Number(this.selected()) !== this._data.current ? this._i18n.t('quiz.difficulty.fromNext', { level: this._levelName(this._data.current) }) : null,
  );

  constructor() {
    super();
    const title = quizCard(this._data.quizId)?.title;
    this.dialogHeading(() => this._i18n.t('quiz.difficulty.title', { quiz: title ? this._i18n.t(title) : '' }));
  }

  choose(): void {
    this.dialogRef?.close(Number(this.selected()));
  }

  private _levelName(difficulty: number): string {
    return this._i18n.t(`quiz.difficulty.${difficultyName(difficulty)}`);
  }

  /** A sentence's numbers as the reader's language writes them: half a second is 0.5 s in English, 0,5 s in Slovak. */
  private _numbers(params: TranslationParams | undefined): TranslationParams | undefined {
    if (!params) {
      return params;
    }
    const numbers = new Intl.NumberFormat(this._i18n.locale(), { maximumFractionDigits: 2 });
    return Object.fromEntries(Object.entries(params).map(([name, value]) => [name, typeof value === 'number' ? numbers.format(value) : value]));
  }
}
