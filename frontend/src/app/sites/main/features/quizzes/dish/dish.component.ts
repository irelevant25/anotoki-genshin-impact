import { Component } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { LoaderComponent } from '../../../../../shared/local-lib/components/loader/loader.component';
import { MaterialIconDirective } from '../../../../admin/shared/material-icon.directive';
import { CharacterQuizComponent } from '../shared/character-quiz.class';
import { QuizFrameComponent } from '../shared/quiz-frame/quiz-frame.component';
import { QuizId } from '../shared/quiz.types';

/**
 * Guess the character from the dish only they can cook.
 *
 * Hidden the same way as the banner quiz - cropped, blurred, grey - because the
 * two have the same levels (quiz-levels.ts), and a dish icon is small enough
 * that taking the colour out of it is already most of the puzzle.
 */
@Component({
  selector: 'app-quizzes-dish',
  templateUrl: './dish.component.html',
  styleUrls: ['./dish.component.scss'],
  imports: [LoaderComponent, MaterialIconDirective, QuizFrameComponent],
})
export class QuizzesDishComponent extends CharacterQuizComponent {
  protected readonly quizId: QuizId = 'dish';

  constructor() {
    super();
    this.load();
  }

  /** 89 of the 111 non-traveller characters have a dish. The rest cannot be asked. */
  protected override canAsk(character: any): boolean {
    return !!character?.dish;
  }

  /**
   * `characters.special_dish` is a food id, and the quiz shows the dish's own
   * picture: its normal icon, the path the foods list answers in `icon_normal` -
   * never a file named after the dish. A dish without one, or a deleted one (the
   * character page shows none), leaves its character out of the pool, as having
   * no dish does. The two lists are independent, so they are fetched together
   * and joined here rather than one after the other.
   */
  protected override fetchCharacters(): Observable<any[]> {
    return forkJoin({
      characters: this.lists.charactersMinimal(),
      foods: this.lists.foods(),
    }).pipe(
      map(({ characters, foods }) => {
        const foodsById = new Map(foods.filter((food) => !food.deleted && !!food.icon_normal).map((food) => [food.id, food]));
        // Most characters have no dish of their own, and `special_dish` is null
        // for them rather than absent.
        return characters.map((character) => ({
          ...character,
          dish: character.special_dish === null ? null : (foodsById.get(character.special_dish) ?? null),
        }));
      }),
    );
  }
}
