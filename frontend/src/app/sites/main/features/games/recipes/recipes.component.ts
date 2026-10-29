import { Component, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { TranslatePipe, TranslationService } from '@anotoki/lib/translations';
import { LoaderComponent } from '../../../../../shared/local-lib/components/loader/loader.component';
import { MaterialIconDirective } from '../../../../admin/shared/material-icon.directive';
import { FocusOnShowDirective } from '../../quizzes/shared/focus-on-show.directive';
import { Expanded, Food, Material } from '../../../../../api';
import { pluralTail } from '../../database/shared/database-helpers';
import { GameListsService } from '../../../game-lists.service';
import { drawQuestions, foundCount, isAnswered, isIngredient, MAX_SCORE, questionPoints, RecipeDish, RecipeQuestion, recipeDishes, withPick } from './recipe-questions';

type FoodRow = Expanded<Food, 'created_by' | 'updated_by'>;
type MaterialRow = Expanded<Material, 'created_by' | 'updated_by'>;

/** How an option stands: picked and in the recipe, picked and not, or not picked. */
export type Mark = 'right' | 'wrong' | 'none';

/**
 * Recipe Master: ten dishes, and for each the player picks out its
 * ingredients from among three that are not (the owner's game of 2026-10-29).
 *
 * A pick is marked at once and for good - green and a tick in the recipe, red
 * and a cross not -, and a dish is over once all of its ingredients are
 * picked; what it scores is recipe-questions.ts's (3, less 2 a wrong pick).
 * After the tenth, a table: every dish, every option as it was left, each
 * dish's points and the score out of thirty.
 *
 * A game, not a quiz: nothing is saved or sent - the foods, their recipes and
 * the materials are the public site's lists (GameListsService), asked once a
 * page load.
 */
@Component({
  selector: 'app-games-recipes',
  templateUrl: './recipes.component.html',
  styleUrls: ['./recipes.component.scss'],
  imports: [ButtonComponent, LoaderComponent, TranslatePipe, MaterialIconDirective, FocusOnShowDirective],
})
export class GamesRecipesComponent {
  private readonly _lists = inject(GameListsService);
  private readonly _i18n = inject(TranslationService);

  readonly loading = signal(true);
  /** Every dish that can be asked, and every live material by id - an option's name and picture. */
  private readonly _dishes = signal<RecipeDish<FoodRow>[]>([]);
  private readonly _materials = signal<ReadonlyMap<number, MaterialRow>>(new Map());

  readonly questions = signal<RecipeQuestion<FoodRow>[]>([]);
  readonly index = signal(0);
  /** The table is up: the tenth dish was moved on from. */
  readonly finished = signal(false);

  readonly maxScore = MAX_SCORE;

  readonly question = computed(() => this.questions()[this.index()] ?? null);
  readonly answered = computed(() => {
    const question = this.question();
    return !!question && isAnswered(question);
  });
  readonly isLast = computed(() => this.index() >= this.questions().length - 1);

  /** The score so far: the dishes that are over. */
  readonly score = computed(() =>
    this.questions()
      .filter((question) => isAnswered(question))
      .reduce((sum, question) => sum + questionPoints(question), 0),
  );

  constructor() {
    forkJoin({ foods: this._lists.foods(), lines: this._lists.foodRecipes(), materials: this._lists.materials() }).subscribe({
      next: ({ foods, lines, materials }) => {
        const live = materials.filter((material) => !material.deleted);
        this._materials.set(new Map(live.map((material) => [material.id, material])));
        this._dishes.set(recipeDishes(foods, lines, new Set(live.map((material) => material.id))));
        this.newGame();
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  /** Ten dishes drawn afresh. */
  newGame(): void {
    this.questions.set(drawQuestions(this._dishes()));
    this.index.set(0);
    this.finished.set(false);
  }

  /** An option picked: marked for good, the dish over once its last ingredient is (withPick refuses any other). */
  pick(id: number): void {
    const index = this.index();
    this.questions.update((questions) => questions.map((question, at) => (at === index ? withPick(question, id) : question)));
  }

  /** The next dish - or, after the tenth, the table. */
  next(): void {
    if (this.isLast()) {
      this.finished.set(true);
    } else {
      this.index.update((index) => index + 1);
    }
  }

  material(id: number): MaterialRow | null {
    return this._materials().get(id) ?? null;
  }

  mark(question: RecipeQuestion<FoodRow>, id: number): Mark {
    return !question.picked.includes(id) ? 'none' : isIngredient(question, id) ? 'right' : 'wrong';
  }

  found(question: RecipeQuestion<FoodRow>): number {
    return foundCount(question);
  }

  points(question: RecipeQuestion<FoodRow>): number {
    return questionPoints(question);
  }

  /** Points as the page writes them, signed: +3, −1 (a minus, not a hyphen), 0. */
  signed(points: number): string {
    return points > 0 ? `+${points}` : points < 0 ? `−${Math.abs(points)}` : '0';
  }

  /** The counted word for `points` - one of its three forms, by the reader's language and the number's size. */
  pointsKey(points: number): string {
    return `game.recipes.points.${pluralTail(Math.abs(points), this._i18n.language())}`;
  }
}
